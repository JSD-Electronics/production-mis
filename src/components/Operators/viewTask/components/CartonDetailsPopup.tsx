"use client";
import React, { useState, useEffect } from "react";
import Modal from "../../../Modal/page";
import { 
  Printer, 
  CheckCircle2, 
  ScanLine, 
  Box, 
  ArrowRightCircle, 
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "react-toastify";
import { verifyCartonSticker, shiftToNextCommonStage } from "@/lib/api";
import StickerGenerator from "../../viewTask-old/StickerGenerator";

interface Carton {
  cartonSerial: string;
  processId: string;
  devices: any[];
  status?: string;
  createdAt?: string | Date;
  productName?: string;
  [key: string]: any;
}

interface CartonDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  cartons: Carton[];
  processData: any;
  product: any;
  assignUserStage: any;
  onUpdate: () => void;
}

const CartonDetailsPopup = ({
  isOpen,
  onClose,
  cartons,
  processData,
  product,
  assignUserStage,
  onUpdate,
}: CartonDetailsPopupProps) => {
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [scanValue, setScanValue] = useState("");
  const [isMovingStage, setIsMovingStage] = useState(false);
  const [localCartonStatuses, setLocalCartonStatuses] = useState<Record<string, string>>({});

  const fullCartons = cartons.filter(c => (c.status || "").toLowerCase() === "full" || localCartonStatuses[c.cartonSerial] === "Printed" || localCartonStatuses[c.cartonSerial] === "Verified");

  useEffect(() => {
    if (cartons) {
      const statuses: Record<string, string> = {};
      cartons.forEach(c => {
        statuses[c.cartonSerial] = c.status || "Pending";
      });
      setLocalCartonStatuses(statuses);
    }
  }, [cartons]);

const handlePrint = (carton: Carton) => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (printWindow) {
      const packagingSubStep = assignUserStage?.subSteps?.find((s: any) => s.isPackagingStatus);
      const packagingData = packagingSubStep?.packagingData || {};
      
      const boxSize = `${packagingData.cartonWidth || carton.cartonSize?.width || 0}*${packagingData.cartonHeight || carton.cartonSize?.height || 0}*${packagingData.cartonDepth || 0}CM`;
      const weight = `${packagingData.cartonWeight || carton.weightCarton || 0}KG`;
       const modelName = product?.name || "N/A";
       const stageName = assignUserStage?.stage || "N/A";
       const quantity = carton.devices?.length || 0;
       const mcqNo = carton.cartonSerial;
       const dcNo = carton.cartonSerial; // Assuming DC is also carton serial for now, or fetch from elsewhere if available
  
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Carton Sticker - ${carton.cartonSerial}</title>
              <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.min.js"></script>
              <style>
                @page { size: auto; margin: 0mm; }
                body { 
                  margin: 0; 
                  padding: 10px; 
                  font-family: Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                }
                .sticker {
                  width: 80mm;
                  height: 40mm;
                  border: 1px solid black;
                  padding: 2mm;
                  background: white;
                  box-sizing: border-box;
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                }
                .header {
                  text-align: center;
                  font-size: 14pt;
                  font-weight: 900;
                  margin-bottom: 1mm;
                  text-transform: uppercase;
                  border-bottom: 1px solid black;
                }
                .model-row {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  font-size: 11pt;
                  font-weight: 800;
                  margin-bottom: 1mm;
                }
                .qty-label {
                  font-size: 14pt;
                  font-weight: 900;
                }
                .barcode-section {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  flex: 1;
                  margin-top: 2mm;
                }
                svg {
                  max-width: 100%;
                  height: auto;
                }
                .serial-text {
                  font-size: 10pt;
                  font-weight: bold;
                  margin-top: 0.5mm;
                }
              </style>
            </head>
            <body>
              <div class="sticker">
                <div class="header">GEOSAT TELEMATICS</div>
                
                <div class="model-row">
                  <div>MODEL: ${modelName}</div>
                  <div class="qty-label">QTY: ${quantity} PCS</div>
                </div>

                <div class="barcode-section">
                  <svg id="carton-barcode"></svg>
                  <div class="serial-text">${mcqNo}</div>
                </div>
              </div>

            <script>
              window.onload = function() {
                JsBarcode("#carton-barcode", "${mcqNo}", {
                  format: "CODE128",
                  width: 1,
                  height: 60,
                  displayValue: false,
                  margin: 10,
                  background: "#ffffff",
                  lineColor: "#000000"
                });
                
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();
      
      // Update status to Printed
      setLocalCartonStatuses(prev => ({ ...prev, [carton.cartonSerial]: "Printed" }));
      toast.success(`Carton ${carton.cartonSerial} printed successfully!`);
    }
  };

  const handleVerifyClick = (cartonSerial: string) => {
    setIsVerifying(cartonSerial);
    setScanValue("");
  };

  const handleVerifyScan = async () => {
    if (!isVerifying) return;
    
    if (scanValue.trim() !== isVerifying) {
      toast.error("Scanned code does not match Carton Number!");
      setScanValue("");
      return;
    }

    try {
      const response = await verifyCartonSticker(isVerifying);
      if (response) {
        setLocalCartonStatuses(prev => ({ ...prev, [isVerifying]: "Verified" }));
        toast.success(`Carton ${isVerifying} verified successfully!`);
        setIsVerifying(null);
        setScanValue("");
        onUpdate(); // Refresh parent data
      }
    } catch (error) {
      console.error("Verification failed:", error);
      toast.error("Verification failed. Please try again.");
    }
  };

  const handleMoveToNextStage = async () => {
    const allVerified = fullCartons.length > 0 && fullCartons.every(c => localCartonStatuses[c.cartonSerial] === "Verified");
    if (!allVerified) {
      toast.error("All full cartons must be verified before moving to the next stage!");
      return;
    }

    setIsMovingStage(true);
    try {
      // Shifting all verified cartons
      const results = await Promise.all(fullCartons.map(async (carton) => {
        const formData = new FormData();
        formData.append("selectedCarton", carton.cartonSerial);
        return await shiftToNextCommonStage(processData._id, formData);
      }));

      if (results.every(r => r)) {
        toast.success("All cartons moved to the next stage successfully!");
        onUpdate();
        onClose();
      } else {
        toast.error("Some cartons failed to move. Please check.");
      }
    } catch (error) {
      console.error("Move to next stage failed:", error);
      toast.error("An error occurred while moving cartons.");
    } finally {
      setIsMovingStage(false);
    }
  };

  const allVerified = fullCartons.length > 0 && fullCartons.every(c => localCartonStatuses[c.cartonSerial] === "Verified");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Carton Details & Verification"
      submitOption={false}
      maxWidth="max-w-4xl"
    >
      <div className="flex flex-col gap-6">
        {/* Verification Scanner Input (Simulated) */}
        {isVerifying && (
          <div className="rounded-xl border-2 border-blue-500 bg-blue-50 p-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                <ScanLine className="h-4 w-4" />
                Scanning Carton: {isVerifying}
              </h4>
              <button 
                onClick={() => setIsVerifying(null)}
                className="text-blue-500 hover:text-blue-700 text-xs font-bold"
              >
                Cancel
              </button>
            </div>
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyScan()}
                placeholder="Scan QR/Barcode now..."
                className="flex-1 rounded-lg border border-blue-200 px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleVerifyScan}
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700"
              >
                Verify
              </button>
            </div>
            <p className="mt-2 text-[10px] text-blue-600 italic">
              * Scanner behaves like a keyboard. Scan the sticker or type the carton number and press Enter.
            </p>
          </div>
        )}

        {/* Cartons Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 font-bold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-3">Carton Number</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fullCartons.length > 0 ? (
                fullCartons.map((carton) => {
                  const status = localCartonStatuses[carton.cartonSerial] || carton.status || "Pending";
                  const isPrinted = status === "Printed" || status === "Verified";
                  const isVerified = status === "Verified";

                  return (
                    <tr key={carton.cartonSerial} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-4 font-bold text-gray-900">
                        {carton.cartonSerial}
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {product?.name || "N/A"}
                      </td>
                      <td className="px-4 py-4 text-center font-medium">
                        {carton.devices?.length || 0}
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          {assignUserStage?.stage || "Current Stage"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          isVerified 
                            ? "bg-green-100 text-green-700 border border-green-200" 
                            : isPrinted 
                              ? "bg-amber-100 text-amber-700 border border-amber-200" 
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}>
                          {isVerified ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : isPrinted ? (
                            <Printer className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {!isVerified && (
                            <button
                              onClick={() => handlePrint(carton)}
                              title="Print Sticker"
                              className="rounded-lg p-2 text-gray-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                            >
                              <Printer className="h-5 w-5" />
                            </button>
                          )}
                          {isPrinted && !isVerified && (
                            <button
                              onClick={() => handleVerifyClick(carton.cartonSerial)}
                              title="Verify Sticker"
                              className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              <ScanLine className="h-5 w-5" />
                            </button>
                          )}
                          {isVerified && (
                            <span className="p-2 text-green-600">
                              <CheckCircle className="h-5 w-5" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center italic text-gray-400">
                    No cartons ready for verification.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Move to Next Stage Button */}
        <div className="flex justify-center pt-4 border-t border-gray-100">
          <button
            onClick={handleMoveToNextStage}
            disabled={!allVerified || isMovingStage}
            className={`flex items-center gap-2 rounded-xl px-10 py-4 font-bold text-white shadow-xl transition-all active:scale-95 ${
              allVerified && !isMovingStage
                ? "bg-green-600 hover:bg-green-700 shadow-green-500/20"
                : "bg-gray-300 cursor-not-allowed shadow-none"
            }`}
          >
            {isMovingStage ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <ArrowRightCircle className="h-5 w-5" />
            )}
            Move to Next Stage
          </button>
        </div>
        {!allVerified && fullCartons.length > 0 && (
          <p className="text-center text-xs text-gray-400">
            * All full cartons must be Printed and Verified before moving to the next stage.
          </p>
        )}
      </div>
    </Modal>
  );
};

export default CartonDetailsPopup;
