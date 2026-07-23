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

/** TaxDoc mark — deep royal blue + light document icon (matches marketing brand). */
export function AppLogo({
  size = "md",
  showText = true,
  className,
  textClassName,
}: AppLogoProps) {
  const px = sizeMap[size];
  const gradId = `taxdoc-logo-bg-${size}`;

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
          <radialGradient id={gradId} cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#2B5FCC" />
            <stop offset="55%" stopColor="#1A3FA8" />
            <stop offset="100%" stopColor="#0B1F5C" />
          </radialGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill={`url(#${gradId})`} />
        <path
          d="M22 14h14l8 8v28a3 3 0 0 1-3 3H22a3 3 0 0 1-3-3V17a3 3 0 0 1 3-3z"
          fill="none"
          stroke="#8EC5F0"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M36 14v8h8"
          fill="none"
          stroke="#8EC5F0"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M26 34h12M26 40h12M26 46h8"
          stroke="#8EC5F0"
          strokeWidth="2"
          strokeLinecap="round"
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
