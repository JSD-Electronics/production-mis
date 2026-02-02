"use client";
import React from "react";
import CardDataStats from "../CardDataStats";
import { viewProcess, viewPlaning } from "@/lib/api";
import { Activity, CheckCircle, Clock, PauseCircle, ClipboardList, CalendarCheck } from "lucide-react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { getDeviceTestRecordsByProcessId } from "@/lib/api";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const ECommerce: React.FC = () => {
  const [processes, setProcesses] = React.useState<any[]>([]);
  const [plans, setPlans] = React.useState<any[]>([]);
  const [selectedProcessId, setSelectedProcessId] = React.useState<string>("");
  const [selectedProcess, setSelectedProcess] = React.useState<any | null>(null);
  const [kitRecords, setKitRecords] = React.useState<any[]>([]);
  const [kitLoading, setKitLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const load = async () => {
      try {
        const p = await viewProcess();
        const list = p?.Processes || [];
        setProcesses(list);
        if (list.length > 0) {
          setSelectedProcessId(String(list[0]?._id));
        }
        const pl = await viewPlaning();
        setPlans(pl?.Planing || []);
      } catch (e) {
        setProcesses([]);
        setPlans([]);
      }
    };
    load();
  }, []);
  React.useEffect(() => {
    if (!selectedProcessId) {
      setKitRecords([]);
      setSelectedProcess(null);
      return;
    }
    const sp = processes.find((x) => String(x?._id) === String(selectedProcessId)) || null;
    setSelectedProcess(sp);
    const fetch = async () => {
      try {
        setKitLoading(true);
        const res = await getDeviceTestRecordsByProcessId(selectedProcessId);
        const rec = res?.deviceTestRecords || [];
        setKitRecords(rec);
      } catch (e) {
        setKitRecords([]);
      } finally {
        setKitLoading(false);
      }
    };
    fetch();
  }, [selectedProcessId, processes]);

  const total = processes.length;
  const active = processes.filter((r) => r?.status === "active").length;
  const waiting = processes.filter((r) => r?.status === "waiting_schedule").length;
  const completed = processes.filter((r) => r?.status === "completed").length;
  const ocCount = Array.from(
    new Set(processes.map((r) => String(r?.orderConfirmationNo || ""))),
  ).filter((v) => v).length;
  const recent = processes.slice(0, 8);
  const hold = processes.filter((r) => r?.status === "down_time_hold").length;

  const statusOptions: ApexOptions = {
    chart: { type: "donut", fontFamily: "Satoshi, sans-serif" },
    labels: ["Active", "Waiting", "Completed", "Hold"],
    colors: ["#f59e0b", "#fb923c", "#22c55e", "#ef4444"],
    legend: { show: true, position: "bottom" },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: "70%" } } },
  };
  const statusSeries = [active, waiting, completed, hold];
  const kitPassed = kitRecords.filter((r) => String(r?.status) === "Pass").length;
  const kitNG = kitRecords.filter((r) => String(r?.status) === "NG").length;
  const kitTotal = selectedProcess?.quantity || 0;
  const kitWIP = Math.max(kitTotal - kitPassed - kitNG, 0);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <CardDataStats title="Total Processes" total={String(total)} rate="">
          <ClipboardList className="text-primary" size={22} />
        </CardDataStats>
        <CardDataStats title="Active" total={String(active)} rate="">
          <Activity className="text-amber-500" size={22} />
        </CardDataStats>
        <CardDataStats title="Waiting Schedule" total={String(waiting)} rate="">
          <Clock className="text-orange-500" size={22} />
        </CardDataStats>
        <CardDataStats title="Completed" total={String(completed)} rate="">
          <CheckCircle className="text-green-600" size={22} />
        </CardDataStats>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <CardDataStats title="Unique OC Numbers" total={String(ocCount)} rate="">
          <ClipboardList className="text-primary" size={22} />
        </CardDataStats>
        <CardDataStats title="Plans Scheduled" total={String(plans.length)} rate="">
          <CalendarCheck className="text-primary" size={22} />
        </CardDataStats>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-lg border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black dark:text-white">Status Distribution</h3>
          </div>
          <ReactApexChart options={statusOptions} series={statusSeries} type="donut" height={300} />
        </div>
        <div className="rounded-lg border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-black dark:text-white">Recent Processes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-700">
                <th className="px-4 py-2">OC No</th>
                <th className="px-4 py-2">Process ID</th>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Quantity</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((row, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{row?.orderConfirmationNo}</td>
                  <td className="px-4 py-2">{row?.processID}</td>
                  <td className="px-4 py-2">{row?.productName}</td>
                  <td className="px-4 py-2">{row?.name}</td>
                  <td className="px-4 py-2">{row?.quantity}</td>
                  <td className="px-4 py-2">
                    {(() => {
                      const s = String(row?.status || "");
                      const cls =
                        s === "active"
                          ? "bg-amber-500"
                          : s === "completed"
                          ? "bg-green-600"
                          : s === "waiting_schedule"
                          ? "bg-orange-500"
                          : s === "down_time_hold"
                          ? "bg-red-600"
                          : "bg-gray-700";
                      const label =
                        s === "waiting_schedule"
                          ? "Waiting"
                          : s === "down_time_hold"
                          ? "Hold"
                          : s || "Unknown";
                      return (
                        <span className={`inline-block rounded px-2.5 py-1 text-[11px] font-semibold text-white ${cls}`}>
                          {label}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      <div className="mt-6 rounded-lg border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-black dark:text-white">Process Kit Summary</h3>
          <div className="flex items-center gap-2">
            <select
              value={selectedProcessId}
              onChange={(e) => setSelectedProcessId(e.target.value)}
              className="h-9 rounded-md border border-stroke bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-strokedark dark:bg-form-input"
            >
              <option value="">Select Process</option>
              {processes.map((p) => (
                <option key={p?._id} value={p?._id}>
                  {p?.name} ({p?.processID})
                </option>
              ))}
            </select>
          </div>
        </div>
        {selectedProcess && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CardDataStats title="WIP Kits" total={String(kitWIP)} rate="">
                <Activity className="text-amber-500" size={22} />
              </CardDataStats>
              <CardDataStats title="Passed Kits" total={String(kitPassed)} rate="">
                <CheckCircle className="text-green-600" size={22} />
              </CardDataStats>
              <CardDataStats title="NG Kits" total={String(kitNG)} rate="">
                <PauseCircle className="text-red-600" size={22} />
              </CardDataStats>
              <CardDataStats title="Plan Qty" total={String(kitTotal)} rate="">
                <ClipboardList className="text-primary" size={22} />
              </CardDataStats>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ECommerce;
