import { Link } from 'react-router-dom';
import styles from './Logo.module.css';

interface LogoMarkProps {
  size?: number;
  /** 'dark' = navy letter (for light backgrounds), 'light' = white letter (for navy backgrounds) */
  tone?: 'dark' | 'light';
}

export function LogoMark({ size = 36, tone = 'dark' }: LogoMarkProps) {
  const letter = tone === 'dark' ? '#172554' : '#ffffff';
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className={styles.mark}>
      <path d="M8 40 17 8h7L15 40Z" fill="#14B8A6" />
      <path
        d="M21 8h11c6 0 10 3.6 10 8.7 0 4.2-2.8 7.2-7.3 8L44 40h-9l-6.8-13.2h-3.4L26.8 20H32c2 0 3.2-.9 3.2-2.3 0-1.4-1.2-2.2-3.2-2.2h-9.5Z"
        fill={letter}
      />
    </svg>
  );
}

interface LogoProps extends LogoMarkProps {
  asLink?: boolean;
  hideText?: boolean;
}

export default function Logo({ size = 36, tone = 'dark', asLink = true, hideText = false }: LogoProps) {
  const content = (
    <>
      <LogoMark size={size} tone={tone} />
      {!hideText && (
        <span className={`${styles.word} ${tone === 'light' ? styles.light : ''}`}>Rentora</span>
      )}
    </>
  );

  if (!asLink) return <span className={styles.logo}>{content}</span>;
  return (
    <Link to="/" className={styles.logo} aria-label="Rentora home">
      {content}
    </Link>
  );
}
