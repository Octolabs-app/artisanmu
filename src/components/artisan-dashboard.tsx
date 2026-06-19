"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Gauge,
  ImagePlus,
  LoaderCircle,
  LogOut,
  MapPin,
  MessageSquareText,
  PauseCircle,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  TimerReset,
  Trash2,
  UserRound,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/components/language-context";
import { AdBanner } from "@/components/ad-banner";
import { ArtisanMuLogo } from "@/components/artisanmu-logo";
import { UrgentJobCard } from "@/components/UrgentJobCard";
import { TagInput } from "@/components/tag-input";
import { commentThreads, reviewItems } from "@/lib/admin-data";
import { invokeUserFunction } from "@/lib/artisanmu-functions";
import {
  mapSupabaseArtisan,
  ownArtisanProfileSelect,
  type SupabaseArtisanProfile,
} from "@/lib/artisan-profile";
import { getBrowserSupabase, getMissingBrowserSupabaseEnv } from "@/lib/supabase-browser";
import { districtOptions, serviceTagOptions } from "@/lib/service-options";
import {
  WEEK_DAYS,
  defaultWeekHours,
  isOpenNow,
  todayHoursLabel,
  type DayKey,
  type WeekHours,
} from "@/lib/availability";
import type { Artisan } from "@/lib/types";

const dashboardTabs = [
  { id: "jobs", label: "Jobs", icon: Wrench },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "settings", label: "More", icon: Settings },
] as const;

type DashboardTab = (typeof dashboardTabs)[number]["id"];
type DashboardStatus = "loading" | "missing-config" | "signed-out" | "no-profile" | "ready";

type JobNotificationStatus = "pending" | "read" | "claimed" | "dismissed" | "expired";

type DashboardJobRow = {
  id: string;
  category: string | null;
  description: string;
  district: string | null;
  town: string | null;
  urgency: "urgent" | "planned" | null;
  status: string;
  created_at: string;
  expires_at: string | null;
  customer_display_name: string | null;
  photo_storage_path: string | null;
};

type DashboardNotificationRow = {
  id: string;
  status: JobNotificationStatus;
  urgency: "urgent" | "planned";
  created_at: string;
  job: DashboardJobRow | DashboardJobRow[] | null;
};

type DashboardNotification = {
  id: string;
  status: JobNotificationStatus;
  urgency: "urgent" | "planned";
  createdAt: string;
  job: DashboardJobRow;
};

type OpenBoardJob = {
  id: string;
  shortId: string;
  trade: string;
  description: string;
  town: string;
  district: string;
  client: string;
  urgency: "urgent" | "planned" | string;
  createdAt: string;
  expiresAt: string | null;
};

type ProfileFormState = {
  town: string;
  district: string;
  bio: string;
  specialties: string;
  serviceTags: string[];
  contactPreference: string;
  workingHours: WeekHours;
};

const allowedPortfolioTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const maxPortfolioBytes = 5 * 1024 * 1024;

function joinedJob(value: DashboardNotificationRow["job"]) {
  return Array.isArray(value) ? value[0] || null : value;
}

function validatePortfolioFiles(files: File[]) {
  if (!files.length) return "Choose at least one photo.";
  if (files.length > 6) return "Upload up to 6 photos at once.";

  const invalid = files.find((file) => !allowedPortfolioTypes.includes(file.type) || file.size <= 0 || file.size > maxPortfolioBytes);
  if (invalid) return "Use JPG, PNG, WebP, or GIF images under 5 MB.";

  return "";
}

async function uploadPortfolioPhoto(file: File) {
  const supabase = getBrowserSupabase();
  if (!supabase) {
    throw new Error("Portfolio uploads are not configured for this build.");
  }

  const signPayload = await invokeUserFunction<{
    token?: string;
    path?: string;
    bucket?: string;
    message?: string;
  }>("artisanmu-sign-upload", {
    purpose: "artisan-portfolio",
    filename: file.name,
    content_type: file.type,
    size: file.size,
  });

  if (!signPayload.token || !signPayload.path || signPayload.bucket !== "portfolios") {
    throw new Error(signPayload.message || "Portfolio upload could not start.");
  }

  const { error } = await supabase.storage
    .from("portfolios")
    .uploadToSignedUrl(signPayload.path, signPayload.token, file);

  if (error) throw new Error(error.message || "Portfolio upload failed.");
  return signPayload.path;
}

function profileCompletion(artisan: Artisan) {
  const checks = [
    artisan.name && artisan.name !== "Artisan",
    artisan.phone,
    artisan.trade && artisan.trade !== "Artisan",
    artisan.town && artisan.town !== "Maurice",
    artisan.bio && artisan.bio !== "Profil verifie par ArtisanMu.",
    artisan.specialties.length > 0,
    artisan.serviceTags.length > 0,
    artisan.portfolioImages.length > 0,
  ];
  const complete = checks.filter(Boolean).length;

  return Math.round((complete / checks.length) * 100);
}

