import React from "react";
import {
  Box,
  Package,
  Weight,
  Layers,
  ClipboardCheck,
  PlusCircle,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { useQRCode } from "next-qrcode";
import StickerGenerator from "../../viewTask-old/StickerGenerator";

interface PackagingSectionProps {
  subStep: any;
  processData: any;
  handleAddToCart: (subStep: any) => void;
  handleNG: () => void;
  cartons: any[];
  isCartonBarcodePrinted: boolean;
  handleGenerateQRCode: (carton: any) => void;
  qrCartons: { [key: string]: boolean };
  handlePrint: () => void;
  deviceList: any[];
  searchResult: any;
  lastStatusIsNG: boolean;
  handleUpdateStatus: (status: string) => void;
}

export default function PackagingSection({
  subStep,
  processData,
  handleAddToCart,
  handleNG,
  cartons,
  isCartonBarcodePrinted,
  handleGenerateQRCode,
  qrCartons,
  handlePrint,
  deviceList,
  searchResult,
  lastStatusIsNG,
  handleUpdateStatus,
}: PackagingSectionProps) {
  const { Canvas } = useQRCode();
  if (!subStep.isPackagingStatus) return null;

  const isCarton = subStep.packagingData?.packagingType === "Carton";

  return (
    <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:bg-gray-900 dark:border-gray-700">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Box className="h-6 w-6 text-primary" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {isCarton ? "ðŸ“¦ Carton Details" : "ðŸ“„ Single Device Sticker"}
        </h3>
      </div>
      <hr className="mb-4 border-gray-300 dark:border-gray-700" />

      {isCarton ? (
        <>
          {/* Carton Info Grid */}
          <div className="grid gap-4 sm:grid-cols-2 text-gray-700 dark:text-gray-300">
            <p className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Dimensions:</span>{" "}
              {subStep?.packagingData?.cartonWidth} Ã—{" "}
              {subStep?.packagingData?.cartonHeight}
            </p>
            <p className="flex items-center gap-2">
              <Weight className="h-5 w-5 text-green-500" />
              <span className="font-medium">Weight:</span>{" "}
              {subStep?.packagingData?.cartonWeight} kg
            </p>
            <p className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-500" />
              <span className="font-medium">Max Capacity:</span>{" "}
              {subStep?.packagingData?.maxCapacity}
            </p>
            <p className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-orange-500" />
              <span className="font-medium">Issued Cartons:</span>{" "}
              {processData?.issuedCartons}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-center gap-4">
            <button
              className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-white shadow hover:bg-green-700 transition-colors"
              onClick={() => handleAddToCart(subStep)}
            >
              <PlusCircle className="h-5 w-5" />
              Add To Cart
            </button>
            <button
              className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-white shadow hover:bg-red-700 transition-colors"
              onClick={handleNG}
            >
              <XCircle className="h-5 w-5" />
              NG
            </button>
          </div>

          {/* Devices in carton */}
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:bg-gray-800 dark:border-gray-700">
            <h4 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
              Devices in this Carton
            </h4>

            {cartons?.length > 0 ? (
              cartons.map((carton: any, index: number) => (
                <div
                  key={index}
                  className="mb-6 rounded-lg border p-4 dark:border-gray-600"
                >
                  <p className="mb-2">
                    <strong>Carton Serial No:</strong> {carton.cartonSerial}
                  </p>

                  <ul className="list-disc pl-6 text-sm dark:text-gray-300">
                    {carton.devices?.length > 0 ? (
                      carton.devices.map((serial: string, i: number) => (
                        <li key={i}>{serial}</li>
                      ))
                    ) : (
                      <p className="italic text-gray-500 dark:text-gray-400">
                        No devices in this carton.
                      </p>
                    )}
                  </ul>

                  {/* QR Code + Button */}
                  {!isCartonBarcodePrinted && carton.status && (
                    <div className="mt-4 flex flex-col items-center gap-3">
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-white shadow hover:bg-blue-700 transition-colors"
                        onClick={() => handleGenerateQRCode(carton)}
                      >
                        Generate Carton QR Code
                      </button>

                      {qrCartons[carton.cartonSerial] && (
                        <>
                          <div
                            id="barcode-area"
                            className="rounded-lg bg-white p-2 shadow"
                          >
                            <Canvas
                              text={carton.cartonSerial}
                              options={{
                                margin: 2,
                                scale: 4,
                                width: 180,
                                color: {
                                  dark: "#000000",
                                  light: "#ffffff",
                                },
                              }}
                            />
                            <p className="mt-2 text-center font-semibold text-black">
                              {carton.cartonSerial}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handlePrint}
                            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white shadow hover:bg-green-700 transition-colors"
                          >
                            ðŸ–¨ Print Carton
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="italic text-gray-500 dark:text-gray-400">
                No devices added yet.
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Single Device Sticker */}
          <div className="mt-6 flex justify-center">
            <StickerGenerator
              stickerData={subStep.packagingData}
              deviceData={deviceList.filter((d: any) => d.serialNo === searchResult)}
            />
          </div>
          <div className="mt-6 flex justify-center gap-4">
            {!lastStatusIsNG && (
              <div className="mt-6 flex justify-center gap-4">
                <button
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-white shadow hover:bg-green-700 transition-colors"
                  onClick={() => handleUpdateStatus("Pass")}
                >
                  <CheckCircle className="h-5 w-5" />
                  Pass
                </button>
                <button
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-white shadow hover:bg-red-700 transition-colors"
                  onClick={handleNG}
                >
                  <XCircle className="h-5 w-5" />
                  NG
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
