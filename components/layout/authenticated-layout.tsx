"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppSidebar } from "./app-sidebar";
import { AppFooter } from "./footer";
import { Loading } from "@/components/ui/loading";
import { PricingSurveyBanner } from "@/components/pricing/pricing-survey-banner";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { SupportChatWidget } from "@/components/support/chat-widget";
import { useI18n } from "@/lib/i18n/provider";
import { useAdminCustomerView } from "@/lib/admin/use-admin-customer-view";
import { isAdminRole } from "@/lib/test-phase/flags";

export function AuthenticatedLayout({
  children,
  hideSupportWidget = false,
}: {
  children: React.ReactNode;
  hideSupportWidget?: boolean;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = isAdminRole(role);
  const { active: customerView } = useAdminCustomerView();

  // In Kundenansicht: admin experiences customer widgets (support chat etc.)
  const asCustomer = !isAdmin || customerView;

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
    <div className="flex min-h-screen flex-col md:flex-row bg-[var(--background)]">
      <AppSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {asCustomer && <PricingSurveyBanner />}
        <div className="flex-1">{children}</div>
        <AppFooter />
        {asCustomer && <OnboardingTour />}
        {!hideSupportWidget && asCustomer && <SupportChatWidget compact />}
      </div>
    </div>
  );
}
