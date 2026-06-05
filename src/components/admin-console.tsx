"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  ChartNoAxesColumn,
  CheckCircle2,
  CircleDollarSign,
  Code2,
  Clock,
  Eye,
  ImageIcon,
  LayoutDashboard,
  Link2,
  Megaphone,
  MessageCircle,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  UserCheck,
} from "lucide-react";
import {
  adPlacements,
  commentThreads,
  jobRequests,
  reviewItems,
  type AdPlacement,
} from "@/lib/admin-data";
import { AdBanner } from "@/components/ad-banner";
import { invokePublicFunction } from "@/lib/artisanmu-functions";

const adminTabs = [
  { id: "review", label: "Review", icon: UserCheck },
  { id: "artisans", label: "Artisans", icon: ShieldCheck },
  { id: "ads", label: "Ads", icon: Megaphone },
  { id: "requests", label: "Jobs", icon: BriefcaseBusiness },
  { id: "rules", label: "Rules", icon: Settings },
] as const;

type AdminTab = (typeof adminTabs)[number]["id"];

type BadgeName = "Fair price" | "Fast response" | "Top rated";

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

const badgeOptions: BadgeName[] = ["Fair price", "Fast response", "Top rated"];

function statusClass(status: string) {
  if (status === "Live" || status === "Low" || status === "Claimed" || status === "approved") {
    return "bg-[#e8f6f1] text-[#0d7c5c]";
  }
  if (status === "Draft" || status === "Review" || status === "Matching" || status === "pending") {
    return "bg-[#fff7e7] text-[#78511c]";
  }
  return "bg-[#f8e9e7] text-[#9f4a4a]";
}

function Metric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof LayoutDashboard;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[#5f6a64]">{label}</p>
        <span className={`flex size-9 items-center justify-center rounded-md ${tone}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-[#101410]">{value}</p>
    </div>
  );
}

function EmptyState({
  title,
  copy,
  action,
}: {
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-[#cfc6b6] bg-[#fffdf8] p-5 text-[#4d5651]">
      <div className="flex size-10 items-center justify-center rounded-md bg-[#eef5f3] text-[#0d7c5c]">
        <ShieldCheck className="size-4" aria-hidden="true" />
      </div>
      <h3 className="mt-3 text-lg font-semibold text-[#101410]">{title}</h3>
      <p className="mt-2 text-sm leading-6">{copy}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
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

function ReviewCard({
  artisan,
  badge,
  busy,
  onBadge,
  onApprove,
  onReject,
}: {
  artisan: LiveAdminArtisan;
  badge: string;
  busy: boolean;
  onBadge: (badge: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <article className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-[#101410]">{artisan.name}</h3>
            <span className={`rounded-md px-2 py-1 text-xs font-semibold ${statusClass(artisan.status)}`}>
              {artisan.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-[#5f6a64]">
            {artisan.trade} - {artisan.town}, {artisan.district}
          </p>
        </div>
        <p className="text-sm font-medium text-[#0d8b66]">{ageLabel(artisan.createdAt)}</p>
      </div>

      <p className="mt-3 text-sm leading-6 text-[#4d5651]">{artisan.bio}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {[artisan.email || "No email", artisan.phone, `${artisan.photoCount} photos`, ...artisan.serviceTags, ...artisan.specialties].map((check) => (
          <span key={check} className="rounded-md border border-[#ddd8cd] bg-white px-2.5 py-1 text-xs text-[#4d5651]">
            {check}
          </span>
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center">
        <label className="flex h-11 min-w-0 items-center gap-2 rounded-md border border-[#d8d1c3] bg-white px-3 text-sm">
          <BadgeCheck className="size-4 shrink-0 text-[#234f7a]" aria-hidden="true" />
          <select
            className="min-w-0 flex-1 bg-transparent outline-none"
            value={badge}
            onChange={(event) => onBadge(event.target.value)}
          >
            <option>No extra badge</option>
            <option>Verified</option>
            <option>Fair price</option>
            <option>Fast response</option>
            <option>Top rated</option>
          </select>
        </label>
        <a
          href={`https://wa.me/${artisan.phone.replace(/\D/g, "")}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#ddd8cd] bg-white px-4 text-sm font-semibold text-[#0d1612]"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          WhatsApp
        </a>
        <button
          type="button"
          onClick={onReject}
          disabled={busy}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#e4bbb4] bg-[#fff4f2] px-4 text-sm font-semibold text-[#9f4a4a] disabled:cursor-wait disabled:opacity-70"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={onApprove}
          disabled={busy}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0d1612] px-4 text-sm font-semibold text-white hover:bg-[#17251e] disabled:cursor-wait disabled:bg-[#93a198]"
        >
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Approve
        </button>
      </div>
    </article>
  );
}

