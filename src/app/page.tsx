"use client";
import { useEffect, useState } from "react";
import ECommerce from "@/components/Login/Login";
import DashboardSwitcher from "@/components/Dashboard/DashboardSwitcher";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useRouter } from "next/navigation";

const PortalLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="w-full max-w-md animate-pulse space-y-4 rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="h-6 w-40 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-12 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-12 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-10 w-32 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  </div>
);

export default function Home() {
  const [authState, setAuthState] = useState<"checking" | "logged_in" | "logged_out">("checking");
  const router = useRouter();

  useEffect(() => {
    const isTokenExpired = (token: string | null) => {
      try {
        if (!token) return true;
        const payload = token.split(".")[1];
        if (!payload) return true;
        const decoded = JSON.parse(window.atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
        const currentTime = Math.floor(Date.now() / 1000);
        return !!decoded?.exp && decoded.exp < currentTime;
      } catch {
        return true;
      }
    };

    const user = localStorage.getItem("userDetails");
    const token = localStorage.getItem("token");
    const expired = isTokenExpired(token);

    if (user && token && !expired) {
      setAuthState("logged_in");
      return;
    }

    if (token && expired) {
      router.replace("/auth/signin");
    }
    setAuthState("logged_out");
  }, [router]);

  if (authState === "checking") {
    return <PortalLoader />;
  }

  return authState === "logged_in" ? (
    <DefaultLayout>
      <DashboardSwitcher />
    </DefaultLayout>
  ) : (
    <ECommerce />
  );
}