"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import { useI18n } from "@/lib/i18n/provider";
import {
  getRememberedEmail,
  saveRememberMePreference,
} from "@/lib/auth/remember-me";

const PENDING_TOKEN_KEY = "taxdoc_2fa_pending_token";

export default function VerifyTwoFactorPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem(PENDING_TOKEN_KEY);
    if (!token) {
      router.replace("/auth/login");
      return;
    }
    setPendingToken(token);
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pendingToken) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pendingToken,
          code: code.replace(/\s/g, ""),
          useBackupCode,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || t("twoFactor.verifyFailed"));
        setIsLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        twoFactorToken: data.loginToken,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      sessionStorage.removeItem(PENDING_TOKEN_KEY);
      const rememberedEmail = getRememberedEmail();
      if (rememberedEmail) {
        saveRememberMePreference(rememberedEmail, true);
      }
      toast.success(t("twoFactor.verifySuccess"));
      window.location.assign("/dashboard");
    } catch {
      toast.error(t("twoFactor.verifyFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    sessionStorage.removeItem(PENDING_TOKEN_KEY);
    router.push("/auth/login");
  };

  if (!pendingToken) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Shield className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t("twoFactor.verifyTitle")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t("twoFactor.verifySubtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {useBackupCode ? t("twoFactor.backupCodeLabel") : t("twoFactor.codeLabel")}
              </label>
              <Input
                id="code"
                name="code"
                type="text"
                inputMode={useBackupCode ? "text" : "numeric"}
                autoComplete="one-time-code"
                placeholder={useBackupCode ? "ABCD-1234" : "000000"}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
                disabled={isLoading}
                leftIcon={<KeyRound className="w-5 h-5" />}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={useBackupCode}
                onChange={(event) => {
                  setUseBackupCode(event.target.checked);
                  setCode("");
                }}
                className="w-4 h-4"
              />
              {t("twoFactor.useBackupCode")}
            </label>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              {t("twoFactor.verifyButton")}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {t("twoFactor.backToLogin")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export { PENDING_TOKEN_KEY };
