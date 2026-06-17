"use client";

import Link from "next/link";
import { MapPinned } from "lucide-react";
import { useLanguage } from "@/components/language-context";

export function SiteFooter() {
  const { copy } = useLanguage();

  return (
    <footer className="mt-auto bg-[#0d1612] text-[#f6f4ef]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <p className="font-display text-xl">
            Artisan <span className="text-[#3fbf95]">Moris</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-[#cbd4ce]">{copy.footer.tagline}</p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-[#cbd4ce]">
            <MapPinned className="size-3.5 text-[#3fbf95]" aria-hidden="true" />
            Mauritius
          </span>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8a978f]">{copy.footer.cols.product}</p>
          <ul className="mt-4 grid gap-2.5 text-sm text-[#cbd4ce]">
            <li>
              <Link href="/post" className="transition hover:text-white">
                {copy.footer.links.post}
              </Link>
            </li>
            <li>
              <Link href="/browse" className="transition hover:text-white">
                {copy.footer.links.browse}
              </Link>
            </li>
            <li>
              <Link href="/how-it-works" className="transition hover:text-white">
                {copy.hero.ctaSecondary}
              </Link>
            </li>
            <li>
              <Link href="/artisan" className="transition hover:text-white">
                {copy.footer.links.artisan}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8a978f]">{copy.footer.cols.company}</p>
          <ul className="mt-4 grid gap-2.5 text-sm text-[#cbd4ce]">
            <li>
              <Link href="/login" className="transition hover:text-white">
                {copy.footer.links.login}
              </Link>
            </li>
            <li>
              <a href="mailto:hello@octolabs.app" className="transition hover:text-white">
                hello@octolabs.app
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-[#8a978f] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Artizan Moris by Octolabs</p>
          <p>{copy.footer.builtFor}</p>
        </div>
      </div>
    </footer>
  );
}
