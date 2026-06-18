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
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  ExternalLink,
  ImageIcon,
  Inbox,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  Phone,
  RefreshCw,
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
import { AdBanner } from "@/components/ad-banner";
import { invokePublicFunction } from "@/lib/artisanmu-functions";

const adminTabs = [
  { id: "review", label: "Review", icon: UserCheck },
  { id: "artisans", label: "Artisans", icon: Users },
  { id: "jobs", label: "Jobs", icon: BriefcaseBusiness },
  { id: "ads", label: "Ads", icon: Megaphone },
] as const;

type AdminTab = (typeof adminTabs)[number]["id"];

type BadgeName = "Fair price" | "Fast response" | "Top rated";

const badgeOptions: BadgeName[] = ["Fair price", "Fast response", "Top rated"];

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
}: {
  artisan: LiveAdminArtisan;
  badge: string;
  busyAction: string;
  onBadge: (badge: string) => void;
  onApprove: () => void;
  onReject: () => void;
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
        <span className="shrink-0 text-sm font-medium text-[var(--green-strong)]">{ageLabel(artisan.createdAt)}</span>
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

/* ─────────────────────────── ads (honest panel) ─────────────────────────── */

const adSurfaces = [
  { id: "search-results", name: "Search results", surface: "/browse", desc: "Below the artisan results list." },
  { id: "request-panel", name: "Request panel", surface: "/post", desc: "Beside the job request form." },
];

function AdsPanel() {
  const adsenseConfigured = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID);

  return (
    <div className="grid gap-4">
      <div
        className={`rounded-2xl border p-5 shadow-sm ${
          adsenseConfigured ? "border-[var(--green)]/30 bg-[var(--green-soft)]" : "border-[var(--line)] bg-[var(--surface)]"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`flex size-10 items-center justify-center rounded-xl ${
                adsenseConfigured ? "bg-white text-[var(--green-strong)]" : "bg-[var(--green-soft)] text-[var(--green-strong)]"
              }`}
            >
              <Megaphone className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-[var(--ink)]">Google AdSense</h3>
              <p className="text-sm text-[var(--muted)]">Banner monetization across the public site.</p>
            </div>
          </div>
          <StatusBadge status={adsenseConfigured ? "Live" : "Inactive"} />
        </div>
        <p className="mt-4 text-sm leading-6 text-[#3f4a45]">
          {adsenseConfigured
            ? "AdSense is configured. Live ads render inside the placements below and on the public pages."
            : "Ads are switched off. To turn them on, set the build-time env var "}
          {!adsenseConfigured ? (
            <code className="rounded-md bg-[#f0ece3] px-1.5 py-0.5 font-mono text-xs text-[var(--ink)]">
              NEXT_PUBLIC_ADSENSE_CLIENT_ID
            </code>
          ) : null}
          {!adsenseConfigured ? " in the host, then redeploy. No code change is needed." : ""}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {adSurfaces.map((surface) => (
          <article key={surface.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-[var(--ink)]">{surface.name}</h4>
              <StatusBadge status={adsenseConfigured ? "Live" : "Inactive"} />
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">{surface.desc}</p>
            <Link
              href={surface.surface}
              target="_blank"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--green-strong)] hover:underline"
            >
              View {surface.surface}
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </Link>
            {adsenseConfigured ? (
              <AdBanner className="mt-3" placement={surface.id} format="auto" compact />
            ) : (
              <div className="mt-3 flex min-h-20 items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] text-xs font-medium text-[var(--muted)]">
                Ad slot — inactive
              </div>
            )}
          </article>
        ))}
      </div>

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

/* ─────────────────────────── main console ─────────────────────────── */

export function AdminConsole({ adminPassword }: { adminPassword: string }) {
  const [activeTab, setActiveTab] = useState<AdminTab>("review");
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadArtisans();
      void loadJobs();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadArtisans, loadJobs]);

  // Switch tab and clear the search so results never look stale across sections.
  const selectTab = useCallback((tab: AdminTab) => {
    setActiveTab(tab);
    setQuery("");
  }, []);

  const refreshing = loadingArtisans || loadingJobs;
  const refreshAll = useCallback(() => {
    void loadArtisans();
    void loadJobs();
  }, [loadArtisans, loadJobs]);

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
    review: { title: "Validate artisans", subtitle: "Approve or reject new artisan applications." },
    artisans: { title: "Manage artisans", subtitle: "Badges, removals and the live roster." },
    jobs: { title: "Monitor jobs", subtitle: "Track client requests and clean up photos." },
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
          {activeTab !== "ads" ? (
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

                      {job.status === "claimed" || ["open", "claimed"].includes(job.status) || job.hasPhoto ? (
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
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
                        </div>
                      ) : null}
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
        {activeTab === "ads" ? <div className="mt-5"><AdsPanel /></div> : null}
      </div>

      <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}
