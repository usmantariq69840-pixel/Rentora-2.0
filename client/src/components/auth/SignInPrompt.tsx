import { LogIn, UserPlus } from 'lucide-react';
import { ButtonLink } from '../common/Button';
import Modal from '../common/Modal';

interface Props {
  open: boolean;
  message: string;
  /** Where to return after signing in */
  next: string;
  onClose: () => void;
}

/** Friendly gate shown when a guest tries something that needs an account (save, book, list). */
export default function SignInPrompt({ open, message, next, onClose }: Props) {
  const query = `?next=${encodeURIComponent(next)}`;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sign in to continue"
      description={message}
      size="sm"
      footer={
        <>
          <ButtonLink to={`/register${query}`} variant="outline" iconLeft={<UserPlus size={18} aria-hidden />} onClick={onClose}>
            Create account
          </ButtonLink>
          <ButtonLink to={`/login${query}`} iconLeft={<LogIn size={18} aria-hidden />} onClick={onClose}>
            Sign in
          </ButtonLink>
        </>
      }
    >
      <p style={{ fontSize: 'var(--text-small)', color: 'var(--text-secondary)' }}>
        This is a local demo. You can use a one-click demo account on the sign-in page.
      </p>
    </Modal>
  );
}
