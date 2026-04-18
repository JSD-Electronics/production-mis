import ProcessDetails from "@/components/Process/details";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Process Monitor | Production MIS",
  description: "Monitor live production metrics and stage-wise progress for a specific process.",
};

const ProcessMonitorPage = () => {
  return (
    <DefaultLayout>
      <ProcessDetails />
    </DefaultLayout>
  );
};

export default ProcessMonitorPage;
