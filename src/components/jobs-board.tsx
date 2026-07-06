"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Briefcase, Clock3, Map as MapIcon, MapPin, Phone, RotateCcw, Wrench } from "lucide-react";
import { AdBanner } from "@/components/ad-banner";
import { useLanguage } from "@/components/language-context";
import { popularTrades, type Language } from "@/lib/copy";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { resolveCoords } from "@/lib/mu-geo";
import type { MapPin as MuMapPin } from "@/components/mu-map";

// Leaflet is browser-only and heavy — load it only when the map is opened.
const MuMap = dynamic(() => import("@/components/mu-map").then((mod) => mod.MuMap), {
  ssr: false,
  loading: () => <div className="skeleton h-[320px] rounded-2xl" />,
});

type PublicJob = {
  id: string;
  trade: string;
  description: string;
  district: string;
  urgency: "urgent" | "planned";
  contactMethod?: "whatsapp" | "call";
  createdAt: string;
};

const EDGE_URL =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") +
  "/functions/v1/artisanmu-open-jobs";

const jobsCopy: Record<
  Language,
  {
    eyebrow: string;
    title: string;
    introLead: string;
    introStrong: string;
    introTail: string;
    urgent: string;
    planned: string;
    claim: string;
    claiming: string;
    claimed: string;
    verifiedOnly: string;
    prefersCall: string;
    emptyTitle: string;
    emptyBody: string;
    postCta: string;
    refresh: string;
    showMap: string;
    hideMap: string;
    mapAction: string;
    joinLead: string;
    joinCta: string;
    toastClaimed: string;
    toastTaken: string;
    toastUnverified: string;
    toastError: string;
    toastLoadError: string;
    minsAgo: (n: number) => string;
    hoursAgo: (n: number) => string;
    daysAgo: (n: number) => string;
  }
> = {
  en: {
    eyebrow: "Open requests",
    title: "Job board",
    introLead: "All open client requests across Mauritius.",
    introStrong: "Verified artisans",
    introTail: "can claim any job to receive the client's contact.",
    urgent: "Urgent request",
    planned: "Planned request",
    claim: "Claim this job",
    claiming: "Claiming…",
    claimed: "Claimed ✓",
    verifiedOnly: "Verified artisans only",
    prefersCall: "Prefers a call",
    emptyTitle: "No open jobs right now",
    emptyBody: "New requests appear here as clients post them.",
    postCta: "Post a job",
    refresh: "Refresh",
    showMap: "Show map",
    hideMap: "Hide map",
    mapAction: "See job",
    joinLead: "Not registered yet?",
    joinCta: "Join as an artisan →",
    toastClaimed: "Job claimed! Opening WhatsApp…",
    toastTaken: "This job was just taken by another artisan.",
    toastUnverified: "Your profile needs admin approval before you can claim jobs.",
    toastError: "Could not claim this job. Please try again.",
    toastLoadError: "Could not load jobs right now.",
    minsAgo: (n) => `${n}m ago`,
    hoursAgo: (n) => `${n}h ago`,
    daysAgo: (n) => `${n}d ago`,
  },
  fr: {
    eyebrow: "Demandes ouvertes",
    title: "Tableau des travaux",
    introLead: "Toutes les demandes ouvertes a Maurice.",
    introStrong: "Les artisans verifies",
    introTail: "peuvent accepter un travail pour recevoir le contact du client.",
    urgent: "Demande urgente",
    planned: "Demande planifiee",
    claim: "Accepter ce travail",
    claiming: "Acceptation…",
    claimed: "Accepte ✓",
    verifiedOnly: "Artisans verifies uniquement",
    prefersCall: "Prefere un appel",
    emptyTitle: "Aucun travail ouvert pour le moment",
    emptyBody: "Les nouvelles demandes apparaissent ici des que les clients les postent.",
    postCta: "Poster un travail",
    refresh: "Actualiser",
    showMap: "Voir la carte",
    hideMap: "Masquer la carte",
    mapAction: "Voir le travail",
    joinLead: "Pas encore inscrit ?",
    joinCta: "Devenir artisan →",
    toastClaimed: "Travail accepte ! Ouverture de WhatsApp…",
    toastTaken: "Ce travail vient d'etre pris par un autre artisan.",
    toastUnverified: "Votre profil doit etre approuve avant de pouvoir accepter des travaux.",
    toastError: "Impossible d'accepter ce travail. Reessayez.",
    toastLoadError: "Impossible de charger les travaux.",
    minsAgo: (n) => `il y a ${n} min`,
    hoursAgo: (n) => `il y a ${n} h`,
    daysAgo: (n) => `il y a ${n} j`,
  },
  mfe: {
    eyebrow: "Demann ouver",
    title: "Tablo travay",
    introLead: "Tou bann demann ouver dan Moris.",
    introStrong: "Bann artizan verifye",
    introTail: "kapav pran ninport ki travay pou gagn kontak kliyan.",
    urgent: "Demann irzan",
    planned: "Demann planifye",
    claim: "Pran sa travay-la",
    claiming: "Pe pran…",
    claimed: "Fini pran ✓",
    verifiedOnly: "Zis artizan verifye",
    prefersCall: "Prefer enn apel",
    emptyTitle: "Pena travay ouver la",
    emptyBody: "Bann nouvo demann paret isi kan kliyan poste zot.",
    postCta: "Poste enn travay",
    refresh: "Aktyalize",
    showMap: "Get kart",
    hideMap: "Kasiet kart",
    mapAction: "Get travay",
    joinLead: "Pankor anrezistre?",
    joinCta: "Vinn enn artizan →",
    toastClaimed: "Travay pran! Pe ouver WhatsApp…",
    toastTaken: "Enn lot artizan fek pran sa travay-la.",
    toastUnverified: "Ou profil bizin aprouve avan ou kapav pran travay.",
    toastError: "Pa finn kapav pran travay-la. Reesey.",
    toastLoadError: "Pa kapav sarz bann travay la.",
    minsAgo: (n) => `${n} min pase`,
    hoursAgo: (n) => `${n} er pase`,
    daysAgo: (n) => `${n} zour pase`,
  },
};

