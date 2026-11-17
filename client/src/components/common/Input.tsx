import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import styles from './Input.module.css';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  /** Small element shown beside the label, e.g. an "AI suggestion" chip */
  labelAddon?: ReactNode;
}

function Field({
  id,
  label,
  hint,
  error,
  labelAddon,
  children,
}: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {labelAddon}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = FieldProps & InputHTMLAttributes<HTMLInputElement> & {
  /** Small control shown inside the field on the right, e.g. a show/hide password button */
  trailing?: ReactNode;
};

export function Input({ label, hint, error, labelAddon, className, trailing, ...rest }: InputProps) {
  const id = useId();
  const control = (
    <input
      id={id}
      className={`${styles.control} ${error ? styles.invalid : ''} ${trailing ? styles.hasTrailing : ''} ${className ?? ''}`}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      {...rest}
    />
  );
  return (
    <Field id={id} label={label} hint={hint} error={error} labelAddon={labelAddon}>
      {trailing ? (
        <div className={styles.wrap}>
          {control}
          <div className={styles.trailing}>{trailing}</div>
        </div>
      ) : (
        control
      )}
    </Field>
  );
}

type TextAreaProps = FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea({ label, hint, error, labelAddon, className, rows = 4, ...rest }: TextAreaProps) {
  const id = useId();
  return (
    <Field id={id} label={label} hint={hint} error={error} labelAddon={labelAddon}>
      <textarea
        id={id}
        rows={rows}
        className={`${styles.control} ${styles.area} ${error ? styles.invalid : ''} ${className ?? ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
    </Field>
  );
}

type SelectProps = FieldProps & SelectHTMLAttributes<HTMLSelectElement>;

/** Native select with the same look as <Input>, so it keeps full keyboard and screen-reader support. */
export function Select({ label, hint, error, labelAddon, className, children, ...rest }: SelectProps) {
  const id = useId();
  return (
    <Field id={id} label={label} hint={hint} error={error} labelAddon={labelAddon}>
      <select
        id={id}
        className={`${styles.control} ${styles.select} ${error ? styles.invalid : ''} ${className ?? ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...rest}
      >
        {children}
      </select>
    </Field>
  );
}
