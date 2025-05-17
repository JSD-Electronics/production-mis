import React, { useState } from "react";

const SearchableInput = ({
  options,
  checkedDevice,
  searchQuery,
  setSearchQuery,
  onNoResults,
  setSearchResult,
  getDeviceById,
  setIsPassNGButtonShow
}) => {
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
      setIsPassNGButtonShow(true)
      setShowSuggestions(false);
    }
  };
  if (filteredOptions.length === 0 && searchQuery.trim() !== "") {
    onNoResults(searchQuery);
  }

  return (
    <div style={styles.container}>
      <input
        type="text"
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        onKeyDown={handleKeyDown} // Add event listener for "Enter"
        placeholder="Search..."
        style={styles.input}
      />
      {showSuggestions && (
        <div style={styles.suggestionsContainer}>
          {filteredOptions.length > 0 ? (
            <ul style={styles.suggestionsList}>
              {filteredOptions.map((option, index) => (
                <li
                  key={index}
                  onClick={() => {
                    handleSuggestionClick(option);
                  }}
                  style={styles.suggestionItem}
                >
                  {option.serialNo}
                </li>
              ))}
            </ul>
          ) : searchQuery.trim() !== "" ? (
            <div style={styles.noResults}>No results found</div>
          ) : null}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: "auto",
    margin: "0 auto",
    position: "relative",
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  suggestionsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "white",
    border: "1px solid #ccc",
    borderRadius: "4px",
    zIndex: 1000,
  },
  suggestionsList: {
    listStyle: "none",
    margin: 0,
    padding: "5px",
    maxHeight: "150px",
    overflowY: "auto",
  },
  suggestionItem: {
    padding: "8px",
    cursor: "pointer",
    borderBottom: "1px solid #f0f0f0",
  },
  noResults: {
    padding: "10px",
    textAlign: "center",
    color: "red",
  },
};

export default SearchableInput;
