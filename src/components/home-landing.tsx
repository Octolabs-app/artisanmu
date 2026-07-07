"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Clock,
  Globe2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { CountUp } from "@/components/count-up";
import { useLanguage } from "@/components/language-context";
import { useReveal } from "@/components/use-reveal";
import { heroShowcase, heroStats, popularTrades } from "@/lib/copy";

export function HomeLanding() {
  const { language, copy } = useLanguage();
  useReveal([language]);

  return (
    <main id="top" className="text-[#16201b]">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-[#e3ddd1]">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div
            className="blob left-[-8%] top-[-10%] size-[42vw] max-w-[560px]"
            style={{ background: "radial-gradient(circle at 30% 30%, #34b88a, #0d8b66)" }}
          />
          <div
            className="blob right-[-10%] top-[8%] size-[36vw] max-w-[480px] anim-delay-2"
            style={{ background: "radial-gradient(circle at 60% 40%, #e2c99a, #c79b55)", opacity: 0.4 }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(rgba(13,22,18,0.06) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
              maskImage: "radial-gradient(80% 70% at 50% 30%, #000, transparent)",
              WebkitMaskImage: "radial-gradient(80% 70% at 50% 30%, #000, transparent)",
            }}
          />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] lg:py-20">
          <div className="min-w-0">
            <span className="reveal inline-flex items-center gap-2 rounded-full border border-[#0d8b66]/25 bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#0a5e46] backdrop-blur">
              <span className="relative flex size-2">
                <span className="pulse-ring absolute inline-flex size-2 rounded-full bg-[#0d8b66]" />
                <span className="relative inline-flex size-2 rounded-full bg-[#0d8b66]" />
              </span>
              {copy.hero.location}
            </span>
            <p className="reveal reveal-d1 mt-5 text-sm font-semibold uppercase tracking-wide text-[#0d8b66]">
              {copy.hero.eyebrow}
            </p>
            <h1 className="font-display reveal reveal-d1 mt-2 max-w-2xl text-[2.7rem] leading-[1.02] text-[#101410] sm:text-6xl lg:text-7xl">
              {copy.hero.headlineLead} <span className="gradient-text">{copy.hero.headlineEm}</span>
              {copy.hero.headlineTail}
            </h1>
            <p className="reveal reveal-d2 mt-5 max-w-xl text-lg leading-8 text-[#5d6863]">{copy.hero.support}</p>

            <div className="reveal reveal-d3 mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/post" className="btn btn-primary shine text-base">
                <MessageCircle className="size-5" aria-hidden="true" />
                {copy.hero.ctaPrimary}
              </Link>
              <Link href="/browse" className="btn btn-secondary text-base">
                {copy.hero.ctaSecondary}
                <ChevronRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <ul className="reveal reveal-d4 mt-7 flex flex-wrap gap-2">
              {copy.hero.chips.map((chip, index) => {
                const ChipIcon = [ShieldCheck, MessageCircle, Globe2, Clock][index] || Sparkles;
                return (
                  <li
                    key={chip}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#e3ddd1] bg-white/80 px-3 py-1.5 text-sm font-medium text-[#4d5651] backdrop-blur"
                  >
                    <ChipIcon className="size-4 text-[#0d8b66]" aria-hidden="true" />
                    {chip}
                  </li>
                );
              })}
            </ul>

            <dl className="reveal reveal-d5 mt-8 flex flex-wrap gap-x-8 gap-y-4">
              {heroStats.map((stat) => (
                <div key={stat.labels.en}>
                  <dt className="font-display text-3xl text-[#101410] sm:text-4xl">
                    <CountUp end={stat.value} suffix={stat.suffix} />
                  </dt>
                  <dd className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-[#5d6863]">
                    {stat.labels[language]}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Animated cluster of floating "artisan at work" photo cards */}
          <div className="relative mx-auto h-[440px] w-full max-w-md sm:h-[500px]" aria-hidden="true">
            {heroShowcase.map((card, index) => {
              const positions = [
                "left-1/2 top-0 w-60 -translate-x-[58%] sm:w-64",
                "right-0 top-28 w-52 sm:top-32 sm:w-60",
                "left-0 bottom-2 w-52 sm:w-60",
              ];
              return (
                <figure
                  key={card.trade}
                  className={`absolute ${positions[index]} ${card.float} ${card.delay} overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_28px_60px_-28px_rgba(13,22,18,0.55)]`}
                  style={{ ["--tilt" as string]: card.tilt }}
                >
                  <div className="relative aspect-[4/5]">
                    <Image
                      src={card.image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 240px, 50vw"
                      className="object-cover"
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-bold text-[#78511c] shadow-sm backdrop-blur">
                      <Star className="size-3.5 fill-[#c79b55] text-[#c79b55]" aria-hidden="true" />
                      4.9
                    </span>
                    <figcaption className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-2xl bg-white/90 px-3 py-2 backdrop-blur">
                      <span className="truncate text-sm font-semibold text-[#101410]">
                        {popularTrades.find((trade) => trade.value === card.trade)?.labels[language] ?? card.trade}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0a5e46]">
                        <span className="size-1.5 rounded-full bg-[#0d8b66]" />
                        {copy.browse.available}
                      </span>
                    </figcaption>
                  </div>
                </figure>
              );
            })}

            <div className="animate-float-slow anim-delay-1 absolute right-2 top-2 z-10 flex items-center gap-2 rounded-2xl bg-[#0d1612] px-3 py-2 text-white shadow-xl">
              <BadgeCheck className="size-5 text-[#34b88a]" aria-hidden="true" />
              <span className="text-xs font-semibold">{copy.hero.visualBadge}</span>
            </div>
          </div>
        </div>

        {/* Trades marquee ticker */}
        <div className="relative border-t border-[#e3ddd1] bg-white/50 py-3 backdrop-blur">
          <div className="marquee gap-3">
            {[...popularTrades, ...popularTrades].map((trade, index) => {
              const TileIcon = trade.icon;
              return (
                <span
                  key={`${trade.value}-${index}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[#e3ddd1] bg-white px-4 py-1.5 text-sm font-semibold text-[#4d5651]"
                >
                  <TileIcon className="size-4 text-[#0d8b66]" aria-hidden="true" />
                  {trade.labels[language]}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Popular trades → /post ── */}
      <section className="border-b border-[#e3ddd1]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="reveal max-w-2xl">
            <h2 className="font-display text-3xl text-[#101410] sm:text-4xl">{copy.tradesSection.title}</h2>
            <p className="mt-3 text-lg text-[#5d6863]">{copy.tradesSection.subtitle}</p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {popularTrades.map((trade, index) => {
              const TileIcon = trade.icon;
              return (
                <Link
                  key={trade.value}
                  href={`/post?trade=${encodeURIComponent(trade.value)}`}
                  className={`group reveal reveal-d${(index % 4) + 1} shine flex items-center gap-3 rounded-2xl border border-[#e3ddd1] bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#0d8b66] hover:shadow-lg`}
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#e7f5ef] text-[#0a5e46] transition duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:bg-[#0d8b66] group-hover:text-white">
                    <TileIcon className="size-6" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#101410]">{trade.labels[language]}</span>
                    <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-[#0d8b66]">
                      {copy.request.eyebrow}
                      <ChevronRight className="size-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Closing CTA band ── */}
      <section className="border-b border-[#e3ddd1]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="reveal reveal-scale relative overflow-hidden rounded-3xl border border-[#0d8b66]/20 bg-[#0d1612] px-6 py-12 text-center shadow-[0_40px_80px_-50px_rgba(13,22,18,0.7)] sm:px-12">
            <div
              className="pointer-events-none absolute inset-0 -z-0 opacity-60"
              style={{ background: "radial-gradient(60% 120% at 50% 0%, rgba(13,139,102,0.45), transparent 60%)" }}
              aria-hidden="true"
            />
            <div className="relative">
              <h2 className="font-display mx-auto max-w-2xl text-3xl text-white sm:text-4xl">{copy.request.title}</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-[#cbd4ce]">{copy.request.subtitle}</p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/post" className="btn btn-primary shine text-base">
                  <MessageCircle className="size-5" aria-hidden="true" />
                  {copy.nav.postJob}
                </Link>
                <Link
                  href="/browse"
                  className="btn text-base border border-white/25 bg-white/5 text-white hover:border-white/50"
                >
                  {copy.footer.links.browse}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
