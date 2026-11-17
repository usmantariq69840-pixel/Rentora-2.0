import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

/** Error with an HTTP status that is safe to show to the client. */
export interface FieldError {
  path: string;
  message: string;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Optional per-field messages so forms can highlight the right input */
    public fields?: FieldError[],
    /** Optional machine-readable reason (for example 'not_configured') so the UI can react */
    public code?: string,
  ) {
    super(message);
  }
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Route not found' });
}

// Express recognises error handlers by their four-argument signature.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res
      .status(err.status)
      .json({ error: err.message, ...(err.fields ? { fields: err.fields } : {}), ...(err.code ? { code: err.code } : {}) });
  }
  // Upload limits from multer (file too large, too many files, unexpected field)
  if (err instanceof Error && err.name === 'MulterError') {
    const code = (err as Error & { code?: string }).code;
    if (code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Each photo must be 5 MB or smaller.' });
    if (code === 'LIMIT_FILE_COUNT' || code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ error: 'You can upload up to 6 photos.' });
    return res.status(400).json({ error: 'That upload could not be read. Please try again.' });
  }
  // Malformed JSON in a request body
  if (err instanceof SyntaxError && (err as { status?: number }).status === 400) {
    return res.status(400).json({ error: 'The request could not be read. Please try again.' });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Please check the highlighted fields.',
      // One message per field (the first problem) keeps forms readable.
      fields: err.issues
        .map((i) => ({ path: i.path.join('.'), message: i.message }))
        .filter((f, index, all) => all.findIndex((x) => x.path === f.path) === index),
    });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
}
