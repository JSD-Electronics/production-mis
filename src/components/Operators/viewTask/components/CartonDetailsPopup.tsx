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
  AlertCircle,
  Scale,
  QrCode
} from "lucide-react";
import { toast } from "react-toastify";
import {
  verifyCartonSticker,
  shiftToNextCommonStage,
  shiftToPDI,
  saveCartonWeight,
  updateCartonPrintingStatus,
  fetchOpenCartonsByProcessID,
  closeLooseCarton,
} from "@/lib/api";

interface Carton {
  cartonSerial: string;
  processId: string;
  devices: any[];
  status?: string;
  createdAt?: string | Date;
  productName?: string;
  weightCarton?: string | number;
  isStickerPrinted?: boolean;
  isLooseCarton?: boolean;
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
  isLoading?: boolean;
}

const CartonDetailsPopup = ({
  isOpen,
  onClose,
  cartons,
  processData,
  product,
  assignUserStage,
  onUpdate,
  isLoading = false,
}: CartonDetailsPopupProps) => {
  const currentStageName =
    (Array.isArray(assignUserStage) ? assignUserStage?.[0]?.name : null) ||
    assignUserStage?.stage ||
    assignUserStage?.name ||
    "";
  const isPDIStage = currentStageName === "PDI";

  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [scanValue, setScanValue] = useState("");
  const [verifyError, setVerifyError] = useState<string>("");
  const [isMovingStage, setIsMovingStage] = useState(false);
  const [localCartonStatuses, setLocalCartonStatuses] = useState<Record<string, string>>({});
  const [cartonWeights, setCartonWeights] = useState<Record<string, string>>({});
  const [isSavingWeight, setIsSavingWeight] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string>("");
  const [openCartons, setOpenCartons] = useState<Carton[]>([]);
  const [isLoadingOpen, setIsLoadingOpen] = useState(false);
  const [closingCarton, setClosingCarton] = useState<string | null>(null);
  const [looseCartonTarget, setLooseCartonTarget] = useState<Carton | null>(null);
  const [looseCartonStep, setLooseCartonStep] = useState<"choice" | "assign">("choice");
  const [looseCartonSubmitting, setLooseCartonSubmitting] = useState(false);
  const [looseCartonForm, setLooseCartonForm] = useState({
    cartonWidth: "",
    cartonHeight: "",
    cartonDepth: "",
    cartonWeight: "",
    quantity: "",
  });

  const fullCartons = cartons.filter(c =>
    (c.status || "").toLowerCase() === "full" ||
    localCartonStatuses[c.cartonSerial] === "Printed" ||
    localCartonStatuses[c.cartonSerial] === "Verified" ||
    c.isStickerVerified ||
    c.isStickerPrinted
  );

  useEffect(() => {
    if (cartons) {
      const statuses: Record<string, string> = {};
      const weights: Record<string, string> = {};
      const localOpenCartons = cartons.filter((c) => {
        const status = String(c?.status || "").toLowerCase();
        return (
          status !== "full" ||
          c?.isLooseCarton ||
          status === "partial" ||
          status === "empty"
        );
      });
      setOpenCartons(localOpenCartons);
      cartons.forEach(c => {
        if (c.isStickerVerified) {
          statuses[c.cartonSerial] = "Verified";
        } else if (c.isStickerPrinted) {
          statuses[c.cartonSerial] = "Printed";
        } else {
          statuses[c.cartonSerial] = c.status || "Pending";
        }

        if (c.weightCarton) weights[c.cartonSerial] = c.weightCarton.toString();
      });
      setLocalCartonStatuses(statuses);
      setCartonWeights(weights);
    }
  }, [cartons]);

  useEffect(() => {
    const loadOpenCartons = async () => {
      if (!isOpen || !processData?._id) return;
      setIsLoadingOpen(true);
      try {
        const result = await fetchOpenCartonsByProcessID(processData._id);
        const list = Array.isArray(result) ? result : (result?.cartonDetails || []);
        if (Array.isArray(list) && list.length > 0) {
          setOpenCartons(list);
        }
      } catch (e) {
        // keep the locally derived list if the background refresh fails
      } finally {
        setIsLoadingOpen(false);
      }
    };
    loadOpenCartons();
  }, [isOpen, processData?._id]);

  const resetLooseCartonFlow = () => {
    setLooseCartonTarget(null);
    setLooseCartonStep("choice");
    setLooseCartonSubmitting(false);
    setLooseCartonForm({
      cartonWidth: "",
      cartonHeight: "",
      cartonDepth: "",
      cartonWeight: "",
      quantity: "",
    });
  };

  const openLooseCartonFlow = (carton: Carton) => {
    if (String(carton?.status || "").toLowerCase() !== "partial") {
      toast.error("Only partial cartons can be closed as loose cartons.");
      return;
    }
    const packagingData = assignUserStage?.subSteps?.find((s: any) => s.isPackagingStatus)?.packagingData || {};
    setLooseCartonTarget(carton);
    setLooseCartonStep("choice");
    setLooseCartonForm({
      cartonWidth: String(carton?.cartonSize?.width || packagingData?.cartonWidth || ""),
      cartonHeight: String(carton?.cartonSize?.height || packagingData?.cartonHeight || ""),
      cartonDepth: String(carton?.cartonSize?.depth || packagingData?.cartonDepth || ""),
      cartonWeight: String(carton?.weightCarton || packagingData?.cartonWeight || ""),
      quantity: String(carton?.devices?.length || 0),
    });
  };

  const handleProceedLooseExisting = async () => {
    if (!looseCartonTarget) return;
    try {
      setClosingCarton(looseCartonTarget.cartonSerial);
      await closeLooseCarton({
        cartonSerial: looseCartonTarget.cartonSerial,
        action: "existing",
      });
      toast.success("Loose carton closed successfully!");
      setOpenCartons((prev) => prev.filter((c) => c.cartonSerial !== looseCartonTarget.cartonSerial));
      resetLooseCartonFlow();
      onUpdate();
    } catch (e: any) {
      toast.error(e?.message || "Failed to close loose carton");
    } finally {
      setClosingCarton(null);
    }
  };

  const handleAssignNewCarton = async () => {
    if (!looseCartonTarget) return;

    const sourceQuantity = Array.isArray(looseCartonTarget.devices) ? looseCartonTarget.devices.length : 0;
    const quantity = Number(looseCartonForm.quantity);
    const cartonWidth = Number(looseCartonForm.cartonWidth);
    const cartonHeight = Number(looseCartonForm.cartonHeight);
    const cartonDepth = Number(looseCartonForm.cartonDepth);
    const cartonWeight = Number(looseCartonForm.cartonWeight);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      toast.error("Quantity must be a positive integer.");
      return;
    }
    if (quantity > sourceQuantity) {
      toast.error("Quantity cannot exceed the devices in the partial carton.");
      return;
    }
    if (!cartonWidth || cartonWidth <= 0 || !cartonHeight || cartonHeight <= 0 || !cartonDepth || cartonDepth <= 0) {
      toast.error("Please enter valid carton dimensions.");
      return;
    }
    if (!cartonWeight || cartonWeight <= 0) {
      toast.error("Please enter a valid carton weight.");
      return;
    }

    try {
      setLooseCartonSubmitting(true);
      setClosingCarton(looseCartonTarget.cartonSerial);
      const response = await closeLooseCarton({
        cartonSerial: looseCartonTarget.cartonSerial,
        action: "assign-new",
        quantity,
        cartonWidth,
        cartonHeight,
        cartonDepth,
        cartonWeight,
        packagingData: {
          cartonWidth,
          cartonHeight,
          cartonDepth,
          cartonWeight,
          maxCapacity: quantity,
        },
      });
      toast.success("Loose carton reassigned successfully!");

      if (response?.newCarton?.cartonSerial) {
        await handlePrint(response.newCarton, cartonWeight.toString(), { skipWeightCheck: true });
      }

      setOpenCartons((prev) => prev.filter((c) => c.cartonSerial !== looseCartonTarget.cartonSerial));
      resetLooseCartonFlow();
      onUpdate();
    } catch (e: any) {
      toast.error(e?.message || "Failed to assign a new carton");
    } finally {
      setLooseCartonSubmitting(false);
      setClosingCarton(null);
    }
  };

  const handlePrint = async (
    carton: Carton,
    overrideWeight?: string | number,
    options?: { skipWeightCheck?: boolean },
  ) => {
    setWeightError("");
    const weight = String(overrideWeight ?? cartonWeights[carton.cartonSerial] ?? "");
    if (!weight || parseFloat(weight) <= 0) {
      const message = "Please enter a valid weight for the carton!";
      setWeightError(message);
      toast.error(message);
      return;
    }

    const packagingSubStep = assignUserStage?.subSteps?.find((s: any) => s.isPackagingStatus);
    const packagingData = packagingSubStep?.packagingData || {};
    const recordedWeight = parseFloat(weight);
    const expectedWeight = parseFloat(packagingData.cartonWeight || "0");
    const toleranceKg = 0.5;

    if (!options?.skipWeightCheck && expectedWeight > 0) {
      const variance = Math.abs(recordedWeight - expectedWeight);
      if (variance > toleranceKg) {
        const message = `Weight mismatch! Expected ${expectedWeight} KG, got ${recordedWeight} KG.`;
        setWeightError(message);
        toast.error(message);
        return;
      }
    }

    setIsSavingWeight(carton.cartonSerial);
    try {
      // 1. Save weight
      await saveCartonWeight({
        cartonSerial: carton.cartonSerial,
        weight: recordedWeight
      });

      // 2. Update printing status in backend
      await updateCartonPrintingStatus(carton.cartonSerial);

      const printWindow = window.open("", "_blank", "width=800,height=600");
      if (printWindow) {
        const boxSize = `${packagingData.cartonWidth || carton.cartonSize?.width || 0}*${packagingData.cartonHeight || carton.cartonSize?.height || 0}*${packagingData.cartonDepth || carton.cartonSize?.depth || 0}cm`.toUpperCase();

        const processName = (product?.name || "Production Order").toUpperCase();
        const modelName = (product?.selectedProduct?.name || product?.name || "N/A").toUpperCase();
        const cartonNo = carton.cartonSerial;
        const quantity = carton.devices?.length || 0;

        // Use QR Code API for guaranteed rendering in print window
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${cartonNo}`;

        printWindow.document.write(`
          <html>
            <head>
              <title>Carton Sticker - ${cartonNo}</title>
              <style>
                @page { size: 80mm 40mm; margin: 0; }
                body { 
                  margin: 0; 
                  padding: 0; 
                  font-family: Arial, sans-serif;
                  background: white;
                  width: 80mm;
                  height: 40mm;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                }
                .sticker-box {
                  width: 78mm;
                  height: 38mm;
                  border: 2px solid black;
                  box-sizing: border-box;
                  display: flex;
                  flex-direction: column;
                  background: #fff;
                  overflow: hidden;
                }
                .header {
                  height: 7mm;
                  border-bottom: 1px solid black;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 14pt;
                  font-weight: 900;
                  text-align: center;
                }
                .content {
                  display: flex;
                  flex: 1;
                }
                .left-column {
                  width: 55%;
                  border-right: 1px solid black;
                  display: flex;
                  flex-direction: column;
                }
                .right-column {
                  width: 45%;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  padding: 0.5mm;
                }
                .data-row {
                  border-bottom: 1px solid black;
                  flex: 1;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  padding-left: 2mm;
                  min-height: 0;
                }
                .data-row:last-child {
                  border-bottom: none;
                }
                .label {
                  font-size: 6pt;
                  font-weight: bold;
                  color: #000;
                  line-height:1;
                }
                .value {
                  font-size: 9pt;
                  font-weight: 900;
                  color: #000;
                  line-height:1.2;
                }
                .qr-img {
                  width: 18mm;
                  height: 18mm;
                  display: block;
                }
                .serial-text {
                  font-size: 7pt;
                  font-weight: 900;
                  margin-top: 0.5mm;
                  text-align: center;
                  width: 100%;
                  display: block;
                }
                .qr-label {
                  font-size: 6pt;
                  font-weight: bold;
                  margin-bottom: 0.5mm;
                }
              </style>
            </head>
            <body>
              <div class="sticker-box">
                <div class="header">${processName}</div>
                <div class="content">
                  <div class="left-column">
                    <div class="data-row">
                      <div class="label">MODEL:</div>
                      <div class="value">${modelName}</div>
                    </div>
                    <div class="data-row">
                      <div class="label">DIMENSIONS:</div>
                      <div class="value">${boxSize}</div>
                    </div>
                    <div class="data-row">
                      <div class="label">QUANTITY:</div>
                      <div class="value">${quantity} PCS</div>
                    </div>
                    <div class="data-row">
                      <div class="label">WEIGHT:</div>
                      <div class="value">${weight} KG</div>
                    </div>
                  </div>
                  <div class="right-column">
                    <div class="qr-label">MCQ SERIAL:</div>
                    <img id="qr-img" src="${qrCodeUrl}" class="qr-img" onload="handleImageLoad()" />
                    <span class="serial-text">${cartonNo}</span>
                  </div>
                </div>
              </div>

              <script>
                let imageLoaded = false;
                function handleImageLoad() {
                  imageLoaded = true;
                  setTimeout(() => {
                    window.print();
                    window.close();
                  }, 500);
                }
                setTimeout(() => {
                  if (!imageLoaded) {
                    window.print();
                    window.close();
                  }
                }, 3000);
              </script>
            </body>
          </html>
        `);

        printWindow.document.close();
        setLocalCartonStatuses(prev => ({ ...prev, [carton.cartonSerial]: "Printed" }));
        toast.success(`Weight saved and sticker generated!`);
      }
    } catch (error) {
      console.error("Print failed:", error);
      const message =
        (error as any)?.message ||
        (error as any)?.response?.data?.message ||
        "Failed to save carton weight.";
      setWeightError(message);
      toast.error(message);
    } finally {
      setIsSavingWeight(null);
    }
  };

  const handleVerifyClick = (cartonSerial: string) => {
    setIsVerifying(cartonSerial);
    setScanValue("");
    setVerifyError("");
  };

  const handleVerifyScan = async () => {
    if (!isVerifying) return;

    if (scanValue.trim() !== isVerifying) {
      const message = "Scanned serial does not match!";
      setVerifyError(message);
      toast.error(message);
      setScanValue("");
      return;
    }

    try {
      const response = await verifyCartonSticker(isVerifying);
      if (response) {
        setLocalCartonStatuses(prev => ({ ...prev, [isVerifying]: "Verified" }));
        toast.success(`Carton ${isVerifying} verified!`);
        setIsVerifying(null);
        setScanValue("");
        setVerifyError("");
        onUpdate();
      }
    } catch (error) {
      console.error("Verification failed:", error);
      const message = "Verification failed. Please try again.";
      setVerifyError(message);
      toast.error(message);
    }
  };

  const handleMoveToNextStage = async () => {
    const allVerified = fullCartons.length > 0 && fullCartons.every(c => localCartonStatuses[c.cartonSerial] === "Verified");
    if (!allVerified) {
      toast.error("Verify all cartons first!");
      return;
    }

    setIsMovingStage(true);
    try {
      const cartonSerials = fullCartons.map(c => c.cartonSerial);

      if (isPDIStage) {
        for (const serial of cartonSerials) {
          const formData = new FormData();
          formData.append("selectedCarton", serial);
          const result = await shiftToNextCommonStage(processData?._id, formData);
          if (!result) {
            throw new Error("Shift failed.");
          }
        }
        toast.success("Cartons shifted to next stage!");
        onUpdate();
        onClose();
      } else {
        const data = await shiftToPDI(cartonSerials);

        if (data?.success) {
          toast.success("Ready for PDI stage!");
          onUpdate();
          onClose();
        } else {
          toast.error(data?.message || "Shift failed.");
        }
      }
    } catch (error: any) {
      console.error("Move failed:", error);
      toast.error(error?.response?.data?.message || "An error occurred during shift.");
    } finally {
      setIsMovingStage(false);
    }
  };

  const allVerified = fullCartons.length > 0 && fullCartons.every(c => localCartonStatuses[c.cartonSerial] === "Verified");

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isPDIStage ? "Carton PDI & Move" : "Carton Packaging & QC"}
      submitOption={isPDIStage}
      submitDisabled={!allVerified || isMovingStage}
      onSubmit={handleMoveToNextStage}
      submitText={isPDIStage ? "Move to Next Stage" : "Shift to PDI"}
      maxWidth="max-w-5xl"
    >
      <div className="flex flex-col gap-6">
        {/* Open/Loose Cartons Quick Access */}
        {openCartons.length > 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="mb-3 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-widest text-amber-700">
              <span>Open / Loose Cartons</span>
              {isLoadingOpen && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] text-amber-700">
                  Syncing in background
                </span>
              )}
            </div>
            <div className="space-y-3">
              {openCartons.map((c) => (
                <div key={c.cartonSerial} className="flex flex-col gap-2 rounded-xl bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Box className="h-4 w-4 text-amber-600" />
                    <div>
                      <div className="text-sm font-black text-gray-900">{c.cartonSerial}</div>
                      <div className="text-[10px] font-bold text-gray-400">
                        {c.devices?.length || 0} devices • {c.status || "partial"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => openLooseCartonFlow(c)}
                    disabled={closingCarton === c.cartonSerial}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-black text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {closingCarton === c.cartonSerial ? "OPENING..." : "CLOSE AS LOOSE"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {/* Verification Scanner Input */}
        {isVerifying && (
          <div className="rounded-xl border-2 border-blue-600 bg-blue-50 p-5 animate-in fade-in slide-in-from-top-4">
            <div className="sticky top-0 z-10 -mx-1 mb-3 flex flex-col gap-3 rounded-t-2xl bg-white/95 px-1 py-2 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <h4 className="text-sm font-black text-blue-900 flex items-center gap-2 uppercase tracking-tight">
                <QrCode className="h-4 w-4" />
                Scanning Carton Serial: {isVerifying}
              </h4>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsVerifying(null);
                    setScanValue("");
                    setVerifyError("");
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-600 transition-all hover:border-slate-300 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerifyScan}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
                >
                  Submit
                </button>
              </div>
            </div>
            {verifyError && (
              <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <input
                autoFocus
                type="text"
                value={scanValue}
                onChange={(e) => {
                  setScanValue(e.target.value);
                  if (verifyError) setVerifyError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyScan()}
                placeholder="Scan QR Code or Type Serial..."
                className="flex-1 rounded-xl border-2 border-blue-200 px-4 py-3 text-sm font-black focus:outline-none focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-blue-300"
              />
            </div>
          </div>
        )}

        {/* Cartons Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-xl bg-white">
          {weightError && (
            <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm font-semibold text-red-700">
              {weightError}
            </div>
          )}
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900 font-black uppercase tracking-widest text-white text-[10px]">
              <tr>
                <th className="px-6 py-5">Carton Serial</th>
                <th className="px-6 py-5 text-center">Net Qty</th>
                <th className="px-6 py-5">Size (cm)</th>
                <th className="px-6 py-5 w-48">Gross Weight (KG)</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-100 border-t-black" />
                      <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                        Syncing Carton Data...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : fullCartons.length > 0 ? (
                fullCartons.map((carton) => {
                  const status = localCartonStatuses[carton.cartonSerial] || carton.status || "Pending";
                  const isPrinted = status === "Printed" || status === "Verified";
                  const isVerified = status === "Verified";
                  const currentWeight = cartonWeights[carton.cartonSerial] || "";

                  const packagingSubStep = assignUserStage?.subSteps?.find((s: any) => s.isPackagingStatus);
                  const pkg = packagingSubStep?.packagingData || {};
                  const sizeWidth = carton?.cartonSize?.width || carton?.packagingData?.cartonWidth || pkg.cartonWidth || 0;
                  const sizeHeight = carton?.cartonSize?.height || carton?.packagingData?.cartonHeight || pkg.cartonHeight || 0;
                  const sizeDepth = carton?.cartonSize?.depth || carton?.packagingData?.cartonDepth || pkg.cartonDepth || 0;
                  const dim = `${sizeWidth}x${sizeHeight}x${sizeDepth}`;

                  return (
                    <tr key={carton.cartonSerial} className="group hover:bg-blue-50/30 transition-all duration-300">
                      <td className="px-6 py-5 font-black text-gray-950">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isVerified ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 opacity-60'}`}>
                            <Box className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span>{carton.cartonSerial}</span>
                            {carton.isLooseCarton && (
                              <span className="text-[9px] font-black text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded mt-0.5 w-fit">
                                LOOSE CARTON
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center font-black text-blue-700">
                        {carton.devices?.length || 0}
                      </td>
                      <td className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                        {dim}
                      </td>
                      <td className="px-6 py-5">
                        {isPrinted ? (
                          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-100 font-black text-sm">
                            <Scale className="h-3.5 w-3.5" />
                            {currentWeight} <span className="text-[10px] opacity-70">KG</span>
                          </div>
                        ) : (
                          <div className="relative group/input">
                            <input
                              type="number"
                              step="0.01"
                              value={currentWeight}
                              onChange={(e) => {
                                setCartonWeights({ ...cartonWeights, [carton.cartonSerial]: e.target.value });
                                if (weightError) setWeightError("");
                              }}
                              placeholder="0.00"
                              className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-2 text-sm font-black focus:border-black focus:bg-white outline-none transition-all pr-12"
                            />
                            <div className="absolute right-4 top-2 text-[10px] font-black text-gray-400">KG</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-wider ${isVerified
                          ? "bg-green-600 text-white shadow-lg shadow-green-100"
                          : isPrinted
                            ? "bg-amber-500 text-white shadow-lg shadow-amber-100"
                            : "bg-gray-100 text-gray-400"
                          }`}>
                          {isVerified ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : isPrinted ? (
                            <Printer className="h-3 w-3" />
                          ) : (
                            <Box className="h-3 w-3" />
                          )}
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-3">
                          {!isVerified && (
                            <button
                              disabled={!currentWeight || isSavingWeight === carton.cartonSerial}
                              onClick={() => handlePrint(carton)}
                              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black transition-all active:scale-95 ${currentWeight && isSavingWeight !== carton.cartonSerial
                                  ? "bg-black text-white hover:bg-gray-800 shadow-lg shadow-gray-200"
                                  : "bg-gray-100 text-gray-300 cursor-not-allowed border-2 border-gray-50"
                                }`}
                            >
                              {isSavingWeight === carton.cartonSerial ? (
                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              ) : (
                                <Printer className="h-3.5 w-3.5" />
                              )}
                              {isPrinted ? "RE-PRINT" : "PRINT"}
                            </button>
                          )}
                          {isPrinted && !isVerified && (
                            <button
                              onClick={() => handleVerifyClick(carton.cartonSerial)}
                              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-black text-white hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 border-b-4 border-blue-900"
                            >
                              <QrCode className="h-3.5 w-3.5" />
                              VERIFY
                            </button>
                          )}
                          {isVerified && (
                            <div className="flex items-center gap-2 text-green-600 font-black text-xs px-3 py-2 bg-green-50 rounded-xl border border-green-100">
                              <CheckCircle className="h-4 w-4" />
                              OK
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-300">
                      <Box className="h-12 w-12 stroke-[1px] opacity-20" />
                      <p className="text-sm font-black uppercase tracking-widest opacity-30">Warehouse Buffer Empty</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Action Button */}
        <div className="flex flex-col items-center gap-4 pt-6 border-t-2 border-gray-50">
          {!isPDIStage && (
            <button
              onClick={handleMoveToNextStage}
              disabled={!allVerified || isMovingStage}
              className={`flex items-center gap-3 rounded-2xl px-16 py-5 font-black uppercase text-sm tracking-[0.2em] text-white transition-all active:scale-95 ${allVerified && !isMovingStage
                ? "bg-green-600 hover:bg-green-700 shadow-2xl shadow-green-200 border-b-4 border-green-900"
                : "bg-gray-200 text-gray-400 cursor-not-allowed grayscale"
                }`}
            >
              {isMovingStage ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <ArrowRightCircle className="h-6 w-6" />
              )}
              Shift to PDI
            </button>
          )}
          {!allVerified && fullCartons.length > 0 && (
            <div className="flex items-center gap-2 text-[11px] font-black text-amber-600 bg-amber-50 px-5 py-2 rounded-full border border-amber-200 animate-pulse">
              <AlertCircle className="h-4 w-4" />
              PENDING: WEIGHING & QR VERIFICATION REQUIRED
            </div>
          )}
        </div>
      </div>
    </Modal>
    <Modal
      isOpen={!!looseCartonTarget}
      onClose={resetLooseCartonFlow}
      title={
        looseCartonStep === "choice"
          ? `Close As Loose Carton - ${looseCartonTarget?.cartonSerial || ""}`
          : `Assign New Carton - ${looseCartonTarget?.cartonSerial || ""}`
      }
      submitOption={false}
      maxWidth="max-w-2xl"
    >
      {looseCartonTarget && looseCartonStep === "choice" ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <div className="text-sm font-black text-amber-900">Partial carton detected</div>
            <div className="mt-1 text-xs font-semibold text-amber-700">
              {looseCartonTarget.cartonSerial} has {looseCartonTarget.devices?.length || 0} device(s).
              Choose how to handle this carton now.
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleProceedLooseExisting}
              disabled={looseCartonSubmitting}
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-left transition hover:bg-emerald-100 disabled:opacity-50"
            >
              <div className="text-sm font-black text-emerald-900">Proceed with Existing Carton</div>
              <div className="mt-1 text-xs font-semibold text-emerald-700">
                Keep the current partial carton flow and close it as loose.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setLooseCartonStep("assign")}
              disabled={looseCartonSubmitting}
              className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-left transition hover:bg-blue-100 disabled:opacity-50"
            >
              <div className="text-sm font-black text-blue-900">Assign New Carton</div>
              <div className="mt-1 text-xs font-semibold text-blue-700">
                Choose new dimensions, weight, and quantity before generating the new sticker.
              </div>
            </button>
          </div>
        </div>
      ) : looseCartonTarget ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quantity</div>
                <input
                  type="number"
                  min={1}
                  max={looseCartonTarget.devices?.length || 1}
                  value={looseCartonForm.quantity}
                  onChange={(e) => setLooseCartonForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500"
                />
                <div className="text-[11px] font-semibold text-slate-500">
                  Must be between 1 and {looseCartonTarget.devices?.length || 0}.
                </div>
                <div className="text-[11px] font-semibold text-slate-400">
                  The selected quantity will move into the new carton. Any remainder stays on the current partial carton.
                </div>
              </label>
              <label className="space-y-1">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gross Weight (KG)</div>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={looseCartonForm.cartonWeight}
                  onChange={(e) => setLooseCartonForm((prev) => ({ ...prev, cartonWeight: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </label>
              <label className="space-y-1">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Width (cm)</div>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={looseCartonForm.cartonWidth}
                  onChange={(e) => setLooseCartonForm((prev) => ({ ...prev, cartonWidth: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </label>
              <label className="space-y-1">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Height (cm)</div>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={looseCartonForm.cartonHeight}
                  onChange={(e) => setLooseCartonForm((prev) => ({ ...prev, cartonHeight: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Depth (cm)</div>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={looseCartonForm.cartonDepth}
                  onChange={(e) => setLooseCartonForm((prev) => ({ ...prev, cartonDepth: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setLooseCartonStep("choice")}
              disabled={looseCartonSubmitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleAssignNewCarton}
              disabled={looseCartonSubmitting}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {looseCartonSubmitting ? "Saving..." : "Create & Print Sticker"}
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
    </>
  );
};

export default CartonDetailsPopup;
