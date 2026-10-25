import { cn } from "@/lib/utils";

// The vaucherche mark (from the Desktop / Main artboards): a mint blob with a
// cream check-V and two amber dots.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1024 1024" aria-hidden className={className}>
      <path
        d="M512 70C760 70 950 230 960 500c10 260-160 430-440 430C250 930 70 760 70 490 70 230 270 70 512 70z"
        className="fill-brand-mint"
      />
      <path
        d="M330 330L512 690L715 300"
        fill="none"
        className="stroke-brand-ground"
        strokeWidth="112"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="845" cy="215" r="44" className="fill-brand-amber" />
      <circle cx="936" cy="326" r="22" className="fill-brand-amber" />
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
