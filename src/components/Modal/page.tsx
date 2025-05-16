// components/Modal.js

import React, { useEffect } from "react";

const Modal = ({ isOpen, onSubmit, onClose, title, children }) => {
  if (!isOpen) return null;

  // Handle keydown event to close the modal on Escape key
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 transition-opacity duration-300 ease-in-out">
      <div className="w-full max-w-180 scale-100 transform rounded-lg bg-white p-8 shadow-lg transition-transform duration-300 ease-in-out">
        <h2 className="text-gray-900 mb-4 text-center text-2xl font-bold pb-2">{title}</h2>
        <div className="text-gray-700 mb-6">{children}</div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition duration-200 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Close
          </button>
          <button
            onClick={onSubmit}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition duration-200 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
