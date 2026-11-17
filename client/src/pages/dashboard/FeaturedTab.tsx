import { Check, Info, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { useToast } from '../../components/common/Toast';
import ListingImage from '../../components/listings/ListingImage';
import { useApi } from '../../hooks/useApi';
import { api, ApiError } from '../../lib/api';
import { artFor } from '../../lib/art';
import { formatDate } from '../../lib/dates';
import { formatPKR } from '../../lib/format';
import type { PromotionPlan, PromotionsData } from '../../types';
import styles from './FeaturedTab.module.css';

type Row = PromotionsData['listings'][number];

const FREE_PERKS = ['Appears in search and its category', 'Normal placement in results'];
const FEATURED_PERKS = ['Featured label on the card', 'Shown first in results', 'Shown on the home page Featured section'];

export default function FeaturedTab({ onChanged }: { onChanged: () => void }) {
  const toast = useToast();
  const { data, error, loading, retry } = useApi<PromotionsData>('/promotions/mine');
  const [choosing, setChoosing] = useState<Row | null>(null);
  const [plan, setPlan] = useState<PromotionPlan['id']>('week');
  const [stopping, setStopping] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');

  const refresh = () => { retry(); onChanged(); };

  const activate = async () => {
    if (!choosing) return;
    setBusy(true);
    setProblem('');
    try {
      await api('/promotions', { method: 'POST', body: JSON.stringify({ listingId: choosing.id, plan }) });
      toast.success(choosing.featured ? 'Featured period extended (demo)' : 'Your listing is now featured (demo)');
      setChoosing(null);
      refresh();
    } catch (err) {
      setProblem(err instanceof ApiError ? err.message : 'That didn’t work. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    if (!stopping) return;
    setBusy(true);
    setProblem('');
    try {
      await api(`/promotions/${stopping.id}`, { method: 'DELETE' });
      toast.success('Featured promotion stopped');
      setStopping(null);
      refresh();
    } catch (err) {
      setProblem(err instanceof ApiError ? err.message : 'That didn’t work. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <p className={styles.quiet}>We couldn’t load this section. <button type="button" className={styles.link} onClick={retry}>Try again</button></p>;
  if (loading && !data) return <div className={styles.skeleton} aria-hidden="true" />;
  if (!data) return null;

  const selected = data.plans.find((p) => p.id === plan);

  return (
    <div className={styles.wrap}>
      <p className={styles.demoNote}><Info size={18} aria-hidden /> <span><strong>Simulation only.</strong> Rentora shows prices so the plans look realistic, but no money is charged and nothing is billed.</span></p>

      <section aria-labelledby="plans-title">
        <h2 id="plans-title" className={styles.h2}>Compare plans</h2>
        <div className={styles.plans}>
          <div className={styles.plan}>
            <h3>Free listing</h3>
            <p className={styles.price}>Rs. 0</p>
            <ul>{FREE_PERKS.map((p) => <li key={p}><Check size={16} aria-hidden /> {p}</li>)}</ul>
          </div>
          {data.plans.map((p) => (
            <div key={p.id} className={`${styles.plan} ${styles.paid}`}>
              <span className={styles.ribbon}><Sparkles size={12} aria-hidden /> Demo</span>
              <h3>{p.days === 7 ? 'Featured · 7 days' : 'Featured · 30 days'}</h3>
              <p className={styles.price}>{formatPKR(p.demoPrice)} <small>(not charged)</small></p>
              <ul>{FEATURED_PERKS.map((x) => <li key={x}><Check size={16} aria-hidden /> {x}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="promo-listings">
        <h2 id="promo-listings" className={styles.h2}>Your listings</h2>
        {data.listings.length === 0 ? (
          <p className={styles.quiet}>You have no listings yet. <Link to="/list-item">Create one</Link> to try this.</p>
        ) : (
          <ul className={styles.list}>
            {data.listings.map((l) => (
              <li key={l.id} className={styles.row}>
                <div className={styles.thumb}><ListingImage title={l.title} imageUrl={l.imageUrl} art={artFor(l.categorySlug, l.subcategory)} /></div>
                <div className={styles.main}>
                  <Link to={`/items/${l.id}`}>{l.title}</Link>
                  <div className={styles.state}>
                    {l.featured ? <StatusBadge status="featured" label="Featured (demo)" /> : l.status === 'approved' ? <span className={styles.plain}>Normal placement</span> : <StatusBadge status={l.status} label={l.status === 'pending' ? 'Awaiting approval' : 'Hidden'} />}
                    {l.featuredUntil && <span className={styles.until}>until {formatDate(l.featuredUntil.slice(0, 10))}</span>}
                  </div>
                  {l.status !== 'approved' && <p className={styles.help}>Only approved listings can be featured.</p>}
                </div>
                <div className={styles.actions}>
                  <Button size="sm" disabled={l.status !== 'approved'} onClick={() => { setProblem(''); setPlan('week'); setChoosing(l); }} iconLeft={<Sparkles size={15} aria-hidden />}>{l.featured ? 'Extend' : 'Feature (demo)'}</Button>
                  {l.featured && <Button size="sm" variant="outline" onClick={() => { setProblem(''); setStopping(l); }} iconLeft={<X size={15} aria-hidden />}>Stop</Button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.history.length > 0 && (
        <section aria-labelledby="promo-history">
          <h2 id="promo-history" className={styles.h2}>History</h2>
          <ul className={styles.history}>
            {data.history.map((h) => (
              <li key={h.id}>
                <span><strong>{h.listingTitle}</strong> · {h.planName}</span>
                <span className={styles.dates}>{formatDate(h.startAt.slice(0, 10))} – {formatDate(h.endAt.slice(0, 10))}</span>
                <span className={`${styles.hstatus} ${styles[h.status]}`}>{h.status === 'active' ? 'Active' : h.status === 'expired' ? 'Ended' : 'Stopped'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Modal
        open={!!choosing}
        onClose={() => !busy && setChoosing(null)}
        title={choosing?.featured ? 'Extend the featured period' : 'Feature this listing'}
        description="Choose a demo plan. This is a simulation: no payment details are asked for and no money is charged."
        footer={
          <>
            <Button variant="outline" onClick={() => setChoosing(null)} disabled={busy}>Cancel</Button>
            <Button onClick={() => void activate()} loading={busy} iconLeft={<Sparkles size={18} aria-hidden />}>{choosing?.featured ? 'Extend (demo)' : 'Activate (demo)'}</Button>
          </>
        }
      >
        <fieldset className={styles.choices}>
          <legend className={styles.sr}>Featured plan</legend>
          {data.plans.map((p) => (
            <label key={p.id} className={`${styles.choice} ${plan === p.id ? styles.choiceOn : ''}`}>
              <input type="radio" name="plan" value={p.id} checked={plan === p.id} onChange={() => setPlan(p.id)} />
              <span><strong>{p.days} days</strong><small>Demo price {formatPKR(p.demoPrice)}, not charged</small></span>
            </label>
          ))}
        </fieldset>
        {selected && choosing && <p className={styles.summary}>“{choosing.title}” will be featured {choosing.featured ? 'for another' : 'for'} {selected.days} days.</p>}
        {problem && <p role="alert" className={styles.problem}>{problem}</p>}
      </Modal>

      <ConfirmDialog
        open={!!stopping}
        title="Stop featuring this listing?"
        description={`“${stopping?.title ?? ''}” goes back to normal placement straight away.`}
        confirmLabel="Stop promotion"
        tone="danger"
        loading={busy}
        error={problem}
        onConfirm={stop}
        onClose={() => setStopping(null)}
      />
    </div>
  );
}
