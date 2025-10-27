"use client";

import React, { useRef, useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import styles from "./map.module.css";

import { MaptilerLayer } from "@maptiler/leaflet-maptilersdk";

const Map = ({ routeData, markerLocation, activePanel }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const routeLayer = useRef(null);
  const markerLayer = useRef(null);
  const center = { lat: 49.842957, lng: 24.031111 };
  const [zoom] = useState(14);

  //////////////////////////////
  // Effect to initialize the map
  useEffect(() => {
    if (map.current) return;

    const MAP_API_KEY = process.env.NEXT_PUBLIC_MAP_API_KEY;
    const MAP_STYLE_CODE = process.env.NEXT_PUBLIC_MAP_STYLE_CODE;

    map.current = new L.Map(mapContainer.current, {
      center: L.latLng(center.lat, center.lng),
      zoom: zoom,
    });

    const mtLayer = new MaptilerLayer({
      apiKey: MAP_API_KEY,
      style: `https://api.maptiler.com/maps/${MAP_STYLE_CODE}/style.json?key=${MAP_API_KEY}`,
    }).addTo(map.current);
  }, [center.lng, center.lat, zoom]);

  //////////////////////////////////
  // Effect for drawing the route
  useEffect(() => {
    if (!map.current) return;

    if (routeLayer.current) {
      map.current.removeLayer(routeLayer.current);
    }

    if (routeData) {
      const newRoute = L.geoJSON(routeData, {
        style: () => ({
          color: "#3388ff",
          weight: 5,
          opacity: 0.7,
        }),
      });

      newRoute.addTo(map.current);
      routeLayer.current = newRoute;

      map.current.fitBounds(newRoute.getBounds());
    }
  }, [routeData]);

  //////////////////////////////////////////////////////
  //  USE EFFECT FOR THE MARKER
  useEffect(() => {
    if (!map.current) return;

    // Remove any existing marker
    if (markerLayer.current) {
      map.current.removeLayer(markerLayer.current);
    }

    // If we have a new location, add a marker
    if (markerLocation) {
      const newMarker = L.marker(markerLocation).addTo(map.current);

      map.current.panTo(markerLocation);
      markerLayer.current = newMarker;
    }
  }, [markerLocation]);

  return (
    <div className={styles.mapWrap}>
      <div ref={mapContainer} className={styles.map}></div>
    </div>
  );
};

export default Map;
