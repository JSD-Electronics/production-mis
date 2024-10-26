"use client";
import Dashboard from "@/components/Dashboard/E-commerce";
import { Metadata } from "next";
import withAuth from "@/app/auth/withAuth/withAuth";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import React from "react";


const DashboardPage: React.FC = () => {
  return (
    <DefaultLayout>
      <Dashboard />
    </DefaultLayout>
  );
};

export default withAuth(DashboardPage);
