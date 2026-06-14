import { notFound } from "next/navigation";
import type { Metadata } from "next";
import LocationLandingPage from "@/components/LocationLandingPage";
import { createMetadata } from "@/lib/seo";
import { districts, getDistrict } from "@/lib/locations";

export function generateStaticParams() {
  return districts.map((district) => ({ slug: district.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const district = getDistrict(slug);
  if (!district) return createMetadata({ title: "Salons in Sri Lanka", path: "/salons" });

  return createMetadata({
    title: `Salons in ${district.name} | FindSalonLK`,
    description: district.description,
    path: `/district/${district.slug}`,
    keywords: [`salons in ${district.name}`, `${district.name} salon booking`, `barbers in ${district.name}`],
  });
}

export default async function DistrictPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const district = getDistrict(slug);
  if (!district) notFound();

  return <LocationLandingPage location={district} kind="district" />;
}
