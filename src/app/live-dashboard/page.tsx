
"use client";
import React, { useState } from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import LiveDashboard from "@/components/LiveDashboard";

export default function LiveDashboardPage() {
  const [isFullScreen, setIsFullScreen] = useState(false);

  return (
    <DefaultLayout hideChrome={isFullScreen}>
      <LiveDashboard
        isFullScreen={isFullScreen}
        onToggleFullScreen={() => setIsFullScreen((prev) => !prev)}
      />
    </DefaultLayout>
  );
}
