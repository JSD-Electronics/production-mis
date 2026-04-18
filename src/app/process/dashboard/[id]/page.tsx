"use client";

import ProcessDetails from "@/components/Process/details";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

const ProcessDashboardPage = () => {
    return (
        <DefaultLayout>
            <ProcessDetails readOnly={true} />
        </DefaultLayout>
    );
};

export default ProcessDashboardPage;
