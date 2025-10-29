"use client";

import { useSelector } from "react-redux";
import LayersPanel from "./layers-panel";

export default function LayersPanelWrapper() {
  const activePanel = useSelector((state) => state.ui.activePanel);

  if (activePanel !== "layers") {
    return null;
  }

  return <LayersPanel />;
}
