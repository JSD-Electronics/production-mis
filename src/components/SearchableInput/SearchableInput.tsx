"use client";
import React, { useState } from "react";
import { Search, XCircle } from "lucide-react";

interface SearchableInputProps {
  options: any[];
  checkedDevice: any[];
  searchQuery: any;
  setSearchQuery: any;
  onNoResults: any;
  setSearchResult: any;
  getDeviceById: any;
  onDeviceSelected?: (device: any) => void;
  excludedSerials?: string[];
  setIsPassNGButtonShow: any;
  setIsStickerPrinted: any;
  setIsVerifiedSticker: any;
  checkIsPrintEnable: any;
  setIsDevicePassed: any;
  allowPassedOptions?: boolean;
}

const SearchableInput = ({
  options,
  checkedDevice,
  searchQuery,
  setSearchQuery,
  onNoResults,
  setSearchResult,
  getDeviceById,
  onDeviceSelected,
  excludedSerials = [],
  setIsPassNGButtonShow,
  setIsStickerPrinted,
  setIsVerifiedSticker,
  checkIsPrintEnable,
  setIsDevicePassed,
  allowPassedOptions = false,
}: SearchableInputProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const excludedSet = React.useMemo(
    () =>
      new Set(
        (Array.isArray(excludedSerials) ? excludedSerials : [])
          .map((value) => String(value || "").trim().toLowerCase())
          .filter(Boolean),
      ),
    [excludedSerials],
  );

  // Derived state for filtered options
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery || searchQuery.trim() === "") {
      return [];
    }
    return options.filter((value) => {
      const serial = String(value?.serialNo || "").toLowerCase();
      if (!serial.includes(searchQuery.toLowerCase())) return false;
      const status = String(value?.status || value?.testStatus || "").trim().toLowerCase();
      const isNg =
        status.includes("ng") ||
        status.includes("fail") ||
        status.includes("rework");
      const isPassed =
        status === "pass" ||
        status.includes("pass") ||
        status.includes("completed") ||
        status.includes("done");
      const isExcluded = excludedSet.has(serial);
      return !isNg && (allowPassedOptions || !isPassed) && !isExcluded;
    });
  }, [options, searchQuery, excludedSet, allowPassedOptions]);

  // Handle No Results side effect
  React.useEffect(() => {
    if (filteredOptions.length === 0 && searchQuery.trim() !== "") {
      onNoResults(searchQuery);
    }
  }, [filteredOptions, searchQuery, onNoResults]);

  const handleInputChange = (e: any) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() !== "") {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (option: any) => {
    if (!option) return;
    if (option?._id) {
      getDeviceById(option._id);
    }
    setSearchQuery(option?.serialNo || "");
    setSearchResult(option?.serialNo || "");
    if (onDeviceSelected) onDeviceSelected(option);
    setIsStickerPrinted(false);
    setIsVerifiedSticker(false);
    setIsDevicePassed(false);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        const option = filteredOptions[0];
        if (option?._id) {
          getDeviceById(option._id);
        }
        setSearchResult(option?.serialNo || "");
        setSearchQuery(option?.serialNo || "");
        if (onDeviceSelected && option) onDeviceSelected(option);

      } else {
        setSearchResult("");
        setSearchQuery(e.target.value);
      }
      setIsDevicePassed(false);
      setIsStickerPrinted(false);
      setIsVerifiedSticker(false);
      if (!checkIsPrintEnable) {
        setIsPassNGButtonShow(true);
      } else {
        setIsPassNGButtonShow(false);
      }
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative w-full">
      {/* Input */}
      <div className="border-gray-300 flex items-center rounded-md border bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
        <Search className="text-gray-400 mr-2 h-4 w-4" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Search by Serial No..."
          className="text-gray-700 placeholder-gray-400 w-full border-none text-sm focus:outline-none"
        />
        {searchQuery && (
          <XCircle
            className="text-gray-400 hover:text-red-500 ml-2 h-4 w-4 cursor-pointer"
            onClick={() => {
              setSearchQuery("");
              setSearchResult("");
              setShowSuggestions(false);
            }}
          />
        )}
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div className="border-gray-200 absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">

          {filteredOptions.length > 0 ? (
            <ul className="max-h-40 overflow-y-auto py-1 text-sm">
              {filteredOptions.map((option, index) => (
                <li
                  key={index}
                  onClick={() => handleSuggestionClick(option)}
                  className="cursor-pointer px-3 py-2 hover:bg-blue-50"
                >
                  {option.serialNo}
                </li>
              ))}
            </ul>
          ) : searchQuery.trim() !== "" ? (
            <div className="text-red-500 px-3 py-2 text-center text-sm">
              No results found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchableInput;
