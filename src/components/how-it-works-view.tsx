"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
  MapPinned,
  MessageCircle,
  PhoneCall,
  RotateCcw,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";
import { useLanguage } from "@/components/language-context";
import { PlumberIcon } from "@/components/trade-icons";
import { useReveal } from "@/components/use-reveal";
import type { Language } from "@/lib/copy";

const whyIcons = [ShieldCheck, MapPinned, PhoneCall, Wallet];

const storyCopy: Record<
  Language,
  {
    badge: string;
    chipsLabel: string;
    chips: string[];
    jobCard: string;
    posted: string;
    searching: string;
    verified: string;
    artisanTrade: string;
    responded: string;
    bubbleClient: string;
    fixed: string;
    replay: string;
    prev: string;
    next: string;
    yourTurn: string;
    skip: string;
  }
> = {
  en: {
    badge: "See it in action",
    chipsLabel: "Pick a problem — watch it happen:",
    chips: ["Leaking tap", "No power", "Door stuck"],
    jobCard: "My request",
    posted: "POSTED ✓",
    searching: "Finding artisans near you…",
    verified: "Verified",
    artisanTrade: "Plumber · Curepipe",
    responded: "3 artisans responded — you choose",
    bubbleClient: "Great! 4pm today?",
    fixed: "Fixed!",
    replay: "Replay",
    prev: "Previous step",
    next: "Next step",
    yourTurn: "Your turn — it takes 2 minutes",
    skip: "Skip the story — post your job now",
  },
  fr: {
    badge: "Voyez comment ca marche",
    chipsLabel: "Choisissez un probleme — regardez :",
    chips: ["Robinet qui fuit", "Pas de courant", "Porte bloquee"],
    jobCard: "Ma demande",
    posted: "POSTE ✓",
    searching: "Recherche d'artisans pres de vous…",
    verified: "Verifie",
    artisanTrade: "Plombier · Curepipe",
    responded: "3 artisans ont repondu — a vous de choisir",
    bubbleClient: "Super ! 16h aujourd'hui ?",
    fixed: "Repare !",
    replay: "Rejouer",
    prev: "Etape precedente",
    next: "Etape suivante",
    yourTurn: "A vous — ca prend 2 minutes",
    skip: "Passer l'histoire — postez votre travail",
  },
  mfe: {
    badge: "Get kouma sa marse",
    chipsLabel: "Swazir enn problem — gete:",
    chips: ["Robine pe koule", "Pena kouran", "Laport bloke"],
    jobCard: "Mo demann",
    posted: "POSTE ✓",
    searching: "Pe rod artizan pre kot ou…",
    verified: "Verifye",
    artisanTrade: "Plonbie · Curepipe",
    responded: "3 artizan finn reponn — ou swazir",
    bubbleClient: "Top! 4er tanto?",
    fixed: "Fini repare!",
    replay: "Rezwe",
    prev: "Step avan",
    next: "Prosen step",
    yourTurn: "Ou tour aster — 2 minit selman",
    skip: "Sote zistwar-la — poste ou travay aster",
  },
};

