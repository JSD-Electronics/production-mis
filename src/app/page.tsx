"use client";  // Necessary for state management and client-side logic
import { useEffect, useState } from "react";
import ECommerce from "@/components/Login/Login";
import Dashboard from "@/components/Dashboard/E-commerce";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
const jwt = require('jsonwebtoken');
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [getToken,setToken] = useState("");
  const router = useRouter();
  useEffect(() => {
    alert("helllo");
    const user = localStorage.getItem("userDetails");
    const token = localStorage.getItem("token");
    checkTokenExpiry(token);
    if (user) {
      setIsLoggedIn(true);
    }
  }, []);
  const checkTokenExpiry = (token:any) => {
    try {
      const decoded = jwt.decode(token);
      const currentTime = Math.floor(Date.now() / 1000);
  
      if (decoded.exp && decoded.exp < currentTime) {
       router.push("/");
        return true; // Token is expired
      } else {
        console.log('Token is valid');
        return false; // Token is valid
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      return true; // Return true in case of error, treating it as expired
    }
  };
  return (
    <>
    {console.log("helllo", isLoggedIn)}
      {isLoggedIn ? (
        <DefaultLayout>
            <ECommerce />
        </DefaultLayout>
      ) : (
        <ECommerce />
      )}
    </>
  );
}
