"use client";

import React, { useRef, useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MaptilerLayer } from "@maptiler/leaflet-maptilersdk";

import styles from "./map.module.css";
import { useSelector } from "react-redux";
import { MAP_STYLES } from "./map-styles";

const Map = ({ routeData, markerLocation, activePanel }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const routeLayer = useRef(null);
  const markerLayer = useRef(null);
  const mapLayer = useRef(null);
  const center = { lat: 49.842957, lng: 24.031111 };
  const [zoom] = useState(14);

  const mapLanguage = useSelector((state) => state.ui.locale);
  const mapStyle = useSelector((state) => state.ui.mapStyle);

  // Effect to initialize the map
  useEffect(() => {
    if (map.current) return;
    map.current = new L.Map(mapContainer.current, {
      center: L.latLng(center.lat, center.lng),
      zoom: zoom,
      zoomControl: false,
    });
    L.control.zoom({ position: "bottomright" }).addTo(map.current);
    const initialStyleUrl = MAP_STYLES[mapStyle] || MAP_STYLES.default;
    const mtLayer = new MaptilerLayer({
      style: initialStyleUrl,
      language: mapLanguage,
    }).addTo(map.current);
    mapLayer.current = mtLayer;
  }, [center.lng, center.lat, zoom, mapLanguage, mapStyle]);

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

      const distance = (routeData.distance / 1000).toFixed(1);
      const duration = Math.round(routeData.time / 60000);
      newRoute.bindPopup(
        `<b>Route Info</b><br>Distance: ${distance} km<br>Duration: ${duration} min`
      );

      map.current.fitBounds(newRoute.getBounds());
    }
  }, [routeData]);

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

  return (
    <div className={styles.mapWrap}>
      <div ref={mapContainer} className={styles.map}></div>
    </div>
  );
};

export default Map;
