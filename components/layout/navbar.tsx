"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Calculator,
  Bot,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  ClipboardList,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { LanguageSelector } from "./language-selector";
import { useI18n } from "@/lib/i18n/provider";
import { FeedbackButton } from "@/components/feedback/feedback-dialog";
import { AppLogo } from "@/components/brand/app-logo";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openReportCount, setOpenReportCount] = useState(0);
  const { t } = useI18n();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "admin" || role === "super_admin";

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/reports?status=open&limit=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.openCount != null) setOpenReportCount(data.openCount);
      })
      .catch(() => {});
  }, [isAdmin, pathname]);

  const navItems = [
    { href: "/dashboard", label: t('common.dashboard'), icon: LayoutDashboard, highlight: false },
    { href: "/documents", label: t('common.documents'), icon: FileText, highlight: true, highlightLabel: t('nav.dokumente') },
    { href: "/tax-forms", label: t('common.taxForms'), icon: FileText, highlight: false },
    { href: "/calculator", label: t('common.calculator'), icon: Calculator, highlight: true, highlightLabel: t('nav.steuerrechner') },
    { href: "/ai-assistant", label: t('common.aiAssistant'), icon: Bot, highlight: true, highlightLabel: t('nav.aiSteuerberater') },
    { href: "/settings", label: t('common.settings'), icon: Settings, highlight: false },
  ];

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center">
            <AppLogo size="md" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {item.highlight && (
                    <span className="hidden lg:inline-flex text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                      {item.highlightLabel ?? t('nav.coreFeature')}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-2">
            <LanguageSelector />
            <FeedbackButton />
            {isAdmin && (
              <Link
                href="/admin/reports"
                className={cn(
                  "relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive("/admin/reports")
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <ClipboardList className="w-4 h-4" />
                {t("adminReports.nav")}
                {openReportCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
                    {openReportCount > 99 ? "99+" : openReportCount}
                  </span>
                )}
              </Link>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {session?.user?.name || session?.user?.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              {t('common.logout')}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-1">
              <div className="px-4 py-2">
                <LanguageSelector />
              </div>
              <div className="px-4 py-2">
                <FeedbackButton />
              </div>
              {isAdmin && (
                <Link
                  href="/admin/reports"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ClipboardList className="w-5 h-5" />
                  {t("adminReports.nav")}
                  {openReportCount > 0 ? ` (${openReportCount})` : ""}
                </Link>
              )}
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium",
                      isActive(item.href)
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                  {session?.user?.name || session?.user?.email}
                </div>
                <button
                  onClick={() => {
                    signOut({ callbackUrl: "/" });
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOut className="w-5 h-5" />
                  {t('common.logout')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}


