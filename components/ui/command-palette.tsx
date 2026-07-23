"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Calculator, Settings, User, CreditCard } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  keywords: string[];
  category: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { t } = useI18n();

  const commands: Command[] = [
    {
      id: "search-documents",
      label: t("commandPalette.searchDocuments"),
      icon: <FileText className="w-4 h-4" />,
      action: () => {
        router.push("/documents?search=" + encodeURIComponent(query));
        setIsOpen(false);
      },
      keywords: ["documents", "files", "search"],
      category: t("commandPalette.categoryDocuments"),
    },
    {
      id: "tax-calculator",
      label: t("commandPalette.taxCalculator"),
      icon: <Calculator className="w-4 h-4" />,
      action: () => {
        router.push("/calculator");
        setIsOpen(false);
      },
      keywords: ["calculator", "tax", "calculate"],
      category: t("commandPalette.categoryTools"),
    },
    {
      id: "settings",
      label: t("commandPalette.settings"),
      icon: <Settings className="w-4 h-4" />,
      action: () => {
        router.push("/settings");
        setIsOpen(false);
      },
      keywords: ["settings", "preferences", "config"],
      category: t("commandPalette.categorySettings"),
    },
    {
      id: "billing",
      label: t("commandPalette.billing"),
      icon: <CreditCard className="w-4 h-4" />,
      action: () => {
        router.push("/settings/billing");
        setIsOpen(false);
      },
      keywords: ["billing", "subscription", "payment"],
      category: t("commandPalette.categorySettings"),
    },
    {
      id: "profile",
      label: t("commandPalette.profile"),
      icon: <User className="w-4 h-4" />,
      action: () => {
        router.push("/profile");
        setIsOpen(false);
      },
      keywords: ["profile", "account", "user"],
      category: t("commandPalette.categoryAccount"),
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (!query) return true;
    const lowerQuery = query.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(lowerQuery) ||
      cmd.keywords.some((kw) => kw.toLowerCase().includes(lowerQuery))
    );
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleCommand = useCallback((command: Command) => {
    command.action();
    setQuery("");
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={() => setIsOpen(false)}
      />

      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[20vh] px-2 sm:px-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("commandPalette.placeholder")}
                className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 min-w-0"
                autoFocus
              />
              <kbd className="hidden sm:inline px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                ESC
              </kbd>
            </div>

            <div className="max-h-[50vh] sm:max-h-96 overflow-y-auto">
              {filteredCommands.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <p>{t("commandPalette.noResults")}</p>
                  <p className="text-sm mt-2">{t("commandPalette.tryDifferent")}</p>
                </div>
              ) : (
                <div className="py-2">
                  {filteredCommands.map((command, index) => (
                    <button
                      key={command.id}
                      onClick={() => handleCommand(command)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                    >
                      <span className="text-gray-400">{command.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {command.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {command.category}
                        </div>
                      </div>
                      {index === 0 && (
                        <kbd className="hidden sm:inline px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                          ⏎
                        </kbd>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden sm:block px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                      ↑
                    </kbd>
                    <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                      ↓
                    </kbd>
                    <span>{t("commandPalette.navigate")}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                      ⏎
                    </kbd>
                    <span>{t("commandPalette.select")}</span>
                  </span>
                </div>
                <span>{t("commandPalette.openHint")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
