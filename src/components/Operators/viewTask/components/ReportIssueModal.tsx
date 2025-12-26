import React from "react";
import Modal from "@/components/Modal/page";

interface ReportIssueModalProps {
  isReportIssueModal: boolean;
  handleSubmitReport: () => void;
  closeReportIssueModal: () => void;
  setIssueType: (type: string) => void;
  setIssueDescription: (desc: string) => void;
}

export default function ReportIssueModal({
  isReportIssueModal,
  handleSubmitReport,
  closeReportIssueModal,
  setIssueType,
  setIssueDescription,
}: ReportIssueModalProps) {
  return (
    <Modal
      isOpen={isReportIssueModal}
      onSubmit={handleSubmitReport}
      onClose={closeReportIssueModal}
      title="Report Issue"
    >
      <div className="space-y-6">
        {/* Issue Type */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Choose Issue Type <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-500"
              onChange={(e) => setIssueType(e.target.value)}
            >
              <option value="">-- Select an Issue --</option>
              <option value="not_found">📦 Device Not Found</option>
              <option value="technical_fault">⚡ Technical Fault</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={5}
            onChange={(e) => setIssueDescription(e.target.value)}
            placeholder="Please describe the issue in detail..."
            className="w-full resize-y rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-500"
          ></textarea>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Be as specific as possible (e.g., device serial no, error steps).
          </p>
        </div>
      </div>
    </Modal>
  );
}
