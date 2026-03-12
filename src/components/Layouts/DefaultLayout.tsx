"use client";
import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />

      {/* Content Area — shifts right based on sidebar state */}
      <div
        className={`flex flex-1 min-w-0 flex-col transition-all duration-300 ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-72"
          }`}
      >
        {/* Header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Main Content */}
        <main className="flex-1 min-h-0 overflow-auto px-4 py-4 sm:px-4 lg:px-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
