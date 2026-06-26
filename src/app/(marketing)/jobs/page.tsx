"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Clock3, MapPin, Wrench } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

type PublicJob = {
  id: string;
  trade: string;
  description: string;
  district: string;
  urgency: "urgent" | "planned";
  createdAt: string;
};

const EDGE_URL =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") +
  "/functions/v1/artisanmu-open-jobs";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch(EDGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "public_list" }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setJobs(json.jobs ?? []);
      })
      .catch(() => setToast("Could not load jobs right now."))
      .finally(() => setLoading(false));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  async function claimJob(jobId: string) {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = "/login#jobs";
      return;
    }

    setClaiming(jobId);
    try {
      const res = await fetch(EDGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: "claim", job_id: jobId }),
      });
      const json = await res.json();

      if (json.success && json.contact?.whatsapp_deep_link) {
        setClaimed((prev) => new Set([...prev, jobId]));
        window.open(json.contact.whatsapp_deep_link, "_blank", "noopener,noreferrer");
        showToast("Job claimed! Opening WhatsApp…");
      } else if (json.reason === "already_claimed") {
        showToast("This job was just taken by another artisan.");
      } else if (json.reason === "artisan_not_verified") {
        showToast("Your profile needs admin approval before you can claim jobs.");
      } else {
        showToast("Could not claim this job. Please try again.");
      }
    } catch {
      showToast("Claim failed. Check your connection and try again.");
    } finally {
      setClaiming(null);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Page header */}
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#0d8b66]">
          Open requests
        </p>
        <h1 className="font-display mt-1 text-3xl font-bold text-[#101410] sm:text-4xl">
          Job board
        </h1>
        <p className="mt-2 text-[#5d6863]">
          All open client requests across Mauritius.{" "}
          <span className="font-semibold text-[#0a5e46]">Verified artisans</span> can claim
          any job to receive the client&apos;s contact.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="mb-4 rounded-xl border border-[#0d8b66]/30 bg-[#eef5f3] px-4 py-3 text-sm font-medium text-[#0a5e46]">
          {toast}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-40 rounded-2xl" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#e3ddd1] bg-white px-6 py-16 text-center shadow-sm">
          <Briefcase className="size-10 text-[#d6cdb9]" />
          <p className="font-semibold text-[#101410]">No open jobs right now</p>
          <p className="text-sm text-[#5d6863]">
            New requests appear here as clients post them.
          </p>
          <Link href="/post" className="btn btn-primary mt-2">
            Post a job
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => {
            const isClaimed = claimed.has(job.id);
            const isClaiming = claiming === job.id;
            const isUrgent = job.urgency === "urgent";
            return (
              <article
                key={job.id}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
                  isUrgent ? "border-[#E24B4A]/30" : "border-[#e3ddd1]"
                }`}
              >
                {/* Coloured header bar */}
                <div
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white ${
                    isUrgent ? "bg-[#E24B4A]" : "bg-[#0d1612]"
                  }`}
                >
                  <span className="size-2 rounded-full bg-white/80" />
                  {isUrgent ? "Urgent request" : "Planned request"}
                  <span className="ml-auto flex items-center gap-1 text-white/80">
                    <Clock3 className="size-3.5" />
                    {timeAgo(job.createdAt)}
                  </span>
                </div>

                <div className="p-4">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f2eee4] px-2.5 py-1 text-sm font-semibold text-[#101410]">
                      <Wrench className="size-3.5" />
                      {job.trade}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#eef5f3] px-2.5 py-1 text-sm font-semibold text-[#0d7c5c]">
                      <MapPin className="size-3.5" />
                      {job.district}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="mt-3 text-sm leading-6 text-[#4d5651]">
                    {job.description.length > 150
                      ? job.description.slice(0, 147) + "…"
                      : job.description}
                  </p>

                  {/* Action */}
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isClaimed || isClaiming}
                      onClick={() => claimJob(job.id)}
                      className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${
                        isClaimed
                          ? "bg-[#e7f5ef] text-[#0d7c5c]"
                          : isUrgent
                            ? "bg-[#E24B4A] text-white hover:bg-[#cf3f3e] active:scale-95"
                            : "bg-[#0d1612] text-white hover:bg-[#17251e] active:scale-95"
                      }`}
                    >
                      {isClaimed ? "Claimed ✓" : isClaiming ? "Claiming…" : "Claim this job"}
                    </button>
                    <span className="text-xs text-[#8a978f]">Verified artisans only</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-10 text-center text-sm text-[#5d6863]">
        Not registered yet?{" "}
        <Link
          href="/login#join"
          className="font-semibold text-[#0a5e46] underline-offset-2 hover:underline"
        >
          Join as an artisan &rarr;
        </Link>
      </p>
    </main>
  );
}
