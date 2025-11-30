import { createSlice } from "@reduxjs/toolkit";
import { getFromLocalStorage } from "../../utils/utils.js";

const initialState = {
  activePanel: null,
  mapStyle: getFromLocalStorage("userMapStyle", "default"),
  locale: getFromLocalStorage("userLocale", "en"),
  units: getFromLocalStorage("userUnits", "metric"),
  isMuted: getFromLocalStorage("isMuted", false),
  showPotholes: true,
  potholeSeverityFilter: 1,
  route: getFromLocalStorage("currentRoute", null),
  isNavigating: getFromLocalStorage("isNavigating", false),
  userLocation: null,
  destinationCoords: getFromLocalStorage("destinationCoords", null),
  isReRouting: false,
  currentInstructionIndex: getFromLocalStorage("currentInstructionIndex", 0),
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
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
      localStorage.setItem("isMuted", JSON.stringify(state.isMuted));
    },
    setRoute: (state, action) => {
      state.route = action.payload;
      if (action.payload) {
        localStorage.setItem("currentRoute", JSON.stringify(action.payload));
      } else {
        localStorage.removeItem("currentRoute");
        localStorage.removeItem("currentInstructionIndex");
      }
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
    setShowPotholes: (state, action) => {
      state.showPotholes = action.payload;
    },
    setPotholeSeverityFilter: (state, action) => {
      state.potholeSeverityFilter = action.payload;
    },
    setIsNavigating: (state, action) => {
      state.isNavigating = action.payload;
      localStorage.setItem("isNavigating", JSON.stringify(action.payload));

      if (!action.payload) {
        state.currentInstructionIndex = 0;
        localStorage.removeItem("currentInstructionIndex");
      }
    },
    setUserLocation: (state, action) => {
      state.userLocation = action.payload;
    },
    setDestinationCoords: (state, action) => {
      state.destinationCoords = action.payload;
      if (action.payload) {
        localStorage.setItem(
          "destinationCoords",
          JSON.stringify(action.payload)
        );
      } else {
        localStorage.removeItem("destinationCoords");
      }
    },
    setIsReRouting: (state, action) => {
      state.isReRouting = action.payload;
    },
    setCurrentInstructionIndex: (state, action) => {
      state.currentInstructionIndex = action.payload;

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "currentInstructionIndex",
          JSON.stringify(action.payload)
        );
      }
    },
  },
});

export const {
  setActivePanel,
  togglePanel,
  toggleMute,
  setRoute,
  setLocale,
  setUnits,
  setMapStyle,
  setShowPotholes,
  setPotholeSeverityFilter,
  setIsNavigating,
  setUserLocation,
  setDestinationCoords,
  setIsReRouting,
  setCurrentInstructionIndex,
} = uiSlice.actions;

export default uiSlice.reducer;
