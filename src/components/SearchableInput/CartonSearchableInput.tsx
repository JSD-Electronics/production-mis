"use client";
import React, { useState } from "react";
import { Search, XCircle } from "lucide-react";

interface CartonSearchInputProps {
  cartons: string[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelect: (carton: string) => void;
  onNoResults?: (query: string) => void;
}

const CartonSearchInput = ({
  cartons,
  searchQuery,
  setSearchQuery,
  onSelect,
  onNoResults,
}: CartonSearchInputProps) => {
  const [filteredCartons, setFilteredCartons] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setFilteredCartons([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = cartons.filter((carton) =>
      carton.toLowerCase().includes(query.toLowerCase()),
    );

    setFilteredCartons(filtered);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (carton: string) => {
    setSearchQuery(carton);
    onSelect(carton);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (filteredCartons.length > 0) {
        const selected = filteredCartons[0];
        setSearchQuery(selected);
        onSelect(selected);
      } else {
        onNoResults?.(e.currentTarget.value);
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
          value={searchQuery ?? ""}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Search Carton No..."
          className="text-gray-700 placeholder-gray-400 w-full border-none text-sm focus:outline-none"
        />
        {searchQuery && (
          <XCircle
            className="text-gray-400 hover:text-red-500 ml-2 h-4 w-4 cursor-pointer"
            onClick={() => {
              setSearchQuery("");
              setFilteredCartons([]);
              setShowSuggestions(false);
            }}
          />
        )}
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div className="border-gray-200 absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
          {filteredCartons.length > 0 ? (
            <ul className="max-h-40 overflow-y-auto py-1 text-sm">
              {filteredCartons.map((carton, index) => (
                <li
                  key={index}
                  onClick={() => handleSuggestionClick(carton)}
                  className="cursor-pointer px-3 py-2 hover:bg-blue-50"
                >
                  {carton}
                </li>
              ))}
            </ul>
          ) : searchQuery !== "" ? (
            <div className="text-red-500 px-3 py-2 text-center text-sm">
              No cartons found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default CartonSearchInput;
