"use client";
import React, { useEffect, useState } from "react";
import CardDataStats from "../CardDataStats";
import { Users, ClipboardList, Box } from "lucide-react";
import { getUsers, viewProcess, viewProduct, getUserRegistrationTrends, getDeviceTestTrends } from "@/lib/api";
import ChartOne from "@/components/Charts/ChartOne";
import ChartThree from "@/components/Charts/ChartThree";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeProcesses: 0,
    totalProducts: 0,
  });
  const [roleDistribution, setRoleDistribution] = useState<{ labels: string[]; series: number[] }>({
    labels: [],
    series: [],
  });
  const [systemTrend, setSystemTrend] = useState<{ categories: string[]; series: any[] }>({
    categories: [],
    series: [],
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [resUsers, resProcesses, resProducts] = await Promise.all([
          getUsers(),
          viewProcess(),
          viewProduct(),
        ]);

        setStats({
          totalUsers: resUsers?.users?.length || 0,
          activeProcesses: resProcesses?.Processes?.length || 0,
          totalProducts: resProducts?.Products?.length || 0,
        });
      } catch (e) {
        console.error("Error fetching admin dashboard data:", e);
      }
    };

    const fetchAnalytics = async () => {
      try {
        const [userTrend, deviceTrend] = await Promise.all([
          getUserRegistrationTrends({ days: 30 }),
          getDeviceTestTrends({ days: 14, interval: "day" }),
        ]);

        setRoleDistribution({
          labels: userTrend?.roleDistribution?.map((r: any) => r.role) || [],
          series: userTrend?.roleDistribution?.map((r: any) => r.count) || [],
        });

        setSystemTrend({
          categories: deviceTrend?.categories || [],
          series: deviceTrend?.series || [],
        });
      } catch (e) {
        console.error("Error fetching admin analytics:", e);
      }
    };

    fetchAdminData();
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <CardDataStats title="Total Users" total={String(stats.totalUsers)} rate="">
          <Users className="text-primary" size={22} />
        </CardDataStats>
        <CardDataStats title="Active Processes" total={String(stats.activeProcesses)} rate="">
          <ClipboardList className="text-amber-500" size={22} />
        </CardDataStats>
        <CardDataStats title="Total Products" total={String(stats.totalProducts)} rate="">
          <Box className="text-green-600" size={22} />
        </CardDataStats>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartOne
          title="System Activity Trend"
          subtitle="Pass vs NG (last 14 days)"
          categories={systemTrend.categories}
          series={systemTrend.series}
          height={320}
          colors={["#22c55e", "#ef4444"]}
        />
        <ChartThree
          title="User Role Distribution"
          labels={roleDistribution.labels}
          series={roleDistribution.series}
          colors={["#3b82f6", "#f59e0b", "#10b981", "#6366f1", "#ef4444"]}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
