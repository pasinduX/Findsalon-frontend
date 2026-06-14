import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/JsonLd";
import { Button } from "@/components/ui/button";
import { breadcrumbJsonLd, createMetadata, faqJsonLd, softwareApplicationJsonLd } from "@/lib/seo";

const faqs = [
  {
    question: "Is browsing salons on FindSalonLK free?",
    answer: "Yes. Public salon search and public salon profile browsing are available to customers from the web app.",
  },
  {
    question: "Where can salon owners see the current onboarding price?",
    answer: "Salon owner pricing is not published as a fixed public package in this app yet. Owners can create an account and use the available onboarding flow.",
  },
  {
    question: "What does a salon owner account manage?",
    answer: "A salon owner can manage salon details, barbers, services, galleries, working hours, and booking-related information from the dashboard.",
  },
];

export const metadata: Metadata = createMetadata({
  title: "FindSalonLK Pricing | Salon Owner Platform Sri Lanka",
  description:
    "Learn how public salon browsing works for customers and what salon owners can manage inside FindSalonLK.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd data={faqJsonLd(faqs)} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Pricing", path: "/pricing" }])} />
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-20">
        <div className="max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-5">FindSalonLK Pricing</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Customers can browse public salon profiles from the web app. Salon owner pricing is not published as a fixed package in this version, so this page stays clear instead of showing invented plans.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 mt-12">
          {faqs.map((item) => (
            <div key={item.question} className="rounded-lg border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold mb-2">{item.question}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/dashboard/create"><Button className="gradient-primary text-primary-foreground">Create salon profile</Button></Link>
          <Link href="/salons"><Button variant="outline">View public salons</Button></Link>
        </div>
      </main>
    </div>
  );
}
