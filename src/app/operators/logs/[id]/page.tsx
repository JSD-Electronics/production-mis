import React from "react";
import OperatorLogs from "@/components/Operators/logs";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

export const metadata: Metadata = {
    title: "Operator Logs | Productivity Tracking",
    description: "Detailed work and break logs for production operators.",
};

const OperatorLogsPage = () => {
    return (
        <DefaultLayout>
            <OperatorLogs />
        </DefaultLayout>
    );
};

export default OperatorLogsPage;
