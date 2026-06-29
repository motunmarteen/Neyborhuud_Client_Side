const description =
  "NeyborHuud: hyperlocal safety, FYI bulletins, Sentinel SOS, and neighbourhood commerce.";

/** @returns {import('next').MetadataRoute.Manifest} */
export default function manifest() {
  return {
    name: "NeyborHuud",
    short_name: "NeyborHuud",
    description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#00d431",
    orientation: "portrait-primary",
    categories: ["social", "navigation", "lifestyle"],
    lang: "en-NG",
    icons: [
      {
        src: "/icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512-maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
