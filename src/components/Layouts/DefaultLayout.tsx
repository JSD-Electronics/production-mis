"use client";
import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function DefaultLayout({
  children,
  hideChrome = false,
}: {
  children: React.ReactNode;
  hideChrome?: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 flex min-h-screen overflow-hidden">
      {/* Sidebar */}
      {!hideChrome && (
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />
      )}

      {/* Content Area — shifts right based on sidebar state */}
      <div
        className={`flex flex-1 min-w-0 flex-col transition-all duration-300 ${hideChrome ? "" : sidebarCollapsed ? "lg:ml-16" : "lg:ml-72"
          }`}
      >
        {/* Header */}
        {!hideChrome && <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}

        {/* Main Content */}
        <main className={`flex-1 min-h-0 overflow-auto overflow-x-hidden ${hideChrome ? "px-2 py-2" : "px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6"}`}>
          <div className={`mx-auto w-full min-w-0 ${hideChrome ? "max-w-none" : "max-w-7xl"}`}>{children}</div>
        </main>
      </div>
    </div>
  );
}
