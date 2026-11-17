import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { AiError, testConnection } from '../services/ai/gemini.js';
import { deleteGeminiKey, getAiSettingsView, saveGeminiKey, saveGeminiModel } from '../services/settings/settingsService.js';
import { aiSettingsSchema } from '../validation/ai.js';

const router = Router();
router.use(requireAdmin); // the backend enforces this itself; the React page is only a convenience

// GET /api/settings/ai — status with a masked key. The real key is never sent to the browser.
router.get('/ai', (_req, res) => {
  res.json(getAiSettingsView());
});

// PUT /api/settings/ai — save or replace the key and/or choose the model
router.put('/ai', (req, res) => {
  const { apiKey, model } = aiSettingsSchema.parse(req.body);
  if (apiKey) saveGeminiKey(apiKey, req.user!.id);
  if (model) saveGeminiModel(model, req.user!.id);
  res.json(getAiSettingsView());
});

// DELETE /api/settings/ai — remove the saved key (a key in server/.env, if any, is then used instead)
router.delete('/ai', (_req, res) => {
  deleteGeminiKey();
  res.json(getAiSettingsView());
});

// POST /api/settings/ai/test — one tiny request to Gemini. Always answers 200 so the page can show the result.
router.post('/ai/test', async (_req, res) => {
  try {
    const result = await testConnection();
    res.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof AiError) return res.json({ ok: false, code: err.code, message: err.message });
    throw err;
  }
});

export default router;
