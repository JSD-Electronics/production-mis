import React from "react";
import FGInventoryView from "@/components/Inventory/fgToStore/index";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

export const metadata: Metadata = {
    title: "FG Inventory | Process Wise Finished Goods",
    description: "View produced devices ready for stock transfer per process.",
};

const ViewFGInventory = () => {
    return (
        <DefaultLayout>
            <FGInventoryView />
        </DefaultLayout>
    );
};

export default ViewFGInventory;
