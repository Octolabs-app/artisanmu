"use client";

import { useMemo, useState } from "react";
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
  activeArtisans,
  adPlacements,
  commentThreads,
  jobRequests,
  pendingArtisans,
  reviewItems,
  type AdPlacement,
  type PendingArtisan,
} from "@/lib/admin-data";

const adminTabs = [
  { id: "review", label: "Review", icon: UserCheck },
  { id: "artisans", label: "Artisans", icon: ShieldCheck },
  { id: "ads", label: "Ads", icon: Megaphone },
  { id: "requests", label: "Jobs", icon: BriefcaseBusiness },
  { id: "rules", label: "Rules", icon: Settings },
] as const;

type AdminTab = (typeof adminTabs)[number]["id"];

function statusClass(status: string) {
  if (status === "Live" || status === "Low" || status === "Claimed") {
    return "bg-[#e8f6f1] text-[#0d7c5c]";
  }
  if (status === "Draft" || status === "Review" || status === "Matching") {
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

function ReviewCard({
  artisan,
  onApprove,
  approved,
}: {
  artisan: PendingArtisan;
  onApprove: (id: string) => void;
  approved: boolean;
}) {
  return (
    <article className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-[#101410]">{artisan.name}</h3>
            <span className={`rounded-md px-2 py-1 text-xs font-semibold ${statusClass(artisan.risk)}`}>
              {artisan.risk}
            </span>
          </div>
          <p className="mt-1 text-sm text-[#5f6a64]">
            {artisan.trade} - {artisan.town}, {artisan.district}
          </p>
        </div>
        <p className="text-sm font-medium text-[#0d8b66]">{artisan.submittedAt} ago</p>
      </div>

      <p className="mt-3 text-sm leading-6 text-[#4d5651]">{artisan.notes}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {artisan.checks.map((check) => (
          <span key={check} className="rounded-md border border-[#ddd8cd] bg-white px-2.5 py-1 text-xs text-[#4d5651]">
            {check}
          </span>
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
        <label className="flex h-11 min-w-0 items-center gap-2 rounded-md border border-[#d8d1c3] bg-white px-3 text-sm">
          <BadgeCheck className="size-4 shrink-0 text-[#234f7a]" aria-hidden="true" />
          <select className="min-w-0 flex-1 bg-transparent outline-none" defaultValue={artisan.badge}>
            <option>Verified</option>
            <option>Fair price</option>
            <option>Fast response</option>
            <option>Top rated</option>
          </select>
        </label>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#ddd8cd] bg-white px-4 text-sm font-semibold text-[#0d1612]">
          <MessageCircle className="size-4" aria-hidden="true" />
          WhatsApp
        </button>
        <button
          type="button"
          onClick={() => onApprove(artisan.id)}
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold ${
            approved
              ? "bg-[#e8f6f1] text-[#0d7c5c]"
              : "bg-[#0d1612] text-white hover:bg-[#17251e]"
          }`}
        >
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {approved ? "Approved" : "Approve"}
        </button>
      </div>
    </article>
  );
}

function AdEditor({ placement }: { placement: AdPlacement }) {
  const [status, setStatus] = useState(placement.status);
  const [format, setFormat] = useState(placement.format);
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
              <option>Native card</option>
              <option>Banner link</option>
              <option>Embed code</option>
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
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0d8b66] px-4 text-sm font-semibold text-white hover:bg-[#0b7758]">
            <Eye className="size-4" aria-hidden="true" />
            Preview
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
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
          Embed slot or code
          <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-[#d8d1c3] bg-white px-3">
            <Code2 className="size-4 shrink-0 text-[#234f7a]" aria-hidden="true" />
            <input
              defaultValue={placement.embedCode}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              placeholder="<ins data-ad-slot=...>"
            />
          </span>
        </label>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-[#4d5651] sm:grid-cols-3">
        <span className="rounded-md bg-[#f2eee4] px-3 py-2">{placement.period}</span>
        <span className="rounded-md bg-[#eef5f3] px-3 py-2">{placement.impressions} views</span>
        <span className="rounded-md bg-[#fff7e7] px-3 py-2">{clickRate} CTR</span>
      </div>
    </article>
  );
}

export function AdminConsole() {
  const [activeTab, setActiveTab] = useState<AdminTab>("review");
  const [query, setQuery] = useState("");
  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [removedArtisanIds, setRemovedArtisanIds] = useState<string[]>([]);
  const [hiddenReviewIds, setHiddenReviewIds] = useState<string[]>([]);
  const [deletedJobIds, setDeletedJobIds] = useState<string[]>([]);

  const filteredPending = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return pendingArtisans;

    return pendingArtisans.filter((artisan) =>
      [artisan.name, artisan.trade, artisan.town, artisan.district, artisan.phone]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query]);

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
            <Metric label="Pending artisans" value={`${pendingArtisans.length}`} icon={UserCheck} tone="bg-[#e8f6f1] text-[#0d7c5c]" />
            <Metric label="Active artisans" value={`${activeArtisans.length - removedArtisanIds.length}`} icon={ShieldCheck} tone="bg-[#eef5f3] text-[#234f7a]" />
            <Metric label="Live placements" value="1" icon={Megaphone} tone="bg-[#fff7e7] text-[#78511c]" />
            <Metric label="Cleanup queue" value={`${jobRequests.filter((job) => job.cleanupEligible && !deletedJobIds.includes(job.id)).length}`} icon={Clock} tone="bg-[#f8e9e7] text-[#9f4a4a]" />
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
              {filteredPending.map((artisan) => (
                <ReviewCard
                  key={artisan.id}
                  artisan={artisan}
                  approved={approvedIds.includes(artisan.id)}
                  onApprove={(id) =>
                    setApprovedIds((current) =>
                      current.includes(id) ? current : [...current, id],
                    )
                  }
                />
              ))}
            </div>
          ) : null}

          {activeTab === "artisans" ? (
            <div className="mt-4 grid gap-3">
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="grid gap-3">
                  {activeArtisans.map((artisan) => {
                    const removed = removedArtisanIds.includes(artisan.id);
                    return (
                      <article key={artisan.id} className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold text-[#101410]">{artisan.name}</h3>
                              <span className={`rounded-md px-2 py-1 text-xs font-semibold ${statusClass(removed ? "Removed" : artisan.status)}`}>
                                {removed ? "Removed" : artisan.status}
                              </span>
                              {artisan.flags ? (
                                <span className="rounded-md bg-[#f8e9e7] px-2 py-1 text-xs font-semibold text-[#9f4a4a]">
                                  {artisan.flags} flag
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-sm text-[#5f6a64]">
                              {artisan.trade} - {artisan.town}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setRemovedArtisanIds((current) =>
                                current.includes(artisan.id)
                                  ? current.filter((id) => id !== artisan.id)
                                  : [...current, artisan.id],
                              )
                            }
                            className={`inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold ${
                              removed
                                ? "bg-[#e8f6f1] text-[#0d7c5c]"
                                : "bg-[#9f4a4a] text-white"
                            }`}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                            {removed ? "Restore" : "Remove"}
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {artisan.badges.map((badge) => (
                            <span key={badge} className="inline-flex items-center gap-1 rounded-md bg-[#e8f6f1] px-2.5 py-1 text-xs font-semibold text-[#0d7c5c]">
                              <BadgeCheck className="size-3.5" aria-hidden="true" />
                              {badge}
                            </span>
                          ))}
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#fff7e7] px-2.5 py-1 text-xs text-[#78511c]">
                            <Star className="size-3.5" aria-hidden="true" />
                            {artisan.reviews} reviews
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <aside className="grid gap-3">
                  <article className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm">
                    <h3 className="font-semibold text-[#101410]">Reviews</h3>
                    <div className="mt-3 grid gap-3">
                      {reviewItems.map((review) => {
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
                      })}
                    </div>
                  </article>

                  <article className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm">
                    <h3 className="font-semibold text-[#101410]">Comments</h3>
                    <div className="mt-3 grid gap-3">
                      {commentThreads.map((thread) => (
                        <div key={thread.id} className="rounded-md border border-[#ddd8cd] bg-white p-3">
                          <div className="flex items-center gap-2 font-semibold text-[#101410]">
                            <MessageSquareText className="size-4 text-[#234f7a]" aria-hidden="true" />
                            {thread.artisan}
                          </div>
                          <p className="mt-1 text-xs text-[#6c756f]">{thread.job} - {thread.status}</p>
                          <p className="mt-2 text-sm leading-5 text-[#4d5651]">{thread.lastMessage}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                </aside>
              </div>
            </div>
          ) : null}

          {activeTab === "ads" ? (
            <div className="mt-4 grid gap-3">
              <div className="rounded-lg border border-[#d7c292] bg-[#fff8e8] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#78511c]">
                  <SlidersHorizontal className="size-4" aria-hidden="true" />
                  Placement builder
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-5">
                  <input className="h-11 rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none" placeholder="Sponsor name" />
                  <select className="h-11 rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none">
                    <option>Search results</option>
                    <option>Request panel</option>
                    <option>Artisan dashboard</option>
                  </select>
                  <input className="h-11 rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none" placeholder="Budget" />
                  <input className="h-11 rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none" placeholder="https://destination" />
                  <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0d1612] px-4 text-sm font-semibold text-white">
                    <CircleDollarSign className="size-4" aria-hidden="true" />
                    Save draft
                  </button>
                </div>
              </div>
              {adPlacements.map((placement) => (
                <AdEditor key={placement.id} placement={placement} />
              ))}
            </div>
          ) : null}

          {activeTab === "requests" ? (
            <div className="mt-4 overflow-hidden rounded-lg border border-[#ddd8cd] bg-[#fffdf8] shadow-sm">
              <div className="grid gap-3 border-b border-[#ddd8cd] bg-[#f8f4ea] px-4 py-3 text-xs font-semibold uppercase text-[#6c756f] md:grid-cols-[90px_1fr_150px_130px_130px]">
                <span>ID</span>
                <span>Request</span>
                <span>Status</span>
                <span>Assigned</span>
                <span>Age</span>
              </div>
              {jobRequests.filter((job) => !deletedJobIds.includes(job.id)).map((job) => (
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
