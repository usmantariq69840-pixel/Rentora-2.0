import { AlertTriangle, CalendarX2, Inbox, Send } from 'lucide-react';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button, { ButtonLink } from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import Tabs, { type TabItem } from '../components/common/Tabs';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { isClosed, sortBookings } from '../lib/bookings';
import type { Booking } from '../types';
import BookingCard from './bookings/BookingCard';
import styles from './Bookings.module.css';

type TabId = 'received' | 'sent' | 'upcoming' | 'completed' | 'closed';
const TAB_IDS: TabId[] = ['received', 'sent', 'upcoming', 'completed', 'closed'];

const EMPTY: Record<TabId, { title: string; text: string; cta?: { to: string; label: string } }> = {
  received: { title: 'No requests received yet', text: 'When someone asks to rent one of your listings it will appear here.', cta: { to: '/list-item', label: 'List an item' } },
  sent: { title: 'You haven’t sent any requests', text: 'Find something to rent and pick your dates to send your first request.', cta: { to: '/browse', label: 'Browse rentals' } },
  upcoming: { title: 'Nothing upcoming', text: 'Approved rentals — both ones you’re renting and ones you’re lending — will show here.' },
  completed: { title: 'No completed rentals yet', text: 'Finished rentals will be listed here.' },
  closed: { title: 'No declined or cancelled requests', text: 'Declined and cancelled requests are kept here for your records.' },
};

export default function Bookings() {
  useDocumentTitle('My bookings');
  const [params, setParams] = useSearchParams();
  const sent = useApi<{ bookings: Booking[] }>('/bookings/mine');
  const received = useApi<{ bookings: Booking[] }>('/bookings/received');

  const loading = (sent.loading && !sent.data) || (received.loading && !received.data);
  const error = sent.error ?? received.error;
  const reload = () => {
    sent.retry();
    received.retry();
  };

  const lists = useMemo(() => {
    const s = sent.data?.bookings ?? [];
    const r = received.data?.bookings ?? [];
    const all = [...s, ...r];
    return {
      received: sortBookings(r),
      sent: sortBookings(s),
      upcoming: sortBookings(all.filter((b) => b.status === 'approved')),
      completed: sortBookings(all.filter((b) => b.status === 'completed')),
      closed: sortBookings(all.filter((b) => isClosed(b.status))),
    } satisfies Record<TabId, Booking[]>;
  }, [sent.data, received.data]);

  const pendingReceived = lists.received.filter((b) => b.status === 'pending').length;

  // With no ?tab= in the URL, open the tab most likely to need attention.
  const requested = params.get('tab') as TabId | null;
  const active: TabId =
    requested && TAB_IDS.includes(requested) ? requested
    : pendingReceived > 0 || (lists.sent.length === 0 && lists.received.length > 0) ? 'received'
    : 'sent';

  const tabs: TabItem[] = [
    { id: 'received', label: 'Requests received', count: lists.received.length, attention: pendingReceived > 0 },
    { id: 'sent', label: 'Requests sent', count: lists.sent.length },
    { id: 'upcoming', label: 'Upcoming', count: lists.upcoming.length },
    { id: 'completed', label: 'Completed', count: lists.completed.length },
    { id: 'closed', label: 'Declined / cancelled', count: lists.closed.length },
  ];

  const visible = lists[active];
  const empty = EMPTY[active];

  return (
    <div className={`${styles.page} container`}>
      <header className={styles.header}>
        <div>
          <h1>My bookings</h1>
          <p>Requests you’ve sent as a renter and requests on your listings, in one place.</p>
        </div>
        <ButtonLink to="/browse" variant="outline">Browse rentals</ButtonLink>
      </header>

      <Tabs tabs={tabs} active={active} onChange={(id) => setParams({ tab: id }, { replace: true })} label="Booking filters" idBase="bookings" />

      <div id="bookings-panel" role="tabpanel" aria-labelledby={`bookings-tab-${active}`} className={styles.panel}>
        {error ? (
          <EmptyState
            icon={<AlertTriangle size={30} aria-hidden />}
            title="We couldn’t load your bookings"
            description="Check that the API is running, then try again."
            action={<Button onClick={reload}>Try again</Button>}
          />
        ) : loading ? (
          <div className={styles.list} aria-hidden="true">
            {[0, 1, 2].map((i) => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={active === 'received' ? <Inbox size={30} aria-hidden /> : active === 'sent' ? <Send size={30} aria-hidden /> : <CalendarX2 size={30} aria-hidden />}
            title={empty.title}
            description={empty.text}
            action={empty.cta && <ButtonLink to={empty.cta.to}>{empty.cta.label}</ButtonLink>}
          />
        ) : (
          // keyed by tab so cards animate in again whenever the tab changes
          <div className={styles.list} key={active}>
            {visible.map((b, i) => (
              <BookingCard key={b.id} booking={b} index={i} onChanged={reload} showRole={active === 'upcoming' || active === 'completed' || active === 'closed'} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
