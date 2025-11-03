import { createSlice } from "@reduxjs/toolkit";
import { getFromLocalStorage } from "../../utils/utils.js";

const initialState = {
  activePanel: null,
  markerLocation: null,
  route: null,
  mapStyle: getFromLocalStorage("userMapStyle", "default"),
  locale: getFromLocalStorage("userLocale", "en"),
  units: getFromLocalStorage("userUnits", "metric"),
  showTraffic: true,
  showPotholes: true,
  potholeSeverityFilter: 1,
  isNavigating: false,
  userLocation: null,
  destinationCoords: null,
  isReRouting: false,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setActivePanel: (state, action) => {
      state.activePanel = action.payload;
    },
    togglePanel: (state, action) => {
      const panelName = action.payload;
      state.activePanel = state.activePanel === panelName ? null : panelName;
    },
    setMarkerLocation: (state, action) => {
      state.markerLocation = action.payload;
    },
    setRoute: (state, action) => {
      state.route = action.payload;
    },
    setLocale: (state, action) => {
      state.locale = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("userLocale", JSON.stringify(action.payload));
      }
    },
    setUnits: (state, action) => {
      state.units = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("userUnits", JSON.stringify(action.payload));
      }
    },
    setMapStyle: (state, action) => {
      state.mapStyle = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("userMapStyle", JSON.stringify(action.payload));
      }
    },
    setShowTraffic: (state, action) => {
      state.showTraffic = action.payload;
    },
    setShowPotholes: (state, action) => {
      state.showPotholes = action.payload;
    },
    setPotholeSeverityFilter: (state, action) => {
      state.potholeSeverityFilter = action.payload;
    },
    setIsNavigating: (state, action) => {
      state.isNavigating = action.payload;
    },
    setUserLocation: (state, action) => {
      state.userLocation = action.payload;
    },
    setDestinationCoords: (state, action) => {
      state.destinationCoords = action.payload;
    },
    setIsReRouting: (state, action) => {
      state.isReRouting = action.payload;
    },
  },
});

export const {
  setActivePanel,
  togglePanel,
  setMarkerLocation,
  setRoute,
  setLocale,
  setUnits,
  setMapStyle,
  setShowTraffic,
  setShowPotholes,
  setPotholeSeverityFilter,
  setIsNavigating,
  setUserLocation,
  setDestinationCoords,
  setIsReRouting,
} = uiSlice.actions;

export default uiSlice.reducer;
