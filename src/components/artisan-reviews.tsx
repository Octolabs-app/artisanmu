"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Send, Star } from "lucide-react";
import { useLanguage } from "@/components/language-context";
import { invokePublicFunction } from "@/lib/artisanmu-functions";
import { getBrowserSupabase } from "@/lib/supabase-browser";

type ReviewRow = {
  id: number;
  rating: number;
  comment: string | null;
  author_name: string | null;
  created_at: string;
};

function Stars({ value, className = "size-3.5" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${className} ${star <= value ? "fill-[#c79b55] text-[#c79b55]" : "text-[#d8d1c3]"}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export function ArtisanReviews({ artisanId }: { artisanId: string }) {
  const { copy } = useLanguage();
  const t = copy.browse;
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const client = supabase;
    let cancelled = false;

    async function load() {
      const { data, error: loadError } = await client
        .from("reviews")
        .select("id, rating, comment, author_name, created_at")
        .eq("artisan_id", Number(artisanId))
        .order("created_at", { ascending: false })
        .limit(20);
      if (!cancelled && !loadError && data) setReviews(data as ReviewRow[]);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [artisanId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (comment.trim().length < 4) {
      setError(t.reviewCommentPh);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await invokePublicFunction("artisanmu-submit-review", {
        artisan_id: Number(artisanId),
        rating,
        comment: comment.trim(),
        author_name: name.trim(),
      });
      setReviews((current) => [
        {
          id: Date.now(),
          rating,
          comment: comment.trim(),
          author_name: name.trim() || "Client",
          created_at: new Date().toISOString(),
        },
        ...current,
      ]);
      setComment("");
      setName("");
      setRating(5);
      setDone(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not post review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#e3ddd1] bg-white p-4">
      <div className="flex items-center gap-2 font-semibold text-[#101410]">
        <Star className="size-4 fill-[#c79b55] text-[#c79b55]" aria-hidden="true" />
        {t.reviews}
        <span className="text-sm font-normal text-[#5d6863]">({reviews.length})</span>
      </div>

      {reviews.length ? (
        <ul className="mt-3 grid gap-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-xl bg-[#fbf8f1] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[#101410]">{review.author_name || "Client"}</span>
                <Stars value={review.rating} />
              </div>
              {review.comment ? <p className="mt-1.5 text-sm leading-5 text-[#5d6863]">{review.comment}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-5 text-[#5d6863]">{t.reviewsNone}</p>
      )}

      {done ? (
        <p className="mt-3 rounded-xl border border-[#b9dfcf] bg-[#e7f5ef] px-3 py-2 text-sm font-medium text-[#0d7c5c]">
          {t.reviewThanks}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 border-t border-[#eee8dc] pt-4">
          <p className="text-sm font-semibold text-[#101410]">{t.leaveReview}</p>
          <div>
            <span className="block text-xs font-medium text-[#5d6863]">{t.reviewRatingLabel}</span>
            <div className="mt-1 flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  aria-label={`${star} / 5`}
                  className="p-0.5"
                >
                  <Star
                    className={`size-6 transition ${star <= rating ? "fill-[#c79b55] text-[#c79b55]" : "text-[#d8d1c3] hover:text-[#c79b55]"}`}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </div>
          <label className="block text-sm font-medium text-[#101410]">
            {t.reviewName}
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-[#e3ddd1] bg-[#fbf8f1] px-3 text-sm outline-none focus:border-[#0d8b66]"
              placeholder={t.reviewNamePh}
            />
          </label>
          <label className="block text-sm font-medium text-[#101410]">
            {t.reviewComment}
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-xl border border-[#e3ddd1] bg-[#fbf8f1] px-3 py-2 text-sm leading-6 outline-none focus:border-[#0d8b66]"
              placeholder={t.reviewCommentPh}
            />
          </label>
          {error ? (
            <p className="rounded-xl border border-[#E24B4A]/30 bg-[#E24B4A]/10 px-3 py-2 text-sm text-[#9f2f2e]">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={submitting || comment.trim().length < 4}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0d8b66] px-4 text-sm font-semibold text-white transition hover:bg-[#0b7758] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
            {submitting ? t.reviewSubmitting : t.reviewSubmit}
          </button>
        </form>
      )}
    </div>
  );
}
