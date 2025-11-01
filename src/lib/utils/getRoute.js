export default async function getRoute(start, end) {
  try {
    const response = await fetch("/api/route", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ start, end }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error("Failed to get route from our API:", errorBody.error);
      throw new Error(`Our API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.paths && data.paths.length > 0) {
      return data.paths[0];
    } else {
      console.log("No paths found by GraphHopper.");
      return null;
    }
  } catch (error) {
    console.log(`ERROR: (getRoute): ${error}`);
    return null;
  }
}
