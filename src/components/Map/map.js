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

import distance from "@turf/distance";
import pointToLineDistance from "@turf/point-to-line-distance";
import { translateInstruction } from "@/src/lib/utils/instructionTranslator";

// Custom icons
const userLocationIcon = L.divIcon({
  html: `<div class="${styles.userPuckPulse}"></div><div class="${styles.userPuck}"></div>`,
  className: styles.userPuckContainer,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
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
  const userLocationRef = useRef(null);

  // Logic Refs
  const watchId = useRef(null);
  const lastSpokenIndex = useRef(-1);
  const arrivalSpoken = useRef(false);
  const hasCenteredRef = useRef(false);

  // Local State
  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isAutoSnap, setIsAutoSnap] = useState(true);
  const isAutoSnapRef = useRef(true);

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

  useEffect(() => {
    isAutoSnapRef.current = isAutoSnap;
  }, [isAutoSnap]);

  // Helper function to update puck and Redux
  const updateUserPuck = useCallback(
    (latitude, longitude, heading) => {
      const newLatLng = [latitude, longitude];

      userLocationRef.current = { lat: latitude, lng: longitude };

      if (userPuckMarker.current) {
        userPuckMarker.current.setLatLng(newLatLng);

        // user puck rotation  logic
        const iconElement = userPuckMarker.current.getElement();
        if (iconElement && heading !== null && !isNaN(heading)) {
          const puck = iconElement.querySelector(`.${styles.userPuck}`);
          if (puck) {
            puck.style.transform = `translate(-50%, -50%) rotate(${heading}deg)`;
          }
        }
      } else if (map.current) {
        userPuckMarker.current = L.marker(newLatLng, {
          icon: userLocationIcon,
          zIndexOffset: 1000,
        }).addTo(map.current);
      }

      dispatch(setUserLocation({ lat: latitude, lng: longitude }));
    },
    [dispatch]
  );

  // map init
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

    map.current.on("dragstart", () => {
      setIsAutoSnap(false);
    });

    const initialStyleUrl = MAP_STYLES[mapStyle] || MAP_STYLES.default;
    const mtLayer = new MaptilerLayer({
      style: initialStyleUrl,
      language: mapLanguage,
      apiKey: process.env.NEXT_PUBLIC_MAP_API_KEY,
    }).addTo(map.current);
    mapLayer.current = mtLayer;
    potholesLayer.current = L.featureGroup().addTo(map.current);

    setIsMapReady(true);

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

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") requestWakeLock();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (wakeLock) wakeLock.release();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // geolocation api
  useEffect(() => {
    if (!isMapReady || !map.current) return;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateUserPuck(latitude, longitude, null);

          if (!hasCenteredRef.current) {
            map.current.setView([latitude, longitude], 15);
            hasCenteredRef.current = true;
          }
        },
        (error) => console.warn("Initial location error:", error.message),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
      );

      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, heading } = position.coords;
          updateUserPuck(latitude, longitude, heading);

          if (isAutoSnapRef.current && map.current) {
            map.current.panTo([latitude, longitude], {
              animate: true,
              duration: 0.5,
              easeLinearity: 0.5,
            });
          }
        },
        (error) => {
          console.error("Error watching position:", error.message);
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }

    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [isMapReady, updateUserPuck]);

  // Check for resume navigation
  useEffect(() => {
    if (typeof window !== "undefined") {
      const appIsInNavigation =
        JSON.parse(localStorage.getItem("isNavigating")) === true;
      const appHasRoute = localStorage.getItem("currentRoute") !== null;

      if (appIsInNavigation && appHasRoute) {
        setShowResumeModal(true);
      }
    }
  }, []);

  // re-enable snap on nav start
  useEffect(() => {
    if (isNavigating) {
      setIsAutoSnap(true);
    }
  }, [isNavigating]);

  // map language update
  useEffect(() => {
    if (!mapLayer.current) return;
    mapLayer.current.setLanguage(mapLanguage);
  }, [mapLanguage]);

  // map styles update
  useEffect(() => {
    if (!mapLayer.current) return;
    const newStyleUrl = MAP_STYLES[mapStyle] || MAP_STYLES.default;
    mapLayer.current.setStyle(newStyleUrl);
  }, [mapStyle]);

  // route drawing logic
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

      newRoute.bindPopup(popupContent, { closeButton: false });

      if (!showResumeModal) setShowArrivalModal(false);

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

      const hasSufficientDistance = routeData.distance > 10;

      if (!isNavigating && hasSufficientDistance) {
        map.current.fitBounds(newRoute.getBounds(), { padding: [50, 50] });
      } else if (isNavigating && userLocationRef.current) {
        map.current.setView(
          [userLocationRef.current.lat, userLocationRef.current.lng],
          17
        );
        setIsAutoSnap(true);
      } else if (!hasSufficientDistance) {
        map.current.setView(
          [
            routeData.points.coordinates[0][1],
            routeData.points.coordinates[0][0],
          ],
          18
        );
      }
    }
    if (!routeData) setShowArrivalModal(false);
  }, [routeData, isNavigating, showResumeModal, units]);

  // snap logic for nav
  useEffect(() => {
    if (isNavigating && userLocation && isAutoSnap && map.current) {
      if (map.current.getZoom() < 17) {
        map.current.setView([userLocation.lat, userLocation.lng], 17);
      } else {
        map.current.panTo([userLocation.lat, userLocation.lng], {
          animate: true,
        });
      }
    }
  }, [isNavigating, isAutoSnap, userLocation]);

  // pothole rendering
  useEffect(() => {
    if (!map.current || !potholesLayer.current || isLoadingPotholes) return;
    potholesLayer.current.clearLayers();

    if (potholeError) return;

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
              <span class="${styles.severityBadge}" style="background-color: ${severityColor}">${severityText}</span>
            </div>
            <div class="${styles.potholeDetail}">
              <strong>Detected:</strong>
              <span>${dateText}</span>
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
          .bindPopup(popupContent, { closeButton: false })
          .addTo(potholesLayer.current);
      });
    }
  }, [potholes, showPotholes, severityFilter, isLoadingPotholes, potholeError]);

  const handleReroute = useCallback(async () => {
    dispatch(setIsReRouting(true));
    const fromCoords = [userLocation.lat, userLocation.lng];
    const toCoords = destinationCoords;

    if (fromCoords && toCoords) {
      const newRouteData = await getRoute(fromCoords, toCoords, mapLanguage);
      if (newRouteData) {
        dispatch(setRoute(newRouteData));
        dispatch(setCurrentInstructionIndex(0));
        lastSpokenIndex.current = -1;
        arrivalSpoken.current = false;
      }
    }
    setTimeout(() => {
      dispatch(setIsReRouting(false));
    }, 3000);
  }, [dispatch, userLocation, destinationCoords, mapLanguage]);

  // navigation logic
  useEffect(() => {
    if (!map.current) return;
    if (isNavigating && userLocation && !showResumeModal) {
      if (
        routeData &&
        routeData.points &&
        routeData.points.type === "LineString"
      ) {
        if (
          typeof distance !== "function" ||
          typeof pointToLineDistance !== "function"
        ) {
          console.warn("Turf functions not ready");
          return;
        }

        if (!isReRouting) {
          const userPoint = [userLocation.lng, userLocation.lat];
          const routeLine = routeData.points;
          const distanceToRoute = pointToLineDistance(userPoint, routeLine, {
            units: "meters",
          });

          if (distanceToRoute > 30) {
            handleReroute();
            return;
          }

          const instructions = routeData.instructions;
          const nextInstruction = instructions[currentInstructionIndex];

          if (nextInstruction) {
            const isFirstInstruction = currentInstructionIndex === 0;

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
                    setIsAutoSnap(false);
                  }
                );
              }
            } else if (
              nextInstruction.points &&
              nextInstruction.points.length > 0
            ) {
              const maneuverPoint = nextInstruction.points[0];
              const distanceToManeuver = distance(userPoint, maneuverPoint, {
                units: "meters",
              });

              const speechTriggerDistance = 100;
              const advanceInstructionDistance = 35;
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

  const handleFindMe = () => {
    setIsAutoSnap(true);
    if (userLocation && map.current) {
      map.current.flyTo([userLocation.lat, userLocation.lng], 17, {
        animate: true,
        duration: 1.5,
      });
    }
  };

  const handleClearRoute = () => {
    dispatch(setRoute(null));
    dispatch(setIsNavigating(false));
    dispatch(setDestinationCoords(null));
    dispatch(setCurrentInstructionIndex(0));
    setIsAutoSnap(false);
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

      <button
        className={`${styles.locateButton} ${
          isNavigating && isAutoSnap ? styles.recenterButton : ""
        }`}
        onClick={handleFindMe}
      >
        <Locate size={20} />
      </button>
    </div>
  );
};

export default Map;
