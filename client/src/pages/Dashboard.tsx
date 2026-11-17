import { AlertTriangle, ArrowRight, CalendarCheck, CircleCheckBig, Inbox, Package, Plus, Wallet } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button, { ButtonLink } from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import Tabs, { type TabItem } from '../components/common/Tabs';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../lib/AuthContext';
import { sortBookings } from '../lib/bookings';
import { formatPKR } from '../lib/format';
import type { Booking, DashboardData } from '../types';
import BookingCard from './bookings/BookingCard';
import FeaturedTab from './dashboard/FeaturedTab';
import ListingRow from './dashboard/ListingRow';
import StatCard from './dashboard/StatCard';
import styles from './Dashboard.module.css';

type TabId = 'overview' | 'listings' | 'requests' | 'history' | 'featured';
const TAB_IDS: TabId[] = ['overview', 'listings', 'requests', 'history', 'featured'];

function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.stack} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => <div key={i} className={styles.skeleton} />)}
    </div>
  );
}

export default function Dashboard() {
  useDocumentTitle('Owner dashboard');
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const dash = useApi<DashboardData>('/dashboard');
  const received = useApi<{ bookings: Booking[] }>('/bookings/received');

  const reload = () => {
    dash.retry();
    received.retry();
  };

  const requested = params.get('tab') as TabId | null;
  const active: TabId = requested && TAB_IDS.includes(requested) ? requested : 'overview';
  const setTab = (id: string) => setParams(id === 'overview' ? {} : { tab: id }, { replace: true });

  const { pending, history } = useMemo(() => {
    const all = received.data?.bookings ?? [];
    return {
      pending: sortBookings(all.filter((b) => b.status === 'pending')),
      history: sortBookings(all.filter((b) => b.status !== 'pending')),
    };
  }, [received.data]);

  const stats = dash.data?.stats;
  const listings = dash.data?.listings ?? [];
  const error = dash.error ?? received.error;
  const loading = !error && ((dash.loading && !dash.data) || (received.loading && !received.data));

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'listings', label: 'My listings', count: listings.length },
    { id: 'requests', label: 'Booking requests', count: pending.length, attention: pending.length > 0 },
    { id: 'history', label: 'Booking history', count: history.length },
    { id: 'featured', label: 'Featured (demo)' },
  ];

  const first = user?.name.split(' ')[0] ?? 'there';

  return (
    <div className={`${styles.page} container`}>
      <header className={styles.header}>
        <div>
          <h1>Owner dashboard</h1>
          <p>Hi {first}, here’s what’s happening with your listings. All figures come straight from the database.</p>
        </div>
        <ButtonLink to="/list-item" iconLeft={<Plus size={18} aria-hidden />}>List an item</ButtonLink>
      </header>

      <Tabs tabs={tabs} active={active} onChange={setTab} label="Dashboard sections" idBase="dash" />

      <div id="dash-panel" role="tabpanel" aria-labelledby={`dash-tab-${active}`} className={styles.panel}>
        {error ? (
          <EmptyState
            icon={<AlertTriangle size={30} aria-hidden />}
            title="We couldn’t load your dashboard"
            description="Check that the API is running, then try again."
            action={<Button onClick={reload}>Try again</Button>}
          />
        ) : loading || !stats ? (
          <SkeletonRows />
        ) : (
          <div key={active} className={styles.enter}>
            {active === 'overview' && (
              <>
                <div className={styles.stats}>
                  <StatCard index={0} icon={<Package size={22} aria-hidden />} label="Live listings" value={stats.liveListings}
                    note={stats.pendingListings ? `${stats.pendingListings} awaiting approval` : 'All approved listings'} onClick={() => setTab('listings')} />
                  <StatCard index={1} icon={<Inbox size={22} aria-hidden />} label="Pending requests" value={stats.pendingRequests}
                    tone={stats.pendingRequests ? 'attention' : 'default'} note={stats.pendingRequests ? 'Waiting for your reply' : 'You’re all caught up'} onClick={() => setTab('requests')} />
                  <StatCard index={2} icon={<CalendarCheck size={22} aria-hidden />} label="Upcoming rentals" value={stats.upcomingRentals} note="Approved, not yet finished" />
                  <StatCard index={3} icon={<CircleCheckBig size={22} aria-hidden />} label="Completed rentals" value={stats.completedRentals} note="Marked returned" onClick={() => setTab('history')} />
                  <StatCard index={4} icon={<Wallet size={22} aria-hidden />} label="Demo earnings" value={stats.demoEarnings} format={formatPKR} tone="accent" note="Rental totals of completed rentals. Not real money." />
                </div>

                <section className={styles.section} aria-labelledby="attention-title">
                  <div className={styles.sectionHead}>
                    <h2 id="attention-title">Needs your attention</h2>
                    {pending.length > 3 && <button type="button" className={styles.link} onClick={() => setTab('requests')}>See all {pending.length} <ArrowRight size={15} aria-hidden /></button>}
                  </div>
                  {pending.length === 0 ? (
                    <p className={styles.quiet}>No requests are waiting. New requests appear here and in your notifications.</p>
                  ) : (
                    <div className={styles.stack}>
                      {pending.slice(0, 3).map((b, i) => <BookingCard key={b.id} booking={b} index={i} onChanged={reload} />)}
                    </div>
                  )}
                </section>

                <section className={styles.section} aria-labelledby="listings-title">
                  <div className={styles.sectionHead}>
                    <h2 id="listings-title">Your listings</h2>
                    {listings.length > 3 && <button type="button" className={styles.link} onClick={() => setTab('listings')}>See all {listings.length} <ArrowRight size={15} aria-hidden /></button>}
                  </div>
                  {listings.length === 0 ? (
                    <p className={styles.quiet}>You haven’t listed anything yet. <Link to="/list-item">Create your first listing</Link>.</p>
                  ) : (
                    <div className={styles.stack}>
                      {listings.slice(0, 3).map((l, i) => <ListingRow key={l.id} listing={l} index={i} onChanged={reload} />)}
                    </div>
                  )}
                </section>
              </>
            )}

            {active === 'listings' &&
              (listings.length === 0 ? (
                <EmptyState icon={<Package size={30} aria-hidden />} title="No listings yet" description="List a camera, console, bike or gadget you’re not using and start earning." action={<ButtonLink to="/list-item">List an item</ButtonLink>} />
              ) : (
                <div className={styles.stack}>{listings.map((l, i) => <ListingRow key={l.id} listing={l} index={i} onChanged={reload} />)}</div>
              ))}

            {active === 'requests' &&
              (pending.length === 0 ? (
                <EmptyState icon={<Inbox size={30} aria-hidden />} title="No requests waiting" description="When someone asks to rent one of your items, you can approve or decline it here." />
              ) : (
                <div className={styles.stack}>{pending.map((b, i) => <BookingCard key={b.id} booking={b} index={i} onChanged={reload} />)}</div>
              ))}

            {active === 'featured' && <FeaturedTab onChanged={reload} />}

            {active === 'history' &&
              (history.length === 0 ? (
                <EmptyState icon={<CalendarCheck size={30} aria-hidden />} title="No booking history yet" description="Approved, completed, declined and cancelled requests on your listings will be kept here." />
              ) : (
                <div className={styles.stack}>{history.map((b, i) => <BookingCard key={b.id} booking={b} index={i} onChanged={reload} />)}</div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
