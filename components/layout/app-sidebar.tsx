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
  Activity,
  ClipboardCheck,
  BarChart3,
  MessageSquare,
  LifeBuoy,
  Shield,
  Percent,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useCallback, type ComponentType } from "react";
import { cn } from "@/lib/utils/cn";
import { LanguageSelector } from "./language-selector";
import { useI18n } from "@/lib/i18n/provider";
import { FeedbackButton } from "@/components/feedback/feedback-dialog";
import { AppLogo } from "@/components/brand/app-logo";
import { AdminNotificationBell } from "@/components/admin/notification-bell";
import { useAdminCustomerView } from "@/lib/admin/use-admin-customer-view";
import { isAdminRole } from "@/lib/test-phase/flags";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  highlight?: boolean;
  highlightLabel?: string;
  badge?: number | string;
  accent?: boolean;
};

const SIDEBAR_COLLAPSE_KEY = "taxdoc-sidebar-collapsed";

export function AppSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openReportCount, setOpenReportCount] = useState(0);
  const { t } = useI18n();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = isAdminRole(role);
  const { active: customerView } = useAdminCustomerView();
  /** In Kundenansicht: look like a normal user — no admin chrome */
  const showAdminChrome = isAdmin && !customerView;

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  useEffect(() => {
    if (!showAdminChrome) return;
    fetch("/api/admin/reports?status=open&limit=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.openCount != null) setOpenReportCount(data.openCount);
      })
      .catch(() => {});
  }, [showAdminChrome, pathname]);

  /** Prefer translation; never show raw key (partial locale files). */
  const tr = (key: string, fallback: string) => {
    const value = t(key);
    return !value || value === key ? fallback : value;
  };

  const navItems: NavItem[] = [
    {
      href: "/dashboard",
      label: tr("common.dashboard", "Dashboard"),
      icon: LayoutDashboard,
    },
    {
      href: "/documents",
      label: tr("common.documents", "Dokumente"),
      icon: FileText,
      highlight: true,
      highlightLabel: tr("nav.dokumente", "Dokumente"),
    },
    {
      href: "/steuererklaerung",
      label: tr("common.steuererklaerung", "Steuererklärung"),
      icon: ClipboardCheck,
      highlight: true,
      highlightLabel: tr("nav.steuererklaerung", "ELSTER-Assistent"),
    },
    {
      href: "/calculator",
      label: tr("common.calculator", "Steuerrechner"),
      icon: Calculator,
      highlight: true,
      highlightLabel: tr("nav.steuerrechner", "Steuerrechner"),
    },
    {
      href: "/ai-assistant",
      label: tr("common.aiAssistant", "KI-Steuer-Assistent"),
      icon: Bot,
      highlight: true,
      highlightLabel: tr("nav.aiSteuerberater", "KI-Steuer-Assistent"),
    },
    { href: "/support", label: "Hilfe", icon: LifeBuoy },
    { href: "/settings", label: tr("common.settings", "Einstellungen"), icon: Settings },
  ];

  /** Directly under Dashboard for fast admin intervention — not buried in a bottom group. */
  const adminHubItem: NavItem = {
    href: "/admin",
    label: tr("nav.adminHub", "Admin-Zentrale"),
    icon: Shield,
    accent: true,
  };

  const primaryNavItems = navItems.filter((item) => item.href === "/dashboard");
  const secondaryNavItems = navItems.filter((item) => item.href !== "/dashboard");

  const adminToolItems: NavItem[] = [
    { href: "/admin/preise", label: "Preise & Rabatte", icon: Percent },
    { href: "/admin/support", label: "Support", icon: MessageSquare },
    {
      href: "/admin/reports",
      label: tr("adminReports.nav", "Meldungen"),
      icon: ClipboardList,
      badge: openReportCount > 0 ? openReportCount : undefined,
    },
    {
      href: "/admin/tester-activity",
      label: tr("testerActivity.nav", "Tester-Aktivität"),
      icon: Activity,
    },
    { href: "/admin/beta-funnel", label: "Beta KPI", icon: BarChart3 },
    { href: "/admin/kundenansicht", label: "Kundenansicht", icon: Eye },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const linkClass = (href: string, accent?: boolean) =>
    cn(
      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      isActive(href)
        ? accent
          ? "bg-[#1A3FA8] text-white shadow-sm"
          : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
        : accent
          ? "bg-blue-50 text-[#1A3FA8] hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/40"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/80"
    );

  const NavLink = ({
    item,
    onNavigate,
    compact,
  }: {
    item: NavItem;
    onNavigate?: () => void;
    compact?: boolean;
  }) => {
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        title={item.label}
        className={linkClass(item.href, item.accent)}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden />
        {!compact && (
          <>
            {/* Full label — no mid-word clip; wrap instead of frozen "Admin…" truncation */}
            <span
              className={cn(
                "min-w-0 flex-1 leading-snug",
                item.accent ? "whitespace-normal break-words font-semibold" : "whitespace-normal break-words"
              )}
            >
              {item.label}
            </span>
            {item.accent && (
              <span className="shrink-0 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                Admin
              </span>
            )}
            {item.highlight && !item.accent && (
              <span className="hidden xl:inline-flex shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                {item.highlightLabel ?? tr("nav.coreFeature", "DE")}
              </span>
            )}
            {item.badge != null && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
                {typeof item.badge === "number" && item.badge > 99
                  ? "99+"
                  : item.badge}
              </span>
            )}
          </>
        )}
        {compact && item.badge != null && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-600" />
        )}
        <span className="sr-only">{item.label}</span>
      </Link>
    );
  };

  const SidebarBody = ({
    compact,
    onNavigate,
  }: {
    compact?: boolean;
    onNavigate?: () => void;
  }) => (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex items-center border-b border-gray-200 dark:border-gray-700",
          compact ? "justify-center px-2 py-4" : "justify-between gap-2 px-4 py-4"
        )}
      >
        <Link href="/dashboard" onClick={onNavigate} className="min-w-0">
          <AppLogo size="md" showText={!compact} />
        </Link>
        {!compact && showAdminChrome && (
          <AdminNotificationBell />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {!compact && (
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {tr("nav.appSection", "App")}
          </p>
        )}

        {/* Dashboard → Admin-Zentrale (admin only) → rest of app */}
        {primaryNavItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            compact={compact}
            onNavigate={onNavigate}
          />
        ))}
        {showAdminChrome && (
          <NavLink
            item={adminHubItem}
            compact={compact}
            onNavigate={onNavigate}
          />
        )}
        {secondaryNavItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            compact={compact}
            onNavigate={onNavigate}
          />
        ))}

        {showAdminChrome && (
          <div className="pt-4 mt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
            {!compact && (
              <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-[#1A3FA8] dark:text-blue-400">
                {tr("nav.adminSection", "Administration")}
              </p>
            )}
            {adminToolItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                compact={compact}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </nav>

      <div
        className={cn(
          "border-t border-gray-200 dark:border-gray-700 space-y-2",
          compact ? "p-2" : "p-3"
        )}
      >
        {!compact && (
          <>
            <LanguageSelector />
            <FeedbackButton />
          </>
        )}
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-900/50",
            compact ? "justify-center p-2" : "px-2 py-2"
          )}
        >
          <div className="w-8 h-8 shrink-0 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
          {!compact && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                {session?.user?.name || session?.user?.email}
              </p>
              {isAdmin && (
                <p className="truncate text-[11px] text-[#1A3FA8] dark:text-blue-400">
                  {customerView ? "Kundenansicht" : "Administrator"}
                </p>
              )}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={cn("w-full", compact && "px-0")}
          onClick={() => signOut({ callbackUrl: "/" })}
          leftIcon={<LogOut className="w-4 h-4" />}
          title={t("common.logout")}
        >
          {!compact && t("common.logout")}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop / tablet sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden md:flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-[width] duration-200",
          collapsed ? "w-[4.5rem]" : "w-64"
        )}
        aria-label="Hauptnavigation"
      >
        <SidebarBody compact={collapsed} />
        <button
          type="button"
          onClick={toggleCollapsed}
          className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
          aria-label={collapsed ? "Menü ausklappen" : "Menü einklappen"}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </aside>

      {/* Mobile top bar — brand + actions only; no cramped multi-link row */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-800 md:hidden">
        <button
          type="button"
          className="shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          onClick={() => setMobileOpen(true)}
          aria-label="Menü öffnen"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link href="/dashboard" className="min-w-0 flex-1 overflow-x-auto">
          <AppLogo size="sm" />
        </Link>
        {showAdminChrome && (
          <Link
            href="/admin"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#1A3FA8] px-2.5 py-1.5 text-xs font-semibold text-white whitespace-nowrap"
            title="Admin-Zentrale"
            aria-label="Admin-Zentrale"
          >
            <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Admin-Zentrale
          </Link>
        )}
        {showAdminChrome && (
          <div className="shrink-0">
            <AdminNotificationBell />
          </div>
        )}
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Menü schließen"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(100vw-3rem,20rem)] flex-col bg-white shadow-xl dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Menü
              </span>
              <button
                type="button"
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => setMobileOpen(false)}
                aria-label="Menü schließen"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarBody onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Spacer so main content clears fixed sidebar */}
      <div
        className={cn(
          "hidden md:block shrink-0 transition-[width] duration-200",
          collapsed ? "w-[4.5rem]" : "w-64"
        )}
        aria-hidden
      />
    </>
  );
}
