import { MessageSquareText } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import Button from '../../components/common/Button';
import { TextArea } from '../../components/common/Input';
import Stars from '../../components/common/Stars';
import StarRating from '../../components/common/StarRating';
import { useToast } from '../../components/common/Toast';
import { api, ApiError } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import type { BookingDetail, ReviewMini } from '../../types';
import styles from './ReviewSection.module.css';

function ReviewCard({ title, review }: { title: string; review: ReviewMini }) {
  return (
    <div className={styles.card}>
      <p className={styles.cardTitle}>{title}</p>
      <Stars value={review.rating} size={18} />
      {review.comment ? <p className={styles.comment}>{review.comment}</p> : <p className={styles.noComment}>No written comment.</p>}
      <time className={styles.time} dateTime={review.createdAt}>{formatDateTime(review.createdAt)}</time>
    </div>
  );
}

/** Shown on a completed booking. Each person can leave one review. */
export default function ReviewSection({ booking: b, onChanged }: { booking: BookingDetail; onChanged: () => void }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ rating?: string; comment?: string; form?: string }>({});

  if (b.status !== 'completed') return null;

  const isRenter = b.role === 'renter';
  const otherName = (isRenter ? b.owner.name : b.renter.name).split(' ')[0];
  const { canReview, mine, theirs } = b.review;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!rating) return setErrors({ rating: 'Choose a rating from 1 to 5 stars.' });
    setBusy(true);
    setErrors({});
    try {
      await api('/reviews', { method: 'POST', body: JSON.stringify({ bookingId: b.id, rating, comment: comment.trim() }) });
      toast.success('Thanks, your review is saved');
      onChanged();
    } catch (err) {
      if (err instanceof ApiError && err.fields?.length) {
        const next: typeof errors = {};
        for (const f of err.fields) next[f.path === 'rating' ? 'rating' : f.path === 'comment' ? 'comment' : 'form'] = f.message;
        setErrors(next);
      } else {
        setErrors({ form: err instanceof ApiError ? err.message : 'We couldn’t save your review. Please try again.' });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.section} aria-labelledby="review-title">
      <h2 id="review-title">Reviews</h2>

      {canReview && (
        <form className={styles.form} onSubmit={submit} noValidate>
          <p className={styles.lead}>
            {isRenter
              ? `How was renting from ${otherName}? Your review appears on the listing for other renters.`
              : `How was ${otherName} as a renter? ${otherName} can see this review on the booking.`}
          </p>
          <StarRating label="Your rating" value={rating} onChange={(v) => { setRating(v); setErrors((x) => ({ ...x, rating: undefined })); }} error={errors.rating} disabled={busy} />
          <TextArea
            label="Comment (optional)"
            value={comment}
            onChange={(e) => { setComment(e.target.value); setErrors((x) => ({ ...x, comment: undefined })); }}
            maxLength={600}
            rows={4}
            placeholder={isRenter ? 'Was the item as described? Was pickup easy?' : 'Was the item returned on time and in good shape?'}
            hint={`${comment.length}/600`}
            error={errors.comment}
            disabled={busy}
          />
          {errors.form && <p className={styles.formError} role="alert">{errors.form}</p>}
          <div><Button type="submit" loading={busy} iconLeft={<MessageSquareText size={18} aria-hidden />}>Submit review</Button></div>
        </form>
      )}

      {(mine || theirs) && (
        <div className={styles.grid}>
          {mine && <ReviewCard title="Your review" review={mine} />}
          {theirs && <ReviewCard title={`${otherName}’s review of you`} review={theirs} />}
        </div>
      )}

      {!canReview && !mine && !theirs && <p className={styles.quiet}>No reviews yet.</p>}
      {mine && !theirs && <p className={styles.quiet}>{otherName} hasn’t left a review yet.</p>}
    </section>
  );
}