function TradeBadgeIcon({ trade, className }: { trade: string; className?: string }) {
  const match = popularTrades.find((entry) => entry.value === trade);
  const Icon = match?.icon ?? Wrench;
  return <Icon className={className} aria-hidden="true" />;
}

export function JobsBoard() {
  const { language } = useLanguage();
  const jc = jobsCopy[language];

  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");
  const [showMap, setShowMap] = useState(false);
  // Captured when jobs load so "x min ago" stays pure during render.
  const [nowTs, setNowTs] = useState(0);

  const loadJobs = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      try {
        const res = await fetch(EDGE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "public_list" }),
        });
        const json = await res.json();
        if (json.success) {
          setJobs(json.jobs ?? []);
          setNowTs(Date.now());
        }
      } catch {
        setToast(jobsCopy[language].toastLoadError);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [language],
  );

  useEffect(() => {
    queueMicrotask(() => void loadJobs());
    // Keep the board fresh while the tab stays open.
    const interval = window.setInterval(() => void loadJobs(), 30000);
    const onFocus = () => void loadJobs();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadJobs]);

  function timeAgo(iso: string) {
    const diff = nowTs - new Date(iso).getTime();
    const mins = Math.max(0, Math.floor(diff / 60_000));
    if (mins < 60) return jc.minsAgo(mins);
    const hours = Math.floor(mins / 60);
    if (hours < 24) return jc.hoursAgo(hours);
    return jc.daysAgo(Math.floor(hours / 24));
  }

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
      window.location.assign("/login#jobs");
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

      const contactLink = json.contact?.whatsapp_deep_link || json.contact?.phone_link;
      if (json.success && contactLink) {
        setClaimed((prev) => new Set([...prev, jobId]));
        window.open(contactLink, "_blank", "noopener,noreferrer");
        showToast(jc.toastClaimed);
      } else if (json.reason === "already_claimed") {
        showToast(jc.toastTaken);
      } else if (json.reason === "artisan_not_verified") {
        showToast(jc.toastUnverified);
      } else {
        showToast(jc.toastError);
      }
    } catch {
      showToast(jc.toastError);
    } finally {
      setClaiming(null);
    }
  }

  const mapPins = useMemo<MuMapPin[]>(
    () =>
      jobs.flatMap((job) => {
        const coords = resolveCoords(null, job.district, job.id);
        if (!coords) return [];
        return [
          {
            id: job.id,
            lat: coords.lat,
            lng: coords.lng,
            title: job.trade,
            subtitle: job.district,
            color: job.urgency === "urgent" ? "var(--urgent)" : "var(--green)",
            actionLabel: jc.mapAction,
          },
        ];
      }),
    [jobs, jc],
  );

  function scrollToJob(id: string) {
    document.getElementById(`job-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Page header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0d8b66]">{jc.eyebrow}</p>
          <h1 className="font-display mt-1 text-3xl font-bold text-[#101410] sm:text-4xl">{jc.title}</h1>
          <p className="mt-2 text-[#5d6863]">
            {jc.introLead} <span className="font-semibold text-[#0a5e46]">{jc.introStrong}</span>{" "}
            {jc.introTail}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowMap((current) => !current)}
            aria-pressed={showMap}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#e3ddd1] bg-white px-4 text-sm font-semibold text-[#0d1612] shadow-sm transition hover:border-[#0d8b66]"
          >
            <MapIcon className="size-4" aria-hidden="true" />
            {showMap ? jc.hideMap : jc.showMap}
          </button>
          <button
            type="button"
            onClick={() => void loadJobs(true)}
            disabled={refreshing}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#e3ddd1] bg-white px-4 text-sm font-semibold text-[#0d1612] shadow-sm transition hover:border-[#0d8b66] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw className={`size-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
            {jc.refresh}
          </button>
        </div>
      </div>

      {showMap && jobs.length ? (
        <div className="mb-6">
          <MuMap pins={mapPins} onPinAction={scrollToJob} className="h-[320px] sm:h-[380px]" />
        </div>
      ) : null}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className="mb-4 rounded-xl border border-[#0d8b66]/30 bg-[#eef5f3] px-4 py-3 text-sm font-medium text-[#0a5e46]"
        >
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
          <Briefcase className="size-10 text-[#d6cdb9]" aria-hidden="true" />
          <p className="font-semibold text-[#101410]">{jc.emptyTitle}</p>
          <p className="text-sm text-[#5d6863]">{jc.emptyBody}</p>
          <Link href="/post" className="btn btn-primary mt-2">
            {jc.postCta}
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
                id={`job-${job.id}`}
                className={`scroll-mt-24 overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
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
                  {isUrgent ? jc.urgent : jc.planned}
                  <span className="ml-auto flex items-center gap-1 text-white/80">
                    <Clock3 className="size-3.5" aria-hidden="true" />
                    {timeAgo(job.createdAt)}
                  </span>
                </div>

                <div className="p-4">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f2eee4] px-2.5 py-1 text-sm font-semibold text-[#101410]">
                      <TradeBadgeIcon trade={job.trade} className="size-4" />
                      {popularTrades.find((t) => t.value === job.trade)?.labels[language] ?? job.trade}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#eef5f3] px-2.5 py-1 text-sm font-semibold text-[#0d7c5c]">
                      <MapPin className="size-3.5" aria-hidden="true" />
                      {job.district}
                    </span>
                    {job.contactMethod === "call" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#fff4e0] px-2.5 py-1 text-sm font-semibold text-[#78511c]">
                        <Phone className="size-3.5" aria-hidden="true" />
                        {jc.prefersCall}
                      </span>
                    ) : null}
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
                      {isClaimed ? jc.claimed : isClaiming ? jc.claiming : jc.claim}
                    </button>
                    <span className="text-xs text-[#8a978f]">{jc.verifiedOnly}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <AdBanner placement="jobs" className="mt-8" />

      <p className="mt-10 text-center text-sm text-[#5d6863]">
        {jc.joinLead}{" "}
        <Link
          href="/login#join"
          className="font-semibold text-[#0a5e46] underline-offset-2 hover:underline"
        >
          {jc.joinCta}
        </Link>
      </p>
    </main>
  );
}
