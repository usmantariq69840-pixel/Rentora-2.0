import { ArrowRight, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Reveal from '../../components/common/Reveal';
import { useTypewriter } from '../../hooks/useTypewriter';
import styles from './AiFinderBand.module.css';

const examples = [
  'A camera for a university photography assignment, two days, under Rs. 2,500 per day',
  'PlayStation 5 for a weekend gaming night with friends',
  'A projector for a family event this Saturday',
  'A bike for a short ride around the city',
];

export default function AiFinderBand() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  // Animated placeholder runs only while the field is empty and unfocused.
  const typed = useTypewriter(examples, !text && !focused);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(text.trim() ? `/ai-finder?q=${encodeURIComponent(text.trim())}` : '/ai-finder');
  };

  return (
    <section className={`${styles.wrap} container`} aria-labelledby="ai-title">
      <Reveal>
        <div className={`${styles.band} on-dark`}>
          <div className={styles.glow} aria-hidden />

          <div className={styles.copy}>
            <p className={styles.badge}>
              <Sparkles size={14} aria-hidden /> AI Rental Finder
            </p>
            <h2 id="ai-title" className={styles.title}>
              Describe it. We’ll find it.
            </h2>
            <p className={styles.text}>
              Tell Rentora what you need in plain language. The AI turns it into filters, and every result
              you see is a real listing from the database — never an invented one.
            </p>
          </div>

          <form className={styles.form} onSubmit={submit}>
            <label htmlFor="ai-request" className="sr-only">
              Describe what you want to rent
            </label>
            <div className={styles.field}>
              <textarea
                id="ai-request"
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={text || focused ? 'Describe what you need…' : undefined}
                className={styles.input}
              />
              {!text && !focused && (
                <p className={styles.typed} aria-hidden>
                  {typed}
                  <span className={styles.caret} />
                </p>
              )}
            </div>
            <button type="submit" className={styles.submit}>
              Find with AI <ArrowRight size={18} aria-hidden />
            </button>
          </form>
        </div>
      </Reveal>
    </section>
  );
}
