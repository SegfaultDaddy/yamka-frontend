import React from "react";
import styles from "./arrival-modal.module.css";
import { useDispatch } from "react-redux";
import {
  setRoute,
  setIsNavigating,
  setDestinationCoords,
} from "@/src/lib/features/ui/uiSlice";

export default function ArrivalModal() {
  const dispatch = useDispatch();

  const handleFinish = () => {
    dispatch(setRoute(null));
    dispatch(setIsNavigating(false));
    dispatch(setDestinationCoords(null));
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>You have arrived at your destination!</h3>
        <button className={styles.finishButton} onClick={handleFinish}>
          Finish Route
        </button>
      </div>
    </div>
  );
}
