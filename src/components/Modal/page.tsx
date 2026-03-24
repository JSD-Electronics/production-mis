"use client";

import React from "react";
import { createPortal } from "react-dom";

const Modal = ({
  isOpen,
  onSubmit,
  onClose,
  title,
  submitOption = true,
  submitDisabled = false,
  submitText = "Confirm",
  closeOption = true,
  maxWidth = "max-w-180",
  extraActions,
  children,
}: {
  isOpen: boolean;
  onSubmit?: () => void;
  onClose: () => void;
  title: string;
  submitOption?: boolean;
  submitDisabled?: boolean;
  submitText?: string;
  closeOption?: boolean;
  maxWidth?: string;
  extraActions?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const [portalHost, setPortalHost] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (typeof document === "undefined") return;

    const host = document.createElement("div");
    host.setAttribute("data-modal-portal", "true");
    document.body.appendChild(host);
    setPortalHost(host);

    return () => {
      setPortalHost((current) => (current === host ? null : current));
      if (host.parentNode?.contains(host)) {
        host.parentNode.removeChild(host);
      }
    };
  }, []);

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 transition-all duration-300 sm:p-6">
      <div
        className={`max-h-[85vh] w-full ${maxWidth} flex transform scale-100 flex-col overflow-hidden rounded-2xl bg-white p-0 shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95 duration-200 sm:max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-gray-100 border-b bg-gray-50/50 px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="text-gray-800 text-lg font-bold tracking-tight">
            {title}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>

        <div className="border-gray-100 flex flex-wrap justify-end gap-3 border-t bg-gray-50/30 px-4 py-3 sm:px-6 sm:py-4">
          {extraActions}
          {closeOption && (
            <button
              type="button"
              onClick={onClose}
              className="text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none"
            >
              Cancel
            </button>
          )}
          {submitOption && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitDisabled}
              className={`rounded-xl px-5 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 focus:outline-none active:scale-95 ${
                submitDisabled
                  ? "cursor-not-allowed bg-gray-300 shadow-none"
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/40"
              }`}
            >
              {submitText}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (!portalHost) return null;

  return createPortal(modal, portalHost);
};

export default Modal;
