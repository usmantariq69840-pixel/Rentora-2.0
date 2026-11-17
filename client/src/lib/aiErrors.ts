import { ApiError } from './api';
import type { AiErrorCode, AiTestResult } from '../types';

export interface AiProblem {
  code: AiErrorCode | 'unknown';
  message: string;
  /** The fix is to add or replace the API key */
  needsKey: boolean;
}

/** Turns any thrown error from an AI request into one friendly object the UI can show. */
export function toAiProblem(err: unknown): AiProblem {
  if (err instanceof ApiError) {
    const code = (err.code as AiErrorCode | undefined) ?? 'unknown';
    return { code, message: err.message, needsKey: code === 'not_configured' || code === 'invalid_key' };
  }
  // fetch() itself failed: the API is not running or the network is down
  return { code: 'offline', message: 'We couldn’t reach the server. Check that it is running, then try again.', needsKey: false };
}

/** After saving a key, only these results mean the key itself is wrong. Offline or rate-limited just means "couldn't check". */
export const keyRejected = (test: AiTestResult) => !test.ok && (test.code === 'invalid_key' || test.code === 'model_not_found');
