"use client";

import React, { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-xl rounded-2xl border border-red-100 bg-white p-8 shadow-lg">
        <div className="text-xs font-black uppercase tracking-[0.24em] text-red-500">
          Something went wrong
        </div>
        <h1 className="mt-3 text-2xl font-black text-gray-900">
          We could not load this page.
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          The page hit an unexpected error while rendering. You can retry the
          current route now.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            Reload
          </button>
        </div>
        {process.env.NODE_ENV !== "production" && (
          <pre className="mt-6 overflow-auto rounded-xl bg-gray-50 p-4 text-xs text-gray-500">
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}