/* ── Act 1: the leaky house ── */
function SceneHouse({ problem, sc }: { problem: string; sc: (typeof storyCopy)["en"] }) {
  return (
    <div className="relative h-full w-full" aria-hidden="true">
      <svg viewBox="0 0 320 240" className="h-full w-full" fill="none">
        {/* ground */}
        <ellipse cx="160" cy="216" rx="130" ry="12" fill="#e8e2d4" />
        {/* house */}
        <rect x="60" y="104" width="130" height="106" rx="6" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
        <path d="M48 108 L125 46 L202 108 Z" fill="#0d8b66" stroke="#0f172a" strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="76" y="52" width="12" height="30" fill="#c84b31" stroke="#0f172a" strokeWidth="2" />
        {/* door */}
        <rect x="86" y="152" width="34" height="58" rx="3" fill="#C6A87C" stroke="#0f172a" strokeWidth="2.2" />
        <circle cx="112" cy="182" r="2.5" fill="#0f172a" />
        {/* window */}
        <rect x="138" y="126" width="34" height="30" rx="3" fill="#bae6fd" stroke="#0f172a" strokeWidth="2.2" />
        <line x1="155" y1="126" x2="155" y2="156" stroke="#0f172a" strokeWidth="1.6" />
        <line x1="138" y1="141" x2="172" y2="141" stroke="#0f172a" strokeWidth="1.6" />
        {/* tap on the side of the house */}
        <rect x="196" y="128" width="30" height="9" rx="4.5" fill="#94a3b8" stroke="#0f172a" strokeWidth="2" />
        <rect x="218" y="135" width="9" height="14" rx="3" fill="#94a3b8" stroke="#0f172a" strokeWidth="2" />
        <rect x="205" y="118" width="10" height="12" rx="3" fill="#64748b" stroke="#0f172a" strokeWidth="2" />
        {/* drips */}
        <circle className="story-drip" cx="222.5" cy="152" r="4" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.2" />
        <circle className="story-drip story-drip-2" cx="222.5" cy="152" r="3.4" fill="#7dd3fc" stroke="#0f172a" strokeWidth="1" />
        <circle className="story-drip story-drip-3" cx="222.5" cy="152" r="3.8" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.1" />
        {/* puddle */}
        <ellipse className="story-puddle" cx="224" cy="212" rx="30" ry="6" fill="#7dd3fc" stroke="#0f172a" strokeWidth="1.6" opacity="0.9" />
        {/* worried sun for charm */}
        <circle cx="284" cy="42" r="16" fill="#fbbf24" stroke="#0f172a" strokeWidth="2" />
        <circle cx="279" cy="39" r="1.8" fill="#0f172a" />
        <circle cx="289" cy="39" r="1.8" fill="#0f172a" />
        <path d="M279 47 Q284 44 289 47" stroke="#0f172a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
      {/* job card overlay */}
      <div className="story-pop story-d2 absolute bottom-3 left-3 rounded-xl border-2 border-[#0d1612] bg-white px-3 py-2 shadow-lg">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a978f]">{sc.jobCard}</p>
        <p className="mt-0.5 text-sm font-semibold text-[#101410]">💧 {problem}</p>
        <span className="story-stamp story-d3 absolute -right-4 -top-3 inline-block rounded-md border-2 border-[#0d8b66] bg-[#e7f5ef] px-2 py-0.5 text-[10px] font-black tracking-wider text-[#0a5e46]">
          {sc.posted}
        </span>
      </div>
    </div>
  );
}

