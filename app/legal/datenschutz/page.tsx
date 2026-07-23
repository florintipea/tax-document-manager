"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { AppLogo } from "@/components/brand/app-logo";

export default function DatenschutzPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/" className="inline-flex mb-8">
          <AppLogo size="md" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          {t("legal.datenschutz")}
        </h1>
        <div className="prose dark:prose-invert max-w-none space-y-4 text-gray-700 dark:text-gray-300">
          <p>{t("legal.datenschutzIntro")}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t("legal.datenschutzPoint1")}</li>
            <li>{t("legal.datenschutzPoint2")}</li>
            <li>{t("legal.datenschutzPoint3")}</li>
            <li>{t("legal.datenschutzHosting")}</li>
          </ul>
          <p className="text-sm text-gray-500">{t("legal.datenschutzNote")}</p>
        </div>
        <Link
          href="/"
          className="inline-block mt-8 text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t("common.back")}
        </Link>
      </div>
    </div>
  );
}
