"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Globe2, Home, LogIn, MessageCircle, Search, UserCheck } from "lucide-react";
import { ArtisanMuLogo } from "@/components/artisanmu-logo";
import { useLanguage } from "@/components/language-context";
import { languageOptions, tabLabels, type Language } from "@/lib/copy";

function normalize(path: string) {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

export function SiteHeader() {
  const pathname = normalize(usePathname() || "/");
  const { language, setLanguage, copy } = useLanguage();

  const tabs = [
    { href: "/", label: tabLabels[language].home },
    { href: "/how-it-works", label: tabLabels[language].how },
    { href: "/jobs", label: tabLabels[language].jobs },
    { href: "/browse", label: tabLabels[language].browse },
  ];

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#e3ddd1] bg-[#f7f4ee]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="rounded-lg">
            <ArtisanMuLogo subtitle="Mauritius home services" />
          </Link>

          {/* Center tabs (desktop) */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={isActive(tab.href) ? "page" : undefined}
                className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-150 ${
                  isActive(tab.href)
                    ? "border-b-2 border-[#C6A87C] text-[#C6A87C] bg-transparent"
                    : "text-[#4d5651] hover:bg-white hover:text-[#0d1612]"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <label className="flex h-10 items-center gap-1.5 rounded-xl border border-[#e3ddd1] bg-white px-2 text-sm text-[#0d1612] shadow-sm sm:gap-2 sm:px-2.5">
              <Globe2 className="size-4 text-[#0d8b66]" aria-hidden="true" />
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as Language)}
                className="bg-transparent text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#0d8b66]"
                aria-label="Language"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <Link
              href="/login"
              className="hidden h-10 items-center gap-2 rounded-xl border border-[#e3ddd1] bg-white px-3 text-sm font-medium text-[#0d1612] shadow-sm transition-colors duration-150 hover:border-[#0d8b66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d8b66] sm:flex"
            >
              <LogIn className="size-4" aria-hidden="true" />
              {copy.nav.login}
            </Link>
            <Link
              href="/artisan"
              className="hidden h-10 items-center gap-2 rounded-xl border border-[#e3ddd1] bg-white px-3 text-sm font-medium text-[#0d1612] shadow-sm transition-colors duration-150 hover:border-[#0d8b66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d8b66] md:flex"
            >
              <UserCheck className="size-4" aria-hidden="true" />
              {copy.nav.artisan}
            </Link>
            <Link href="/post" className="btn btn-primary h-10 px-4 text-sm">
              <MessageCircle className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{copy.nav.postJob}</span>
              <span className="sm:hidden">{copy.bottomNav.request}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#e3ddd1] bg-white px-2 py-2 shadow-lg lg:hidden">
        {[
          { href: "/", icon: Home, label: tabLabels[language].home },
          { href: "/jobs", icon: Briefcase, label: tabLabels[language].jobs },
          { href: "/post", icon: MessageCircle, label: copy.bottomNav.request, primary: true },
          { href: "/login", icon: LogIn, label: copy.bottomNav.login },
        ].map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold transition-all duration-150 ${
                item.primary
                  ? "bg-[#0d8b66] text-white hover:bg-[#0b7a5a] active:scale-95"
                  : active
                    ? "text-[#0a5e46]"
                    : "text-[#5d6863] hover:bg-[#f2eee4] hover:text-[#0d1612]"
              }`}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
