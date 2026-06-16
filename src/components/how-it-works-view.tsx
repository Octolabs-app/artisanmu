"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BadgeCheck,
  ChevronDown,
  HeartHandshake,
  MapPinned,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useLanguage } from "@/components/language-context";
import { useReveal } from "@/components/use-reveal";

const howIcons = [Sparkles, BadgeCheck, MessageCircle];
const whyIcons = [ShieldCheck, MapPinned, PhoneCall, Wallet];

export function HowItWorksView() {
  const { language, copy } = useLanguage();
  const [openFaq, setOpenFaq] = useState(0);
  useReveal([language]);

  return (
    <main className="text-[#16201b]">
      {/* How it works */}
      <section className="border-b border-[#e3ddd1]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="reveal max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#0d8b66]">{copy.request.eyebrow}</p>
            <h1 className="font-display mt-2 text-4xl text-[#101410] sm:text-5xl">{copy.how.title}</h1>
            <p className="mt-3 text-lg text-[#5d6863]">{copy.how.subtitle}</p>
          </div>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {copy.how.steps.map((step, index) => {
              const StepIcon = howIcons[index] || Sparkles;
              return (
                <li
                  key={step.title}
                  className={`reveal reveal-d${index + 1} hover-lift relative rounded-2xl border border-[#e3ddd1] bg-white p-6 shadow-sm hover:border-[#0d8b66]/40 hover:shadow-lg`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-[#e7f5ef] text-[#0a5e46]">
                      <StepIcon className="size-6" aria-hidden="true" />
                    </span>
                    <span className="font-display text-3xl text-[#d6cdb9]">{index + 1}</span>
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-[#101410]">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#5d6863]">{step.desc}</p>
                </li>
              );
            })}
          </ol>
          <div className="reveal mt-8">
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
                  className={`reveal reveal-d${(index % 4) + 1} overflow-hidden rounded-2xl border border-[#e3ddd1] bg-white shadow-sm transition hover:border-[#0d8b66]/40`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  >
                    <span className="text-base font-semibold text-[#101410]">{item.q}</span>
                    <ChevronDown
                      className={`size-5 shrink-0 text-[#0d8b66] transition ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen ? <p className="px-5 pb-5 text-sm leading-6 text-[#5d6863]">{item.a}</p> : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
