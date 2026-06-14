import { notFound } from "next/navigation";
import type { Metadata } from "next";
import LocationLandingPage from "@/components/LocationLandingPage";
import { createMetadata } from "@/lib/seo";
import { cities, getCity } from "@/lib/locations";

export function generateStaticParams() {
  return cities.map((city) => ({ slug: city.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const city = getCity(slug);
  if (!city) return createMetadata({ title: "Salons in Sri Lanka", path: "/salons" });

  return createMetadata({
    title: `Salons in ${city.name} | FindSalonLK`,
    description: city.description,
    path: `/city/${city.slug}`,
    keywords: [`salons in ${city.name}`, `${city.name} salon booking`, `barbers in ${city.name}`],
  });
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = getCity(slug);
  if (!city) notFound();

  return <LocationLandingPage location={city} kind="city" />;
}
