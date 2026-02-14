import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const Modal = ({
  isOpen,
  onSubmit,
  onClose,
  title,
  submitOption = true,
  submitDisabled = false,
  closeOption = true,
  maxWidth = "max-w-180",
  children,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div
        className={`w-full ${maxWidth} scale-100 transform overflow-hidden rounded-2xl bg-white p-0 shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="border-gray-100 bg-gray-50/50 border-b px-6 py-4">
          <h2 className="text-gray-800 text-lg font-bold tracking-tight">
            {title}
          </h2>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5">
          {children}
        </div>

        {/* Modal Footer */}
        <div className="border-gray-100 flex justify-end gap-3 border-t bg-gray-50/30 px-6 py-4">
          {closeOption && (
            <button
              type="button"
              onClick={onClose}
              className="hover:bg-gray-100 active:bg-gray-200 text-gray-600 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none"
            >
              Cancel
            </button>
          )}
          {submitOption && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitDisabled}
              className={`rounded-xl px-5 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 focus:outline-none active:scale-95 ${submitDisabled
                  ? "bg-gray-300 cursor-not-allowed shadow-none"
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/40"
                }`}
            >
              Confirm
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