/* ── Act 2: matching on the map ── */
function SceneMap({ sc }: { sc: (typeof storyCopy)["en"] }) {
  return (
    <div className="relative h-full w-full" aria-hidden="true">
      <svg viewBox="0 0 320 240" className="h-full w-full" fill="none">
        {/* stylized Mauritius */}
        <path
          d="M150 30 Q206 24 228 62 Q252 100 240 148 Q230 192 186 208 Q140 222 108 192 Q76 162 82 114 Q88 66 118 44 Q132 34 150 30 Z"
          fill="#dcefe7"
          stroke="#0d8b66"
          strokeWidth="2.5"
        />
        {/* radar pings */}
        <circle className="story-ping" cx="130" cy="80" r="14" fill="none" stroke="#0d8b66" strokeWidth="2" />
        <circle className="story-ping story-d2" cx="196" cy="120" r="14" fill="none" stroke="#0d8b66" strokeWidth="2" />
        <circle className="story-ping story-d3" cx="150" cy="170" r="14" fill="none" stroke="#0d8b66" strokeWidth="2" />
        {/* job pin drops in the center */}
        <g className="story-pop">
          <path d="M160 96 Q172 108 160 126 Q148 108 160 96 Z" fill="#E24B4A" stroke="#0f172a" strokeWidth="2" />
          <circle cx="160" cy="107" r="4" fill="#ffffff" stroke="#0f172a" strokeWidth="1.4" />
        </g>
      </svg>
      {/* artisan avatars pop in */}
      <div className="story-pop story-d1 absolute left-[34%] top-[26%] flex size-9 items-center justify-center rounded-full border-2 border-white bg-[#0d8b66] text-xs font-bold text-white shadow-md">R</div>
      <div className="story-pop story-d2 absolute right-[24%] top-[44%] flex size-9 items-center justify-center rounded-full border-2 border-white bg-[#C6A87C] text-xs font-bold text-white shadow-md">S</div>
      <div className="story-pop story-d3 absolute left-[42%] bottom-[22%] flex size-9 items-center justify-center rounded-full border-2 border-white bg-[#234f7a] text-xs font-bold text-white shadow-md">D</div>
      {/* matched artisan card */}
      <div className="story-pop story-d4 absolute bottom-3 right-3 flex items-center gap-2.5 rounded-xl border-2 border-[#0d1612] bg-white px-3 py-2 shadow-lg">
        <span className="flex size-10 items-center justify-center rounded-full bg-[#e7f5ef]">
          <PlumberIcon className="size-7" />
        </span>
        <div>
          <p className="flex items-center gap-1 text-sm font-bold text-[#101410]">
            Ravi
            <BadgeCheck className="size-4 text-[#0d8b66]" />
          </p>
          <p className="text-[11px] text-[#5d6863]">{sc.artisanTrade}</p>
          <p className="flex items-center gap-0.5 text-[11px] font-semibold text-[#78511c]">
            <Star className="size-3 fill-[#c79b55] text-[#c79b55]" /> 4.9
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Act 3: booked on WhatsApp, fixed ── */
function SceneChat({ sc }: { sc: (typeof storyCopy)["en"] }) {
  const confetti = [
    { left: "12%", delay: "2.1s", color: "#0d8b66" },
    { left: "28%", delay: "2.25s", color: "#C6A87C" },
    { left: "46%", delay: "2.15s", color: "#E24B4A" },
    { left: "62%", delay: "2.3s", color: "#38bdf8" },
    { left: "78%", delay: "2.2s", color: "#fbbf24" },
    { left: "90%", delay: "2.35s", color: "#0d8b66" },
  ];
  return (
    <div className="relative flex h-full w-full flex-col justify-center gap-2 px-5" aria-hidden="true">
      {/* match status beat: responses arrived, the client picks one */}
      <div className="story-pop mb-1 flex items-center gap-2 self-center rounded-full border border-[#0d8b66]/25 bg-white px-3 py-1.5 shadow-sm">
        <span className="flex -space-x-1.5">
          <span className="flex size-5 items-center justify-center rounded-full border-2 border-white bg-[#0d8b66] text-[9px] font-bold text-white">R</span>
          <span className="flex size-5 items-center justify-center rounded-full border-2 border-white bg-[#C6A87C] text-[9px] font-bold text-white">S</span>
          <span className="flex size-5 items-center justify-center rounded-full border-2 border-white bg-[#234f7a] text-[9px] font-bold text-white">D</span>
        </span>
        <span className="text-xs font-semibold text-[#0a5e46]">{sc.responded}</span>
      </div>
      {/* chat bubbles */}
      <div className="story-bubble story-d1 max-w-[75%] self-start rounded-2xl rounded-bl-sm bg-[#e7f5ef] px-3.5 py-2 text-sm font-medium text-[#0a3d2e] shadow-sm">
        Mo kapav vini aster! 🔧
      </div>
      <div className="story-bubble story-d2 max-w-[75%] self-end rounded-2xl rounded-br-sm bg-white px-3.5 py-2 text-sm font-medium text-[#16201b] shadow-sm ring-1 ring-[#e3ddd1]">
        {sc.bubbleClient}
      </div>
      <div className="story-bubble story-d3 max-w-[75%] self-start rounded-2xl rounded-bl-sm bg-[#e7f5ef] px-3.5 py-2 text-sm font-medium text-[#0a3d2e] shadow-sm">
        Deal. A taler! 👍
      </div>
      {/* fixed badge */}
      <div className="story-pop story-d4 mt-3 flex items-center gap-2 self-center rounded-full border-2 border-[#0d8b66] bg-white px-4 py-2 shadow-md">
        <svg viewBox="0 0 24 24" className="story-wrench size-5" fill="none">
          <path
            d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-2.4 2.6-2.6Z"
            fill="#C6A87C"
            stroke="#0f172a"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-sm font-bold text-[#0a5e46]">{sc.fixed}</span>
        <span className="flex size-5 items-center justify-center rounded-full bg-[#0d8b66] text-[11px] font-black text-white">✓</span>
      </div>
      {/* confetti */}
      {confetti.map((c, i) => (
        <span
          key={i}
          className="story-confetti absolute top-[38%] block size-2 rounded-[2px]"
          style={{ left: c.left, animationDelay: c.delay, backgroundColor: c.color }}
        />
      ))}
    </div>
  );
}

function HowStory() {
  const { language, copy } = useLanguage();
  const sc = storyCopy[language];
  const [act, setAct] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [nonce, setNonce] = useState(0);
  const [chip, setChip] = useState(0);

  // Gentle auto-advance until the user takes over.
  useEffect(() => {
    if (!autoplay) return;
    const timer = setTimeout(() => setAct((current) => (current + 1) % 3), 5600);
    return () => clearTimeout(timer);
  }, [act, autoplay, nonce]);

  function goTo(next: number) {
    setAutoplay(false);
    setAct((next + 3) % 3);
  }

  function onKeys(event: React.KeyboardEvent) {
    if (event.key === "ArrowRight") goTo(act + 1);
    if (event.key === "ArrowLeft") goTo(act - 1);
  }

  const steps = copy.how.steps;
  const scenes = [
    <SceneHouse key={`h-${chip}-${language}`} problem={sc.chips[chip]} sc={sc} />,
    <SceneMap key="m" sc={sc} />,
    <SceneChat key="c" sc={sc} />,
  ];

  return (
    <div className="reveal reveal-d1 mt-10 grid items-stretch gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      {/* Scene */}
      <div className="relative order-1 min-h-[300px] overflow-hidden rounded-3xl border border-[#e3ddd1] bg-[#fbf8f1] shadow-[0_28px_60px_-32px_rgba(13,22,18,0.35)] sm:min-h-[340px]">
        <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#0d1612] px-3 py-1 text-xs font-semibold text-white">
          {act + 1}/3 · {steps[act].title}
        </span>
        <button
          type="button"
          onClick={() => {
            setAutoplay(false);
            setNonce((n) => n + 1);
          }}
          className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-[#e3ddd1] bg-white/90 px-3 py-1 text-xs font-semibold text-[#0d1612] shadow-sm transition hover:border-[#0d8b66]"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          {sc.replay}
        </button>
        <div key={`${act}-${nonce}`} className="absolute inset-0 pt-10">
          {scenes[act]}
        </div>
      </div>

      {/* Controls + copy */}
      <div className="order-2 flex flex-col justify-center" onKeyDown={onKeys}>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#0d8b66]/25 bg-white px-3 py-1.5 text-xs font-semibold text-[#0a5e46]">
          ✨ {sc.badge}
        </span>
        <h2 className="font-display mt-4 text-3xl text-[#101410]">{steps[act].title}</h2>
        <p className="mt-2 text-base leading-7 text-[#5d6863]">{steps[act].desc}</p>

        {act === 0 ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8a978f]">{sc.chipsLabel}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {sc.chips.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setChip(index)}
                  aria-pressed={chip === index}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                    chip === index
                      ? "border-[#0d8b66] bg-[#0d8b66] text-white shadow-md"
                      : "border-[#e3ddd1] bg-white text-[#4d5651] hover:border-[#0d8b66]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {act === 2 ? (
          <Link href="/post" className="btn btn-primary shine mt-5 w-fit">
            <MessageCircle className="size-4" aria-hidden="true" />
            {sc.yourTurn}
          </Link>
        ) : (
          <Link
            href="/post"
            className="mt-5 w-fit text-sm font-semibold text-[#0a5e46] underline-offset-4 transition-colors duration-150 hover:underline"
          >
            {sc.skip} →
          </Link>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => goTo(act - 1)}
            aria-label={sc.prev}
            className="flex size-10 items-center justify-center rounded-full border border-[#e3ddd1] bg-white text-[#0d1612] shadow-sm transition hover:border-[#0d8b66] active:scale-95"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2" role="tablist" aria-label="Story steps">
            {steps.map((step, index) => (
              <button
                key={step.title}
                type="button"
                role="tab"
                aria-selected={act === index}
                aria-label={`${index + 1}. ${step.title}`}
                onClick={() => goTo(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  act === index ? "w-8 bg-[#0d8b66]" : "w-2.5 bg-[#d6cdb9] hover:bg-[#C6A87C]"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goTo(act + 1)}
            aria-label={sc.next}
            className="flex size-10 items-center justify-center rounded-full border border-[#e3ddd1] bg-white text-[#0d1612] shadow-sm transition hover:border-[#0d8b66] active:scale-95"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function HowItWorksView() {
  const { language, copy } = useLanguage();
  const [openFaq, setOpenFaq] = useState(0);
  useReveal([language]);

  return (
    <main className="text-[#16201b]">
      {/* How it works — interactive story */}
      <section className="border-b border-[#e3ddd1]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="reveal max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#0d8b66]">{copy.request.eyebrow}</p>
            <h1 className="font-display mt-2 text-4xl text-[#101410] sm:text-5xl">{copy.how.title}</h1>
            <p className="mt-3 text-lg text-[#5d6863]">{copy.how.subtitle}</p>
          </div>

          <HowStory />

          <div className="reveal mt-10">
            <Link href="/post" className="btn btn-primary shine text-base">
              <MessageCircle className="size-5" aria-hidden="true" />
              {copy.nav.postJob}
            </Link>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="border-b border-[#e3ddd1]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="reveal max-w-2xl">
            <h2 className="font-display text-3xl text-[#101410] sm:text-4xl">{copy.why.title}</h2>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {copy.why.items.map((item, index) => {
              const WhyIcon = whyIcons[index] || HeartHandshake;
              return (
                <div
                  key={item.title}
                  className={`reveal reveal-d${index + 1} hover-lift rounded-2xl border border-[#e3ddd1] bg-white p-6 shadow-sm hover:border-[#0d8b66]/40 hover:shadow-lg`}
                >
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-[#e7f5ef] text-[#0a5e46]">
                    <WhyIcon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-[#101410]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5d6863]">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-[#e3ddd1]">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
          <h2 className="font-display reveal text-3xl text-[#101410] sm:text-4xl">{copy.faq.title}</h2>
          <div className="mt-8 grid gap-3">
            {copy.faq.items.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={item.q}
                  className={`reveal reveal-d${Math.min(index + 1, 5)} overflow-hidden rounded-2xl border border-[#e3ddd1] bg-white shadow-sm transition-colors hover:border-[#0d8b66]/40`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0d8b66]"
                  >
                    <span className="text-base font-semibold text-[#101410]">{item.q}</span>
                    <ChevronDown
                      className={`size-5 shrink-0 text-[#0d8b66] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-200 ease-in-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm leading-6 text-[#5d6863]">{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
