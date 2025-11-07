"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MaptilerLayer,
  NavigationControl,
} from "@maptiler/leaflet-maptilersdk";

import styles from "./map.module.css";
import { useSelector, useDispatch } from "react-redux";
import { MAP_STYLES } from "./map-styles";
import { useGetPotholesQuery } from "@/src/lib/features/api/apiSlice";
import { getSeverityColor } from "@/src/lib/utils/utils";
import getRoute from "@/src/lib/utils/getRoute";
import {
  setIsNavigating,
  setUserLocation,
  setRoute,
  setIsReRouting,
} from "@/src/lib/features/ui/uiSlice";

import ArrivalModal from "./arrival-modal";
import ResumeNavigationModal from "./resume-navigation-modal";
import { Locate, Minus, Plus } from "lucide-react";

import { distance } from "@turf/distance";
import pointToLineDistance from "@turf/point-to-line-distance";

const userLocationIcon = L.divIcon({
  html: `<div class="${styles.userPuckPulse}"></div><div class="${styles.userPuck}"></div>`,
  className: styles.userPuckContainer,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const Map = ({ routeData, markerLocation, activePanel }) => {
  const dispatch = useDispatch();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const routeLayer = useRef(null);
  const markerLayer = useRef(null);
  const mapLayer = useRef(null);
  const potholesLayer = useRef(null);
  const userPuckMarker = useRef(null);
  const watchId = useRef(null);
  const hasCheckedOnLoad = useRef(false);

  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  const center = { lat: 49.842957, lng: 24.031111 };
  const [zoom] = useState(14);
  const [hasCenteredOnUser, setHasCenteredOnUser] = useState(false);

  const mapLanguage = useSelector((state) => state.ui.locale);
  const mapStyle = useSelector((state) => state.ui.mapStyle);
  const showTraffic = useSelector((state) => state.ui.showTraffic);
  const showPotholes = useSelector((state) => state.ui.showPotholes);
  const severityFilter = useSelector((state) => state.ui.potholeSeverityFilter);
  const isNavigating = useSelector((state) => state.ui.isNavigating);
  const userLocation = useSelector((state) => state.ui.userLocation);
  const destinationCoords = useSelector((state) => state.ui.destinationCoords);
  const isReRouting = useSelector((state) => state.ui.isReRouting);

  const {
    data: potholes,
    isLoading: isLoadingPotholes,
    error: potholeError,
  } = useGetPotholesQuery();

  // Effect to initialize the map and start location watching
  useEffect(() => {
    if (map.current) return;
    map.current = new L.Map(mapContainer.current, {
      center: L.latLng(center.lat, center.lng),
      zoom: zoom,
      zoomControl: false,
    });
    const initialStyleUrl = MAP_STYLES[mapStyle] || MAP_STYLES.default;
    const mtLayer = new MaptilerLayer({
      style: initialStyleUrl,
      language: mapLanguage,
    }).addTo(map.current);
    mapLayer.current = mtLayer;
    potholesLayer.current = L.featureGroup().addTo(map.current);

    const maplibreMap = mtLayer.map;
    if (maplibreMap) {
      maplibreMap.addControl(
        new maplibregl.NavigationControl({
          showZoom: false,
          showCompass: true,
          visualizePitch: true,
        }),
        "top-right"
      );

      // Enable rotation & pitch gestures
      maplibreMap.dragRotate.enable();
      maplibreMap.touchZoomRotate.enable();
      maplibreMap.touchZoomRotate.enableRotation();
      maplibreMap.touchPitch.enable();
      maplibreMap.setMaxPitch(60);
    }

    if ("geolocation" in navigator) {
      console.log("Geolocation is available.");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("Got initial location:", latitude, longitude);
          const initialUserLoc = { lat: latitude, lng: longitude };

          dispatch(setUserLocation(initialUserLoc));

          if (map.current && !hasCenteredOnUser) {
            map.current.setView([latitude, longitude], 15);
            setHasCenteredOnUser(true);
          }
        },
        (error) => {
          console.warn("Could not get initial user location:", error.message);
        }
      );

      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          dispatch(setUserLocation({ lat: latitude, lng: longitude }));
        },
        (error) => {
          console.error("Error watching position:", error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }

    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden === false && !showArrivalModal && !showResumeModal) {
        const appIsInNavigation =
          JSON.parse(localStorage.getItem("isNavigating")) === true;
        const appHasRoute = localStorage.getItem("currentRoute") !== null;

        if (appIsInNavigation && appHasRoute) {
          if (!hasCheckedOnLoad.current) {
            console.log(
              "Page loaded into active navigation. Asking to resume."
            );
            setShowResumeModal(true);
            hasCheckedOnLoad.current = true;
          }
        }
      }

      if (document.hidden === true) {
        hasCheckedOnLoad.current = false;
      }
    };

    handleVisibilityChange();

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [showArrivalModal, showResumeModal]);

  // Effect to update map language
  useEffect(() => {
    if (!mapLayer.current) return;
    mapLayer.current.setLanguage(mapLanguage);
  }, [mapLanguage]);

  // Effect to update map style
  useEffect(() => {
    if (!mapLayer.current) return;
    const newStyleUrl = MAP_STYLES[mapStyle] || MAP_STYLES.default;
    mapLayer.current.setStyle(newStyleUrl);
  }, [mapStyle]);

  // Effect for drawing the route
  useEffect(() => {
    if (!map.current) return;
    if (routeLayer.current) {
      map.current.removeLayer(routeLayer.current);
    }
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
      const distanceValueKm = (routeData.distance / 1000).toFixed(1);
      const duration = Math.round(routeData.time / 60000);

      newRoute.bindPopup(
        `<b>Route Info</b><br>Distance: ${distanceValueKm} km<br>Duration: ${duration} min`
      );

      if (!showResumeModal) {
        setShowArrivalModal(false);
      }

      const hasSufficientDistance = distanceValueKm > 0.01;
      // if user enter pointA and pointB as the same addresses, we just setView to that coords and GH returns a point
      if (!hasSufficientDistance) {
        map.current.setView(
          [
            routeData.points.coordinates[0][1], // lat
            routeData.points.coordinates[0][0], // lng
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
  }, [routeData, isNavigating, showResumeModal]);

  // Effect for drawing the single-click marker
  useEffect(() => {
    if (!map.current) return;
    if (markerLayer.current) {
      map.current.removeLayer(markerLayer.current);
    }
    if (markerLocation) {
      const newMarker = L.marker(markerLocation).addTo(map.current);
      map.current.panTo(markerLocation);
      markerLayer.current = newMarker;
    }
  }, [markerLocation]);

  // Effect to toggle live traffic visibility
  useEffect(() => {
    if (!mapLayer.current) return;
    const setTrafficVisibility = (visible) => {
      const maplibreMap = mapLayer.current.map;
      if (!maplibreMap) return;
      if (!maplibreMap.isStyleLoaded()) {
        maplibreMap.once("load", () => setTrafficVisibility(visible));
        return;
      }
      const style = maplibreMap.getStyle();
      if (!style || !style.layers) return;
      const trafficLayers = style.layers.filter((layer) =>
        layer.id.includes("traffic")
      );
      trafficLayers.forEach((layer) => {
        maplibreMap.setLayoutProperty(
          layer.id,
          "visibility",
          visible ? "visible" : "none"
        );
      });
    };
    setTrafficVisibility(showTraffic);
  }, [showTraffic, mapStyle]);

  // Effect to draw/filter potholes
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
        L.circleMarker([lat, lng], {
          radius: 6,
          fillColor: getSeverityColor(pothole.severity),
          color: "#000",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8,
        })
          .bindPopup(
            `<b>Pothole (ID: ${pothole.id})</b><br>Severity: ${pothole.severity}`
          )
          .addTo(potholesLayer.current);
      });
    }
  }, [potholes, showPotholes, severityFilter, isLoadingPotholes, potholeError]);

  const handleReroute = useCallback(async () => {
    dispatch(setIsReRouting(true));
    console.log("User is off-route. Re-routing...");

    const fromCoords = [userLocation.lat, userLocation.lng];
    const toCoords = destinationCoords;

    if (!fromCoords || !toCoords) {
      console.error("Missing coords for re-route.");
      dispatch(setIsReRouting(false));
      return;
    }

    const newRouteData = await getRoute(fromCoords, toCoords);

    if (newRouteData) {
      dispatch(setRoute(newRouteData));
    } else {
      console.error("Failed to fetch new route.");
    }

    setTimeout(() => {
      dispatch(setIsReRouting(false));
    }, 3000);
  }, [dispatch, userLocation, destinationCoords]);

  // Effect to draw puck and handle navigation
  useEffect(() => {
    if (!map.current) return;

    if (userLocation) {
      const userLatLng = [userLocation.lat, userLocation.lng];
      if (!userPuckMarker.current) {
        userPuckMarker.current = L.marker(userLatLng, {
          icon: userLocationIcon,
          pane: "markerPane",
        }).addTo(map.current);
      } else {
        userPuckMarker.current.setLatLng(userLatLng);
      }
    } else {
      if (userPuckMarker.current) {
        userPuckMarker.current.remove();
        userPuckMarker.current = null;
      }
    }

    // Handle navigation logic (follow, re-route, and arrival)
    if (isNavigating && userLocation && !showResumeModal) {
      // Follow user
      map.current.setView([userLocation.lat, userLocation.lng], 17);

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
          } else {
            const routeCoords = routeData.points.coordinates;
            const destination = routeCoords[routeCoords.length - 1];

            const distanceToDest = distance(userPoint, destination, {
              units: "meters",
            });

            console.log(`Distance to destination: ${distanceToDest} meters`);

            if (distanceToDest < 50 && !showArrivalModal) {
              console.log("User has arrived at destination!");
              setShowArrivalModal(true);
              dispatch(setIsNavigating(false));
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
  ]);

  // Handler for the "Find My Location" button
  const handleFindMe = () => {
    if (userLocation && map.current) {
      map.current.setView([userLocation.lat, userLocation.lng], 16);
    } else {
      console.error("Cannot find location. User may have denied permission.");
    }
  };

  return (
    <div className={styles.mapWrap}>
      {showArrivalModal && <ArrivalModal />}
      {showResumeModal && (
        <ResumeNavigationModal onClose={() => setShowResumeModal(false)} />
      )}
      <div ref={mapContainer} className={styles.map}></div>
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
