"use client";
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { bulkCreateEsimMaster } from "@/lib/api";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";

const normalizeKey = (key: unknown) =>
  String(key ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[_-]+/g, "");

const mapRowKeys = (row: any) => {
  if (!row || typeof row !== "object") return null;
  const entries = Object.entries(row);
  const mapped: any = {};
  for (const [k, v] of entries) {
    const nk = normalizeKey(k);
    if (nk === "ccid") mapped.ccid = v;
    if (nk === "esimmake" || nk === "make" || nk === "vendor") mapped.esimMake = v;
    if (nk === "profile1" || nk === "profiledata1") mapped.profile1 = v;
    if (nk === "profile2" || nk === "profiledata2") mapped.profile2 = v;
  }
  if (
    mapped.ccid === undefined &&
    mapped.esimMake === undefined &&
    mapped.profile1 === undefined &&
    mapped.profile2 === undefined
  ) {
    return null;
  }
  return {
    ccid: String(mapped.ccid ?? "").trim(),
    esimMake: String(mapped.esimMake ?? "").trim(),
    profile1: String(mapped.profile1 ?? "").trim(),
    profile2: String(mapped.profile2 ?? "").trim(),
  };
};

const parseCsv = (csvText: string) => {
  const firstNonEmptyLine =
    csvText
      .split(/\r?\n/)
      .map((l) => l.trimEnd())
      .find((l) => l.trim().length > 0) ?? "";
  const candidates = [",", ";", "\t", "|"];
  let delimiter = ",";
  let bestCount = -1;
  for (const c of candidates) {
    const count = firstNonEmptyLine.split(c).length - 1;
    if (count > bestCount) {
      bestCount = count;
      delimiter = c;
    }
  }

  const rows: string[][] = [];
  let current: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    const next = csvText[i + 1];
    if (ch === '"' && inQuotes && next === '"') {
      cell += '"';
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      current.push(cell);
      cell = "";
      continue;
    }
    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i++;
      current.push(cell);
      cell = "";
      if (current.some((c) => c.trim().length > 0)) rows.push(current);
      current = [];
      continue;
    }
    cell += ch;
  }
  current.push(cell);
  if (current.some((c) => c.trim().length > 0)) rows.push(current);
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.replace(/^\uFEFF/, "").trim());
  const dataRows = rows.slice(1);
  return dataRows
    .map((r) => {
      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = r[idx] ?? "";
      });
      return obj;
    })
    .filter((r) => Object.values(r).some((v) => String(v ?? "").trim().length > 0));
};

