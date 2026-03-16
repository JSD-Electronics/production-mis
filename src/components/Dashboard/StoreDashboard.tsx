"use client";
import React, { useEffect, useState } from "react";
import CardDataStats from "../CardDataStats";
import { Box, AlertCircle, ShoppingCart } from "lucide-react";
import { inventoryDashboard, getInventoryTrends } from "@/lib/api";
import ChartTwo from "@/components/Charts/ChartTwo";

const StoreDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<{ lowStockCount: number; items: any[] }>({
    lowStockCount: 0,
    items: [],
  });
  const [stockOverview, setStockOverview] = useState<{ categories: string[]; series: any[] }>({
    categories: [],
    series: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [res, trends] = await Promise.all([
          inventoryDashboard(),
          getInventoryTrends({ days: 14, threshold: 10 }),
        ]);
        setStats(res.inventoryDashboard);
        setAlerts(trends?.alerts || { lowStockCount: 0, items: [] });
        setStockOverview({
          categories: trends?.stockOverview?.categories || [],
          series: trends?.stockOverview?.series || [],
        });
      } catch (e) {
        console.error("Failed to fetch store stats:", e);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <CardDataStats title="Total Items" total={stats?.productCount || "0"} rate="">
          <Box className="text-primary" size={22} />
        </CardDataStats>
        <CardDataStats title="Inventory Accuracy" total={`${stats?.overallInventoryAccuracy || 0}%`} rate="">
          <ShoppingCart className="text-green-600" size={22} />
        </CardDataStats>
        <CardDataStats title="Low Stock Alerts" total={String(alerts.lowStockCount || 0)} rate="">
          <AlertCircle className="text-red-500" size={22} />
        </CardDataStats>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="col-span-12 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-1">
          <h4 className="text-lg font-semibold text-black dark:text-white">Inventory Alerts</h4>
          <div className="mt-4 space-y-2 text-sm">
            {alerts.items.length === 0 ? (
              <p className="text-gray-400">No low stock items.</p>
            ) : (
              alerts.items.slice(0, 6).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between rounded-md bg-red-50 px-3 py-2 text-red-700">
                  <span className="truncate">{item.productName || "Unknown"}</span>
                  <span className="text-xs font-semibold">{item.quantity}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <ChartTwo
          title="Stock Level Overview"
          categories={stockOverview.categories}
          series={stockOverview.series}
          stacked={true}
          height={320}
          colors={["#3b82f6", "#22c55e"]}
        />
      </div>
    </div>
  );
};

export default StoreDashboard;
