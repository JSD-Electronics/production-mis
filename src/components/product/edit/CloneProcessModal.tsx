import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

interface CloneProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  processes: any[];
  onClone: (processId: string) => void;
  isLoading?: boolean;
}

const CloneProcessModal: React.FC<CloneProcessModalProps> = ({
  isOpen,
  onClose,
  processes,
  onClone,
  isLoading = false,
}) => {
  const [selectedProcessId, setSelectedProcessId] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (selectedProcessId) {
      onClone(selectedProcessId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4 md:inset-0">
      <div className="relative h-full w-full max-w-md md:h-auto">
        <div className="relative rounded-lg bg-white shadow dark:bg-boxdark">
          <div className="flex items-center justify-between rounded-t border-b p-4 dark:border-strokedark">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Clone into Process
            </h3>
            <button
              type="button"
              className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
              onClick={onClose}
            >
              <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-6 p-6">
            <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
              Select a process to clone the current product stages into. This will overwrite the target process's stages.
            </p>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                Select Process
              </label>
              <select
                value={selectedProcessId}
                onChange={(e) => setSelectedProcessId(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-strokedark dark:bg-form-input dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              >
                <option value="" disabled>
                  Choose a process
                </option>
                {processes.map((process) => (
                  <option key={process._id || process.id} value={process._id || process.id}>
                    {process.processID} - {process.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-2 rounded-b border-t border-gray-200 p-6 dark:border-gray-600">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedProcessId || isLoading}
              className={`rounded-lg bg-primary px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
                isLoading || !selectedProcessId ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              {isLoading ? "Cloning..." : "Clone"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloneProcessModal;
