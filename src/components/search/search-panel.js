"use client";

import { useState, useEffect } from "react";
import {
  X,
  ArrowRightLeft,
  LocateFixed,
  Circle,
  MapPin,
  Dot,
  Search,
} from "lucide-react";
import { useDispatch } from "react-redux";
import {
  setActivePanel,
  setRoute,
  setIsNavigating,
  setDestinationCoords,
  setIsReRouting,
} from "@/src/lib/features/ui/uiSlice";

import getRoute from "@/src/lib/utils/getRoute";

import styles from "./search-panel.module.css";
import useDebounce from "./useDebounce";
import { formatPlaceName } from "@/src/lib/utils/utils";

export default function SearchPanel() {
  const dispatch = useDispatch();

  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");

  // Store coordinates as [lat, lng]
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);

  const [activeInput, setActiveInput] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  const debouncedQuery = useDebounce(
    activeInput === "from" ? fromQuery : toQuery,
    300
  );

  // Effect to fetch suggestions from /api/search
  useEffect(() => {
    if (
      debouncedQuery.length < 2 ||
      !activeInput ||
      debouncedQuery === "My Current Location"
    ) {
      setSuggestions([]);
      setIsSuggestionsLoading(false);
      return;
    }

    const fetchSuggestions = async () => {
      setIsSuggestionsLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedQuery)}`
        );
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setSuggestions(data.hits || []);
      } catch (error) {
        console.error("Error fetching geocoding data:", error);
        setSuggestions([]);
      }
      setIsSuggestionsLoading(false);
    };

    fetchSuggestions();
  }, [debouncedQuery, activeInput]);

  const handleClose = () => {
    dispatch(setActivePanel(null));
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    const { lat, lng } = suggestion.point;
    const placeName = formatPlaceName(suggestion);

    if (activeInput === "from") {
      setFromQuery(placeName);
      setFromCoords([lat, lng]); // Store as [lat, lng]
    } else {
      setToQuery(placeName);
      setToCoords([lat, lng]); // Store as [lat, lng]
    }
    setSuggestions([]);
    setActiveInput(null);
  };

  const handleReverse = () => {
    setFromQuery(toQuery);
    setToQuery(fromQuery);
    setFromCoords(toCoords);
    setToCoords(fromCoords);
  };

  // Handle get location
  const handleGetLocation = () => {
    setFromQuery("My Current Location");
    setFromCoords(null);
    setSuggestions([]);
    setActiveInput(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFromCoords([latitude, longitude]); // Store as [lat, lng]
        },
        (error) => {
          console.error("Error getting location:", error);
          setFromQuery("");
        }
      );
    }
  };

  const handleGetRoute = async () => {
    if (!fromCoords || !toCoords) return;

    setIsRouteLoading(true);
    const routeData = await getRoute(fromCoords, toCoords);

    if (routeData) {
      dispatch(setRoute(routeData));

      dispatch(setDestinationCoords(toCoords));
      dispatch(setIsReRouting(false));

      if (fromQuery === "My Current Location") {
        dispatch(setIsNavigating(true));
      } else {
        dispatch(setIsNavigating(false));
      }

      handleClose();
    } else {
      console.log("Could not find a route.");
    }
    setIsRouteLoading(false);
  };

  const clearInput = (inputType) => {
    if (inputType === "from") {
      setFromQuery("");
      setFromCoords(null);
      setActiveInput("from");
    } else {
      setToQuery("");
      setToCoords(null);
      setActiveInput("to");
    }
  };

  const showSuggestions =
    activeInput && suggestions.length > 0 && !isSuggestionsLoading;
  const showLoading = activeInput && isSuggestionsLoading;

  const sameQuery = fromQuery === toQuery;
  console.log(`From coords: ${fromQuery}`);
  console.log(`To coords: ${toQuery}`);
  console.log(`sameQuery: ${sameQuery}`);

  const buttonText =
    fromQuery === "My Current Location" ? "Start Navigation" : "Get Route";

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h4>Directions</h4>
        <button onClick={handleClose} className={styles.closeButton}>
          <X size={20} />
        </button>
      </div>
      <hr className={styles.divider} />

      <div className={styles.content}>
        <div className={styles.routeInputGroup}>
          <div className={styles.routeIconColumn}>
            <Circle size={10} className={styles.iconStart} />
            <Dot size={10} className={styles.iconDot} />
            <Dot size={10} className={styles.iconDot} />
            <Dot size={10} className={styles.iconDot} />
            <MapPin size={10} className={styles.iconEnd} />
          </div>
          <div className={styles.routeInputColumn}>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={fromQuery}
                onChange={(e) => setFromQuery(e.target.value)}
                onFocus={() => setActiveInput("from")}
                placeholder="Choose starting point..."
                className={styles.input}
              />
              {fromQuery && (
                <button
                  onClick={() => clearInput("from")}
                  className={styles.clearInputButton}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={toQuery}
                onChange={(e) => setToQuery(e.target.value)}
                onFocus={() => setActiveInput("to")}
                placeholder="Choose destination..."
                className={styles.input}
              />
              {toQuery && (
                <button
                  onClick={() => clearInput("to")}
                  className={styles.clearInputButton}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          <button
            className={styles.reverseButton}
            title="Reverse route"
            onClick={handleReverse}
          >
            <ArrowRightLeft size={18} />
          </button>
        </div>

        <div className={styles.suggestionsArea}>
          {activeInput === "from" && (
            <button
              onClick={handleGetLocation}
              className={styles.locationButton}
            >
              <LocateFixed size={18} />
              <span>Your current location</span>
            </button>
          )}
          {showLoading && <div className={styles.loadingItem}>Loading...</div>}
          {showSuggestions && (
            <ul className={styles.suggestionsList}>
              {suggestions.map((item) => (
                <li
                  key={item.osm_id || item.id}
                  onClick={() => handleSuggestionClick(item)}
                  className={styles.suggestionItem}
                >
                  <Search size={16} className={styles.suggestionIcon} />
                  <span>{formatPlaceName(item)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <button
          className={styles.getRouteButton}
          onClick={handleGetRoute}
          disabled={!fromCoords || !toCoords || isRouteLoading || sameQuery}
        >
          {isRouteLoading ? "Loading..." : buttonText}
        </button>
      </div>
    </div>
  );
}
