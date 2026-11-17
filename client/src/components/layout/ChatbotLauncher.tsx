import { MessageCircle, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './ChatbotLauncher.module.css';

/**
 * Floating chat button (bottom right). The assistant itself is not built yet,
 * so the panel says "coming soon" and points to the AI Rental Finder instead.
 */
export default function ChatbotLauncher() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // close on navigation
  useEffect(() => setOpen(false), [pathname]);

  // close on Escape or a click outside the panel
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  // item pages have a sticky booking bar on small screens, so the button sits higher there
  const lifted = /^\/items\/\d+$/.test(pathname);

  return (
    <div ref={rootRef} className={`${styles.root} ${lifted ? styles.lifted : ''}`}>
      {open && (
        <section id="chatbot-panel" className={styles.panel} role="dialog" aria-label="Rentora assistant">
          <header className={styles.head}>
            <span className={styles.avatar} aria-hidden><Sparkles size={18} /></span>
            <div>
              <h2>Rentora Assistant</h2>
              <p>Chatbot</p>
            </div>
            <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Close chat panel">
              <X size={18} aria-hidden />
            </button>
          </header>
          <div className={styles.body}>
            <span className={styles.soon}>Coming soon</span>
            <p className={styles.title}>Chatbot coming soon</p>
            <p className={styles.text}>
              Soon you’ll be able to ask questions about listings, bookings and renting here. Until then, the AI Rental Finder can
              shortlist real listings from a sentence.
            </p>
            <Link to="/ai-finder" className={styles.link}>
              <Sparkles size={16} aria-hidden /> Try the AI Rental Finder
            </Link>
          </div>
        </section>
      )}
      <button
        ref={buttonRef}
        type="button"
        className={`${styles.fab} ${open ? styles.fabOpen : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? 'chatbot-panel' : undefined}
        aria-label={open ? 'Close chatbot' : 'Open chatbot'}
      >
        <span className={`${styles.icon} ${styles.iconChat}`} aria-hidden><MessageCircle size={26} /></span>
        <span className={`${styles.icon} ${styles.iconClose}`} aria-hidden><X size={26} /></span>
      </button>
    </div>
  );
}
