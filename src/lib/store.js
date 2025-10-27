import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./features/ui/uiSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      ui: uiReducer,
    },
  });
};
