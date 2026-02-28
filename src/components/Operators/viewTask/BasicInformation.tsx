"use client";
import Image from "next/image";
import React, { useMemo } from "react";
import { Coffee } from "lucide-react";

type SubStep = {
  stepName?: string;
  stepType?: string;
  stepFields?: {
    validationType?: string;
    value?: string | number;
    rangeFrom?: string | number;
    rangeTo?: string | number;
  };
  jigFields?: Array<{ jigName?: string; value?: string | number }>;
};

type Product = {
  name?: string;
  orderConfirmationNo?: string;
  processID?: string | number;
  sopFile?: string;
};

type AssignUserStage = {
  name?: string;
  subSteps?: SubStep[];
};

type Shift = {
  weekDays?: Record<string, boolean>;
  intervals?: Array<{
    startTime?: string;
    endTime?: string;
    breakTime?: boolean;
  }>;
};

type PlaningAndScheduling = {
  ProcessShiftMappings?: { startTime?: string; endTime?: string } | null;
};

interface BasicInformationProps {
  product?: Product | null;
  assignUserStage?: AssignUserStage | null;
  getPlaningAndScheduling?: PlaningAndScheduling | null;
  shift?: Shift | null;
  setStartTest: (v: boolean) => void;
  processAssignUserStage: any[];
  isDownTimeEnable?: boolean;
}

