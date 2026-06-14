import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import type { SalonDto } from "@/interfaces";

async function getSalon(id: string): Promise<SalonDto | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBase || !id) return null;

  try {
    const response = await fetch(`${apiBase.replace(/\/$/, "")}/api/v1/salon/FindSalon?SalonId=${encodeURIComponent(id)}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;

    const json = await response.json().catch(() => null);
    return json?.data?.data ?? json?.data ?? json ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const salon = await getSalon(id);
  const title = salon?.Name ? `${salon.Name} | Book Salon in ${salon.City || salon.Area} | FindSalonLK` : "Salon Profile | FindSalonLK";
  const description =
    salon?.Description ||
    (salon?.Name
      ? `View ${salon.Name} services, staff, contact details, and appointment availability on FindSalonLK.`
      : "View salon services, staff, contact details, and appointment availability on FindSalonLK.");

  return createMetadata({
    title,
    description,
    path: `/salon/${id}`,
    image: salon?.CoverImageUrl || "/opengraph-image",
    keywords: salon?.Name ? [salon.Name, `salons in ${salon.City}`, `salons in ${salon.Area}`] : [],
  });
}

export default function SalonLayout({ children }: { children: React.ReactNode }) {
  return children;
}
