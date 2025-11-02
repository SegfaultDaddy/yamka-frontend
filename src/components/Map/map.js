"use client";

import React, { useRef, useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MaptilerLayer } from "@maptiler/leaflet-maptilersdk";

import styles from "./map.module.css";
import { useSelector, useDispatch } from "react-redux";
import { MAP_STYLES } from "./map-styles";
import { useGetPotholesQuery } from "@/src/lib/features/api/apiSlice";
import { getSeverityColor } from "@/src/lib/utils/utils";

import {
  setIsNavigating,
  setUserLocation,
  setRoute,
} from "@/src/lib/features/ui/uiSlice";
import ArrivalModal from "./arrival-modal";
import { Locate } from "lucide-react";

import { distance } from "@turf/distance";

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

  const [showArrivalModal, setShowArrivalModal] = useState(false);
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
    L.control.zoom({ position: "topright" }).addTo(map.current);
    const initialStyleUrl = MAP_STYLES[mapStyle] || MAP_STYLES.default;
    const mtLayer = new MaptilerLayer({
      style: initialStyleUrl,
      language: mapLanguage,
    }).addTo(map.current);
    mapLayer.current = mtLayer;
    potholesLayer.current = L.featureGroup().addTo(map.current);

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
      const distanceVal = (routeData.distance / 1000).toFixed(1);
      const duration = Math.round(routeData.time / 60000);
      newRoute.bindPopup(
        `<b>Route Info</b><br>Distance: ${distanceVal} km<br>Duration: ${duration} min`
      );

      setShowArrivalModal(false);

      if (!isNavigating) {
        map.current.fitBounds(newRoute.getBounds());
      }
    }
    if (!routeData) {
      setShowArrivalModal(false);
    }
  }, [routeData, isNavigating]);

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

    if (isNavigating && userLocation) {
      map.current.setView([userLocation.lat, userLocation.lng], 17);

      if (routeData && routeData.points) {
        if (typeof distance === "undefined") {
          console.error("Turf 'distance' function is not loaded!");
          return;
        }

        const routeCoords = routeData.points.coordinates;
        const destination = routeCoords[routeCoords.length - 1]; // [lng, lat]
        const userPoint = [userLocation.lng, userLocation.lat]; // [lng, lat]

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
  }, [userLocation, isNavigating, routeData, dispatch, showArrivalModal]);

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
      <div ref={mapContainer} className={styles.map}></div>
      <button className={styles.locateButton} onClick={handleFindMe}>
        <Locate size={20} />
      </button>
    </div>
  );
};

export default Map;
