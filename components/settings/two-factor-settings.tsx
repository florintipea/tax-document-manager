"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Shield, Copy, Download, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useI18n } from "@/lib/i18n/provider";

type SetupStep = "idle" | "setup" | "backup" | "disable";

interface TwoFactorSettingsProps {
  initialEnabled: boolean;
}

export function TwoFactorSettings({ initialEnabled }: TwoFactorSettingsProps) {
  const { t } = useI18n();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [step, setStep] = useState<SetupStep>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [manualSecret, setManualSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  const startSetup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t("twoFactor.setupFailed"));
      }
      setQrCodeDataUrl(data.qrCodeDataUrl);
      setManualSecret(data.manualEntryKey);
      setVerificationCode("");
      setStep("setup");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("twoFactor.setupFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const enableTwoFactor = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode.replace(/\s/g, "") }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t("twoFactor.enableFailed"));
      }
      setBackupCodes(data.backupCodes || []);
      setEnabled(true);
      setStep("backup");
      toast.success(t("twoFactor.enabledSuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("twoFactor.enableFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: disablePassword,
          code: disableCode.replace(/\s/g, ""),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t("twoFactor.disableFailed"));
      }
      setEnabled(false);
      setStep("idle");
      setDisablePassword("");
      setDisableCode("");
      toast.success(t("twoFactor.disabledSuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("twoFactor.disableFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateBackupCodes = async () => {
    const code = window.prompt(t("twoFactor.regeneratePrompt"));
    if (!code) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/backup-codes/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.replace(/\s/g, "") }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t("twoFactor.regenerateFailed"));
      }
      setBackupCodes(data.backupCodes || []);
      setStep("backup");
      toast.success(t("twoFactor.regenerateSuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("twoFactor.regenerateFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = async () => {
    await navigator.clipboard.writeText(manualSecret);
    toast.success(t("twoFactor.secretCopied"));
  };

  const downloadBackupCodes = () => {
    const content = [
      t("twoFactor.backupCodesTitle"),
      "",
      ...backupCodes.map((code, index) => `${index + 1}. ${code}`),
      "",
      t("twoFactor.backupCodesWarning"),
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "taxdoc-backup-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t("settings.twoFactor")}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t("twoFactor.description")}
          </p>
          <p className="text-sm mt-2">
            <span className="font-medium">{t("twoFactor.status")}: </span>
            <span className={enabled ? "text-green-600" : "text-gray-500"}>
              {enabled ? t("twoFactor.enabled") : t("twoFactor.disabled")}
            </span>
          </p>
        </div>
      </div>

      {!enabled && step === "idle" && (
        <Button variant="primary" onClick={startSetup} isLoading={isLoading}>
          {t("settings.enable2FA")}
        </Button>
      )}

      {step === "setup" && (
        <div className="space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("twoFactor.scanQr")}
          </p>
          {qrCodeDataUrl && (
            <div className="flex justify-center">
              <img
                src={qrCodeDataUrl}
                alt={t("twoFactor.qrAlt")}
                className="h-48 w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white p-2"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("twoFactor.manualEntry")}
            </label>
            <div className="flex gap-2">
              <Input value={manualSecret} readOnly className="font-mono text-sm" />
              <Button type="button" variant="outline" onClick={copySecret}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("twoFactor.codeLabel")}
            </label>
            <Input
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="primary" onClick={enableTwoFactor} isLoading={isLoading}>
              {t("twoFactor.confirmEnable")}
            </Button>
            <Button variant="outline" onClick={() => setStep("idle")} disabled={isLoading}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      )}

      {step === "backup" && backupCodes.length > 0 && (
        <div className="space-y-4 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            {t("twoFactor.backupCodesWarning")}
          </p>
          <div className="grid grid-cols-2 gap-2 font-mono text-sm">
            {backupCodes.map((code) => (
              <div
                key={code}
                className="rounded bg-white dark:bg-gray-800 px-3 py-2 text-center"
              >
                {code}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={downloadBackupCodes} leftIcon={<Download className="w-4 h-4" />}>
              {t("twoFactor.downloadBackupCodes")}
            </Button>
            <Button variant="primary" onClick={() => setStep("idle")}>
              {t("twoFactor.done")}
            </Button>
          </div>
        </div>
      )}

      {enabled && step !== "setup" && step !== "backup" && (
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={regenerateBackupCodes}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            {t("twoFactor.regenerateBackupCodes")}
          </Button>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              {t("twoFactor.disableTitle")}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("twoFactor.disableHelp")}
            </p>
            <PasswordInput
              value={disablePassword}
              onChange={(event) => setDisablePassword(event.target.value)}
              placeholder={t("twoFactor.currentPassword")}
              autoComplete="current-password"
            />
            <Input
              value={disableCode}
              onChange={(event) => setDisableCode(event.target.value)}
              placeholder={t("twoFactor.codeLabel")}
              inputMode="numeric"
            />
            <Button
              variant="outline"
              onClick={disableTwoFactor}
              isLoading={isLoading}
              className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {t("twoFactor.disableButton")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
