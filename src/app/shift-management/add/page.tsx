import React from "react";
import AddShiftManagementComponent from "@/components/ShiftManagement/add";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";


const AddShiftManagement = () => {
  return (
    <DefaultLayout>
      <AddShiftManagementComponent />
    </DefaultLayout>
  );
};

export default AddShiftManagement;
