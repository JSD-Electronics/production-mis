import React from "react";

const ConfirmationPopup = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300">
      <div className="w-full max-w-sm scale-95 transform rounded-lg bg-white p-8 shadow-lg transition-transform duration-300 ease-out hover:scale-100">
        <h2 className="text-gray-800 mb-4 text-xl font-bold">Are You Sure?</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="border-gray-300 text-gray-600 hover:bg-gray-200 rounded-full border px-5 py-2 transition-all duration-200 ease-in-out focus:outline-none"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-2 text-white transition-all duration-200 ease-in-out hover:from-blue-600 hover:to-blue-700 focus:outline-none"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPopup;
