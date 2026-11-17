import { CalendarCheck, Handshake, Search } from 'lucide-react';
import Reveal from '../../components/common/Reveal';
import SectionHeader from '../../components/common/SectionHeader';
import { useReveal } from '../../hooks/useReveal';
import styles from './Home.module.css';

const steps = [
  {
    icon: Search,
    title: 'Find an item',
    text: 'Search or browse the categories, or describe what you need and let the AI Rental Finder shortlist real listings.',
  },
  {
    icon: CalendarCheck,
    title: 'Request a rental',
    text: 'Pick your dates and send a request. The owner reviews it and approves or declines.',
  },
  {
    icon: Handshake,
    title: 'Meet and return',
    text: 'Collect the item from the owner, use it for your dates, then return it and leave a review.',
  },
];

export default function HowItWorks() {
  const { ref, visible } = useReveal<HTMLOListElement>();

  return (
    <section id="how-it-works" className={`${styles.section} container`} aria-labelledby="how-title">
      <Reveal>
        <SectionHeader
          id="how-title"
          eyebrow="How it works"
          title="How Rentora works"
          subtitle="From search to return in three simple steps."
        />
      </Reveal>

      <ol ref={ref} className={`${styles.steps} ${visible ? styles.stepsVisible : ''}`}>
        <span className={styles.stepsLine} aria-hidden />
        {steps.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className={styles.step} style={{ transitionDelay: `${i * 220 + 200}ms` }}>
            <div className={styles.stepIcon}>
              <Icon size={26} aria-hidden />
              <span className={styles.stepNum}>{i + 1}</span>
            </div>
            <h3>{title}</h3>
            <p>{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
