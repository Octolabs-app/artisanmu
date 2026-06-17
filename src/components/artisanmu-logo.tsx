import Image from "next/image";

type ArtisanMuMarkProps = {
  className?: string;
};

type ArtisanMuLogoProps = {
  className?: string;
  subtitle?: string;
  /** Hide the text wordmark (e.g. when the emblem is shown large on its own). */
  hideWordmark?: boolean;
};

/**
 * Artizan Moris emblem — illustrated Mauritius island mark
 * (public/artizan-moris-logo.png).
 */
export function ArtisanMuMark({ className = "size-11" }: ArtisanMuMarkProps) {
  return (
    <Image
      src="/artizan-moris-logo.png"
      alt="Artizan Moris"
      width={512}
      height={512}
      priority
      className={`shrink-0 object-contain ${className}`}
    />
  );
}

export function ArtisanMuLogo({ className = "", subtitle, hideWordmark = false }: ArtisanMuLogoProps) {
  return (
    <div className={`flex min-w-0 items-center gap-2.5 ${className}`}>
      <ArtisanMuMark />
      {hideWordmark ? null : (
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-lg font-semibold tracking-tight text-[#101410]">
            Artizan <span className="text-[#0d8b66]">Moris</span>
          </p>
          {subtitle ? <p className="truncate text-xs text-[#6c756f]">{subtitle}</p> : null}
        </div>
      )}
    </div>
  );
}
