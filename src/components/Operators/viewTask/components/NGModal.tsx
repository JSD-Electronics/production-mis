"use client";
import React from "react";
import { RotateCcw } from "lucide-react";

interface NGModalProps {
  showNGModal: boolean;
  setShowNGModal: (show: boolean) => void;
  selectAssignDeviceDepartment: string;
  setAsssignDeviceDepartment: (dept: string) => void;
  getNGAssignOptions: () => { label: string; value: string }[];
  handleNG: (dept: string | null, ngDescription: string) => void;
  reason?: string | null;
  isJigStep?: boolean;
  onRetry?: () => void;
  ngDescription: string;
  setNgDescription: (val: string) => void;
}

export default function NGModal({
  showNGModal,
  setShowNGModal,
  selectAssignDeviceDepartment,
  setAsssignDeviceDepartment,
  getNGAssignOptions,
  handleNG,
  reason,
  isJigStep = false,
  onRetry,
  ngDescription,
  setNgDescription,
}: NGModalProps) {
  // No longer using showAssignment state as we show everything immediately now
  const descriptionMissing = !String(ngDescription || "").trim();

  const handleRetryClick = () => {
    if (onRetry) {
      onRetry();
      setShowNGModal(false);
    }
  };


  const handleConfirmAssignment = () => {
    const desc = String(ngDescription || "").trim();
    if (!desc) return;
    handleNG(selectAssignDeviceDepartment || null, desc);
    setShowNGModal(false);
  };

  if (!showNGModal) return null;

  return (
    <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[450px] rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
        <h2 className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-white">
          Device Failed (NG)
        </h2>

        {reason && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 border border-red-100">
            <p className="text-xs font-bold text-red-600 uppercase mb-1">Failure Reason:</p>
            <p className="text-sm text-red-700 italic">{reason}</p>
          </div>
        )}

        {isJigStep && onRetry && (
          <div className="mb-4 rounded-lg bg-blue-50 p-3 border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 mb-2">Options:</p>
            <ul className="text-xs text-blue-600 space-y-1 ml-4 list-disc">
              <li><strong>Retry:</strong> Re-run all tests from the beginning for this device</li>
              <li><strong>Move to Next Device:</strong> Assign this device and continue with next device</li>
            </ul>
          </div>
        )}

        {/* Always show assignment options for all types including Jig, to satisfy "assign device to ng model appear there" */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for NG: <span className="text-danger">*</span>
            </label>
            <textarea
              value={ngDescription}
              onChange={(e) => setNgDescription(e.target.value)}
              rows={3}
              placeholder="Enter the reason/description for NG..."
              className={`w-full resize-none rounded-lg border bg-transparent px-4 py-3 text-sm outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white ${descriptionMissing ? "border-danger" : "border-gray-300 dark:border-gray-600"}`}
            />
            {descriptionMissing && (
              <p className="mt-1 text-xs font-medium text-danger">
                Reason for NG is required.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assign Device To:
            </label>
            <select
              value={selectAssignDeviceDepartment}
              onChange={(e) => setAsssignDeviceDepartment(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select Option</option>
              {getNGAssignOptions().map((item, index) => (
                <option key={index} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setShowNGModal(false)}
            className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>

          {isJigStep && onRetry && (
            <button
              onClick={handleRetryClick}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Retry
            </button>
          )}

          <button
            onClick={handleConfirmAssignment}
            className="flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            disabled={!selectAssignDeviceDepartment || descriptionMissing}
          >
            Confirm NG
          </button>
        </div>
      </div>
    </div>
  );
}
