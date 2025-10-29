"use client";
import { useSelector } from "react-redux";
import UserProfilePanel from "./user-profile-panel";

export default function UserProfilePanelWrapper() {
  const activePanel = useSelector((state) => state.ui.activePanel);

  if (activePanel !== "user") {
    return null;
  }

  return <UserProfilePanel />;
}
