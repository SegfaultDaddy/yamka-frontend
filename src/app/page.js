import Aside from "@/src/components/aside/aside";
import MapPage from "@/src/components/Map/map-page";
import styles from "./page.module.css";
import SearchPanelWrapper from "@/src/components/search/search-panel-wrapper";
import LayersPanelWrapper from "@/src/components/layers/layers-panel-wrapper";
import SettingsPanelWrapper from "@/src/components/settings/settings-panel-wrapper";
import UserProfilePanelWrapper from "@/src/components/user/user-profile-panel-wrapper";
import NotificationsPanelWrapper from "@/src/components/notifications/notifications-panel-wrapper";

export default function Home() {
  return (
    <div className={styles.container}>
      <Aside />

      <SearchPanelWrapper />
      <LayersPanelWrapper />
      <SettingsPanelWrapper />
      <UserProfilePanelWrapper />
      <NotificationsPanelWrapper />

      <MapPage />
    </div>
  );
}
