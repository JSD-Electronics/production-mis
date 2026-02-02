"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { login } from "../../lib/api";
import {
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  BarChart3,
  Boxes,
  Layers,
  Sparkles,
  Cpu,
  X,
  Send,
} from "lucide-react";

const SignIn = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen" style={{ overflow: "hidden" }}>
      <div className="mx-auto grid md:grid-cols-2">
        <div className="h-screen bg-blue-50 p-8 shadow-xl backdrop-blur-sm dark:bg-blue-50">
          <div className="mt-15 mx-auto w-100">
            <div className="mb-6 mt-7">
              <h1 className="text-gray-900 text-center text-2xl font-semibold">
                Sign in
              </h1>
              <p className="text-gray-500 mt-1 text-center text-sm">
                Use your work email and password
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-gray-700 mb-2 block text-sm font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                    size={18}
                  />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="border-gray-300 text-gray-900 w-full rounded-lg border bg-white px-10 py-2.5 text-sm outline-none ring-0 transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-gray-700 mb-2 block text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                    size={18}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="border-gray-300 text-gray-900 w-full rounded-lg border bg-white px-10 py-2.5 text-sm outline-none ring-0 transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-gray-500 hover:text-gray-700 absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 transition"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="bg-red-50 text-red-600 flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <label className="text-gray-600 flex items-center gap-2">
                  <input type="checkbox" className="border-gray-300 rounded" />
                  Keep me signed in
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(true);
                    setForgotMessage(null);
                    setForgotSending(false);
                  }}
                  className="text-blue-600 transition hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-black  to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
            <div className="text-gray-400 mt-6 text-center text-xs">
              Â© {new Date().getFullYear()} Production Portal
            </div>
          </div>
        </div>
        <div className="relative bg-gradient-to-br from-black to-indigo-700 p-8 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <Image
              src="/images/icon/production-icon-dark.svg"
              alt="Production"
              width={44}
              height={44}
              priority
              className="brightness-0 invert"
            />
            <div>
              <p className="text-sm opacity-90">Welcome to</p>
              <h2 className="text-2xl font-semibold tracking-tight">
                Production Portal
              </h2>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <p className="text-sm opacity-90">
              Streamline testing, packaging, and scheduling in one place.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                <span className="text-sm">Secure access</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                <BarChart3 className="h-5 w-5 text-yellow-200" />
                <span className="text-sm">Real-time metrics</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                <Cpu className="h-5 w-5 text-cyan-200" />
                <span className="text-sm">Device testing</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                <Boxes className="h-5 w-5 text-pink-200" />
                <span className="text-sm">Packaging</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                <Layers className="h-5 w-5 text-indigo-200" />
                <span className="text-sm">Workflow orchestration</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                <Sparkles className="h-5 w-5 text-violet-200" />
                <span className="text-sm">Optimized UX</span>
              </div>
            </div>
          </div>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 opacity-20"
            viewBox="0 0 200 200"
          >
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#dbeafe" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="90" fill="url(#grad)" />
          </svg>
          <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-xl" />
        </div>
      </div>
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowForgot(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="rounded p-1 text-gray-600 hover:text-gray-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Enter your email address to receive a password reset link.
            </p>
            <div className="mb-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-gray-300 bg-white px-10 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>
            </div>
            {forgotMessage && (
              <div className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                {forgotMessage}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setShowForgot(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={forgotSending || !forgotEmail}
                className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                onClick={async () => {
                  setForgotSending(true);
                  setTimeout(() => {
                    setForgotSending(false);
                    setForgotMessage("If an account exists for this email, a reset link has been sent.");
                  }, 800);
                }}
              >
                <Send className="h-4 w-4" />
                {forgotSending ? "Sending..." : "Send reset link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignIn;
