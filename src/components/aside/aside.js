"use client";
import { House, Search, Layers, Settings, User, LogOut } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { togglePanel } from "@/lib/features/ui/uiSlice";
import NavItem from "./nav-item";
import styles from "./aside.module.css";

export default function Aside() {
  const dispatch = useDispatch();
  const activePanel = useSelector((state) => state.ui.activePanel);

  return (
    <aside id="sidebar" className={styles.sidebar}>
      <div className={styles.sidebarContent}>
        {/* ... Logo ... */}
        <div className={styles.logo}>
          <span style={{ fontWeight: 800, fontSize: "1.25rem" }}>Y</span>
        </div>

        {/* Main navigation: */}
        <nav className={styles.nav}>
          <NavItem
            icon={House}
            title="Home"
            onClick={() => dispatch(togglePanel("home"))}
            isActive={activePanel === "home"}
          />
          <NavItem
            icon={Search}
            title="Search"
            onClick={() => dispatch(togglePanel("search"))}
            isActive={activePanel === "search"}
          />
          <NavItem
            icon={Layers}
            title="Layers"
            onClick={() => dispatch(togglePanel("layers"))}
            isActive={activePanel === "layers"}
          />
          <NavItem
            icon={Settings}
            title="Settings"
            onClick={() => dispatch(togglePanel("settings"))}
            isActive={activePanel === "settings"}
          />
        </nav>
      </div>

      {/* Bottom Navigation */}
      <div className={styles.bottomNav}>
        <NavItem icon={User} title="User" />
        <NavItem icon={LogOut} title="Logout" />
      </div>
    </aside>
  );
}
