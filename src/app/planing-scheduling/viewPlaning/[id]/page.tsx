import React from "react";
import ViewPlanSchedule from "@/components/PlaningScheduling/viewPlaning";
import { Metadata } from "next";

import DefaultLayout from "@/components/Layouts/DefaultLayout";
import "../../planing-scheduling.module.css";

const AddPlaningScheduling = () => {
  return (
    <DefaultLayout>
      <ViewPlanSchedule />
    </DefaultLayout>
  );
};

export default AddPlaningScheduling;
