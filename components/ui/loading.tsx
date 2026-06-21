"use client";

import { Skeleton } from "./skeleton";

interface LoadingProps {
  variant?: "spinner" | "dots" | "pulse" | "skeleton";
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

export function Loading({
  variant = "spinner",
  size = "md",
  text,
  fullScreen = false,
}: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  if (variant === "skeleton") {
    return <Skeleton />;
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {variant === "spinner" && (
        <div
          className={`${sizeClasses[size]} border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin`}
        />
      )}
      {variant === "dots" && (
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`${sizeClasses[size]} bg-blue-600 dark:bg-blue-500 rounded-full animate-bounce`}
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: "0.6s",
              }}
            />
          ))}
        </div>
      )}
      {variant === "pulse" && (
        <div
          className={`${sizeClasses[size]} bg-blue-600 dark:bg-blue-500 rounded-full animate-pulse`}
        />
      )}
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return content;
}

// Button loading state
export function ButtonLoading({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <div
      className={`inline-block ${
        size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6"
      } border-2 border-current border-t-transparent rounded-full animate-spin`}
    />
  );
}



