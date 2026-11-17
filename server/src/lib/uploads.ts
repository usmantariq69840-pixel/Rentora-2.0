import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { HttpError } from '../middleware/errorHandler.js';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES_PER_LISTING = 6;

/** server/uploads/ — served at /uploads. Resolves the same way from src/ (tsx) and dist/ (tsc). */
export const uploadsRoot = path.resolve(import.meta.dirname, '../../uploads');
const listingDir = path.join(uploadsRoot, 'listings');

/** Files are held in memory, checked, and only then written to disk. Rejected files never touch the disk. */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: MAX_IMAGES_PER_LISTING, fields: 20, fieldSize: 200 * 1024 },
});

export interface DetectedImage { ext: 'jpg' | 'png' | 'webp'; mime: 'image/jpeg' | 'image/png' | 'image/webp' }

/** Decides the type from the file's first bytes. The browser-supplied name and MIME type are not trusted. */
export function sniffImage(buf: Buffer): DetectedImage | null {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
  if (buf.length > 12 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: 'png', mime: 'image/png' };
  if (buf.length > 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return { ext: 'webp', mime: 'image/webp' };
  return null;
}

/** Throws a friendly 400 if any file is not a real JPEG, PNG or WebP. */
export function assertImages(files: Express.Multer.File[]): DetectedImage[] {
  return files.map((f) => {
    const detected = sniffImage(f.buffer);
    if (!detected) throw new HttpError(400, `“${f.originalname.slice(0, 60)}” isn’t a JPEG, PNG or WebP photo.`);
    return detected;
  });
}

/** Writes already-checked images to disk with random names and returns their paths relative to /uploads. */
export function saveImages(files: Express.Multer.File[], detected: DetectedImage[]): string[] {
  fs.mkdirSync(listingDir, { recursive: true });
  const saved: string[] = [];
  try {
    files.forEach((file, i) => {
      const name = `${Date.now().toString(36)}-${randomBytes(8).toString('hex')}.${detected[i].ext}`;
      fs.writeFileSync(path.join(listingDir, name), file.buffer, { flag: 'wx' });
      saved.push(`listings/${name}`);
    });
  } catch (err) {
    removeImageFiles(saved);
    throw err;
  }
  return saved;
}

export function removeImageFiles(relativePaths: string[]) {
  for (const rel of relativePaths) {
    const full = path.resolve(uploadsRoot, rel);
    if (!full.startsWith(uploadsRoot + path.sep)) continue; // never delete outside the uploads folder
    fs.rmSync(full, { force: true });
  }
}
