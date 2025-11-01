import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/" }),
  endpoints: (builder) => ({
    getPotholes: builder.query({
      query: () => "/data/potholes-data.json",
      transformResponse: (response) => response.potholes,
    }),
  }),
});

export const { useGetPotholesQuery } = apiSlice;
