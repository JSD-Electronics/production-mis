"use client";

import React, { useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Modal from "@/components/Modal/page";
import {
  approveKitTransferRequest,
  getDevicesByProcessId,
  getKitTransferRequests,
  rejectKitTransferRequest,
  viewProcess,
} from "@/lib/api";
import {
  CheckCircle2,
  Clock3,
  Eye,
  Package,
  RefreshCcw,
  Search,
  XCircle,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 border border-rose-200",
  CANCELLED: "bg-slate-100 text-slate-600 border border-slate-200",
};

export default function TransferRequestsPageContent() {
  const [requests, setRequests] = useState<any[]>([]);
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [processFilter, setProcessFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [serialDeviceMap, setSerialDeviceMap] = useState<Record<string, any>>({});
  const [serialDeviceLoading, setSerialDeviceLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestResponse, processResponse] = await Promise.all([
        getKitTransferRequests(),
        viewProcess(),
      ]);
      setRequests(requestResponse?.requests || []);
      setProcesses(processResponse?.Processes || []);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load transfer requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesSearch =
        !search ||
        String(request?.fromProcessName || "").toLowerCase().includes(search.toLowerCase()) ||
        String(request?.toProcessName || "").toLowerCase().includes(search.toLowerCase()) ||
        String(request?.requesterName || "").toLowerCase().includes(search.toLowerCase()) ||
        (request?.serials || []).some((serial: string) =>
          String(serial).toLowerCase().includes(search.toLowerCase())
        );

      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      const matchesProcess =
        processFilter === "all" ||
        String(request?.fromProcessId) === String(processFilter) ||
        String(request?.toProcessId) === String(processFilter);

      return matchesSearch && matchesStatus && matchesProcess;
    });
  }, [requests, search, statusFilter, processFilter]);

  const openDetail = (request: any) => {
    setSelectedRequest(request);
    setRejectionReason("");
    setIsDetailOpen(true);
  };

  useEffect(() => {
    const loadSerialDevices = async () => {
      if (!isDetailOpen || !selectedRequest?.fromProcessId || !Array.isArray(selectedRequest?.serials) || selectedRequest.serials.length === 0) {
        setSerialDeviceMap({});
        return;
      }

      setSerialDeviceLoading(true);
      try {
        const response = await getDevicesByProcessId(selectedRequest.fromProcessId);
        const devices = Array.isArray(response?.data) ? response.data : [];
        const nextMap: Record<string, any> = {};
        devices.forEach((device: any) => {
          const key = String(device?.serialNo || "").trim().toLowerCase();
          if (key) nextMap[key] = device;
        });
        setSerialDeviceMap(nextMap);
      } catch (error) {
        setSerialDeviceMap({});
      } finally {
        setSerialDeviceLoading(false);
      }
    };

    loadSerialDevices();
  }, [isDetailOpen, selectedRequest?.fromProcessId, selectedRequest?.serials]);

  const refreshAfterAction = async (updatedRequest?: any) => {
    await loadData();
    if (!updatedRequest) {
      setSelectedRequest(null);
      setIsDetailOpen(false);
      return;
    }
    setSelectedRequest(updatedRequest);
  };

  const handleApprove = async () => {
    if (!selectedRequest?._id) return;
    setActionLoading(true);
    try {
      const response = await approveKitTransferRequest(selectedRequest._id);
      toast.success(response?.message || "Transfer request approved");
      setIsApproveOpen(false);
      setIsDetailOpen(false);
      await refreshAfterAction();
    } catch (error: any) {
      toast.error(error?.message || "Failed to approve request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest?._id) return;
    setActionLoading(true);
    try {
      const response = await rejectKitTransferRequest(selectedRequest._id, {
        rejectionReason,
      });
      toast.success(response?.message || "Transfer request rejected");
      setIsRejectOpen(false);
      setIsDetailOpen(false);
      await refreshAfterAction();
    } catch (error: any) {
      toast.error(error?.message || "Failed to reject request");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Transfer Requests" parentName="Store Portal" />

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
                Kit Transfer Requests
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Review, approve, or reject inter-process kit and device transfer requests.
              </p>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by process, requester, or serial"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            >
              <option value="all">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={processFilter}
              onChange={(e) => setProcessFilter(e.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            >
              <option value="all">All processes</option>
              {processes.map((process: any) => (
                <option key={process._id} value={process._id}>
                  {process.name}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200">
            <div className="overflow-auto">
              <table className="min-w-[960px] w-full text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                    <th className="px-5 py-4">Request</th>
                    <th className="px-4 py-4">Transfer Path</th>
                    <th className="px-4 py-4">Quantity</th>
                    <th className="px-4 py-4">Serials</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Requested By</th>
                    <th className="px-4 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm font-medium text-slate-400">
                        Loading requests...
                      </td>
                    </tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm font-medium text-slate-400">
                        No transfer requests found.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((request) => (
                      <tr key={request._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <div className="text-sm font-black text-slate-900">
                            {new Date(request.createdAt).toLocaleString()}
                          </div>
                          <div className="mt-1 text-xs font-medium text-slate-400">
                            {request.targetStage ? `Target Stage: ${request.targetStage}` : "Kit-only transfer"}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-bold text-slate-900">
                            {request.fromProcessName}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-slate-400">
                            to {request.toProcessName}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-black text-slate-900">
                          {request.quantity}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                          {request.serialCount}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${statusStyles[request.status] || statusStyles.CANCELLED}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                          {request.requesterName || "-"}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openDetail(request)}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-[0.14em] text-slate-700 transition hover:bg-slate-50"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onSubmit={() => {}}
        submitOption={false}
        extraActions={
          selectedRequest?.status === "PENDING" ? (
            <>
              <button
                type="button"
                onClick={() => setIsRejectOpen(true)}
                className="rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-100"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => setIsApproveOpen(true)}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                Approve
              </button>
            </>
          ) : null
        }
        title="Transfer Request Details"
      >
        {selectedRequest && (
          <div className="space-y-5 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${statusStyles[selectedRequest.status] || statusStyles.CANCELLED}`}>
                {selectedRequest.status}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {new Date(selectedRequest.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">From Process</div>
                <div className="mt-1 font-bold text-slate-900">{selectedRequest.fromProcessName}</div>
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">To Process</div>
                <div className="mt-1 font-bold text-slate-900">{selectedRequest.toProcessName}</div>
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Quantity</div>
                <div className="mt-1 font-bold text-slate-900">{selectedRequest.quantity}</div>
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Target Stage</div>
                <div className="mt-1 font-bold text-slate-900">{selectedRequest.targetStage || "Not required"}</div>
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Requester</div>
                <div className="mt-1 font-bold text-slate-900">{selectedRequest.requesterName || "-"}</div>
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Approver</div>
                <div className="mt-1 font-bold text-slate-900">{selectedRequest.approverName || "-"}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-600">
                <Package className="h-4 w-4 text-indigo-500" />
                Scanned Serials and Current Stage
              </h3>
              <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
                {serialDeviceLoading ? (
                  <div className="rounded-xl bg-slate-50 px-3 py-4 text-sm font-medium text-slate-400">
                    Loading device details...
                  </div>
                ) : (selectedRequest.serials || []).length === 0 ? (
                  <div className="rounded-xl bg-slate-50 px-3 py-4 text-sm font-medium text-slate-400">
                    No device serials included in this request.
                  </div>
                ) : (
                  selectedRequest.serials.map((serial: string) => {
                    const device = serialDeviceMap[String(serial || "").trim().toLowerCase()];
                    return (
                      <div key={serial} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-mono text-sm font-black text-slate-800">
                              {serial}
                            </div>
                            <div className="mt-1 text-[11px] font-semibold text-slate-400">
                              {device?.modelName || device?.imeiNo ? (
                                <>
                                  {device?.modelName || "Device"} {device?.imeiNo ? `• IMEI ${device.imeiNo}` : ""}
                                </>
                              ) : (
                                "Device not found in source process"
                              )}
                            </div>
                          </div>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                              device?.currentStage
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                          >
                            {device?.currentStage || "Unknown Stage"}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
                          <span className="rounded-full bg-white px-2 py-1 border border-slate-200">
                            Current Status: {device?.status || "N/A"}
                          </span>
                          <span className="rounded-full bg-white px-2 py-1 border border-slate-200">
                            Source Process: {selectedRequest.fromProcessName || "-"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-600">
                Audit Summary
              </h3>
              <div className="mt-3 space-y-3">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <p className="font-semibold text-slate-800">Requested</p>
                    <p className="text-sm text-slate-500">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {selectedRequest.approvedAt && (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="font-semibold text-slate-800">Approved</p>
                      <p className="text-sm text-slate-500">{new Date(selectedRequest.approvedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {selectedRequest.rejectedAt && (
                  <div className="flex items-start gap-3">
                    <XCircle className="mt-0.5 h-4 w-4 text-rose-500" />
                    <div>
                      <p className="font-semibold text-slate-800">Rejected</p>
                      <p className="text-sm text-slate-500">{new Date(selectedRequest.rejectedAt).toLocaleString()}</p>
                      {selectedRequest.rejectionReason && (
                        <p className="mt-1 text-sm text-rose-600">{selectedRequest.rejectionReason}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        onSubmit={handleApprove}
        submitText={actionLoading ? "Approving..." : "Confirm Approval"}
        submitDisabled={actionLoading}
        title="Approve Transfer Request"
      >
        <p className="text-sm font-medium text-slate-600">
          Approving this request will move the allocated kits and update all scanned devices to the destination process and stage.
        </p>
      </Modal>

      <Modal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onSubmit={handleReject}
        submitText={actionLoading ? "Rejecting..." : "Confirm Rejection"}
        submitDisabled={actionLoading}
        title="Reject Transfer Request"
      >
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-600">
            Rejecting will terminate this request without changing kits or devices.
          </p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Optional rejection reason"
            className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10"
          />
        </div>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
