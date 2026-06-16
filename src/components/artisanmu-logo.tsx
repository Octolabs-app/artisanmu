type ArtisanMuMarkProps = {
  className?: string;
};

type ArtisanMuLogoProps = {
  className?: string;
  subtitle?: string;
};

/**
 * Artisan Moris mark — a stylised outline of the island of Mauritius in brand
 * green with a crossed wrench + hammer. Original artwork, fully inline.
 */
export function ArtisanMuMark({ className = "size-10" }: ArtisanMuMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={`shrink-0 ${className}`}
      role="img"
      aria-label="Artisan Moris"
    >
      {/* Mauritius island silhouette */}
      <path
        d="M23 7.5C26 7 29 9 31.5 12.5C33.5 15.5 34.2 18.5 33.6 23C33 27 32 30.5 29.8 34C27.8 37.5 26 41 23 42.6C20.5 41.5 18.8 39 17 36C15 32.5 14 28.5 13.7 24C13.4 19.5 13.6 15 15.5 11.5C17.3 8.8 19.8 7.8 23 7.5Z"
        fill="#0d8b66"
        stroke="#0a5e46"
        strokeWidth="0.8"
      />
      {/* soft north-west highlight for depth */}
      <path
        d="M15.5 11.5C17.3 8.8 19.8 7.8 23 7.5C20.5 9 18.5 11.5 17.2 15C15.6 19.2 15 24 15.6 29C14.4 26 13.8 22 13.7 19C13.7 16 14.2 13.3 15.5 11.5Z"
        fill="#34b88a"
        opacity="0.35"
      />

      {/* Crossed tools on the island */}
      {/* hammer */}
      <path d="M30 36 L19.5 19.5" stroke="#ecd29a" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="15.2" y="15.6" width="6.4" height="2.9" rx="1.4" transform="rotate(-57 18.4 17)" fill="#ecd29a" />
      {/* wrench */}
      <path d="M18 36 L28.8 19.5" stroke="#ecd29a" strokeWidth="2.6" strokeLinecap="round" />
      <path
        d="M27.4 15a3 3 0 1 0 3 4.9"
        fill="none"
        stroke="#ecd29a"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
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
