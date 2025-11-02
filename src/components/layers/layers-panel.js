"use client";
import { X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  setActivePanel,
  setMapStyle,
  setShowTraffic,
  setShowPotholes,
  setPotholeSeverityFilter,
} from "@/src/lib/features/ui/uiSlice";
import styles from "./layers-panel.module.css";

export default function LayersPanel() {
  const dispatch = useDispatch();

  const currentStyle = useSelector((state) => state.ui.mapStyle);
  const showTraffic = useSelector((state) => state.ui.showTraffic);
  const showPotholes = useSelector((state) => state.ui.showPotholes);
  const severityFilter = useSelector((state) => state.ui.potholeSeverityFilter);

  const handleClose = () => {
    dispatch(setActivePanel(null));
  };

  const handleStyleChange = (style) => {
    dispatch(setMapStyle(style));
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
            <button
              className={`${styles.btn} ${
                currentStyle === "default" ? styles.active : ""
              }`}
              onClick={() => handleStyleChange("default")}
            >
              Default
            </button>
            <button
              className={`${styles.btn} ${
                currentStyle === "satellite" ? styles.active : ""
              }`}
              onClick={() => handleStyleChange("satellite")}
            >
              Satellite
            </button>
            <button
              className={`${styles.btn} ${
                currentStyle === "dark" ? styles.active : ""
              }`}
              onClick={() => handleStyleChange("dark")}
            >
              Dark
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <h5>Data Toggles</h5>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={showPotholes}
              onChange={(e) => dispatch(setShowPotholes(e.target.checked))}
            />{" "}
            Show Potholes
          </label>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={showTraffic}
              onChange={(e) => dispatch(setShowTraffic(e.target.checked))}
            />{" "}
            Show Live Traffic
          </label>
        </div>

        <div className={styles.section}>
          <h5>Pothole Severity</h5>
          <input
            type="range"
            min="1"
            max="5"
            value={severityFilter}
            onChange={(e) =>
              dispatch(setPotholeSeverityFilter(Number(e.target.value)))
            }
            className={styles.slider}
            disabled={!showPotholes}
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
