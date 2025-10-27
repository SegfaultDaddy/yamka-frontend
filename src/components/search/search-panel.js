"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useDispatch } from "react-redux";
import { setMarkerLocation, setActivePanel } from "@/lib/features/ui/uiSlice";
import styles from "./search-panel.module.css";
import useDebounce from "./useDebounce";

export default function SearchPanel() {
  const dispatch = useDispatch();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_DIRECTIONS_API_KEY;

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${debouncedQuery}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true`
        );
        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        setSuggestions(data.features || []);
      } catch (error) {
        console.error("Error fetching geocoding data:", error);
        setSuggestions([]);
      }
      setIsLoading(false);
    };

    fetchSuggestions();
  }, [debouncedQuery, MAPBOX_TOKEN]);

  const handleSuggestionClick = (suggestion) => {
    const [lng, lat] = suggestion.center;
    dispatch(setMarkerLocation([lat, lng]));
    dispatch(setActivePanel(null));
  };

  const handleClose = () => {
    dispatch(setActivePanel(null));
  };

  return (
    <div className={styles.searchPanel}>
      <h4>TODO this text sidebyside with closeBTN and remove bottom margin</h4>
      <button onClick={handleClose} className={styles.closeButton}>
        <X size={20} />
      </button>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for an address..."
        className={styles.searchInput}
        autoFocus
      />

      {isLoading && <div className={styles.loading}>Loading...</div>}
      <ul className={styles.suggestionsList}>
        {suggestions.map((item) => (
          <li
            key={item.id}
            onClick={() => handleSuggestionClick(item)}
            className={styles.suggestionItem}
          >
            {item.place_name}
          </li>
        ))}
      </ul>
    </div>
  );
}
