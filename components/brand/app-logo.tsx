import { cn } from "@/lib/utils/cn";

const sizeMap = {
  sm: 28,
  md: 32,
  lg: 48,
  xl: 64,
} as const;

type AppLogoProps = {
  size?: keyof typeof sizeMap;
  showText?: boolean;
  className?: string;
  textClassName?: string;
};

export function AppLogo({
  size = "md",
  showText = true,
  className,
  textClassName,
}: AppLogoProps) {
  const px = sizeMap[size];

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width={px}
        height={px}
        viewBox="0 0 64 64"
        role="img"
        aria-label="TaxDoc"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="taxdoc-logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill="url(#taxdoc-logo-bg)" />
        <path
          d="M18 16h20l8 8v28a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2V18a2 2 0 0 1 2-2z"
          fill="#fff"
          opacity="0.96"
        />
        <path d="M38 16v8h8" fill="#e0e7ff" />
        <rect x="20" y="30" width="18" height="2" rx="1" fill="#93c5fd" />
        <rect x="20" y="36" width="24" height="2" rx="1" fill="#93c5fd" />
        <rect x="20" y="42" width="20" height="2" rx="1" fill="#93c5fd" />
        <circle cx="46" cy="46" r="10" fill="#22c55e" />
        <path
          d="M41 46l3.5 3.5 7-7"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {showText ? (
        <span
          className={cn(
            "font-bold text-gray-900 dark:text-white",
            size === "sm" && "text-base",
            size === "md" && "text-xl",
            size === "lg" && "text-2xl",
            size === "xl" && "text-3xl",
            textClassName
          )}
        >
          TaxDoc
        </span>
      ) : null}
    </span>
  );
}
