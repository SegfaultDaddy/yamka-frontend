"use client";
import { X } from "lucide-react";
import { useDispatch } from "react-redux";
import { setActivePanel } from "@/src/lib/features/ui/uiSlice";
import styles from "../layers/layers-panel.module.css";

export default function SettingsPanel() {
  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(setActivePanel(null));
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h4>Settings</h4>
        <button onClick={handleClose} className={styles.closeButton}>
          <X size={20} />
        </button>
      </div>
      <hr className={styles.divider} />

      <div className={styles.content}>
        <div className={styles.section}>
          <h5>Language</h5>
          <div className={styles.buttonGroup}>
            <button className={styles.btn}>English</button>
            <button className={styles.btn}>Українська</button>
          </div>
        </div>

        <div className={styles.section}>
          <h5>Units</h5>
          <div className={styles.buttonGroup}>
            <button className={styles.btn}>Metric</button>
            <button className={styles.btn}>Imperial</button>
          </div>
        </div>
      </div>
    </div>
  );
}
