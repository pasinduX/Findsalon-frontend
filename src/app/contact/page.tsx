import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/JsonLd";
import { Button } from "@/components/ui/button";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Contact FindSalonLK | Sri Lanka Salon Booking Support",
  description:
    "Contact FindSalonLK for salon owner onboarding, customer booking questions, public listing updates, and platform support.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-20">
        <div className="max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-5">Contact FindSalonLK</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Need help with a salon profile, a booking, or owner onboarding? Use the app sign-in flow for account actions, or start by browsing public salon pages.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 mt-12">
          {[
            ["Customers", "Open the salon page connected to your appointment and use the salon contact details shown there."],
            ["Salon owners", "Create or manage your salon profile from the dashboard after signing in."],
            ["Listing updates", "Update services, gallery images, staff, and public salon details from the salon dashboard."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-lg border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold mb-2">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/salons"><Button className="gradient-primary text-primary-foreground">Browse salons</Button></Link>
          <Link href="/auth/login"><Button variant="outline">Sign in</Button></Link>
        </div>
      </main>
    </div>
  );
}
