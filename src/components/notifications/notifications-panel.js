"use client";
import { X } from "lucide-react";
import { useDispatch } from "react-redux";
import { setActivePanel } from "@/src/lib/features/ui/uiSlice";
import styles from "../layers/layers-panel.module.css";

export default function NotificationsPanel() {
  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(setActivePanel(null));
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h4>Notifications</h4>
        <button onClick={handleClose} className={styles.closeButton}>
          <X size={20} />
        </button>
      </div>
      <hr className={styles.divider} />

      <div className={styles.content}>
        <p style={{ color: "#9ca3af", textAlign: "center", marginTop: "2rem" }}>
          No new notifications.
        </p>
      </div>
    </div>
  );
}
