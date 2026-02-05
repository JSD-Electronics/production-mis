"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { viewEsimMasters } from "@/lib/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const normalizeKey = (key: unknown) =>
  String(key ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[_-]+/g, "");

const mapRow = (row: any) => {
  if (!row || typeof row !== "object") return null;
  const entries = Object.entries(row);
  const mapped: any = {};
  for (const [k, v] of entries) {
    const nk = normalizeKey(k);
    if (nk === "ccid") mapped.ccid = v;
    if (nk === "esimmake" || nk === "make" || nk === "vendor") mapped.esimMake = v;
    if (nk === "profile1" || nk === "profiledata1") mapped.profile1 = v;
    if (nk === "profile2" || nk === "profiledata2") mapped.profile2 = v;
    if (nk === "createdat" || nk === "created_at" || nk === "created") mapped.createdAt = v;
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
    createdAt: mapped.createdAt,
  };
};

const formatDate = (value: any) => {
  if (!value) return "";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  return dt.toLocaleString();
};

export default function EsimMasterListPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await viewEsimMasters();
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.esimMasters)
            ? res.esimMasters
            : [];
      const mapped = list.map((r: any) => mapRow(r)).filter(Boolean) as any[];
      setRows(mapped);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load ESIM Masters.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const ccid = String(r?.ccid ?? "").toLowerCase();
      const make = String(r?.esimMake ?? "").toLowerCase();
      return ccid.includes(q) || make.includes(q);
    });
  }, [query, rows]);

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="ESIM Masters" parentName="" />
        <ToastContainer />

        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-medium text-black dark:text-white">ESIM Master List</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={load}
                  disabled={loading}
                  className="rounded border border-stroke px-4 py-2 text-sm font-medium text-black hover:shadow-1 disabled:opacity-60 dark:border-strokedark dark:text-white"
                >
                  {loading ? "Loading..." : "Refresh"}
                </button>
                <Link
                  href="/esim-master/bulk-upload"
                  className="rounded bg-primary px-4 py-2 text-sm font-medium text-gray hover:bg-opacity-90"
                >
                  Bulk Upload
                </Link>
              </div>
            </div>
          </div>

          <div className="p-6.5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {filtered.length} records
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by CCID or Make"
                className="w-full max-w-md rounded border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>

            <div className="max-h-[65vh] overflow-y-auto rounded-md border border-gray-300 dark:border-strokedark">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-gray-100 dark:bg-boxdark">
                  <tr>
                    <th className="border-b p-2">CCID</th>
                    <th className="border-b p-2">Make</th>
                    <th className="border-b p-2">Profile 1</th>
                    <th className="border-b p-2">Profile 2</th>
                    <th className="border-b p-2">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, index) => (
                    <tr key={`${row.ccid}-${index}`} className="border-b hover:bg-gray-50 dark:hover:bg-strokedark">
                      <td className="p-2">{row.ccid}</td>
                      <td className="p-2">{row.esimMake}</td>
                      <td className="max-w-xs truncate p-2" title={row.profile1}>
                        {row.profile1}
                      </td>
                      <td className="max-w-xs truncate p-2" title={row.profile2}>
                        {row.profile2}
                      </td>
                      <td className="p-2">{formatDate(row.createdAt)}</td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-500">
                        No ESIM Masters found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
