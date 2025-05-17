"use client";
import React, { useState } from "react";
import DataTable from "react-data-table-component";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { getPlaningAndSchedulingByProcessId, getLogsByProcessID } from "@/lib/api";
import { formatDate } from "@/lib/common";
import { useRouter } from "next/navigation";
import { FiEdit, FiTrash } from "react-icons/fi";
import { BallTriangle } from "react-loader-spinner";
import ConfirmationPopup from "@/components/Confirmation/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./logs.css";
const PlaningAndSchedulingLogsComponent = () => {
  const [processName, setProcessName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [totalTimeEstimation, setTotalTimeEstimation] = useState("");
  const [totalUPHA, setTotalUPHA] = useState("");
  const [estimatedEndDate, setEstimatedEndDate] = useState("");

  const [planingData, setPlaningData] = React.useState([]);
  React.useEffect(() => {
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    getLogsById(id);
    getPlaningById(id);
  }, []);
  const getLogsById = async (id) => {
    try {
      let result = await getLogsByProcessID(id);
      setPlaningData(result.reverse());
    } catch (error) {
      console.log("Error Fetching Planing & Scheduling", error);
      return {};
    }
  };
  const getPlaningById = async (id) => {
    try {
      let result = await getPlaningAndSchedulingByProcessId(id);
      setProcessName(result?.processName);
      setStartDate(formatDate(result?.startDate));
      setTotalTimeEstimation(result?.totalTimeEstimation);
      setTotalUPHA(result?.totalUPHA);
      setEstimatedEndDate(formatDate(result?.estimatedEndDate));
    } catch (error) {
      console.log("Error Fetching Planing & Scheduling", error);
      setLoading(false);
      return {};
    }
  };
  const columns = [
    {
      name: "Description",
      selector: (row: planingData) => (
        <div
          style={{
            whiteSpace: "normal",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            maxWidth: "250px",
            padding: "5px",
          }}
          title={row.description}
        >
          {row.description}
        </div>
      ),
      sortable: true,
    },
    {
      name: "Process name",
      selector: (row: planingData) => row?.processtName,
      sortable: true,
    },
    {
      name: "Created At",
      selector: (row: planingData) => formatDate(row?.timestamp),
      sortable: true,
    },
  ];

  return (
    <>
      <div className="bg-gray-100 min-h-screen p-6">
        <Breadcrumb
          pageName="View Process Logs"
          parentName="Process"
        />
        <div className="mt-6 rounded-lg bg-white p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-black dark:text-white">
            {processName}
          </h3>
          <div className="grid pt-6 sm:grid-cols-2">
            <div className="text-gray-700 dark:text-gray-300 mb-2">
              <strong className="font-medium">Start Date:</strong> {startDate}
            </div>
            <div className="text-gray-700 dark:text-gray-300 mb-2">
              <strong className="font-medium">Total Time Estimation:</strong>{" "}
              {totalTimeEstimation}
            </div>
            <div className="text-gray-700 dark:text-gray-300 mb-2">
              <strong className="font-medium">Total UPHA:</strong> {totalUPHA}
            </div>
            <div className="text-gray-700 dark:text-gray-300 mb-2">
              <strong className="font-medium">Estimated End Date:</strong>{" "}
              {estimatedEndDate}
            </div>
          </div>
          <hr className="text-bodydark1" />
          <div className="mt-6 pb-6">
            <h3 className="text-xl font-semibold text-black dark:text-white">
              Logs
            </h3>
            <div className="pt-4">
              <DataTable
                className="dark:bg-bodyDark"
                columns={columns}
                data={planingData}
                pagination
                responsive
                dense
                highlightOnHover
                pointerOnHover
                customStyles={{
                  headCells: {
                    style: {
                      fontWeight: "bold",
                      backgroundColor: "#f8f9fa",
                      padding: "12px",
                    },
                  },
                  rows: {
                    style: {
                      "&:hover": {
                        backgroundColor: "#f1f5f9",
                      },
                    },
                  },
                  cells: {
                    style: {
                      whiteSpace: "normal !important",
                      wordWrap: "break-word",
                      overflowWrap: "break-word",
                      maxWidth: "200px",
                    },
                  },
                  pagination: {
                    style: {
                      padding: "12px",
                      border: "none",
                    },
                  },
                }}
              />

              {/* <DataTable
                className="dark:bg-bodyDark"
                columns={columns}
                data={planingData}
                pagination
                responsive
                dense
                highlightOnHover
                pointerOnHover
                customStyles={{
                  headCells: {
                    style: {
                      fontWeight: "bold",
                      backgroundColor: "#f8f9fa",
                      padding: "12px",
                    },
                  },
                  rows: {
                    style: {
                      "&:hover": {
                        backgroundColor: "#f1f5f9",
                      },
                    },
                  },
                  cells: {
                    style: {
                      whiteSpace: "normal", // Allow wrapping
                      wordWrap: "break-word", // Ensure long words break
                      overflowWrap: "break-word", // Handles edge cases
                      maxWidth: "200px", // Optional: Limit width for testing wrapping
                    },
                  },
                  pagination: {
                    style: {
                      padding: "12px",
                      border: "none",
                    },
                  },
                }}
              /> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default PlaningAndSchedulingLogsComponent;
