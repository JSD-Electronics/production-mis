import React, { useState } from "react";
import AddPlaningSchedulingComponent from "@/components/PlaningScheduling/add/page";
import { Metadata } from "next";

import DefaultLayout from "@/components/Layouts/DefaultLayout";
import "../../planing-scheduling.module.css";

const AddPlaningScheduling = () => {

  return (
    <DefaultLayout>
      <AddPlaningSchedulingComponent/>
    </DefaultLayout>
  );
};

export default AddPlaningScheduling;
