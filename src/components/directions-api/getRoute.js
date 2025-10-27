export default async function getRoute(start, end) {
  const MAPBOX_DIRECTIONS_API_KEY =
    process.env.NEXT_PUBLIC_MAPBOX_DIRECTIONS_API_KEY;

  try {
    const query = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${MAPBOX_DIRECTIONS_API_KEY}`
    );

    if (!query.ok) {
      throw new Error(`Mapbox API request failed: ${query.statusText}`);
    }

    const json = await query.json();
    const data = json.routes[0];
    const geojson = {
      type: "Feature",
      properties: {},
      geometry: data.geometry,
    };

    return { geojson, duration: data.duration, steps: data.legs[0].steps };
  } catch (error) {
    console.log(`ERROR💥💥💥: ${error}`);
    return null;
  }
}
