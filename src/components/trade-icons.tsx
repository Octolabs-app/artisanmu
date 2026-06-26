import type { SVGProps } from "react";

type I = SVGProps<SVGSVGElement>;

export function PlumberIcon(props: I) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="4" y="26" width="56" height="12" rx="6" fill="#7dd3fc" stroke="#0f172a" strokeWidth="2.2" />
      <rect x="6" y="28" width="52" height="4" rx="2" fill="white" opacity=".45" />
      <rect x="2" y="22" width="7" height="20" rx="3.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="2" />
      <rect x="55" y="22" width="7" height="20" rx="3.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="2" />
      <path d="M40 10 L48 6 Q54 8 53 16 Q52 20 46 20 L38 24 L32 18 Z" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />
      <path d="M32 18 L20 42" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
      <path d="M32 18 L20 42" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M48 8 Q52 12 50 16" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M14 44 Q13 48 14 50 Q15 52 16 50 Q17 48 16 44 Q15 42 14 44Z" fill="#34b88a" stroke="#0f172a" strokeWidth="1.5" />
      <path d="M22 50 Q21.5 52.5 22 54 Q22.5 55 23 54 Q23.5 52.5 23 50 Q22.5 49 22 50Z" fill="#34b88a" stroke="#0f172a" strokeWidth="1.2" />
    </svg>
  );
}

export function ElectricianIcon(props: I) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="8" y="10" width="48" height="44" rx="6" fill="#f1f5f9" stroke="#0f172a" strokeWidth="2.5" />
      <rect x="10" y="12" width="44" height="40" rx="4" fill="white" />
      <circle cx="16" cy="18" r="3" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.5" />
      <line x1="14.9" y1="18" x2="17.1" y2="18" stroke="#94a3b8" strokeWidth="1.2" />
      <circle cx="48" cy="18" r="3" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.5" />
      <line x1="46.9" y1="18" x2="49.1" y2="18" stroke="#94a3b8" strokeWidth="1.2" />
      <rect x="20" y="30" width="8" height="14" rx="4" fill="#0f172a" />
      <rect x="36" y="30" width="8" height="14" rx="4" fill="#0f172a" />
      <path d="M35 14 L27 33 H31 L29 50 L37 31 H33 L35 14Z" fill="#fbbf24" stroke="#0f172a" strokeWidth="1.8" />
    </svg>
  );
}

export function PainterIcon(props: I) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M10 50 Q20 38 32 44 Q44 50 54 38" stroke="#0d8b66" strokeWidth="10" strokeLinecap="round" opacity=".25" />
      <path d="M10 50 Q20 38 32 44 Q44 50 54 38" stroke="#0d8b66" strokeWidth="5" strokeLinecap="round" opacity=".6" />
      <rect x="28" y="6" width="10" height="34" rx="5" fill="#92400e" stroke="#0f172a" strokeWidth="2" transform="rotate(15 33 23)" />
      <rect x="29" y="7" width="3" height="30" rx="1.5" fill="#b45309" opacity=".5" transform="rotate(15 33 23)" />
      <rect x="27" y="32" width="12" height="7" rx="1" fill="#94a3b8" stroke="#0f172a" strokeWidth="1.8" transform="rotate(15 33 36)" />
      <path d="M25 38 Q28 44 31 46 Q34 48 37 45 Q38 42 36 38" fill="#0d8b66" stroke="#0f172a" strokeWidth="2" transform="rotate(15 31 42)" />
      <path d="M52 30 Q51 33 52 35 Q53 36 54 35 Q55 33 54 30 Q53.5 28 52 30Z" fill="#C6A87C" stroke="#0f172a" strokeWidth="1.5" />
    </svg>
  );
}

export function CarpenterIcon(props: I) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="6" y="44" width="52" height="12" rx="3" fill="#d97706" stroke="#0f172a" strokeWidth="2" />
      <line x1="14" y1="44" x2="14" y2="56" stroke="#92400e" strokeWidth="1.2" />
      <line x1="26" y1="44" x2="26" y2="56" stroke="#92400e" strokeWidth="1.2" />
      <line x1="38" y1="44" x2="38" y2="56" stroke="#92400e" strokeWidth="1.2" />
      <line x1="50" y1="44" x2="50" y2="56" stroke="#92400e" strokeWidth="1.2" />
      <circle cx="40" cy="42" r="2" fill="#fbbf24" />
      <circle cx="44" cy="40" r="1.5" fill="#fbbf24" />
      <circle cx="36" cy="40" r="1" fill="#fbbf24" />
      <rect x="8" y="22" width="46" height="10" rx="2" fill="#94a3b8" stroke="#0f172a" strokeWidth="2" />
      <path d="M8 32 L11 38 L14 32 L17 38 L20 32 L23 38 L26 32 L29 38 L32 32 L35 38 L38 32 L41 38 L44 32 L47 38 L50 32 L53 38 L54 32" stroke="#0f172a" strokeWidth="1.8" strokeLinejoin="miter" fill="none" />
      <path d="M54 22 Q60 22 60 28 Q60 34 54 34 L54 22Z" fill="#92400e" stroke="#0f172a" strokeWidth="2" />
      <circle cx="57" cy="28" r="2.5" fill="#d97706" stroke="#0f172a" strokeWidth="1.5" />
      <rect x="9" y="24" width="44" height="3" rx="1" fill="white" opacity=".2" />
    </svg>
  );
}

