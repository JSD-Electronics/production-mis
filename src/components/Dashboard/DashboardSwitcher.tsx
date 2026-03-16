"use client";
import React, { useEffect, useState } from "react";
import AdminDashboard from "./AdminDashboard";
import OperatorDashboard from "./OperatorDashboard";
import ManagerDashboard from "./ManagerDashboard";
import QCDashboard from "./QCDashboard";
import StoreDashboard from "./StoreDashboard";
import DefaultDashboard from "./E-commerce"; // Fallback to current e-commerce view

const DashboardSwitcher = () => {
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("userDetails");
    if (raw) {
      try {
        const user = JSON.parse(raw);
        // Normalize: lowercase, replace spaces/hyphens with underscores
        const role = (user.userType || "").toLowerCase().trim().replace(/[\s-]+/g, "_");
        setUserType(role);
      } catch (e) {
        console.error("Error parsing userDetails:", e);
      }
    }
  }, []);

  if (userType === null) return null;

  switch (userType) {
    case "admin":
      return <AdminDashboard />;
    case "operator":
    case "assembly":
    case "production":
      return <OperatorDashboard />;
    case "production_manager":
    case "manager":
      return <ManagerDashboard />;
    case "quality_control":
    case "qc":
    case "trc":
      return <QCDashboard />;
    case "store":
    case "inventory":
    case "warehouse":
      return <StoreDashboard />;
    default:
      return <DefaultDashboard />;
  }
};

export default DashboardSwitcher;
