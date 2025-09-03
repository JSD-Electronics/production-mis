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
  setIsPassNGButtonShow: any;
  setIsStickerPrinted: any;
  checkIsPrintEnable: any;
}

const SearchableInput = ({
  options,
  checkedDevice,
  searchQuery,
  setSearchQuery,
  onNoResults,
  setSearchResult,
  getDeviceById,
  setIsPassNGButtonShow,
  setIsStickerPrinted,
  checkIsPrintEnable,
}: SearchableInputProps) => {
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setFilteredOptions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = options.filter((value) =>
      value?.serialNo?.toLowerCase().includes(query.toLowerCase()),
    );

    setFilteredOptions(filtered);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (option) => {
    getDeviceById(option._id);
    setSearchQuery(option?.serialNo);
    setSearchResult(option?.serialNo);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (filteredOptions.length > 0) {
        getDeviceById(filteredOptions[0]._id);
        setSearchResult(filteredOptions[0].serialNo);
        setSearchQuery(filteredOptions[0].serialNo);
      } else {
        setSearchResult("");
        setSearchQuery(e.target.value);
      }
      setIsStickerPrinted(false);
      if (!checkIsPrintEnable) {
        setIsPassNGButtonShow(true);
      }
      setShowSuggestions(false);
    }
  };

  if (filteredOptions.length === 0 && searchQuery.trim() !== "") {
    onNoResults(searchQuery);
  }

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
              setFilteredOptions([]);
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
