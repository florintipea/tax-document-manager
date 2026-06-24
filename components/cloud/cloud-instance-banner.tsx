"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Cloud } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";

function isCloudHosted(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host.includes("onrender.com") || host.includes("render.com");
}

export function CloudInstanceBanner() {
  const { t } = useI18n();
  const [waking, setWaking] = useState<boolean | null>(null);
  const [retrying, setRetrying] = useState(false);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch("/api/health", {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!isCloudHosted()) return;
    void checkHealth().then((ok) => setWaking(!ok));
  }, [checkHealth]);

  const handleRetry = async () => {
    setRetrying(true);
    const ok = await checkHealth();
    setWaking(!ok);
    setRetrying(false);
    if (ok) {
      window.location.reload();
    }
  };

  // Only show when the instance is waking — Starter/upgraded hosts stay hidden when healthy.
  if (!isCloudHosted() || waking !== true) return null;

  return (
    <div
      className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-100"
      role="status"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <Cloud className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{t("cloudWake.waking")}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => void handleRetry()}
          isLoading={retrying}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          {t("cloudWake.retry")}
        </Button>
      </div>
    </div>
  );
}
