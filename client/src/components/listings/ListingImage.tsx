import type { ArtKind } from '../../types';
import ProductArt from '../common/ProductArt';
import styles from './ListingImage.module.css';

interface Props {
  title: string;
  imageUrl?: string;
  art: ArtKind;
}

/** Real photo when there is one, otherwise the built-in illustration (empty state). */
export default function ListingImage({ title, imageUrl, art }: Props) {
  return (
    <div className={styles.frame}>
      {imageUrl ? (
        <img src={imageUrl} alt={title} loading="lazy" className={styles.photo} />
      ) : (
        <ProductArt kind={art} label={`${title} (illustration)`} className={styles.art} />
      )}
    </div>
  );
}
