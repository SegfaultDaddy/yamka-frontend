"use client";

import { useSelector, useDispatch } from "react-redux";
import styles from "./arrival-info.module.css";
import { Volume2, VolumeOff } from "lucide-react";
import {
  calculateETA,
  formatTripDistance,
  formatTripDuration,
} from "@/src/lib/utils/utils";
import { useEffect, useState, useMemo } from "react";
import { toggleMute } from "@/src/lib/features/ui/uiSlice";
import turfDistance from "@turf/distance";

export default function ArrivalInfo() {
  const {
    route,
    units,
    isMuted,
    currentInstructionIndex,
    isNavigating,
    userLocation,
  } = useSelector((state) => state.ui);
  const dispatch = useDispatch();

  const [isClient, setIsClient] = useState(false);
  const [eta, setETA] = useState("...");
  const [remainingTimeInSeconds, setRemainingTimeInSeconds] = useState(null);
  const [remainingDistanceInMeters, setRemainingDistanceInMeters] =
    useState(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Effect to re-sync on progress
  useEffect(() => {
    if (
      !isClient ||
      !route ||
      !route.instructions ||
      typeof currentInstructionIndex === "undefined" ||
      !isNavigating
    ) {
      return;
    }

    let distSum = 0;
    let timeSum = 0;

    if (
      userLocation &&
      route.instructions[currentInstructionIndex] &&
      typeof turfDistance === "function"
    ) {
      const nextStep = route.instructions[currentInstructionIndex];
      if (nextStep.points && nextStep.points.length > 0) {
        const userPt = [userLocation.lng, userLocation.lat];
        const nextPt = nextStep.points[0];
        try {
          const distToNext = turfDistance(userPt, nextPt, { units: "meters" });
          distSum += distToNext;

          const avgSpeed = 10;
          timeSum += distToNext / avgSpeed;
        } catch (e) {
          console.warn("Turf distance calculation failed:", e);
        }
      }
    }

    for (let i = currentInstructionIndex; i < route.instructions.length; i++) {
      const instruction = route.instructions[i];

      if (i === currentInstructionIndex) {
        timeSum += instruction.time / 1000 || 0;
      } else {
        timeSum += instruction.time / 1000 || 0;
        distSum += instruction.distance || 0;
      }
    }

    setRemainingTimeInSeconds(Math.floor(timeSum));
    setRemainingDistanceInMeters(distSum);
  }, [route, currentInstructionIndex, isClient, userLocation, isNavigating]);

  // Effect to recalculate the ETA
  useEffect(() => {
    if (remainingTimeInSeconds === null || !isNavigating) return;

    const remainingMinutes = Math.floor(remainingTimeInSeconds / 60);
    let timerId;

    const updateOnMinuteChange = () => {
      setETA(calculateETA(remainingMinutes));
      const now = new Date();
      const millisecondsPastMinute =
        now.getSeconds() * 1000 + now.getMilliseconds();
      const delayUntilNextMinute = 60000 - millisecondsPastMinute + 50;
      timerId = setTimeout(updateOnMinuteChange, delayUntilNextMinute);
    };

    updateOnMinuteChange();
    return () => clearTimeout(timerId);
  }, [remainingTimeInSeconds, isNavigating]);

  const { duration, distance } = useMemo(() => {
    if (remainingTimeInSeconds === null || remainingDistanceInMeters === null) {
      return { duration: "...", distance: "..." };
    }
    const remainingTimeInMs = remainingTimeInSeconds * 1000;
    return {
      duration: formatTripDuration(remainingTimeInMs),
      distance: formatTripDistance(remainingDistanceInMeters, units),
    };
  }, [remainingTimeInSeconds, remainingDistanceInMeters, units]);

  if (
    !isClient ||
    !route ||
    !route.instructions ||
    remainingTimeInSeconds === null ||
    !isNavigating
  ) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.etaAndMuteWrapper}>
        <span className={styles.etaText}>{eta}</span>
        <button
          onClick={() => dispatch(toggleMute())}
          className={styles.iconButton}
        >
          {isMuted ? <VolumeOff size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      <div className={styles.tripInfoLine}>
        <span className={styles.tripDetails}>{duration}</span>
        <span className={styles.dotSeparator}> • </span>
        <span className={styles.tripDetails}>{distance}</span>
      </div>
    </div>
  );
}
