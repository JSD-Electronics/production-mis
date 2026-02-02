"use client";
import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  getPlaningAndSchedulingByProcessId,
  getLogsByProcessID,
} from "@/lib/api";
import { formatDate } from "@/lib/common";
import { BallTriangle } from "react-loader-spinner";
import { FileText } from "lucide-react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PlaningAndSchedulingLogsComponent = () => {
  const [loading, setLoading] = useState(false);
  const [processName, setProcessName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [totalTimeEstimation, setTotalTimeEstimation] = useState("");
  const [totalUPHA, setTotalUPHA] = useState("");
  const [estimatedEndDate, setEstimatedEndDate] = useState("");
  const [planingData, setPlaningData] = useState<any[]>([]);

  useEffect(() => {
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    fetchLogs(id);
    fetchPlaning(id);
  }, []);

  const fetchLogs = async (id: string) => {
    try {
      setLoading(true);
      let result = await getLogsByProcessID(id);
      setPlaningData(result.reverse());
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaning = async (id: string) => {
    try {
      let result = await getPlaningAndSchedulingByProcessId(id);
      setProcessName(result?.processName);
      setStartDate(formatDate(result?.startDate));
      setTotalTimeEstimation(result?.totalTimeEstimation);
      setTotalUPHA(result?.totalUPHA);
      setEstimatedEndDate(formatDate(result?.estimatedEndDate));
    } catch (error) {
      
    }
  };

  const columns = [
    {
      name: "Description",
      selector: (row: any) => (
        <div
          className="text-gray-800 dark:text-gray-200 truncate"
          style={{
            whiteSpace: "normal",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            maxWidth: "250px",
          }}
          title={row.description}
        >
          {row.description}
        </div>
      ),
      sortable: true,
      grow: 2,
    },
    {
      name: "Process Name",
      selector: (row: any) => row?.processtName || "-",
      sortable: true,
    },
    {
      name: "Created At",
      selector: (row: any) => formatDate(row?.timestamp),
      sortable: true,
    },
  ];

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-6">
      {/* ðŸ”¹ Breadcrumb */}
      <Breadcrumb pageName="Process Logs" parentName="Process" />

      <div className="mt-6 rounded-xl bg-white p-6 shadow-md">
        {/* ðŸ”¹ Header Section */}
        <div className="border-gray-200 flex items-center gap-3 border-b pb-4">
          <FileText className="h-6 w-6 text-primary" />
          <h2 className="text-gray-800 text-xl font-semibold dark:text-white">
            {processName || "Process Logs"}
          </h2>
        </div>
        <>
          {/* ðŸ”¹ Process Details */}
          {startDate || totalTimeEstimation || totalUPHA || estimatedEndDate ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-gray-500 text-sm">Start Date</p>
                <p className="text-gray-800 text-base font-medium dark:text-white">
                  {startDate || "-"}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-gray-500 text-sm">Total Time Estimation</p>
                <span className="inline-block rounded-md bg-primary/10 px-2 py-1 text-sm font-semibold text-primary">
                  {totalTimeEstimation || "-"}
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-gray-500 text-sm">Total UPHA</p>
                <span className="bg-info/10 text-info inline-block rounded-md px-2 py-1 text-sm font-semibold">
                  {totalUPHA || "-"}
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-gray-500 text-sm">Estimated End Date</p>
                <p className="text-gray-800 text-base font-medium dark:text-white">
                  {estimatedEndDate || "-"}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-lg bg-danger/10 p-4 text-center">
              <p className="font-medium text-danger">
                âš ï¸ Please do Planning & Scheduling for more details
              </p>
            </div>
          )}
        </>

        {/* ðŸ”¹ Logs Table */}
        <div className="mt-8">
          <h3 className="text-gray-800 mb-4 text-lg font-semibold dark:text-white">
            Activity Logs
          </h3>

          {loading ? (
            <div className="flex justify-center py-10">
              <BallTriangle height={80} width={80} color="#3B82F6" />
            </div>
          ) : (
            <div className="border-gray-200 overflow-x-auto rounded-md border">
              <DataTable
                className="min-w-full text-sm"
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
                      fontWeight: "600",
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
                      maxWidth: "220px",
                      "& > div:first-child": {
                        whiteSpace: "break-spaces",
                        overflow: "hidden",
                        textOverflow: "inherit",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                      },
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
            </div>
          )}
        </div>
      </div>

      {/* Toasts */}
      <ToastContainer position="top-center" />
    </div>
  );
};

export default PlaningAndSchedulingLogsComponent;

// "use client";
// import React, { useState } from "react";
// import DataTable from "react-data-table-component";
// import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
// import { getPlaningAndSchedulingByProcessId, getLogsByProcessID } from "@/lib/api";
// import { formatDate } from "@/lib/common";
// import { useRouter } from "next/navigation";
// import { FiEdit, FiTrash } from "react-icons/fi";
// import { BallTriangle } from "react-loader-spinner";
// import ConfirmationPopup from "@/components/Confirmation/page";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import "./logs.css";
// const PlaningAndSchedulingLogsComponent = () => {
//   const [processName, setProcessName] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [totalTimeEstimation, setTotalTimeEstimation] = useState("");
//   const [totalUPHA, setTotalUPHA] = useState("");
//   const [estimatedEndDate, setEstimatedEndDate] = useState("");

