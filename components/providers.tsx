"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { Suspense, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { CommandPalette } from "@/components/ui/command-palette";
import { I18nProvider } from "@/lib/i18n/provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { UserPreferencesSync } from "@/components/providers/user-preferences-sync";
import { GlobalErrorReporter } from "@/components/feedback/global-error-reporter";
import { CookieNotice } from "@/components/legal/cookie-notice";
import { AdminCustomerPreviewBar } from "@/components/admin/customer-preview-bar";
import { MetaPixel } from "@/components/tracking/meta-pixel";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <ErrorBoundary>
      <SessionProvider refetchOnWindowFocus={true}>
        <ThemeProvider>
          <I18nProvider>
            <UserPreferencesSync />
            <GlobalErrorReporter />
            <QueryClientProvider client={queryClient}>
              {children}
              <CommandPalette />
              <CookieNotice />
              <MetaPixel />
              <Suspense fallback={null}>
                <AdminCustomerPreviewBar />
              </Suspense>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  className: "dark:bg-gray-800 dark:text-white",
                  style: {
                    background: "var(--card)",
                    color: "var(--foreground)",
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: "#4ade80",
                      secondary: "#fff",
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: "#ef4444",
                      secondary: "#fff",
                    },
                  },
                }}
              />
              {process.env.NODE_ENV === "development" && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </QueryClientProvider>
          </I18nProvider>
        </ThemeProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
