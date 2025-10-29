"use client";

import dynamic from "next/dynamic";
import styles from "./map-page.module.css";
import { useSelector } from "react-redux";
import Instructions from "./instructions";

const Map = dynamic(() => import("@/src/components/Map/map"), {
  loading: () => <p>Loading...</p>,
  ssr: false,
});

export default function MapPage() {
  const routeData = useSelector((state) => state.ui.route);

  const markerLocation = useSelector((state) => state.ui.markerLocation);

  const activePanel = useSelector((state) => state.ui.activePanel);

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
