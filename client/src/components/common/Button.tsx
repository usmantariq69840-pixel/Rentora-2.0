import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import styles from './Button.module.css';

type Variant = 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'light';
type Size = 'sm' | 'md' | 'lg';

interface Shared {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

function classes({ variant = 'primary', size = 'md', fullWidth }: Shared, extra?: string) {
  return [styles.btn, styles[variant], styles[size], fullWidth ? styles.full : '', extra ?? '']
    .filter(Boolean)
    .join(' ');
}

interface ButtonProps extends Shared, ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

/** Primary / secondary / outline / danger button with loading + disabled states. */
export default function Button({
  variant,
  size,
  fullWidth,
  iconLeft,
  iconRight,
  loading = false,
  disabled,
  children,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classes({ variant, size, fullWidth }, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className={styles.spinner} size={18} aria-hidden /> : iconLeft}
      <span>{children}</span>
      {!loading && iconRight}
    </button>
  );
}

interface ButtonLinkProps extends Shared, Omit<LinkProps, 'className'> {
  className?: string;
}

/** Same look as <Button>, but renders a router link. */
export function ButtonLink({
  variant,
  size,
  fullWidth,
  iconLeft,
  iconRight,
  children,
  className,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={classes({ variant, size, fullWidth }, className)} {...rest}>
      {iconLeft}
      <span>{children}</span>
      {iconRight}
    </Link>
  );
}
