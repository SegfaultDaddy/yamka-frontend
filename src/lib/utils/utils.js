export const getFromLocalStorage = (key, defaultValue) => {
  if (typeof window !== "undefined") {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      return JSON.parse(storedValue);
    }
  }
  return defaultValue;
};

export const formatTitle = (slug) => {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const getSeverityColor = (severity) => {
  if (severity === 5) return "#ff0000";
  if (severity === 4) return "#ff8c00";
  if (severity === 3) return "#ffa500";
  if (severity === 2) return "#ffd700";
  return "#ffff00";
};

export const formatPlaceName = (hit) => {
  return [hit.name, hit.housenumber, hit.city, hit.state, hit.country]
    .filter(Boolean)
    .join(", ");
};

export const generateRandomKeySlug = () => {
  return Math.random() * 100;
};
