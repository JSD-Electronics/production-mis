import React from "react";
import ViewProcessComponent from "@/components/ProductionManager/Process";
import { Metadata } from "next";

import DefaultLayout from "@/components/Layouts/DefaultLayout";

const ViewProcess = () => {
  return (
    <DefaultLayout>
      <ViewProcessComponent />
    </DefaultLayout>
  );
};

export default ViewProcess;
