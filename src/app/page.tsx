"use client"; // Necessary for state management and client-side logic
import { useEffect, useState } from "react";
import ECommerce from "@/components/Login/Login";
import Dashboard from "@/components/Dashboard/E-commerce";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { verifyTokenClientSide } from "@/middleware/verifytoken";
const jwt = require("jsonwebtoken");
import { useRouter } from "next/navigation";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [getToken, setToken] = useState("");
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("token");
    checkTokenExpiry(token);
  }, []);
  const checkTokenExpiry = (token: any) => {
    const decoded = verifyTokenClientSide();
    if (decoded) {
      router.push("/");
    } else {
      const user = localStorage.getItem("userDetails");
      if (user) {
        setIsLoggedIn(true);
      }
    }
  };
  return (
    <>
      {isLoggedIn ? (
        <DefaultLayout>
          <Dashboard />
          {/* <ECommerce /> */}
        </DefaultLayout>
      ) : (
        <ECommerce />
      )}
    </>
  );
}
