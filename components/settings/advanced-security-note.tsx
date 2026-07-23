"use client";

import { ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

export function AdvancedSecurityNote() {
  const { t } = useI18n();

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium text-gray-900 dark:text-white">
            {t("settings.advancedSecurityTitle")}
          </p>
          <p>{t("settings.advancedSecurityHint")}</p>
          <ul className="list-inside list-disc space-y-1 text-xs">
            <li>{t("settings.advancedSecurityRedis")}</li>
            <li>{t("settings.advancedSecurityRender")}</li>
            <li>{t("settings.advancedSecurityCloudflare")}</li>
          </ul>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {t("settings.advancedSecurityDocs")}
          </p>
        </div>
      </div>
    </div>
  );
}
