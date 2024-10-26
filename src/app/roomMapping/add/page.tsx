import React from "react";
import View from "@/components/RoomMap/index";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

export const metadata: Metadata = {
  title: "Next.js Form Elements | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Form Elements page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

const AddStagePage = () => {
  return (
    <DefaultLayout>
      <View />
    </DefaultLayout>
  );
};

export default AddStagePage;