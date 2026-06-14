import { notFound } from "next/navigation";
import type { Metadata } from "next";
import LocationLandingPage from "@/components/LocationLandingPage";
import { createMetadata } from "@/lib/seo";
import { cities, getCity, serviceLandings } from "@/lib/locations";

const serviceKey = "barber-shops";

export function generateStaticParams() {
  return cities.map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCity(citySlug);
  if (!city) return createMetadata({ title: "Barber Shops in Sri Lanka", path: "/salons" });
  const service = serviceLandings[serviceKey];

  return createMetadata({
    title: `${service.titlePrefix} ${city.name} | FindSalonLK`,
    description: `${service.descriptionPrefix} ${city.name}. Compare public salon profiles, services, contact details, and booking availability.`,
    path: `/${serviceKey}/${city.slug}`,
    keywords: [`barber shops in ${city.name}`, `barbers in ${city.name}`, `${city.name} barber appointment`],
  });
}

export default async function BarberShopsCityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: citySlug } = await params;
  const city = getCity(citySlug);
  if (!city) notFound();

  return <LocationLandingPage location={city} kind="service" serviceKey={serviceKey} />;
}
