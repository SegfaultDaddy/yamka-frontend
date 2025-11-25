"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MaptilerLayer } from "@maptiler/leaflet-maptilersdk";

import "@maptiler/sdk/dist/maptiler-sdk.css";

import styles from "./map.module.css";
import { useSelector, useDispatch } from "react-redux";
import { MAP_STYLES } from "./map-styles";
import { useGetPotholesQuery } from "@/src/lib/features/api/apiSlice";
import {
  getSeverityColor,
  formatTripDuration,
  formatTripDistance,
  getSeverityLabel,
  formatDate,
} from "@/src/lib/utils/utils";
import { speak } from "@/src/lib/utils/speech";
import getRoute from "@/src/lib/utils/getRoute";
import {
  setIsNavigating,
  setUserLocation,
  setRoute,
  setIsReRouting,
  setDestinationCoords,
  setCurrentInstructionIndex,
} from "@/src/lib/features/ui/uiSlice";

import ArrivalModal from "./arrival-modal";
import ResumeNavigationModal from "./resume-navigation-modal";
import { Locate, Minus, Plus, RouteOff } from "lucide-react";

import { distance } from "@turf/distance";
import pointToLineDistance from "@turf/point-to-line-distance";
import { translateInstruction } from "@/src/lib/utils/instructionTranslator";

