import { config } from '../../config.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { getActiveGeminiKey, getGeminiModel } from '../settings/settingsService.js';

export type AiErrorCode =
  | 'not_configured' // no API key saved yet
  | 'invalid_key'
  | 'rate_limited'
  | 'timeout'
  | 'offline'
  | 'unavailable'
  | 'model_not_found'
  | 'blocked'
  | 'bad_output'
  | 'bad_request';

const STATUS: Record<AiErrorCode, number> = {
  not_configured: 503,
  invalid_key: 502,
  rate_limited: 429,
  timeout: 504,
  offline: 503,
  unavailable: 503,
  model_not_found: 502,
  blocked: 422,
  bad_output: 502,
  bad_request: 502,
};

/** An AI problem with a friendly message. The message never contains the API key. */
export class AiError extends HttpError {
  constructor(public override code: AiErrorCode, message: string) {
    super(STATUS[code], message, undefined, code);
  }
}

export type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };

interface GenerateOptions {
  system: string;
  parts: GeminiPart[];
  temperature?: number;
  timeoutMs?: number;
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  error?: { code?: number; message?: string; status?: string };
}

function mapHttpError(status: number, body: GeminiResponse): AiError {
  const message = body.error?.message ?? '';
  if (status === 429) return new AiError('rate_limited', 'Gemini is limiting requests for this API key right now (free keys have low limits). Wait a minute and try again.');
  if (status === 401 || status === 403 || (status === 400 && /api key not valid|API_KEY_INVALID|api key expired/i.test(message))) {
    return new AiError('invalid_key', 'Gemini did not accept the API key. Check it in AI settings and save a valid key.');
  }
  if (status === 404) return new AiError('model_not_found', 'Gemini could not find the selected model. Choose another model in AI settings.');
  if (status >= 500) return new AiError('unavailable', 'Gemini is temporarily unavailable. Please try again in a moment.');
  return new AiError('bad_request', 'Gemini could not process that request. Please try again.');
}

async function post(url: string, key: string, body: unknown, timeoutMs: number): Promise<{ status: number; json: GeminiResponse }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const json = (await res.json().catch(() => ({}))) as GeminiResponse;
    return { status: res.status, json };
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    if (name === 'TimeoutError' || name === 'AbortError') {
      throw new AiError('timeout', 'Gemini took too long to answer. Your details are safe, so please try again.');
    }
    throw new AiError('offline', 'Could not reach Gemini. Check your internet connection and try again.');
  }
}

/** Models sometimes wrap JSON in ```fences```; strip them before parsing. */
function parseJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* fall through */ }
    }
    throw new AiError('bad_output', 'The AI answered in a format we could not use. Please try again.');
  }
}

/**
 * Sends one request to the Gemini REST API and returns the parsed JSON answer.
 * Runs only on the backend, so the key is never exposed to the browser.
 */
export async function generateJson({ system, parts, temperature = 0.2, timeoutMs = 30_000 }: GenerateOptions) {
  const active = getActiveGeminiKey();
  if (!active) throw new AiError('not_configured', 'AI needs a Gemini API key. Add one in AI settings to turn it on.');

  const model = getGeminiModel();
  const url = `${config.geminiBaseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts }],
    generationConfig: { temperature, responseMimeType: 'application/json', maxOutputTokens: 8192 },
  };

  const started = Date.now();
  let { status, json } = await post(url, active.key, body, timeoutMs);

  // If this model rejects JSON mode, ask again and rely on the prompt + our own validation instead.
  if (status === 400 && /responseMimeType|response_mime_type|JSON mode|Unknown name/i.test(json.error?.message ?? '')) {
    const { generationConfig: _drop, ...plain } = body;
    ({ status, json } = await post(url, active.key, { ...plain, generationConfig: { temperature, maxOutputTokens: 8192 } }, timeoutMs));
  }
  if (status >= 400) throw mapHttpError(status, json);

  if (json.promptFeedback?.blockReason) {
    throw new AiError('blocked', 'Gemini declined to process that content. Try a different photo or wording.');
  }
  const candidate = json.candidates?.[0];
  if (candidate?.finishReason === 'SAFETY' || candidate?.finishReason === 'PROHIBITED_CONTENT') {
    throw new AiError('blocked', 'Gemini declined to process that content. Try a different photo or wording.');
  }
  const text = (candidate?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? '').join('');
  if (!text.trim()) throw new AiError('bad_output', 'The AI returned an empty answer. Please try again.');

  return { data: parseJson(text), model, ms: Date.now() - started };
}

/** Used by the "Test connection" button. Costs a few tokens. */
export async function testConnection() {
  const { model, ms } = await generateJson({
    system: 'You reply with JSON only.',
    parts: [{ text: 'Return exactly {"ok": true}' }],
    temperature: 0,
    timeoutMs: 20_000,
  });
  return { model, latencyMs: ms };
}
