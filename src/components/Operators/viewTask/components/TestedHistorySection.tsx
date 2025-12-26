import React from "react";
import { ListChecks } from "lucide-react";

interface TestedHistorySectionProps {
  checkedDevice: any[];
}

export default function TestedHistorySection({
  checkedDevice,
}: TestedHistorySectionProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <h3 className="sticky top-0 flex items-center justify-center gap-2 rounded-t-xl bg-gray-100 py-2 text-center text-sm font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
        <ListChecks className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        Tested History (Today)
      </h3>
      <div className="overflow-y-auto max-h-[300px]">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            <tr>
              <th className="px-2 py-1">Serial</th>
              <th className="px-2 py-1">Stage</th>
              <th className="px-2 py-1">Status</th>
              <th className="px-2 py-1">Assign NG Device</th>
              <th className="px-2 py-1">Time</th>
            </tr>
          </thead>
          <tbody className="dark:text-gray-300">
            {checkedDevice.length > 0 ? (
              checkedDevice.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-t hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 text-center"
                >
                  <td className="px-2 py-1">{row?.deviceInfo?.serialNo}</td>
                  <td className="px-2 py-1">{row?.stageName}</td>
                  <td
                    className={`px-2 py-1 font-medium ${
                      row?.status === "Pass"
                        ? "text-green-600"
                        : row?.status === "NG"
                        ? "text-red-500"
                        : "text-gray-500"
                    }`}
                  >
                    {row?.status}
                  </td>
                  <td className="px-2 py-1">{row?.assignedDeviceTo}</td>
                  <td className="px-2 py-1">{row?.timeTaken}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-2 text-center text-gray-500">
                  No devices checked yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
