"use client";
import { useSelector } from "react-redux";
import SearchPanel from "./search-panel";

export default function SearchPanelWrapper() {
  const activePanel = useSelector((state) => state.ui.activePanel);

  if (activePanel !== "search") {
    return null;
  }

  return <SearchPanel />;
}
