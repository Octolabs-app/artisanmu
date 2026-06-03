type ArtisanMuMarkProps = {
  className?: string;
};

type ArtisanMuLogoProps = {
  className?: string;
  subtitle?: string;
};

export function ArtisanMuMark({ className = "size-10" }: ArtisanMuMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={`shrink-0 ${className}`}
      role="img"
      aria-label="ArtisanMU"
    >
      <rect width="48" height="48" rx="12" fill="#0d1612" />
      <path
        d="M12.5 27.5 24 15.5l11.5 12"
        fill="none"
        stroke="#d7aa55"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
      <path
        d="M18 28.5v7h12v-7"
        fill="none"
        stroke="#f6f4ef"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.5"
      />
      <path
        d="M24 20.5v15"
        fill="none"
        stroke="#f6f4ef"
        strokeLinecap="round"
        strokeWidth="3.5"
      />
      <path
        d="M17 36.5c4.2 3.3 9.8 3.3 14 0"
        fill="none"
        stroke="#0d8b66"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <circle cx="35" cy="14" r="2.5" fill="#d7aa55" />
    </svg>
  );
}

export function ArtisanMuLogo({ className = "", subtitle }: ArtisanMuLogoProps) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <ArtisanMuMark />
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold tracking-normal text-[#101410]">
          Artisan<span className="text-[#0d8b66]">MU</span>
        </p>
        {subtitle ? <p className="truncate text-xs text-[#6c756f]">{subtitle}</p> : null}
      </div>
    </div>
  );
}
