"use client";
import React, { useEffect, useState } from "react";
import CardDataStats from "../CardDataStats";
import { ClipboardList, AlertTriangle } from "lucide-react";
import { viewProcess, getNGDevicesByProcessId, getNGReasonDistribution, getDeviceTestTrends } from "@/lib/api";
import ChartOne from "@/components/Charts/ChartOne";
import ChartThree from "@/components/Charts/ChartThree";

const QCDashboard = () => {
  const [stats, setStats] = useState({
    pendingInspections: 0,
    ngDetectedToday: 0,
  });
  const [ngDistribution, setNgDistribution] = useState<{ labels: string[]; series: number[] }>({
    labels: [],
    series: [],
  });
  const [weeklyTrend, setWeeklyTrend] = useState<{ categories: string[]; series: any[] }>({
    categories: [],
    series: [],
  });

  useEffect(() => {
    const fetchQCData = async () => {
      try {
        const resProcesses = await viewProcess();
        const activeProcesses = resProcesses?.Processes?.filter(
          (p: any) => p.status === "active"
        ) || [];

        let totalNG = 0;
        for (const process of activeProcesses) {
          try {
            const resNG = await getNGDevicesByProcessId(process._id);
            totalNG += resNG?.data?.length || 0;
          } catch (err) {
            console.warn(`Could not fetch NG for process ${process._id}`);
          }
        }

        setStats({
          pendingInspections: activeProcesses.length,
          ngDetectedToday: totalNG,
        });

        const [dist, trend] = await Promise.all([
          getNGReasonDistribution({ days: 30 }),
          getDeviceTestTrends({ days: 7, interval: "day" }),
        ]);

        setNgDistribution({
          labels: dist?.labels || [],
          series: dist?.series || [],
        });

        setWeeklyTrend({
          categories: trend?.categories || [],
          series: trend?.series || [],
        });
      } catch (e) {
        console.error("Error fetching QC dashboard data:", e);
      }
    };

    fetchQCData();
    const interval = setInterval(fetchQCData, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <CardDataStats title="Active Processes" total={String(stats.pendingInspections)} rate="">
          <ClipboardList className="text-primary" size={22} />
        </CardDataStats>
        <CardDataStats title="NG Detected (Active)" total={String(stats.ngDetectedToday)} rate="">
          <AlertTriangle className="text-red-500" size={22} />
        </CardDataStats>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartThree
          title="NG Distribution by Stage"
          labels={ngDistribution.labels}
          series={ngDistribution.series}
          colors={["#ef4444", "#f97316", "#f59e0b", "#6366f1", "#06b6d4"]}
        />
        <ChartOne
          title="Weekly Error Trend"
          subtitle="Pass vs NG (last 7 days)"
          categories={weeklyTrend.categories}
          series={weeklyTrend.series}
          height={320}
          colors={["#22c55e", "#ef4444"]}
        />
      </div>
    </div>
  );
};

export default QCDashboard;
