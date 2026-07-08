"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  History,
  ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  Pencil,
  Plus,
  Power,
  MessageCircle,
  Phone,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { ArtisanMuLogo } from "@/components/artisanmu-logo";
import { invokePublicFunction } from "@/lib/artisanmu-functions";

const adminTabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "review", label: "Review", icon: UserCheck },
  { id: "artisans", label: "Artisans", icon: Users },
  { id: "jobs", label: "Jobs", icon: BriefcaseBusiness },
  { id: "ads", label: "Ads", icon: Megaphone },
] as const;

type AdminTab = (typeof adminTabs)[number]["id"];

type BadgeName = "Fair price" | "Fast response" | "Top rated";

const badgeOptions: BadgeName[] = ["Fair price", "Fast response", "Top rated"];

type AdminReview = {
  id: number;
  artisan_id: number;
  rating: number;
  comment: string | null;
  author_name: string | null;
  created_at: string;
  is_visible?: boolean;
};

type AdminReviewsPayload = {
  success?: boolean;
  reviews?: AdminReview[];
  message?: string;
};

type PhotoDeletePayload = {
  success?: boolean;
  photos?: string[];
  avatar?: string | null;
  message?: string;
};

type LiveAdminArtisan = {
  id: string;
  name: string;
  email: string;
  phone: string;
  trade: string;
  town: string;
  district: string;
  specialties: string[];
  serviceTags: string[];
  bio: string;
  photos: string[];
  photoCount: number;
  status: "pending" | "approved" | "rejected" | "removed";
  verified: boolean;
  available: boolean;
  createdAt: string;
  reviewedAt: string | null;
  notes: string;
  badges: string[];
  badgeFlags: {
    fairPrice: boolean;
    fastResponse: boolean;
    topRated: boolean;
  };
  reviews: number;
  rating: number;
  hasAuthUser: boolean;
  deactivatedAt?: string | null;
};

type AdminArtisanPayload = {
  success?: boolean;
  pending?: LiveAdminArtisan[];
  artisans?: LiveAdminArtisan[];
  metrics?: {
    pending: number;
    active: number;
    removed: number;
    rejected: number;
  };
  message?: string;
};

type LiveAdminJob = {
  id: string;
  shortId: string;
  trade: string;
  description: string;
  town: string;
  district: string;
  client: string;
  status: "open" | "claimed" | "completed" | "expired" | string;
  urgency: "urgent" | "planned" | string;
  assignedTo: string;
  assignedArtisanId: number | null;
  createdAt: string;
  age: string;
  expiresAt: string | null;
  claimedAt: string | null;
  hasPhoto: boolean;
  photoStoragePath: string | null;
  cleanupEligible: boolean;
  notificationCount: number;
  pendingNotificationCount: number;
  claimedNotificationCount: number;
};

type AdminJobsPayload = {
  success?: boolean;
  jobs?: LiveAdminJob[];
  metrics?: {
    total: number;
    open: number;
    claimed: number;
    completed: number;
    expired: number;
    cleanup: number;
  };
  message?: string;
};

const emptyArtisanMetrics = { pending: 0, active: 0, removed: 0, rejected: 0 };
const emptyJobMetrics = { total: 0, open: 0, claimed: 0, completed: 0, expired: 0, cleanup: 0 };

type MonthlyStat = {
  month: string;
  jobs_posted: number;
  jobs_claimed: number;
  jobs_completed: number;
  jobs_expired: number;
  leads_sent: number;
  contacts_revealed: number;
  by_trade: Record<string, number>;
  by_district: Record<string, number>;
};

type AuditEntry = {
  id: string;
  event: string;
  job_id: string | null;
  artisan_id: number | null;
  metadata: Record<string, unknown> | null;
  timestamp: string;
};

type SuperStatsPayload = {
  success?: boolean;
  monthly?: MonthlyStat[];
  live?: {
    jobs: Record<string, number>;
    artisans: Record<string, number>;
  };
  audit?: AuditEntry[];
  retention?: { completed: string; claimed: string; expired: string; cadence: string };
  message?: string;
};

type SuperMutationPayload = {
  success?: boolean;
  message?: string;
  job?: Partial<LiveAdminJob> & { id: string; status: string };
};

type JobEditForm = {
  description: string;
  district: string;
  town: string;
  urgency: string;
  category: string;
};

type ArtisanEditForm = {
  nom: string;
  tel: string;
  metier: string;
  ville: string;
  district: string;
  bio: string;
  application_email: string;
  is_available_today: boolean;
  is_verified: boolean;
};

const districtOptionsAdmin = [
  "Port Louis", "Pamplemousses", "Riviere du Rempart", "Flacq", "Grand Port",
  "Savanne", "Plaines Wilhems", "Moka", "Black River", "Rodrigues",
];

const tradeOptionsAdmin = [
  "Plumber", "Electrician", "Painter", "Carpenter", "Mason",
  "AC technician", "Locksmith", "Gardener", "Other",
];

/* ─────────────────────────── small helpers ─────────────────────────── */

function statusTone(status: string) {
  switch (status.toLowerCase()) {
    case "approved":
    case "completed":
    case "claimed":
    case "live":
      return "bg-[var(--green-soft)] text-[var(--green-strong)]";
    case "pending":
    case "open":
      return "bg-[#fff4e0] text-[#8a6a1f]";
    case "rejected":
    case "removed":
    case "expired":
      return "bg-[#fdecec] text-[var(--rose)]";
    default:
      return "bg-[#eef1ef] text-[var(--muted)]";
  }
}

