"use client";
import { useEffect, useState } from "react";
import ECommerce from "@/components/Login/Login";
import DashboardSwitcher from "@/components/Dashboard/DashboardSwitcher";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const user = localStorage.getItem("userDetails");
    const token = localStorage.getItem("token");
    const expired = isTokenExpired(token);
    if (user && token && !expired) {
      setIsLoggedIn(true);
    }
  }, []);
  const isTokenExpired = (token: string | null) => {
    try {
      if (!token) {
        return true;
      }
      const payload = token.split(".")[1];
      if (!payload) {
        return true;
      }
      const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded?.exp && decoded.exp < currentTime) {
        router.push("/auth/signin");
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true; // Return true in case of error, treating it as expired
    }
  };
  return (
    <>
      {isLoggedIn ? (
        <DefaultLayout>
            <DashboardSwitcher />
        </DefaultLayout>
      ) : (
        <ECommerce />
      )}
    </>
  );
}
