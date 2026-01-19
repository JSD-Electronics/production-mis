"use client";
import React from "react";
import { RotateCcw, ArrowRight } from "lucide-react";

interface NGModalProps {
  showNGModal: boolean;
  setShowNGModal: (show: boolean) => void;
  selectAssignDeviceDepartment: string;
  setAsssignDeviceDepartment: (dept: string) => void;
  getNGAssignOptions: () => { label: string; value: string }[];
  handleNG: (dept: string | null) => void;
  reason?: string | null;
  isJigStep?: boolean;
  onRetry?: () => void;
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
}: NGModalProps) {
  const [showAssignment, setShowAssignment] = React.useState(false);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!showNGModal) {
      setShowAssignment(false);
    }
  }, [showNGModal]);

  const handleRetryClick = () => {
    if (onRetry) {
      onRetry();
      setShowNGModal(false);
      setShowAssignment(false);
    }
  };

  const handleMoveToNext = () => {
    if (isJigStep) {
      setShowAssignment(true);
    } else {
      handleNG(selectAssignDeviceDepartment || null);
    }
  };

  const handleConfirmAssignment = () => {
    handleNG(selectAssignDeviceDepartment || null);
    setShowNGModal(false);
    setShowAssignment(false);
  };

  if (!showNGModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[450px] rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
        <h2 className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-white">
          {showAssignment ? "Assign Device" : "Device Failed (NG)"}
        </h2>

        {reason && !showAssignment && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 border border-red-100">
            <p className="text-xs font-bold text-red-600 uppercase mb-1">Failure Reason:</p>
            <p className="text-sm text-red-700 italic">{reason}</p>
          </div>
        )}

        {isJigStep && onRetry && !showAssignment && (
          <div className="mb-4 rounded-lg bg-blue-50 p-3 border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 mb-2">Options:</p>
            <ul className="text-xs text-blue-600 space-y-1 ml-4 list-disc">
              <li><strong>Retry:</strong> Re-run all tests from the beginning for this device</li>
              <li><strong>Move to Next Device:</strong> Assign this device and continue with next device</li>
            </ul>
          </div>
        )}

        {(!isJigStep || showAssignment) && (
          <>
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
          </>
        )}

        <div className="mt-6 flex justify-end gap-3">
          {showAssignment ? (
            <>
              <button
                onClick={() => setShowAssignment(false)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Back
              </button>
              <button
                onClick={handleConfirmAssignment}
                className="rounded-lg bg-danger px-4 py-2 text-white hover:bg-danger"
                disabled={!selectAssignDeviceDepartment}
              >
                Confirm NG
              </button>
            </>
          ) : (
            <>
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
                onClick={handleMoveToNext}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white transition-colors ${isJigStep
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-red-600 hover:bg-red-700"
                  }`}
              >
                {isJigStep && <ArrowRight className="h-4 w-4" />}
                {isJigStep ? "Move to Next Device" : "Confirm NG"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
