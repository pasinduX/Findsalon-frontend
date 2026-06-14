import type { MetadataRoute } from "next";
import { brandImageUrl, defaultDescription, siteName } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteName} - Salon Booking Sri Lanka`,
    short_name: siteName,
    description: defaultDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111827",
    icons: [
      {
        src: brandImageUrl,
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