const BulkUploadEsimMaster = () => {
  const [fileData, setFileData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setFileName(file.name);

    const ext = file.name.toLowerCase().split(".").pop() || "";
    const reader = new FileReader();

    if (ext === "xlsx" || ext === "xls") {
      reader.onload = () => {
        try {
          const buf = reader.result as ArrayBuffer;
          const wb = XLSX.read(buf, { type: "array" });
          const firstSheetName = wb.SheetNames?.[0];
          const sheet = firstSheetName ? wb.Sheets[firstSheetName] : null;
          if (!sheet) {
            toast.error("No sheet found in the Excel file.");
            setFileData([]);
            return;
          }
          const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });
          const mapped = (raw as any[])
            .map((r) => mapRowKeys(r))
            .filter(Boolean) as any[];
          if (mapped.length === 0) {
            toast.error(
              "No valid rows found. Required columns: ccid, esimMake, profile1, profile2.",
            );
            setFileData([]);
            return;
          }
          setFileData(mapped);
        } catch (e: any) {
          toast.error(e?.message || "Error parsing Excel file.");
          setFileData([]);
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    reader.onload = () => {
      try {
        const text = reader.result as string;
        if (ext === "json") {
          const json = JSON.parse(text);
          if (Array.isArray(json)) {
            const mapped = json.map((r) => mapRowKeys(r)).filter(Boolean) as any[];
            if (mapped.length === 0) {
              toast.error(
                "No valid rows found. Required keys: ccid, esimMake, profile1, profile2.",
              );
              setFileData([]);
              return;
            }
            setFileData(mapped);
          } else {
            toast.error("Invalid JSON format. Expected an array of objects.");
            setFileData([]);
          }
          return;
        }

        if (ext === "csv" || ext === "txt") {
          const raw = parseCsv(text);
          const mapped = raw.map((r) => mapRowKeys(r)).filter(Boolean) as any[];
          if (mapped.length === 0) {
            toast.error(
              "No valid rows found. Required columns: ccid, esimMake, profile1, profile2.",
            );
            setFileData([]);
            return;
          }
          setFileData(mapped);
          return;
        }

        toast.error("Unsupported file type. Please upload JSON, CSV, or XLSX.");
        setFileData([]);
      } catch (e: any) {
        toast.error(e?.message || "Error parsing file.");
        setFileData([]);
      }
    };

    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
      "text/csv": [".csv"],
      "application/csv": [".csv"],
      "text/plain": [".csv", ".txt"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls", ".csv"],
      "application/octet-stream": [".csv", ".xls", ".xlsx"],
    },
    onDropRejected: (fileRejections) => {
      const first = fileRejections?.[0]?.file;
      toast.error(
        `File not accepted${first?.name ? `: ${first.name}` : ""}. Please upload JSON, CSV, or XLSX.`,
      );
    },
    multiple: false,
  });

  const handleUpload = async () => {
    if (fileData.length === 0) {
      toast.error("No data to upload.");
      return;
    }

    setLoading(true);
    try {
      await bulkCreateEsimMaster(fileData);
      toast.success("ESIM Masters uploaded successfully!");
      setFileData([]);
      setFileName("");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload ESIM Masters.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="Bulk Upload ESIM Masters" parentName="ESIM Master" />
        <ToastContainer />
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-medium text-black dark:text-white">
                Upload ESIM Master File
              </h3>
              <Link
                href="/esim-master"
                className="rounded border border-stroke px-4 py-2 text-sm font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
              >
                View List
              </Link>
            </div>
          </div>
          <div className="p-6.5">
            <div
              {...getRootProps()}
              className={`dropzone cursor-pointer rounded-md border-2 border-dashed p-10 text-center ${
                isDragActive ? "border-primary bg-gray-100" : "border-gray-300"
              }`}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Drop the JSON file here ...</p>
              ) : (
                <p>Drag 'n' drop a JSON / CSV / XLSX file here, or click to select one</p>
              )}
              {fileName && (
                <p className="mt-2 font-semibold text-primary">{fileName}</p>
              )}
            </div>

            {fileData.length > 0 && (
              <div className="mt-6">
                <h4 className="mb-2 text-lg font-semibold">
                  Preview ({fileData.length} records)
                </h4>
                <div className="max-h-60 overflow-y-auto rounded-md border border-gray-300">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-gray-100">
                      <tr>
                        <th className="border-b p-2">CCID</th>
                        <th className="border-b p-2">Make</th>
                        <th className="border-b p-2">Profile 1</th>
                        <th className="border-b p-2">Profile 2</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fileData.slice(0, 5).map((row, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2">{row.ccid}</td>
                          <td className="p-2">{row.esimMake}</td>
                          <td
                            className="max-w-xs truncate p-2"
                            title={row.profile1}
                          >
                            {row.profile1}
                          </td>
                          <td
                            className="max-w-xs truncate p-2"
                            title={row.profile2}
                          >
                            {row.profile2}
                          </td>
                        </tr>
                      ))}
                      {fileData.length > 5 && (
                        <tr>
                          <td colSpan={4} className="p-2 text-center text-gray-500">
                            ... and {fileData.length - 5} more records
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setFileData([]);
                      setFileName("");
                    }}
                    className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    className="flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90"
                    disabled={loading}
                  >
                    {loading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default BulkUploadEsimMaster;
