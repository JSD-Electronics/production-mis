"use client";
import React, { useEffect, useState } from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import ReturnedKitsComponent from "@/components/Store/ReturnedKits/page";

const ViewProcess = () => {
  const [userDetails, setUserDetails] = useState({});
  useEffect(() => {
    const storedData = localStorage.getItem("userDetails");
    const userInfo = storedData ? JSON.parse(storedData) : {};
    setUserDetails(userInfo);
  }, []);
  return (
    <DefaultLayout>
        <ReturnedKitsComponent />
    </DefaultLayout>
  );
};

export default ViewProcess;