function ageLabel(value: string) {
  const created = new Date(value).getTime();
  if (!Number.isFinite(created)) return "Recently";
  const diffMinutes = Math.max(1, Math.round((Date.now() - created) / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 48) return `${diffHours}h ago`;
  return `${Math.round(diffHours / 24)}d ago`;
}

function digitsOnly(phone: string) {
  return phone.replace(/\D/g, "");
}

/* ─────────────────────────── presentational ─────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusTone(status)}`}>
      {status}
    </span>
  );
}

function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--muted)] ${className}`}
    >
      {children}
    </span>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
  onClick,
}: {
  label: string;
  value: number;
  icon: typeof ShieldCheck;
  tone: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--green)] hover:shadow-md"
    >
      <div className="min-w-0">
        <p className="truncate text-sm text-[var(--muted)]">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-[var(--ink)]">{value}</p>
      </div>
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
    </button>
  );
}

function EmptyState({
  icon: Icon = Inbox,
  title,
  copy,
  action,
}: {
  icon?: typeof Inbox;
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] p-8 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--green-soft)] text-[var(--green-strong)]">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[var(--ink)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">{copy}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-[#e6c4be] bg-[#fdecec] p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--rose)]">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-[var(--ink)]">Something went wrong</h3>
          <p className="mt-1 text-sm leading-6 text-[#8a4a4a]">{message}</p>
          <button type="button" onClick={onRetry} className="btn btn-secondary mt-3 h-10 px-4 text-sm">
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="h-5 w-40 rounded bg-[#ece7dc]" />
        <div className="h-5 w-16 rounded-full bg-[#ece7dc]" />
      </div>
      <div className="mt-3 h-3 w-2/3 rounded bg-[#ece7dc]" />
      <div className="mt-4 h-3 w-full rounded bg-[#f0ece3]" />
      <div className="mt-2 h-3 w-5/6 rounded bg-[#f0ece3]" />
      <div className="mt-4 flex gap-2">
        <div className="h-10 w-28 rounded-xl bg-[#ece7dc]" />
        <div className="h-10 w-28 rounded-xl bg-[#f0ece3]" />
      </div>
    </div>
  );
}

function LoadingList() {
  return (
    <div className="grid gap-3">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

/* ─────────────────────────── toasts ─────────────────────────── */

type Toast = { id: number; tone: "success" | "error"; message: string };

function Toaster({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg ${
            toast.tone === "success"
              ? "border-[var(--green)]/30 bg-[var(--surface)]"
              : "border-[#e6c4be] bg-[#fdecec]"
          }`}
        >
          <span
            className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
              toast.tone === "success" ? "bg-[var(--green-soft)] text-[var(--green-strong)]" : "bg-white text-[var(--rose)]"
            }`}
          >
            {toast.tone === "success" ? (
              <CheckCircle2 className="size-4" aria-hidden="true" />
            ) : (
              <AlertTriangle className="size-4" aria-hidden="true" />
            )}
          </span>
          <p className="min-w-0 flex-1 text-sm font-medium text-[var(--ink)]">{toast.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="-mr-1 shrink-0 rounded-md p-0.5 text-[var(--muted)] hover:text-[var(--ink)]"
            aria-label="Dismiss"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────── confirm dialog ─────────────────────────── */

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  onConfirm: () => void;
};

function ConfirmDialog({ state, onClose }: { state: ConfirmState | null; onClose: () => void }) {
  useEffect(() => {
    if (!state) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, onClose]);

  if (!state) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0d1612]/45 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={state.title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
              state.danger ? "bg-[#fdecec] text-[var(--rose)]" : "bg-[var(--green-soft)] text-[var(--green-strong)]"
            }`}
          >
            <AlertTriangle className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-[var(--ink)]">{state.title}</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{state.message}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn btn-secondary h-11 px-4 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              state.onConfirm();
              onClose();
            }}
            className={`btn h-11 px-4 text-sm text-white ${
              state.danger
                ? "bg-[var(--rose)] hover:bg-[#8a3f3f]"
                : "bg-[var(--green)] hover:bg-[var(--green-hover)]"
            }`}
          >
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── review card ─────────────────────────── */

function ReviewCard({
  artisan,
  badge,
  busyAction,
  onBadge,
  onApprove,
  onReject,
  onView,
}: {
  artisan: LiveAdminArtisan;
  badge: string;
  busyAction: string;
  onBadge: (badge: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onView: () => void;
}) {
  const approving = busyAction === "approve";
  const rejecting = busyAction === "reject";
  const busy = Boolean(busyAction);

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-[var(--ink)]">{artisan.name}</h3>
            <StatusBadge status={artisan.status} />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--muted)]">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            {artisan.trade} · {artisan.town}, {artisan.district}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm font-medium text-[var(--green-strong)]">{ageLabel(artisan.createdAt)}</span>
          <button
            type="button"
            onClick={onView}
            className="btn btn-secondary h-9 px-3 text-xs"
            aria-label={`View ${artisan.name} details`}
          >
            <Eye className="size-3.5" aria-hidden="true" />
            Details
          </button>
        </div>
      </div>

      {artisan.bio ? <p className="mt-3 text-sm leading-6 text-[#3f4a45]">{artisan.bio}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Pill>
          <Phone className="size-3.5" aria-hidden="true" />
          {artisan.phone || "No phone"}
        </Pill>
        <Pill>
          <Mail className="size-3.5" aria-hidden="true" />
          {artisan.email || "No email"}
        </Pill>
        <Pill>
          <ImageIcon className="size-3.5" aria-hidden="true" />
          {artisan.photoCount} photos
        </Pill>
        {artisan.serviceTags.slice(0, 4).map((tag) => (
          <Pill key={tag}>{tag}</Pill>
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center">
        <label className="flex h-11 min-w-0 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 text-sm">
          <BadgeCheck className="size-4 shrink-0 text-[var(--blue)]" aria-hidden="true" />
          <select
            className="min-w-0 flex-1 bg-transparent outline-none"
            value={badge}
            onChange={(event) => onBadge(event.target.value)}
            disabled={busy}
            aria-label="Badge to grant on approval"
          >
            <option>No extra badge</option>
            {badgeOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <a
          href={`https://wa.me/${digitsOnly(artisan.phone)}`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary h-11 px-4 text-sm"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          WhatsApp
        </a>
        <button
          type="button"
          onClick={onReject}
          disabled={busy}
          className="btn h-11 border border-[#e6c4be] bg-[#fdecec] px-4 text-sm text-[var(--rose)] hover:bg-[#f9dcd8] disabled:opacity-60"
        >
          {rejecting ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : <X className="size-4" aria-hidden="true" />}
          {rejecting ? "Rejecting" : "Reject"}
        </button>
        <button
          type="button"
          onClick={onApprove}
          disabled={busy}
          className="btn btn-primary h-11 px-4 text-sm disabled:opacity-60"
        >
          {approving ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
          {approving ? "Approving" : "Approve"}
        </button>
      </div>
    </article>
  );
}

/* ─────────────────────────── ads (house ads + AdSense) ─────────────────────────── */

type SiteAd = {
  id: string;
  title: string;
  body: string;
  href: string;
  image_url: string;
  placement: string;
  active: boolean;
  created_at: string;
};

const adPlacementOptions = [
  { value: "browse", label: "Browse artisans — /browse" },
  { value: "jobs", label: "Job board — /jobs" },
  { value: "post", label: "Post a job — /post" },
  { value: "home", label: "Homepage — /" },
];

function AdsPanel({ adminPassword }: { adminPassword: string }) {
  const adsenseConfigured = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID);
  const [ads, setAds] = useState<SiteAd[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [adsError, setAdsError] = useState("");
  const [saving, setSaving] = useState(false);
  const [mutatingAd, setMutatingAd] = useState("");
  const [adForm, setAdForm] = useState({ title: "", body: "", href: "", placement: "browse" });

  const loadAds = useCallback(async () => {
    setLoadingAds(true);
    setAdsError("");
    try {
      const payload = await invokePublicFunction<{ success?: boolean; ads?: SiteAd[]; message?: string }>(
        "artisanmu-admin-content",
        { admin_password: adminPassword, action: "list_ads" },
      );
      setAds(payload.ads || []);
    } catch (error) {
      setAdsError(error instanceof Error ? error.message : "Could not load ads.");
    } finally {
      setLoadingAds(false);
    }
  }, [adminPassword]);

  useEffect(() => {
    queueMicrotask(() => void loadAds());
  }, [loadAds]);

  async function createAd() {
    if (!adForm.title.trim()) {
      setAdsError("Give the ad a title first.");
      return;
    }
    setSaving(true);
    setAdsError("");
    try {
      const payload = await invokePublicFunction<{ success?: boolean; ad?: SiteAd; message?: string }>(
        "artisanmu-admin-content",
        {
          admin_password: adminPassword,
          action: "create_ad",
          title: adForm.title,
          body: adForm.body,
          href: adForm.href,
          placement: adForm.placement,
        },
      );
      if (payload.ad) {
        setAds((current) => [payload.ad as SiteAd, ...current]);
        setAdForm({ title: "", body: "", href: "", placement: adForm.placement });
      }
    } catch (error) {
      setAdsError(error instanceof Error ? error.message : "Could not create the ad.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAd(ad: SiteAd) {
    setMutatingAd(ad.id);
    try {
      const payload = await invokePublicFunction<{ success?: boolean; ad?: SiteAd }>(
        "artisanmu-admin-content",
        { admin_password: adminPassword, action: "update_ad", ad_id: ad.id, active: !ad.active },
      );
      if (payload.ad) {
        setAds((current) => current.map((item) => (item.id === ad.id ? (payload.ad as SiteAd) : item)));
      }
    } catch (error) {
      setAdsError(error instanceof Error ? error.message : "Could not update the ad.");
    } finally {
      setMutatingAd("");
    }
  }

  async function deleteAd(ad: SiteAd) {
    if (!window.confirm(`Delete the ad "${ad.title}"? This cannot be undone.`)) return;
    setMutatingAd(ad.id);
    try {
      await invokePublicFunction("artisanmu-admin-content", {
        admin_password: adminPassword,
        action: "delete_ad",
        ad_id: ad.id,
      });
      setAds((current) => current.filter((item) => item.id !== ad.id));
    } catch (error) {
      setAdsError(error instanceof Error ? error.message : "Could not delete the ad.");
    } finally {
      setMutatingAd("");
    }
  }

  return (
    <div className="grid gap-4">
      {/* AdSense status */}
      <div
        className={`rounded-2xl border p-5 shadow-sm ${
          adsenseConfigured ? "border-[var(--green)]/30 bg-[var(--green-soft)]" : "border-[var(--line)] bg-[var(--surface)]"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--green-soft)] text-[var(--green-strong)]">
              <Megaphone className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-[var(--ink)]">Google AdSense</h3>
              <p className="text-sm text-[var(--muted)]">Automatic banner monetization (optional).</p>
            </div>
          </div>
          <StatusBadge status={adsenseConfigured ? "Live" : "Inactive"} />
        </div>
        {!adsenseConfigured ? (
          <p className="mt-3 text-sm leading-6 text-[#3f4a45]">
            To enable AdSense set{" "}
            <code className="rounded-md bg-[#f0ece3] px-1.5 py-0.5 font-mono text-xs text-[var(--ink)]">
              NEXT_PUBLIC_ADSENSE_CLIENT_ID
            </code>{" "}
            in the host and redeploy. House ads below work independently and are live now.
          </p>
        ) : null}
      </div>

      {/* Create house ad */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
        <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--ink)]">
          <Plus className="size-4 text-[var(--green-strong)]" aria-hidden="true" />
          New house ad
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Sell banner spots to local businesses (Rs 2,000 / month) — no AdSense needed. Active ads
          render instantly on the chosen page.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-[var(--ink)]">
            Title
            <input
              value={adForm.title}
              onChange={(event) => setAdForm((current) => ({ ...current, title: event.target.value }))}
              maxLength={80}
              className="mt-1.5 h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--green)]"
              placeholder="e.g. Espace Maison — Quincaillerie"
            />
          </label>
          <label className="block text-sm font-medium text-[var(--ink)]">
            Placement
            <select
              value={adForm.placement}
              onChange={(event) => setAdForm((current) => ({ ...current, placement: event.target.value }))}
              className="mt-1.5 h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--green)]"
            >
              {adPlacementOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-[var(--ink)] sm:col-span-2">
            Text (optional)
            <input
              value={adForm.body}
              onChange={(event) => setAdForm((current) => ({ ...current, body: event.target.value }))}
              maxLength={200}
              className="mt-1.5 h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--green)]"
              placeholder="Short pitch shown under the title"
            />
          </label>
          <label className="block text-sm font-medium text-[var(--ink)] sm:col-span-2">
            Link (optional)
            <input
              value={adForm.href}
              onChange={(event) => setAdForm((current) => ({ ...current, href: event.target.value }))}
              maxLength={300}
              inputMode="url"
              className="mt-1.5 h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--green)]"
              placeholder="https://..."
            />
          </label>
        </div>
        <button
          type="button"
          onClick={createAd}
          disabled={saving || !adForm.title.trim()}
          className="btn btn-primary mt-4 h-11 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Publishing…" : "Publish ad"}
        </button>
      </div>

      {adsError ? <ErrorState message={adsError} onRetry={loadAds} /> : null}

      {/* House ads list */}
      {loadingAds ? (
        <LoadingList />
      ) : ads.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {ads.map((ad) => (
            <article key={ad.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="truncate font-semibold text-[var(--ink)]">{ad.title}</h4>
                  {ad.body ? <p className="mt-0.5 text-sm leading-5 text-[var(--muted)]">{ad.body}</p> : null}
                </div>
                <StatusBadge status={ad.active ? "Live" : "Paused"} />
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                <span className="rounded-full bg-[var(--surface-soft)] px-2 py-1 font-semibold">
                  {adPlacementOptions.find((option) => option.value === ad.placement)?.label || ad.placement}
                </span>
                {ad.href ? (
                  <a
                    href={ad.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-[var(--green-strong)] hover:underline"
                  >
                    Link <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                ) : null}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleAd(ad)}
                  disabled={mutatingAd === ad.id}
                  className="btn btn-secondary h-9 flex-1 px-3 text-xs disabled:opacity-60"
                >
                  <Power className="size-3.5" aria-hidden="true" />
                  {ad.active ? "Pause" : "Activate"}
                </button>
                <button
                  type="button"
                  onClick={() => deleteAd(ad)}
                  disabled={mutatingAd === ad.id}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#e4bbb4] bg-white px-3 text-xs font-semibold text-[var(--rose)] transition hover:bg-[#fff4f2] disabled:opacity-60"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Megaphone}
          title="No house ads yet"
          copy="Publish your first local sponsor above — it appears on the public page the moment it is live."
        />
      )}

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-5">
        <h4 className="flex items-center gap-2 font-semibold text-[var(--ink)]">
          <Sparkles className="size-4 text-[var(--gold)]" aria-hidden="true" />
          Monetization roadmap
        </h4>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-[#3f4a45] sm:grid-cols-3">
          <li className="rounded-xl bg-[var(--surface)] px-3 py-2">Verification badge — Rs 500 one-time</li>
          <li className="rounded-xl bg-[var(--surface)] px-3 py-2">Showcase listing — Rs 100 / 30 days</li>
          <li className="rounded-xl bg-[var(--surface)] px-3 py-2">Local banner ads — Rs 2,000 / month</li>
        </ul>
      </div>
    </div>
  );
}

/* ─────────────────────────── artisan detail modal ─────────────────────────── */

function ArtisanDetailModal({
  artisan,
  reviews,
  loadingReviews,
  reviewsError,
  mutatingContent,
  onClose,
  onDeletePhoto,
  onDeleteReview,
  onToggleVisibility,
  onDeactivate,
  onReactivate,
  onDeleteArtisan,
  accountWorking,
  accountMessage,
}: {
  artisan: LiveAdminArtisan;
  reviews: AdminReview[];
  loadingReviews: boolean;
  reviewsError: string;
  mutatingContent: string;
  onClose: () => void;
  onDeletePhoto: (photoUrl: string) => void;
  onDeleteReview: (reviewId: number) => void;
  onToggleVisibility: (reviewId: number, isVisible: boolean) => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onDeleteArtisan: () => void;
  accountWorking: boolean;
  accountMessage: string;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const extraBadges = artisan.badges.filter((badge) => badge !== "Verified");

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end justify-center bg-[#0d1612]/45 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${artisan.name} details`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-[var(--surface)] shadow-2xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] p-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-[var(--ink)]">{artisan.name}</h2>
              <StatusBadge status={artisan.status} />
              {!artisan.hasAuthUser ? (
                <span className="rounded-full bg-[#fdecec] px-2.5 py-0.5 text-xs font-semibold text-[var(--rose)]">no login</span>
              ) : null}
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--muted)]">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              {artisan.trade} · {artisan.town}, {artisan.district}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid gap-2 sm:grid-cols-2">
            <a
              href={`https://wa.me/${digitsOnly(artisan.phone)}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm font-medium text-[var(--ink)] hover:border-[var(--green)]"
            >
              <MessageCircle className="size-4 text-[var(--green)]" aria-hidden="true" />
              {artisan.phone || "No phone"}
            </a>
            <a
              href={`tel:${digitsOnly(artisan.phone)}`}
              className="flex h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm font-medium text-[var(--ink)] hover:border-[var(--green)]"
            >
              <Phone className="size-4 text-[var(--green)]" aria-hidden="true" />
              Call
            </a>
            <span className="flex h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm text-[var(--muted)]">
              <Mail className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{artisan.email || "No email"}</span>
            </span>
            <span className="flex h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm text-[var(--muted)]">
              <Star className="size-4 shrink-0 text-[#c79b55]" aria-hidden="true" />
              {artisan.rating > 0 ? `${artisan.rating} · ` : ""}
              {artisan.reviews} reviews
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Pill>{artisan.available ? "Available today" : "Not available"}</Pill>
            <Pill>Joined {new Date(artisan.createdAt).toLocaleDateString()}</Pill>
            {artisan.reviewedAt ? <Pill>Reviewed {new Date(artisan.reviewedAt).toLocaleDateString()}</Pill> : null}
          </div>

          {artisan.bio ? (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa19c]">About</p>
              <p className="mt-1 text-sm leading-6 text-[#3f4a45]">{artisan.bio}</p>
            </div>
          ) : null}

          {artisan.specialties.length || artisan.serviceTags.length ? (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa19c]">Specialties &amp; services</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {artisan.specialties.map((item) => (
                  <Pill key={`s-${item}`}>{item}</Pill>
                ))}
                {artisan.serviceTags.map((item) => (
                  <Pill key={`t-${item}`}>{item}</Pill>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa19c]">Badges</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {artisan.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--green-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--green-strong)]">
                  <BadgeCheck className="size-3.5" aria-hidden="true" />
                  Verified
                </span>
              ) : null}
              {extraBadges.map((badge) => (
                <span key={badge} className="inline-flex items-center gap-1 rounded-full bg-[var(--green-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--green-strong)]">
                  <BadgeCheck className="size-3.5" aria-hidden="true" />
                  {badge}
                </span>
              ))}
              {!artisan.verified && extraBadges.length === 0 ? (
                <span className="text-sm text-[var(--muted)]">No badges</span>
              ) : null}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa19c]">
              Portfolio photos ({artisan.photos.length})
            </p>
            {artisan.photos.length ? (
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {artisan.photos.map((url) => {
                  const deleting = mutatingContent === `photo:${url}`;
                  return (
                    <div
                      key={url}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-soft)]"
                    >
                      <Image src={url} alt="Portfolio work" fill sizes="200px" className="object-cover" />
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() => onDeletePhoto(url)}
                        aria-label="Delete photo"
                        className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-lg bg-[#0d1612]/70 text-white opacity-0 transition hover:bg-[var(--rose)] group-hover:opacity-100 disabled:opacity-100"
                      >
                        {deleting ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] px-3 py-4 text-center text-sm text-[var(--muted)]">
                No portfolio photos.
              </p>
            )}
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa19c]">Reviews</p>
            {loadingReviews ? (
              <p className="mt-2 text-sm text-[var(--muted)]">Loading reviews…</p>
            ) : reviewsError ? (
              <p className="mt-2 rounded-xl border border-[#e6c4be] bg-[#fdecec] px-3 py-2 text-sm text-[var(--rose)]">{reviewsError}</p>
            ) : reviews.length ? (
              <ul className="mt-2 grid gap-2">
                {reviews.map((review) => {
                  const deleting = mutatingContent === `review:${review.id}`;
                  const togglingVisibility = mutatingContent === `review-visibility:${review.id}`;
                  const hidden = review.is_visible === false;
                  return (
                    <li
                      key={review.id}
                      className={`rounded-xl border border-[var(--line)] p-3 ${hidden ? "bg-[#f3efe6] opacity-70" : "bg-[var(--surface-soft)]"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-[var(--ink)]">{review.author_name || "Client"}</span>
                            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#8a6a1f]">
                              <Star className="size-3.5 fill-[#c79b55] text-[#c79b55]" aria-hidden="true" />
                              {review.rating}/5
                            </span>
                            {hidden ? (
                              <span className="rounded-full bg-[#eef1ef] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted)]">Hidden</span>
                            ) : null}
                          </div>
                          {review.comment ? <p className="mt-1 text-sm leading-5 text-[#3f4a45]">{review.comment}</p> : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            disabled={togglingVisibility || deleting}
                            onClick={() => onToggleVisibility(review.id, hidden)}
                            aria-label={hidden ? "Show review" : "Hide review"}
                            title={hidden ? "Show review" : "Hide review"}
                            className="btn btn-secondary h-9 px-3 text-xs disabled:opacity-60"
                          >
                            {togglingVisibility ? (
                              <RefreshCw className="size-3.5 animate-spin" aria-hidden="true" />
                            ) : hidden ? (
                              <Eye className="size-3.5" aria-hidden="true" />
                            ) : (
                              <EyeOff className="size-3.5" aria-hidden="true" />
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={deleting || togglingVisibility}
                            onClick={() => onDeleteReview(review.id)}
                            aria-label="Delete review"
                            title="Delete review"
                            className="btn btn-secondary h-9 px-3 text-xs text-[var(--rose)] hover:border-[var(--rose)] disabled:opacity-60"
                          >
                            {deleting ? <RefreshCw className="size-3.5 animate-spin" aria-hidden="true" /> : <Trash2 className="size-3.5" aria-hidden="true" />}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[var(--muted)]">No reviews yet.</p>
            )}
          </div>

          {/* ── Admin account actions ─────────────────────── */}
          <div className="mt-5 border-t border-[var(--line)] pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa19c]">Account management</p>
            {accountMessage ? (
              <p className="mt-2 rounded-xl border border-[var(--line)] bg-[#fff8e8] px-3 py-2 text-sm font-medium text-[#78511c]">
                {accountMessage}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-3">
              {artisan.deactivatedAt ? (
                <button
                  type="button"
                  disabled={accountWorking}
                  onClick={onReactivate}
                  className="btn btn-primary h-9 px-3 text-sm"
                >
                  {accountWorking ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : null}
                  Reactivate
                </button>
              ) : (
                <button
                  type="button"
                  disabled={accountWorking}
                  onClick={() => {
                    if (window.confirm(`Deactivate ${artisan.name}? Their profile will be hidden from public listing.`)) {
                      onDeactivate();
                    }
                  }}
                  className="btn btn-secondary h-9 px-3 text-sm"
                >
                  {accountWorking ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : null}
                  Deactivate
                </button>
              )}
              <button
                type="button"
                disabled={accountWorking}
                onClick={() => {
                  if (window.confirm(`Permanently delete ${artisan.name}? This cannot be undone — all data, photos, and reviews will be removed.`)) {
                    onDeleteArtisan();
                  }
                }}
                className="btn btn-secondary h-9 px-3 text-sm text-[var(--rose)] hover:border-[var(--rose)]"
              >
                {accountWorking ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : null}
                Delete artisan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── main console ─────────────────────────── */

/* ─────────────────────────── superadmin modals ─────────────────────────── */

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{children}</span>;
}

const adminInputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--green)] focus:ring-2 focus:ring-[var(--green)]/20";

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[65] flex items-end justify-center bg-[var(--ink)]/45 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl text-[var(--ink)]">{title}</h3>
            <p className="mt-0.5 text-sm text-[var(--muted)]">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function JobEditModal({
  job,
  saving,
  onClose,
  onSave,
}: {
  job: LiveAdminJob;
  saving: boolean;
  onClose: () => void;
  onSave: (patch: Partial<JobEditForm>) => void;
}) {
  const [form, setForm] = useState<JobEditForm>({
    description: job.description || "",
    district: job.district || "Plaines Wilhems",
    town: job.town || "",
    urgency: job.urgency || "planned",
    category: job.trade || "Plumber",
  });

  return (
    <ModalShell title={`Edit job #${job.shortId}`} subtitle="Superadmin — changes apply immediately." onClose={onClose}>
      <div className="mt-4 grid gap-3">
        <label className="block">
          <FieldLabel>Description</FieldLabel>
          <textarea
            value={form.description}
            onChange={(event) => setForm((f) => ({ ...f, description: event.target.value }))}
            rows={4}
            className={`${adminInputClass} h-auto resize-none py-2 leading-6`}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <FieldLabel>Trade</FieldLabel>
            <select
              value={form.category}
              onChange={(event) => setForm((f) => ({ ...f, category: event.target.value }))}
              className={adminInputClass}
            >
              {tradeOptionsAdmin.map((trade) => (
                <option key={trade}>{trade}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <FieldLabel>Urgency</FieldLabel>
            <select
              value={form.urgency}
              onChange={(event) => setForm((f) => ({ ...f, urgency: event.target.value }))}
              className={adminInputClass}
            >
              <option value="urgent">urgent</option>
              <option value="planned">planned</option>
            </select>
          </label>
          <label className="block">
            <FieldLabel>District</FieldLabel>
            <select
              value={form.district}
              onChange={(event) => setForm((f) => ({ ...f, district: event.target.value }))}
              className={adminInputClass}
            >
              {districtOptionsAdmin.map((district) => (
                <option key={district}>{district}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <FieldLabel>Town</FieldLabel>
            <input
              value={form.town}
              onChange={(event) => setForm((f) => ({ ...f, town: event.target.value }))}
              className={adminInputClass}
            />
          </label>
        </div>
        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn btn-secondary h-11 px-4 text-sm">
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || form.description.trim().length < 10}
            onClick={() => onSave(form)}
            className="btn btn-primary h-11 px-4 text-sm disabled:opacity-60"
          >
            {saving ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : <Pencil className="size-4" aria-hidden="true" />}
            Save changes
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ArtisanEditModal({
  artisan,
  saving,
  onClose,
  onSave,
}: {
  artisan: LiveAdminArtisan;
  saving: boolean;
  onClose: () => void;
  onSave: (patch: ArtisanEditForm) => void;
}) {
  const [form, setForm] = useState<ArtisanEditForm>({
    nom: artisan.name || "",
    tel: artisan.phone || "",
    metier: artisan.trade || "Plumber",
    ville: artisan.town || "",
    district: artisan.district || "Plaines Wilhems",
    bio: artisan.bio || "",
    application_email: artisan.email || "",
    is_available_today: artisan.available,
    is_verified: artisan.verified,
  });

  return (
    <ModalShell title={`Edit ${artisan.name}`} subtitle="Superadmin — edits the live profile directly." onClose={onClose}>
      <div className="mt-4 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <FieldLabel>Name</FieldLabel>
            <input value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} className={adminInputClass} />
          </label>
          <label className="block">
            <FieldLabel>Phone (+230)</FieldLabel>
            <input value={form.tel} onChange={(e) => setForm((f) => ({ ...f, tel: e.target.value }))} className={adminInputClass} />
          </label>
          <label className="block">
            <FieldLabel>Trade</FieldLabel>
            <select value={form.metier} onChange={(e) => setForm((f) => ({ ...f, metier: e.target.value }))} className={adminInputClass}>
              {tradeOptionsAdmin.map((trade) => (
                <option key={trade}>{trade}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <FieldLabel>District</FieldLabel>
            <select value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} className={adminInputClass}>
              {districtOptionsAdmin.map((district) => (
                <option key={district}>{district}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <FieldLabel>Town</FieldLabel>
            <input value={form.ville} onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value }))} className={adminInputClass} />
          </label>
          <label className="block">
            <FieldLabel>Email</FieldLabel>
            <input value={form.application_email} onChange={(e) => setForm((f) => ({ ...f, application_email: e.target.value }))} className={adminInputClass} />
          </label>
        </div>
        <label className="block">
          <FieldLabel>Bio (30–700 chars)</FieldLabel>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            rows={4}
            className={`${adminInputClass} h-auto resize-none py-2 leading-6`}
          />
        </label>
        <div className="flex flex-wrap gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--ink)]">
            <input
              type="checkbox"
              checked={form.is_available_today}
              onChange={(e) => setForm((f) => ({ ...f, is_available_today: e.target.checked }))}
              className="size-4 accent-[var(--green)]"
            />
            Available today
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--ink)]">
            <input
              type="checkbox"
              checked={form.is_verified}
              onChange={(e) => setForm((f) => ({ ...f, is_verified: e.target.checked }))}
              className="size-4 accent-[var(--green)]"
            />
            Verified badge
          </label>
        </div>
        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn btn-secondary h-11 px-4 text-sm">
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave(form)}
            className="btn btn-primary h-11 px-4 text-sm disabled:opacity-60"
          >
            {saving ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : <Pencil className="size-4" aria-hidden="true" />}
            Save profile
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ─────────────────────────── overview widgets ─────────────────────────── */

const monthShort = (value: string) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString("en-GB", { month: "short" })
    : value.slice(5, 7);
};

function MonthlyChart({ monthly }: { monthly: MonthlyStat[] }) {
  const series = [
    { key: "jobs_posted" as const, label: "Posted", color: "var(--green)" },
    { key: "jobs_claimed" as const, label: "Claimed", color: "var(--blue)" },
    { key: "jobs_completed" as const, label: "Completed", color: "var(--gold)" },
    { key: "jobs_expired" as const, label: "Expired", color: "var(--urgent)" },
  ];
  const max = Math.max(1, ...monthly.flatMap((row) => series.map((s) => row[s.key])));

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)]">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-end gap-2 overflow-x-auto pb-1" style={{ height: "10rem" }}>
        {monthly.map((row) => (
          <div key={row.month} className="flex min-w-12 flex-1 flex-col items-center gap-1.5">
            <div className="flex h-full w-full items-end justify-center gap-1">
              {series.map((s) => (
                <div
                  key={s.key}
                  title={`${s.label}: ${row[s.key]}`}
                  className="w-2.5 rounded-t-md transition-all sm:w-3"
                  style={{
                    backgroundColor: s.color,
                    height: `${Math.max(3, Math.round((row[s.key] / max) * 100))}%`,
                    opacity: row[s.key] ? 1 : 0.18,
                  }}
                />
              ))}
            </div>
            <span className="text-[11px] font-semibold text-[var(--muted)]">{monthShort(row.month)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function auditLabel(entry: AuditEntry) {
  const event = entry.event.replace(/^admin_super_/, "").replace(/^admin_/, "").replace(/_/g, " ");
  return event.charAt(0).toUpperCase() + event.slice(1);
}

export function AdminConsole({ adminPassword, onLogout }: { adminPassword: string; onLogout?: () => void }) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [query, setQuery] = useState("");
  const [artisanStatusFilter, setArtisanStatusFilter] = useState<"all" | "approved" | "rejected" | "removed">("all");
  const [jobStatusFilter, setJobStatusFilter] = useState<"all" | "open" | "claimed" | "completed" | "expired">("all");

  const [pendingArtisans, setPendingArtisans] = useState<LiveAdminArtisan[]>([]);
  const [managedArtisans, setManagedArtisans] = useState<LiveAdminArtisan[]>([]);
  const [artisanMetrics, setArtisanMetrics] = useState(emptyArtisanMetrics);
  const [reviewBadges, setReviewBadges] = useState<Record<string, string>>({});
  const [loadingArtisans, setLoadingArtisans] = useState(true);
  const [artisanError, setArtisanError] = useState("");
  const [mutatingArtisan, setMutatingArtisan] = useState(""); // `${action}:${id}`

  const [liveJobs, setLiveJobs] = useState<LiveAdminJob[]>([]);
  const [jobMetrics, setJobMetrics] = useState(emptyJobMetrics);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState("");
  const [mutatingJob, setMutatingJob] = useState(""); // `${action}:${id}`

  // Superadmin: analytics + full CRUD
  const [stats, setStats] = useState<SuperStatsPayload | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [editJob, setEditJob] = useState<LiveAdminJob | null>(null);
  const [editArtisan, setEditArtisan] = useState<LiveAdminArtisan | null>(null);
  const [superSaving, setSuperSaving] = useState(false);

  const [detailArtisan, setDetailArtisan] = useState<LiveAdminArtisan | null>(null);
  const [detailReviews, setDetailReviews] = useState<AdminReview[]>([]);
  const [loadingDetailReviews, setLoadingDetailReviews] = useState(false);
  const [detailReviewsError, setDetailReviewsError] = useState("");
  const [mutatingContent, setMutatingContent] = useState(""); // `photo:${url}` | `review:${id}`

  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const pushToast = useCallback((tone: "success" | "error", message: string) => {
    const id = (toastIdRef.current += 1);
    setToasts((current) => [...current, { id, tone, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const applyArtisanPayload = useCallback((payload: AdminArtisanPayload) => {
    setPendingArtisans((payload.pending || []).map((a) => ({ ...a, serviceTags: a.serviceTags || [] })));
    setManagedArtisans((payload.artisans || []).map((a) => ({ ...a, serviceTags: a.serviceTags || [] })));
    setArtisanMetrics(payload.metrics || emptyArtisanMetrics);
  }, []);

  const applyJobsPayload = useCallback((payload: AdminJobsPayload) => {
    setLiveJobs(payload.jobs || []);
    setJobMetrics(payload.metrics || emptyJobMetrics);
  }, []);

  const loadArtisans = useCallback(async () => {
    setLoadingArtisans(true);
    setArtisanError("");
    try {
      const payload = await invokePublicFunction<AdminArtisanPayload>("artisanmu-admin-artisans", {
        admin_password: adminPassword,
        action: "list",
      });
      applyArtisanPayload(payload);
    } catch (error) {
      setArtisanError(error instanceof Error ? error.message : "Could not load artisan applications.");
      setPendingArtisans([]);
      setManagedArtisans([]);
      setArtisanMetrics(emptyArtisanMetrics);
    } finally {
      setLoadingArtisans(false);
    }
  }, [adminPassword, applyArtisanPayload]);

  const loadJobs = useCallback(async () => {
    setLoadingJobs(true);
    setJobsError("");
    try {
      const payload = await invokePublicFunction<AdminJobsPayload>("artisanmu-admin-jobs", {
        admin_password: adminPassword,
        action: "list",
      });
      applyJobsPayload(payload);
    } catch (error) {
      setJobsError(error instanceof Error ? error.message : "Could not load job requests.");
      setLiveJobs([]);
      setJobMetrics(emptyJobMetrics);
    } finally {
      setLoadingJobs(false);
    }
  }, [adminPassword, applyJobsPayload]);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    setStatsError("");
    try {
      const payload = await invokePublicFunction<SuperStatsPayload>("artisanmu-admin-super", {
        admin_password: adminPassword,
        action: "stats",
      });
      setStats(payload);
    } catch (error) {
      setStatsError(error instanceof Error ? error.message : "Could not load analytics.");
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, [adminPassword]);

  // Superadmin mutations (artisanmu-admin-super) — refresh lists after success.
  async function superJobAction(
    action: "set_job_status" | "delete_job",
    jobId: string,
    extra: Record<string, unknown>,
    successMessage: string,
  ) {
    setMutatingJob(`${action}:${jobId}`);
    try {
      await invokePublicFunction<SuperMutationPayload>("artisanmu-admin-super", {
        admin_password: adminPassword,
        action,
        job_id: jobId,
        ...extra,
      });
      pushToast("success", successMessage);
      void loadJobs();
      void loadStats();
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Superadmin action failed.");
    } finally {
      setMutatingJob("");
    }
  }

  async function superUpdateJob(jobId: string, patch: Partial<JobEditForm>) {
    setSuperSaving(true);
    try {
      await invokePublicFunction<SuperMutationPayload>("artisanmu-admin-super", {
        admin_password: adminPassword,
        action: "update_job",
        job_id: jobId,
        patch,
      });
      pushToast("success", "Job updated.");
      setEditJob(null);
      void loadJobs();
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Could not update job.");
    } finally {
      setSuperSaving(false);
    }
  }

  async function superUpdateArtisan(artisanId: string, patch: ArtisanEditForm) {
    setSuperSaving(true);
    try {
      await invokePublicFunction<SuperMutationPayload>("artisanmu-admin-super", {
        admin_password: adminPassword,
        action: "update_artisan",
        artisan_id: artisanId,
        patch,
      });
      pushToast("success", "Artisan profile updated.");
      setEditArtisan(null);
      void loadArtisans();
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Could not update artisan.");
    } finally {
      setSuperSaving(false);
    }
  }

  async function mutateArtisan(
    action: "approve" | "reject" | "remove" | "set_badges",
    artisanId: string,
    badges: string[],
    successMessage: string,
  ) {
    setMutatingArtisan(`${action}:${artisanId}`);
    try {
      const payload = await invokePublicFunction<AdminArtisanPayload>("artisanmu-admin-artisans", {
        admin_password: adminPassword,
        action,
        artisan_id: artisanId,
        badges,
      });
      applyArtisanPayload(payload);
      pushToast("success", successMessage);
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Artisan update failed.");
    } finally {
      setMutatingArtisan("");
    }
  }

  async function mutateJob(
    action: "expire" | "complete" | "delete_photo",
    jobId: string,
    successMessage: string,
  ) {
    setMutatingJob(`${action}:${jobId}`);
    try {
      const payload = await invokePublicFunction<AdminJobsPayload>("artisanmu-admin-jobs", {
        admin_password: adminPassword,
        action,
        job_id: jobId,
      });
      applyJobsPayload(payload);
      pushToast("success", successMessage);
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Job update failed.");
    } finally {
      setMutatingJob("");
    }
  }

  const loadDetailReviews = useCallback(
    async (artisanId: string) => {
      setLoadingDetailReviews(true);
      setDetailReviewsError("");
      try {
        const payload = await invokePublicFunction<AdminReviewsPayload>("artisanmu-admin-content", {
          admin_password: adminPassword,
          action: "list_reviews",
          artisan_id: artisanId,
        });
        setDetailReviews(payload.reviews || []);
      } catch (error) {
        setDetailReviewsError(error instanceof Error ? error.message : "Could not load reviews.");
        setDetailReviews([]);
      } finally {
        setLoadingDetailReviews(false);
      }
    },
    [adminPassword],
  );

  const openDetail = useCallback(
    (artisan: LiveAdminArtisan) => {
      setDetailArtisan(artisan);
      setDetailReviews([]);
      void loadDetailReviews(artisan.id);
    },
    [loadDetailReviews],
  );

  const [adminAccountWorking, setAdminAccountWorking] = useState(false);
  const [adminAccountMessage, setAdminAccountMessage] = useState("");

  async function adminDeactivateArtisan(artisanId: string) {
    setAdminAccountWorking(true);
    setAdminAccountMessage("");
    try {
      await invokePublicFunction("artisanmu-admin-content", {
        admin_password: adminPassword,
        action: "deactivate_artisan",
        artisan_id: artisanId,
      });
      setDetailArtisan((current) =>
        current && current.id === artisanId ? { ...current, deactivatedAt: new Date().toISOString() } : current,
      );
      setAdminAccountMessage("Artisan deactivated — hidden from public listing.");
      void loadArtisans();
    } catch (error) {
      setAdminAccountMessage(error instanceof Error ? error.message : "Could not deactivate artisan.");
    } finally {
      setAdminAccountWorking(false);
    }
  }

  async function adminReactivateArtisan(artisanId: string) {
    setAdminAccountWorking(true);
    setAdminAccountMessage("");
    try {
      await invokePublicFunction("artisanmu-admin-content", {
        admin_password: adminPassword,
        action: "reactivate_artisan",
        artisan_id: artisanId,
      });
      setDetailArtisan((current) =>
        current && current.id === artisanId ? { ...current, deactivatedAt: null } : current,
      );
      setAdminAccountMessage("Artisan reactivated — profile is now visible.");
      void loadArtisans();
    } catch (error) {
      setAdminAccountMessage(error instanceof Error ? error.message : "Could not reactivate artisan.");
    } finally {
      setAdminAccountWorking(false);
    }
  }

  async function adminDeleteArtisan(artisanId: string) {
    setAdminAccountWorking(true);
    setAdminAccountMessage("");
    try {
      await invokePublicFunction("artisanmu-admin-content", {
        admin_password: adminPassword,
        action: "delete_artisan",
        artisan_id: artisanId,
      });
      setDetailArtisan(null);
      pushToast("success", "Artisan permanently deleted.");
      void loadArtisans();
    } catch (error) {
      setAdminAccountMessage(error instanceof Error ? error.message : "Could not delete artisan.");
      setAdminAccountWorking(false);
    }
  }

  async function deleteArtisanPhoto(artisanId: string, photoUrl: string) {
    setMutatingContent(`photo:${photoUrl}`);
    try {
      const payload = await invokePublicFunction<PhotoDeletePayload>("artisanmu-admin-content", {
        admin_password: adminPassword,
        action: "delete_artisan_photo",
        artisan_id: artisanId,
        photo_url: photoUrl,
      });
      const photos = payload.photos || [];
      setDetailArtisan((current) =>
        current && current.id === artisanId ? { ...current, photos, photoCount: photos.length } : current,
      );
      pushToast("success", "Photo deleted.");
      void loadArtisans();
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Could not delete photo.");
    } finally {
      setMutatingContent("");
    }
  }

  async function deleteReview(reviewId: number) {
    setMutatingContent(`review:${reviewId}`);
    try {
      await invokePublicFunction("artisanmu-admin-content", {
        admin_password: adminPassword,
        action: "delete_review",
        review_id: reviewId,
      });
      setDetailReviews((current) => current.filter((review) => review.id !== reviewId));
      pushToast("success", "Review deleted.");
      void loadArtisans();
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Could not delete review.");
    } finally {
      setMutatingContent("");
    }
  }

  async function setReviewVisibility(reviewId: number, isVisible: boolean) {
    setMutatingContent(`review-visibility:${reviewId}`);
    try {
      await invokePublicFunction("artisanmu-admin-content", {
        admin_password: adminPassword,
        action: "set_review_visibility",
        review_id: reviewId,
        is_visible: isVisible,
      });
      setDetailReviews((current) =>
        current.map((review) => (review.id === reviewId ? { ...review, is_visible: isVisible } : review)),
      );
      pushToast("success", isVisible ? "Review shown." : "Review hidden.");
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Could not update review.");
    } finally {
      setMutatingContent("");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadArtisans();
      void loadJobs();
      void loadStats();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadArtisans, loadJobs, loadStats]);

  // Switch tab and clear the search so results never look stale across sections.
  const selectTab = useCallback((tab: AdminTab) => {
    setActiveTab(tab);
    setQuery("");
  }, []);

  const refreshing = loadingArtisans || loadingJobs || loadingStats;
  const refreshAll = useCallback(() => {
    void loadArtisans();
    void loadJobs();
    void loadStats();
  }, [loadArtisans, loadJobs, loadStats]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredPending = useMemo(() => {
    if (!normalizedQuery) return pendingArtisans;
    return pendingArtisans.filter((artisan) =>
      [artisan.name, artisan.trade, artisan.town, artisan.district, artisan.phone, artisan.email, ...artisan.serviceTags]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [pendingArtisans, normalizedQuery]);

  const filteredManaged = useMemo(() => {
    return managedArtisans.filter((artisan) => {
      if (artisanStatusFilter !== "all" && artisan.status !== artisanStatusFilter) return false;
      if (!normalizedQuery) return true;
      return [artisan.name, artisan.trade, artisan.town, artisan.district, artisan.phone, artisan.email, ...artisan.serviceTags]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [managedArtisans, artisanStatusFilter, normalizedQuery]);

  const filteredJobs = useMemo(() => {
    return liveJobs.filter((job) => {
      if (jobStatusFilter !== "all" && job.status !== jobStatusFilter) return false;
      if (!normalizedQuery) return true;
      return [job.shortId, job.trade, job.town, job.district, job.client, job.status, job.urgency, job.assignedTo, job.description]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [liveJobs, jobStatusFilter, normalizedQuery]);

  const tabCounts: Record<AdminTab, number | null> = {
    overview: null,
    review: artisanMetrics.pending,
    artisans: managedArtisans.length,
    jobs: liveJobs.length,
    ads: null,
  };

  const artisanFilters = [
    { id: "all", label: "All", count: managedArtisans.length },
    { id: "approved", label: "Approved", count: artisanMetrics.active },
    { id: "rejected", label: "Rejected", count: artisanMetrics.rejected },
    { id: "removed", label: "Removed", count: artisanMetrics.removed },
  ] as const;

  const jobFilters = [
    { id: "all", label: "All", count: jobMetrics.total },
    { id: "open", label: "Open", count: jobMetrics.open },
    { id: "claimed", label: "Claimed", count: jobMetrics.claimed },
    { id: "completed", label: "Completed", count: jobMetrics.completed },
    { id: "expired", label: "Expired", count: jobMetrics.expired },
  ] as const;

  const tabTitles: Record<AdminTab, { title: string; subtitle: string }> = {
    overview: { title: "Overview", subtitle: "Monthly analytics, live counts and the audit trail." },
    review: { title: "Validate artisans", subtitle: "Approve or reject new artisan applications." },
    artisans: { title: "Manage artisans", subtitle: "Badges, edits, removals and the live roster." },
    jobs: { title: "Manage jobs", subtitle: "Full control — edit, reopen, complete, expire or delete any request." },
    ads: { title: "Ads & monetization", subtitle: "Ad placement status across the public site." },
  };

  return (
    <main className="min-h-screen bg-[var(--background)] pb-16 text-[var(--foreground)]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--background)]/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <ArtisanMuLogo subtitle="Admin console" />
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-[var(--green-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--green-strong)] sm:flex">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Admin mode
            </span>
            <button
              type="button"
              onClick={refreshAll}
              disabled={refreshing}
              className="btn btn-secondary h-10 px-3 text-sm disabled:opacity-60"
              aria-label="Refresh data"
            >
              <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
              <span className="hidden sm:inline">{refreshing ? "Refreshing" : "Refresh"}</span>
            </button>
            <Link href="/" className="btn btn-secondary h-10 px-3 text-sm">
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Site</span>
            </Link>
            {onLogout ? (
              <button
                type="button"
                onClick={onLogout}
                className="btn btn-secondary h-10 px-3 text-sm"
                aria-label="Log out of admin"
              >
                <LogOut className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <MetricCard label="Pending review" value={artisanMetrics.pending} icon={UserCheck} tone="bg-[#fff4e0] text-[#8a6a1f]" onClick={() => selectTab("review")} />
          <MetricCard label="Active artisans" value={artisanMetrics.active} icon={ShieldCheck} tone="bg-[var(--green-soft)] text-[var(--green-strong)]" onClick={() => selectTab("artisans")} />
          <MetricCard label="Open jobs" value={jobMetrics.open} icon={BriefcaseBusiness} tone="bg-[#e8eff6] text-[var(--blue)]" onClick={() => selectTab("jobs")} />
          <MetricCard label="Photos to clean" value={jobMetrics.cleanup} icon={ImageIcon} tone="bg-[#fdecec] text-[var(--rose)]" onClick={() => selectTab("jobs")} />
        </div>

        {/* Tabs */}
        <nav className="mt-5 grid grid-cols-4 gap-1.5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-sm sm:inline-flex sm:gap-1" aria-label="Admin sections">
          {adminTabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            const count = tabCounts[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                aria-current={selected ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold transition sm:flex-row sm:gap-2 sm:px-4 ${
                  selected
                    ? "bg-[var(--green-soft)] text-[var(--green-strong)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]"
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {tab.label}
                {count ? (
                  <span
                    className={`rounded-full px-1.5 text-[11px] font-bold ${
                      selected ? "bg-white text-[var(--green-strong)]" : "bg-[var(--surface-soft)] text-[var(--muted)]"
                    }`}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Title + search */}
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--ink)]">{tabTitles[activeTab].title}</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">{tabTitles[activeTab].subtitle}</p>
          </div>
          {activeTab !== "ads" && activeTab !== "overview" ? (
            <label className="flex h-11 min-w-0 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 shadow-sm md:w-80">
              <Search className="size-4 shrink-0 text-[var(--green)]" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9aa19c]"
                placeholder={activeTab === "jobs" ? "Search job, client, trade…" : "Search name, phone, trade…"}
              />
              {query ? (
                <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-[var(--muted)] hover:text-[var(--ink)]">
                  <X className="size-4" aria-hidden="true" />
                </button>
              ) : null}
            </label>
          ) : null}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" ? (
          <div className="mt-5 grid gap-4">
            {statsError ? (
              <ErrorState message={statsError} onRetry={loadStats} />
            ) : loadingStats && !stats ? (
              <LoadingList />
            ) : (
              <>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                  {/* Monthly analytics */}
                  <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="font-display flex items-center gap-2 text-lg text-[var(--ink)]">
                          <BarChart3 className="size-5 text-[var(--green)]" aria-hidden="true" />
                          Monthly activity
                        </h2>
                        <p className="mt-0.5 text-sm text-[var(--muted)]">
                          Aggregated before resolved requests are purged — this is the long-term record.
                        </p>
                      </div>
                    </div>
                    {stats?.monthly?.length ? (
                      <div className="mt-5">
                        <MonthlyChart monthly={stats.monthly} />
                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {(() => {
                            const totals = (stats.monthly || []).reduce(
                              (acc, row) => ({
                                posted: acc.posted + row.jobs_posted,
                                claimed: acc.claimed + row.jobs_claimed,
                                completed: acc.completed + row.jobs_completed,
                                leads: acc.leads + row.leads_sent,
                              }),
                              { posted: 0, claimed: 0, completed: 0, leads: 0 },
                            );
                            return (
                              <>
                                <div className="rounded-xl bg-[var(--surface-soft)] px-3 py-2 text-sm"><span className="block text-xs text-[var(--muted)]">Jobs posted</span><strong className="text-[var(--ink)]">{totals.posted}</strong></div>
                                <div className="rounded-xl bg-[var(--surface-soft)] px-3 py-2 text-sm"><span className="block text-xs text-[var(--muted)]">Claimed</span><strong className="text-[var(--ink)]">{totals.claimed}</strong></div>
                                <div className="rounded-xl bg-[var(--surface-soft)] px-3 py-2 text-sm"><span className="block text-xs text-[var(--muted)]">Completed</span><strong className="text-[var(--ink)]">{totals.completed}</strong></div>
                                <div className="rounded-xl bg-[var(--surface-soft)] px-3 py-2 text-sm"><span className="block text-xs text-[var(--muted)]">Leads sent</span><strong className="text-[var(--ink)]">{totals.leads}</strong></div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      <EmptyState
                        icon={BarChart3}
                        title="No analytics yet"
                        copy="Monthly numbers appear here automatically as job requests get resolved and rolled up by the maintenance cron."
                      />
                    )}
                  </section>

                  <div className="grid gap-4">
                    {/* Automation card */}
                    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
                      <h2 className="font-display flex items-center gap-2 text-lg text-[var(--ink)]">
                        <Bot className="size-5 text-[var(--green)]" aria-hidden="true" />
                        Self-maintenance
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        Every <strong className="text-[var(--ink)]">{stats?.retention?.cadence || "15 min"}</strong> the database cleans itself:
                        overdue jobs expire, and resolved requests are rolled into the monthly numbers then deleted.
                      </p>
                      <ul className="mt-3 grid gap-1.5 text-sm text-[var(--muted)]">
                        <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[var(--green)]" aria-hidden="true" /> Completed jobs purge after <strong className="text-[var(--ink)]">{stats?.retention?.completed || "48h"}</strong></li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[var(--green)]" aria-hidden="true" /> Claimed jobs purge after <strong className="text-[var(--ink)]">{stats?.retention?.claimed || "7d"}</strong></li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[var(--green)]" aria-hidden="true" /> Expired jobs purge after <strong className="text-[var(--ink)]">{stats?.retention?.expired || "7d"}</strong></li>
                      </ul>
                    </section>

                    {/* Live snapshot */}
                    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
                      <h2 className="font-display flex items-center gap-2 text-lg text-[var(--ink)]">
                        <Sparkles className="size-5 text-[var(--gold)]" aria-hidden="true" />
                        Live right now
                      </h2>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-xl bg-[var(--surface-soft)] px-3 py-2"><span className="block text-xs text-[var(--muted)]">Open jobs</span><strong className="text-[var(--ink)]">{stats?.live?.jobs?.open || 0}</strong></div>
                        <div className="rounded-xl bg-[var(--surface-soft)] px-3 py-2"><span className="block text-xs text-[var(--muted)]">Claimed</span><strong className="text-[var(--ink)]">{stats?.live?.jobs?.claimed || 0}</strong></div>
                        <div className="rounded-xl bg-[var(--surface-soft)] px-3 py-2"><span className="block text-xs text-[var(--muted)]">Live artisans</span><strong className="text-[var(--ink)]">{stats?.live?.artisans?.approved_live || 0}</strong></div>
                        <div className="rounded-xl bg-[var(--surface-soft)] px-3 py-2"><span className="block text-xs text-[var(--muted)]">Pending review</span><strong className="text-[var(--ink)]">{stats?.live?.artisans?.pending || 0}</strong></div>
                      </div>
                    </section>
                  </div>
                </div>

                {/* Audit trail */}
                <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
                  <h2 className="font-display flex items-center gap-2 text-lg text-[var(--ink)]">
                    <History className="size-5 text-[var(--blue)]" aria-hidden="true" />
                    Recent admin activity
                  </h2>
                  {stats?.audit?.length ? (
                    <ul className="mt-3 grid gap-1">
                      {stats.audit.slice(0, 15).map((entry) => (
                        <li key={entry.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm odd:bg-[var(--surface-soft)]">
                          <span className="min-w-0 truncate text-[var(--ink)]">{auditLabel(entry)}</span>
                          <span className="shrink-0 text-xs text-[var(--muted)]">{ageLabel(entry.timestamp)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-[var(--muted)]">No admin actions recorded yet.</p>
                  )}
                </section>
              </>
            )}
          </div>
        ) : null}

        {/* ── REVIEW ── */}
        {activeTab === "review" ? (
          <div className="mt-5">
            {artisanError ? (
              <ErrorState message={artisanError} onRetry={loadArtisans} />
            ) : loadingArtisans ? (
              <LoadingList />
            ) : filteredPending.length ? (
              <div className="grid gap-3">
                {filteredPending.map((artisan) => {
                  const selectedBadge = reviewBadges[artisan.id] || "No extra badge";
                  const busyAction = mutatingArtisan.endsWith(`:${artisan.id}`)
                    ? mutatingArtisan.split(":")[0]
                    : "";
                  return (
                    <ReviewCard
                      key={artisan.id}
                      artisan={artisan}
                      badge={selectedBadge}
                      busyAction={busyAction}
                      onBadge={(badge) => setReviewBadges((current) => ({ ...current, [artisan.id]: badge }))}
                      onApprove={() =>
                        void mutateArtisan(
                          "approve",
                          artisan.id,
                          selectedBadge === "No extra badge" ? [] : [selectedBadge],
                          `${artisan.name} approved.`,
                        )
                      }
                      onReject={() =>
                        setConfirmState({
                          title: `Reject ${artisan.name}?`,
                          message: "They won't appear on the public site. You can re-approve them later from the Artisans tab.",
                          confirmLabel: "Reject application",
                          danger: true,
                          onConfirm: () => void mutateArtisan("reject", artisan.id, [], `${artisan.name} rejected.`),
                        })
                      }
                      onView={() => openDetail(artisan)}
                    />
                  );
                })}
              </div>
            ) : query ? (
              <EmptyState icon={Search} title="No matches" copy="No pending applications match your search." />
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="All caught up"
                copy="There are no artisan applications waiting for review. New signups will appear here automatically."
              />
            )}
          </div>
        ) : null}

        {/* ── ARTISANS ── */}
        {activeTab === "artisans" ? (
          <div className="mt-5">
            <div className="mb-4 flex flex-wrap gap-2">
              {artisanFilters.map((filter) => {
                const selected = artisanStatusFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setArtisanStatusFilter(filter.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                      selected
                        ? "border-[var(--green)] bg-[var(--green-soft)] text-[var(--green-strong)]"
                        : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--green)]"
                    }`}
                  >
                    {filter.label}
                    <span className="ml-1.5 text-xs opacity-70">{filter.count}</span>
                  </button>
                );
              })}
            </div>

            {artisanError ? (
              <ErrorState message={artisanError} onRetry={loadArtisans} />
            ) : loadingArtisans ? (
              <LoadingList />
            ) : filteredManaged.length ? (
              <div className="grid gap-3">
                {filteredManaged.map((artisan) => {
                  const busyAction = mutatingArtisan.endsWith(`:${artisan.id}`) ? mutatingArtisan.split(":")[0] : "";
                  const busy = Boolean(busyAction);
                  const removable = artisan.status === "approved";
                  const currentBadges = artisan.badges.filter((b): b is BadgeName => badgeOptions.includes(b as BadgeName));
                  return (
                    <article key={artisan.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-[var(--ink)]">{artisan.name}</h3>
                            <StatusBadge status={artisan.status} />
                            {!artisan.hasAuthUser ? (
                              <span className="rounded-full bg-[#fdecec] px-2.5 py-0.5 text-xs font-semibold text-[var(--rose)]">no login</span>
                            ) : null}
                          </div>
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--muted)]">
                            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                            {artisan.trade} · {artisan.town}, {artisan.district}
                          </p>
                          <p className="mt-1 text-xs text-[#7a827c]">
                            {artisan.email || "No email"} · {artisan.photoCount} portfolio photos
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openDetail(artisan)}
                            className="btn btn-secondary h-11 px-3 text-sm"
                            aria-label={`View ${artisan.name} details`}
                          >
                            <Eye className="size-4" aria-hidden="true" />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditArtisan(artisan)}
                            className="btn btn-secondary h-11 px-3 text-sm"
                            aria-label={`Edit ${artisan.name} profile`}
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                            Edit
                          </button>
                          <a
                            href={`https://wa.me/${digitsOnly(artisan.phone)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary h-11 px-3 text-sm"
                            aria-label={`WhatsApp ${artisan.name}`}
                          >
                            <MessageCircle className="size-4" aria-hidden="true" />
                          </a>
                          {removable ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                setConfirmState({
                                  title: `Remove ${artisan.name}?`,
                                  message: "They'll be taken off the public site immediately. You can re-approve them later.",
                                  confirmLabel: "Remove artisan",
                                  danger: true,
                                  onConfirm: () => void mutateArtisan("remove", artisan.id, currentBadges, `${artisan.name} removed.`),
                                })
                              }
                              className="btn h-11 bg-[var(--rose)] px-4 text-sm text-white hover:bg-[#8a3f3f] disabled:opacity-60"
                            >
                              {busyAction === "remove" ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
                              Remove
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void mutateArtisan("approve", artisan.id, currentBadges, `${artisan.name} approved.`)}
                              className="btn btn-primary h-11 px-4 text-sm disabled:opacity-60"
                            >
                              {busyAction === "approve" ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
                              Approve
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 border-t border-[var(--line)] pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa19c]">Badges</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {artisan.verified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--green-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--green-strong)]">
                              <BadgeCheck className="size-3.5" aria-hidden="true" />
                              Verified
                            </span>
                          ) : null}
                          {badgeOptions.map((badge) => {
                            const enabled = currentBadges.includes(badge);
                            const nextBadges = enabled
                              ? currentBadges.filter((item) => item !== badge)
                              : [...currentBadges, badge];
                            return (
                              <button
                                key={badge}
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  void mutateArtisan(
                                    "set_badges",
                                    artisan.id,
                                    nextBadges,
                                    `${badge} ${enabled ? "removed from" : "granted to"} ${artisan.name}.`,
                                  )
                                }
                                aria-pressed={enabled}
                                className={`inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold transition disabled:opacity-60 ${
                                  enabled
                                    ? "bg-[var(--green-soft)] text-[var(--green-strong)]"
                                    : "border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--green)]"
                                }`}
                              >
                                <BadgeCheck className="size-3.5" aria-hidden="true" />
                                {badge}
                              </button>
                            );
                          })}
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4e0] px-2.5 py-1 text-xs font-medium text-[#8a6a1f]">
                            <Star className="size-3.5" aria-hidden="true" />
                            {artisan.rating > 0 ? `${artisan.rating} · ` : ""}{artisan.reviews} reviews
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title={managedArtisans.length ? "No matches" : "No managed artisans yet"}
                copy={
                  managedArtisans.length
                    ? "No artisans match this filter or search."
                    : "Approved, rejected and removed artisans show up here after you review applications."
                }
              />
            )}
          </div>
        ) : null}

        {/* ── JOBS ── */}
        {activeTab === "jobs" ? (
          <div className="mt-5">
            <div className="mb-4 flex flex-wrap gap-2">
              {jobFilters.map((filter) => {
                const selected = jobStatusFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setJobStatusFilter(filter.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                      selected
                        ? "border-[var(--green)] bg-[var(--green-soft)] text-[var(--green-strong)]"
                        : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--green)]"
                    }`}
                  >
                    {filter.label}
                    <span className="ml-1.5 text-xs opacity-70">{filter.count}</span>
                  </button>
                );
              })}
            </div>

            {jobsError ? (
              <ErrorState message={jobsError} onRetry={loadJobs} />
            ) : loadingJobs ? (
              <LoadingList />
            ) : filteredJobs.length ? (
              <div className="grid gap-3">
                {filteredJobs.map((job) => {
                  const busyAction = mutatingJob.endsWith(`:${job.id}`) ? mutatingJob.split(":")[0] : "";
                  const busy = Boolean(busyAction);
                  return (
                    <article key={job.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm sm:p-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-[#9aa19c]">#{job.shortId}</span>
                            <StatusBadge status={job.status} />
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${job.urgency === "urgent" ? "bg-[var(--urgent-soft)] text-[var(--urgent)]" : "bg-[#eef1ef] text-[var(--muted)]"}`}>
                              {job.urgency}
                            </span>
                            {job.hasPhoto ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#e8eff6] px-2.5 py-0.5 text-xs font-semibold text-[var(--blue)]">
                                <ImageIcon className="size-3.5" aria-hidden="true" />
                                photo
                              </span>
                            ) : null}
                          </div>
                          <h3 className="mt-2 text-lg font-semibold text-[var(--ink)]">{job.trade}</h3>
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--muted)]">
                            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                            {job.client} · {job.town}, {job.district}
                          </p>
                          {job.description ? <p className="mt-2 text-sm leading-6 text-[#3f4a45]">{job.description}</p> : null}
                        </div>

                        <div className="grid shrink-0 gap-2 text-sm text-[var(--muted)] lg:w-60">
                          <span className="rounded-xl bg-[var(--surface-soft)] px-3 py-2">
                            Assigned: <strong className="text-[var(--ink)]">{job.assignedTo}</strong>
                          </span>
                          <span className="rounded-xl bg-[var(--surface-soft)] px-3 py-2">
                            Targets: {job.notificationCount} sent · {job.pendingNotificationCount} pending
                          </span>
                          <span className="rounded-xl bg-[var(--surface-soft)] px-3 py-2">Posted {job.age}</span>
                        </div>
                      </div>

                      {(
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setEditJob(job)}
                            className="btn btn-secondary h-10 px-4 text-sm disabled:opacity-60"
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                            Edit
                          </button>

                          {["completed", "expired", "claimed"].includes(job.status) ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                setConfirmState({
                                  title: `Reopen job #${job.shortId}?`,
                                  message:
                                    job.status === "claimed"
                                      ? "The current claim will be released and the job returns to the open board for 3 more days."
                                      : "The job returns to the open board for 3 more days.",
                                  confirmLabel: "Reopen job",
                                  danger: false,
                                  onConfirm: () => void superJobAction("set_job_status", job.id, { status: "open" }, `Job #${job.shortId} reopened.`),
                                })
                              }
                              className="btn btn-secondary h-10 px-4 text-sm disabled:opacity-60"
                            >
                              {busyAction === "set_job_status" ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="size-4" aria-hidden="true" />}
                              Reopen
                            </button>
                          ) : null}

                          {job.status === "claimed" ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void mutateJob("complete", job.id, `Job #${job.shortId} marked complete.`)}
                              className="btn btn-primary h-10 px-4 text-sm disabled:opacity-60"
                            >
                              {busyAction === "complete" ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
                              Mark complete
                            </button>
                          ) : null}

                          {["open", "claimed"].includes(job.status) ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                setConfirmState({
                                  title: `Expire job #${job.shortId}?`,
                                  message: "The request will be closed and pending artisan notifications will be marked expired.",
                                  confirmLabel: "Expire job",
                                  danger: true,
                                  onConfirm: () => void mutateJob("expire", job.id, `Job #${job.shortId} expired.`),
                                })
                              }
                              className="btn h-10 border border-[#e6c4be] bg-[#fdecec] px-4 text-sm text-[var(--rose)] hover:bg-[#f9dcd8] disabled:opacity-60"
                            >
                              {busyAction === "expire" ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : <Clock className="size-4" aria-hidden="true" />}
                              Expire
                            </button>
                          ) : null}

                          {job.hasPhoto ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                setConfirmState({
                                  title: "Delete job photo?",
                                  message: "The uploaded photo will be permanently removed from storage. This cannot be undone.",
                                  confirmLabel: "Delete photo",
                                  danger: true,
                                  onConfirm: () => void mutateJob("delete_photo", job.id, `Photo deleted from job #${job.shortId}.`),
                                })
                              }
                              className="btn btn-secondary h-10 px-4 text-sm text-[var(--rose)] hover:border-[var(--rose)] disabled:opacity-60"
                            >
                              {busyAction === "delete_photo" ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
                              {job.cleanupEligible ? "Delete cleanup photo" : "Delete photo"}
                            </button>
                          ) : null}

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              setConfirmState({
                                title: `Delete job #${job.shortId} permanently?`,
                                message: "The request, its notifications and its events are removed for good. This cannot be undone.",
                                confirmLabel: "Delete job",
                                danger: true,
                                onConfirm: () => void superJobAction("delete_job", job.id, {}, `Job #${job.shortId} deleted.`),
                              })
                            }
                            className="btn h-10 border border-[#e6c4be] bg-[#fdecec] px-4 text-sm text-[var(--rose)] hover:bg-[#f9dcd8] disabled:opacity-60"
                          >
                            {busyAction === "delete_job" ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
                            Delete
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={BriefcaseBusiness}
                title={liveJobs.length ? "No matches" : "No job requests yet"}
                copy={
                  liveJobs.length
                    ? "No jobs match this filter or search."
                    : "Client job requests will appear here as soon as homeowners post work."
                }
              />
            )}
          </div>
        ) : null}

        {/* ── ADS ── */}
        {activeTab === "ads" ? <div className="mt-5"><AdsPanel adminPassword={adminPassword} /></div> : null}
      </div>

      {detailArtisan ? (
        <ArtisanDetailModal
          artisan={detailArtisan}
          reviews={detailReviews}
          loadingReviews={loadingDetailReviews}
          reviewsError={detailReviewsError}
          mutatingContent={mutatingContent}
          onClose={() => setDetailArtisan(null)}
          onDeletePhoto={(photoUrl) =>
            setConfirmState({
              title: "Delete this photo?",
              message: "The photo will be permanently removed from storage. This cannot be undone.",
              confirmLabel: "Delete photo",
              danger: true,
              onConfirm: () => void deleteArtisanPhoto(detailArtisan.id, photoUrl),
            })
          }
          onDeleteReview={(reviewId) =>
            setConfirmState({
              title: "Delete this review?",
              message: "The review will be permanently removed and the artisan's rating recalculated.",
              confirmLabel: "Delete review",
              danger: true,
              onConfirm: () => void deleteReview(reviewId),
            })
          }
          onToggleVisibility={(reviewId, isVisible) => void setReviewVisibility(reviewId, isVisible)}
          onDeactivate={() => void adminDeactivateArtisan(detailArtisan.id)}
          onReactivate={() => void adminReactivateArtisan(detailArtisan.id)}
          onDeleteArtisan={() => void adminDeleteArtisan(detailArtisan.id)}
          accountWorking={adminAccountWorking}
          accountMessage={adminAccountMessage}
        />
      ) : null}

      {editJob ? (
        <JobEditModal
          job={editJob}
          saving={superSaving}
          onClose={() => setEditJob(null)}
          onSave={(patch) => void superUpdateJob(editJob.id, patch)}
        />
      ) : null}

      {editArtisan ? (
        <ArtisanEditModal
          artisan={editArtisan}
          saving={superSaving}
          onClose={() => setEditArtisan(null)}
          onSave={(patch) => void superUpdateArtisan(editArtisan.id, patch)}
        />
      ) : null}

      <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}
