"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Gauge,
  ImagePlus,
  MapPin,
  MessageCircle,
  MessageSquareText,
  PauseCircle,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  TimerReset,
  UserRound,
  Wrench,
} from "lucide-react";
import { AdBanner } from "@/components/ad-banner";
import { ArtisanMuLogo } from "@/components/artisanmu-logo";
import { artisanJobs, commentThreads, reviewItems } from "@/lib/admin-data";
import type { Artisan } from "@/lib/types";

const dashboardTabs = [
  { id: "jobs", label: "Jobs", icon: Wrench },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "settings", label: "More", icon: Settings },
] as const;

type DashboardTab = (typeof dashboardTabs)[number]["id"];

function getConnectedArtisan(): Artisan | null {
  return null;
}

function jobStatusClass(status: string) {
  if (status === "New") return "bg-[#fff7e7] text-[#78511c]";
  if (status === "Done") return "bg-[#f2eee4] text-[#5f6a64]";
  return "bg-[#e8f6f1] text-[#0d7c5c]";
}

function EmptyDashboard() {
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
            <Wrench className="size-5" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold">No artisan profile connected</h1>
          <p className="mt-2 text-sm leading-6 text-[#5f6a64]">
            This dashboard will show real leads, profile settings, reviews, and comments after
            an approved artisan account is connected.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#0d8b66] px-4 text-sm font-semibold text-white"
            >
              Create or connect profile
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

export function ArtisanDashboard() {
  const artisan = getConnectedArtisan();
  const [activeTab, setActiveTab] = useState<DashboardTab>("jobs");
  const [available, setAvailable] = useState(true);
  const [acceptedIds, setAcceptedIds] = useState<string[]>([]);

  const liveJobs = useMemo(
    () =>
      artisanJobs.map((job) => ({
        ...job,
        status: acceptedIds.includes(job.id) ? "Accepted" : job.status,
      })),
    [acceptedIds],
  );

  if (!artisan) {
    return <EmptyDashboard />;
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
            onClick={() => setAvailable((value) => !value)}
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
            {available ? "Online" : "Paused"}
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
                  Verified
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
                <p className="text-2xl font-semibold text-[#101410]">3 jobs</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-md bg-[#0d1612] text-white">
                <Gauge className="size-5" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-md bg-white px-2 py-3">
                <p className="text-lg font-semibold">18m</p>
                <p className="text-[#6c756f]">response</p>
              </div>
              <div className="rounded-md bg-white px-2 py-3">
                <p className="text-lg font-semibold">2</p>
                <p className="text-[#6c756f]">reviews</p>
              </div>
              <div className="rounded-md bg-white px-2 py-3">
                <p className="text-lg font-semibold">92%</p>
                <p className="text-[#6c756f]">profile</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
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
              {liveJobs.map((job) => (
                <article key={job.id} className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-[#101410]">{job.title}</h2>
                        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${jobStatusClass(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[#5f6a64]">
                        {job.town} - {job.distance}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#0d8b66]">Quote in chat</p>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-[#4d5651]">{job.note}</p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                    <div className="flex flex-wrap gap-2 text-sm text-[#4d5651]">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#eef5f3] px-2.5 py-1.5">
                        <Clock className="size-4 text-[#0f766e]" aria-hidden="true" />
                        {job.time}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#f2eee4] px-2.5 py-1.5">
                        <MapPin className="size-4 text-[#9f4a4a]" aria-hidden="true" />
                        Route
                      </span>
                    </div>
                    <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#ddd8cd] bg-white px-4 text-sm font-semibold text-[#0d1612]">
                      <MessageCircle className="size-4" aria-hidden="true" />
                      Chat
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAcceptedIds((current) =>
                          current.includes(job.id) ? current : [...current, job.id],
                        )
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0d1612] px-4 text-sm font-semibold text-white"
                    >
                      Accept
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {activeTab === "profile" ? (
            <div className="mt-0 grid gap-3 md:mt-4 md:grid-cols-2">
              {[
                ["Portfolio photos", "4 of 6 added", ImagePlus, "Add photos"],
                ["Badges", "Verified, Fair price", BadgeCheck, "Request badge"],
                ["Availability", available ? "Online today" : "Paused", TimerReset, "Edit hours"],
                ["Service area", "Plaines Wilhems + nearby", MapPin, "Update towns"],
              ].map(([title, value, Icon, action]) => (
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
                  <button className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md border border-[#ddd8cd] bg-white text-sm font-semibold text-[#0d1612]">
                    {action as string}
                  </button>
                </article>
              ))}
            </div>
          ) : null}

          {activeTab === "reviews" ? (
            <div className="mt-0 grid gap-3 md:mt-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="grid gap-3">
                {reviewItems
                  .filter((review) => review.artisan === artisan.name)
                  .map((review) => (
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
                          {review.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[#4d5651]">{review.comment}</p>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <button className="inline-flex h-11 items-center justify-center rounded-md border border-[#ddd8cd] bg-white text-sm font-semibold text-[#0d1612]">
                          Reply
                        </button>
                        <button className="inline-flex h-11 items-center justify-center rounded-md bg-[#0d1612] text-sm font-semibold text-white">
                          Mark handled
                        </button>
                      </div>
                    </article>
                  ))}
              </div>

              <aside className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm">
                <h2 className="font-semibold text-[#101410]">Comment threads</h2>
                <div className="mt-3 grid gap-3">
                  {commentThreads
                    .filter((thread) => thread.artisan === artisan.name)
                    .map((thread) => (
                      <article key={thread.id} className="rounded-md border border-[#ddd8cd] bg-[#f8f4ea] p-3">
                        <div className="flex items-center gap-2 font-semibold text-[#101410]">
                          <MessageSquareText className="size-4 text-[#234f7a]" aria-hidden="true" />
                          {thread.job}
                        </div>
                        <p className="mt-1 text-xs text-[#6c756f]">{thread.status}</p>
                        <p className="mt-2 text-sm leading-5 text-[#4d5651]">{thread.lastMessage}</p>
                      </article>
                    ))}
                </div>
              </aside>
            </div>
          ) : null}

          {activeTab === "settings" ? (
            <div className="mt-0 grid gap-3 md:mt-4">
              {["Notification preferences", "Pricing and callout fee", "Documents and verification", "Support"].map((item) => (
                <button
                  key={item}
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
              {[
                ["Reply to new lead", "Kitchen sink leak waits for acceptance.", MessageCircle],
                ["Upload 2 photos", "Portfolio reaches trusted threshold.", ImagePlus],
                ["Confirm tomorrow", "Tap replacement scheduled at 09:00.", CalendarCheck],
              ].map(([title, copy, Icon]) => (
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
