import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/salons", "/salon/", "/city/", "/district/", "/barber-shops/", "/beauty-salons/", "/bridal-salons/"],
        disallow: ["/admin", "/auth", "/dashboard", "/barber-dashboard", "/my-bookings", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
