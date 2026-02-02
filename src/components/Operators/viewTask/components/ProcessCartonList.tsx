import React from "react";
import { ListChecks } from "lucide-react";

interface ProcessCartonListProps {
  processCartons: any[];
  handleShiftToPDI: () => void;
}

export default function ProcessCartonList({
  processCartons,
  handleShiftToPDI,
}: ProcessCartonListProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 py-2 shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <h3 className="sticky top-0 flex items-center justify-center gap-2 rounded-t-xl bg-gray-100 py-2 text-center text-sm font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
        <ListChecks className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        Carton Details
      </h3>
      <div className="max-h-[247px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            <tr>
              <th className="px-2 py-1">Serial</th>
              <th className="px-2 py-1">Status</th>
              <th className="px-2 py-1">Time</th>
            </tr>
          </thead>
          <tbody className="dark:text-gray-300">
            {processCartons.length > 0 ? (
              processCartons.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-t hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 text-center"
                >
                  <td className="px-2 py-1">{row?.cartonSerial}</td>
                  <td className="px-2 py-1">{row?.status}</td>
                  <td className="px-2 py-1">{row?.createdAt}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-2 text-center text-gray-500">
                  No Result Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {processCartons.length > 0 && (
          <div className="flex items-end justify-end py-2">
            <button
              className="flex items-center gap-2 rounded-lg bg-[#0FADCF] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#0c8ba6]"
              onClick={handleShiftToPDI}
            >
              Shift To PDI
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
