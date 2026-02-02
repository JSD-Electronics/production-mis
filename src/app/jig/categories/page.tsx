"use client";
import React from "react";
import JigList from "@/components/Jig/category/index";
import { Metadata } from "next";
import withAuth from "@/app/auth/withAuth/withAuth";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

const ViewJig : React.FC = () => {
  
  return (
    <DefaultLayout>
      <JigList />
    </DefaultLayout>
  );
};

export default withAuth(ViewJig);
