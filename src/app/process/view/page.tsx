"use client";
import React, { useEffect, useState } from "react";
import View from "@/components/Process/view";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import ProductionProcess from "@/components/ProductionManager/Process/index";
import { userInfo } from "os";

const ViewProcess = () => {
  const [userDetails, setUserDetails] = useState({});
  useEffect(() => {
    const storedData = localStorage.getItem("userDetails");
    const userInfo = storedData ? JSON.parse(storedData) : {};
    setUserDetails(userInfo);
  }, []);
  return (
    <DefaultLayout>
      {userDetails?.userType?.toLowerCase() === "Production Manager".toLowerCase() ? (
        <ProductionProcess />
      ) : (
        <View />
      )}
    </DefaultLayout>
  );
};

export default ViewProcess;
