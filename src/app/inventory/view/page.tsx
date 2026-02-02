import React from "react";
import InventoryManagement from "@/components/Inventory/view/index";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

export const metadata: Metadata = {
  title: "Next.js Form Elements | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Form Elements page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

const ViewJig = () => {
  return (
    <DefaultLayout>
      <InventoryManagement />
    </DefaultLayout>
  );
};

export default ViewJig;
