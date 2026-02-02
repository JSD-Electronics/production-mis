import React from "react";
import Process from "@/components/Process/add";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

export const metadata: Metadata = {
  title: "Next.js Form Elements | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Form Elements page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

const AddProcess = () => {
  return (
    <DefaultLayout>
      <Process />
    </DefaultLayout>
  );
};

export default AddProcess;
