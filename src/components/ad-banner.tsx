"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    Capacitor?: unknown;
  }
}

type AdBannerProps = {
  slot?: string;
  format?: "auto" | "horizontal" | "rectangle" | "vertical";
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

  // When AdSense is not configured, render nothing. No placeholder/fallback box
  // on the marketing page. Ads can be switched on later by providing env vars.
  if (!canUseAdsense) {
    return null;
  }

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
