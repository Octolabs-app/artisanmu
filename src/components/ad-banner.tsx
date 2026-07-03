"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Megaphone } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    Capacitor?: unknown;
  }
}

type HouseAd = {
  id: string;
  title: string;
  body: string;
  href: string;
  image_url: string;
  placement: string;
};

type AdBannerProps = {
  slot?: string;
  format?: "auto" | "horizontal" | "rectangle" | "vertical";
  /** One of: browse | post | jobs | home — matches site_ads.placement. */
  placement: string;
  /** Retained for backward compatibility; no longer rendered when ads are inactive. */
  fallbackTitle?: string;
  fallbackCopy?: string;
  fallbackHref?: string;
  compact?: boolean;
  className?: string;
};

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

function loadAdsenseScript(clientId: string) {
  const existingScript = document.querySelector<HTMLScriptElement>(
    "script[data-artisanmu-adsense]",
  );

  if (existingScript) return;

  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
  script.dataset.artisanmuAdsense = "true";
  document.head.appendChild(script);
}

export function AdBanner({
  slot,
  format = "auto",
  placement,
  compact = false,
  className = "",
}: AdBannerProps) {
  const canUseAdsense = Boolean(ADSENSE_CLIENT_ID && slot);
  const [houseAds, setHouseAds] = useState<HouseAd[]>([]);

  useEffect(() => {
    if (!ADSENSE_CLIENT_ID || !slot || window.Capacitor) return;

    loadAdsenseScript(ADSENSE_CLIENT_ID);

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // AdSense can throw when browser extensions or local preview block the script.
    }
  }, [slot]);

  // House ads (admin-managed local sponsors) — used when AdSense is off.
  // site_ads has a public-read RLS policy scoped to active rows.
  useEffect(() => {
    if (canUseAdsense) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    let cancelled = false;

    supabase
      .from("site_ads")
      .select("id, title, body, href, image_url, placement")
      .eq("placement", placement)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(2)
      .then(({ data, error }) => {
        if (!cancelled && !error && data) setHouseAds(data as HouseAd[]);
      });

    return () => {
      cancelled = true;
    };
  }, [canUseAdsense, placement]);

  if (canUseAdsense) {
    return (
      <aside
        aria-label="Advertisements"
        data-ad-placement={placement}
        className={`w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-sm ${className}`}
      >
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-normal text-[#7a827c]">
          Advertisements
        </div>
        <ins
          className={`adsbygoogle block w-full ${compact ? "min-h-20" : "min-h-24"}`}
          style={{ display: "block" }}
          data-ad-client={ADSENSE_CLIENT_ID}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </aside>
    );
  }

  if (!houseAds.length) return null;

  return (
    <aside aria-label="Sponsored" data-ad-placement={placement} className={`grid w-full gap-3 ${className}`}>
      {houseAds.map((ad) => {
        const card = (
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm transition hover:border-[#C6A87C]">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#C6A87C]/15 text-[#8a6a1f]">
              <Megaphone className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-[#8a978f]">
                Sponsored
              </p>
              <p className="truncate text-sm font-semibold text-[var(--ink)]">{ad.title}</p>
              {ad.body ? <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{ad.body}</p> : null}
            </div>
            {ad.href ? <ExternalLink className="size-4 shrink-0 text-[#8a978f]" aria-hidden="true" /> : null}
          </div>
        );

        return ad.href ? (
          <a key={ad.id} href={ad.href} target="_blank" rel="noopener noreferrer sponsored" className="block">
            {card}
          </a>
        ) : (
          <div key={ad.id}>{card}</div>
        );
      })}
    </aside>
  );
}
