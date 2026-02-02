import React from "react";
import { Package, QrCode, Printer, ArrowRightCircle } from "lucide-react";
import { useQRCode } from "next-qrcode";

interface CartonDetailsSectionProps {
  selectedCarton: string | null;
  qrCartons: { [key: string]: boolean };
  handleCommonGenerateQRCode: (carton: string) => void;
  handlePrint: () => void;
  loadingCartonDevices: boolean;
  cartonDevices: any[];
  handleShiftToNextStage: (carton: string) => void;
}

export default function CartonDetailsSection({
  selectedCarton,
  qrCartons,
  handleCommonGenerateQRCode,
  handlePrint,
  loadingCartonDevices,
  cartonDevices,
  handleShiftToNextStage,
}: CartonDetailsSectionProps) {
  const { Canvas } = useQRCode();
  if (!selectedCarton) return null;

  return (
    <div className="mt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-white">
          <Package className="h-5 w-5 text-blue-600" />
          Carton: <span className="text-blue-600">{selectedCarton}</span>
        </h3>
        {!qrCartons[selectedCarton] && (
          <button
            type="button"
            onClick={() => handleCommonGenerateQRCode(selectedCarton)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            <QrCode className="h-4 w-4" />
            Generate QR
          </button>
        )}
      </div>

      {/* QR Code Section */}
      {qrCartons[selectedCarton] && (
        <div className="flex flex-col items-center rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div id="barcode-area">
            <Canvas
              text={selectedCarton}
              options={{
                margin: 2,
                scale: 4,
                width: 200,
                color: {
                  dark: "#000000",
                  light: "#ffffff",
                },
              }}
            />
            <p className="mt-3 text-center text-base font-semibold dark:text-white">
              {selectedCarton}
            </p>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="mt-4 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-700"
          >
            <Printer className="h-4 w-4" />
            Print Carton
          </button>
        </div>
      )}

      {/* Device List */}
      <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
        {loadingCartonDevices ? (
          <p className="p-4 text-gray-500 dark:text-gray-400">
            Loading devices...
          </p>
        ) : cartonDevices.length === 0 ? (
          <p className="p-4 text-red-500">No devices found for this carton.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3">Serial No</th>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">IMEI</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created At</th>
                  <th className="px-4 py-3">Test Records</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {cartonDevices.map((device, index) => (
                  <tr
                    key={device._id || index}
                    className="transition hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                      {device.serialNo}
                    </td>
                    <td className="px-4 py-3 dark:text-gray-300">
                      {device.modelName || "N/A"}
                    </td>
                    <td className="px-4 py-3 dark:text-gray-300">
                      {device.imeiNo || "N/A"}
                    </td>
                    <td className="px-4 py-3 dark:text-gray-300">
                      {device.currentStage}
                    </td>
                    <td
                      className={`px-4 py-3 font-semibold ${
                        device.status === "Pass"
                          ? "text-green-600"
                          : device.status === "Fail"
                          ? "text-red-600"
                          : "text-gray-500"
                      }`}
                    >
                      {device.status || "N/A"}
                    </td>
                    <td className="px-4 py-3 dark:text-gray-300">
                      {new Date(device.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {device.testRecords && device.testRecords.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full rounded-md border text-xs dark:border-gray-600">
                            <thead className="bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                              <tr>
                                <th className="px-2 py-1">Stage</th>
                                <th className="px-2 py-1">Status</th>
                                <th className="px-2 py-1">Seat</th>
                                <th className="px-2 py-1">Time</th>
                                <th className="px-2 py-1">Operator</th>
                              </tr>
                            </thead>
                            <tbody className="dark:text-gray-300">
                              {device.testRecords.map(
                                (record: any, rIndex: number) => (
                                  <tr key={record._id || rIndex}>
                                    <td className="px-2 py-1">
                                      {record.stageName}
                                    </td>
                                    <td
                                      className={`px-2 py-1 font-semibold ${
                                        record.status === "Pass"
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {record.status}
                                    </td>
                                    <td className="px-2 py-1">
                                      {record.seatNumber}
                                    </td>
                                    <td className="px-2 py-1">
                                      {record.timeConsumed}
                                    </td>
                                    <td className="px-2 py-1">
                                      {record.operatorId}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <span className="italic text-gray-400">No Records</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end p-4">
              <button
                type="button"
                onClick={() => handleShiftToNextStage(selectedCarton)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
              >
                <ArrowRightCircle className="h-4 w-4" />
                Shift to Next Stage
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
