"use client";
import React, { useMemo, useState } from "react";
import { ChevronRight, Search, Sparkles } from "lucide-react";

interface ProcessSummary {
  _id: string;
  processID?: string;
  name?: string;
  productName?: string;
  status?: string;
  stageCounts: Record<string, number>;
  passed: number;
  ng: number;
  total: number;
  target: number;
  ngLastHour: number;
  ngToday: number;
}

interface ProcessWiseTableProps {
  processes: ProcessSummary[];
  onSelect: (processId: string) => void;
  isLoading?: boolean;
  ledMode?: boolean;
}

const statusPill = (status: string) => {
  const s = String(status || "").toLowerCase();
  if (s.includes("hold")) return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  if (s.includes("active")) return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  if (s.includes("down")) return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  return "bg-slate-50 text-slate-600 ring-1 ring-slate-200";
};

const ProcessWiseTable: React.FC<ProcessWiseTableProps> = ({
  processes,
  onSelect,
  isLoading = false,
  ledMode = false,
}) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return processes;
    return processes.filter((p) =>
      [p.processID, p.name, p.productName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [processes, query]);

  return (
    <div className={`rounded-3xl border border-stroke bg-white p-6 shadow-[0_10px_30px_-20px_rgba(30,64,175,0.25)] dark:border-strokedark dark:bg-boxdark ${ledMode ? "p-8" : ""}`}>
      {!ledMode && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Process Overview</h3>
              <p className="text-sm text-gray-500">Active lines with live stage distribution and health indicators.</p>
            </div>
          </div>
          <div className="w-full sm:w-80">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search process or product..."
                className="w-full rounded-xl border border-gray-200 bg-white px-9 py-2.5 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
            Loading process summaries...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
            No processes found.
          </div>
        ) : (
          (ledMode ? processes : filtered).map((p) => {
            const progress = p.target > 0 ? Math.round((p.passed / p.target) * 100) : 0;
            const stageItems = Object.entries(p.stageCounts);
            return (
              <div
                key={p._id}
                className={`rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm transition hover:shadow-md ${ledMode ? "py-6" : ""}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center rounded-2xl bg-slate-900 text-white ${ledMode ? "h-14 w-14" : "h-12 w-12"}`}>
                      <span className={`font-bold ${ledMode ? "text-sm" : "text-xs"}`}>{(p.processID || p.name || "P").toString().slice(0, 2)}</span>
                    </div>
                    <div>
                      <div className={`font-bold text-gray-800 ${ledMode ? "text-lg" : "text-base"}`}>
                        {p.processID || p.name || "Process"}
                      </div>
                      <div className={`${ledMode ? "text-sm" : "text-xs"} text-gray-500`}>{p.productName || "-"}</div>
                    </div>
                    <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusPill(p.status || "")}`}>
                      {p.status || "unknown"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className={`min-w-[160px] ${ledMode ? "min-w-[220px]" : ""}`}>
                      <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
                        <span>Progress</span>
                        <span className="font-semibold text-gray-700">{progress}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-gray-100">
                        <div
                          className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className={`mt-1 ${ledMode ? "text-xs" : "text-[10px]"} text-gray-400`}>
                        {p.passed}/{p.target} passed
                      </div>
                    </div>

                    <div className="rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">
                      NG: {p.ngLastHour} / {p.ngToday}
                      <div className="text-[10px] font-normal text-rose-500">last 1h / today</div>
                    </div>

                    {!ledMode && (
                      <button
                        onClick={() => onSelect(p._id)}
                        className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90"
                      >
                        Details <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {stageItems.length === 0 ? (
                    <span className="text-xs text-gray-400">No stage data</span>
                  ) : (
                    stageItems.map(([stage, count]) => (
                      <span
                        key={stage}
                        className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700"
                        title={stage}
                      >
                        {stage}: {count}
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProcessWiseTable;
