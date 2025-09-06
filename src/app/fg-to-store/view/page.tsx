"use client";
import React, { useEffect, useState } from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import ViewFGToStore from "@/components/FgToStore/view";
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
        <ViewFGToStore />
      {/* {userDetails?.userType?.toLowerCase() === "Production Manager".toLowerCase() ? (
        <ProductionProcess />
      ) : (
        <View />
      )} */}
    </DefaultLayout>
  );
};

export default ViewProcess;
