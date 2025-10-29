"use client";
import { X } from "lucide-react";
import { useDispatch } from "react-redux";
import { setActivePanel } from "@/src/lib/features/ui/uiSlice";
import styles from "./layers-panel.module.css";

export default function LayersPanel() {
  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(setActivePanel(null));
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h4>Map Layers & Style</h4>
        <button onClick={handleClose} className={styles.closeButton}>
          <X size={20} />
        </button>
      </div>
      <hr className={styles.divider} />

      <div className={styles.content}>
        <div className={styles.section}>
          <h5>Map Style</h5>
          <div className={styles.buttonGroup}>
            <button className={styles.btn}>Default</button>
            <button className={styles.btn}>Satellite</button>
            <button className={styles.btn}>Dark</button>
          </div>
        </div>

        <div className={styles.section}>
          <h5>Data Toggles</h5>
          <label className={styles.toggle}>
            <input type="checkbox" defaultChecked /> Show Potholes
          </label>
          <label className={styles.toggle}>
            <input type="checkbox" defaultChecked /> Show Live Traffic
          </label>
        </div>

        <div className={styles.section}>
          <h5>Pothole Severity</h5>
          <input
            type="range"
            min="1"
            max="5"
            defaultValue="1"
            className={styles.slider}
          />
          <div className={styles.sliderLabels}>
            <span>All</span>
            <span>Severe Only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
