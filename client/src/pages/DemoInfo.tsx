import { Bot, Database, Landmark, LifeBuoy } from 'lucide-react';
import Reveal from '../components/common/Reveal';
import styles from './DemoInfo.module.css';

const blocks = [
  {
    id: 'simulated',
    icon: Landmark,
    title: 'What is simulated?',
    items: [
      'Payments: confirming a booking is a demo status change only. No bank or card details are collected and no money moves.',
      'Security deposits: shown as “Refundable deposit (demo)”. Rentora does not hold or refund real money.',
      'Verification: “verified” labels come from seeded demo data. No identity documents are requested.',
      'Featured listings and plans: a visual promotion demo with no billing.',
    ],
  },
  {
    id: 'data',
    icon: Database,
    title: 'Where is my data?',
    items: [
      'Rentora runs locally. Accounts, listings and bookings are stored in a SQLite file on the computer running the demo.',
      'Nothing is published online, and demo accounts must never reuse real passwords.',
    ],
  },
  {
    id: 'ai',
    icon: Bot,
    title: 'How does the AI work?',
    items: [
      'The AI Listing Generator and AI Rental Finder call Gemini through the local backend. The API key never reaches your browser.',
      'AI output is a suggestion. You review and edit every listing draft, and rental recommendations only ever come from real listings.',
      'If AI is unavailable, browsing, listing and booking still work normally.',
    ],
  },
  {
    id: 'help',
    icon: LifeBuoy,
    title: 'Need help?',
    items: [
      'Demo accounts and passwords are documented in the project README.',
      'To restore the original sample data before a presentation, run the seed/reset script (npm run db:reset -w server).',
    ],
  },
];

export default function DemoInfo() {
  return (
    <div className={`${styles.page} container`}>
      <Reveal>
        <p className={styles.eyebrow}>Demo information</p>
        <h1>Demo privacy &amp; help</h1>
        <p className={styles.lead}>
          Rentora is a university project demonstration. This page explains what is real, what is simulated,
          and how your information is handled.
        </p>
      </Reveal>

      <div className={styles.grid}>
        {blocks.map(({ id, icon: Icon, title, items }, i) => (
          <Reveal key={id} delay={i * 80}>
            <section id={id} className={styles.card}>
              <div className={styles.icon}><Icon size={22} aria-hidden /></div>
              <h2>{title}</h2>
              <ul>
                {items.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </section>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
