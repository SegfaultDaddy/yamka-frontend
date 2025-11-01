import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./features/ui/uiSlice";
import { apiSlice } from "./features/api/apiSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      ui: uiReducer,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
  });
};
