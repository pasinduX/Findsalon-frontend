import type { MetadataRoute } from "next";
import { cities, districts, serviceLandings } from "@/lib/locations";
import { publicRoutes, siteUrl } from "@/lib/seo";

type SalonDto = {
  SalonId?: string;
  UpdatedAt?: string;
  CreatedAt?: string;
};

async function fetchSalonRoutes(): Promise<MetadataRoute.Sitemap> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBase) return [];

  try {
    const response = await fetch(`${apiBase.replace(/\/$/, "")}/api/v1/salon/FindallSalon`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];

    const json = await response.json().catch(() => null);
    const raw = Array.isArray(json) ? json : json?.data;
    const salons: SalonDto[] = Array.isArray(raw) ? raw : raw?.data ?? [];

    return salons
      .filter((salon) => salon.SalonId)
      .map((salon) => ({
        url: `${siteUrl}/salon/${salon.SalonId}`,
        lastModified: salon.UpdatedAt || salon.CreatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = publicRoutes.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.8,
  }));
  const districtRoutes: MetadataRoute.Sitemap = districts.map((district) => ({
    url: `${siteUrl}/district/${district.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.75,
  }));
  const cityRoutes: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${siteUrl}/city/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.75,
  }));
  const serviceRoutes: MetadataRoute.Sitemap = Object.keys(serviceLandings).flatMap((serviceKey) =>
    cities.map((city) => ({
      url: `${siteUrl}/${serviceKey}/${city.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.72,
    }))
  );

  return [...staticRoutes, ...districtRoutes, ...cityRoutes, ...serviceRoutes, ...(await fetchSalonRoutes())];
}
