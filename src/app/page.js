import Aside from "@/components/aside/aside";
import MapPage from "@/components/Map/map-page";
import styles from "./page.module.css";
import SearchPanelWrapper from "@/components/search/search-panel-wrapper";

export default function Home() {
  return (
    <div className={styles.container}>
      <Aside />
      <SearchPanelWrapper />
      <MapPage />
    </div>
  );
}
