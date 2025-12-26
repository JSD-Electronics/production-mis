import React from "react";
import { FileText, BookOpenCheck } from "lucide-react";
import Image from "next/image";

interface SOPSectionProps {
  product: any;
}

export default function SOPSection({ product }: SOPSectionProps) {
  return (
    <div className="mt-6 rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3 dark:border-gray-700">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-white">
          <FileText className="h-5 w-5 text-blue-600" />
          Standard Operating Procedure (SOP)
        </h3>
        <span className="rounded-md bg-blue-100 px-3 py-1 text-xs font-medium text-blue-600 dark:bg-blue-900 dark:text-blue-200">
          Active
        </span>
      </div>

      {/* SOP Content */}
      <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
        {product?.sopFile ? (
          <div className="mt-4">
            <h3 className="mb-2 flex items-center gap-2 text-md font-semibold text-gray-800 dark:text-white">
              <BookOpenCheck className="h-5 w-5 text-green-600" />
              SOP Preview
            </h3>

            {product?.sopFile.endsWith(".pdf") ? (
              // PDF Preview
              <iframe
                src={product?.sopFile}
                className="h-96 w-full rounded-lg border dark:border-gray-600"
                title="SOP PDF Preview"
              />
            ) : product?.sopFile.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              // Image Preview
              <Image
                src={product?.sopFile}
                alt="SOP Preview"
                width={600}
                height={400}
                className="h-96 w-full rounded-lg object-contain"
              />
            ) : (
              // Fallback
              <a
                href={product?.sopFile}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-blue-700 px-5 py-2 text-white hover:bg-blue-800"
              >
                Open SOP File
              </a>
            )}
          </div>
        ) : (
          <div className="mt-2 text-center text-gray-500 dark:text-gray-400">
            No SOP Found
          </div>
        )}
      </div>
    </div>
  );
}
