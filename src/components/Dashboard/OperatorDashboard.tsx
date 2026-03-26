"use client";
import React, { useEffect, useState } from "react";
import CardDataStats from "../CardDataStats";
import { Activity, CheckCircle, Clock } from "lucide-react";
import { getDeviceTestEntryByOperatorId, getActiveOperatorWorkSession, getDeviceTestTrends } from "@/lib/api";
import ChartTwo from "@/components/Charts/ChartTwo";
import { useManagedInterval } from "@/hooks/useManagedInterval";

const OperatorDashboard = () => {
  const [stats, setStats] = useState({
    processedToday: 0,
    efficiency: "0%",
    activeTime: "0h",
  });
  const [hourlyTrend, setHourlyTrend] = useState<{ categories: string[]; series: any[] }>({
    categories: [],
    series: [],
  });
  const [recentHistory, setRecentHistory] = useState<any[]>([]);

  const fetchOperatorData = React.useCallback(async () => {
    try {
      const raw = localStorage.getItem("userDetails");
      if (!raw) return;
      const user = JSON.parse(raw);
      const operatorId = user._id || user.id;

      const today = new Date().toISOString().split("T")[0];
      const resRecords = await getDeviceTestEntryByOperatorId(operatorId, today);
      const recordCount = resRecords?.data?.length || 0;
      setRecentHistory((resRecords?.data || []).slice(0, 8));

      const resSession = await getActiveOperatorWorkSession();
      const session = resSession?.session;
      let activeHours = "0h";
      if (session && session.startedAt) {
        const start = new Date(session.startedAt).getTime();
        const now = new Date().getTime();
        const diffMs = now - start;
        const hours = (diffMs / (1000 * 60 * 60)).toFixed(1);
        activeHours = `${hours}h`;
      }

      setStats({
        processedToday: recordCount,
        efficiency: recordCount > 0 ? "85%" : "0%",
        activeTime: activeHours,
      });

      const trend = await getDeviceTestTrends({
        interval: "hour",
        hours: 12,
        operatorId,
      });
      setHourlyTrend({
        categories: trend?.categories || [],
        series: trend?.series || [],
      });
    } catch (e) {
      console.error("Error fetching operator dashboard data:", e);
    }
  }, []);

  useEffect(() => {
    void fetchOperatorData();
  }, [fetchOperatorData]);

  useManagedInterval(
    () => {
      void fetchOperatorData();
    },
    60000,
    true,
    { pauseWhenHidden: true },
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <CardDataStats title="Processed Today" total={String(stats.processedToday)} rate="">
          <CheckCircle className="text-green-600" size={22} />
        </CardDataStats>
        <CardDataStats title="Efficiency" total={stats.efficiency} rate="">
          <Activity className="text-amber-500" size={22} />
        </CardDataStats>
        <CardDataStats title="Active Time" total={stats.activeTime} rate="">
          <Clock className="text-primary" size={22} />
        </CardDataStats>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartTwo
          title="Hourly Test Performance"
          categories={hourlyTrend.categories}
          series={hourlyTrend.series}
          stacked={false}
          height={320}
          colors={["#22c55e", "#ef4444"]}
        />
        <div className="col-span-12 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-lg font-semibold text-black dark:text-white">Recent Test History</h4>
          </div>
          <div className="table-responsive">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-700">
                  <th className="px-4 py-2">Serial</th>
                  <th className="px-4 py-2">Stage</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                      No recent tests found
                    </td>
                  </tr>
                ) : (
                  recentHistory.map((row: any, idx: number) => (
                    <tr key={row._id || idx} className="border-t">
                      <td className="px-4 py-2 font-mono text-xs">{row.serialNo || "-"}</td>
                      <td className="px-4 py-2">{row.stageName || "-"}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${String(row.status).toUpperCase() === "PASS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {row.status || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;
