"use client";
import Image from "next/image";
import React from "react";

interface BasicInformationProps {
  product: any;
  assignUserStage: any;
  getPlaningAndScheduling: any;
  shift: any;
  setStartTest: any;
}

export default function BasicInformation({
  product,
  assignUserStage,
  getPlaningAndScheduling,
  shift,
  setStartTest,
}: BasicInformationProps) {
  const handleStartTesting = () => {
    setStartTest(true);
  };
  return (
    <>
      {/* Compact Grid Layout */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Process Details */}
        <div className="rounded-xl bg-white p-5 shadow-md">
          <h3 className="text-gray-800 border-b pb-2 text-lg font-semibold">
            Process Details
          </h3>
          <div className="text-gray-700 mt-3 grid gap-y-2 text-sm">
            <p>
              <b>Process Name:</b> {product?.name}
            </p>
            <p>
              <b>Stage Name:</b> {assignUserStage?.name}
            </p>
            <p>
              <b>Shift:</b>{" "}
              {getPlaningAndScheduling?.ProcessShiftMappings &&
                `(${getPlaningAndScheduling?.ProcessShiftMappings?.startTime} - ${getPlaningAndScheduling?.ProcessShiftMappings?.endTime})`}
            </p>
            <p>
              <b>Order Confirmation No:</b> {product?.orderConfirmationNo}
            </p>
            <p>
              <b>Process ID:</b> {product?.processID}
            </p>
            <p>
              <b>Shift Days:</b>{" "}
              {shift?.weekDays &&
                Object.keys(shift?.weekDays)
                  .filter((day) => shift?.weekDays[day])
                  .join(", ")}
            </p>
          </div>
        </div>

        {/* Steps (scrollable if too long) */}
        <div className="rounded-xl bg-white p-5 shadow-md">
          <h3 className="text-gray-800 border-b pb-2 text-lg font-semibold">
            Steps to Perform
          </h3>
          <ul className="mt-3 max-h-60 space-y-3 overflow-y-auto">
            {assignUserStage?.subSteps?.map((stage: any, index: number) => (
              <li key={index} className="bg-gray-50 rounded-lg border p-2">
                <p className="text-gray-900 font-medium">
                  Step {index + 1}: {stage.stepName}
                </p>
                <div className="text-gray-600 mt-1 text-sm">
                  {stage?.stepType === "manual" ? (
                    stage?.stepFields?.validationType === "value" ? (
                      <>
                        Value: <b>{stage?.stepFields?.value}</b>
                      </>
                    ) : (
                      <>
                        Range: <b>{stage?.stepFields?.rangeFrom}</b> -{" "}
                        <b>{stage?.stepFields?.rangeTo}</b>
                      </>
                    )
                  ) : (
                    stage?.jigFields?.map((jigStage: any, i: number) => (
                      <div key={i}>
                        <b>{jigStage?.jigName}:</b> {jigStage?.value}
                      </div>
                    ))
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Shift Summary */}
        {shift?.intervals && (
          <div className="rounded-xl bg-white p-5 shadow-md lg:col-span-2">
            <h3 className="text-gray-800 border-b pb-2 text-lg font-semibold">
              Shift Summary
            </h3>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              {shift?.intervals?.map((interval: any, index: number) => (
                <div
                  key={index}
                  className={`rounded-lg px-4 py-2 text-sm font-medium shadow ${
                    interval.breakTime
                      ? "bg-danger text-white"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {interval.breakTime
                    ? `Break: ${interval.startTime} - ${interval.endTime}`
                    : `Interval: ${interval.startTime} - ${interval.endTime}`}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-6 rounded-xl bg-white p-6 shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-gray-800 text-lg font-semibold">
            📋 Standard Operating Procedure (SOP)
          </h3>
          <span className="rounded-md bg-blue-100 px-3 py-1 text-xs font-medium text-blue-600">
            Active
          </span>
        </div>

        {/* SOP Content */}
        <div className="text-gray-700 mt-4 space-y-3 text-sm">
          {product?.sopFile ? (
            <div className="mt-4">
              <h3 className="text-md text-gray-800 mb-2 font-semibold">
                📋 SOP Preview
              </h3>

              {product?.sopFile.endsWith(".pdf") ? (
                // PDF Preview
                <iframe
                  src={product?.sopFile}
                  className="h-96 w-full rounded-lg border"
                  title="SOP PDF Preview"
                />
              ) : product?.sopFile.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                // Image Preview
                <Image
                  src={product?.sopFile}
                  alt="SOP Preview"
                  className="h-96 w-full rounded-lg object-contain"
                />
              ) : (
                // Fallback: download / open
                <a
                  href={product?.sopFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-blue-700 px-5 py-2 text-white"
                >
                  Open SOP File
                </a>
              )}
            </div>
          ) : (
            <div className="text-gray-500 mt-2 text-center">No SOP Found</div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
            onClick={handleStartTesting}
          >
            Start Test
          </button>
        </div>
      </div>
    </>
  );
}
