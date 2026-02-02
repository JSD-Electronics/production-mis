import React from "react";
import ViewPlaningSchedulingComponent from "@/components/PlaningScheduling/view";
import { Metadata } from "next";

import DefaultLayout from "@/components/Layouts/DefaultLayout";
import "../planing-scheduling.module.css";

const AddPlaningScheduling = () => {
  return (
    <DefaultLayout>
      <ViewPlaningSchedulingComponent />
    </DefaultLayout>
  );
};

export default AddPlaningScheduling;
