"use client";
import React, { useEffect, useState } from "react";
import Dashboard from "@/components/Dashboard/E-commerce";
import OperatorDashboard from "@/components/Dashboard/Operator/Dashboard";
import StoreDashboard from "@/components/Dashboard/Store/Dashboard";
import ProductionManagerDashboard from "@/components/Dashboard/ProductionManager/Dashboard";
import QualityControlDashboard from "@/components/Dashboard/QualityControl/Dashboard";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

interface UserDetails {
  userType: "admin" | "operator" | "store" | "Production Manager" | "QC";
  // add other fields if needed
}

const DashboardPage: React.FC = () => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  useEffect(() => {
    const storedData = localStorage.getItem("userDetails");
    if (storedData) {
      try {
        const parsed: UserDetails = JSON.parse(storedData);
        setUserDetails(parsed);
      } catch (err) {
        console.error("Invalid userDetails in localStorage", err);
        setUserDetails(null);
      }
    }
  }, []);

  const renderDashboard = () => {
    switch (userDetails?.userType) {
      case "admin":
        return <Dashboard />;
      case "operator":
        return <OperatorDashboard />;
      case "store":
        return <StoreDashboard />;
      case "Production Manager":
        return <ProductionManagerDashboard />;
      case "QC":
        return <QualityControlDashboard />;
      default:
        return <Dashboard />; // fallback
    }
  };

  return <DefaultLayout>{renderDashboard()}</DefaultLayout>;
};

export default DashboardPage;