// Custom Icons
const userLocationIcon = L.divIcon({
  html: `<div class="${styles.userPuckPulse}"></div><div class="${styles.userPuck}"></div>`,
  className: styles.userPuckContainer,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const destinationIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin" style="fill: #EF4444; stroke: #FFFFFF; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.5));"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  className: styles.destinationIcon,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const Map = ({ routeData }) => {
  const dispatch = useDispatch();
  const mapContainer = useRef(null);
  const map = useRef(null);

  // Layer Refs
  const routeLayer = useRef(null);
  const mapLayer = useRef(null);
  const potholesLayer = useRef(null);
  const userPuckMarker = useRef(null);
  const destinationMarker = useRef(null);

  // Logic Refs
  const watchId = useRef(null);
  const lastSpokenIndex = useRef(-1);
  const arrivalSpoken = useRef(false);
  const isPuckInitialized = useRef(false);

  // Local State
  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [hasCenteredOnUser, setHasCenteredOnUser] = useState(false);

  // Constants
  const center = { lat: 49.842957, lng: 24.031111 };
  const [zoom] = useState(14);

  // Redux State
  const mapLanguage = useSelector((state) => state.ui.locale);
  const mapStyle = useSelector((state) => state.ui.mapStyle);
  const showPotholes = useSelector((state) => state.ui.showPotholes);
  const severityFilter = useSelector((state) => state.ui.potholeSeverityFilter);
  const isNavigating = useSelector((state) => state.ui.isNavigating);
  const userLocation = useSelector((state) => state.ui.userLocation);
  const destinationCoords = useSelector((state) => state.ui.destinationCoords);
  const isReRouting = useSelector((state) => state.ui.isReRouting);
  const units = useSelector((state) => state.ui.units);
  const currentInstructionIndex = useSelector(
    (state) => state.ui.currentInstructionIndex
  );

  const {
    data: potholes,
    isLoading: isLoadingPotholes,
    error: potholeError,
  } = useGetPotholesQuery();

  // Initialize Map & Geolocation
  useEffect(() => {
    if (map.current) return;

    const worldBounds = [
      [-85, -180],
      [85, 180],
    ];

    map.current = new L.Map(mapContainer.current, {
      center: L.latLng(center.lat, center.lng),
      zoom: zoom,
      zoomControl: false,
      maxBounds: worldBounds,
      maxBoundsViscosity: 0.3,
      minZoom: 3,
    });

    const initialStyleUrl = MAP_STYLES[mapStyle] || MAP_STYLES.default;
    const mtLayer = new MaptilerLayer({
      style: initialStyleUrl,
      language: mapLanguage,
      apiKey: process.env.NEXT_PUBLIC_MAP_API_KEY,
    }).addTo(map.current);
    mapLayer.current = mtLayer;
    potholesLayer.current = L.featureGroup().addTo(map.current);

    // WakeLock API
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");

          wakeLock.addEventListener("release", () => {
            wakeLock = null;
          });
        }
      } catch (err) {
        console.warn(`Wake Lock failed: ${err.name}, ${err.message}`);
      }
    };
    requestWakeLock();

    // Re-request lock if user tabs out and comes back
    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === "visible") {
        requestWakeLock();
      }

      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Geolocation Logic
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          if (!userPuckMarker.current) {
            userPuckMarker.current = L.marker([latitude, longitude], {
              icon: userLocationIcon,
              zIndexOffset: 1000,
            }).addTo(map.current);
            isPuckInitialized.current = true;
          }

          dispatch(setUserLocation({ lat: latitude, lng: longitude }));

          if (map.current && !hasCenteredOnUser) {
            map.current.setView([latitude, longitude], 15);
            setHasCenteredOnUser(true);
          }
        },
        (error) => console.warn("Initial location error:", error.message),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );

      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, heading } = position.coords;
          const newLatLng = [latitude, longitude];

          if (userPuckMarker.current) {
            userPuckMarker.current.setLatLng(newLatLng);

            // rotation logic
            const iconElement = userPuckMarker.current.getElement();
            if (iconElement && heading !== null && !isNaN(heading)) {
              const puck = iconElement.querySelector(`.${styles.userPuck}`);
              if (puck) {
                puck.style.transform = `rotate(${heading}deg)`;
              }
            }
          } else {
            userPuckMarker.current = L.marker(newLatLng, {
              icon: userLocationIcon,
              zIndexOffset: 1000,
            }).addTo(map.current);
            isPuckInitialized.current = true;
          }

          dispatch(setUserLocation({ lat: latitude, lng: longitude }));
        },
        (error) => {
          console.error("Error watching position:", error.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }

    // Check for resume navigation
    const appIsInNavigation =
      JSON.parse(localStorage.getItem("isNavigating")) === true;
    const appHasRoute = localStorage.getItem("currentRoute") !== null;

    if (appIsInNavigation && appHasRoute) {
      setShowResumeModal(true);
    }

    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      if (wakeLock) wakeLock.release();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    center.lng,
    center.lat,
    zoom,
    mapLanguage,
    mapStyle,
    dispatch,
    hasCenteredOnUser,
  ]);

  // Map Language
  useEffect(() => {
    if (!mapLayer.current) return;
    mapLayer.current.setLanguage(mapLanguage);
  }, [mapLanguage]);

  // Style Updates
  useEffect(() => {
    if (!mapLayer.current) return;
    const newStyleUrl = MAP_STYLES[mapStyle] || MAP_STYLES.default;
    mapLayer.current.setStyle(newStyleUrl);
  }, [mapStyle]);

  // Route Drawing Logic
  useEffect(() => {
    if (!map.current) return;
    if (routeLayer.current) {
      map.current.removeLayer(routeLayer.current);
      routeLayer.current = null;
    }

    if (destinationMarker.current) {
      map.current.removeLayer(destinationMarker.current);
      destinationMarker.current = null;
    }

    lastSpokenIndex.current = -1;
    arrivalSpoken.current = false;

    if (routeData && routeData.points) {
      const newRoute = L.geoJSON(routeData.points, {
        style: () => ({
          color: "#3388ff",
          weight: 5,
          opacity: 0.7,
        }),
      });
      newRoute.addTo(map.current);
      routeLayer.current = newRoute;

      const formattedDuration = formatTripDuration(routeData.time);
      const formattedDistance = formatTripDistance(routeData.distance, units);

      const popupContent = `
        <div class="${styles.popupContent}">
          <span class="${styles.popupTitle}">Route Details</span>
          <div class="${styles.popupDetail}">
            <span class="${styles.popupLabel}">Distance:</span>
            <span>${formattedDistance}</span>
          </div>
          <div class="${styles.popupDetail}">
            <span class="${styles.popupLabel}">Duration:</span>
            <span>${formattedDuration}</span>
          </div>
        </div>
      `;

      newRoute.bindPopup(popupContent, {
        closeButton: false,
      });

      if (!showResumeModal) {
        setShowArrivalModal(false);
      }

      const hasSufficientDistance = routeData.distance > 10;

      try {
        const coords = routeData.points.coordinates;
        const destLngLat =
          routeData.points.type === "LineString"
            ? coords[coords.length - 1]
            : coords;

        destinationMarker.current = L.marker([destLngLat[1], destLngLat[0]], {
          icon: destinationIcon,
        }).addTo(map.current);
      } catch (e) {
        console.error("Could not create destination marker:", e);
      }

      if (!hasSufficientDistance) {
        map.current.setView(
          [
            routeData.points.coordinates[0][1],
            routeData.points.coordinates[0][0],
          ],
          18
        );
      }
      if (!isNavigating && hasSufficientDistance) {
        map.current.fitBounds(newRoute.getBounds());
      }
    }

    if (!routeData) {
      setShowArrivalModal(false);
    }
  }, [routeData, isNavigating, showResumeModal, dispatch, units]);

  // Pothole Rendering
  useEffect(() => {
    if (!map.current || !potholesLayer.current || isLoadingPotholes) return;

    potholesLayer.current.clearLayers();

    if (potholeError) {
      console.error("Failed to load potholes:", potholeError);
      return;
    }

    if (showPotholes && potholes) {
      const filteredPotholes = potholes.filter(
        (pothole) => pothole.severity >= severityFilter
      );

      filteredPotholes.forEach((pothole) => {
        const [lng, lat] = pothole.coordinates;
        const severityColor = getSeverityColor(pothole.severity);
        const severityText = getSeverityLabel(pothole.severity);
        const dateText = formatDate(pothole.reported_at);

        const popupContent = `
          <div class="${styles.potholePopup}">
            <span class="${styles.potholeTitle}">Pothole Alert</span>
            
            <div class="${styles.potholeDetail}">
              <strong>Status:</strong>
              <span class="${styles.severityBadge}" style="background-color: ${severityColor}">
                ${severityText}
              </span>
            </div>

            <div class="${styles.potholeDetail}">
              <strong>Detected:</strong>
              <span>${dateText}</span>
            </div>
            
            <div style="font-size: 10px; color: #9ca3af; margin-top: 8px; border-top: 1px solid #e5e7eb; padding-top: 4px;">
              ID: #${pothole.id}
            </div>
          </div>
        `;

        L.circleMarker([lat, lng], {
          radius: 6,
          fillColor: severityColor,
          color: "#000",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8,
        })
          .bindPopup(popupContent, {
            closeButton: false,
          })
          .addTo(potholesLayer.current);
      });
    }
  }, [potholes, showPotholes, severityFilter, isLoadingPotholes, potholeError]);

  // Re-routing Handler
  const handleReroute = useCallback(async () => {
    dispatch(setIsReRouting(true));

    const fromCoords = [userLocation.lat, userLocation.lng];
    const toCoords = destinationCoords;

    if (!fromCoords || !toCoords) {
      console.error("Missing coords for re-route.");
      dispatch(setIsReRouting(false));
      return;
    }

    const newRouteData = await getRoute(fromCoords, toCoords, mapLanguage);

    if (newRouteData) {
      dispatch(setRoute(newRouteData));
      dispatch(setCurrentInstructionIndex(0));
      lastSpokenIndex.current = -1;
      arrivalSpoken.current = false;
    } else {
      console.error("Failed to fetch new route.");
    }

    setTimeout(() => {
      dispatch(setIsReRouting(false));
    }, 3000);
  }, [dispatch, userLocation, destinationCoords, mapLanguage]);

  // Navigation & Follow Logic
  useEffect(() => {
    if (!map.current) return;

    if (isNavigating && userLocation && !showResumeModal) {
      map.current.setView([userLocation.lat, userLocation.lng], 17, {
        animate: true,
        duration: 1,
      });

      if (
        routeData &&
        routeData.points &&
        routeData.points.type === "LineString"
      ) {
        if (
          typeof distance === "undefined" ||
          typeof pointToLineDistance === "undefined"
        ) {
          console.error("Turf.js functions are not loaded!");
          return;
        }

        // ReRouting logic
        if (!isReRouting) {
          const userPoint = [userLocation.lng, userLocation.lat];
          const routeLine = routeData.points;

          const distanceToRoute = pointToLineDistance(userPoint, routeLine, {
            units: "meters",
          });

          const rerouteTolerance = 50; // 50 meters

          if (distanceToRoute > rerouteTolerance) {
            handleReroute();
            return;
          }

          // Voice logic
          const instructions = routeData.instructions;
          const nextInstruction = instructions[currentInstructionIndex];

          if (nextInstruction) {
            const userPoint = [userLocation.lng, userLocation.lat];
            const isFirstInstruction = currentInstructionIndex === 0;

            // Check for "Arrive" sign
            if (nextInstruction.sign === 4) {
              const routeCoords = routeData.points.coordinates;
              const destination = routeCoords[routeCoords.length - 1];
              const distanceToDest = distance(userPoint, destination, {
                units: "meters",
              });

              if (
                distanceToDest < 50 &&
                !showArrivalModal &&
                !arrivalSpoken.current
              ) {
                arrivalSpoken.current = true;
                speak(
                  "You have arrived at your destination.",
                  mapLanguage,
                  () => {
                    setShowArrivalModal(true);
                    dispatch(setIsNavigating(false));
                    dispatch(setCurrentInstructionIndex(0));
                  }
                );
              }
            } else if (
              nextInstruction.points &&
              nextInstruction.points.length > 0
            ) {
              const maneuverPoint = nextInstruction.points[0]; // [lng, lat]
              const distanceToManeuver = distance(userPoint, maneuverPoint, {
                units: "meters",
              });

              const speechTriggerDistance = 100;
              const advanceInstructionDistance = 25;
              const englishInstruction = translateInstruction(nextInstruction);

              const shouldSpeak =
                (isFirstInstruction && lastSpokenIndex.current < 0) ||
                distanceToManeuver < speechTriggerDistance;

              if (
                shouldSpeak &&
                lastSpokenIndex.current < currentInstructionIndex
              ) {
                lastSpokenIndex.current = currentInstructionIndex;
                speak(englishInstruction, "en");
              }

              if (distanceToManeuver < advanceInstructionDistance) {
                dispatch(
                  setCurrentInstructionIndex(currentInstructionIndex + 1)
                );
              }
            }
          }
        }
      }
    }
  }, [
    userLocation,
    isNavigating,
    routeData,
    dispatch,
    showArrivalModal,
    destinationCoords,
    isReRouting,
    handleReroute,
    showResumeModal,
    currentInstructionIndex,
    mapLanguage,
  ]);

  // Handler for the "Find My Location" button
  const handleFindMe = () => {
    if (userLocation && map.current) {
      map.current.setView([userLocation.lat, userLocation.lng], 16, {
        animate: true,
      });
    } else {
      console.error("Cannot find location. User may have denied permission.");
    }
  };

  // Handler for the "Clear Route" button
  const handleClearRoute = () => {
    dispatch(setRoute(null));
    dispatch(setIsNavigating(false));
    dispatch(setDestinationCoords(null));
    dispatch(setCurrentInstructionIndex(0));

    // Reset speech flags
    lastSpokenIndex.current = -1;
    arrivalSpoken.current = false;
  };

  return (
    <div className={styles.mapWrap}>
      {showArrivalModal && <ArrivalModal />}
      {showResumeModal && (
        <ResumeNavigationModal onClose={() => setShowResumeModal(false)} />
      )}
      <div ref={mapContainer} className={styles.map}></div>
      {routeData && !showArrivalModal && (
        <button
          className={styles.clearRouteButton}
          onClick={handleClearRoute}
          title="Clear Route"
        >
          <RouteOff size={20} />
        </button>
      )}
      <button
        className={styles.zoomButton + " " + styles.zoomIn}
        onClick={() => map.current.zoomIn()}
      >
        <Plus size={20} />
      </button>

      <button
        className={styles.zoomButton + " " + styles.zoomOut}
        onClick={() => map.current.zoomOut()}
      >
        <Minus size={20} />
      </button>
      <button className={styles.locateButton} onClick={handleFindMe}>
        <Locate size={20} />
      </button>
    </div>
  );
};

export default Map;
