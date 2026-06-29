import { SITE_ORIGIN } from "../lib/site-config";

export default function sitemap() {
  return [
    {
      url: SITE_ORIGIN,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
