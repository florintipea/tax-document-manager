"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Bot, User, Sparkles, AlertTriangle, Settings, Info } from "lucide-react";
import toast from "react-hot-toast";
import { useI18n } from "@/lib/i18n/provider";
import type { AIResponse } from "@/lib/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  provider?: string;
  confidence?: number;
}

interface ChatErrorBody {
  error?: string;
  code?: string;
}

interface AIStatusResponse {
  configured: boolean;
  userConfigured: boolean;
  serverConfigured: boolean;
  providers: string[];
  source: "user" | "server" | "none";
  userProviders: Array<{
    provider: string;
    connected: boolean;
    keyPreview: string | null;
  }>;
}

function getChatErrorMessage(
  status: number,
  body: ChatErrorBody | null,
  t: (key: string) => string
): string {
  if (body?.code === "AI_NOT_CONFIGURED") {
    return t("aiAssistant.notConfiguredUserMessage");
  }
  if (body?.code === "AI_NOT_INCLUDED") {
    return t("aiAssistant.errorNotIncluded");
  }
  if (body?.code === "AI_LIMIT") {
    return t("aiAssistant.errorLimit");
  }
  if (body?.code === "AI_KEY_UNREADABLE") {
    return t("aiAssistant.errorKeyUnreadable");
  }
  if (status === 401) {
    return t("aiAssistant.errorUnauthorized");
  }
  if (status === 429) {
    return t("aiAssistant.errorRateLimit");
  }
  if (body?.error?.trim()) {
    return body.error;
  }
  return t("aiAssistant.errorGeneric");
}

export default function AIAssistantPage() {
  const { status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionKeys = [
    "aiAssistant.suggestionWerbungskosten",
    "aiAssistant.suggestionDeadline",
    "aiAssistant.suggestionDocuments",
    "aiAssistant.suggestionProfile",
  ] as const;

  const { data: aiStatus, isPending: isAiStatusLoading } = useQuery({
    queryKey: ["ai-status"],
    queryFn: async () => {
      const response = await fetch("/api/ai/status");
      if (!response.ok) {
        return {
          configured: false,
          userConfigured: false,
          serverConfigured: false,
          providers: [],
          source: "none" as const,
          userProviders: [],
        };
      }
      return response.json() as Promise<AIStatusResponse>;
    },
    enabled: status === "authenticated",
    staleTime: 60_000,
  });

  const aiConfigured = aiStatus?.configured === true;
  const activeProviders = aiStatus?.providers ?? [];
  const sourceLabel =
    aiStatus?.source === "user"
      ? t("aiAssistant.usingYourProviders")
      : aiStatus?.source === "server"
        ? t("aiAssistant.usingServerProviders")
        : null;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: t("aiAssistant.welcome"),
          timestamp: new Date(),
        },
      ]);
    }
  }, [status, messages.length, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      let body: ChatErrorBody | null = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }

      if (!response.ok) {
        throw new Error(getChatErrorMessage(response.status, body, t));
      }

      return body as AIResponse;
    },
    onSuccess: (data: AIResponse) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        provider: data.provider,
        confidence: data.confidence,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setIsLoading(false);
    },
  });

  const sendMessage = (messageToSend: string) => {
    const trimmed = messageToSend.trim();
    if (!trimmed || isLoading || isAiStatusLoading || !aiConfigured) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    chatMutation.mutate(trimmed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading variant="spinner" size="lg" text={t("aiAssistant.loading")} />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const showSuggestions =
    aiConfigured &&
    messages.length <= 1 &&
    !isLoading;

  return (
    <AuthenticatedLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 flex flex-col">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
          <div className="container mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t("aiAssistant.title")}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("aiAssistant.subtitle")}
                </p>
                {aiConfigured && activeProviders.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {sourceLabel}: {activeProviders.join(", ")}
                  </p>
                )}
              </div>
            </div>
            <Link href="/settings/ai">
              <Button variant="outline" size="sm" leftIcon={<Settings className="w-4 h-4" />}>
                {t("aiAssistant.manageProviders")}
              </Button>
            </Link>
          </div>
        </div>

        <div className="px-4 pt-4">
          <div className="container mx-auto max-w-3xl rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 p-3">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {t("aiAssistant.disclaimerTitle")}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {t("aiAssistant.disclaimerBody")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {!isAiStatusLoading && !aiConfigured && (
          <div className="px-4 pt-4">
            <div className="container mx-auto max-w-3xl rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                    {t("aiAssistant.notConfiguredTitle")}
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                    {t("aiAssistant.notConfiguredUserMessage")}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                    {t("aiAssistant.notConfiguredHint")}
                  </p>
                  <Link href="/settings/ai" className="inline-block mt-3">
                    <Button variant="primary" size="sm" leftIcon={<Settings className="w-4 h-4" />}>
                      {t("aiAssistant.connectProviders")}
                    </Button>
                  </Link>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-3">
                    {t("aiAssistant.notConfiguredAdminHint")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="container mx-auto max-w-3xl space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                    <span>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {message.provider && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{message.provider}</span>
                      </>
                    )}
                    {message.confidence && (
                      <>
                        <span>•</span>
                        <span>{(message.confidence * 100).toFixed(0)}% confidence</span>
                      </>
                    )}
                  </div>
                </div>
                {message.role === "user" && (
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                )}
              </div>
            ))}

            {showSuggestions && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {t("aiAssistant.suggestions")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestionKeys.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => sendMessage(t(key))}
                      className="text-left text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      {t(key)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <Skeleton variant="text" width="200px" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-4">
          <div className="container mx-auto max-w-3xl">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("aiAssistant.placeholder")}
                disabled={isLoading || isAiStatusLoading || !aiConfigured}
                className="flex-1"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={!input.trim() || isLoading || isAiStatusLoading || !aiConfigured}
                isLoading={isLoading}
                leftIcon={<Send className="w-5 h-5" />}
              >
                {t("aiAssistant.send")}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
