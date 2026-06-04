"use client";

import { useEffect } from "react";
import Link from "next/link";

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
  fallbackTitle: string;
  fallbackCopy: string;
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
  fallbackTitle,
  fallbackCopy,
  fallbackHref = "mailto:hello@octolabs.app?subject=ArtisanMU%20advertising",
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

  return (
    <aside
      aria-label="Advertisements"
      data-ad-placement={placement}
      className={`w-full rounded-lg border border-[#d8d1c3] bg-[#fffdf8] p-3 shadow-sm ${className}`}
    >
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-normal text-[#7a827c]">
        Advertisements
      </div>

      {canUseAdsense ? (
        <ins
          className={`adsbygoogle block w-full ${compact ? "min-h-20" : "min-h-24"}`}
          style={{ display: "block" }}
          data-ad-client={ADSENSE_CLIENT_ID}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      ) : (
        <Link
          href={fallbackHref}
          className={`block rounded-md border border-dashed border-[#cfc6b6] bg-[#f8f4ea] px-4 py-3 text-[#60451f] transition hover:border-[#c79b55] hover:bg-[#fff8e8] ${
            compact ? "min-h-20" : "min-h-24"
          }`}
        >
          <span className="block text-sm font-semibold text-[#101410]">{fallbackTitle}</span>
          <span className="mt-1 block text-sm leading-5">{fallbackCopy}</span>
        </Link>
      )}
    </aside>
  );
}
