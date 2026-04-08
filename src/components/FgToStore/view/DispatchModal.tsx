"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  createDispatchInvoice,
  confirmDispatchInvoice,
  cancelDispatchInvoice,
  generateDispatchGatePass,
  getDispatchInvoiceById,
} from "@/lib/api";
import { toast } from "react-toastify";
import { CheckSquare, FileText, Printer, ScanLine, Trash2, Truck, X } from "lucide-react";

type Props = {
  isOpen: boolean;
  process: any | null;
  cartons: any[];
  initialInvoice?: any | null;
  onClose: () => void;
  onRefresh: () => Promise<void>;
};

const openHtmlForPrint = (html: string, title = "Gate Pass") => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("Please allow popups to print the gate pass");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.document.title = title;
  setTimeout(() => printWindow.print(), 400);
};

const fieldClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

const sectionTitleClass =
  "text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500";

const DispatchModal = ({ isOpen, process, cartons, initialInvoice = null, onClose, onRefresh }: Props) => {
  const leftScrollRef = useRef<HTMLDivElement | null>(null);
  const reservedInvoiceCartons = useMemo(
    () => new Set((initialInvoice?.selectedCartons || []).map((carton: any) => String(carton?.cartonSerial || ""))),
    [initialInvoice],
  );
  const readyCartons = useMemo(
    () =>
      cartons.filter(
        (carton) =>
          String(carton?.cartonStatus || carton?.status || "") === "STOCKED" &&
          (!String(carton?.dispatchStatus || "").trim() ||
            String(carton?.dispatchStatus || "") === "READY"),
      ),
    [cartons],
  );
  const draftCartons = useMemo(
    () =>
      cartons.filter(
        (carton) =>
          String(carton?.cartonStatus || carton?.status || "") === "STOCKED" &&
          reservedInvoiceCartons.has(String(carton?.cartonSerial || "")),
      ),
    [cartons, reservedInvoiceCartons],
  );
  const availableCartons = useMemo(() => {
    const seen = new Map<string, any>();
    [...draftCartons, ...readyCartons].forEach((carton) => {
      const serial = String(carton?.cartonSerial || "");
      if (serial) seen.set(serial, carton);
    });
    return Array.from(seen.values());
  }, [draftCartons, readyCartons]);

  const [selectedCartons, setSelectedCartons] = useState<string[]>([]);
  const [invoice, setInvoice] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scanCartonSerial, setScanCartonSerial] = useState("");
  const [form, setForm] = useState({
    invoiceNumber: "",
    customerName: "",
    ewayBillNo: "",
    contactPerson: "",
    customerEmail: "",
    customerPhone: "",
    dispatchDate: new Date().toISOString().slice(0, 10),
    invoiceDate: new Date().toISOString().slice(0, 10),
    logisticsDetails: {
      transporterName: "",
      transportMode: "",
      vehicleNumber: "",
      referenceNumber: "",
    },
    remarks: "",
    includeImeiList: true,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (initialInvoice?._id) {
      setInvoice(initialInvoice);
      setScanCartonSerial("");
      setSelectedCartons(
        (initialInvoice.selectedCartons || [])
          .map((carton: any) => String(carton?.cartonSerial || ""))
          .filter(Boolean),
      );
      setForm({
        invoiceNumber: initialInvoice.invoiceNumber || "",
        customerName: initialInvoice.customerName || "",
        ewayBillNo: initialInvoice.ewayBillNo || "",
        contactPerson: initialInvoice.contactPerson || "",
        customerEmail: initialInvoice.customerEmail || "",
        customerPhone: initialInvoice.customerPhone || "",
        dispatchDate: initialInvoice.dispatchDate
          ? new Date(initialInvoice.dispatchDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        invoiceDate: initialInvoice.invoiceDate
          ? new Date(initialInvoice.invoiceDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        logisticsDetails: {
          transporterName: initialInvoice?.logisticsDetails?.transporterName || "",
          transportMode: initialInvoice?.logisticsDetails?.transportMode || "",
          vehicleNumber: initialInvoice?.logisticsDetails?.vehicleNumber || "",
          referenceNumber: initialInvoice?.logisticsDetails?.referenceNumber || "",
        },
        remarks: initialInvoice.remarks || (process?.name ? `Dispatch from ${process.name}` : ""),
        includeImeiList: true,
      });
    } else {
      setScanCartonSerial("");
      setSelectedCartons([]);
      setInvoice(null);
      setForm({
        invoiceNumber: "",
        customerName: "",
        ewayBillNo: "",
        contactPerson: "",
        customerEmail: "",
        customerPhone: "",
        dispatchDate: new Date().toISOString().slice(0, 10),
        invoiceDate: new Date().toISOString().slice(0, 10),
        logisticsDetails: {
          transporterName: "",
          transportMode: "",
          vehicleNumber: "",
          referenceNumber: "",
        },
        remarks: process?.name ? `Dispatch from ${process.name}` : "",
        includeImeiList: true,
      });
    }
    requestAnimationFrame(() => {
      if (leftScrollRef.current) leftScrollRef.current.scrollTo({ top: 0, behavior: "auto" });
    });
  }, [isOpen, process?.name, process?._id, readyCartons, initialInvoice]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const selectedCartonDetails = availableCartons.filter((carton) =>
    selectedCartons.includes(carton.cartonSerial),
  );
  const invoiceStatus = String(invoice?.status || "").trim().toUpperCase();
  const totalQuantity = selectedCartonDetails.reduce(
    (sum, carton) => sum + Number(carton.devices?.length || 0),
    0,
  );

  const removeSelectedCarton = (cartonSerial: string) => {
    if (invoice) return;
    setSelectedCartons((prev) => prev.filter((value) => value !== cartonSerial));
  };

  const handleScanCarton = () => {
    if (invoice) return;
    const scanned = scanCartonSerial.trim();
    if (!scanned) {
      toast.error("Enter or scan a carton serial");
      return;
    }

    const matchedCarton = availableCartons.find(
      (carton) => String(carton?.cartonSerial || "").toLowerCase() === scanned.toLowerCase(),
    );

    if (!matchedCarton) {
      toast.error("Scanned carton is not available in this process");
      return;
    }

    setSelectedCartons((prev) =>
      prev.includes(matchedCarton.cartonSerial) ? prev : [...prev, matchedCarton.cartonSerial],
    );
    setScanCartonSerial("");
  };

  const handleCreateDraft = async () => {
    if (!form.invoiceNumber.trim() || !form.customerName.trim()) {
      toast.error("Invoice number and company name are required");
      return;
    }
    if (selectedCartons.length === 0) {
      toast.error("Select at least one stocked carton");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createDispatchInvoice({
        invoiceNumber: form.invoiceNumber.trim(),
        customerName: form.customerName.trim(),
        contactPerson: form.contactPerson.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim(),
        ewayBillNo: form.ewayBillNo.trim(),
        logisticsDetails: {
          transporterName: form.logisticsDetails.transporterName.trim(),
          transportMode: form.logisticsDetails.transportMode.trim(),
          vehicleNumber: form.logisticsDetails.vehicleNumber.trim(),
          referenceNumber: form.logisticsDetails.referenceNumber.trim(),
        },
        dispatchDate: form.dispatchDate,
        invoiceDate: form.invoiceDate,
        cartonSerials: selectedCartons,
        remarks: form.remarks.trim(),
        pricingSummary: {
          currency: "INR",
          subtotal: 0,
          taxAmount: 0,
          discountAmount: 0,
          otherCharges: 0,
          grandTotal: 0,
        },
      });
      setInvoice(result?.data || result);
      toast.success(result?.message || "Dispatch draft created");
      await onRefresh();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create dispatch draft");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!invoice?._id) return;
    setSubmitting(true);
    try {
      const result = await cancelDispatchInvoice(invoice._id);
      toast.success(result?.message || "Dispatch draft cancelled");
      await onRefresh();
      onClose();
      setInvoice(result?.data || result);
    } catch (error: any) {
      toast.error(error?.message || "Failed to cancel dispatch draft");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!invoice?._id) return;
    if (invoiceStatus !== "DRAFT") {
      toast.info("This invoice is no longer in draft state.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await confirmDispatchInvoice(invoice._id, {
        includeImeiList: form.includeImeiList,
      });
      setInvoice(result?.data || result);
      toast.success(result?.message || "Dispatch confirmed successfully");
      await onRefresh();
    } catch (error: any) {
      const message = String(error?.message || error?.error || "").trim();
      if (
        message.toLowerCase().includes("only draft invoices can be confirmed") &&
        invoice?._id
      ) {
        try {
          const latest = await getDispatchInvoiceById(invoice._id);
          setInvoice(latest?.data || latest);
          toast.info("Invoice status was updated. Loaded latest details.");
          await onRefresh();
        } catch {
          toast.error("Invoice is no longer draft. Please refresh.");
        }
      } else {
        toast.error(message || "Failed to confirm dispatch");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = async () => {
    if (!invoice?._id) return;
    setSubmitting(true);
    try {
      const result = await generateDispatchGatePass(invoice._id, {
        includeImeiList: form.includeImeiList,
      });
      const data = result?.data || result;
      if (!data?.html) {
        toast.error("Gate pass content is not available");
        return;
      }
      openHtmlForPrint(data.html, `Gate Pass ${invoice?.gatePassNumber || ""}`.trim());
    } catch (error: any) {
      toast.error(error?.message || "Failed to generate gate pass");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
      style={{ zIndex: 2147483647 }}
      onClick={onClose}
    >
      <div className="flex min-h-screen items-start justify-center p-2 sm:p-4">
        <div
          className="mt-2 flex h-[calc(100vh-1rem)] max-h-[860px] w-[min(1120px,calc(100vw-1rem))] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.28)] sm:mt-0 sm:h-[calc(100vh-2rem)]"
          style={{ zIndex: 2147483647 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                Dispatch From Stock
              </p>
              <h2 className="mt-1 text-[18px] font-black text-slate-900 sm:text-[22px]">
                {process?.name || "Process"}
              </h2>
              <p className="mt-1 text-[12px] text-slate-500">
                Draft the invoice, reserve cartons, then confirm dispatch.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_250px] xl:grid-cols-[minmax(0,1fr)_270px]">
            <div ref={leftScrollRef} className="min-h-0 overflow-y-auto bg-slate-50/60 p-3 sm:p-4">
              <div className="space-y-3">
                <section className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className={sectionTitleClass}>Invoice Details</p>
                      <p className="mt-1 text-[12px] text-slate-500">Invoice, company, contact, date, and logistics information.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {availableCartons.length} cartons available
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Invoice Number</span>
                      <input type="text" value={form.invoiceNumber} disabled={!!invoice} onChange={(e) => setForm((prev) => ({ ...prev, invoiceNumber: e.target.value }))} className={fieldClass} />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">E-Way Bill No</span>
                      <input type="text" value={form.ewayBillNo} disabled={!!invoice} onChange={(e) => setForm((prev) => ({ ...prev, ewayBillNo: e.target.value }))} className={fieldClass} />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Company Name</span>
                      <input type="text" value={form.customerName} disabled={!!invoice} onChange={(e) => setForm((prev) => ({ ...prev, customerName: e.target.value }))} className={fieldClass} />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Contact Person</span>
                      <input type="text" value={form.contactPerson} disabled={!!invoice} onChange={(e) => setForm((prev) => ({ ...prev, contactPerson: e.target.value }))} className={fieldClass} />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Email</span>
                      <input type="email" value={form.customerEmail} disabled={!!invoice} onChange={(e) => setForm((prev) => ({ ...prev, customerEmail: e.target.value }))} className={fieldClass} />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Phone Number</span>
                      <input type="text" value={form.customerPhone} disabled={!!invoice} onChange={(e) => setForm((prev) => ({ ...prev, customerPhone: e.target.value }))} className={fieldClass} />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Dispatch Date</span>
                      <input type="date" value={form.dispatchDate} disabled={!!invoice} onChange={(e) => setForm((prev) => ({ ...prev, dispatchDate: e.target.value }))} className={fieldClass} />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Invoice Date</span>
                      <input type="date" value={form.invoiceDate} disabled={!!invoice} onChange={(e) => setForm((prev) => ({ ...prev, invoiceDate: e.target.value }))} className={fieldClass} />
                    </label>
                  </div>
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Logistics Details</p>
                      <p className="mt-1 text-[12px] text-slate-500">Capture valid transporter details instead of free text.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Transporter Name</span>
                        <input
                          type="text"
                          value={form.logisticsDetails.transporterName}
                          disabled={!!invoice}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              logisticsDetails: { ...prev.logisticsDetails, transporterName: e.target.value },
                            }))
                          }
                          className={fieldClass}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Transport Mode</span>
                        <select
                          value={form.logisticsDetails.transportMode}
                          disabled={!!invoice}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              logisticsDetails: { ...prev.logisticsDetails, transportMode: e.target.value },
                            }))
                          }
                          className={fieldClass}
                        >
                          <option value="">Select Mode</option>
                          <option value="Road">Road</option>
                          <option value="Air">Air</option>
                          <option value="Rail">Rail</option>
                          <option value="Courier">Courier</option>
                          <option value="Hand Delivery">Hand Delivery</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Vehicle Number</span>
                        <input
                          type="text"
                          value={form.logisticsDetails.vehicleNumber}
                          disabled={!!invoice}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              logisticsDetails: { ...prev.logisticsDetails, vehicleNumber: e.target.value.toUpperCase() },
                            }))
                          }
                          className={fieldClass}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">LR / Reference No</span>
                        <input
                          type="text"
                          value={form.logisticsDetails.referenceNumber}
                          disabled={!!invoice}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              logisticsDetails: { ...prev.logisticsDetails, referenceNumber: e.target.value },
                            }))
                          }
                          className={fieldClass}
                        />
                      </label>
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className={sectionTitleClass}>Carton Selection</p>
                      <p className="mt-1 text-[12px] text-slate-500">Scan or enter carton serials to build the dispatch list. Only scanned cartons will appear below.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {selectedCartons.length} selected
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
                    <input
                      type="text"
                      value={scanCartonSerial}
                      disabled={!!invoice}
                      onChange={(e) => setScanCartonSerial(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleScanCarton();
                        }
                      }}
                      placeholder="Scan or enter carton serial"
                      className={fieldClass}
                    />
                    <button
                      type="button"
                      disabled={!!invoice}
                      onClick={handleScanCarton}
                      className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ScanLine className="h-4 w-4" />
                      Add Carton
                    </button>
                  </div>
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Selected Cartons</p>
                    {selectedCartons.length === 0 ? (
                      <p className="mt-2 text-[12px] text-slate-400">No cartons selected yet.</p>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedCartons.map((cartonSerial) => (
                          <span
                            key={cartonSerial}
                            className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700"
                          >
                            {cartonSerial}
                            {!invoice ? (
                              <button
                                type="button"
                                onClick={() => removeSelectedCarton(cartonSerial)}
                                className="rounded-full p-0.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                aria-label={`Remove ${cartonSerial}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            ) : null}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Available cartons in this process: <span className="font-semibold text-slate-700">{availableCartons.length}</span>
                  </p>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Remarks</span>
                    <textarea value={form.remarks} disabled={!!invoice} onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))} rows={3} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
                  </label>
                  <label className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] font-medium text-slate-700">
                    <input type="checkbox" checked={form.includeImeiList} onChange={(e) => setForm((prev) => ({ ...prev, includeImeiList: e.target.checked }))} />
                    Include IMEI annex in gate pass
                  </label>
                </section>
              </div>
            </div>

            <aside className="min-h-0 overflow-y-auto border-t border-slate-200 bg-white p-3 sm:p-4 lg:border-l lg:border-t-0">
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Dispatch Summary
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-white p-2.5 ring-1 ring-slate-200">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Cartons</p>
                      <p className="mt-2 text-[24px] font-black leading-none text-slate-900">{selectedCartons.length}</p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 ring-1 ring-slate-200">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Quantity</p>
                      <p className="mt-2 text-[24px] font-black leading-none text-slate-900">{totalQuantity}</p>
                    </div>
                  </div>
                </div>

                {!invoice ? (
                  <button
                    type="button"
                    disabled={submitting || selectedCartons.length === 0}
                    onClick={handleCreateDraft}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-[13px] font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FileText className="h-4 w-4" />
                    {submitting ? "Creating Draft..." : "Create Draft Invoice"}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Current Invoice</p>
                      <p className="mt-1 text-[18px] font-black text-slate-900">{invoice.invoiceNumber}</p>
                      <div className="mt-3 space-y-1.5 text-[12px] text-slate-600">
                        <p>Company: <span className="font-semibold text-slate-800">{invoice.customerName}</span></p>
                        {invoice.contactPerson ? <p>Contact: <span className="font-semibold text-slate-800">{invoice.contactPerson}</span></p> : null}
                        {invoice.customerPhone ? <p>Phone: <span className="font-semibold text-slate-800">{invoice.customerPhone}</span></p> : null}
                        {invoice.customerEmail ? <p>Email: <span className="font-semibold text-slate-800">{invoice.customerEmail}</span></p> : null}
                        {invoice.ewayBillNo ? <p>E-Way Bill: <span className="font-semibold text-slate-800">{invoice.ewayBillNo}</span></p> : null}
                        {invoice?.logisticsDetails?.transporterName ? <p>Transporter: <span className="font-semibold text-slate-800">{invoice.logisticsDetails.transporterName}</span></p> : null}
                        {invoice?.logisticsDetails?.transportMode ? <p>Mode: <span className="font-semibold text-slate-800">{invoice.logisticsDetails.transportMode}</span></p> : null}
                        {invoice?.logisticsDetails?.vehicleNumber ? <p>Vehicle: <span className="font-semibold text-slate-800">{invoice.logisticsDetails.vehicleNumber}</span></p> : null}
                        {invoice?.logisticsDetails?.referenceNumber ? <p>Reference: <span className="font-semibold text-slate-800">{invoice.logisticsDetails.referenceNumber}</span></p> : null}
                        <p>Status: <span className="font-semibold text-slate-800">{invoice.status}</span></p>
                        {invoice.gatePassNumber ? <p>Gate Pass: <span className="font-semibold text-slate-800">{invoice.gatePassNumber}</span></p> : null}
                      </div>
                    </div>

                    {invoiceStatus === "DRAFT" ? (
                      <>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={handleConfirm}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-[13px] font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <CheckSquare className="h-4 w-4" />
                          {submitting ? "Confirming..." : "Confirm Dispatch"}
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={handleCancel}
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-[13px] font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                          Cancel Draft
                        </button>
                      </>
                    ) : invoiceStatus === "CONFIRMED" ? (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handlePrint}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-[13px] font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Printer className="h-4 w-4" />
                        {submitting ? "Preparing Gate Pass..." : "Print Gate Pass"}
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DispatchModal;
