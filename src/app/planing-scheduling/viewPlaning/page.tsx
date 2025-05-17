import React from "react";
import ViewPlaningComponent from "@/components/PlaningScheduling/viewPlaning/index";
import { Metadata } from "next";

import DefaultLayout from "@/components/Layouts/DefaultLayout";
import "../planing-scheduling.module.css";

const AddPlaningScheduling = () => {
  return (
    <DefaultLayout>
      <ViewPlaningComponent />
    </DefaultLayout>
  );
};

export default AddPlaningScheduling;