function EmptyDashboard({
  title,
  copy,
  actionLabel = "Log in",
  showSpinner = false,
}: {
  title: string;
  copy: string;
  actionLabel?: string;
  showSpinner?: boolean;
}) {
  return (
    <main className="min-h-screen bg-[#f6f4ef] text-[var(--ink)]">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[#f6f4ef]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="Artizan Moris home">
            <ArtisanMuLogo subtitle="Artisan dashboard" />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md bg-[#0d1612] px-4 text-sm font-semibold text-white"
          >
            Login
          </Link>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-74px)] max-w-3xl place-items-center px-4 py-8 sm:px-6">
        <div className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-5 shadow-sm sm:p-6">
          <div className="flex size-12 items-center justify-center rounded-lg bg-[#0d1612] text-white">
            {showSpinner ? (
              <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <Wrench className="size-5" aria-hidden="true" />
            )}
          </div>
          <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{copy}</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[var(--green)] px-4 text-sm font-semibold text-white"
            >
              {actionLabel}
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[#0d1612]"
            >
              Back to marketplace
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function PendingArtisanDashboard({
  artisan,
  onSignOut,
}: {
  artisan: Artisan;
  onSignOut: () => void;
}) {
  const statusCopy =
    artisan.verificationStatus === "rejected"
      ? "Your application was not approved. Contact Octolabs if you need the review details reopened."
      : artisan.verificationStatus === "removed"
        ? "This artisan profile has been removed from active matching."
        : "Your application is waiting for admin validation. Job notifications and the full dashboard stay locked until approval.";

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-[var(--surface-soft)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" aria-label="Artizan Moris home">
            <ArtisanMuLogo subtitle="Application status" />
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold text-[#0d1612]"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-5xl place-items-center px-4 py-6 sm:px-6">
        <div className="grid w-full gap-4 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-5 shadow-sm sm:grid-cols-[120px_minmax(0,1fr)] sm:p-6">
          <div className="relative size-28 overflow-hidden rounded-lg bg-[#ddd8cd]">
            <Image
              src={artisan.image}
              alt={artisan.name}
              fill
              sizes="112px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-md bg-[#fff7e7] px-2.5 py-1.5 text-xs font-semibold text-[#78511c]">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              {artisan.verificationStatus === "pending" ? "Pending review" : artisan.verificationStatus || "Pending review"}
            </span>
            <h1 className="mt-3 text-2xl font-semibold text-[var(--ink)]">{artisan.name}</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {artisan.trade} - {artisan.town}, {artisan.district}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{statusCopy}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link
                href="/"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[#0d1612]"
              >
                Back to marketplace
              </Link>
              <Link
                href="mailto:hello@octolabs.app?subject=Artizan%20Moris%20application%20review"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#0d1612] px-4 text-sm font-semibold text-white"
              >
                Contact Octolabs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export function ArtisanDashboard() {
  const { language, copy } = useLanguage();
  const dc = copy.dashboard;
  const tabLabel: Record<DashboardTab, string> = {
    jobs: dc.tabJobs,
    profile: dc.tabProfile,
    reviews: dc.tabReviews,
    settings: dc.tabSettings,
  };
  const [activeTab, setActiveTab] = useState<DashboardTab>("jobs");
  const [artisan, setArtisan] = useState<Artisan | null>(null);
  const [status, setStatus] = useState<DashboardStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [available, setAvailable] = useState(false);
  const [jobNotifications, setJobNotifications] = useState<DashboardNotification[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState("");
  const [openJobs, setOpenJobs] = useState<OpenBoardJob[]>([]);
  const [openJobsLoading, setOpenJobsLoading] = useState(false);
  const [openJobsError, setOpenJobsError] = useState("");
  const [claimedJobs, setClaimedJobs] = useState<DashboardNotification[]>([]);
  const [unclaimingId, setUnclaimingId] = useState("");
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [portfolioSaving, setPortfolioSaving] = useState(false);
  const [portfolioMessage, setPortfolioMessage] = useState("");
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    town: "",
    district: "",
    bio: "",
    specialties: "",
    serviceTags: [],
    contactPreference: "whatsapp",
    workingHours: {},
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [handledReviewIds, setHandledReviewIds] = useState<string[]>([]);
  const [accountAction, setAccountAction] = useState<"" | "deactivate" | "reactivate" | "delete">("");
  const [accountWorking, setAccountWorking] = useState(false);
  const [accountMessage, setAccountMessage] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const supabase = useMemo(() => getBrowserSupabase(), []);

  const reviewsForArtisan = useMemo(
    () => (artisan ? reviewItems.filter((review) => review.artisan === artisan.name) : []),
    [artisan],
  );
  const commentsForArtisan = useMemo(
    () => (artisan ? commentThreads.filter((thread) => thread.artisan === artisan.name) : []),
    [artisan],
  );

  const completion = artisan ? profileCompletion(artisan) : 0;
  const profileTasks = useMemo<Array<[string, string, LucideIcon]>>(() => {
    if (!artisan) return [];

    const tasks: Array<[string, string, LucideIcon]> = [];
    if (!available) {
      tasks.push(["Go online", "Turn on availability when you are ready for new leads.", CheckCircle2]);
    }
    if (!artisan.portfolioImages.length) {
      tasks.push(["Add portfolio photos", "Show recent verified work to improve trust.", ImagePlus]);
    }
    if (!artisan.specialties.length) {
      tasks.push(["Add specialties", "List the jobs you handle most often.", Wrench]);
    }
    if (!artisan.serviceTags.length) {
      tasks.push(["Add service tags", "Help clients filter for emergency repair, maintenance, and more.", Sparkles]);
    }

    return tasks.length
      ? tasks
      : [["Profile ready", "Your profile has the essentials for matching.", ShieldCheck]];
  }, [artisan, available]);
  const profileCards = useMemo<Array<[string, string, LucideIcon, string]>>(() => {
    if (!artisan) return [];

    return [
      [
        "Portfolio photos",
        `${artisan.portfolioImages.length} added`,
        ImagePlus,
        "Add photos",
      ],
      [
        "Service tags",
        artisan.serviceTags.length ? artisan.serviceTags.join(", ") : "Add client filters",
        Sparkles,
        "Update tags",
      ],
      [
        "Badges",
        artisan.badges?.length ? artisan.badges.join(", ") : artisan.verified ? "Verified" : "Pending review",
        BadgeCheck,
        "Request badge",
      ],
      ["Availability", available ? "Online today" : "Paused", TimerReset, "Edit hours"],
      ["Service area", `${artisan.town}, ${artisan.district}`, MapPin, "Update towns"],
    ];
  }, [artisan, available]);

  const loadTargetedJobs = useCallback(async () => {
    if (!supabase) return;

    setJobsLoading(true);
    setJobsError("");

    const { data, error } = await supabase
      .from("job_notifications")
      .select(
        `
        id,
        status,
        urgency,
        created_at,
        job:job_requests (
          id,
          category,
          description,
          district,
          town,
          urgency,
          status,
          created_at,
          expires_at,
          customer_display_name,
          photo_storage_path
        )
      `,
      )
      .in("status", ["pending", "read"])
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      setJobNotifications([]);
      setJobsError(error.message);
      setJobsLoading(false);
      return;
    }

    const rows = (data || []) as DashboardNotificationRow[];
    const notifications = rows
      .map((row) => {
        const job = joinedJob(row.job);
        if (!job) return null;
        return {
          id: row.id,
          status: row.status,
          urgency: row.urgency,
          createdAt: row.created_at,
          job,
        };
      })
      .filter((row): row is DashboardNotification => Boolean(row));

    setJobNotifications(notifications);

    const unreadIds = rows
      .filter((row) => row.status === "pending")
      .map((row) => row.id);

    if (unreadIds.length) {
      await supabase
        .from("job_notifications")
        .update({ status: "read", read_at: new Date().toISOString() })
        .in("id", unreadIds);
    }

    setJobsLoading(false);
  }, [supabase]);

  const loadClaimedJobs = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("job_notifications")
      .select(
        `
        id,
        status,
        urgency,
        created_at,
        job:job_requests (
          id,
          category,
          description,
          district,
          town,
          urgency,
          status,
          created_at,
          expires_at,
          customer_display_name,
          photo_storage_path
        )
      `,
      )
      .eq("status", "claimed")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      setClaimedJobs([]);
      return;
    }

    const rows = (data || []) as DashboardNotificationRow[];
    setClaimedJobs(
      rows
        .map((row) => {
          const job = joinedJob(row.job);
          if (!job || job.status !== "claimed") return null;
          return { id: row.id, status: row.status, urgency: row.urgency, createdAt: row.created_at, job };
        })
        .filter((row): row is DashboardNotification => Boolean(row)),
    );
  }, [supabase]);

  async function handleUnclaim(jobId: string) {
    setUnclaimingId(jobId);
    setJobsError("");
    try {
      const payload = await invokeUserFunction<{ success?: boolean; reason?: string; message?: string }>(
        "artisanmu-open-jobs",
        { action: "unclaim", job_id: jobId },
      );
      if (!payload.success) {
        throw new Error(payload.message || "Could not release this job.");
      }
      await Promise.all([loadClaimedJobs(), loadOpenJobs(), loadTargetedJobs()]);
    } catch (unclaimError) {
      setJobsError(unclaimError instanceof Error ? unclaimError.message : "Could not release this job.");
    } finally {
      setUnclaimingId("");
    }
  }

  const loadOpenJobs = useCallback(async () => {
    setOpenJobsLoading(true);
    setOpenJobsError("");
    try {
      const payload = await invokeUserFunction<{ success?: boolean; jobs?: OpenBoardJob[]; message?: string }>(
        "artisanmu-open-jobs",
        { action: "list" },
      );
      setOpenJobs(payload.jobs || []);
    } catch (error) {
      setOpenJobs([]);
      setOpenJobsError(error instanceof Error ? error.message : "Could not load the job board.");
    } finally {
      setOpenJobsLoading(false);
    }
  }, []);

  // Board = all open jobs minus the ones already surfaced as targeted leads above.
  const boardJobs = useMemo(() => {
    const targetedIds = new Set(jobNotifications.map((notification) => notification.job.id));
    return openJobs.filter((job) => !targetedIds.has(job.id));
  }, [openJobs, jobNotifications]);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!supabase) {
        const missing = getMissingBrowserSupabaseEnv().join(", ");
        setErrorMessage(`Missing browser Supabase config: ${missing}.`);
        setStatus("missing-config");
        return;
      }

      setStatus("loading");
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (userError || !user) {
        setArtisan(null);
        setJobNotifications([]);
        setStatus("signed-out");
        return;
      }

      const { data, error } = await supabase
        .from("artisans")
        .select(ownArtisanProfileSelect)
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        setArtisan(null);
        setJobNotifications([]);
        setErrorMessage(error.message);
        setStatus("no-profile");
        return;
      }

      if (!data) {
        setArtisan(null);
        setJobNotifications([]);
        setStatus("no-profile");
        return;
      }

      const mappedArtisan = mapSupabaseArtisan(data as SupabaseArtisanProfile);
      setArtisan(mappedArtisan);
      setAvailable(mappedArtisan.available);
      setProfileForm({
        town: mappedArtisan.town,
        district: mappedArtisan.district,
        bio: mappedArtisan.bio,
        specialties: mappedArtisan.specialties.join(", "),
        serviceTags: mappedArtisan.serviceTags,
        contactPreference: mappedArtisan.contactPreference || "whatsapp",
        workingHours: mappedArtisan.workingHours || {},
      });
      setStatus("ready");
      if (mappedArtisan.verified && mappedArtisan.verificationStatus === "approved") {
        void loadTargetedJobs();
        void loadOpenJobs();
        void loadClaimedJobs();
      } else {
        setJobNotifications([]);
        setOpenJobs([]);
      }
    }

    loadProfile();

    if (!supabase) {
      return () => {
        active = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setArtisan(null);
        setJobNotifications([]);
        setOpenJobs([]);
        setStatus("signed-out");
        return;
      }

      loadProfile();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadTargetedJobs, loadOpenJobs, supabase]);


  async function handleProfileSave() {
    if (!artisan || profileSaving) return;
    setProfileSaving(true);
    setProfileMessage("");

    try {
      const payload = await invokeUserFunction<{
        success?: boolean;
        profile?: {
          town: string;
          district: string;
          bio: string;
          specialties: string[];
          serviceTags: string[];
          contactPreference: string;
          workingHours: WeekHours | null;
        };
        message?: string;
      }>("artisanmu-artisan-profile", {
        action: "update_profile",
        town: profileForm.town,
        district: profileForm.district,
        bio: profileForm.bio,
        // Skills + services are merged into one list; mirror it into the legacy
        // specialties field the API still expects.
        specialties: profileForm.serviceTags,
        service_tags: profileForm.serviceTags,
        contact_preference: profileForm.contactPreference,
        working_hours: profileForm.workingHours,
      });

      if (!payload.success || !payload.profile) {
        throw new Error(payload.message || "Profile could not be saved.");
      }

      const savedHours = payload.profile.workingHours || {};
      setArtisan({
        ...artisan,
        town: payload.profile.town,
        district: payload.profile.district,
        bio: payload.profile.bio,
        specialties: payload.profile.specialties,
        serviceTags: payload.profile.serviceTags,
        contactPreference: payload.profile.contactPreference,
        workingHours: savedHours,
      });
      setProfileForm({
        town: payload.profile.town,
        district: payload.profile.district,
        bio: payload.profile.bio,
        specialties: payload.profile.specialties.join(", "),
        serviceTags: payload.profile.serviceTags,
        contactPreference: payload.profile.contactPreference,
        workingHours: savedHours,
      });
      setProfileMessage("Profile filters saved. Clients can use the new tags on the public page.");
    } catch (profileError) {
      setProfileMessage(profileError instanceof Error ? profileError.message : "Profile could not be saved.");
    } finally {
      setProfileSaving(false);
    }
  }

  function setDayEnabled(day: DayKey, enabled: boolean) {
    setProfileForm((current) => ({
      ...current,
      workingHours: {
        ...current.workingHours,
        [day]: enabled ? current.workingHours[day] || { open: "08:00", close: "17:00" } : null,
      },
    }));
  }

  function setDayTime(day: DayKey, field: "open" | "close", value: string) {
    setProfileForm((current) => {
      const slot = current.workingHours[day] || { open: "08:00", close: "17:00" };
      return { ...current, workingHours: { ...current.workingHours, [day]: { ...slot, [field]: value } } };
    });
  }

  function handleProfileCardAction(action: string) {
    if (action === "Edit hours") {
      setActiveTab("profile");
      window.setTimeout(() => {
        document.getElementById("working-hours")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
      return;
    }
    if (action === "Request badge") {
      window.location.assign("mailto:hello@octolabs.app?subject=Artizan%20Moris%20badge%20request");
      return;
    }

    setActiveTab("profile");
    const targetId = action === "Add photos" ? "portfolio-editor" : "profile-editor";
    window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  async function handlePortfolioUpload() {
    if (!artisan || portfolioSaving) return;

    const fileError = validatePortfolioFiles(portfolioFiles);
    if (fileError) {
      setPortfolioMessage(fileError);
      return;
    }

    setPortfolioSaving(true);
    setPortfolioMessage("");

    try {
      const paths = await Promise.all(portfolioFiles.map(uploadPortfolioPhoto));
      const payload = await invokeUserFunction<{
        success?: boolean;
        photos?: string[];
        avatar?: string | null;
        message?: string;
      }>("artisanmu-artisan-portfolio", {
        action: "add",
        paths,
      });

      if (!payload.success || !payload.photos) {
        throw new Error(payload.message || "Portfolio photos could not be saved.");
      }

      setArtisan({
        ...artisan,
        portfolioImages: payload.photos,
        image: payload.avatar || artisan.image,
      });
      setPortfolioFiles([]);
      setPortfolioMessage("Portfolio photos added.");
    } catch (portfolioError) {
      setPortfolioMessage(portfolioError instanceof Error ? portfolioError.message : "Portfolio upload failed.");
    } finally {
      setPortfolioSaving(false);
    }
  }

  async function handlePortfolioRemove(photoUrl: string) {
    if (!artisan || portfolioSaving) return;

    setPortfolioSaving(true);
    setPortfolioMessage("");

    try {
      const payload = await invokeUserFunction<{
        success?: boolean;
        photos?: string[];
        avatar?: string | null;
        message?: string;
      }>("artisanmu-artisan-portfolio", {
        action: "remove",
        photo_url: photoUrl,
      });

      if (!payload.success || !payload.photos) {
        throw new Error(payload.message || "Portfolio photo could not be removed.");
      }

      setArtisan({
        ...artisan,
        portfolioImages: payload.photos,
        image: payload.avatar || artisan.image,
      });
      setPortfolioMessage("Portfolio photo removed.");
    } catch (portfolioError) {
      setPortfolioMessage(portfolioError instanceof Error ? portfolioError.message : "Could not remove photo.");
    } finally {
      setPortfolioSaving(false);
    }
  }

  async function handleAccountManage(action: "deactivate" | "reactivate" | "delete") {
    if (!artisan || accountWorking) return;
    setAccountWorking(true);
    setAccountMessage("");
    try {
      const payload = await invokeUserFunction<{ success?: boolean; deactivated?: boolean; deleted?: boolean; message?: string }>(
        "artisanmu-artisan-account",
        { action },
      );
      if (!payload.success) throw new Error(payload.message || "Account action failed.");
      if (action === "delete") {
        await supabase?.auth.signOut();
        setArtisan(null);
        setStatus("signed-out");
        return;
      }
      setArtisan({ ...artisan, deactivatedAt: action === "deactivate" ? new Date().toISOString() : null });
      setAccountMessage(action === "deactivate" ? "Your profile is now hidden from the public listing." : "Your profile is visible again.");
      setAccountAction("");
      setDeleteConfirmText("");
    } catch (err) {
      setAccountMessage(err instanceof Error ? err.message : "Account action failed.");
    } finally {
      setAccountWorking(false);
    }
  }

  async function handleSignOut() {
    if (!supabase) return;

    await supabase.auth.signOut();
    setArtisan(null);
    setJobNotifications([]);
    setOpenJobs([]);
    setStatus("signed-out");
  }

  if (status === "loading") {
    return (
      <EmptyDashboard
        title="Loading artisan dashboard"
        copy="Checking your secure session and linked ArtisanMu profile."
        actionLabel="Go to login"
        showSpinner
      />
    );
  }

  if (status === "missing-config") {
    return (
      <EmptyDashboard
        title="Artisan login is not configured"
        copy={errorMessage || "The public Supabase URL and publishable key must be available at build time."}
        actionLabel="Back to login"
      />
    );
  }

  if (!artisan) {
    return (
      <EmptyDashboard
        title={status === "signed-out" ? "Log in to continue" : "No artisan profile connected"}
        copy={
          status === "signed-out"
            ? "Use your artisan account to continue. Pending profiles will see application status only."
            : errorMessage ||
              "This account is not linked to an ArtisanMu artisan profile yet. Submit the artisan application first."
        }
        actionLabel="Artisan login"
      />
    );
  }

  if (!artisan.verified || artisan.verificationStatus !== "approved") {
    return <PendingArtisanDashboard artisan={artisan} onSignOut={handleSignOut} />;
  }

  const openNow = artisan ? isOpenNow(artisan.workingHours) : false;
  const deactivated = Boolean(artisan?.deactivatedAt);

  return (
    <main className="min-h-screen bg-[#f6f4ef] pb-20 text-[var(--ink)] md:pb-0">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[#f6f4ef]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="Artizan Moris home">
            <ArtisanMuLogo subtitle="Artisan dashboard" />
          </Link>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            title="Set your working hours"
            className={`inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold ${
              deactivated
                ? "border border-[var(--line)] bg-white text-[#9f4a4a]"
                : openNow
                  ? "bg-[var(--green)] text-white"
                  : "border border-[var(--line)] bg-white text-[var(--muted)]"
            }`}
          >
            {!deactivated && openNow ? (
              <CheckCircle2 className="size-4" aria-hidden="true" />
            ) : (
              <PauseCircle className="size-4" aria-hidden="true" />
            )}
            {deactivated ? "Deactivated" : openNow ? "Open now" : "Closed"}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="hidden h-11 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm font-semibold text-[#0d1612] sm:inline-flex"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </header>

      <section className="border-b border-[var(--line)] bg-[var(--surface-soft)]">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 gap-4">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-[#ddd8cd] sm:size-28">
              <Image
                src={artisan.image}
                alt={artisan.name}
                fill
                sizes="112px"
                className="object-cover"
                priority
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-[var(--ink)] sm:text-3xl">
                  {artisan.name}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-md bg-[#e8f6f1] px-2 py-1 text-xs font-semibold text-[var(--green-strong)]">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  {artisan.verified ? "Verified" : "Pending"}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {artisan.trade} - {artisan.town}, {artisan.district}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#fff7e7] px-2.5 py-1.5 text-[#78511c]">
                  <Star className="size-4 fill-[#c79b55] text-[#c79b55]" aria-hidden="true" />
                  {artisan.reviews > 0 ? `${artisan.rating} rating` : "New"}
                </span>
                <span className="rounded-md bg-[var(--green-soft)] px-2.5 py-1.5 text-[var(--green-strong)]">
                  {artisan.reviews} reviews
                </span>
                <span className="rounded-md bg-[#f2eee4] px-2.5 py-1.5 text-[var(--muted)]">
                  Quote private
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#d8d1c3] bg-[var(--surface-soft)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[var(--muted)]">Today</p>
                <p className="text-2xl font-semibold text-[var(--ink)]">{jobNotifications.length} leads</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-md bg-[#0d1612] text-white">
                <Gauge className="size-5" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-md bg-white px-2 py-3">
                <p className="text-lg font-semibold">{available ? "On" : "Off"}</p>
                <p className="text-[#6c756f]">status</p>
              </div>
              <div className="rounded-md bg-white px-2 py-3">
                <p className="text-lg font-semibold">{artisan.reviews}</p>
                <p className="text-[#6c756f]">reviews</p>
              </div>
              <div className="rounded-md bg-white px-2 py-3">
                <p className="text-lg font-semibold">{completion}%</p>
                <p className="text-[#6c756f]">profile</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {errorMessage ? (
          <div className="lg:col-span-2 rounded-lg border border-[#d7c292] bg-[#fff8e8] px-4 py-3 text-sm font-medium text-[#78511c]">
            {errorMessage}
          </div>
        ) : null}

        <section className="min-w-0">
          <div className="hidden gap-2 md:flex">
            {dashboardTabs.map((item) => {
              const Icon = item.icon;
              const selected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold ${
                    selected
                      ? "bg-[#0d1612] text-white"
                      : "border border-[var(--line)] bg-[var(--surface-soft)] text-[var(--muted)]"
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {tabLabel[item.id]}
                </button>
              );
            })}
          </div>

          {activeTab === "jobs" ? (
            <div className="mt-0 grid gap-3 md:mt-4">
              <div className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-[var(--ink)]">{dc.targetedLeadsTitle}</h2>
                  <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
                    Only requests matched to your verified profile appear here.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadTargetedJobs}
                  disabled={jobsLoading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[#0d1612] disabled:cursor-wait disabled:opacity-70"
                >
                  {jobsLoading ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCcw className="size-4" aria-hidden="true" />
                  )}
                  Refresh
                </button>
              </div>

              {jobsError ? (
                <div className="rounded-md border border-[#E24B4A]/30 bg-[#E24B4A]/10 px-3 py-2 text-sm text-[#9f2f2e]">
                  {jobsError}
                </div>
              ) : null}

              {jobsLoading && !jobNotifications.length ? (
                <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-5 text-[var(--muted)] shadow-sm">
                  <LoaderCircle className="size-5 animate-spin text-[var(--green)]" aria-hidden="true" />
                  <h2 className="mt-3 text-lg font-semibold text-[var(--ink)]">Checking new leads</h2>
                  <p className="mt-2 text-sm leading-6">Loading your assigned ArtisanMu requests.</p>
                </article>
              ) : jobNotifications.length ? (
                jobNotifications.map((notification) => (
                  <UrgentJobCard
                    key={notification.id}
                    job={{
                      id: notification.job.id,
                      trade: notification.job.category || artisan.trade,
                      district: notification.job.district || notification.job.town || artisan.district,
                      description: notification.job.description,
                      urgency: notification.urgency || notification.job.urgency || "planned",
                      customerDisplayName: notification.job.customer_display_name || undefined,
                      distanceLabel: notification.job.town
                        ? `${notification.job.town} area`
                        : "Matched service area",
                    }}
                    onTaken={loadTargetedJobs}
                    onOpenThread={() => setActiveTab("reviews")}
                  />
                ))
              ) : (
                <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-5 text-[var(--muted)] shadow-sm">
                  <div className="flex size-11 items-center justify-center rounded-md bg-[var(--green-soft)] text-[var(--green-strong)]">
                    <RefreshCcw className="size-5" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-[var(--ink)]">No open leads yet</h2>
                  <p className="mt-2 text-sm leading-6">
                    Keep your profile online. New matching requests will appear here when clients post work in your trade and service area.
                  </p>
                </article>
              )}

              {/* ── My claimed jobs ──────────────────────────────────── */}
              {claimedJobs.length > 0 ? (
                <div className="mt-2 grid gap-3">
                  <div className="rounded-lg border border-[#0d8b66]/30 bg-[var(--green-soft)] p-4">
                    <h2 className="font-semibold text-[#0d5c44]">My claimed jobs</h2>
                    <p className="mt-1 text-sm leading-5 text-[#3a6655]">
                      Jobs you have accepted. If you can&apos;t complete one, release it so another artisan can help.
                    </p>
                  </div>
                  {claimedJobs.map((notification) => (
                    <article
                      key={notification.id}
                      className="rounded-lg border border-[#0d8b66]/25 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--green)] px-2.5 py-0.5 text-xs font-semibold text-white">
                              Claimed
                            </span>
                            {(notification.urgency || notification.job.urgency) === "urgent" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#E24B4A]/15 px-2.5 py-0.5 text-xs font-semibold text-[#9f2f2e]">
                                Urgent
                              </span>
                            ) : null}
                            <span className="text-xs text-[var(--muted)]">
                              Claimed{" "}
                              {new Date(notification.createdAt).toLocaleDateString("en-MU", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                          <p className="mt-2 font-medium text-[var(--ink)]">
                            {notification.job.category || artisan.trade}
                          </p>
                          {notification.job.description ? (
                            <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                              {notification.job.description}
                            </p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
                            {notification.job.district || notification.job.town ? (
                              <span>
                                {notification.job.town
                                  ? `${notification.job.town}, ${notification.job.district || "Mauritius"}`
                                  : notification.job.district}
                              </span>
                            ) : null}
                            {notification.job.customer_display_name ? (
                              <span>Client: {notification.job.customer_display_name}</span>
                            ) : null}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={unclaimingId === notification.job.id}
                          onClick={() => {
                            if (
                              window.confirm(
                                "Release this job? It will go back to the open board so another artisan can claim it.",
                              )
                            ) {
                              void handleUnclaim(notification.job.id);
                            }
                          }}
                          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold text-[#0d1612] transition hover:border-[#E24B4A]/50 hover:bg-[#E24B4A]/5 hover:text-[#9f2f2e] disabled:cursor-wait disabled:opacity-60"
                        >
                          {unclaimingId === notification.job.id ? (
                            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <X className="size-4" aria-hidden="true" />
                          )}
                          Release job
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}

              <div className="mt-2 flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-[var(--ink)]">{dc.jobBoardTitle}</h2>
                  <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
                    Every open request across Mauritius. Claim any one to reveal the client&apos;s WhatsApp — first come, first served.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadOpenJobs}
                  disabled={openJobsLoading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[#0d1612] disabled:cursor-wait disabled:opacity-70"
                >
                  {openJobsLoading ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCcw className="size-4" aria-hidden="true" />
                  )}
                  Refresh
                </button>
              </div>

              {openJobsError ? (
                <div className="rounded-md border border-[#E24B4A]/30 bg-[#E24B4A]/10 px-3 py-2 text-sm text-[#9f2f2e]">
                  {openJobsError}
                </div>
              ) : null}

              {openJobsLoading && !openJobs.length ? (
                <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-5 text-[var(--muted)] shadow-sm">
                  <LoaderCircle className="size-5 animate-spin text-[var(--green)]" aria-hidden="true" />
                  <h2 className="mt-3 text-lg font-semibold text-[var(--ink)]">Loading the job board</h2>
                  <p className="mt-2 text-sm leading-6">Fetching all open requests across Mauritius.</p>
                </article>
              ) : boardJobs.length ? (
                boardJobs.map((job) => (
                  <UrgentJobCard
                    key={job.id}
                    job={{
                      id: job.id,
                      trade: job.trade,
                      district: job.district || job.town,
                      description: job.description,
                      urgency: job.urgency === "urgent" ? "urgent" : "planned",
                      customerDisplayName: job.client,
                      distanceLabel: job.town ? `${job.town} area` : undefined,
                    }}
                    claimFn="artisanmu-open-jobs"
                    claimExtraBody={{ action: "claim" }}
                    onTaken={loadOpenJobs}
                    onClaimed={() => {
                      void loadOpenJobs();
                    }}
                  />
                ))
              ) : (
                <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-5 text-[var(--muted)] shadow-sm">
                  <div className="flex size-11 items-center justify-center rounded-md bg-[var(--green-soft)] text-[var(--green-strong)]">
                    <Wrench className="size-5" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-[var(--ink)]">No open jobs right now</h2>
                  <p className="mt-2 text-sm leading-6">
                    When clients post new work anywhere in Mauritius, it appears here for you to claim.
                  </p>
                </article>
              )}
            </div>
          ) : null}

          {activeTab === "profile" ? (
            <div className="mt-0 grid gap-3 md:mt-4 md:grid-cols-2">
              <article id="profile-editor" className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4 shadow-sm md:col-span-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-[var(--ink)]">Public profile filters</h2>
                    <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
                      Keep your service area and tags accurate so clients can find you faster.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleProfileSave}
                    disabled={profileSaving}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[var(--green)] px-4 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70"
                  >
                    {profileSaving ? (
                      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ShieldCheck className="size-4" aria-hidden="true" />
                    )}
                    Save profile
                  </button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="block text-sm font-medium text-[var(--ink)]">
                    Town or village
                    <input
                      value={profileForm.town}
                      onChange={(event) => {
                        setProfileForm((current) => ({ ...current, town: event.target.value }));
                        setProfileMessage("");
                      }}
                      className="mt-2 h-11 w-full rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none focus:border-[#0d8b66]"
                    />
                  </label>
                  <label className="block text-sm font-medium text-[var(--ink)]">
                    District or island
                    <select
                      value={profileForm.district}
                      onChange={(event) => {
                        setProfileForm((current) => ({ ...current, district: event.target.value }));
                        setProfileMessage("");
                      }}
                      className="mt-2 h-11 w-full rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none focus:border-[#0d8b66]"
                    >
                      {profileForm.district && !districtOptions.includes(profileForm.district) ? (
                        <option>{profileForm.district}</option>
                      ) : null}
                      {districtOptions.map((district) => (
                        <option key={district}>{district}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-[var(--ink)] md:col-span-2">
                    Bio
                    <textarea
                      value={profileForm.bio}
                      onChange={(event) => {
                        setProfileForm((current) => ({ ...current, bio: event.target.value }));
                        setProfileMessage("");
                      }}
                      rows={4}
                      className="mt-2 w-full resize-none rounded-md border border-[#d8d1c3] bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-[#0d8b66]"
                    />
                  </label>
                  <label className="block text-sm font-medium text-[var(--ink)]">
                    Preferred contact
                    <select
                      value={profileForm.contactPreference}
                      onChange={(event) => {
                        setProfileForm((current) => ({ ...current, contactPreference: event.target.value }));
                        setProfileMessage("");
                      }}
                      className="mt-2 h-11 w-full rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none focus:border-[#0d8b66]"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="phone">Phone</option>
                    </select>
                  </label>
                </div>

                <fieldset className="mt-4 grid gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
                  <legend className="px-1 text-sm font-medium text-[var(--ink)]">Skills &amp; services</legend>
                  <p className="text-xs leading-5 text-[var(--muted)]">
                    Pick from the suggestions or type your own. These help clients find you.
                  </p>
                  <TagInput
                    value={profileForm.serviceTags}
                    onChange={(tags) => {
                      setProfileForm((current) => ({ ...current, serviceTags: tags }));
                      setProfileMessage("");
                    }}
                    options={serviceTagOptions}
                    language={language}
                  />
                </fieldset>

                {profileMessage ? (
                  <p className="mt-3 rounded-md border border-[#d7c292] bg-[#fff8e8] px-3 py-2 text-sm font-medium text-[#78511c]">
                    {profileMessage}
                  </p>
                ) : null}
              </article>

              <article id="working-hours" className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4 shadow-sm md:col-span-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-[var(--ink)]">Working hours</h2>
                    <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
                      Set when you normally work. Clients see you as online only during these hours.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileForm((current) => ({ ...current, workingHours: defaultWeekHours() }));
                      setProfileMessage("");
                    }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold text-[#0d1612]"
                  >
                    Use 08:00–17:00, Mon–Sat
                  </button>
                </div>

                <p
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold ${
                    isOpenNow(profileForm.workingHours)
                      ? "bg-[#e8f6f1] text-[var(--green-strong)]"
                      : "bg-[#f2eee4] text-[var(--muted)]"
                  }`}
                >
                  {isOpenNow(profileForm.workingHours) ? (
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                  ) : (
                    <PauseCircle className="size-4" aria-hidden="true" />
                  )}
                  {isOpenNow(profileForm.workingHours) ? "Open now" : "Closed now"} · Today: {todayHoursLabel(profileForm.workingHours)}
                </p>

                <div className="mt-3 grid gap-2">
                  {WEEK_DAYS.map(({ key, label }) => {
                    const slot = profileForm.workingHours[key];
                    const enabled = Boolean(slot?.open && slot?.close);
                    return (
                      <div
                        key={key}
                        className="flex flex-wrap items-center gap-3 rounded-md border border-[#eee8dc] bg-white px-3 py-2"
                      >
                        <label className="flex w-32 cursor-pointer items-center gap-2 text-sm font-medium text-[var(--ink)]">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(event) => setDayEnabled(key, event.target.checked)}
                            className="size-4 accent-[#0d8b66]"
                          />
                          {label}
                        </label>
                        {enabled && slot ? (
                          <div className="flex items-center gap-2 text-sm">
                            <input
                              type="time"
                              value={slot.open}
                              onChange={(event) => setDayTime(key, "open", event.target.value)}
                              className="h-10 rounded-md border border-[#d8d1c3] bg-white px-2 outline-none focus:border-[#0d8b66]"
                              aria-label={`${label} opening time`}
                            />
                            <span className="text-[var(--muted)]">to</span>
                            <input
                              type="time"
                              value={slot.close}
                              onChange={(event) => setDayTime(key, "close", event.target.value)}
                              className="h-10 rounded-md border border-[#d8d1c3] bg-white px-2 outline-none focus:border-[#0d8b66]"
                              aria-label={`${label} closing time`}
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-[#9aa19c]">Day off</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleProfileSave}
                  disabled={profileSaving}
                  className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[var(--green)] px-4 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70"
                >
                  {profileSaving ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <TimerReset className="size-4" aria-hidden="true" />
                  )}
                  Save hours
                </button>
              </article>

              <article id="portfolio-editor" className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4 shadow-sm md:col-span-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-[var(--ink)]">Portfolio showcase</h2>
                    <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
                      Add recent work photos that clients can view on your public profile.
                    </p>
                  </div>
                  <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[#0d1612]">
                    <ImagePlus className="size-4 text-[var(--green)]" aria-hidden="true" />
                    Choose photos
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      className="sr-only"
                      onChange={(event) => {
                        setPortfolioFiles(Array.from(event.target.files || []).slice(0, 6));
                        setPortfolioMessage("");
                      }}
                    />
                  </label>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <p className="rounded-md bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--muted)]">
                    {portfolioFiles.length
                      ? `${portfolioFiles.length} selected: ${portfolioFiles.map((file) => file.name).join(", ")}`
                      : `${artisan.portfolioImages.length} portfolio photos live`}
                  </p>
                  <button
                    type="button"
                    onClick={handlePortfolioUpload}
                    disabled={portfolioSaving || !portfolioFiles.length}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[var(--green)] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#93a198]"
                  >
                    {portfolioSaving ? (
                      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ImagePlus className="size-4" aria-hidden="true" />
                    )}
                    Upload
                  </button>
                </div>

                {portfolioMessage ? (
                  <p className="mt-3 rounded-md border border-[#d7c292] bg-[#fff8e8] px-3 py-2 text-sm font-medium text-[#78511c]">
                    {portfolioMessage}
                  </p>
                ) : null}

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {artisan.portfolioImages.length ? (
                    artisan.portfolioImages.map((photo, index) => (
                      <div key={photo} className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface-soft)]">
                        <Image
                          src={photo}
                          alt={`${artisan.name} portfolio ${index + 1}`}
                          fill
                          sizes="(max-width: 768px) 50vw, 220px"
                          className="pointer-events-none object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setLightboxPhoto(photo)}
                          className="absolute inset-0 z-[2] cursor-zoom-in"
                          aria-label={`Enlarge portfolio photo ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Remove this portfolio photo?")) {
                              void handlePortfolioRemove(photo);
                            }
                          }}
                          disabled={portfolioSaving}
                          className="absolute right-2 top-2 z-[3] inline-flex size-9 items-center justify-center rounded-md bg-[#0d1612]/85 text-white opacity-100 shadow-sm transition sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label={`Remove portfolio photo ${index + 1}`}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full rounded-lg border border-dashed border-[#cfc6b6] bg-[var(--surface-soft)] p-5 text-sm leading-6 text-[var(--muted)]">
                      Your approved work photos will appear here.
                    </div>
                  )}
                </div>

                {/* Lightbox */}
                {lightboxPhoto ? (
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Portfolio photo enlarged"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    onClick={() => setLightboxPhoto(null)}
                    onKeyDown={(e) => e.key === "Escape" && setLightboxPhoto(null)}
                    tabIndex={-1}
                  >
                    <button
                      type="button"
                      onClick={() => setLightboxPhoto(null)}
                      className="absolute right-4 top-4 z-10 inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                      aria-label="Close photo"
                    >
                      <X className="size-5" aria-hidden="true" />
                    </button>
                    <div
                      className="relative max-h-[90vh] max-w-4xl w-full aspect-video"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Image
                        src={lightboxPhoto}
                        alt="Portfolio photo enlarged"
                        fill
                        sizes="(max-width: 1024px) 100vw, 1024px"
                        className="rounded-lg object-contain"
                        priority
                      />
                    </div>
                  </div>
                ) : null}
              </article>

              {profileCards.map(([title, value, Icon, action]) => (
                <article key={title as string} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-[var(--ink)]">{title as string}</h2>
                      <p className="mt-1 text-sm text-[var(--muted)]">{value as string}</p>
                    </div>
                    <span className="flex size-10 items-center justify-center rounded-md bg-[var(--green-soft)] text-[var(--green-strong)]">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleProfileCardAction(action as string)}
                    className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md border border-[var(--line)] bg-white text-sm font-semibold text-[#0d1612] disabled:cursor-wait disabled:opacity-70"
                  >
                    {action as string}
                  </button>
                </article>
              ))}
            </div>
          ) : null}

          {activeTab === "reviews" ? (
            <div className="mt-0 grid gap-3 md:mt-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="grid gap-3">
                {reviewMessage ? (
                  <p className="rounded-md border border-[#d7c292] bg-[#fff8e8] px-3 py-2 text-sm font-medium text-[#78511c]">
                    {reviewMessage}
                  </p>
                ) : null}
                {reviewsForArtisan.length ? (
                  reviewsForArtisan.map((review) => (
                    <article key={review.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4 shadow-sm">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Star className="size-4 fill-[#c79b55] text-[#c79b55]" aria-hidden="true" />
                            <h2 className="font-semibold text-[var(--ink)]">
                              {review.rating}/5 from {review.client}
                            </h2>
                          </div>
                          <p className="mt-1 text-sm text-[var(--muted)]">{review.age} ago</p>
                        </div>
                        <span className="w-fit rounded-md bg-[#e8f6f1] px-2 py-1 text-xs font-semibold text-[var(--green-strong)]">
                          {handledReviewIds.includes(review.id) ? "Handled" : review.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{review.comment}</p>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setReviewMessage("Reply composer will open after client messaging is enabled.")}
                          className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--line)] bg-white text-sm font-semibold text-[#0d1612]"
                        >
                          Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setHandledReviewIds((current) =>
                              current.includes(review.id)
                                ? current.filter((id) => id !== review.id)
                                : [...current, review.id],
                            );
                            setReviewMessage(
                              handledReviewIds.includes(review.id)
                                ? "Review moved back to pending follow-up."
                                : "Review marked handled on this dashboard.",
                            );
                          }}
                          className="inline-flex h-11 items-center justify-center rounded-md bg-[#0d1612] text-sm font-semibold text-white"
                        >
                          {handledReviewIds.includes(review.id) ? "Reopen" : "Mark handled"}
                        </button>
                      </div>
                  </article>
                  ))
                ) : (
                  <article className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-5 shadow-sm">
                    <Star className="size-5 text-[#c79b55]" aria-hidden="true" />
                    <h2 className="mt-3 text-lg font-semibold text-[var(--ink)]">No reviews yet</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      Client reviews and replies will appear here after completed jobs are connected.
                    </p>
                  </article>
                )}
              </div>

              <aside className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4 shadow-sm">
                <h2 className="font-semibold text-[var(--ink)]">Comment threads</h2>
                <div className="mt-3 grid gap-3">
                  {commentsForArtisan.length ? (
                    commentsForArtisan.map((thread) => (
                      <article key={thread.id} className="rounded-md border border-[var(--line)] bg-[var(--surface-soft)] p-3">
                        <div className="flex items-center gap-2 font-semibold text-[var(--ink)]">
                          <MessageSquareText className="size-4 text-[#234f7a]" aria-hidden="true" />
                          {thread.job}
                        </div>
                        <p className="mt-1 text-xs text-[#6c756f]">{thread.status}</p>
                        <p className="mt-2 text-sm leading-5 text-[var(--muted)]">{thread.lastMessage}</p>
                      </article>
                    ))
                  ) : (
                    <p className="rounded-md border border-[var(--line)] bg-[var(--surface-soft)] p-3 text-sm leading-5 text-[var(--muted)]">
                      No comment threads yet.
                    </p>
                  )}
                </div>
              </aside>
            </div>
          ) : null}

          {activeTab === "settings" ? (
            <div className="mt-0 grid gap-3 md:mt-4">
              {settingsMessage ? (
                <p className="rounded-md border border-[#d7c292] bg-[#fff8e8] px-3 py-2 text-sm font-medium text-[#78511c]">
                  {settingsMessage}
                </p>
              ) : null}

              {/* Quick links */}
              {[
                { label: "WhatsApp and profile", action: () => { setActiveTab("profile"); window.setTimeout(() => document.getElementById("profile-editor")?.scrollIntoView({ behavior: "smooth" }), 50); } },
                { label: "Documents and verification", action: () => setSettingsMessage("Verification document changes — contact support.") },
                { label: "Support", action: () => window.location.assign("mailto:hello@octolabs.app?subject=Artizan%20Moris%20support") },
              ].map(({ label, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  className="flex min-h-12 items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-4 text-left text-sm font-semibold text-[var(--ink)] shadow-sm transition hover:border-[#0d8b66]/40"
                >
                  {label}
                  <ChevronRight className="size-4 text-[#6c756f]" aria-hidden="true" />
                </button>
              ))}

              {/* Account status */}
              <div className="mt-2 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4 shadow-sm">
                <h2 className="font-semibold text-[var(--ink)]">Account status</h2>
                <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
                  {artisan.deactivatedAt
                    ? "Your profile is currently hidden from the public listing. Reactivate to appear in search results again."
                    : "Your profile is visible to clients. Deactivate to temporarily hide it without losing any data."}
                </p>
                {accountMessage ? (
                  <p className="mt-3 rounded-md border border-[#d7c292] bg-[#fff8e8] px-3 py-2 text-sm font-medium text-[#78511c]">
                    {accountMessage}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3">
                  {artisan.deactivatedAt ? (
                    <button
                      type="button"
                      disabled={accountWorking}
                      onClick={() => void handleAccountManage("reactivate")}
                      className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--green)] px-4 text-sm font-semibold text-white transition hover:bg-[#0a7559] disabled:cursor-wait disabled:opacity-70"
                    >
                      {accountWorking ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
                      Reactivate profile
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={accountWorking}
                      onClick={() => {
                        if (window.confirm("Deactivate your profile? You will be hidden from public listing until you reactivate.")) {
                          void handleAccountManage("deactivate");
                        }
                      }}
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[#0d1612] transition hover:border-[#0d8b66]/40 disabled:cursor-wait disabled:opacity-70"
                    >
                      {accountWorking ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
                      Deactivate profile
                    </button>
                  )}
                </div>
              </div>

              {/* Danger zone — delete account */}
              <div className="rounded-lg border border-[#E24B4A]/30 bg-[#fff8f8] p-4 shadow-sm">
                <h2 className="font-semibold text-[#9f2f2e]">Delete account</h2>
                <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
                  Permanently removes your profile, portfolio photos, reviews, and data. This cannot be undone.
                  Any jobs you have claimed will be released back to the open board.
                </p>
                {accountAction === "delete" ? (
                  <div className="mt-4 grid gap-3">
                    <label className="block text-sm font-medium text-[#0d1612]">
                      Type <strong>DELETE</strong> to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="w-full rounded-md border border-[#E24B4A]/40 bg-white px-3 py-2 text-sm outline-none focus:border-[#E24B4A]"
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={accountWorking || deleteConfirmText !== "DELETE"}
                        onClick={() => void handleAccountManage("delete")}
                        className="inline-flex h-10 items-center gap-2 rounded-md bg-[#E24B4A] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {accountWorking ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
                        Delete my account
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAccountAction(""); setDeleteConfirmText(""); }}
                        className="inline-flex h-10 items-center rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[#0d1612]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAccountAction("delete")}
                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-md border border-[#E24B4A]/40 bg-white px-4 text-sm font-semibold text-[#9f2f2e] transition hover:bg-[#E24B4A]/5"
                  >
                    Delete account
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </section>

        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-lg border border-[#d8d1c3] bg-[var(--surface-soft)] p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--green)]">Next actions</p>
                <h2 className="text-xl font-semibold text-[var(--ink)]">Keep profile active</h2>
              </div>
              <Sparkles className="size-5 text-[#c79b55]" aria-hidden="true" />
            </div>

            <div className="mt-4 grid gap-3">
              {profileTasks.map(([title, copy, Icon]) => (
                <article key={title as string} className="flex gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white text-[var(--green)]">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--ink)]">{title as string}</p>
                    <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{copy as string}</p>
                  </div>
                </article>
              ))}
            </div>

          </div>

          <AdBanner
            className="mt-4"
            placement="artisan-dashboard"
            slot={process.env.NEXT_PUBLIC_ADSENSE_ARTISAN_SLOT}
            fallbackTitle="Partner offers for working artisans"
            fallbackCopy="A separated ad space for tools, insurance, mobile plans, and trade supplies."
            compact
          />
        </aside>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[var(--line)] bg-[var(--surface-soft)] px-2 py-2 shadow-lg md:hidden">
        {dashboardTabs.map((item) => {
          const Icon = item.icon;
          const selected = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-xs font-semibold ${
                selected ? "bg-[#0d1612] text-white" : "text-[var(--muted)]"
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
