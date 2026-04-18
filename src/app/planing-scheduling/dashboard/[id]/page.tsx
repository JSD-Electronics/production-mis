"use client";

import ViewPlanSchedule from "@/components/PlaningScheduling/viewPlaning";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useParams } from "next/navigation";

const PlanningDashboardPage = () => {
    const params = useParams();
    const id = params?.id as string;

    return (
        <DefaultLayout>
            <ViewPlanSchedule planingId={id} readOnly={true} />
        </DefaultLayout>
    );
};

export default PlanningDashboardPage;
