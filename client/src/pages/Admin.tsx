import { AlertTriangle, ClipboardCheck, Flag, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import Tabs, { type TabItem } from '../components/common/Tabs';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { AdminListing, AdminOverview, AdminReport, AdminUser } from '../types';
import ModerationCard from './admin/ModerationCard';
import ReportRow from './admin/ReportRow';
import UsersTab from './admin/UsersTab';
import StatCard from './dashboard/StatCard';
import styles from './admin/Admin.module.css';

type TabId = 'queue' | 'reports' | 'users';
const TAB_IDS: TabId[] = ['queue', 'reports', 'users'];
type QueueFilter = 'pending' | 'approved' | 'hidden';
const FILTERS: { id: QueueFilter; label: string }[] = [
  { id: 'pending', label: 'Awaiting review' },
  { id: 'approved', label: 'Live' },
  { id: 'hidden', label: 'Hidden' },
];
const EMPTY: Record<QueueFilter, { title: string; text: string }> = {
  pending: { title: 'The queue is empty', text: 'Every listing has been reviewed. New listings from owners appear here.' },
  approved: { title: 'No live listings', text: 'Approved listings appear here.' },
  hidden: { title: 'Nothing is hidden', text: 'Listings you hide appear here, and can be approved again.' },
};

function Skeleton() {
  return <div className={styles.stack} aria-hidden="true">{[0, 1].map((i) => <div key={i} className={styles.skeleton} />)}</div>;
}

export default function Admin() {
  useDocumentTitle('Admin moderation');
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab') as TabId | null;
  const active: TabId = requested && TAB_IDS.includes(requested) ? requested : 'queue';
  const filterParam = params.get('show') as QueueFilter | null;
  const filter: QueueFilter = filterParam && FILTERS.some((f) => f.id === filterParam) ? filterParam : 'pending';

  const setTab = (id: string) => setParams(id === 'queue' ? {} : { tab: id }, { replace: true });
  const setFilter = (id: QueueFilter) => setParams(id === 'pending' ? {} : { show: id }, { replace: true });

  const overview = useApi<{ overview: AdminOverview }>('/admin/overview');
  const queue = useApi<{ listings: AdminListing[] }>(active === 'queue' ? `/admin/listings?status=${filter}` : null);
  const reports = useApi<{ reports: AdminReport[] }>(active === 'reports' ? '/admin/reports?status=all' : null);
  const users = useApi<{ users: AdminUser[] }>(active === 'users' ? '/admin/users' : null);

  const ov = overview.data?.overview;
  const refresh = () => {
    overview.retry();
    queue.retry();
    reports.retry();
  };

  const tabs: TabItem[] = [
    { id: 'queue', label: 'Review queue', count: ov?.pendingListings, attention: !!ov?.pendingListings },
    { id: 'reports', label: 'Reports', count: ov?.openReports, attention: !!ov?.openReports },
    { id: 'users', label: 'Users', count: ov?.users },
  ];

  const current = active === 'queue' ? queue : active === 'reports' ? reports : users;
  const failed = overview.error ?? current.error;

  return (
    <div className={`${styles.page} container`}>
      <header className={styles.header}>
        <div>
          <h1>Admin moderation</h1>
          <p>Review new listings, handle reports and see who is using the demo. This page is only for the admin account, and the server checks that too.</p>
        </div>
        <Link to="/settings/ai" className={styles.aiLink}><Sparkles size={16} aria-hidden /> AI settings</Link>
      </header>

      {ov && (
        <div className={styles.stats}>
          <StatCard index={0} icon={<ClipboardCheck size={22} aria-hidden />} label="Awaiting review" value={ov.pendingListings} tone={ov.pendingListings ? 'attention' : 'default'} note={ov.pendingListings ? 'New listings to check' : 'All reviewed'} onClick={() => { setTab('queue'); setFilter('pending'); }} />
          <StatCard index={1} icon={<Flag size={22} aria-hidden />} label="Open reports" value={ov.openReports} tone={ov.openReports ? 'attention' : 'default'} note={ov.openReports ? 'Flagged by users' : 'Nothing flagged'} onClick={() => setTab('reports')} />
          <StatCard index={2} icon={<ShieldCheck size={22} aria-hidden />} label="Live listings" value={ov.liveListings} note={`${ov.featuredListings} featured (demo) · ${ov.hiddenListings} hidden`} />
          <StatCard index={3} icon={<Users size={22} aria-hidden />} label="Users" value={ov.users} note="Demo accounts" onClick={() => setTab('users')} />
        </div>
      )}

      <Tabs tabs={tabs} active={active} onChange={setTab} label="Admin sections" idBase="admin" />

      <div id="admin-panel" role="tabpanel" aria-labelledby={`admin-tab-${active}`} className={styles.panel}>
        {failed ? (
          <EmptyState icon={<AlertTriangle size={30} aria-hidden />} title="We couldn’t load this page" description="Check that the API is running, then try again." action={<Button onClick={refresh}>Try again</Button>} />
        ) : (
          <div key={active} className={styles.enter}>
            {active === 'queue' && (
              <>
                <div className={styles.filters} role="group" aria-label="Show listings">
                  {FILTERS.map((f) => (
                    <button key={f.id} type="button" className={`${styles.pill} ${f.id === filter ? styles.pillOn : ''}`} aria-pressed={f.id === filter} onClick={() => setFilter(f.id)}>
                      {f.label}
                      {ov && <span>{f.id === 'pending' ? ov.pendingListings : f.id === 'approved' ? ov.liveListings : ov.hiddenListings}</span>}
                    </button>
                  ))}
                </div>
                {queue.loading && !queue.data ? <Skeleton /> : queue.data && queue.data.listings.length === 0 ? (
                  <EmptyState icon={<ClipboardCheck size={30} aria-hidden />} title={EMPTY[filter].title} description={EMPTY[filter].text} />
                ) : (
                  <div className={styles.stack}>
                    {queue.data?.listings.map((l, i) => <ModerationCard key={l.id} listing={l} index={i} onChanged={refresh} />)}
                  </div>
                )}
              </>
            )}

            {active === 'reports' &&
              (reports.loading && !reports.data ? <Skeleton /> : reports.data && reports.data.reports.length === 0 ? (
                <EmptyState icon={<Flag size={30} aria-hidden />} title="No reports" description="When someone flags a listing from its page, it shows up here." />
              ) : (
                <>
                  <p className={styles.intro}>Reports are flagged by signed-in users from a listing page. Two are seeded as examples.</p>
                  <ul className={styles.reports}>{reports.data?.reports.map((r, i) => <ReportRow key={r.id} report={r} index={i} onChanged={refresh} />)}</ul>
                </>
              ))}

            {active === 'users' && (users.loading && !users.data ? <Skeleton /> : users.data && <UsersTab users={users.data.users} />)}
          </div>
        )}
      </div>
    </div>
  );
}
