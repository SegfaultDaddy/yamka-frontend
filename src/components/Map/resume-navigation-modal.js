import React from "react";
import styles from "./arrival-modal.module.css";
import { useDispatch } from "react-redux";
import {
  setRoute,
  setIsNavigating,
  setDestinationCoords,
} from "@/src/lib/features/ui/uiSlice";

export default function ResumeNavigationModal({ onClose }) {
  const dispatch = useDispatch();

  const handleEndRoute = () => {
    dispatch(setRoute(null));
    dispatch(setIsNavigating(false));
    dispatch(setDestinationCoords(null));
    onClose();
  };

  const handleContinue = () => {
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>Continue Navigation?</h3>
        <p className={styles.subtitle}>
          Are you still driving to this destination?
        </p>
        <div className={styles.buttonGroup}>
          <button
            className={`${styles.finishButton} ${styles.cancelButton}`}
            onClick={handleEndRoute}
          >
            No
          </button>
          <button className={styles.finishButton} onClick={handleContinue}>
            Continue driving...
          </button>
        </div>
      </div>
    </div>
  );
}