function AdEditor({ placement }: { placement: AdPlacement }) {
  const [status, setStatus] = useState(placement.status);
  const [format, setFormat] = useState(placement.format);
  const [adsenseFormat, setAdsenseFormat] = useState(placement.adsenseFormat);
  const [notice, setNotice] = useState("");
  const clickRate = placement.impressions
    ? `${((placement.clicks / placement.impressions) * 100).toFixed(1)}%`
    : "0.0%";

  return (
    <article className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-[#101410]">{placement.name}</h3>
            <span className={`rounded-md px-2 py-1 text-xs font-semibold ${statusClass(status)}`}>
              {status}
            </span>
          </div>
          <p className="mt-1 text-sm text-[#5f6a64]">
            {placement.surface} - {placement.sponsor} - {format}
          </p>
        </div>
        <p className="text-sm font-semibold text-[#78511c]">{placement.budget}</p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_210px]">
        <label className="block text-sm font-medium text-[#101410]">
          Sponsor copy
          <textarea
            rows={3}
            defaultValue={placement.copy}
            className="mt-2 w-full resize-none rounded-md border border-[#d8d1c3] bg-white px-3 py-2 text-sm outline-none focus:border-[#0d8b66]"
          />
        </label>

        <div className="grid gap-2">
          <label className="block text-sm font-medium text-[#101410]">
            Format
            <select
              value={format}
              onChange={(event) => setFormat(event.target.value as AdPlacement["format"])}
              className="mt-2 h-11 w-full rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none"
            >
              <option>AdSense responsive</option>
              <option>Direct banner</option>
              <option>Direct link</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-[#101410]">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as AdPlacement["status"])}
              className="mt-2 h-11 w-full rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none"
            >
              <option>Live</option>
              <option>Draft</option>
              <option>Paused</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => setNotice(`Preview refreshed for ${placement.name}.`)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0d8b66] px-4 text-sm font-semibold text-white hover:bg-[#0b7758]"
          >
            <Eye className="size-4" aria-hidden="true" />
            Preview
          </button>
        </div>
      </div>

      {notice ? (
        <p className="mt-3 rounded-md border border-[#d7c292] bg-[#fff8e8] px-3 py-2 text-sm font-medium text-[#78511c]">
          {notice}
        </p>
      ) : null}

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-medium text-[#101410]">
          AdSense slot ID
          <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-[#d8d1c3] bg-white px-3">
            <Megaphone className="size-4 shrink-0 text-[#0d8b66]" aria-hidden="true" />
            <input
              defaultValue={placement.adsenseSlot}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              inputMode="numeric"
              placeholder="1234567890"
            />
          </span>
        </label>
        <label className="block text-sm font-medium text-[#101410]">
          AdSense format
          <select
            value={adsenseFormat}
            onChange={(event) => setAdsenseFormat(event.target.value as AdPlacement["adsenseFormat"])}
            className="mt-2 h-11 w-full rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none"
          >
            <option value="auto">auto</option>
            <option value="horizontal">horizontal</option>
            <option value="rectangle">rectangle</option>
            <option value="vertical">vertical</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-[#101410]">
          Destination URL
          <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-[#d8d1c3] bg-white px-3">
            <Link2 className="size-4 shrink-0 text-[#0d8b66]" aria-hidden="true" />
            <input
              defaultValue={placement.destinationUrl}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              placeholder="https://..."
            />
          </span>
        </label>
        <label className="block text-sm font-medium text-[#101410]">
          Direct embed code
          <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-[#d8d1c3] bg-white px-3">
            <Code2 className="size-4 shrink-0 text-[#234f7a]" aria-hidden="true" />
            <input
              defaultValue={placement.embedCode}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              placeholder="<ins class=...>"
            />
          </span>
        </label>
      </div>

      <AdBanner
        className="mt-4"
        placement={placement.id}
        slot={placement.adsenseSlot}
        format={adsenseFormat}
        fallbackTitle={placement.sponsor}
        fallbackCopy={placement.copy}
        fallbackHref={placement.destinationUrl}
        compact
      />

      <div className="mt-4 grid gap-2 text-sm text-[#4d5651] sm:grid-cols-3">
        <span className="rounded-md bg-[#f2eee4] px-3 py-2">{placement.period}</span>
        <span className="rounded-md bg-[#eef5f3] px-3 py-2">{placement.impressions} views</span>
        <span className="rounded-md bg-[#fff7e7] px-3 py-2">{clickRate} CTR</span>
      </div>
    </article>
  );
}

export function AdminConsole({ adminPassword }: { adminPassword: string }) {
  const [activeTab, setActiveTab] = useState<AdminTab>("review");
  const [query, setQuery] = useState("");
  const [pendingArtisans, setPendingArtisans] = useState<LiveAdminArtisan[]>([]);
  const [managedArtisans, setManagedArtisans] = useState<LiveAdminArtisan[]>([]);
  const [artisanMetrics, setArtisanMetrics] = useState({ pending: 0, active: 0, removed: 0, rejected: 0 });
  const [reviewBadges, setReviewBadges] = useState<Record<string, string>>({});
  const [loadingArtisans, setLoadingArtisans] = useState(true);
  const [artisanError, setArtisanError] = useState("");
  const [mutatingArtisanId, setMutatingArtisanId] = useState("");
  const [hiddenReviewIds, setHiddenReviewIds] = useState<string[]>([]);
  const [deletedJobIds, setDeletedJobIds] = useState<string[]>([]);
  const [adminNotice, setAdminNotice] = useState("");
  const activeArtisanCount = artisanMetrics.active;
  const livePlacementCount = adPlacements.filter((placement) => placement.status === "Live").length;
  const visibleJobRequests = jobRequests.filter((job) => !deletedJobIds.includes(job.id));
  const cleanupQueueCount = visibleJobRequests.filter((job) => job.cleanupEligible).length;

  const applyPayload = useCallback((payload: AdminArtisanPayload) => {
    setPendingArtisans((payload.pending || []).map((artisan) => ({ ...artisan, serviceTags: artisan.serviceTags || [] })));
    setManagedArtisans((payload.artisans || []).map((artisan) => ({ ...artisan, serviceTags: artisan.serviceTags || [] })));
    setArtisanMetrics(payload.metrics || { pending: 0, active: 0, removed: 0, rejected: 0 });
  }, []);

  const loadArtisans = useCallback(async () => {
    setLoadingArtisans(true);
    setArtisanError("");

    try {
      const payload = await invokePublicFunction<AdminArtisanPayload>("artisanmu-admin-artisans", {
        admin_password: adminPassword,
        action: "list",
      });
      applyPayload(payload);
    } catch (error) {
      setArtisanError(error instanceof Error ? error.message : "Could not load artisan applications.");
      setPendingArtisans([]);
      setManagedArtisans([]);
      setArtisanMetrics({ pending: 0, active: 0, removed: 0, rejected: 0 });
    } finally {
      setLoadingArtisans(false);
    }
  }, [adminPassword, applyPayload]);

  async function mutateArtisan(
    action: "approve" | "reject" | "remove" | "set_badges",
    artisanId: string,
    badges: string[] = [],
  ) {
    setMutatingArtisanId(`${action}:${artisanId}`);
    setArtisanError("");

    try {
      const payload = await invokePublicFunction<AdminArtisanPayload>("artisanmu-admin-artisans", {
        admin_password: adminPassword,
        action,
        artisan_id: artisanId,
        badges,
      });
      applyPayload(payload);
    } catch (error) {
      setArtisanError(error instanceof Error ? error.message : "Artisan update failed.");
    } finally {
      setMutatingArtisanId("");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadArtisans();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadArtisans]);

  const filteredPending = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return pendingArtisans;

    return pendingArtisans.filter((artisan) =>
      [artisan.name, artisan.trade, artisan.town, artisan.district, artisan.phone, ...artisan.serviceTags]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [pendingArtisans, query]);

  const filteredManagedArtisans = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return managedArtisans;

    return managedArtisans.filter((artisan) =>
      [artisan.name, artisan.trade, artisan.town, artisan.district, artisan.phone, artisan.email, ...artisan.serviceTags]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [managedArtisans, query]);

  return (
    <main className="min-h-screen bg-[#f6f4ef] pb-20 text-[#101410] md:pb-0">
      <header className="border-b border-[#26362e] bg-[#0d1612] text-[#f6f4ef]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f6f4ef] text-[#0d1612]">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">ArtisanMU Admin</p>
              <p className="truncate text-xs text-[#b7c4bd]">Validation, ads and marketplace controls</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm text-[#dbe5df] sm:flex">
            <Sparkles className="size-4 text-[#c79b55]" aria-hidden="true" />
            Admin mode
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav className="sticky top-5 grid gap-2">
            {adminTabs.map((item) => {
              const Icon = item.icon;
              const selected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold ${
                    selected
                      ? "bg-[#0d1612] text-white"
                      : "border border-[#ddd8cd] bg-[#fffdf8] text-[#4d5651]"
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Pending artisans" value={`${artisanMetrics.pending}`} icon={UserCheck} tone="bg-[#e8f6f1] text-[#0d7c5c]" />
            <Metric label="Active artisans" value={`${activeArtisanCount}`} icon={ShieldCheck} tone="bg-[#eef5f3] text-[#234f7a]" />
            <Metric label="Live placements" value={`${livePlacementCount}`} icon={Megaphone} tone="bg-[#fff7e7] text-[#78511c]" />
            <Metric label="Cleanup queue" value={`${cleanupQueueCount}`} icon={Clock} tone="bg-[#f8e9e7] text-[#9f4a4a]" />
          </div>

          <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-[#0d8b66]">Admin</p>
              <h1 className="text-2xl font-semibold text-[#101410]">
                {activeTab === "review" && "Validate artisans"}
                {activeTab === "artisans" && "Manage artisans"}
                {activeTab === "ads" && "Manage ads"}
                {activeTab === "requests" && "Monitor jobs"}
                {activeTab === "rules" && "Automation rules"}
              </h1>
            </div>
            <label className="flex h-11 min-w-0 items-center gap-2 rounded-md border border-[#d8d1c3] bg-white px-3 md:w-80">
              <Search className="size-4 shrink-0 text-[#0d8b66]" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8b928e]"
                placeholder="Search artisan, phone, trade..."
              />
            </label>
          </div>

          {activeTab === "review" ? (
            <div className="mt-4 grid gap-3">
              {artisanError ? (
                <EmptyState
                  title="Could not load artisans"
                  copy={artisanError}
                  action={
                    <button
                      type="button"
                      onClick={loadArtisans}
                      className="inline-flex h-11 items-center justify-center rounded-md bg-[#0d1612] px-4 text-sm font-semibold text-white"
                    >
                      Retry
                    </button>
                  }
                />
              ) : loadingArtisans ? (
                <EmptyState title="Loading artisan applications" copy="Fetching pending applications from Supabase." />
              ) : filteredPending.length ? (
                filteredPending.map((artisan) => (
                  <ReviewCard
                    key={artisan.id}
                    artisan={artisan}
                    badge={reviewBadges[artisan.id] || "Verified"}
                    busy={mutatingArtisanId.endsWith(`:${artisan.id}`)}
                    onBadge={(badge) => setReviewBadges((current) => ({ ...current, [artisan.id]: badge }))}
                    onApprove={() => {
                      const selectedBadge = reviewBadges[artisan.id] || "Verified";
                      void mutateArtisan(
                        "approve",
                        artisan.id,
                        selectedBadge === "Verified" || selectedBadge === "No extra badge" ? [] : [selectedBadge],
                      );
                    }}
                    onReject={() => void mutateArtisan("reject", artisan.id)}
                  />
                ))
              ) : (
                <EmptyState
                  title="No artisan applications"
                  copy="New real artisan submissions will appear here after signup."
                />
              )}
            </div>
          ) : null}

          {activeTab === "artisans" ? (
            <div className="mt-4 grid gap-3">
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="grid gap-3">
                  {artisanError ? (
                    <EmptyState
                      title="Could not load artisans"
                      copy={artisanError}
                      action={
                        <button
                          type="button"
                          onClick={loadArtisans}
                          className="inline-flex h-11 items-center justify-center rounded-md bg-[#0d1612] px-4 text-sm font-semibold text-white"
                        >
                          Retry
                        </button>
                      }
                    />
                  ) : loadingArtisans ? (
                    <EmptyState title="Loading artisans" copy="Fetching verified and reviewed artisans from Supabase." />
                  ) : filteredManagedArtisans.length ? (
                    filteredManagedArtisans.map((artisan) => {
                      const busy = mutatingArtisanId.endsWith(`:${artisan.id}`);
                      const removable = artisan.status === "approved";
                      const currentBadges = artisan.badges.filter((badge): badge is BadgeName =>
                        badgeOptions.includes(badge as BadgeName),
                      );
                      return (
                        <article key={artisan.id} className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-semibold text-[#101410]">{artisan.name}</h3>
                                <span className={`rounded-md px-2 py-1 text-xs font-semibold ${statusClass(artisan.status)}`}>
                                  {artisan.status}
                                </span>
                                {!artisan.hasAuthUser ? (
                                  <span className="rounded-md bg-[#f8e9e7] px-2 py-1 text-xs font-semibold text-[#9f4a4a]">
                                    no login
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-sm text-[#5f6a64]">
                                {artisan.trade} - {artisan.town}, {artisan.district}
                              </p>
                              <p className="mt-1 text-xs text-[#6c756f]">
                                {artisan.email || "No email"} - {artisan.photoCount} portfolio photos
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                void mutateArtisan(removable ? "remove" : "approve", artisan.id, currentBadges)
                              }
                              disabled={busy}
                              className={`inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold ${
                                removable
                                  ? "bg-[#9f4a4a] text-white"
                                  : "bg-[#e8f6f1] text-[#0d7c5c]"
                              } disabled:cursor-wait disabled:opacity-70`}
                            >
                              {removable ? (
                                <Trash2 className="size-4" aria-hidden="true" />
                              ) : (
                                <CheckCircle2 className="size-4" aria-hidden="true" />
                              )}
                              {removable ? "Remove" : "Approve"}
                            </button>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {artisan.verified ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-[#e8f6f1] px-2.5 py-1 text-xs font-semibold text-[#0d7c5c]">
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
                                  onClick={() => void mutateArtisan("set_badges", artisan.id, nextBadges)}
                                  disabled={busy}
                                  className={`inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-semibold ${
                                    enabled
                                      ? "bg-[#e8f6f1] text-[#0d7c5c]"
                                      : "border border-[#ddd8cd] bg-white text-[#4d5651]"
                                  } disabled:cursor-wait disabled:opacity-70`}
                                >
                                  <BadgeCheck className="size-3.5" aria-hidden="true" />
                                  {badge}
                                </button>
                              );
                            })}
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#fff7e7] px-2.5 py-1 text-xs text-[#78511c]">
                              <Star className="size-3.5" aria-hidden="true" />
                              {artisan.reviews} reviews
                            </span>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <EmptyState
                      title="No managed artisans"
                      copy="Approved, rejected, and removed artisans will appear here after review actions."
                    />
                  )}
                </div>

                <aside className="grid gap-3">
                  <article className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm">
                    <h3 className="font-semibold text-[#101410]">Reviews</h3>
                    <div className="mt-3 grid gap-3">
                      {reviewItems.length ? (
                        reviewItems.map((review) => {
                          const hidden = hiddenReviewIds.includes(review.id) || review.status === "Hidden";
                          return (
                            <div key={review.id} className="rounded-md border border-[#ddd8cd] bg-[#f8f4ea] p-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-[#101410]">{review.artisan}</p>
                                <span className={`rounded-md px-2 py-1 text-xs font-semibold ${statusClass(hidden ? "Removed" : review.status)}`}>
                                  {hidden ? "Hidden" : review.status}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-[#5f6a64]">
                                {review.client} - {review.rating}/5 - {review.age}
                              </p>
                              <p className="mt-2 text-sm leading-5 text-[#4d5651]">{review.comment}</p>
                              <button
                                type="button"
                                onClick={() =>
                                  setHiddenReviewIds((current) =>
                                    current.includes(review.id)
                                      ? current.filter((id) => id !== review.id)
                                      : [...current, review.id],
                                  )
                                }
                                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-md border border-[#ddd8cd] bg-white text-sm font-semibold text-[#0d1612]"
                              >
                                {hidden ? "Show review" : "Hide review"}
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <p className="rounded-md border border-[#ddd8cd] bg-[#f8f4ea] p-3 text-sm leading-5 text-[#5f6a64]">
                          Reviews from completed real jobs will appear here.
                        </p>
                      )}
                    </div>
                  </article>

                  <article className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm">
                    <h3 className="font-semibold text-[#101410]">Comments</h3>
                    <div className="mt-3 grid gap-3">
                      {commentThreads.length ? (
                        commentThreads.map((thread) => (
                          <div key={thread.id} className="rounded-md border border-[#ddd8cd] bg-white p-3">
                            <div className="flex items-center gap-2 font-semibold text-[#101410]">
                              <MessageSquareText className="size-4 text-[#234f7a]" aria-hidden="true" />
                              {thread.artisan}
                            </div>
                            <p className="mt-1 text-xs text-[#6c756f]">{thread.job} - {thread.status}</p>
                            <p className="mt-2 text-sm leading-5 text-[#4d5651]">{thread.lastMessage}</p>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-md border border-[#ddd8cd] bg-white p-3 text-sm leading-5 text-[#5f6a64]">
                          Comment threads will appear after real jobs start.
                        </p>
                      )}
                    </div>
                  </article>
                </aside>
              </div>
            </div>
          ) : null}

          {activeTab === "ads" ? (
            <div className="mt-4 grid gap-3">
              <div className="rounded-lg border border-[#d7c292] bg-[#fff8e8] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#78511c]">
                      <SlidersHorizontal className="size-4" aria-hidden="true" />
                      Placement builder
                    </div>
                    <p className="mt-1 text-sm leading-5 text-[#60451f]">
                      Use AdSense responsive slots when available; direct partner banners stay clearly labeled.
                    </p>
                  </div>
                  <span className="w-fit rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-[#78511c]">
                    Label: Advertisements
                  </span>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-6">
                  <input className="h-11 rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none" placeholder="Sponsor name" />
                  <select className="h-11 rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none">
                    <option>Search results</option>
                    <option>Request panel</option>
                    <option>Artisan dashboard</option>
                  </select>
                  <select className="h-11 rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none">
                    <option>AdSense responsive</option>
                    <option>Direct banner</option>
                    <option>Direct link</option>
                  </select>
                  <input className="h-11 rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none" inputMode="numeric" placeholder="AdSense slot ID" />
                  <input className="h-11 rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none" placeholder="https://destination" />
                  <button
                    type="button"
                    onClick={() => setAdminNotice("Ad draft saved locally for this admin session. Live ad storage is not connected yet.")}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0d1612] px-4 text-sm font-semibold text-white"
                  >
                    <CircleDollarSign className="size-4" aria-hidden="true" />
                    Save draft
                  </button>
                </div>
                {adminNotice ? (
                  <p className="mt-3 rounded-md border border-[#d7c292] bg-white px-3 py-2 text-sm font-medium text-[#78511c]">
                    {adminNotice}
                  </p>
                ) : null}
                <div className="mt-3 grid gap-2 text-xs text-[#60451f] sm:grid-cols-3">
                  <span className="rounded-md bg-white px-3 py-2">Keep away from navigation and primary CTAs</span>
                  <span className="rounded-md bg-white px-3 py-2">No popups, overlays, or auto-refresh</span>
                  <span className="rounded-md bg-white px-3 py-2">Use responsive width with stable spacing</span>
                </div>
              </div>
              {adPlacements.length ? (
                adPlacements.map((placement) => (
                  <AdEditor key={placement.id} placement={placement} />
                ))
              ) : (
                <EmptyState
                  title="No ad placements configured"
                  copy="Create a direct banner or add real AdSense slot IDs before public monetization starts."
                />
              )}
            </div>
          ) : null}

          {activeTab === "requests" ? (
            visibleJobRequests.length ? (
              <div className="mt-4 overflow-hidden rounded-lg border border-[#ddd8cd] bg-[#fffdf8] shadow-sm">
                <div className="grid gap-3 border-b border-[#ddd8cd] bg-[#f8f4ea] px-4 py-3 text-xs font-semibold uppercase text-[#6c756f] md:grid-cols-[90px_1fr_150px_130px_130px]">
                  <span>ID</span>
                  <span>Request</span>
                  <span>Status</span>
                  <span>Assigned</span>
                  <span>Age</span>
                </div>
                {visibleJobRequests.map((job) => (
                  <article key={job.id} className="grid gap-2 border-b border-[#eee8dc] px-4 py-4 text-sm last:border-b-0 md:grid-cols-[90px_1fr_150px_130px_130px] md:items-center">
                    <span className="font-mono text-xs text-[#6c756f]">{job.id}</span>
                    <div>
                      <p className="font-semibold text-[#101410]">{job.trade}</p>
                      <p className="text-[#5f6a64]">
                        {job.client} - {job.town}, {job.district}
                      </p>
                    </div>
                    <span className={`w-fit rounded-md px-2 py-1 text-xs font-semibold ${statusClass(job.status)}`}>
                      {job.status}
                    </span>
                    <span className="text-[#4d5651]">{job.assignedTo}</span>
                    <div className="grid gap-2">
                      <span className="text-[#4d5651]">{job.age}</span>
                      {job.cleanupEligible ? (
                        <button
                          type="button"
                          onClick={() => setDeletedJobIds((current) => [...current, job.id])}
                          className="inline-flex h-9 items-center justify-center gap-1 rounded-md bg-[#9f4a4a] px-2 text-xs font-semibold text-white"
                        >
                          <ImageIcon className="size-3.5" aria-hidden="true" />
                          Delete photo job
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState
                  title="No job requests"
                  copy="Real client requests, assigned artisans, and photo cleanup tasks will appear here after request storage is connected."
                />
              </div>
            )
          ) : null}

          {activeTab === "rules" ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                ["Auto-rotate unmatched requests", "Ping 3 verified artisans, then pause for manual review."],
                ["Badge guardrails", "Only ArtisanMU admins can grant badges until RLS is hardened."],
                ["Ad safety", "Require sponsor, label, dates, budget and surface before publishing."],
                ["Review prompts", "Ask clients for rating 24 hours after a job is marked done."],
              ].map(([title, copy]) => (
                <article key={title} className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm">
                  <div className="flex items-center gap-2 font-semibold text-[#101410]">
                    <ChartNoAxesColumn className="size-4 text-[#234f7a]" aria-hidden="true" />
                    {title}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#5f6a64]">{copy}</p>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#ddd8cd] bg-[#fffdf8] px-2 py-2 shadow-lg lg:hidden">
        {adminTabs.map((item) => {
          const Icon = item.icon;
          const selected = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-xs font-semibold ${
                selected ? "bg-[#0d1612] text-white" : "text-[#5f6a64]"
              }`}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </main>
  );
}
