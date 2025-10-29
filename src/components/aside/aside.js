"use client";
import { Search, Layers, Settings, User, Bell } from "lucide-react"; // Removed House, LogOut. Added Bell.
import { useDispatch, useSelector } from "react-redux";
import { togglePanel } from "@/src/lib/features/ui/uiSlice";
import NavItem from "./nav-item";
import styles from "./aside.module.css";

export default function Aside() {
  const dispatch = useDispatch();
  const activePanel = useSelector((state) => state.ui.activePanel);

  return (
    <aside id="sidebar" className={styles.sidebar}>
      <div className={styles.sidebarContent}>
        {/* Logo */}
        <div className={styles.logo}>
          <span style={{ fontWeight: 800, fontSize: "1.25rem" }}>Y</span>
        </div>

        {/* Main navigation */}
        <nav className={styles.nav}>
          <NavItem
            icon={Search}
            title="Search Route"
            onClick={() => dispatch(togglePanel("search"))}
            isActive={activePanel === "search"}
          />
          <NavItem
            icon={Layers}
            title="Map Layers"
            onClick={() => dispatch(togglePanel("layers"))}
            isActive={activePanel === "layers"}
          />
        </nav>
      </div>

      {/* Bottom Navigation */}
      <div className={styles.bottomNav}>
        <NavItem
          icon={Bell}
          title="Notifications"
          onClick={() => dispatch(togglePanel("notifications"))}
          isActive={activePanel === "notifications"}
        />
        <NavItem
          icon={User}
          title="User Profile"
          onClick={() => dispatch(togglePanel("user"))}
          isActive={activePanel === "user"}
        />
        <NavItem
          icon={Settings}
          title="Settings"
          onClick={() => dispatch(togglePanel("settings"))}
          isActive={activePanel === "settings"}
        />
      </div>
    </aside>
  );
}
