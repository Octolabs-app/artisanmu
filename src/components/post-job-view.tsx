"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { JobRequestForm } from "@/components/JobRequestForm";
import { useLanguage } from "@/components/language-context";
import { useReveal } from "@/components/use-reveal";
import { popularTrades } from "@/lib/copy";

export function PostJobView() {
  const { language, copy } = useLanguage();
  const [initialTrade, setInitialTrade] = useState<string | undefined>(undefined);
  useReveal([language]);

  // Read a ?trade= query param (set when a trade tile is tapped) after mount.
  // Deferred so it never runs a synchronous setState inside the effect body.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trade = params.get("trade");
    if (!trade) return;
    const match = popularTrades.find((item) => item.value.toLowerCase() === trade.toLowerCase());
    if (!match) return;
    const raf = requestAnimationFrame(() => setInitialTrade(match.value));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <main className="text-[#16201b]">
      <section className="border-b border-[#e3ddd1] bg-[#fbf8f1]">
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:py-16">
          <div className="reveal lg:sticky lg:top-24">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#e7f5ef] px-3 py-1.5 text-xs font-semibold text-[#0a5e46]">
              <Sparkles className="size-3.5" aria-hidden="true" />
              {copy.request.eyebrow}
            </span>
            <h1 className="font-display mt-4 text-4xl text-[#101410] sm:text-5xl">{copy.request.title}</h1>
            <p className="mt-4 max-w-md text-lg leading-8 text-[#5d6863]">{copy.request.subtitle}</p>

            <ul className="mt-6 grid gap-3">
              {copy.how.steps.map((step) => (
                <li key={step.title} className="flex items-center gap-3 text-sm font-medium text-[#4d5651]">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#0a5e46] shadow-sm">
                    <Sparkles className="size-4" aria-hidden="true" />
                  </span>
                  {step.title}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-2">
              {popularTrades.map((trade) => {
                const TileIcon = trade.icon;
                const active = initialTrade === trade.value;
                return (
                  <button
                    key={trade.value}
                    type="button"
                    onClick={() => setInitialTrade(trade.value)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-[#0d8b66] bg-[#e7f5ef] text-[#0a5e46]"
                        : "border-[#e3ddd1] bg-white text-[#4d5651] hover:border-[#0d8b66]"
                    }`}
                  >
                    <TileIcon className="size-3.5 text-[#0d8b66]" aria-hidden="true" />
                    {trade.labels[language]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="reveal reveal-d2 rounded-3xl border border-[#e3ddd1] bg-white p-2 shadow-[0_30px_60px_-40px_rgba(13,22,18,0.4)]">
            <JobRequestForm key={`req-${initialTrade ?? "default"}`} initialTrade={initialTrade} />
          </div>
        </div>
      </section>
    </main>
  );
}
