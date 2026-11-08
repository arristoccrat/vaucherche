import { cn } from "@/lib/utils";

// The vaucherche mark: a mint voucher ticket with notched sides, an ink V
// and an amber dot. Drawn in the brand tokens; the app icons
// (src/app/icon.svg, favicon.ico, apple-icon.png) are the same drawing.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 112 112" aria-hidden className={className}>
      <path
        d="M18 8H94a10 10 0 0 1 10 10V44a12 12 0 0 0 0 24V94a10 10 0 0 1-10 10H18a10 10 0 0 1-10-10V68a12 12 0 0 0 0-24V18a10 10 0 0 1 10-10z"
        className="fill-brand-mint stroke-brand-ink"
        strokeWidth={5}
      />
      <path
        d="M34 41L56 77L78 41"
        fill="none"
        className="stroke-brand-ink"
        strokeWidth={14}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={89} cy={22} r={6.5} className="fill-brand-amber stroke-brand-ink" strokeWidth={3.5} />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-extrabold tracking-[-0.03em] text-brand-ink", className)}>
      vaucher<span className="text-brand-mint-deep">che</span>
    </span>
  );
}

// Decorative confetti from the mobile header.
export function Confetti({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 130 58" aria-hidden className={className}>
      <circle cx="18" cy="12" r="5" className="fill-brand-mint" />
      <rect x="46" y="8" width="10" height="10" rx="3" transform="rotate(22 51 13)" className="fill-brand-amber" />
      <circle cx="82" cy="14" r="4" className="fill-brand-mint" />
      <rect x="104" y="24" width="9" height="9" rx="2.5" transform="rotate(-24 108 28)" className="fill-brand-amber" />
      <circle cx="34" cy="38" r="4" className="fill-brand-amber" />
      <circle cx="70" cy="42" r="5" className="fill-brand-mint" />
    </svg>
  );
}
