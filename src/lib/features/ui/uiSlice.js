import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activePanel: null,
  markerLocation: null,
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
  },
});

export const { setActivePanel, togglePanel, setMarkerLocation } =
  uiSlice.actions;

export default uiSlice.reducer;
