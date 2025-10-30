"use client";

import { useState, useEffect } from "react";
import {
  X,
  ArrowRightLeft,
  LocateFixed,
  Circle,
  MapPin,
  Dot,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setActivePanel, setRoute } from "@/src/lib/features/ui/uiSlice";
import getRoute from "../directions-api/getRoute";
import styles from "./search-panel.module.css";
import useDebounce from "./useDebounce";

export default function SearchPanel() {
  const dispatch = useDispatch();

  const currentUnits = useSelector((state) => state.ui.units);

  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");

  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);

  const [activeInput, setActiveInput] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedQuery = useDebounce(
    activeInput === "from" ? fromQuery : toQuery,
    300
  );

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_DIRECTIONS_API_KEY;

  // Effect to fetch suggestions
  useEffect(() => {
    if (
      debouncedQuery.length < 1 ||
      !activeInput ||
      debouncedQuery === "My Current Location"
    ) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${debouncedQuery}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=7`
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
  }, [debouncedQuery, activeInput, MAPBOX_TOKEN]);

  // Handlers

  const handleClose = () => {
    dispatch(setActivePanel(null));
  };

  const handleSuggestionClick = (suggestion) => {
    const [lng, lat] = suggestion.center;
    const placeName = suggestion.place_name;

    if (activeInput === "from") {
      setFromQuery(placeName);
      setFromCoords([lng, lat]);
    } else {
      setToQuery(placeName);
      setToCoords([lng, lat]);
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

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setFromCoords([longitude, latitude]);
          setFromQuery("My Current Location");
          setSuggestions([]);
          setActiveInput(null);
        },
        (error) => {
          console.error("Error getting location:", error);
          // potentially implement a better error handling
        }
      );
    }
  };

  const handleGetRoute = async () => {
    if (!fromCoords || !toCoords) {
      // potentially implement a better handling
      console.log("Please select a valid 'From' and 'To' location.");
      return;
    }

    const routeData = await getRoute(fromCoords, toCoords);

    if (routeData) {
      dispatch(setRoute(routeData));
      handleClose();
    } else {
      console.log("Could not find a route.");
    }
  };

  // Helper to clear input
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

  const showSuggestions = activeInput && suggestions.length > 0 && !isLoading;
  const showLoading = activeInput && isLoading;
  const showLocationButton = activeInput === "from";

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h4>Directions</h4>
        <button onClick={handleClose} className={styles.closeButton}>
          <X size={20} />
        </button>
      </div>
      <hr className={styles.divider} />

      {/* Main Content */}
      <div className={styles.content}>
        {/* A/B Input Block */}
        <div className={styles.routeInputGroup}>
          {/* Icon Column */}
          <div className={styles.routeIconColumn}>
            <Circle size={10} className={styles.iconStart} />
            <Dot size={10} className={styles.iconDot} />
            <Dot size={10} className={styles.iconDot} />
            <Dot size={10} className={styles.iconDot} />
            <MapPin size={10} className={styles.iconEnd} />
          </div>

          {/* Input Column */}
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

        <hr className={styles.divider} />

        {/* Suggestions Area */}
        <div className={styles.suggestionsArea}>
          {/* "My Location" Button */}
          {activeInput === "from" && (
            <button
              onClick={handleGetLocation}
              className={styles.locationButton}
            >
              <LocateFixed size={18} />
              <span>Your current location</span>
            </button>
          )}

          {/* Loading Indicator */}
          {showLoading && <div className={styles.loadingItem}>Loading...</div>}

          {/* Suggestions List */}
          {showSuggestions && (
            <ul className={styles.suggestionsList}>
              {suggestions.map((item) => (
                <li
                  key={item.id}
                  onClick={() => handleSuggestionClick(item)}
                  className={styles.suggestionItem}
                >
                  {/* Potentially add general location icon here for suggestions list items*/}
                  <span>{item.place_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Footer Button */}
      <div className={styles.footer}>
        <button
          className={styles.getRouteButton}
          onClick={handleGetRoute}
          disabled={!fromCoords || !toCoords}
        >
          Get Route
        </button>
      </div>
    </div>
  );
}