export default function BasicInformation({
  product,
  assignUserStage,
  getPlaningAndScheduling,
  shift,
  setStartTest,
  processAssignUserStage,
  isDownTimeEnable,
}: BasicInformationProps) {
  const handleStartTesting = () => setStartTest(true);

  const shiftTimeRange = useMemo(() => {
    const m = getPlaningAndScheduling?.ProcessShiftMappings;
    return m ? `${m.startTime || "--"} - ${m.endTime || "--"}` : "--";
  }, [getPlaningAndScheduling]);

  const shiftDays = useMemo(() => {
    if (!shift?.weekDays) return "--";
    return (
      Object.keys(shift.weekDays)
        .filter((d) => shift.weekDays?.[d])
        .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
        .join(", ") || "--"
    );
  }, [shift]);

  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="process-details"
          className="rounded-xl bg-white p-5 shadow-md"
        >
          <h3
            id="process-details"
            className="text-gray-800 border-b pb-2 text-lg font-semibold"
          >
            Process Details
          </h3>

          <dl className="text-gray-700 mt-3 grid gap-y-2 text-sm">
            <div>
              <dt className="font-medium">Process Name</dt>
              <dd>{product?.name ?? "--"}</dd>
            </div>

            <div>
              <dt className="font-medium">Stage Name</dt>
              <dd>
                {(Array.isArray(assignUserStage)
                  ? assignUserStage?.[0]?.name
                  : (assignUserStage as any)?.name) ?? "--"}
              </dd>
            </div>

            <div>
              <dt className="font-medium">Shift</dt>
              <dd>{shiftTimeRange}</dd>
            </div>

            <div>
              <dt className="font-medium">Order Confirmation No</dt>
              <dd>{product?.orderConfirmationNo ?? "--"}</dd>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <dt className="font-medium">Process ID</dt>
                <dd className="max-w-xs truncate">
                  {String(product?.processID ?? "--")}
                </dd>
              </div>

              {/* copy icon (inline svg) */}
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard?.writeText(
                    String(product?.processID ?? ""),
                  )
                }
                aria-label="Copy process id"
                className="text-gray-600 hover:bg-gray-50 ml-auto inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 16h8M8 12h8M8 8h8"
                  />
                </svg>
                Copy
              </button>
            </div>

            <div>
              <dt className="font-medium">Shift Days</dt>
              <dd>{shiftDays}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl bg-white p-5 shadow-md">
          <h3 className="text-gray-800 border-b pb-2 text-lg font-semibold">
            Steps to Perform
          </h3>
          <ul className="scrollbar-thin scrollbar-thumb-gray-200 mt-3 max-h-60 space-y-3 overflow-y-auto pr-2">
            {processAssignUserStage?.subSteps?.length ? (
              processAssignUserStage?.subSteps?.map((stage, index) => (
                <li key={index} className="bg-gray-50 rounded-lg border p-3">
                  <p className="text-gray-900 font-medium">
                    Step {index + 1}: {stage.stepName ?? "Unnamed"}
                  </p>
                  <div className="text-gray-600 mt-2 text-sm">
                    {stage.stepType === "manual" ? (
                      stage.stepFields?.validationType === "value" ? (
                        <div>
                          Value: <b>{stage.stepFields?.value ?? "--"}</b>
                        </div>
                      ) : stage.stepFields?.rangeFrom ? (
                        <div>
                          Range: <b>{stage.stepFields?.rangeFrom ?? "--"}</b> -{" "}
                          <b>{stage.stepFields?.rangeTo ?? "--"}</b>
                        </div>
                      ) : null
                    ) : (
                      stage.jigFields?.map((jf, i) => (
                        <div key={i}>
                          <b>{jf.jigName ?? "Jig"}:</b>{" "}
                          {jf.validationType === "value" ? (
                            <b>{jf.value ?? "--"}</b>
                          ) : jf.validationType === "range" ? (
                            <>
                              <b>{jf.rangeFrom ?? "--"}</b> -{" "}
                              <b>{jf.rangeTo ?? "--"}</b>
                            </>
                          ) : (
                            "--"
                          )}
                        </div>
                      ))
                    )}

                    {/* {stage.stepType === "manual" ? (
                      stage.stepFields?.validationType === "value" ? (
                        <div>
                          Value: <b>{stage.stepFields?.value ?? "--"}</b>
                        </div>
                      ) : stage.stepFields?.rangeFrom ? (
                        <div>
                          Range: <b>{stage.stepFields?.rangeFrom ?? "--"}</b> -{" "}
                          <b>{stage.stepFields?.rangeTo ?? "--"}</b>
                        </div>
                      ) : null
                    ) : (
                      stage.jigFields?.map((jf, i) => (
                        <div key={i}>
                          <b>{jf.jigName ?? "Jig"}:</b> {jf.value ?? "--"}
                        </div>
                      ))
                    )} */}
                  </div>
                </li>
              ))
            ) : (
              <li className="text-gray-500">
                No steps configured for this stage.
              </li>
            )}
          </ul>
        </section>

        {shift?.intervals && (
          <section className="rounded-xl bg-white p-5 shadow-md lg:col-span-2">
            <h3 className="text-gray-800 border-b pb-2 text-lg font-semibold">
              Shift Summary
            </h3>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {shift.intervals.map((interval, idx) => {
                const isBreak = Boolean(interval.breakTime);
                // Inline style fallback ensures red background even if Tailwind utility
                // classes are not available or purged in production builds.
                const fallbackStyle = isBreak
                  ? { backgroundColor: "#dc2626", color: "#ffffff" }
                  : undefined;

                return (
                  <div
                    key={idx}
                    style={fallbackStyle}
                    className={`rounded-lg px-4 py-2 text-sm font-medium shadow ${isBreak
                      ? "bg-red-600 text-white"
                      : "bg-green-100 text-green-700"
                      }`}
                  >
                    {isBreak
                      ? `Break: ${interval.startTime ?? "--"} - ${interval.endTime ?? "--"}`
                      : `Interval: ${interval.startTime ?? "--"} - ${interval.endTime ?? "--"}`}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <section className="mt-6 rounded-xl bg-white p-6 shadow-md">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-gray-800 flex items-center gap-3 text-lg font-semibold">
            {/* book/svg icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 4H8a2 2 0 00-2 2v12"
              />
            </svg>
            <span>Standard Operating Procedure (SOP)</span>
          </h3>

          <span className="rounded-md bg-blue-100 px-3 py-1 text-xs font-medium text-blue-600">
            Active
          </span>
        </div>

        <div className="text-gray-700 mt-4 space-y-3 text-sm">
          {product?.sopFile ? (
            <div className="mt-4">
              <h4 className="text-md text-gray-800 mb-2 font-semibold">
                SOP Preview
              </h4>

              {product.sopFile.endsWith(".pdf") ? (
                <div className="h-96 w-full overflow-hidden rounded-lg border">
                  <iframe
                    src={product.sopFile}
                    title="SOP PDF Preview"
                    className="h-full w-full"
                  />
                </div>
              ) : product.sopFile.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <div className="flex h-96 w-full items-center justify-center overflow-hidden rounded-lg border">
                  <Image
                    src={product.sopFile}
                    alt="SOP Preview"
                    className="object-contain"
                    width={1200}
                    height={800}
                  />
                </div>
              ) : (
                <a
                  href={product.sopFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-md bg-blue-700 px-5 py-2 text-white"
                >
                  Open SOP File
                </a>
              )}
            </div>
          ) : (
            <div className="text-gray-500 mt-2 text-center">No SOP Found</div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium shadow transition-all focus:outline-none focus:ring-2 
              ${isDownTimeEnable
                ? "bg-gray-400 text-gray-200 cursor-not-allowed border border-gray-300"
                : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300"
              }`}
            onClick={handleStartTesting}
            disabled={isDownTimeEnable}
            aria-label={isDownTimeEnable ? "Testing disabled - process on hold" : "Start testing"}
          >
            {isDownTimeEnable ? (
              <span className="flex items-center gap-2">
                <Coffee className="h-4 w-4" />
                System On Hold
              </span>
            ) : "Start Test"}
          </button>
        </div>
      </section>
    </>
  );
}
