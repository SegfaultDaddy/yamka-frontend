export default async function getRoute(start, end) {
  const MAPBOX_DIRECTIONS_API_KEY =
    process.env.NEXT_PUBLIC_MAPBOX_DIRECTIONS_API_KEY;

  const profile = "mapbox/driving-traffic";

  const params = {
    steps: "true",
    geometries: "geojson",
    access_token: MAPBOX_DIRECTIONS_API_KEY,
  };

  const queryString = new URLSearchParams(params).toString();
  const url = `https://api.mapbox.com/directions/v5/${profile}/${start[0]},${start[1]};${end[0]},${end[1]}?${queryString}`;

  try {
    const query = await fetch(url);

    if (!query.ok) {
      const errorBody = await query.json();
      console.error("Failing URL:", url);
      console.error("Mapbox API Error:", errorBody.message);
      throw new Error(`Mapbox API request failed: ${query.statusText}`);
    }

    const json = await query.json();
    const data = json.routes[0];
    const geojson = {
      type: "Feature",
      properties: {},
      geometry: data.geometry,
    };

    return {
      geojson,
      duration: data.duration,
      steps: data.legs[0].steps,
      distance: data.distance,
      units: "metric",
    };
  } catch (error) {
    console.log(`ERROR💥💥💥: ${error}`);
    return null;
  }
}
