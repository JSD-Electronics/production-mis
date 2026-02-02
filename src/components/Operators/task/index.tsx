"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DataTable from "react-data-table-component";
import { getTaskByUserId, updateStatusRecivedKitToLine } from "@/lib/api";
import Modal from "@/components/Modal/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiCheck, FiEye, FiX } from "react-icons/fi";
const TaskComponent = () => {
  const router = useRouter();
  const [taskList, setTaskList] = useState([]);
  const [isOperatorAssignedKitModel, setOperatorAssignedKitModel] =
    useState(false);
  const [selectRecievedId, setSelectedRecievedId] = useState("");
  const [selectedProcessId, setSelectedProcessId] = useState("");
  const [seatDetails, setSeatDetails] = useState({});
  const [assignTaskDetails, setAssignTaskDetails] = useState({});

  useEffect(() => {
    const userDetails = JSON.parse(localStorage.getItem("userDetails"));
    getOperatorTask(userDetails._id);
  }, []);
  const handleOperatorRecievedKit = (data: any) => {
    setSeatDetails({});
    setSelectedRecievedId("");
    setAssignTaskDetails(data);
    data.kitRecievedSeatDetails.map((value, index) => {
      if (
        data?.seatDetails?.rowNumber == value?.rowNumber &&
        data?.seatDetails?.seatNumber == value?.seatNumber
      ) {
        setSelectedProcessId(data.processId);
        setSeatDetails(value);
        setSelectedRecievedId(data.kitRecievedConfirmationId);
      }
    });
    setOperatorAssignedKitModel(true);
  };
  const handleOperatorAssignedKit = () => { };
  const closeOperatorAssignedKit = () => {
    setOperatorAssignedKitModel(false);
  };
  // const updateStatusRecievedKits = async (id, status) => {
  //   try {
  //     // ðŸ” Override rejected status
  //     const finalStatus =
  //       status === "rejected" ? "waiting_for_line_feeding" : status;

  //     let formData = new FormData();
  //     formData.append("status", finalStatus);
  //     formData.append("processId", selectedProcessId);
  //     formData.append("processStatus", "active");

  //     let result = await updateStatusRecivedKitToLine(id, formData);

  //     if (result && result.status === 200) {
  //       toast.success("Task Updated Successfully!");
  //       setOperatorAssignedKitModel(false);

  //       const userDetails = JSON.parse(localStorage.getItem("userDetails"));
  //       getOperatorTask(userDetails._id);
  //     }
  //   } catch (error) {
  //     
  //   }
  // };  

  const updateStatusRecievedKits = async (id, status) => {
    try {
      let formData = new FormData();
      formData.append("status", status);
      formData.append("processId", selectedProcessId);
      if (status === "CONFIRM") {
        formData.append('processStatus', 'active');
      } else {
        formData.append("issuedKitsStatus", "REJECTED")
        formData.append('processStatus', 'waiting_for_line_feeding');
      }
      let result = await updateStatusRecivedKitToLine(id, formData);
      if (result && result.status == 200) {
        toast.success("Task Updated Successfully!");
        setOperatorAssignedKitModel(false);
        const userDetails = JSON.parse(localStorage.getItem("userDetails"));
        getOperatorTask(userDetails._id);
      }
    } catch (error) {
      
    }
  };
  const getOperatorTask = async (id: any) => {
    try {
      let result = await getTaskByUserId(id);
      // 
      setTaskList(result?.task);
    } catch (error) {
      
    }
  };
  const handleViewProcess = async (id: any) => {
    router.push(`/operators/task/${id}`);
  };
  const columns = [
    {
      name: "ID",
      selector: (row: taskList, index: number) => index + 1,
      sortable: true,
    },
    {
      name: "Process Name",
      selector: (row: taskList) => row.processName,
      sortable: true,
    },
    {
      name: "Room Details",
      selector: (row: taskList) => (
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
          <span>
            {" "}
            {row?.roomDetails?.floorName} ({row?.seatDetails?.rowNumber} -{" "}
            {row?.seatDetails?.seatNumber})
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      name: "Shift",
      selector: (row: taskList) => (
        <div>
          ({row?.ProcessShiftMappings?.startTime} -{" "}
          {row?.ProcessShiftMappings?.endTime})
        </div>
      ),
      sortable: true,
    },
    {
      name: "Issued Kits to Operator",
      selector: (row: taskList) => <div>{row?.assignedKitsToOperator}</div>,
      sortable: true,
    },
    {
      name: "From Date",
      selector: (row: taskList) =>
        new Date(row?.planDetails?.startDate).toLocaleDateString(),
      sortable: true,
    },
    {
      name: "To Date",
      selector: (row: taskList) =>
        new Date(row?.planDetails?.estimatedEndDate).toLocaleDateString(),
      sortable: true,
    },
    {
      name: "Issued Kit Status",
      selector: (row: Inventory) => {
        const statusColorMap: Record<string, string> = {
          ISSUED: "#28a745",
          PARTIALLY_ISSUED: "#ffc107",
          NOT_ISSUED: "#dc3545",
          REJECTED: "#ff5733",
        };
        const labelMap: Record<string, string> = {
          ISSUED: "Issued",
          PARTIALLY_ISSUED: "Partially Issued",
          NOT_ISSUED: "Not Issued",
          REJECTED: "Rejected",
        };
        const backgroundColor =
          statusColorMap[row.issuedKitsStatus] || "#6c757d";
        const displayLabel = labelMap[row.issuedKitsStatus] || "Unknown";
        return (
          <span
            style={{
              backgroundColor,
              color: "#fff",
              padding: "10px 5px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 600,
              display: "inline-block",
              textAlign: "center",
              wordBreak: "break-word",
              whiteSpace: "normal",
            }}
          >
            {displayLabel}
          </span>
        );
      },
      sortable: true,
    },
    {
      name: "Status",
      selector: (row: taskList) => {
        const statusStyles = {
          waiting_schedule: {
            label: "Waiting Schedule",
            backgroundColor: "#f39c12",
          },
          Waiting_Kits_allocation: {
            label: "Waiting Kits Allocation",
            backgroundColor: "#9b59b6",
          },
          Waiting_Kits_approval: {
            label: "Waiting Kits Approval",
            backgroundColor: "#1abc9c",
          },
          waiting_for_line_feeding: {
            label: "Waiting For Line Feeding",
            backgroundColor: "#3498db",
          },
          waiting_for_kits_confirmation: {
            label: "Waiting For Kits Confirmation",
            backgroundColor: "#e67e22",
          },
          active: {
            label: "Active",
            backgroundColor: "#f1c40f",
          },
          down_time_hold: {
            label: "Down Time Hold",
            backgroundColor: "#e74c3c",
          },
          completed: {
            label: "Completed",
            backgroundColor: "#2ecc71",
          },
          default: {
            label: "Process Created",
            backgroundColor: "#95a5a6",
          },
        };

        const status = row?.status;
        const { label, backgroundColor } =
          statusStyles[status] || statusStyles.default;

        return (
          <span
            style={{
              backgroundColor,
              color: "#fff",
              padding: "5px 5px",
              borderRadius: "5px",
              fontSize: "11px",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            {label}
          </span>
        );
      },
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row: taskList) => {
        return row.status != "Completed" &&
          row.kitRecievedConfirmationStatus != "ASSIGN_TO_OPERATOR" && row.kitRecievedConfirmationStatus != "REJECT" ? (
          <div className="flex items-center space-x-3.5">
            <button
              onClick={() => handleViewProcess(row.planId)}
              className="transform rounded-full bg-danger p-2 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-600"
            >
              <FiEye size={12} />
            </button>
          </div>
        ) : (
          <div className="flex space-x-1">
            {row.kitRecievedConfirmationStatus != "REJECT" && (
              <button
                onClick={() => handleOperatorRecievedKit(row)}
                className="transform rounded-full bg-blue-500 p-2 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-600"
              >
                <svg
                  fill="#ffffff"
                  width="15px"
                  height="15px"
                  viewBox="0 0 36 36"
                  version="1.1"
                  preserveAspectRatio="xMidYMid meet"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="#ffffff"
                >
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    {" "}
                    <title>assign-user-solid</title>{" "}
                    <circle
                      cx="17.99"
                      cy="10.36"
                      r="6.81"
                      className="clr-i-solid clr-i-solid-path-1"
                    ></circle>
                    <path
                      d="M12,26.65a2.8,2.8,0,0,1,4.85-1.8L20.71,29l6.84-7.63A16.81,16.81,0,0,0,18,18.55,16.13,16.13,0,0,0,5.5,24a1,1,0,0,0-.2.61V30a2,2,0,0,0,1.94,2h8.57l-3.07-3.3A2.81,2.81,0,0,1,12,26.65Z"
                      className="clr-i-solid clr-i-solid-path-2"
                    ></path>
                    <path
                      d="M28.76,32a2,2,0,0,0,1.94-2V26.24L25.57,32Z"
                      className="clr-i-solid clr-i-solid-path-3"
                    ></path>
                    <path
                      d="M33.77,18.62a1,1,0,0,0-1.42.08l-11.62,13-5.2-5.59A1,1,0,0,0,14.12,26a1,1,0,0,0,0,1.42l6.68,7.2L33.84,20A1,1,0,0,0,33.77,18.62Z"
                      className="clr-i-solid clr-i-solid-path-4"
                    ></path>{" "}
                    <rect
                      x="0"
                      y="0"
                      width="36"
                      height="36"
                      fill-opacity="0"
                    ></rect>{" "}
                  </g>
                </svg>
              </button>
            )}
          </div>
        );
      },
    },
  ];
  return (
    <>
      <div className="bg-gray-100 min-h-screen p-6">
        <Breadcrumb pageName="View Task" parentName="Task Management" />
        <div className="mt-6 rounded-lg bg-white p-6 shadow-lg">
          <DataTable
            className="dark:bg-bodyDark"
            columns={columns}
            data={taskList}
            pagination
            selectableRows
            //  onSelectedRowsChange={handleRowSelected}
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
                  minHeight: "72px",
                  "&:hover": {
                    backgroundColor: "#f1f5f9",
                  },
                },
              },
              cells: {
                style: {
                  "& > div:first-child": {
                    whiteSpace: "break-spaces",
                    overflow: "hidden",
                    textOverflow: "inherit",
                  },
                },
              },
            }}
          />
          <Modal
            isOpen={isOperatorAssignedKitModel}
            onSubmit={handleOperatorAssignedKit}
            onClose={closeOperatorAssignedKit}
            title={"Operator Assign Kits to Line"}
            submitOption={false}
          >
            <div className="grid py-2 sm:grid-cols-2">
              <div className="text-gray-700 dark:text-gray-300 mb-2 px-3">
                <strong className="font-medium">Row Number :</strong>{" "}
                {seatDetails?.rowNumber}
              </div>
              <div className="text-gray-700 dark:text-gray-300 mb-2 px-3">
                <strong className="font-medium">Seat Number :</strong>{" "}
                {seatDetails?.seatNumber}
              </div>
              <div className="text-gray-700 dark:text-gray-300 mb-2 px-3">
                <strong className="font-medium">Issued Kit :</strong>{" "}
                {seatDetails?.issuedKits}
              </div>
              <div className="text-gray-700 dark:text-gray-300 mb-2 px-3">
                <strong className="font-medium">Kits Shortage :</strong>{" "}
                {assignTaskDetails.requiredKits - seatDetails?.issuedKits}
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() =>
                  updateStatusRecievedKits(selectRecievedId, "CONFIRM")
                }
                className="flex transform items-center rounded-md bg-blue-500 p-1 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-600"
              >
                <FiCheck size={16} /> Accept
              </button>
              <button
                onClick={() =>
                  updateStatusRecievedKits(
                    selectRecievedId,
                    "REJECT",
                  )
                }
                className="flex transform items-center rounded-md bg-danger p-1 text-white shadow-lg transition-transform hover:scale-105 hover:bg-danger"
              >
                <FiX size={16} /> Reject
              </button>
            </div>
          </Modal>
        </div>
      </div>
    </>
  );
};

export default TaskComponent;
