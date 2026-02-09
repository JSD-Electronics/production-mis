"use client";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { bulkCreateEsimMaster, viewEsimMakes, viewEsimProfiles, viewEsimApns } from "@/lib/api";
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

const sanitizeApn = (value: string) => {
  return value.replace(/[^a-zA-Z0-9.]/g, "");
};

const mapRowKeys = (row: any, mode: "full" | "ccid") => {
  if (!row || typeof row !== "object") return null;
  const entries = Object.entries(row);
  const mapped: any = {};
  for (const [k, v] of entries) {
    const nk = normalizeKey(k);
    if (nk === "ccid") mapped.ccid = v;
    if (mode === "full") {
      if (nk === "esimmake" || nk === "make" || nk === "vendor") mapped.esimMake = v;
      if (nk === "profile1" || nk === "profiledata1") mapped.profile1 = v;
      if (nk === "profile2" || nk === "profiledata2") mapped.profile2 = v;
      if (nk === "apnprofile1" || nk === "apn1") mapped.apnProfile1 = sanitizeApn(String(v ?? ""));
      if (nk === "apnprofile2" || nk === "apn2") mapped.apnProfile2 = sanitizeApn(String(v ?? ""));
    }
  }

  if (mapped.ccid === undefined) return null;

  if (mode === "full") {
    return {
      ccid: String(mapped.ccid ?? "").trim(),
      esimMake: String(mapped.esimMake ?? "").trim(),
      profile1: String(mapped.profile1 ?? "").trim(),
      profile2: String(mapped.profile2 ?? "").trim(),
      apnProfile1: String(mapped.apnProfile1 ?? "").trim(),
      apnProfile2: String(mapped.apnProfile2 ?? "").trim(),
    };
  } else {
    return {
      ccid: String(mapped.ccid ?? "").trim(),
    };
  }
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
  const [mode, setMode] = useState<"full" | "ccid">("full");

  const [makes, setMakes] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [apns, setApns] = useState<any[]>([]);

  const [selection, setSelection] = useState({
    esimMake: "",
    profile1: "",
    profile2: "",
    apnProfile1: "",
    apnProfile2: "",
  });

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [mRes, pRes, aRes] = await Promise.all([viewEsimMakes(), viewEsimProfiles(), viewEsimApns()]);
        setMakes(mRes.data || []);
        setProfiles(pRes.data || []);
        setApns(aRes.data || []);
      } catch (err) {
        toast.error("Error fetching master lists.");
      }
    };
    fetchMasters();
  }, []);

  const profile1Options = useMemo(() => {
    if (!selection.profile2) return profiles;
    return profiles.filter((p) => {
      const names = Array.isArray(p.name) ? p.name : [p.name];
      return !names.includes(selection.profile2);
    });
  }, [profiles, selection.profile2]);

  const profile2Options = useMemo(() => {
    if (!selection.profile1) return profiles;
    return profiles.filter((p) => {
      const names = Array.isArray(p.name) ? p.name : [p.name];
      return !names.includes(selection.profile1);
    });
  }, [profiles, selection.profile1]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setFileName(file.name);

    const ext = file.name.toLowerCase().split(".").pop() || "";
    const reader = new FileReader();

    const processData = (raw: any[]) => {
      const mapped = raw.map((r) => mapRowKeys(r, mode)).filter(Boolean) as any[];
      if (mapped.length === 0) {
        toast.error(
          mode === "full"
            ? "No valid rows found. Required columns: ccid, esimMake, profile1, profile2."
            : "No valid rows found. Required column: ccid.",
        );
        setFileData([]);
        return;
      }
      setFileData(mapped);
    };

    if (ext === "xlsx" || ext === "xls") {
      reader.onload = () => {
        try {
          const buf = reader.result as ArrayBuffer;
          const wb = XLSX.read(buf, { type: "array" });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });
          processData(raw);
        } catch (e: any) {
          toast.error("Error parsing Excel file.");
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
          processData(Array.isArray(json) ? json : [json]);
        } else if (ext === "csv" || ext === "txt") {
          processData(parseCsv(text));
        } else {
          toast.error("Unsupported file type.");
        }
      } catch (e) {
        toast.error("Error parsing file.");
      }
    };
    reader.readAsText(file);
  }, [mode]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: false,
  });

  const handleUpload = async () => {
    if (fileData.length === 0) return;

    if (mode === "ccid" && (!selection.esimMake || !selection.profile1)) {
      toast.warn("Please select ESIM Make and Profile 1");
      return;
    }

    setLoading(true);
    try {
      const finalData = mode === "ccid"
        ? fileData.map(r => ({ ...r, ...selection }))
        : fileData;

      await bulkCreateEsimMaster(finalData);
      toast.success(`${fileData.length} ESIM Masters uploaded!`);
      setFileData([]);
      setFileName("");
    } catch (error: any) {
      toast.error(error.message || "Upload failed.");
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
              <h3 className="font-medium text-black dark:text-white">Upload Settings</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => { setMode("full"); setFileData([]); setFileName(""); }}
                  className={`px-4 py-2 rounded text-sm font-medium border transition ${mode === "full" ? "bg-primary text-white border-primary" : "border-stroke dark:text-white"}`}
                >
                  Full Data Mode
                </button>
                <button
                  onClick={() => { setMode("ccid"); setFileData([]); setFileName(""); }}
                  className={`px-4 py-2 rounded text-sm font-medium border transition ${mode === "ccid" ? "bg-primary text-white border-primary" : "border-stroke dark:text-white"}`}
                >
                  CCID Only Mode
                </button>
              </div>
            </div>
          </div>

          <div className="p-6.5">
            {mode === "ccid" && (
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border p-4 rounded bg-gray-50 dark:bg-meta-4 dark:border-strokedark">
                <div className="col-span-full mb-2 border-b pb-2">
                  <p className="text-sm font-semibold text-primary">Apply to all CCIDs in file:</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium dark:text-white">ESIM Make</label>
                  <select
                    value={selection.esimMake}
                    onChange={(e) => setSelection({ ...selection, esimMake: e.target.value })}
                    className="w-full rounded border border-stroke bg-white py-2 px-3 text-sm outline-none dark:border-strokedark dark:bg-boxdark dark:text-white"
                  >
                    <option value="">Select Make</option>
                    {makes.map(m => <option key={m._id} value={m.name}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium dark:text-white">Profile 1</label>
                  <select
                    value={selection.profile1}
                    onChange={(e) => setSelection({ ...selection, profile1: e.target.value })}
                    className="w-full rounded border border-stroke bg-white py-2 px-3 text-sm outline-none dark:border-strokedark dark:bg-boxdark dark:text-white"
                  >
                    <option value="">Select Profile 1</option>
                    {profile1Options.map((p) => {
                      const names = Array.isArray(p.name) ? p.name : [p.name];
                      const mainName = names[0] || p.profileId;
                      return (
                        <optgroup key={p._id} label={mainName}>
                          {names.map((n: string, idx: number) => (
                            <option key={`${p._id}-${idx}`} value={n}>{n}</option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium dark:text-white">Profile 2</label>
                  <select
                    value={selection.profile2}
                    onChange={(e) => setSelection({ ...selection, profile2: e.target.value })}
                    className="w-full rounded border border-stroke bg-white py-2 px-3 text-sm outline-none dark:border-strokedark dark:bg-boxdark dark:text-white"
                  >
                    <option value="">Select Profile 2</option>
                    {profile2Options.map((p) => {
                      const names = Array.isArray(p.name) ? p.name : [p.name];
                      const mainName = names[0] || p.profileId;
                      return (
                        <optgroup key={p._id} label={mainName}>
                          {names.map((n: string, idx: number) => (
                            <option key={`${p._id}-${idx}`} value={n}>{n}</option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium dark:text-white">APN Profile 1</label>
                  <select
                    value={selection.apnProfile1}
                    onChange={(e) => setSelection({ ...selection, apnProfile1: e.target.value })}
                    className="w-full rounded border border-stroke bg-white py-2 px-3 text-sm outline-none dark:border-strokedark dark:bg-boxdark dark:text-white"
                  >
                    <option value="">Select APN</option>
                    {apns.map((a) => {
                      const names = Array.isArray(a.apnName) ? a.apnName : [a.apnName];
                      const mainName = names[0] || "APN";
                      return (
                        <optgroup key={a._id} label={`${mainName} (${a.esimMake})`}>
                          {names.map((n: string, idx: number) => (
                            <option key={`${a._id}-${idx}`} value={n}>{n}</option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium dark:text-white">APN Profile 2</label>
                  <select
                    value={selection.apnProfile2}
                    onChange={(e) => setSelection({ ...selection, apnProfile2: e.target.value })}
                    className="w-full rounded border border-stroke bg-white py-2 px-3 text-sm outline-none dark:border-strokedark dark:bg-boxdark dark:text-white"
                  >
                    <option value="">Select APN</option>
                    {apns.map((a) => {
                      const names = Array.isArray(a.apnName) ? a.apnName : [a.apnName];
                      const mainName = names[0] || "APN";
                      return (
                        <optgroup key={a._id} label={`${mainName} (${a.esimMake})`}>
                          {names.map((n: string, idx: number) => (
                            <option key={`${a._id}-${idx}`} value={n}>{n}</option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
              </div>
            )}

            <div
              {...getRootProps()}
              className={`dropzone cursor-pointer rounded-md border-2 border-dashed p-10 text-center transition ${isDragActive ? "border-primary bg-gray-100 dark:bg-strokedark" : "border-gray-300 dark:border-strokedark"
                }`}
            >
              <input {...getInputProps()} />
              <p className="dark:text-white">
                {isDragActive ? "Drop the file here ..." : `Drag 'n' drop a ${mode === "full" ? "JSON / CSV / XLSX" : "CCID list"} here, or click to select one`}
              </p>
              {fileName && <p className="mt-2 font-semibold text-primary">{fileName}</p>}
            </div>

            {fileData.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold dark:text-white">Preview ({fileData.length} records)</h4>
                  <div className="flex gap-2">
                    <button onClick={() => { setFileData([]); setFileName(""); }} className="rounded border border-stroke px-4 py-1 text-sm font-medium dark:text-white hover:bg-gray-100 dark:hover:bg-strokedark">Clear</button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto rounded-md border border-stroke dark:border-strokedark">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-gray-100 dark:bg-boxdark dark:text-white">
                      <tr>
                        <th className="border-b p-3">CCID</th>
                        {mode === "full" && (
                          <>
                            <th className="border-b p-3">Make</th>
                            <th className="border-b p-3">Profile 1</th>
                            <th className="border-b p-3">Profile 2</th>
                            <th className="border-b p-3">APN 1</th>
                            <th className="border-b p-3">APN 2</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="dark:text-white">
                      {fileData.slice(0, 10).map((row, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-strokedark transition-colors">
                          <td className="p-3">{row.ccid}</td>
                          {mode === "full" && (
                            <>
                              <td className="p-3">{row.esimMake}</td>
                              <td className="p-3 truncate max-w-xs" title={row.profile1}>{row.profile1}</td>
                              <td className="p-3 truncate max-w-xs" title={row.profile2}>{row.profile2}</td>
                              <td className="p-3">{row.apnProfile1}</td>
                              <td className="p-3">{row.apnProfile2}</td>
                            </>
                          )}
                        </tr>
                      ))}
                      {fileData.length > 10 && (
                        <tr>
                          <td colSpan={mode === "full" ? 6 : 1} className="p-4 text-center text-gray-500 bg-gray-50 dark:bg-boxdark">
                            ... and {fileData.length - 10} more records
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleUpload}
                    disabled={loading}
                    className="flex justify-center rounded bg-primary px-10 py-3 font-medium text-white hover:bg-opacity-90 disabled:bg-opacity-50 transition-all shadow-lg"
                  >
                    {loading ? "Uploading..." : `Upload ${fileData.length} Records`}
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
