import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Find Salons Near You in Sri Lanka | FindSalonLK",
  description:
    "Search salons, barbers, beauty salons, and bridal services in Sri Lanka by city or area, then book appointments from public salon pages.",
  path: "/salons",
  keywords: ["find salons near me", "salon directory Sri Lanka", "salon search Sri Lanka"],
});

export default function SalonsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
