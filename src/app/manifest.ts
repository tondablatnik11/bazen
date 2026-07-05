import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chytrý Bazénář",
    short_name: "Bazénář",
    description:
      "Chytrá péče o bazénovou vodu – výpočet pH, chlóru a doporučených přípravků.",
    lang: "cs",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f0f9ff",
    theme_color: "#0ea5e9",
    categories: ["lifestyle", "utilities", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}