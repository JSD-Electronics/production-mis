"use client";
import React from "react";
import DashboardSwitcher from "@/components/Dashboard/DashboardSwitcher";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

const DashboardPage: React.FC = () => {
  return (
    <DefaultLayout>
      <DashboardSwitcher />
    </DefaultLayout>
  );
};

export default DashboardPage;
