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
  type LucideIcon,
} from "lucide-react";
import { AdBanner } from "@/components/ad-banner";
import { ArtisanMuLogo } from "@/components/artisanmu-logo";
import { UrgentJobCard } from "@/components/UrgentJobCard";
import { commentThreads, reviewItems } from "@/lib/admin-data";
import { invokeUserFunction } from "@/lib/artisanmu-functions";
import {
  mapSupabaseArtisan,
  ownArtisanProfileSelect,
  type SupabaseArtisanProfile,
} from "@/lib/artisan-profile";
import { getBrowserSupabase, getMissingBrowserSupabaseEnv } from "@/lib/supabase-browser";
import { districtOptions, serviceTagOptions } from "@/lib/service-options";
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

type ProfileFormState = {
  town: string;
  district: string;
  bio: string;
  specialties: string;
  serviceTags: string[];
  contactPreference: string;
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
    <main className="min-h-screen bg-[#f6f4ef] text-[#101410]">
      <header className="sticky top-0 z-30 border-b border-[#ddd8cd] bg-[#f6f4ef]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="ArtisanMU home">
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
        <div className="w-full rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-5 shadow-sm sm:p-6">
          <div className="flex size-12 items-center justify-center rounded-lg bg-[#0d1612] text-white">
            {showSpinner ? (
              <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <Wrench className="size-5" aria-hidden="true" />
            )}
          </div>
          <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-[#5f6a64]">{copy}</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#0d8b66] px-4 text-sm font-semibold text-white"
            >
              {actionLabel}
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-md border border-[#ddd8cd] bg-white px-4 text-sm font-semibold text-[#0d1612]"
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
    <main className="min-h-screen bg-[#f6f4ef] text-[#101410]">
      <header className="border-b border-[#ddd8cd] bg-[#fffdf8]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" aria-label="ArtisanMU home">
            <ArtisanMuLogo subtitle="Application status" />
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[#ddd8cd] bg-white px-3 text-sm font-semibold text-[#0d1612]"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-5xl place-items-center px-4 py-6 sm:px-6">
        <div className="grid w-full gap-4 rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-5 shadow-sm sm:grid-cols-[120px_minmax(0,1fr)] sm:p-6">
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
            <h1 className="mt-3 text-2xl font-semibold text-[#101410]">{artisan.name}</h1>
            <p className="mt-1 text-sm text-[#5f6a64]">
              {artisan.trade} - {artisan.town}, {artisan.district}
            </p>
            <p className="mt-3 text-sm leading-6 text-[#4d5651]">{statusCopy}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link
                href="/"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#ddd8cd] bg-white px-4 text-sm font-semibold text-[#0d1612]"
              >
                Back to marketplace
              </Link>
              <Link
                href="mailto:hello@octolabs.app?subject=ArtisanMU%20application%20review"
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
  const [activeTab, setActiveTab] = useState<DashboardTab>("jobs");
  const [artisan, setArtisan] = useState<Artisan | null>(null);
  const [status, setStatus] = useState<DashboardStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [available, setAvailable] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [jobNotifications, setJobNotifications] = useState<DashboardNotification[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState("");
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [portfolioSaving, setPortfolioSaving] = useState(false);
  const [portfolioMessage, setPortfolioMessage] = useState("");
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    town: "",
    district: "",
    bio: "",
    specialties: "",
    serviceTags: [],
    contactPreference: "whatsapp",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [handledReviewIds, setHandledReviewIds] = useState<string[]>([]);

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
      });
      setStatus("ready");
      if (mappedArtisan.verified && mappedArtisan.verificationStatus === "approved") {
        void loadTargetedJobs();
      } else {
        setJobNotifications([]);
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
        setStatus("signed-out");
        return;
      }

      loadProfile();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadTargetedJobs, supabase]);

  async function handleAvailabilityToggle() {
    if (!artisan || savingAvailability) return;

    const nextAvailable = !available;
    setSavingAvailability(true);
    setAvailable(nextAvailable);
    setErrorMessage("");

    try {
      const payload = await invokeUserFunction<{ success?: boolean; available?: boolean; message?: string }>(
        "artisanmu-artisan-profile",
        {
          action: "set_availability",
          available: nextAvailable,
        },
      );

      if (!payload.success) {
        throw new Error(payload.message || "Availability could not be saved.");
      }

      setArtisan({ ...artisan, available: payload.available ?? nextAvailable });
    } catch {
      setAvailable(!nextAvailable);
      setErrorMessage("Availability could not be saved. Please try again.");
    }

    setSavingAvailability(false);
  }

  function toggleProfileTag(tag: string) {
    setProfileForm((current) => {
      const selected = current.serviceTags.includes(tag);
      const serviceTags = selected
        ? current.serviceTags.filter((item) => item !== tag)
        : [...current.serviceTags, tag].slice(0, 8);
      return { ...current, serviceTags };
    });
    setProfileMessage("");
  }

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
        };
        message?: string;
      }>("artisanmu-artisan-profile", {
        action: "update_profile",
        town: profileForm.town,
        district: profileForm.district,
        bio: profileForm.bio,
        specialties: profileForm.specialties,
        service_tags: profileForm.serviceTags,
        contact_preference: profileForm.contactPreference,
      });

      if (!payload.success || !payload.profile) {
        throw new Error(payload.message || "Profile could not be saved.");
      }

      setArtisan({
        ...artisan,
        town: payload.profile.town,
        district: payload.profile.district,
        bio: payload.profile.bio,
        specialties: payload.profile.specialties,
        serviceTags: payload.profile.serviceTags,
        contactPreference: payload.profile.contactPreference,
      });
      setProfileForm({
        town: payload.profile.town,
        district: payload.profile.district,
        bio: payload.profile.bio,
        specialties: payload.profile.specialties.join(", "),
        serviceTags: payload.profile.serviceTags,
        contactPreference: payload.profile.contactPreference,
      });
      setProfileMessage("Profile filters saved. Clients can use the new tags on the public page.");
    } catch (profileError) {
      setProfileMessage(profileError instanceof Error ? profileError.message : "Profile could not be saved.");
    } finally {
      setProfileSaving(false);
    }
  }

  function handleProfileCardAction(action: string) {
    if (action === "Edit hours") {
      void handleAvailabilityToggle();
      return;
    }
    if (action === "Request badge") {
      window.location.assign("mailto:hello@octolabs.app?subject=ArtisanMU%20badge%20request");
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

  async function handleSignOut() {
    if (!supabase) return;

    await supabase.auth.signOut();
    setArtisan(null);
    setJobNotifications([]);
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

  return (
    <main className="min-h-screen bg-[#f6f4ef] pb-20 text-[#101410] md:pb-0">
      <header className="sticky top-0 z-30 border-b border-[#ddd8cd] bg-[#f6f4ef]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="ArtisanMU home">
            <ArtisanMuLogo subtitle="Artisan dashboard" />
          </Link>

          <button
            type="button"
            aria-pressed={available}
            onClick={handleAvailabilityToggle}
            disabled={savingAvailability}
            className={`inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold ${
              available
                ? "bg-[#0d8b66] text-white"
                : "border border-[#ddd8cd] bg-white text-[#5f6a64]"
            }`}
          >
            {available ? (
              <CheckCircle2 className="size-4" aria-hidden="true" />
            ) : (
              <PauseCircle className="size-4" aria-hidden="true" />
            )}
            {savingAvailability ? "Saving" : available ? "Online" : "Paused"}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="hidden h-11 items-center gap-2 rounded-md border border-[#ddd8cd] bg-[#fffdf8] px-3 text-sm font-semibold text-[#0d1612] sm:inline-flex"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </header>

      <section className="border-b border-[#ddd8cd] bg-[#fffdf8]">
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
                <h1 className="text-2xl font-semibold text-[#101410] sm:text-3xl">
                  {artisan.name}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-md bg-[#e8f6f1] px-2 py-1 text-xs font-semibold text-[#0d7c5c]">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  {artisan.verified ? "Verified" : "Pending"}
                </span>
              </div>
              <p className="mt-1 text-sm text-[#5f6a64]">
                {artisan.trade} - {artisan.town}, {artisan.district}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#fff7e7] px-2.5 py-1.5 text-[#78511c]">
                  <Star className="size-4 fill-[#c79b55] text-[#c79b55]" aria-hidden="true" />
                  {artisan.rating} rating
                </span>
                <span className="rounded-md bg-[#eef5f3] px-2.5 py-1.5 text-[#0d7c5c]">
                  {artisan.reviews} reviews
                </span>
                <span className="rounded-md bg-[#f2eee4] px-2.5 py-1.5 text-[#4d5651]">
                  Quote private
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#d8d1c3] bg-[#f8f4ea] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[#5f6a64]">Today</p>
                <p className="text-2xl font-semibold text-[#101410]">{jobNotifications.length} leads</p>
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
                      : "border border-[#ddd8cd] bg-[#fffdf8] text-[#4d5651]"
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {activeTab === "jobs" ? (
            <div className="mt-0 grid gap-3 md:mt-4">
              <div className="flex flex-col gap-3 rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-[#101410]">Targeted leads</h2>
                  <p className="mt-1 text-sm leading-5 text-[#5f6a64]">
                    Only requests matched to your verified profile appear here.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadTargetedJobs}
                  disabled={jobsLoading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#ddd8cd] bg-white px-4 text-sm font-semibold text-[#0d1612] disabled:cursor-wait disabled:opacity-70"
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
                <article className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-5 text-[#4d5651] shadow-sm">
                  <LoaderCircle className="size-5 animate-spin text-[#0d8b66]" aria-hidden="true" />
                  <h2 className="mt-3 text-lg font-semibold text-[#101410]">Checking new leads</h2>
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
                <article className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-5 text-[#4d5651] shadow-sm">
                  <div className="flex size-11 items-center justify-center rounded-md bg-[#eef5f3] text-[#0d7c5c]">
                    <RefreshCcw className="size-5" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-[#101410]">No open leads yet</h2>
                  <p className="mt-2 text-sm leading-6">
                    Keep your profile online. New matching requests will appear here when clients post work in your trade and service area.
                  </p>
                </article>
              )}
            </div>
          ) : null}

          {activeTab === "profile" ? (
            <div className="mt-0 grid gap-3 md:mt-4 md:grid-cols-2">
              <article id="profile-editor" className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm md:col-span-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-[#101410]">Public profile filters</h2>
                    <p className="mt-1 text-sm leading-5 text-[#5f6a64]">
                      Keep your service area and tags accurate so clients can find you faster.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleProfileSave}
                    disabled={profileSaving}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#0d8b66] px-4 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70"
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
                  <label className="block text-sm font-medium text-[#101410]">
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
                  <label className="block text-sm font-medium text-[#101410]">
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
                  <label className="block text-sm font-medium text-[#101410] md:col-span-2">
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
                  <label className="block text-sm font-medium text-[#101410]">
                    Specialties
                    <input
                      value={profileForm.specialties}
                      onChange={(event) => {
                        setProfileForm((current) => ({ ...current, specialties: event.target.value }));
                        setProfileMessage("");
                      }}
                      className="mt-2 h-11 w-full rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none focus:border-[#0d8b66]"
                      placeholder="Leak repair, rewiring, cabinets"
                    />
                  </label>
                  <label className="block text-sm font-medium text-[#101410]">
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

                <fieldset className="mt-4 grid gap-2 rounded-lg border border-[#ddd8cd] bg-[#f8f4ea] p-3">
                  <legend className="px-1 text-sm font-medium text-[#101410]">Service tags</legend>
                  <div className="flex flex-wrap gap-2">
                    {serviceTagOptions.map((tag) => {
                      const selected = profileForm.serviceTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleProfileTag(tag)}
                          aria-pressed={selected}
                          className={`inline-flex min-h-10 items-center rounded-md px-3 text-xs font-semibold transition ${
                            selected
                              ? "bg-[#0d8b66] text-white"
                              : "border border-[#ddd8cd] bg-white text-[#4d5651] hover:border-[#0d8b66]"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {profileMessage ? (
                  <p className="mt-3 rounded-md border border-[#d7c292] bg-[#fff8e8] px-3 py-2 text-sm font-medium text-[#78511c]">
                    {profileMessage}
                  </p>
                ) : null}
              </article>

              <article id="portfolio-editor" className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm md:col-span-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-[#101410]">Portfolio showcase</h2>
                    <p className="mt-1 text-sm leading-5 text-[#5f6a64]">
                      Add recent work photos that clients can view on your public profile.
                    </p>
                  </div>
                  <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#ddd8cd] bg-white px-4 text-sm font-semibold text-[#0d1612]">
                    <ImagePlus className="size-4 text-[#0d8b66]" aria-hidden="true" />
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
                  <p className="rounded-md bg-[#f8f4ea] px-3 py-2 text-sm text-[#4d5651]">
                    {portfolioFiles.length
                      ? `${portfolioFiles.length} selected: ${portfolioFiles.map((file) => file.name).join(", ")}`
                      : `${artisan.portfolioImages.length} portfolio photos live`}
                  </p>
                  <button
                    type="button"
                    onClick={handlePortfolioUpload}
                    disabled={portfolioSaving || !portfolioFiles.length}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#0d8b66] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#93a198]"
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
                      <div key={photo} className="group relative aspect-square overflow-hidden rounded-lg border border-[#ddd8cd] bg-[#f8f4ea]">
                        <Image
                          src={photo}
                          alt={`${artisan.name} portfolio ${index + 1}`}
                          fill
                          sizes="(max-width: 768px) 50vw, 220px"
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handlePortfolioRemove(photo)}
                          disabled={portfolioSaving}
                          className="absolute right-2 top-2 inline-flex size-9 items-center justify-center rounded-md bg-[#0d1612]/85 text-white opacity-100 shadow-sm sm:opacity-0 sm:transition sm:group-hover:opacity-100"
                          aria-label={`Remove portfolio photo ${index + 1}`}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full rounded-lg border border-dashed border-[#cfc6b6] bg-[#f8f4ea] p-5 text-sm leading-6 text-[#5f6a64]">
                      Your approved work photos will appear here.
                    </div>
                  )}
                </div>
              </article>

              {profileCards.map(([title, value, Icon, action]) => (
                <article key={title as string} className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-[#101410]">{title as string}</h2>
                      <p className="mt-1 text-sm text-[#5f6a64]">{value as string}</p>
                    </div>
                    <span className="flex size-10 items-center justify-center rounded-md bg-[#eef5f3] text-[#0d7c5c]">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleProfileCardAction(action as string)}
                    disabled={action === "Edit hours" && savingAvailability}
                    className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md border border-[#ddd8cd] bg-white text-sm font-semibold text-[#0d1612] disabled:cursor-wait disabled:opacity-70"
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
                    <article key={review.id} className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Star className="size-4 fill-[#c79b55] text-[#c79b55]" aria-hidden="true" />
                            <h2 className="font-semibold text-[#101410]">
                              {review.rating}/5 from {review.client}
                            </h2>
                          </div>
                          <p className="mt-1 text-sm text-[#5f6a64]">{review.age} ago</p>
                        </div>
                        <span className="w-fit rounded-md bg-[#e8f6f1] px-2 py-1 text-xs font-semibold text-[#0d7c5c]">
                          {handledReviewIds.includes(review.id) ? "Handled" : review.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[#4d5651]">{review.comment}</p>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setReviewMessage("Reply composer will open after client messaging is enabled.")}
                          className="inline-flex h-11 items-center justify-center rounded-md border border-[#ddd8cd] bg-white text-sm font-semibold text-[#0d1612]"
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
                  <article className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-5 shadow-sm">
                    <Star className="size-5 text-[#c79b55]" aria-hidden="true" />
                    <h2 className="mt-3 text-lg font-semibold text-[#101410]">No reviews yet</h2>
                    <p className="mt-2 text-sm leading-6 text-[#5f6a64]">
                      Client reviews and replies will appear here after completed jobs are connected.
                    </p>
                  </article>
                )}
              </div>

              <aside className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm">
                <h2 className="font-semibold text-[#101410]">Comment threads</h2>
                <div className="mt-3 grid gap-3">
                  {commentsForArtisan.length ? (
                    commentsForArtisan.map((thread) => (
                      <article key={thread.id} className="rounded-md border border-[#ddd8cd] bg-[#f8f4ea] p-3">
                        <div className="flex items-center gap-2 font-semibold text-[#101410]">
                          <MessageSquareText className="size-4 text-[#234f7a]" aria-hidden="true" />
                          {thread.job}
                        </div>
                        <p className="mt-1 text-xs text-[#6c756f]">{thread.status}</p>
                        <p className="mt-2 text-sm leading-5 text-[#4d5651]">{thread.lastMessage}</p>
                      </article>
                    ))
                  ) : (
                    <p className="rounded-md border border-[#ddd8cd] bg-[#f8f4ea] p-3 text-sm leading-5 text-[#5f6a64]">
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
              {["Notification preferences", "WhatsApp and profile", "Documents and verification", "Support"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    if (item === "Support") {
                      window.location.assign("mailto:hello@octolabs.app?subject=ArtisanMU%20artisan%20support");
                      return;
                    }
                    if (item === "WhatsApp and profile") {
                      setActiveTab("profile");
                      setSettingsMessage("");
                      window.setTimeout(() => {
                        document.getElementById("profile-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }, 50);
                      return;
                    }
                    setSettingsMessage(`${item} will be connected to live job operations after review storage is enabled.`);
                  }}
                  className="flex min-h-12 items-center justify-between rounded-lg border border-[#ddd8cd] bg-[#fffdf8] px-4 text-left text-sm font-semibold text-[#101410] shadow-sm"
                >
                  {item}
                  <ChevronRight className="size-4 text-[#6c756f]" aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-lg border border-[#d8d1c3] bg-[#fffdf8] p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#0d8b66]">Next actions</p>
                <h2 className="text-xl font-semibold text-[#101410]">Keep profile active</h2>
              </div>
              <Sparkles className="size-5 text-[#c79b55]" aria-hidden="true" />
            </div>

            <div className="mt-4 grid gap-3">
              {profileTasks.map(([title, copy, Icon]) => (
                <article key={title as string} className="flex gap-3 rounded-lg border border-[#ddd8cd] bg-[#f8f4ea] p-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white text-[#0d8b66]">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold text-[#101410]">{title as string}</p>
                    <p className="mt-1 text-sm leading-5 text-[#5f6a64]">{copy as string}</p>
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

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#ddd8cd] bg-[#fffdf8] px-2 py-2 shadow-lg md:hidden">
        {dashboardTabs.map((item) => {
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
