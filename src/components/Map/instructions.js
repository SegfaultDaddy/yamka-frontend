"use client";

import styles from "./instructions.module.css";

export default function Instructions({ duration, steps }) {
  const tripDuration = Math.floor(duration / 60);

  return (
    <div className={styles.instructionsContainer}>
      <p id="prompt">
        📍 Click the map to get directions to another destination
      </p>
      <p>
        <strong>Trip duration: {tripDuration} min 🚗 </strong>
      </p>
      <ol>
        {steps.map((step, index) => {
          return <li key={index}>{step.maneuver.instruction}</li>;
        })}
      </ol>
    </div>
  );
}
