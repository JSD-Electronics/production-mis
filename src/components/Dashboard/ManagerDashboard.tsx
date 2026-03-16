"use client";
import React, { useEffect, useState } from "react";
import CardDataStats from "../CardDataStats";
import { Activity, Calendar, ClipboardList } from "lucide-react";
import { viewProcess, viewPlaning, getProcessCompletionAnalytics, getDeviceTestTrends } from "@/lib/api";
import ChartOne from "@/components/Charts/ChartOne";

const ManagerDashboard = () => {
  const [stats, setStats] = useState({
    activeProcesses: 0,
    pendingPlans: 0,
    totalQuantity: 0,
  });
  const [completionRate, setCompletionRate] = useState(0);
  const [dailyYield, setDailyYield] = useState<{ categories: string[]; series: any[] }>({
    categories: [],
    series: [],
  });

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        const [resProcesses, resPlans, completion, trends] = await Promise.all([
          viewProcess(),
          viewPlaning(),
          getProcessCompletionAnalytics({ days: 14 }),
          getDeviceTestTrends({ days: 14, interval: "day" }),
        ]);

        const processes = resProcesses?.Processes || [];
        const totalQty = processes.reduce((acc: number, p: any) => acc + (parseInt(p.quantity) || 0), 0);

        setStats({
          activeProcesses: processes.filter((p: any) => p.status === "active").length,
          pendingPlans: resPlans?.Planing?.length || 0,
          totalQuantity: totalQty,
        });

        setCompletionRate(completion?.overall?.rate || 0);
        setDailyYield({
          categories: trends?.categories || [],
          series: trends?.series || [],
        });
      } catch (e) {
        console.error("Error fetching manager dashboard data:", e);
      }
    };
    fetchManagerData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <CardDataStats title="Active Processes" total={String(stats.activeProcesses)} rate="">
          <Activity className="text-amber-500" size={22} />
        </CardDataStats>
        <CardDataStats title="Scheduled Plans" total={String(stats.pendingPlans)} rate="">
          <Calendar className="text-primary" size={22} />
        </CardDataStats>
        <CardDataStats title="Total Plan Qty" total={String(stats.totalQuantity)} rate="">
          <ClipboardList className="text-green-600" size={22} />
        </CardDataStats>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="col-span-12 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-1">
          <h4 className="text-lg font-semibold text-black dark:text-white">Production Completion Rate</h4>
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Overall</span>
              <span className="font-semibold text-gray-700">{completionRate.toFixed(1)}%</span>
            </div>
            <div className="mt-2 h-3 w-full rounded-full bg-gray-100">
              <div
                className="h-3 rounded-full bg-emerald-500"
                style={{ width: `${Math.min(completionRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
        <ChartOne
          title="Daily Yield Trend"
          subtitle="Pass vs NG (last 14 days)"
          categories={dailyYield.categories}
          series={dailyYield.series}
          height={320}
          colors={["#22c55e", "#ef4444"]}
        />
      </div>
    </div>
  );
};

export default ManagerDashboard;
