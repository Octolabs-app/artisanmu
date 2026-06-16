type ArtisanMuMarkProps = {
  className?: string;
};

type ArtisanMuLogoProps = {
  className?: string;
  subtitle?: string;
};

/**
 * Artisan Moris mark — a stylised Mauritius island badge holding a
 * construction hard hat over crossed tools (wrench + screwdriver).
 * Original artwork, fully inline, legible down to favicon size.
 */
export function ArtisanMuMark({ className = "size-10" }: ArtisanMuMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={`shrink-0 ${className}`}
      role="img"
      aria-label="Artisan Moris"
    >
      {/* Island badge (Mauritius silhouette, stylised) */}
      <path
        d="M24 4C32 4 39 8 42 16C44.6 22.2 43 30 38 36C34 41 29 44 24 44C19 44 14 41 10 36C5 30 3.4 22.2 6 16C9 8 16 4 24 4Z"
        fill="#0d8b66"
      />
      <path
        d="M24 44C19 44 14 41 10 36C5 30 3.4 22.2 6 16C7 13.5 8.7 11.4 10.8 9.8C8.7 13 8 17 9.4 21.5C12 30 21 41 38.6 35.4C34.4 41 29 44 24 44Z"
        fill="#0a5e46"
        opacity="0.55"
      />

      {/* Crossed tools (behind the hat) */}
      <path d="M14 39 L33 18.5" stroke="#ecd29a" strokeWidth="3.1" strokeLinecap="round" />
      <path d="M34 39 L15 18.5" stroke="#ecd29a" strokeWidth="3.1" strokeLinecap="round" />
      {/* wrench open jaw, top-right */}
      <path
        d="M31.4 14.6a3.6 3.6 0 1 0 3.4 5.7"
        fill="none"
        stroke="#ecd29a"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      {/* screwdriver tip, top-left */}
      <path d="M12.6 15.4l3.6 3.5-2.5 1.1z" fill="#ecd29a" />

      {/* Hard hat */}
      <rect x="9.4" y="25.4" width="29.2" height="4.8" rx="2.4" fill="#f7f4ee" />
      <path d="M15 26.4C15 18.3 19 13.9 24 13.9C29 13.9 33 18.3 33 26.4Z" fill="#f7f4ee" />
      <rect x="22" y="10.4" width="4" height="4.8" rx="2" fill="#f7f4ee" />
      {/* hat ridges */}
      <path d="M20.2 26C20.2 20 20.8 16.7 22.3 14.6" fill="none" stroke="#cfe7dd" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M27.8 26C27.8 20 27.2 16.7 25.7 14.6" fill="none" stroke="#cfe7dd" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function ArtisanMuLogo({ className = "", subtitle }: ArtisanMuLogoProps) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <ArtisanMuMark />
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold tracking-tight text-[#101410]">
          Artisan <span className="text-[#0d8b66]">Moris</span>
        </p>
        {subtitle ? <p className="truncate text-xs text-[#6c756f]">{subtitle}</p> : null}
      </div>
    </div>
  );
}
