"use client";
import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { normalizeUserType, readStoredUserDetails } from "@/lib/portalAccessCache";

const DashboardLoader = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-28 rounded-xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark" />
      ))}
    </div>
    <div className="h-80 rounded-xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark" />
  </div>
);

const AdminDashboard = dynamic(() => import("./AdminDashboard"), {
  ssr: false,
  loading: () => <DashboardLoader />,
});
const OperatorDashboard = dynamic(() => import("./OperatorDashboard"), {
  ssr: false,
  loading: () => <DashboardLoader />,
});
const ManagerDashboard = dynamic(() => import("./ManagerDashboard"), {
  ssr: false,
  loading: () => <DashboardLoader />,
});
const QCDashboard = dynamic(() => import("./QCDashboard"), {
  ssr: false,
  loading: () => <DashboardLoader />,
});
const StoreDashboard = dynamic(() => import("./StoreDashboard"), {
  ssr: false,
  loading: () => <DashboardLoader />,
});
const DefaultDashboard = dynamic(() => import("./E-commerce"), {
  ssr: false,
  loading: () => <DashboardLoader />,
});

const DashboardSwitcher = () => {
  const userType = useMemo(() => {
    const user = readStoredUserDetails();
    return normalizeUserType(user?.userType || "");
  }, []);

  if (!userType) {
    return <DashboardLoader />;
  }

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