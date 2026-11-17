import { ShieldCheck } from 'lucide-react';
import { Input, TextArea } from '../../components/common/Input';
import { formatPKR } from '../../lib/format';
import type { FieldErrors, FormState } from './wizardModel';
import styles from './Wizard.module.css';

interface Props {
  form: FormState;
  errors: FieldErrors;
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}

const digits = (v: string) => v.replace(/[^\d]/g, '').slice(0, 7);

export default function RentalStep({ form, errors, set }: Props) {
  const price = Number(form.dailyPrice);
  const showThree = Number.isFinite(price) && price >= 50;
  return (
    <div className={styles.fields}>
      <p className={styles.aiNote}><ShieldCheck size={16} aria-hidden /> You set the price and deposit. The AI never chooses them.</p>
      <div className={styles.two}>
        <Input
          label="Rental price per day (PKR)"
          inputMode="numeric"
          value={form.dailyPrice}
          onChange={(e) => set('dailyPrice', digits(e.target.value))}
          error={errors.dailyPrice}
          hint="For example 2500. Renters pay this for each day."
          autoComplete="off"
        />
        <Input
          label="Refundable deposit (PKR)"
          inputMode="numeric"
          value={form.depositAmount}
          onChange={(e) => set('depositAmount', digits(e.target.value))}
          error={errors.depositAmount}
          hint="Illustrative only. No money is collected. Use 0 for none."
          autoComplete="off"
        />
      </div>
      {showThree && !errors.dailyPrice && (
        <p className={styles.example}>
          A 3-day rental would cost the renter <strong>{formatPKR(price * 3)}</strong>{form.depositAmount ? <> plus a {formatPKR(Number(form.depositAmount) || 0)} refundable deposit (demo)</> : null}.
        </p>
      )}
      <Input
        label="Pickup area"
        value={form.location}
        onChange={(e) => set('location', e.target.value)}
        error={errors.location}
        hint="Area only, for example “Gulberg, Lahore”. Don’t add your full address."
        maxLength={80}
        autoComplete="off"
      />
      <TextArea
        label="Availability note (optional)"
        rows={3}
        value={form.availabilityNote}
        onChange={(e) => set('availabilityNote', e.target.value)}
        error={errors.availabilityNote}
        hint={`${form.availabilityNote.length}/200 · For example “Weekdays after 5 pm, all weekend”. Booked days are blocked automatically.`}
        maxLength={200}
      />
    </div>
  );
}
