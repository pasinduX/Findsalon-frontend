import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/JsonLd";
import { Button } from "@/components/ui/button";
import { breadcrumbJsonLd, createMetadata, organizationJsonLd } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "About FindSalonLK | Salon Booking in Sri Lanka",
  description:
    "FindSalonLK helps customers discover Sri Lankan salons and helps salon owners publish services, staff, galleries, and appointment availability.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-20">
        <div className="max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-5">About FindSalonLK</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            FindSalonLK is a Sri Lankan salon discovery and booking platform. Customers can search by area, open salon profiles, review services and staff, and book appointments where online availability is published.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 mt-12">
          {[
            ["For customers", "Search nearby salons, compare service details, and book from public salon pages."],
            ["For salon owners", "Create a salon profile, manage barbers, services, gallery images, and appointment schedules."],
            ["For local discovery", "Use city, district, and service pages to connect Sri Lankan searches with real salon profiles."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-lg border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold mb-2">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/salons"><Button className="gradient-primary text-primary-foreground">Find salons</Button></Link>
          <Link href="/dashboard/create"><Button variant="outline">Add a salon</Button></Link>
        </div>
      </main>
    </div>
  );
}
