"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import toast from "react-hot-toast";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { CloudInstanceBanner } from "@/components/cloud/cloud-instance-banner";
import {
  getRememberedEmail,
  getRememberMePreference,
  saveRememberMePreference,
} from "@/lib/auth/remember-me";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const savedEmail = getRememberedEmail();
    const savedRemember = getRememberMePreference();
    if (savedEmail) {
      setFormData((current) => ({ ...current, email: savedEmail }));
    }
    setRememberMe(savedRemember);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const checkResponse = await fetch("/api/auth/login-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          remember: rememberMe,
        }),
      });

      const checkData = await checkResponse.json();
      if (!checkResponse.ok) {
        toast.error(checkData.error || "Invalid email or password");
        setIsLoading(false);
        return;
      }

      if (checkData.requiresTwoFactor) {
        saveRememberMePreference(formData.email, rememberMe);
        sessionStorage.setItem(
          "taxdoc_2fa_pending_token",
          checkData.pendingToken
        );
        window.location.assign("/auth/verify-2fa");
        return;
      }

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        remember: rememberMe ? "true" : "false",
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        saveRememberMePreference(formData.email, rememberMe);
        toast.success("Welcome back!");
        window.location.assign("/dashboard");
        return;
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <CloudInstanceBanner />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to your TaxDoc account
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            method="post"
            action="/api/auth/callback/credentials"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={isLoading}
                autoComplete="username"
                leftIcon={<Mail className="w-5 h-5" />}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Password
              </label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                disabled={isLoading}
                autoComplete="current-password"
                leftIcon={<Lock className="w-5 h-5" />}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  Remember me (keeps you signed in)
                </label>
              </div>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Forgot password?
              </Link>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              TaxDoc never stores your password. When you sign in, choose Save
              Password in your browser (Safari, Chrome, etc.) to fill it next time.
            </p>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
