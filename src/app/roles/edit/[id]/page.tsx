import React from "react";
import EditUserRoleComponent from "@/components/UserRoles/edit";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

export const metadata: Metadata = {
  title: "Next.js Form Elements | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Form Elements page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

const EditUserRolePage = () => {
  return (
    <DefaultLayout>
      <EditUserRoleComponent />
    </DefaultLayout>
  );
};

export default EditUserRolePage;
