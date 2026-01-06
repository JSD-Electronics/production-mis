import React from "react";
import { Search } from "lucide-react";
import SearchableInput from "@/components/SearchableInput/SearchableInput";
import CartonSearchableInput from "@/components/SearchableInput/CartonSearchableInput";

interface DeviceSearchSectionProps {
  isPaused: boolean;
  assignedTaskDetails: any;
  cartonSerial: string[];
  cartonSearchQuery: string;
  setCartonSearchQuery: (query: string) => void;
  handleSearchCarton: (carton: any) => void;
  deviceList: any[];
  checkedDevice: any[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNoResults: (query: string) => void;
  setSearchResult: (result: any) => void;
  getDeviceById: (id: string) => void;
  setIsPassNGButtonShow: (show: boolean) => void;
  setIsStickerPrinted: (printed: boolean) => void;
  setIsDevicePassed: (val: boolean) => void;
  checkIsPrintEnable: boolean;
  isPassNGButtonShow: boolean;
  lastStatusIsNG: boolean;
  isPackagingActive: boolean;
  handleUpdateStatus: (status: string) => void;
  onNG: () => void;
}

export default function DeviceSearchSection({
  isPaused,
  assignedTaskDetails,
  cartonSerial,
  cartonSearchQuery,
  setCartonSearchQuery,
  handleSearchCarton,
  deviceList,
  checkedDevice,
  searchQuery,
  setSearchQuery,
  onNoResults,
  setSearchResult,
  getDeviceById,
  setIsPassNGButtonShow,
  setIsStickerPrinted,
  setIsDevicePassed,
  checkIsPrintEnable,
  isPassNGButtonShow,
  lastStatusIsNG,
  isPackagingActive,
  handleUpdateStatus,
  onNG,
}: DeviceSearchSectionProps) {
  return (
    <div
      className={`${
        isPaused && "blur-sm"
      } rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700`}
    >
      {assignedTaskDetails.stageType === "common" ? (
        <>
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
            <Search className="h-4 w-4 text-gray-500" />
            Search Carton
          </label>
          <CartonSearchableInput
            cartons={cartonSerial}
            searchQuery={cartonSearchQuery}
            setSearchQuery={setCartonSearchQuery}
            onSelect={(carton) => handleSearchCarton(carton)}
            onNoResults={(query) => console.log("No carton found for:", query)}
          />
        </>
      ) : (
        <>
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
            <Search className="h-4 w-4 text-gray-500" />
            Search Device
          </label>
          {/* @ts-ignore - relying on existing props signature */}
          <SearchableInput
            options={deviceList}
            checkedDevice={checkedDevice}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onNoResults={onNoResults}
            setSearchResult={setSearchResult}
            getDeviceById={getDeviceById}
            setIsPassNGButtonShow={setIsPassNGButtonShow}
            setIsStickerPrinted={setIsStickerPrinted}
            checkIsPrintEnable={checkIsPrintEnable}
            setIsDevicePassed={setIsDevicePassed}
          />
          {/* Inline Pass / NG within Search Device box */}
          {isPassNGButtonShow && !lastStatusIsNG && !isPackagingActive && (
            <div className="mt-4 flex justify-center gap-4">
              <button
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white shadow hover:bg-green-700"
                onClick={() => handleUpdateStatus("Pass")}
              >
                Pass
              </button>
              <button
                className="flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-white shadow hover:bg-danger"
                onClick={onNG}
              >
                NG
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
