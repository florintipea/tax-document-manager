"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";

export function AppFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400">
          <p className="text-center sm:text-left max-w-xl">
            {t("legal.footerDisclaimer")}
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/legal/impressum"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {t("legal.impressum")}
            </Link>
            <Link
              href="/legal/datenschutz"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {t("legal.datenschutz")}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
