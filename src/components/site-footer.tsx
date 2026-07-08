"use client";

import Link from "next/link";
import { MapPinned } from "lucide-react";
import { useLanguage } from "@/components/language-context";

const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61591777050142";

function FacebookMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
    </svg>
  );
}

export function SiteFooter() {
  const { copy } = useLanguage();

  return (
    <footer className="mt-auto bg-[#0d1612] text-[#f6f4ef]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <p className="font-display text-xl">
            Artizan <span className="text-[#3fbf95]">Moris</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-[#cbd4ce]">{copy.footer.tagline}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-[#cbd4ce]">
              <MapPinned className="size-3.5 text-[#3fbf95]" aria-hidden="true" />
              <span role="status" aria-label="Based in Mauritius">Mauritius</span>
            </span>
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Artizan Moris on Facebook"
              className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-[#cbd4ce] transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fbf95]"
            >
              <FacebookMark className="size-3.5 text-[#3fbf95]" />
              Facebook
            </a>
          </div>
        </div>

        <nav aria-label="Product links">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8a978f]">{copy.footer.cols.product}</p>
          <ul className="mt-4 grid gap-2.5 text-sm text-[#cbd4ce]">
            <li>
              <Link href="/post" className="transition-colors duration-150 hover:text-white">
                {copy.footer.links.post}
              </Link>
            </li>
            <li>
              <Link href="/browse" className="transition-colors duration-150 hover:text-white">
                {copy.footer.links.browse}
              </Link>
            </li>
            <li>
              <Link href="/artisan" className="transition-colors duration-150 hover:text-white">
                {copy.footer.links.artisan}
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Company links">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8a978f]">{copy.footer.cols.company}</p>
          <ul className="mt-4 grid gap-2.5 text-sm text-[#cbd4ce]">
            <li>
              <Link href="/login" className="transition-colors duration-150 hover:text-white">
                {copy.footer.links.login}
              </Link>
            </li>
            <li>
              <a href="mailto:hello@octolabs.app" className="transition-colors duration-150 hover:text-white">
                hello@octolabs.app
              </a>
            </li>
          </ul>
        </nav>
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
