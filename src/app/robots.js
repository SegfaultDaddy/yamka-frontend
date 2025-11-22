import { SERVER_URL } from "@/src/lib/constants";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${SERVER_URL}/sitemap.xml`,
  };
}
