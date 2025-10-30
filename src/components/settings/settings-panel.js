"use client";
import { X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  setActivePanel,
  setLocale,
  setUnits,
} from "@/src/lib/features/ui/uiSlice";
import styles from "../layers/layers-panel.module.css";
import { current } from "@reduxjs/toolkit";

export default function SettingsPanel() {
  const dispatch = useDispatch();

  const currentLocale = useSelector((state) => state.ui.locale);
  const currentUnits = useSelector((state) => state.ui.units);

  const handleClose = () => {
    dispatch(setActivePanel(null));
  };

  const handleLanguageChange = (newLocale) => {
    dispatch(setLocale(newLocale));
  };

  const handleUnitsChange = (newUnits) => {
    dispatch(setUnits(newUnits));
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
            <button
              className={`${styles.btn} ${
                currentLocale === "en" ? styles.active : ""
              }`}
              onClick={() => handleLanguageChange("en")}
            >
              English
            </button>
            <button
              className={`${styles.btn} ${
                currentLocale === "uk" ? styles.active : ""
              }`}
              onClick={() => handleLanguageChange("uk")}
            >
              Українська
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <h5>Units</h5>
          <div className={styles.buttonGroup}>
            <button
              className={`${styles.btn} ${
                currentUnits === "metric" ? styles.active : ""
              }`}
              onClick={() => handleUnitsChange("metric")}
            >
              Metric
            </button>
            <button
              className={`${styles.btn} ${
                currentUnits === "imperial" ? styles.active : ""
              }`}
              onClick={() => handleUnitsChange("imperial")}
            >
              Imperial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
