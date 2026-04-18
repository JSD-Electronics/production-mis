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
  setIsVerifiedSticker?: any;
  checkIsPrintEnable: any;
  setIsDevicePassed: any;
  allowPassedOptions?: boolean;
  resolveSearchQuery?: (query: string) => Promise<any> | any;
  placeholder?: string;
  enableAutoSuggestion?: boolean;
}

const normalizeSearchTerm = (value: any) =>
  String(value || "")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .toLowerCase();

const parseCustomFields = (raw: any) => {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return typeof raw === "object" ? raw : {};
};

const collectSearchTerms = (option: any) => {
  const values: string[] = [];
  const addValue = (value: any) => {
    const normalized = normalizeSearchTerm(value);
    if (!normalized) return;
    values.push(normalized);
  };

  const visit = (input: any) => {
    if (input === undefined || input === null) return;
    if (Array.isArray(input)) {
      input.forEach((item) => visit(item));
      return;
    }
    if (typeof input === "object") {
      Object.values(input).forEach((item) => visit(item));
      return;
    }
    addValue(input);
  };

  addValue(option?.serialNo);
  addValue(option?.serial_no);
  addValue(option?.serial);
  addValue(option?.imeiNo);
  addValue(option?.imei);
  addValue(option?.imei_no);
  addValue(option?.ccid);
  addValue(option?.CCID);
  addValue(option?.ccidNo);
  visit(parseCustomFields(option?.customFields));

  return Array.from(new Set(values));
};

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
  setIsVerifiedSticker = () => {},
  checkIsPrintEnable,
  setIsDevicePassed,
  allowPassedOptions = false,
  resolveSearchQuery,
  placeholder = "Scan sticker / Serial / IMEI / CCID",
  enableAutoSuggestion = true,
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

  const searchableOptions = React.useMemo(() => {
    return (Array.isArray(options) ? options : [])
      .filter((value) => {
        const serial = String(value?.serialNo || value?.serial_no || "").toLowerCase();
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
      })
      .map((option) => ({
        option,
        searchTerms: collectSearchTerms(option),
      }));
  }, [options, excludedSet, allowPassedOptions]);

  const filteredOptions = React.useMemo(() => {
    const normalizedQuery = normalizeSearchTerm(searchQuery);
    if (!normalizedQuery) {
      return [];
    }

    return searchableOptions
      .filter(({ searchTerms }) => searchTerms.some((term) => term.includes(normalizedQuery)))
      .map(({ option }) => option);
  }, [searchQuery, searchableOptions]);

  const findExactMatches = React.useCallback(
    (rawQuery: any) => {
      const normalizedQuery = normalizeSearchTerm(rawQuery);
      if (!normalizedQuery) return [];
      return searchableOptions
        .filter(({ searchTerms }) => searchTerms.includes(normalizedQuery))
        .map(({ option }) => option);
    },
    [searchableOptions],
  );

  const resetSelectionState = React.useCallback(() => {
    setIsPassNGButtonShow(false);
    setIsStickerPrinted(false);
    setIsVerifiedSticker(false);
    setIsDevicePassed(false);
  }, [setIsPassNGButtonShow, setIsStickerPrinted, setIsVerifiedSticker, setIsDevicePassed]);

  const handleSuggestionClick = React.useCallback(
    (option: any) => {
      if (!option) return;
      if (option?._id) {
        getDeviceById(option._id);
      }
      setSearchQuery(option?.serialNo || option?.serial_no || "");
      setSearchResult(option?.serialNo || option?.serial_no || "");
      if (onDeviceSelected) onDeviceSelected(option);
      resetSelectionState();
      setShowSuggestions(false);
    },
    [getDeviceById, onDeviceSelected, resetSelectionState, setSearchQuery, setSearchResult],
  );

  const resolveEnteredQuery = React.useCallback(
    async (rawQuery: any) => {
      const query = String(rawQuery || "").trim();
      if (!query) {
        setSearchResult("");
        setSearchQuery("");
        setShowSuggestions(false);
        return;
      }

      const exactMatches = findExactMatches(query);
      if (exactMatches.length === 1) {
        handleSuggestionClick(exactMatches[0]);
        return;
      }

      if (
        enableAutoSuggestion &&
        !query.includes(",") &&
        exactMatches.length === 0 &&
        filteredOptions.length > 0
      ) {
        handleSuggestionClick(filteredOptions[0]);
        return;
      }

      if (resolveSearchQuery) {
        const result = await resolveSearchQuery(query);
        const ok = typeof result === "boolean" ? result : Boolean(result && result.ok !== false);
        if (ok) {
          resetSelectionState();
        }
        setShowSuggestions(false);
        return;
      }

      setSearchResult("");
      setSearchQuery(query);
      resetSelectionState();
      setShowSuggestions(false);
      onNoResults(query);
    },
    [filteredOptions, findExactMatches, handleSuggestionClick, onNoResults, resetSelectionState, resolveSearchQuery, setSearchQuery, setSearchResult],
  );

  const handleInputChange = (e: any) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (enableAutoSuggestion && query.trim() !== "") {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void resolveEnteredQuery(e.currentTarget.value);
    }
  };

  const handlePaste = (e: any) => {
    const pastedValue = String(e?.clipboardData?.getData("text") || "").trim();
    if (!pastedValue) return;

    if (resolveSearchQuery && pastedValue.includes(",")) {
      e.preventDefault();
      setSearchQuery(pastedValue);
      setShowSuggestions(false);
      void resolveEnteredQuery(pastedValue);
    }
  };

  return (
    <div className="relative w-full">
      <div className="border-gray-300 flex items-center rounded-md border bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
        <Search className="text-gray-400 mr-2 h-4 w-4" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (enableAutoSuggestion) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
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

      {enableAutoSuggestion && showSuggestions && (
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

