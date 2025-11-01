import { NextResponse } from "next/server";

export async function POST(request) {
  const body = await request.json();
  const { start, end } = body;

  if (!start || !end) {
    return NextResponse.json(
      { error: "Missing start or end coordinates" },
      { status: 400 }
    );
  }

  const API_KEY = process.env.GRAPHHOPPER_API_KEY;
  if (!API_KEY) {
    console.error("SERVER: GRAPHHOPPER_API_KEY is not configured.");
    return NextResponse.json(
      { error: "API key is not configured" },
      { status: 500 }
    );
  }

  const startPoint = [start[1], start[0]];
  const endPoint = [end[1], end[0]];

  const ghRequest = {
    points: [startPoint, endPoint],
    profile: "car",
    points_encoded: false,
    instructions: true,
  };

  try {
    const url = `https://graphhopper.com/api/1/route?key=${API_KEY}`;

    const requestBody = JSON.stringify(ghRequest);
    console.log("SERVER: Sending to GraphHopper:", requestBody);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody,
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("GraphHopper Routing Error:", errorData.message);
      return NextResponse.json(
        {
          error: "Failed to fetch from GraphHopper",
          ghError: errorData.message,
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Routing API Route Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