export function MasonIcon(props: I) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="4" y="36" width="28" height="10" rx="1.5" fill="#c84b31" stroke="#0f172a" strokeWidth="1.8" />
      <rect x="34" y="36" width="26" height="10" rx="1.5" fill="#c84b31" stroke="#0f172a" strokeWidth="1.8" />
      <rect x="4" y="48" width="18" height="10" rx="1.5" fill="#bf4527" stroke="#0f172a" strokeWidth="1.8" />
      <rect x="24" y="48" width="22" height="10" rx="1.5" fill="#bf4527" stroke="#0f172a" strokeWidth="1.8" />
      <rect x="48" y="48" width="12" height="10" rx="1.5" fill="#bf4527" stroke="#0f172a" strokeWidth="1.8" />
      <line x1="4" y1="36" x2="60" y2="36" stroke="#d4c5a9" strokeWidth="3" />
      <line x1="4" y1="48" x2="60" y2="48" stroke="#d4c5a9" strokeWidth="3" />
      <path d="M32 6 L52 26 Q54 30 50 34 L46 36 L26 14 Q22 10 26 6 L32 6Z" fill="#94a3b8" stroke="#0f172a" strokeWidth="2.2" />
      <path d="M34 8 L50 28" stroke="white" strokeWidth="2" opacity=".4" strokeLinecap="round" />
      <path d="M26 36 L16 48" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
      <path d="M26 36 L16 48" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
      <path d="M36 18 Q42 22 40 28 Q36 26 36 18Z" fill="#d4c5a9" opacity=".7" stroke="#0f172a" strokeWidth="1.2" />
    </svg>
  );
}

export function ACTechIcon(props: I) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="4" y="8" width="56" height="26" rx="5" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2.5" />
      <rect x="6" y="10" width="52" height="22" rx="3" fill="white" />
      <rect x="10" y="14" width="44" height="3" rx="1.5" fill="#cbd5e1" />
      <rect x="10" y="19" width="44" height="3" rx="1.5" fill="#cbd5e1" />
      <rect x="10" y="24" width="44" height="3" rx="1.5" fill="#cbd5e1" />
      <circle cx="52" cy="14" r="2.5" fill="#0d8b66" stroke="#0f172a" strokeWidth="1" />
      <circle cx="46" cy="14" r="2.5" fill="#fbbf24" stroke="#0f172a" strokeWidth="1" />
      <rect x="4" y="28" width="56" height="6" fill="#0d1612" />
      <path d="M16 34 L16 46 L14 42 M16 46 L18 42" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M28 34 L28 50 L26 45 M28 50 L30 45" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M40 34 L40 46 L38 42 M40 46 L42 42" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M52 34 L52 44 L50 40 M52 44 L54 40" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="42" x2="32" y2="56" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
      <line x1="25" y1="45.5" x2="39" y2="52.5" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
      <line x1="25" y1="52.5" x2="39" y2="45.5" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="49" r="2.5" fill="#3b82f6" stroke="#0f172a" strokeWidth="1.5" />
    </svg>
  );
}

export function LocksmithIcon(props: I) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="20" cy="22" r="16" fill="#fbbf24" stroke="#0f172a" strokeWidth="2.5" />
      <circle cx="20" cy="22" r="9" fill="#f0ede6" stroke="#0f172a" strokeWidth="2" />
      <circle cx="14" cy="18" r="3" fill="#f0ede6" stroke="#0f172a" strokeWidth="1.5" />
      <circle cx="26" cy="18" r="3" fill="#f0ede6" stroke="#0f172a" strokeWidth="1.5" />
      <circle cx="20" cy="28" r="3" fill="#f0ede6" stroke="#0f172a" strokeWidth="1.5" />
      <path d="M10 12 Q14 8 20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity=".7" />
      <rect x="34" y="19" width="26" height="6" rx="3" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />
      <rect x="50" y="25" width="5" height="8" rx="1.5" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />
      <rect x="42" y="25" width="4" height="6" rx="1.5" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />
      <rect x="57" y="25" width="3" height="5" rx="1" fill="#f59e0b" stroke="#0f172a" strokeWidth="1.5" />
      <rect x="35" y="17" width="24" height="3" rx="1.5" fill="#fcd34d" stroke="#0f172a" strokeWidth="1.5" />
    </svg>
  );
}

export function GardenerIcon(props: I) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M20 42 L18 58 Q18 60 20 60 H44 Q46 60 46 58 L44 42 Z" fill="#c2410c" stroke="#0f172a" strokeWidth="2.2" />
      <rect x="17" y="38" width="30" height="7" rx="3.5" fill="#ea580c" stroke="#0f172a" strokeWidth="2" />
      <rect x="19" y="40" width="26" height="3" rx="1.5" fill="#fb923c" opacity=".5" />
      <ellipse cx="32" cy="38" rx="14" ry="4" fill="#78350f" stroke="#0f172a" strokeWidth="1.8" />
      <path d="M32 38 Q31 28 32 20" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 28 Q20 22 18 12 Q28 14 32 26 Z" fill="#16a34a" stroke="#0f172a" strokeWidth="1.8" />
      <path d="M30 26 Q22 20 20 13" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M32 24 Q44 18 46 8 Q36 10 32 22 Z" fill="#22c55e" stroke="#0f172a" strokeWidth="1.8" />
      <path d="M34 22 Q42 16 44 9" stroke="#16a34a" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="32" cy="18" r="4" fill="#4ade80" stroke="#0f172a" strokeWidth="1.8" />
      <path d="M12 24 Q11 27 12 29 Q13 30 14 29 Q15 27 14 24 Q13.5 22 12 24Z" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.5" />
      <path d="M50 30 Q49.5 32 50 33.5 Q50.5 34 51 33.5 Q51.5 32 51 30 Q50.5 29 50 30Z" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.2" />
    </svg>
  );
}
