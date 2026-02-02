import React from "react";
import RemainingKitComponent from "@/components/ProductionManager/remainingKits/index";
import { Metadata } from "next";

import DefaultLayout from "@/components/Layouts/DefaultLayout";

const ViewProcess = () => {
  return (
    <DefaultLayout>
      <RemainingKitComponent />
    </DefaultLayout>
  );
};

export default ViewProcess;
