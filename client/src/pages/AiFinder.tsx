import { AlertTriangle, ArrowRight, CalendarDays, Info, KeyRound, RefreshCw, Search, SearchX, Sparkles, Tag, Wallet } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button, { ButtonLink } from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { categoryNav } from '../components/layout/categories';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAi } from '../lib/AiContext';
import { api, ApiError } from '../lib/api';
import { toAiProblem } from '../lib/aiErrors';
import { formatPKR } from '../lib/format';
import type { FinderCriteria, FinderResponse } from '../types';
import FinderResultCard from './finder/FinderResultCard';
import styles from './AiFinder.module.css';

const EXAMPLES = [
  'A camera for a university photography assignment, two days, under Rs. 2,500 per day',
  'PlayStation 5 for a weekend gaming night with friends',
  'A projector for a family event',
  'A bike for a short ride around the city under Rs. 1,000',
];

const STEPS = ['Reading your request', 'Searching real listings', 'Ranking the matches'];

const shortDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** What the Finder understood, as chips the renter can sanity-check. */
function understoodChips(c: FinderCriteria): { icon: ReactNode; text: string }[] {
  const chips: { icon: ReactNode; text: string }[] = [];
  const category = categoryNav.find((x) => x.slug === c.categorySlug);
  if (category) chips.push({ icon: <category.icon size={14} aria-hidden />, text: category.name });
  if (c.maxDailyPrice !== null && c.minDailyPrice !== null) chips.push({ icon: <Wallet size={14} aria-hidden />, text: `${formatPKR(c.minDailyPrice)} – ${formatPKR(c.maxDailyPrice)} / day` });
  else if (c.maxDailyPrice !== null) chips.push({ icon: <Wallet size={14} aria-hidden />, text: `Up to ${formatPKR(c.maxDailyPrice)} / day` });
  else if (c.minDailyPrice !== null) chips.push({ icon: <Wallet size={14} aria-hidden />, text: `From ${formatPKR(c.minDailyPrice)} / day` });
  if (c.startDate && c.endDate) chips.push({ icon: <CalendarDays size={14} aria-hidden />, text: c.startDate === c.endDate ? shortDate(c.startDate) : `${shortDate(c.startDate)} – ${shortDate(c.endDate)}` });
  else if (c.days) chips.push({ icon: <CalendarDays size={14} aria-hidden />, text: `${c.days} ${c.days === 1 ? 'day' : 'days'}` });
  for (const k of c.keywords.slice(0, 5)) chips.push({ icon: <Tag size={14} aria-hidden />, text: k });
  return chips;
}

/** Filters that match the understood request, for people who prefer the normal search page. */
function browseLink(c: FinderCriteria): string {
  const p = new URLSearchParams();
  if (c.categorySlug) p.set('category', c.categorySlug);
  else if (c.keywords.length) p.set('q', c.keywords.slice(0, 2).join(' '));
  if (c.minDailyPrice !== null) p.set('minPrice', String(c.minDailyPrice));
  if (c.maxDailyPrice !== null) p.set('maxPrice', String(c.maxDailyPrice));
  if (c.startDate && c.endDate) { p.set('from', c.startDate); p.set('to', c.endDate); }
  const s = p.toString();
  return s ? `/browse?${s}` : '/browse';
}

type View =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'done'; data: FinderResponse; query: string };

