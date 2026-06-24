"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "./navbar";
import { AppFooter } from "./footer";
import { Loading } from "@/components/ui/loading";
import { PricingSurveyBanner } from "@/components/pricing/pricing-survey-banner";
import { useI18n } from "@/lib/i18n/provider";

export function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading variant="spinner" size="lg" text={t("common.loading")} />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <>
      <Navbar />
      <PricingSurveyBanner />
      {children}
      <AppFooter />
    </>
  );
}



