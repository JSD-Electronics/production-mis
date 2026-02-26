"use client";
import React, { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  viewProduct,
  viewProcessByProductId,
  createDevice,
  getLastEntryBasedUponPrefixAndSuffix,
  getDeviceCountByProcessId,
} from "@/lib/api";
import {
  Package,
  Workflow,
  Hash,
  PlusSquare,
  XCircle,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Download,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const GenerateSerialComponent = () => {
  const [products, setProduct] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [productId, setProductId] = useState("");
  const [processId, setProcessId] = useState("");
  const [serials, setSerials] = useState<string[]>([]);
  const [lastSerialNo, setLastSerialNo] = useState("");
  const [isGenerateSerials, setIsGenerateSerials] = useState(false);
  const [enableZero, setEnabledZero] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);

  const [form, setForm] = useState({
    prefix: "ABC-",
    noOfSerialRequired: 0,
    suffix: "-X",
    noOfZeroRequired: 0,
    startFrom: 1,
  });

  useEffect(() => {
    const pathParts = window.location.pathname.split("/");
    let pid = "";
    let procId = "";
    if (pathParts.length >= 5) {
      pid = pathParts[3];
      procId = pathParts[4];
      setProductId(pid);
      setProcessId(procId);
    }
    getProcess(pid, procId);
    getProduct();
  }, []);

  const getProcess = async (id: any, procId?: string) => {
    try {
      let result = await viewProcessByProductId(id);
      setProcesses(result.Processes);

      if (procId) {
        const process = result.Processes?.find((p: any) => p._id === procId);
        if (process && process.quantity) {
          setForm((prev) => ({
            ...prev,
            noOfSerialRequired: parseInt(process.quantity) || 0,
          }));
        }

        // Fetch generated count
        const countRes = await getDeviceCountByProcessId(procId);
        if (countRes.status === 200) {
          setGeneratedCount(countRes.count);
        }
      }
    } catch (error: any) {
      console.error(`Error Fetching Process: ${error?.message}`);
    }
  };

  const getProduct = async () => {
    try {
      let result = await viewProduct();
      setProduct(result.Products);
    } catch (error) {
      console.error(`Error Fetching Products: ${error}`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target;
    let val = type === "checkbox" ? checked : value;

    if (name === "noOfSerialRequired" || name === "noOfZeroRequired" || name === "startFrom") {
      const numericVal = parseInt(val as string, 10);
      if (name === "noOfSerialRequired") {
        if (numericVal > 5000) {
          val = "5000";
          toast.error("Value should be below 5000");
        } else if (numericVal < 0) {
          val = "0";
          toast.error("Value cannot be negative");
        }
      }
      if (name === "noOfZeroRequired") {
        if (!enableZero) val = "0";
        if (numericVal > 15) {
          val = "15";
          toast.error("Value should be below 15");
        } else if (numericVal < 0) {
          val = "0";
          toast.error("Value cannot be negative");
        }
      }
      if (name === "startFrom") {
        const strVal = val as string;
        if (strVal.length > 7) {
          const header = strVal.substring(0, 7);
          const sequence = strVal.substring(7);

          setForm((prev) => {
            let newPrefix = prev.prefix;
            if (header && !newPrefix.endsWith(header)) {
              newPrefix = newPrefix + header;
            }
            return {
              ...prev,
              prefix: newPrefix,
              [name]: parseInt(sequence, 10) || 1,
              noOfZeroRequired:
                sequence.length > 0 ? sequence.length : prev.noOfZeroRequired,
            };
          });
          setEnabledZero(true);
          return;
        }
        if (numericVal < 1) {
          val = "1";
        }
      }
    }

    setForm((prevForm) => ({ ...prevForm, [name]: val }));
  };

  const handleFetchLastSerial = async () => {
    try {
      const response = await getLastEntryBasedUponPrefixAndSuffix(
        form.prefix,
        form.suffix
      );
      const lastEntry = response.data;
      if (lastEntry) {
        const lastSerial = lastEntry.serialNo;

        // Remove Prefix and Suffix to find the core sequence part
        let corePart = lastSerial;
        if (form.prefix && corePart.startsWith(form.prefix)) {
          corePart = corePart.substring(form.prefix.length);
        }
        if (form.suffix && corePart.endsWith(form.suffix)) {
          corePart = corePart.substring(
            0,
            corePart.length - form.suffix.length
          );
        }

        // Extract digits from the core part
        const match = corePart.match(/\d+/);
        if (match) {
          const numStr = match[0];
          let header = "";
          let sequenceStr = numStr;

          // OC/YR/WK splitting logic (if not already stripped by prefix)
          if (numStr.length > 7) {
            header = numStr.substring(0, 7);
            sequenceStr = numStr.substring(7);
          }

          const nextSeq = parseInt(sequenceStr, 10) + 1;
          const seqLength = sequenceStr.length;

          setForm((prev) => {
            let newPrefix = prev.prefix;
            if (header && !newPrefix.endsWith(header)) {
              newPrefix = newPrefix + header;
            }
            return {
              ...prev,
              prefix: newPrefix,
              startFrom: nextSeq,
              noOfZeroRequired: seqLength,
            };
          });

          if (seqLength > 0) {
            setEnabledZero(true);
          }

          setLastSerialNo(lastSerial);
          toast.info(`Suggested next series: ${nextSeq}`);
        } else {
          toast.warning("Could not extract numeric part from last serial.");
        }
      } else {
        toast.info("No existing serials found for this prefix/suffix. Starting from 1.");
        setForm(prev => ({ ...prev, startFrom: 1 }));
      }
    } catch (error) {
      toast.error("Failed to fetch last serial.");
    }
  };

  async function generateSerials(
    prefix: string,
    noOfSerialRequired: number,
    suffix: string,
    noOfZeroRequired: number,
    startFrom: number,
  ) {
    const generatedSerials: string[] = [];
    const end = startFrom + noOfSerialRequired;

    for (let i = startFrom; i < end; i++) {
      const paddedNumber = enableZero
        ? String(i).padStart(noOfZeroRequired, "0")
        : i;
      generatedSerials.push(`${prefix}${paddedNumber}${suffix}`);
    }
    setSerials(generatedSerials);
  }

  const handleGenerateSerials = async () => {
    const remainingCount = Math.max(0, form.noOfSerialRequired - generatedCount);
    if (remainingCount > 0) {
      generateSerials(
        form.prefix,
        remainingCount,
        form.suffix,
        form.noOfZeroRequired,
        parseInt(form.startFrom as any) || 1
      );
      setIsGenerateSerials(true);
    } else {
      toast.error("No more serials required for this process!");
    }
  };

  const handleDownloadSerials = () => {
    if (serials.length === 0) {
      toast.error("No serials to download");
      return;
    }

    const csvContent = "Serial Number\n" + serials.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `serials_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlesubmit = async () => {
    try {
      setSubmitting(true);
      let product: any = products.find((value: any) => value._id == productId);
      let stage = product?.stages?.[0]?.stageName || "";

      const remainingCount = Math.max(0, form.noOfSerialRequired - generatedCount);
      let formData = new FormData();
      formData.append("selectedProduct", productId);
      formData.append("prefix", form.prefix);
      formData.append("noOfSerialRequired", remainingCount.toString());
      formData.append("lastSerialNo", lastSerialNo);
      formData.append("suffix", form.suffix);
      formData.append("noOfZeroRequired", form.noOfZeroRequired.toString());
      formData.append("startFrom", form.startFrom.toString());
      formData.append("enableZero", enableZero.toString());
      formData.append("processId", processId);
      formData.append("currentStage", stage);

      let result = await createDevice(formData);
      if (result?.status === 200) {
        toast.success(result?.message || "Device Created Successfully!");
      } else {
        throw new Error(result?.message || "Failed to create Device");
      }
    } catch (error: any) {
      console.error("Error Creating Device:", error);
      toast.error(error.message || "Failed to create Device");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-center" />
      <Breadcrumb pageName="Generate Serials" parentName="Device Management" />

      <div className="mt-6 space-y-6 pb-10">
        {/* Compact Header Summary Card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-boxdark ring-1 ring-black/5">
          <div className="bg-gradient-to-r from-primary to-indigo-600 px-6 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                  <Workflow className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight leading-none">Production Queue</h2>
                  <p className="mt-1 text-[10px] font-bold text-primary-100/60 uppercase tracking-widest">Active Serial Sequence Config</p>
                </div>
              </div>

              <div className="flex items-center gap-5 bg-black/10 backdrop-blur-md rounded-xl px-5 py-2.5 ring-1 ring-white/10">
                <div className="text-center">
                  <p className="text-[9px] font-bold text-primary-100/60 uppercase tracking-tighter">Target</p>
                  <p className="text-sm font-black text-white">{form.noOfSerialRequired}</p>
                </div>
                <div className="h-6 w-px bg-white/10"></div>
                <div className="text-center">
                  <p className="text-[9px] font-bold text-primary-100/60 uppercase tracking-tighter">Generated</p>
                  <p className="text-sm font-black text-white">{generatedCount}</p>
                </div>
                <div className="h-6 w-px bg-white/10"></div>
                <div className="text-center">
                  <p className="text-[9px] font-bold text-primary-100/60 uppercase tracking-tighter text-yellow-300">Remaining</p>
                  <p className="text-sm font-black text-yellow-300">{Math.max(0, form.noOfSerialRequired - generatedCount)}</p>
                </div>
                <div className="h-6 w-px bg-white/10"></div>
                <div className="text-center min-w-[40px]">
                  <p className="text-[9px] font-bold text-white/50 uppercase tracking-tighter">Completion</p>
                  <p className="text-sm font-black text-white">
                    {Math.min(100, Math.round((generatedCount / form.noOfSerialRequired) * 100))}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar Strip */}
          <div className="h-1 w-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(60,80,224,0.4)]"
              style={{ width: `${Math.min(100, (generatedCount / form.noOfSerialRequired) * 100)}%` }}
            ></div>
          </div>

          {/* Integrated Metadata Strip */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 bg-gray-50/50 px-6 py-3 dark:bg-meta-4/20 border-b border-gray-100 dark:border-strokedark">
            <div className="flex items-center gap-2">
              <Package size={14} className="text-primary opacity-60" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product:</span>
              <span className="text-xs font-black text-gray-900 dark:text-white">
                {products?.find((p: any) => p._id === productId)?.name || "N/A"}
              </span>
            </div>
            <div className="hidden h-3 w-px bg-gray-200 dark:bg-strokedark sm:block"></div>
            <div className="flex items-center gap-2">
              <Workflow size={14} className="text-primary opacity-60" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Process:</span>
              <span className="text-xs font-black text-gray-900 dark:text-white">
                {processes?.find((p: any) => p._id === processId)?.name || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left: Input Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5 dark:bg-boxdark">
              <h3 className="mb-6 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white border-b border-gray-100 pb-4 dark:border-strokedark">
                <Hash size={16} className="text-primary" /> General Formatting
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Prefix String</label>
                  <input
                    type="text"
                    name="prefix"
                    value={form.prefix}
                    onChange={handleChange}
                    placeholder="ABC-"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all dark:border-strokedark dark:bg-form-input dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Suffix String</label>
                  <input
                    type="text"
                    name="suffix"
                    value={form.suffix}
                    onChange={handleChange}
                    placeholder="-X"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all dark:border-strokedark dark:bg-form-input dark:text-white"
                  />
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-4">
                    <label className="flex cursor-pointer items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={enableZero}
                        onChange={() => setEnabledZero(!enableZero)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                      Leading Zeros
                    </label>
                    {enableZero && (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">ACTIVE</span>
                    )}
                  </div>
                  {enableZero && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <input
                        type="number"
                        name="noOfZeroRequired"
                        min={0}
                        max={15}
                        value={form.noOfZeroRequired}
                        onChange={handleChange}
                        placeholder="Total Digits"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all dark:border-strokedark dark:bg-form-input dark:text-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5 dark:bg-boxdark">
              <h3 className="mb-6 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white border-b border-gray-100 pb-4 dark:border-strokedark">
                <PlusSquare size={16} className="text-primary" /> Sequencing
              </h3>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Start Sequence From</label>
                    <button
                      type="button"
                      onClick={handleFetchLastSerial}
                      className="text-[10px] font-bold text-primary hover:underline hover:text-primary/80 transition uppercase tracking-widest"
                    >
                      Fetch Auto
                    </button>
                  </div>
                  <input
                    type="number"
                    name="startFrom"
                    min={1}
                    value={form.startFrom}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all dark:border-strokedark dark:bg-form-input dark:text-white"
                  />
                  <p className="mt-2 text-[10px] text-gray-400 font-medium italic">* Incremental start point for the batch</p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateSerials}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-50 px-8 py-4 text-sm font-black uppercase tracking-widest text-indigo-600 ring-1 ring-indigo-200 transition-all hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-200 active:scale-95 disabled:opacity-50"
                  disabled={Math.max(0, form.noOfSerialRequired - generatedCount) === 0}
                >
                  <PlusSquare className="h-4 w-4" /> Preview Generation
                </button>
              </div>
            </div>
          </div>

          {/* Right: Preview Output */}
          <div className="lg:col-span-8">
            <div className="h-full flex flex-col rounded-3xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-boxdark">
              <div className="flex items-center justify-between border-b border-gray-100 p-8 dark:border-strokedark">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">
                    <FileSpreadsheet size={16} className="text-primary" /> Generation Preview
                  </h3>
                  {serials.length > 0 && (
                    <span className="mt-1 block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Ready for finalization: {serials.length} records
                    </span>
                  )}
                </div>

                {serials.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadSerials}
                    className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-blue-600 ring-1 ring-blue-200 transition hover:bg-blue-600 hover:text-white active:scale-95"
                  >
                    <Download className="h-3 w-3" /> Export List
                  </button>
                )}
              </div>

              <div className="flex-1 p-8">
                {serials.length > 0 ? (
                  <div className="custom-scrollbar max-h-[500px] overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50/50 p-6 dark:border-strokedark dark:bg-gray-900">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                      {serials.map((serial, index) => (
                        <div
                          key={index}
                          className="group relative overflow-hidden rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-200 transition-all hover:ring-primary/30 hover:shadow-md dark:bg-meta-4 dark:ring-strokedark"
                        >
                          <div className="relative z-10 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1 select-none">#{index + 1}</span>
                            <span className="text-[11px] font-black text-gray-900 dark:text-white tracking-wide truncate w-full text-center">
                              {serial}
                            </span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/5 text-primary/20">
                      <AlertTriangle size={48} strokeWidth={1} />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">Awaiting Configuration</h4>
                    <p className="mt-1 max-w-[280px] text-xs font-medium text-gray-400 leading-relaxed">
                      Adjust your serial parameters on the left and click "Preview Generation" to visualize your batch.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 p-8 dark:border-strokedark">
                <button
                  type="button"
                  onClick={() => {
                    setSerials([]);
                    setIsGenerateSerials(false);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-gray-50 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 ring-1 ring-gray-200 transition hover:bg-gray-100 hover:text-gray-900 dark:bg-gray-700 dark:text-gray-300 dark:ring-strokedark"
                >
                  <XCircle size={14} /> Clear Preview
                </button>

                {isGenerateSerials && (
                  <button
                    type="button"
                    onClick={handlesubmit}
                    disabled={submitting}
                    className={`flex items-center gap-2 rounded-xl px-8 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 ${submitting
                      ? "bg-emerald-400 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-200 hover:-translate-y-0.5"
                      }`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Committing to Cloud...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} /> Finalize & Save Batch
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GenerateSerialComponent;
