import React from "react";

interface NGModalProps {
  showNGModal: boolean;
  setShowNGModal: (show: boolean) => void;
  selectAssignDeviceDepartment: string;
  setAsssignDeviceDepartment: (dept: string) => void;
  getNGAssignOptions: () => { label: string; value: string }[];
  handleNG: (dept: string | null) => void;
}

export default function NGModal({
  showNGModal,
  setShowNGModal,
  selectAssignDeviceDepartment,
  setAsssignDeviceDepartment,
  getNGAssignOptions,
  handleNG,
}: NGModalProps) {
  if (!showNGModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[400px] rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
        <h2 className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-white">
          Assign Device (NG)
        </h2>

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

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setShowNGModal(false)}
            className="rounded-lg bg-stroke px-4 py-2 text-grey hover:bg-stroke dark:bg-stroke dark:text-grey dark:hover:bg-stroke"
          >
            Cancel
          </button>

          <button
            onClick={() => handleNG(selectAssignDeviceDepartment || null)}
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-dark"
          >
            Confirm NG
          </button>
        </div>
      </div>
    </div>
  );
}