//   const [planingData, setPlaningData] = React.useState([]);
//   React.useEffect(() => {
//     const pathname = window.location.pathname;
//     const id = pathname.split("/").pop();
//     getLogsById(id);
//     getPlaningById(id);
//   }, []);
//   const getLogsById = async (id) => {
//     try {
//       let result = await getLogsByProcessID(id);
//       setPlaningData(result.reverse());
//     } catch (error) {
//       
//       return {};
//     }
//   };
//   const getPlaningById = async (id) => {
//     try {
//       let result = await getPlaningAndSchedulingByProcessId(id);
//       setProcessName(result?.processName);
//       setStartDate(formatDate(result?.startDate));
//       setTotalTimeEstimation(result?.totalTimeEstimation);
//       setTotalUPHA(result?.totalUPHA);
//       setEstimatedEndDate(formatDate(result?.estimatedEndDate));
//     } catch (error) {
//       
//       setLoading(false);
//       return {};
//     }
//   };
//   const columns = [
//     {
//       name: "Description",
//       selector: (row: planingData) => (
//         <div
//           style={{
//             whiteSpace: "normal",
//             wordWrap: "break-word",
//             overflowWrap: "break-word",
//             maxWidth: "250px",
//             padding: "5px",
//           }}
//           title={row.description}
//         >
//           {row.description}
//         </div>
//       ),
//       sortable: true,
//     },
//     {
//       name: "Process name",
//       selector: (row: planingData) => row?.processtName,
//       sortable: true,
//     },
//     {
//       name: "Created At",
//       selector: (row: planingData) => formatDate(row?.timestamp),
//       sortable: true,
//     },
//   ];

//   return (
//     <>
//       <div className="bg-gray-100 min-h-screen p-6">
//         <Breadcrumb
//           pageName="View Process Logs"
//           parentName="Process"
//         />
//         <div className="mt-6 rounded-lg bg-white p-6 shadow-lg">
//           <h3 className="text-xl font-semibold text-black dark:text-white">
//             {processName}
//           </h3>
//           <div className="grid pt-6 sm:grid-cols-2">
//             <div className="text-gray-700 dark:text-gray-300 mb-2">
//               <strong className="font-medium">Start Date:</strong> {startDate}
//             </div>
//             <div className="text-gray-700 dark:text-gray-300 mb-2">
//               <strong className="font-medium">Total Time Estimation:</strong>{" "}
//               {totalTimeEstimation}
//             </div>
//             <div className="text-gray-700 dark:text-gray-300 mb-2">
//               <strong className="font-medium">Total UPHA:</strong> {totalUPHA}
//             </div>
//             <div className="text-gray-700 dark:text-gray-300 mb-2">
//               <strong className="font-medium">Estimated End Date:</strong>{" "}
//               {estimatedEndDate}
//             </div>
//           </div>
//           <hr className="text-bodydark1" />
//           <div className="mt-6 pb-6">
//             <h3 className="text-xl font-semibold text-black dark:text-white">
//               Logs
//             </h3>
//             <div className="pt-4">
//               <DataTable
//                 className="dark:bg-bodyDark"
//                 columns={columns}
//                 data={planingData}
//                 pagination
//                 responsive
//                 dense
//                 highlightOnHover
//                 pointerOnHover
//                 customStyles={{
//                   headCells: {
//                     style: {
//                       fontWeight: "bold",
//                       backgroundColor: "#f8f9fa",
//                       padding: "12px",
//                     },
//                   },
//                   rows: {
//                     style: {
//                       "&:hover": {
//                         backgroundColor: "#f1f5f9",
//                       },
//                     },
//                   },
//                   cells: {
//                     style: {
//                       whiteSpace: "normal !important",
//                       wordWrap: "break-word",
//                       overflowWrap: "break-word",
//                       maxWidth: "200px",
//                     },
//                   },
//                   pagination: {
//                     style: {
//                       padding: "12px",
//                       border: "none",
//                     },
//                   },
//                 }}
//               />

//               {/* <DataTable
//                 className="dark:bg-bodyDark"
//                 columns={columns}
//                 data={planingData}
//                 pagination
//                 responsive
//                 dense
//                 highlightOnHover
//                 pointerOnHover
//                 customStyles={{
//                   headCells: {
//                     style: {
//                       fontWeight: "bold",
//                       backgroundColor: "#f8f9fa",
//                       padding: "12px",
//                     },
//                   },
//                   rows: {
//                     style: {
//                       "&:hover": {
//                         backgroundColor: "#f1f5f9",
//                       },
//                     },
//                   },
//                   cells: {
//                     style: {
//                       whiteSpace: "normal", // Allow wrapping
//                       wordWrap: "break-word", // Ensure long words break
//                       overflowWrap: "break-word", // Handles edge cases
//                       maxWidth: "200px", // Optional: Limit width for testing wrapping
//                     },
//                   },
//                   pagination: {
//                     style: {
//                       padding: "12px",
//                       border: "none",
//                     },
//                   },
//                 }}
//               /> */}
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };
// export default PlaningAndSchedulingLogsComponent;
