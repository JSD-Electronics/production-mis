import React from "react";
import { Printer, CheckCircle, XCircle } from "lucide-react";
import StickerGenerator from "../../viewTask-old/StickerGenerator";

interface PrinterSectionProps {
  subStep: any;
  deviceList: any[];
  searchResult: any;
  handlePrintSticker: () => void;
  isStickerPrinted: boolean;
  handleVerifySticker: () => void;
  isVerifiedSticker: boolean;
  lastStatusIsNG: boolean;
  handleUpdateStatus: (status: string) => void;
  handleNG: () => void;
}

export default function PrinterSection({
  subStep,
  deviceList,
  searchResult,
  handlePrintSticker,
  isStickerPrinted,
  handleVerifySticker,
  isVerifiedSticker,
  lastStatusIsNG,
  handleUpdateStatus,
  handleNG,
}: PrinterSectionProps) {
  if (!subStep.isPrinterEnable) return null;

  return (
    <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:bg-gray-900 dark:border-gray-700">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Printer className="h-6 w-6 text-primary" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Print Sticker
        </h3>
      </div>
      <hr className="mb-4 border-gray-300 dark:border-gray-700" />

      <div className="flex flex-col items-center gap-6">
        {/* Sticker Preview */}
        {subStep.printerFields && Array.isArray(subStep.printerFields) ? (
          subStep.printerFields.map((field: any, index: number) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-inner dark:bg-gray-800 dark:border-gray-700"
            >
              <StickerGenerator
                stickerData={field}
                deviceData={deviceList.filter(
                  (d: any) => d.serialNo === searchResult
                )}
              />
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-inner dark:bg-gray-800 dark:border-gray-700">
            <StickerGenerator
              stickerData={subStep.stickerData}
              deviceData={deviceList.filter(
                (d: any) => d.serialNo === searchResult
              )}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <button
            className={`flex items-center gap-2 rounded-lg px-6 py-3 text-white shadow-md transition-all ${
              searchResult
                ? "bg-blue-600 hover:bg-blue-700"
                : "cursor-not-allowed bg-gray-400"
            }`}
            onClick={handlePrintSticker}
            disabled={!searchResult}
          >
            <Printer className="h-5 w-5" />
            Print Sticker
          </button>

          {isStickerPrinted && subStep.isVerifySticker && (
            <button
              className={`flex items-center gap-2 rounded-lg px-6 py-3 text-white shadow-md transition-all ${
                isStickerPrinted
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "cursor-not-allowed bg-gray-400"
              }`}
              onClick={handleVerifySticker}
              disabled={!isStickerPrinted}
            >
              <CheckCircle className="h-5 w-5" />
              Verify Sticker
            </button>
          )}
        </div>

        {/* Pass / NG Actions */}
        {(isStickerPrinted && !subStep.isVerifySticker) || isVerifiedSticker ? (
          <div className="mt-4 flex w-full justify-center gap-6 border-t pt-6 dark:border-gray-700">
            {!lastStatusIsNG && (
              <>
                <button
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-8 py-3 text-lg font-semibold text-white shadow-md hover:bg-green-700 transition-transform hover:scale-105"
                  onClick={() => handleUpdateStatus("Pass")}
                >
                  <CheckCircle className="h-6 w-6" />
                  Pass
                </button>
                <button
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-8 py-3 text-lg font-semibold text-white shadow-md hover:bg-red-700 transition-transform hover:scale-105"
                  onClick={handleNG}
                >
                  <XCircle className="h-6 w-6" />
                  NG
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
