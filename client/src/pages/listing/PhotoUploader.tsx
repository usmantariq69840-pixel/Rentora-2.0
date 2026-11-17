import { ImagePlus, Star, X } from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';
import type { Photo } from './wizardModel';
import { MAX_PHOTO_BYTES, MAX_PHOTOS, PHOTO_TYPES } from './wizardModel';
import styles from './Photos.module.css';

interface Props {
  photos: Photo[];
  coverKey: string | null;
  onAdd: (files: File[]) => void;
  onRemove: (key: string) => void;
  onCover: (key: string) => void;
}

const sizeLabel = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/** Drop zone + previews. Checks type, size and count in the browser; the server checks them again. */
export default function PhotoUploader({ photos, coverKey, onAdd, onRemove, onCover }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const full = photos.length >= MAX_PHOTOS;

  const accept = (list: FileList | File[]) => {
    const found: string[] = [];
    const good: File[] = [];
    let room = MAX_PHOTOS - photos.length;
    for (const file of Array.from(list)) {
      const duplicate = photos.some((p) => p.file && p.file.name === file.name && p.file.size === file.size && p.file.lastModified === file.lastModified);
      if (duplicate || good.some((g) => g.name === file.name && g.size === file.size)) found.push(`“${file.name}” is already added.`);
      else if (!PHOTO_TYPES.includes(file.type)) found.push(`“${file.name}” isn’t a JPEG, PNG or WebP photo.`);
      else if (file.size > MAX_PHOTO_BYTES) found.push(`“${file.name}” is ${sizeLabel(file.size)}. Each photo must be 5 MB or smaller.`);
      else if (room <= 0) found.push(`“${file.name}” wasn’t added because a listing can have up to ${MAX_PHOTOS} photos.`);
      else { good.push(file); room--; }
    }
    setProblems(found);
    if (good.length) onAdd(good);
    if (input.current) input.current.value = ''; // lets the same file be chosen again after removing it
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    if (!full) accept(e.dataTransfer.files);
  };

  return (
    <div>
      <div
        className={`${styles.zone} ${over ? styles.over : ''} ${full ? styles.full : ''}`}
        onDragOver={(e) => { e.preventDefault(); if (!full) setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <span className={styles.zoneIcon}><ImagePlus size={26} aria-hidden /></span>
        <p className={styles.zoneTitle}>{full ? `You’ve added the maximum of ${MAX_PHOTOS} photos` : 'Drag photos here or choose from your device'}</p>
        <p className={styles.zoneHint}>JPEG, PNG or WebP · up to 5 MB each · up to {MAX_PHOTOS} photos</p>
        <button type="button" className={styles.choose} onClick={() => input.current?.click()} disabled={full}>
          Choose photos
        </button>
        <input
          ref={input}
          type="file"
          accept={PHOTO_TYPES.join(',')}
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-label="Choose listing photos"
          onChange={(e) => e.target.files && accept(e.target.files)}
        />
      </div>

      {problems.length > 0 && (
        <ul className={styles.problems} role="alert">
          {problems.map((p) => <li key={p}>{p}</li>)}
        </ul>
      )}

      {photos.length > 0 && (
        <>
          <p className={styles.count}>{photos.length} of {MAX_PHOTOS} photos · the cover photo is shown first</p>
          <ul className={styles.grid}>
            {photos.map((p, i) => {
              const isCover = p.key === coverKey;
              return (
                <li key={p.key} className={`${styles.tile} ${isCover ? styles.cover : ''}`} style={{ animationDelay: `${Math.min(i, 5) * 50}ms` }}>
                  <img src={p.url} alt={`Photo ${i + 1}${isCover ? ' (cover)' : ''}`} />
                  {isCover && <span className={styles.coverBadge}><Star size={12} fill="currentColor" aria-hidden /> Cover</span>}
                  <div className={styles.tools}>
                    {!isCover && (
                      <button type="button" onClick={() => onCover(p.key)} aria-label={`Make photo ${i + 1} the cover`} title="Make cover">
                        <Star size={16} aria-hidden />
                      </button>
                    )}
                    <button type="button" onClick={() => onRemove(p.key)} aria-label={`Remove photo ${i + 1}`} title="Remove">
                      <X size={16} aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
