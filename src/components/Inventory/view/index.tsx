"use client";

import React, { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  fetchList,
  updateInventoryById,
  getProcessByProductID,
  updateIssueKit,
  updateIssueCarton,
} from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Box,
  Truck,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  Edit,
  PackagePlus,
  Archive,
  ArrowRight
} from "lucide-react";
import { BallTriangle } from "react-loader-spinner";
import ConfirmationPopup from "@/components/Confirmation/page";
import Modal from "@/components/Modal/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Inventory {
  _id: string;
  productName: string;
  productType: string;
  quantity: string | number;
  cartonQuantity: string | number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const InventoryManagement = () => {
  const router = useRouter();

  // State Management
  const [inventoryData, setInventoryData] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Selection & Action State
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [isInventoryModel, setIsInventoryModel] = useState(false);
  const [isIssueKitModel, setIsIssueKitModel] = useState(false);
  const [isIssueCartonModel, setIsIssueCartonModel] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Form State
  const [updatedQuantity, setUpdatedQuantity] = useState(0);
  const [updatedCartonQuantity, setUpdatedCartonQuantity] = useState(0);
  const [issueKitProcess, setIssueKitProcess] = useState("");
  const [issueCartonProcess, setIssueCartonProcess] = useState("");
  const [processes, setProcesses] = useState<any[]>([]);
  const [selectedProcess, setSelectedProcess] = useState("");
  const [selectedProcessDetails, setSelectedProcessDetails] = useState<any>({});

  useEffect(() => {
    getInventory();
  }, []);

  const getInventory = async () => {
    try {
      setLoading(true);
      const result = await fetchList("/inventory/view");
      setInventoryData(result.Inventory);
    } catch (error) {
      console.error("Error Fetching Inventory:", error);
      toast.error("Failed to fetch inventory data");
    } finally {
      setLoading(false);
    }
  };

  const getProcesses = async (id: string) => {
    try {
      const result = await getProcessByProductID(id);
      const filteredProcesses = result.ProcessByProductID.filter(
        (value: any) =>
          value.status === "Waiting_Kits_allocation" ||
          value.kitStatus === "partially_issued"
      );
      setProcesses(filteredProcesses);
    } catch (error) {
      console.error("Error Fetching Process:", error);
    }
  };

  const handleEdit = (inventory: Inventory) => {
    setSelectedInventory(inventory);
    setUpdatedQuantity(0);
    setUpdatedCartonQuantity(0);
    setIsInventoryModel(true);
  };

  const openIssueKits = (inventory: Inventory) => {
    setSelectedInventory(inventory);
    getProcesses(inventory.productType);
    setIsIssueKitModel(true);
    setIssueKitProcess("");
    setSelectedProcess("");
    setSelectedProcessDetails({});
  };

  const openIssueCarton = (inventory: Inventory) => {
    setSelectedInventory(inventory);
    getProcesses(inventory.productType);
    setIsIssueCartonModel(true);
    setIssueCartonProcess("");
    setSelectedProcess("");
    setSelectedProcessDetails({});
  };

  const handleProcessTypeChange = (processId: string) => {
    const process = processes.find((p) => p._id === processId);
    setSelectedProcess(processId);
    setSelectedProcessDetails(process || {});
  };

  const handleSubmitInventory = async () => {
    if (!selectedInventory) return;
    try {
      const currentQuantity = parseInt(selectedInventory.quantity.toString()) || 0;
      const currentCartonQuantity = parseInt(selectedInventory.cartonQuantity.toString()) || 0;

      const finalQuantity = currentQuantity + (parseInt(updatedQuantity.toString()) || 0);
      const finalCartonQuantity = currentCartonQuantity + (parseInt(updatedCartonQuantity.toString()) || 0);

      const formData = new FormData();
      formData.append("quantity", finalQuantity.toString());
      formData.append("cartonQuantity", finalCartonQuantity.toString());
      if (finalQuantity > 0) {
        formData.append("status", "In Stock");
      }

      const result = await updateInventoryById(selectedInventory._id, formData);
      if (result && result.status === 200) {
        toast.success("Inventory updated successfully");
        setIsInventoryModel(false);
        getInventory();
      }
    } catch (error) {
      console.error("Error updating inventory", error);
      toast.error("Failed to update inventory");
    }
  };

  const handleSubmitCarton = async () => {
    try {
      if (!selectedProcess || !issueCartonProcess) {
        toast.error("Please select a process and enter quantity");
        return;
      }
      const data = new FormData();
      data.append("process", selectedProcess);
      data.append("issueCartonProcess", issueCartonProcess);
      await updateIssueCarton(data);
      toast.success("Cartons Issued Successfully!");
      setIsIssueCartonModel(false);
      getInventory();
    } catch (error) {
      console.error("Error issuing carton:", error);
      toast.error("Failed to issue cartons");
    }
  };

  const handleSubmitIssuedKit = async () => {
    try {
      if (!selectedProcess || !issueKitProcess) {
        toast.error("Please select a process and enter quantity");
        return;
      }
      const data = new FormData();
      data.append("process", selectedProcess);
      data.append("issuedKits", issueKitProcess);

      const needed = parseInt(selectedProcessDetails.quantity) - parseInt(selectedProcessDetails.issuedKits);
      if (parseInt(issueKitProcess) >= needed) {
        data.append("kitStatus", "issued");
      } else {
        data.append("kitStatus", "partially_issued");
      }
      data.append("status", "Waiting_Kits_approval");

      await updateIssueKit(data);
      toast.success("Kits Issued Successfully!");
      setIsIssueKitModel(false);
      getInventory();
    } catch (error) {
      console.error("Error issuing kits:", error);
      toast.error("Failed to issue kits");
    }
  };

  // Filtered Data
  const filteredData = useMemo(() => {
    return inventoryData.filter((item) => {
      const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [inventoryData, searchTerm, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = inventoryData.length;
    const lowStock = inventoryData.filter(item => parseInt(item.quantity.toString()) < 10).length;
    const inStock = inventoryData.filter(item => item.status === "In Stock").length;
    const totalQty = inventoryData.reduce((acc, item) => acc + (parseInt(item.quantity.toString()) || 0), 0);

    return { total, lowStock, inStock, totalQty };
  }, [inventoryData]);

  const columns = [
    {
      name: "Product Details",
      selector: (row: Inventory) => row.productName,
      sortable: true,
      grow: 2,
      cell: (row: Inventory) => (
        <div className="flex items-center py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mr-3">
            <Box size={20} />
          </div>
          <div>
            <div className="font-semibold text-black dark:text-white">{row.productName}</div>
            <div className="text-xs text-gray-500">{row.productType}</div>
          </div>
        </div>
      ),
    },
    {
      name: "Inventory Levels",
      sortable: true,
      cell: (row: Inventory) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm font-medium">
            <Archive size={14} className="mr-1.5 text-blue-500" />
            <span className="text-gray-700 dark:text-gray-300">{row.quantity} Kits</span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Truck size={14} className="mr-1.5 text-emerald-500" />
            <span>{row.cartonQuantity} Cartons</span>
          </div>
        </div>
      ),
    },
    {
      name: "Status",
      selector: (row: Inventory) => row.status,
      sortable: true,
      cell: (row: Inventory) => {
        const isInStock = row.status === "In Stock";
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isInStock
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
            }`}>
            {isInStock ? <CheckCircle2 size={12} className="mr-1" /> : <AlertCircle size={12} className="mr-1" />}
            {row.status}
          </span>
        );
      },
    },
    {
      name: "Timeline",
      selector: (row: Inventory) => row.createdAt,
      sortable: true,
      cell: (row: Inventory) => (
        <div className="text-xs text-gray-500">
          <div>Updated: {new Date(row.updatedAt || row.createdAt).toLocaleDateString()}</div>
          <div className="mt-0.5">Created: {new Date(row.createdAt).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      name: "Actions",
      cell: (row: Inventory) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="group relative flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600 transition-all hover:bg-blue-600 hover:text-white dark:bg-blue-900/20"
            title="Add Stock"
          >
            <PackagePlus size={16} />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 scale-0 rounded bg-gray-900 px-2 py-1 text-[10px] text-white transition-all group-hover:scale-100 whitespace-nowrap">Add Stock</span>
          </button>

          <button
            onClick={() => openIssueKits(row)}
            className="group relative flex h-8 w-8 items-center justify-center rounded-md bg-amber-50 text-amber-600 transition-all hover:bg-amber-600 hover:text-white dark:bg-amber-900/20"
            title="Issue Kits"
          >
            <Box size={16} />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 scale-0 rounded bg-gray-900 px-2 py-1 text-[10px] text-white transition-all group-hover:scale-100 whitespace-nowrap">Issue Kits</span>
          </button>

          <button
            onClick={() => openIssueCarton(row)}
            className="group relative flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 transition-all hover:bg-emerald-600 hover:text-white dark:bg-emerald-900/20"
            title="Issue Carton"
          >
            <Truck size={16} />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 scale-0 rounded bg-gray-900 px-2 py-1 text-[10px] text-white transition-all group-hover:scale-100 whitespace-nowrap">Issue Carton</span>
          </button>
        </div>
      ),
    },
  ];

  const customStyles = {
    header: {
      style: {
        minHeight: "56px",
      },
    },
    headRow: {
      style: {
        borderTopStyle: "solid" as const,
        borderTopWidth: "1px",
        borderTopColor: "rgba(0,0,0,0.05)",
        backgroundColor: "#f9fafb",
      },
    },
    headCells: {
      style: {
        fontWeight: "600",
        textTransform: "uppercase" as const,
        fontSize: "0.75rem",
        letterSpacing: "0.05em",
        color: "#6b7280",
        paddingLeft: "16px",
        paddingRight: "16px",
      },
    },
    cells: {
      style: {
        paddingLeft: "16px",
        paddingRight: "16px",
      },
    },
    rows: {
      style: {
        minHeight: "72px",
        "&:not(:last-of-type)": {
          borderBottomStyle: "solid" as const,
          borderBottomWidth: "1px",
          borderBottomColor: "rgba(0,0,0,0.05)",
        },
        "&:hover": {
          backgroundColor: "#f9fafb !important",
          transition: "all 0.2s ease",
        }
      },
    },
    pagination: {
      style: {
        borderTop: "none",
        minHeight: "56px",
      },
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Inventory Control</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your product stock levels and distribution flow.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/inventory/viewProcess")}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-strokedark dark:bg-boxdark dark:text-white"
          >
            Allocation View
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Products", value: stats.total, icon: Archive, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Items in Stock", value: stats.inStock, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Total Quantity", value: stats.totalQty, icon: Box, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
          { label: "Low Stock Alerts", value: stats.lowStock, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
        ].map((stat, i) => (
          <div key={i} className="flex items-center rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition hover:shadow-md dark:bg-boxdark dark:ring-strokedark">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bg} ${stat.color} mr-4`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-boxdark">
        <div className="flex flex-col border-b border-gray-100 p-6 md:flex-row md:items-center md:justify-between dark:border-strokedark">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all dark:border-strokedark dark:bg-form-input dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition hover:bg-gray-100 dark:border-strokedark dark:bg-boxdark dark:text-white"
            >
              <option value="All">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Out of Stock">Low Stock</option>
            </select>
          </div>
        </div>

        <div className="relative overflow-hidden">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <BallTriangle height={80} width={80} color="#3c50e0" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredData}
              pagination
              highlightOnHover
              pointerOnHover
              customStyles={customStyles}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isInventoryModel}
        onSubmit={handleSubmitInventory}
        onClose={() => setIsInventoryModel(false)}
        title={`Add Stock for ${selectedInventory?.productName}`}
      >
        <div className="space-y-4 pt-2">
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
            Adding to current: <strong>{selectedInventory?.quantity}</strong> Kits & <strong>{selectedInventory?.cartonQuantity}</strong> Cartons
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Additional Kits
            </label>
            <input
              type="number"
              placeholder="0"
              value={updatedQuantity || ""}
              onChange={(e) => setUpdatedQuantity(parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Additional Cartons
            </label>
            <input
              type="number"
              placeholder="0"
              value={updatedCartonQuantity || ""}
              onChange={(e) => setUpdatedCartonQuantity(parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white"
            />
          </div>
        </div>
      </Modal>

      {/* Issue Kits Modal */}
      <Modal
        isOpen={isIssueKitModel}
        onSubmit={handleSubmitIssuedKit}
        onClose={() => setIsIssueKitModel(false)}
        title={`Issue Kits: ${selectedInventory?.productName}`}
      >
        <div className="space-y-5 pt-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Select Destination Process
            </label>
            {processes.length > 0 ? (
              <select
                value={selectedProcess}
                onChange={(e) => handleProcessTypeChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white"
              >
                <option value="">Choose a running process...</option>
                {processes.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            ) : (
              <div className="rounded-lg bg-amber-50 p-4 text-center text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                No active processes available for this product type.
              </div>
            )}
          </div>

          {selectedProcess && (
            <div className="rounded-xl bg-gray-50 p-5 space-y-3 border border-gray-100 dark:bg-meta-4 dark:border-strokedark">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Kits Needed:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {parseInt(selectedProcessDetails.quantity) - parseInt(selectedProcessDetails.issuedKits)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Available in Master:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedInventory?.quantity}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-strokedark">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Issue Quantity
                </label>
                <input
                  type="number"
                  placeholder="Enter amount to issue"
                  max={Math.min(
                    parseInt(selectedInventory?.quantity?.toString() || "0"),
                    parseInt(selectedProcessDetails.quantity) - parseInt(selectedProcessDetails.issuedKits)
                  )}
                  value={issueKitProcess}
                  onChange={(e) => setIssueKitProcess(e.target.value)}
                  className="w-full rounded-lg border border-primary bg-white px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 dark:bg-form-input dark:text-white"
                />
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Issue Carton Modal - Similar structure but for cartons */}
      <Modal
        isOpen={isIssueCartonModel}
        onSubmit={handleSubmitCarton}
        onClose={() => setIsIssueCartonModel(false)}
        title={`Issue Carton: ${selectedInventory?.productName}`}
      >
        <div className="space-y-5 pt-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Select Destination Process
            </label>
            {processes.length > 0 ? (
              <select
                value={selectedProcess}
                onChange={(e) => handleProcessTypeChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white"
              >
                <option value="">Choose a running process...</option>
                {processes.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            ) : (
              <div className="rounded-lg bg-amber-50 p-4 text-center text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                No active processes available for this product type.
              </div>
            )}
          </div>

          {selectedProcess && (
            <div className="rounded-xl bg-gray-50 p-5 space-y-3 border border-gray-100 dark:bg-meta-4 dark:border-strokedark">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Available in Master:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedInventory?.cartonQuantity}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-strokedark">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Issue Cartons
                </label>
                <input
                  type="number"
                  placeholder="Enter amount to issue"
                  value={issueCartonProcess}
                  onChange={(e) => setIssueCartonProcess(e.target.value)}
                  className="w-full rounded-lg border border-primary bg-white px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 dark:bg-form-input dark:text-white"
                />
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default InventoryManagement;

