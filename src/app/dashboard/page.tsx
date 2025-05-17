"use client";
import React, { useEffect, useState } from "react";
import Dashboard from "@/components/Dashboard/E-commerce";
import OperatorDashboard from "@/components/Dashboard/Operator/Dashboard";
import StoreDashboard from "@/components/Dashboard/Store/Dashboard";
import ProductionManagerDashboard from "@/components/Dashboard/ProductionManager/Dashboard";
import QualityControlDashboard from "@/components/Dashboard/QualityControl/Dashboard";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

const DashboardPage: React.FC = () => {
  const [userDetails, setUserDetails] = useState({});

  useEffect(() => {
    const DashboardPage: React.FC = () => {
      const [userDetails, setUserDetails] = useState({});

      useEffect(() => {
        const storedData = localStorage.getItem("userDetails");
        const userInfo = storedData ? JSON.parse(storedData) : {};
        setUserDetails(userInfo);
      }, []);

      const renderDashboard = () => {
        if (
          userDetails &&
          typeof userDetails === "object" &&
          "userType" in userDetails &&
          userDetails.userType === "admin"
        ) {
          return <Dashboard />;
        } else if (userDetails?.userType === "operator") {
          return <OperatorDashboard />;
        } else if (userDetails?.userType === "store") {
          return <StoreDashboard />;
        } else if (userDetails?.userType === "Production Manager") {
          return <ProductionManagerDashboard />;
        } else if (userDetails?.userType === "QC") {
          return <QualityControlDashboard />;
        }
      };

      return <DefaultLayout>{renderDashboard()}</DefaultLayout>;
    };
    let storedData = localStorage.getItem("userDetails");
    let userInfo = storedData ? JSON.parse(storedData) : {};
    setUserDetails(userInfo);
  }, []);
  return (
    <DefaultLayout>
      {userDetails && typeof userDetails === "object" && "userType" in userDetails ? (
        userDetails.userType === "admin" ? (
          <Dashboard />
        ) : userDetails.userType === "Operator" ? (
          <OperatorDashboard />
        ) : userDetails.userType === "store" ? (
          <StoreDashboard />
        ) : userDetails.userType === "Production Manager" ? (
          <ProductionManagerDashboard />
        ) : userDetails.userType === "QC" ?(
          <QualityControlDashboard />
        ): (
          <Dashboard />
        )
      ) : (
        <Dashboard />
      )}
      {/* {userDetails && typeof userDetails === 'object' && 'userType' in userDetails && userDetails.userType === "admin" ? (
        <Dashboard />
      ) : (
        <OperatorDashboard />
      )} */}
    </DefaultLayout>
  );
};

export default DashboardPage;
