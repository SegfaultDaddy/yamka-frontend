"use client";

import dynamic from "next/dynamic";
import styles from "./map-page.module.css";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import getRoute from "../directions-api/getRoute";
import Instructions from "./instructions";

const Map = dynamic(() => import("@/components/Map/map"), {
  loading: () => <p>Loading...</p>,
  ssr: false,
});

export default function MapPage() {
  const [routeData, setRouteData] = useState(null);

  const markerLocation = useSelector((state) => state.ui.markerLocation);

  const activePanel = useSelector((state) => state.ui.activePanel);

  useEffect(() => {
    const start = [24.0217826, 49.858046];
    const end = [23.992923623520408, 49.85039755505913];

    async function fetchRoute() {
      const route = await getRoute(start, end);
      if (route) {
        setRouteData(route);
      }
    }

    fetchRoute();
  }, []);

  return (
    <main className={styles.main}>
      <Map
        routeData={routeData ? routeData.geojson : null}
        markerLocation={markerLocation}
        activePanel={activePanel}
      />
      {/* {routeData && (
        <Instructions duration={routeData.duration} steps={routeData.steps} />
      )} */}
    </main>
  );
}
