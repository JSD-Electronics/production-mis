import React from "react";
import ViewSchedulingComponent from "@/components/PlaningScheduling/viewScheduling/index";
import { Metadata } from "next";

import DefaultLayout from "@/components/Layouts/DefaultLayout";

const viewScheduling = () => {
  return (
    <DefaultLayout>
      <ViewSchedulingComponent />
    </DefaultLayout>
  );
};

export default viewScheduling;
