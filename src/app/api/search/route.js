import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  const API_KEY = process.env.GRAPHHOPPER_API_KEY;
  if (!API_KEY) {
    return NextResponse.json(
      { error: "API key is not configured" },
      { status: 500 }
    );
  }

  const url = `https://graphhopper.com/api/1/geocode?q=${encodeURIComponent(
    query
  )}&key=${API_KEY}&point=49.842957,24.031111&locale=en`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errorData = await res.json();
      console.error("GraphHopper Geocoding Error:", errorData.message);
      return NextResponse.json(
        { error: "Failed to fetch from GraphHopper" },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Geocoding API Route Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
