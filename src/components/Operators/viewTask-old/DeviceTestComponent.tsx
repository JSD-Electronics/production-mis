"use client";
import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import Modal from "@/components/Modal/page";
import { Result } from "postcss";
import StickerGenerator from "./StickerGenerator";
import Image from "next/image";
export default function DeviceTestComponent({
  processStatus,
  isDownTimeEnable,
  product,
  isDeviceSectionShow,
  taskStatus,
  handleStart,
  isPaused,
  timerDisplay,
  deviceDisplay,
  SearchableInput,
  deviceList,
  checkedDevice,
  searchQuery,
  setSearchQuery,
  handleNoResults,
  setSearchResult,
  getDeviceById,
  setIsPassNGButtonShow,
  setIsStickerPrinted,
  searchResult,
  notFoundError,
  handlePauseResume,
  handleStop,
  openReportIssueModel,
  deviceHistory,
  isReportIssueModal,
  isStickerPrinted,
  isPassNGButtonShow,
  processAssignUserStage,
  moveToPackaging,
  handleSubmitReport,
  closeReportIssueModal,
  isVerifyStickerModal,
  handleVerifyStickerModal,
  closeVerifyStickerModal,
  handleVerifySticker,
  handlePrintSticker,
  scanValue,
  handleScanValue,
  isCheckValueButtonHide,
  handlePrintField,
  isScanValuePass,
  handleUpdateStatus,
  handleMoveToPackaging,
  processData,
  handleAddToCart,
  setIssueType,
  setIssueDescription,
  getDownTimeVal,
  serialNumber,
  setSerialNumber,
}) {
  return (
    <>
      <h3 className="text-md text-md mb-1 mt-3 font-bold text-black">
        Standard Operating Procedure (SOP)
      </h3>
      <hr className="pb-4 text-blue-500" />

      {processStatus == "active" ? (
        !isDownTimeEnable ? (
          <>
            <div className="pb-3">
              <div>
                {product?.sopFile ? (
                  <div>
                    <button
                      type="button"
                      className="rounded-md bg-blue-700 p-2 px-5 py-2 text-white"
                    >
                      View SOP File{" "}
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 text-center">No SOP Found</div>
                )}
              </div>
            </div>
            {isDeviceSectionShow && (
              <div>
                <div className="flex items-end justify-between">
                  <h3 className="text-md text-md mb-1 mt-3 font-bold text-black">
                    Devices
                  </h3>
                  <p className="timer text-black">
                    <b>Elapsed Time : </b>
                    <span id="timer-display">{timerDisplay}</span>
                  </p>
                </div>
                <hr className="pb-4 text-blue-500" />
                <div className="pb-3">
                  <div className="grid grid-cols-2">
                    <div className="flex justify-center">
                      <div className="w-full">
                        <div className="flex items-end justify-end pr-3">
                          <p className="timer text-black">
                            <b>Testing Time: </b>
                            <span id="timer-display">{deviceDisplay}</span>
                          </p>
                        </div>
                        <div className={`${isPaused && "blur"}`}>
                          <div className="px-4 py-1 ">
                            <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                              Device
                            </label>
                            <SearchableInput
                              options={deviceList}
                              checkedDevice={checkedDevice}
                              searchQuery={searchQuery}
                              setSearchQuery={setSearchQuery}
                              onNoResults={handleNoResults}
                              setSearchResult={setSearchResult}
                              getDeviceById={getDeviceById}
                              setIsPassNGButtonShow={setIsPassNGButtonShow}
                              setIsStickerPrinted={setIsStickerPrinted}
                            />
                          </div>
                          {searchResult !== "" ? (
                            <div className="px-4 py-4 ">
                              <h3 className="text-md pb-2 font-bold">
                                {searchResult}
                              </h3>
                              {deviceHistory.length > 0 && (
                                <div className="py-4">
                                  <h5 className="font-bold">
                                    Previous Stages Summary
                                  </h5>
                                  <hr className="pb-4 text-blue-500" />
                                  <table className="px-2 ">
                                    <tr>
                                      <th className="w-40">Serial No</th>
                                      <th className="w-40">Stage Name</th>
                                      <th className="w-40">Status</th>
                                    </tr>
                                    {deviceHistory.map((value, index) => (
                                      <tr key={index} className="text-center">
                                        <td>{value?.serialNo}</td>
                                        <td>{value?.stageName}</td>
                                        <td
                                          className={`py-1 ${value?.status === "Pass" ? "text-green-500" : value?.status === "NG" ? "text-danger" : ""}`}
                                        >
                                          {value?.status}
                                        </td>
                                      </tr>
                                    ))}
                                  </table>
                                </div>
                              )}
                              {!isStickerPrinted &&
                                !isPassNGButtonShow &&
                                processAssignUserStage?.subSteps?.some(
                                  (subStep: any) => subStep.isPrinterEnable,
                                ) && (
                                  <>
                                    {processAssignUserStage.subSteps.map(
                                      (subStep: any, subIndex: number) =>
                                        subStep.isPrinterEnable
                                          ? subStep.printerFields.map(
                                              (
                                                printerField: any,
                                                printerIndex: number,
                                              ) => (
                                                <div
                                                  id="sticker-preview"
                                                  key={`${subIndex}-${printerIndex}`}
                                                  className="bg-gray-100 flex items-center justify-center"
                                                >
                                                  <StickerGenerator
                                                    stickerData={printerField}
                                                    deviceData={deviceList.filter(
                                                      (device: any) =>
                                                        device.serialNo ===
                                                        searchResult,
                                                    )}
                                                  />
                                                </div>
                                              ),
                                            )
                                          : null,
                                    )}
                                    <div className="flex justify-center">
                                      <button
                                        className="mt-4 rounded-lg bg-primary px-4 py-2 text-white"
                                        onClick={handlePrintSticker}
                                      >
                                        Print Sticker
                                      </button>
                                    </div>
                                  </>
                                )}
                              <div className="flex justify-center">
                                {isStickerPrinted && (
                                  <>
                                    <button
                                      type="button"
                                      className="rounded-lg bg-green-600 px-4 py-2 text-white"
                                      onClick={handleVerifySticker}
                                    >
                                      Verify Sticker
                                    </button>

                                    <Modal
                                      isOpen={isVerifyStickerModal}
                                      onSubmit={handleVerifyStickerModal}
                                      onClose={closeVerifyStickerModal}
                                      title="Verify Sticker"
                                    >
                                      <div className="space-y-4">
                                        <label className="block text-sm font-medium text-black dark:text-white">
                                          Enter / Scan Serial Number
                                        </label>
                                        <input
                                          type="text"
                                          name="serialNumber"
                                          value={serialNumber}
                                          onChange={(e) =>
                                            setSerialNumber(e.target.value)
                                          }
                                          placeholder="Scan QR code or enter serial number"
                                          className="border-gray-300 dark:border-gray-600 dark:bg-gray-800 w-full rounded-lg border p-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:text-white"
                                        />
                                      </div>
                                    </Modal>
                                  </>
                                )}
                              </div>
                              {!isStickerPrinted && isPassNGButtonShow && (
                                <>
                                  <div className="flex justify-center gap-2 p-6">
                                    <button
                                      className="flex items-center gap-2 rounded-lg bg-success px-3 py-2 text-white hover:bg-blue-400"
                                      type="button"
                                      onClick={() => handleUpdateStatus("Pass")}
                                    >
                                      <svg
                                        width="20px"
                                        height="20px"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#ffffff"
                                      >
                                        <path
                                          d="M4 12.6111L8.92308 17.5L20 6.5"
                                          stroke="#ffffff"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                      Pass
                                    </button>
                                    <button
                                      className="flex items-center gap-2 rounded-lg bg-danger px-3 py-2 text-white hover:bg-danger"
                                      type="button"
                                      onClick={() => handleUpdateStatus("NG")}
                                    >
                                      <svg
                                        width="20px"
                                        height="20px"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        stroke="#ffffff"
                                      >
                                        <path
                                          d="M16 8L8 16M8 8L16 16"
                                          stroke="#ffffff"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                        />
                                      </svg>
                                      NG
                                    </button>
                                  </div>
                                </>
                              )}
                              {processAssignUserStage?.subSteps?.some(
                                (subStep: any) => subStep.isPackagingStatus,
                              ) && (
                                <>
                                  <div className="py-4">
                                    {processAssignUserStage?.subSteps?.map(
                                      (subStep: any, index: number) => (
                                        <div key={index}>
                                          <div className="">
                                            <h3 className="text-md text-md mb-1 mt-3 font-bold text-black">
                                              Carton Details
                                            </h3>
                                            <hr className="pb-4 text-blue-500" />
                                          </div>
                                          <div className="grid sm:grid-cols-2">
                                            <div className="text-gray-700 dark:text-gray-300 mb-2">
                                              <strong className="font-medium">
                                                Carton Dimensions:
                                              </strong>
                                              <span>
                                                (
                                                {
                                                  subStep?.packagingData
                                                    ?.cartonWidth
                                                }{" "}
                                                x{" "}
                                                {
                                                  subStep?.packagingData
                                                    ?.cartonHeight
                                                }
                                                )
                                              </span>
                                            </div>
                                            <div className="text-gray-700 dark:text-gray-300 mb-2">
                                              <strong className="font-medium">
                                                Carton Weight :
                                              </strong>
                                              <span>
                                                {
                                                  subStep?.packagingData
                                                    ?.cartonWeight
                                                }{" "}
                                                kg
                                              </span>
                                            </div>
                                          </div>
                                          <div className="grid sm:grid-cols-2">
                                            <div className="text-gray-700 dark:text-gray-300 mb-2">
                                              <strong className="font-medium">
                                                Max Capacity :
                                              </strong>
                                              {
                                                subStep?.packagingData
                                                  ?.maxCapacity
                                              }
                                            </div>
                                            <div className="text-gray-700 dark:text-gray-300 mb-2">
                                              <strong className="font-medium">
                                                Issued Carton :
                                              </strong>
                                              {processData?.issuedCartons}
                                            </div>
                                          </div>
                                          <div className="flex justify-center gap-2 p-6">
                                            <button
                                              className="flex items-center gap-2 rounded-lg bg-success px-3 py-2 text-white hover:bg-blue-400"
                                              type="button"
                                              onClick={() =>
                                                handleAddToCart(
                                                  subStep?.packagingData,
                                                )
                                              }
                                            >
                                              {" "}
                                              ADD To Cart
                                            </button>
                                            <button
                                              className="flex items-center gap-2 rounded-lg bg-danger px-3 py-2 text-white hover:bg-danger"
                                              type="button"
                                              onClick={() =>
                                                handleUpdateStatus("NG")
                                              }
                                            >
                                              <svg
                                                width="20px"
                                                height="20px"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                stroke="#ffffff"
                                              >
                                                <path
                                                  d="M16 8L8 16M8 8L16 16"
                                                  stroke="#ffffff"
                                                  strokeWidth="2"
                                                  strokeLinecap="round"
                                                />
                                              </svg>
                                              NG
                                            </button>
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-center px-10 py-5">
                                <p>{notFoundError}</p>
                              </div>
                              {notFoundError != "" && (
                                <div className="flex justify-center">
                                  <button
                                    type="button"
                                    className="btn rounded-md bg-black px-2.5 py-2 text-white"
                                    onClick={openReportIssueModel}
                                  >
                                    Report issue
                                  </button>
                                  <Modal
                                    isOpen={isReportIssueModal}
                                    onSubmit={handleSubmitReport}
                                    onClose={closeReportIssueModal}
                                    title="Report Issue"
                                  >
                                    <div className="">
                                      <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                        Choose Issue Type
                                      </label>
                                      <select
                                        className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                                        onChange={(e) =>
                                          setIssueType(e.target.value)
                                        }
                                      >
                                        <option value="">Please Select</option>
                                        <option value="not_found">
                                          Device Not Found
                                        </option>
                                        <option value="technical_fault">
                                          Technical Fault{" "}
                                        </option>
                                      </select>
                                    </div>
                                    <div className="pt-5">
                                      <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                        Description
                                      </label>
                                      <textarea
                                        rows={6}
                                        onChange={(e) =>
                                          setIssueDescription(e.target.value)
                                        }
                                        placeholder="Default textarea"
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                      ></textarea>
                                    </div>
                                  </Modal>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div
                        className="h-35 w-full overflow-y-auto rounded-lg border border-stroke"
                        style={{ height: "247px" }}
                      >
                        <div className="p-4">
                          <h3 className="text-center font-bold">
                            Tested Device history
                          </h3>
                        </div>
                        <div>
                          <table className="px-2">
                            <tr>
                              <th className="w-40">Serial No</th>
                              <th className="w-40">Stage Name</th>
                              <th className="w-40">Status</th>
                              <th className="w-40">Time</th>
                            </tr>
                            {checkedDevice.map((row, rowIndex) => (
                              <tr
                                key={rowIndex}
                                className="rounded-lg p-1 text-center"
                              >
                                <td className="py-1">
                                  {row?.deviceInfo?.serialNo}
                                </td>
                                <td className="py-1">{row?.stageName}</td>
                                <td
                                  className={`py-1 ${row?.status === "Pass" ? "text-green-500" : row?.status === "NG" ? "text-danger" : ""}`}
                                >
                                  {row?.status}
                                </td>
                                <td className="py-1">{row?.timeTaken}</td>
                              </tr>
                            ))}
                          </table>
                        </div>
                      </div>
                      {processAssignUserStage?.isPackagingStatus && (
                        <div
                          className="mt-5 h-35 w-full overflow-y-auto rounded-lg border border-stroke"
                          style={{ height: "247px" }}
                        >
                          <div className="p-4">
                            <h3 className="text-center font-bold">
                              In Cartion Device
                            </h3>
                          </div>
                          <div>
                            <table className="px-2">
                              <tr>
                                <th className="w-40">Serial No</th>
                                <th className="w-40">Stage Name</th>
                                <th className="w-40">Status</th>
                                <th className="w-40">Time</th>
                              </tr>
                              {checkedDevice.map((row, rowIndex) => (
                                <tr
                                  key={rowIndex}
                                  className="rounded-lg p-1 text-center"
                                >
                                  <td className="py-1">
                                    {row?.deviceInfo?.serialNo}
                                  </td>
                                  <td className="py-1">{row?.stageName}</td>
                                  <td
                                    className={`py-1 ${row?.status === "Pass" ? "text-green-500" : row?.status === "NG" ? "text-danger" : ""}`}
                                  >
                                    {row?.status}
                                  </td>
                                  <td className="py-1">{row?.timeTaken}</td>
                                </tr>
                              ))}
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-center space-x-4">
              {!taskStatus ? (
                <button
                  className="rounded-md bg-green-500 px-4 py-2 text-white"
                  onClick={handleStart}
                  disabled={!isPaused}
                >
                  Start
                </button>
              ) : (
                <> 
                  <button
                    className="rounded-md bg-yellow-500 px-4 py-2 text-white"
                    onClick={handlePauseResume}
                  >
                    {isPaused ? "Break Off" : "Break"}
                  </button>
                  <button
                    className="rounded-md bg-danger px-4 py-2 text-white"
                    onClick={handleStop}
                  >
                    Stop
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center py-4">
              <p className="text-danger">
                The process has been on hold from {getDownTimeVal?.downTimeFrom}{" "}
                to {getDownTimeVal?.downTimeTo} due to{" "}
                {getDownTimeVal?.downTimeDesc}.
              </p>
            </div>
          </>
        )
      ) : (
        <>
          <div className="flex items-center justify-center py-4">
            <p className="text-danger">
              The process is currently {processStatus}
            </p>
          </div>
        </>
      )}
    </>
  );
}