export default function AiFinder() {
  useDocumentTitle('AI Rental Finder');
  const [params, setParams] = useSearchParams();
  const urlQuery = params.get('q') ?? '';
  const { status, requestSetup } = useAi();

  const [text, setText] = useState(urlQuery);
  const [view, setView] = useState<View>({ state: 'idle' });
  const [step, setStep] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const run = useCallback(async (query: string) => {
    const q = query.trim();
    if (q.length < 3) return;
    controller.current?.abort();
    const ctl = new AbortController();
    controller.current = ctl;
    setStep(0);
    setView({ state: 'loading' });
    try {
      const data = await api<FinderResponse>('/ai/rental-search', { method: 'POST', body: JSON.stringify({ query: q }), signal: ctl.signal });
      if (ctl.signal.aborted) return;
      setView({ state: 'done', data, query: q });
    } catch (err) {
      if (ctl.signal.aborted || (err instanceof Error && err.name === 'AbortError')) return;
      const message = err instanceof ApiError && err.status === 429
        ? err.message
        : err instanceof ApiError && err.status === 400
          ? (err.fields?.[0]?.message ?? err.message)
          : toAiProblem(err).message;
      setView({ state: 'error', message });
    }
  }, []);

  // Search whenever the address carries a request (arriving from the home page, a shared link, or Back).
  useEffect(() => {
    setText(urlQuery);
    if (urlQuery.trim().length >= 3) void run(urlQuery);
    else { controller.current?.abort(); setView({ state: 'idle' }); }
    return () => controller.current?.abort();
  }, [urlQuery, run]);

  // Cycle the progress steps while waiting.
  useEffect(() => {
    if (view.state !== 'loading') return;
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1400);
    return () => clearInterval(id);
  }, [view.state]);

  // Bring the answer into view on small screens.
  useEffect(() => {
    if (view.state === 'done' && window.innerWidth < 900) resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [view.state]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const q = text.trim();
    if (q.length < 3 || view.state === 'loading') return;
    if (q === urlQuery) void run(q); // same text: search again
    else setParams({ q }, { replace: false });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const pickExample = (example: string) => {
    setText(example);
    setParams({ q: example });
  };

  const fixKey = async () => {
    if (await requestSetup()) void run(urlQuery || text);
  };

  const loading = view.state === 'loading';
  const notice = view.state === 'done' ? view.data.aiNotice : null;
  const needsKey = notice?.code === 'not_configured' || notice?.code === 'invalid_key';

  return (
    <div className={`${styles.page} container`}>
      <section className={`${styles.hero} on-dark`} aria-labelledby="finder-title">
        <div className={styles.glow} aria-hidden />
        <div className={styles.copy}>
          <p className={styles.badge}><Sparkles size={14} aria-hidden /> AI Rental Finder</p>
          <h1 id="finder-title">Describe it. We’ll find it.</h1>
          <p>Tell Rentora what you need in plain language. The AI turns your words into filters, and every result is a real listing from our database. It never invents items, prices or availability.</p>
        </div>

        <form className={styles.form} onSubmit={submit}>
          <label htmlFor="finder-request" className="sr-only">Describe what you want to rent</label>
          <textarea
            id="finder-request"
            className={styles.input}
            rows={3}
            maxLength={500}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="For example: a camera for a photography assignment, two days, under Rs. 2,500 per day"
          />
          <div className={styles.formRow}>
            <span className={styles.count}>{text.length}/500</span>
            <Button type="submit" variant="accent" size="lg" loading={loading} disabled={text.trim().length < 3} iconLeft={<Search size={18} aria-hidden />}>
              {loading ? 'Finding…' : 'Find rentals'}
            </Button>
          </div>
        </form>

        <div className={styles.examples}>
          <span>Try:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className={styles.example} onClick={() => pickExample(ex)} disabled={loading}>{ex}</button>
          ))}
        </div>

        {status && !status.available && (
          <p className={styles.off}>
            <Info size={16} aria-hidden />
            <span>AI is switched off, so the Finder uses basic keyword matching.</span>
            {status.canConfigure
              ? <button type="button" onClick={() => void requestSetup().then((saved) => { if (saved && urlQuery) void run(urlQuery); })}><KeyRound size={14} aria-hidden /> Add Gemini key</button>
              : <span> The administrator can turn AI on.</span>}
          </p>
        )}
      </section>

      <div ref={resultsRef} className={styles.results} aria-live="polite" aria-busy={loading}>
        {view.state === 'idle' && (
          <div className={styles.intro}>
            <h2>How it works</h2>
            <ol>
              <li><strong>You describe it.</strong> Budget, days, the kind of item. Whatever you know.</li>
              <li><strong>AI reads the request</strong> and turns it into filters like category, price and dates.</li>
              <li><strong>We search real listings.</strong> You see actual items, their real prices and a short reason for each match.</li>
            </ol>
            <p>Prefer to filter by hand? <Link to="/browse">Browse all rentals</Link>.</p>
          </div>
        )}

        {loading && (
          <div className={styles.loading} role="status">
            <ol>
              {STEPS.map((label, i) => (
                <li key={label} className={i < step ? styles.stepDone : i === step ? styles.stepNow : ''}>
                  <span className={styles.dot} aria-hidden />{label}
                </li>
              ))}
            </ol>
            <div className={styles.skeletons} aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className={styles.sk} />)}</div>
          </div>
        )}

        {view.state === 'error' && (
          <EmptyState
            icon={<AlertTriangle size={30} aria-hidden />}
            title="The search didn’t go through"
            description={view.message}
            action={<Button onClick={() => void run(urlQuery || text)} iconLeft={<RefreshCw size={16} aria-hidden />}>Try again</Button>}
          />
        )}

        {view.state === 'done' && (
          <>
            {notice && (
              <div className={styles.notice} role="status">
                <Info size={20} aria-hidden />
                <div>
                  <p><strong>Basic matching was used.</strong> {notice.message}</p>
                  <p className={styles.noticeSub}>Results still come from real listings, but the request was read with simple rules instead of AI.</p>
                </div>
                {needsKey && (status?.canConfigure
                  ? <Button size="sm" variant="outline" onClick={() => void fixKey()} iconLeft={<KeyRound size={16} aria-hidden />}>{notice.code === 'invalid_key' ? 'Fix key' : 'Add key'}</Button>
                  : null)}
                {!needsKey && <Button size="sm" variant="outline" onClick={() => void run(view.query)} iconLeft={<RefreshCw size={16} aria-hidden />}>Try AI again</Button>}
              </div>
            )}

            <div className={styles.understood}>
              <h2>{view.data.mode === 'ai' ? 'Here’s what I understood' : 'Here’s what we picked out'}</h2>
              <ul>
                {understoodChips(view.data.criteria).map((c) => <li key={c.text}>{c.icon}{c.text}</li>)}
                {understoodChips(view.data.criteria).length === 0 && <li className={styles.none}>No specific filters. Try naming the item.</li>}
              </ul>
              <Link className={styles.refine} to={browseLink(view.data.criteria)}>Refine with filters <ArrowRight size={15} aria-hidden /></Link>
            </div>

            {view.data.results.length > 0 ? (
              <>
                <p className={styles.count2}>
                  {view.data.total > view.data.results.length
                    ? `Showing the top ${view.data.results.length} of ${view.data.total} matching listings`
                    : `${view.data.total} matching ${view.data.total === 1 ? 'listing' : 'listings'}`}
                  <span> · Availability isn’t guaranteed until the owner approves your request.</span>
                </p>
                <div className={styles.grid}>
                  {view.data.results.map((r, i) => <FinderResultCard key={r.listing.id} result={r} criteria={view.data.criteria} index={i} />)}
                </div>
              </>
            ) : (
              <EmptyState
                icon={<SearchX size={30} aria-hidden />}
                title="No matching listings"
                description="Nothing on Rentora fits that request right now. Here is what you could change:"
                action={
                  <div className={styles.hints}>
                    <ul>{view.data.hints.map((h) => <li key={h}>{h}</li>)}</ul>
                    <ButtonLink to={browseLink(view.data.criteria)} variant="outline">Open the filters</ButtonLink>
                  </div>
                }
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
