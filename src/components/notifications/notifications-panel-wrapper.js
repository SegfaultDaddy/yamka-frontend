"use client";
import { useSelector } from "react-redux";
import NotificationsPanel from "./notifications-panel";

export default function NotificationsPanelWrapper() {
  const activePanel = useSelector((state) => state.ui.activePanel);

  if (activePanel !== "notifications") {
    return null;
  }

  return <NotificationsPanel />;
}
