import type { ReactNode } from 'react';
import Button from './Button';
import Modal from './Modal';

interface Props {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  /** 'danger' for actions that can't be undone */
  tone?: 'primary' | 'danger' | 'accent';
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}

/** Confirmation step used before any status-changing action. */
export default function ConfirmDialog({ open, title, description, confirmLabel, tone = 'primary', loading, error, onConfirm, onClose, children }: Props) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => undefined : onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Keep as is</Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      {description && <p style={{ color: 'var(--text-secondary)' }}>{description}</p>}
      {children}
      {error && <p role="alert" style={{ marginTop: 12, color: 'var(--danger)', fontWeight: 500, fontSize: 'var(--text-small)' }}>{error}</p>}
    </Modal>
  );
}
