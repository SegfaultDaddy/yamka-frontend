"use client";
import { useSelector } from "react-redux";
import SettingsPanel from "./settings-panel";

export default function SettingsPanelWrapper() {
  const activePanel = useSelector((state) => state.ui.activePanel);

  if (activePanel !== "settings") {
    return null;
  }

  return <SettingsPanel />;
}
