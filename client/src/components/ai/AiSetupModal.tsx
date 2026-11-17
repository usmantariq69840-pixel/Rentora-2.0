import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { keyRejected } from '../../lib/aiErrors';
import type { AiTestResult } from '../../types';
import Button, { ButtonLink } from '../common/Button';
import Modal from '../common/Modal';
import { useToast } from '../common/Toast';
import ApiKeyForm from './ApiKeyForm';
import styles from './AiSetupModal.module.css';

interface Props {
  open: boolean;
  isAdmin: boolean;
  onClose: () => void;
  /** The key was saved (and, unless Gemini rejected it, works) */
  onSaved: () => void;
}

/** Opens whenever an AI feature needs a key. Admins can paste one right here; everyone else is told how to get one added. */
export default function AiSetupModal({ open, isAdmin, onClose, onSaved }: Props) {
  const toast = useToast();
  const [rejected, setRejected] = useState('');
  useEffect(() => { if (open) setRejected(''); }, [open]);

  const handleSaved = (test: AiTestResult) => {
    if (keyRejected(test)) {
      setRejected(test.message ?? 'Gemini did not accept that key.');
      return;
    }
    toast.success(test.ok ? 'Gemini key saved and working' : 'Key saved. We couldn’t reach Gemini to check it just now.');
    onSaved();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Turn on AI with a Gemini key"
      description="The AI Listing Generator and AI Rental Finder use Google’s Gemini. Everything else on Rentora works without it."
      size="md"
      footer={<Button variant="outline" onClick={onClose}>Not now</Button>}
    >
      {isAdmin ? (
        <>
          {rejected && <p role="alert" className={styles.alert}>{rejected} Paste a different key below.</p>}
          <ApiKeyForm onSaved={handleSaved} submitLabel="Save and test key" autoFocus />
        </>
      ) : (
        <div className={styles.locked}>
          <span className={styles.icon}><Sparkles size={22} aria-hidden /></span>
          <div>
            <p><strong>Only the demo administrator can add the key.</strong></p>
            <p>Sign in as <code>admin@rentora.demo</code> (the sign-in page has a one-click button), open <strong>AI settings</strong> from the account menu and paste the key there. Until then you can keep using the manual form and the standard search.</p>
            <p className={styles.action}><ButtonLink to="/login?next=/settings/ai" variant="outline" size="sm" onClick={onClose}>Go to sign in</ButtonLink></p>
          </div>
        </div>
      )}
    </Modal>
  );
}
