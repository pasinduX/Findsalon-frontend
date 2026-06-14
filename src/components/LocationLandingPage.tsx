import Link from "next/link";
import { MapPin, Search, Scissors, Store } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { cities, districts, serviceLandings, type ServiceLandingKey, type SriLankaLocation } from "@/lib/locations";

type Props = {
  location: SriLankaLocation;
  kind: "district" | "city" | "service";
  serviceKey?: ServiceLandingKey;
};

export default function LocationLandingPage({ location, kind, serviceKey }: Props) {
  const service = serviceKey ? serviceLandings[serviceKey] : null;
  const heading = service ? `${service.titlePrefix} ${location.name}` : `Salons in ${location.name}`;
  const description = service
    ? `${service.descriptionPrefix} ${location.name}. Compare public salon profiles, services, contact details, and booking availability on FindSalonLK.`
    : location.description;
  const searchHref = `/salons?area=${encodeURIComponent(location.name)}`;
  const relatedCities = (kind === "district"
    ? cities.filter((city) => city.district === location.name)
    : cities.filter((city) => city.slug !== location.slug)
  ).slice(0, 6);
  const faqItems = [
    {
      question: `How do I find salons in ${location.name}?`,
      answer: `Use FindSalonLK to browse public salon profiles in ${location.name}, then open a salon page to review services, staff, contact details, and available booking times.`,
    },
    {
      question: `Can I book a salon appointment in ${location.name} online?`,
      answer: `Yes, when a listed salon has published services and availability, you can select a service, barber, date, and time from the salon page.`,
    },
    {
      question: `Does FindSalonLK list only one type of salon in ${location.name}?`,
      answer: `No. FindSalonLK supports barber shops, beauty salons, bridal salons, and general grooming businesses where owners create public salon profiles.`,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: heading, path: serviceKey ? `/${serviceKey}/${location.slug}` : `/${kind}/${location.slug}` }])} />
      <JsonLd data={faqJsonLd(faqItems)} />
      <Navbar />
      <main className="pt-24 pb-20">
        <section className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-sm text-primary font-medium mb-4">
              <MapPin className="h-4 w-4" />
              Sri Lanka salon booking
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-5">{heading}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-7">{description}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={searchHref}>
                <Button size="lg" className="gradient-primary text-primary-foreground rounded-xl">
                  <Search className="h-5 w-5 mr-2" />
                  Browse salons
                </Button>
              </Link>
              <Link href="/dashboard/create">
                <Button size="lg" variant="outline" className="rounded-xl">
                  <Store className="h-5 w-5 mr-2" />
                  Add your salon
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 mt-16 grid md:grid-cols-3 gap-5">
          {[
            ["Search by area", `Start with ${location.name} and nearby towns instead of scrolling through unrelated salons.`],
            ["Compare services", "Open salon pages to review listed services, staff, gallery images, and appointment options."],
            ["Book directly", "Choose a service, available barber, date, and time when online booking is enabled."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-lg border border-border bg-card p-6">
              <Scissors className="h-6 w-6 text-primary mb-4" />
              <h2 className="font-display text-xl font-semibold mb-2">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </section>

        <section className="container mx-auto px-4 mt-16">
          <h2 className="font-display text-3xl font-bold mb-5">Popular salon searches</h2>
          <div className="flex flex-wrap gap-2">
            {(service ? [serviceKey!] : (Object.keys(serviceLandings) as ServiceLandingKey[])).map((key) => (
              <Link key={key} href={`/${key}/${location.slug}`} className="rounded-full bg-secondary px-4 py-2 text-sm hover:bg-secondary/80">
                {serviceLandings[key].label} in {location.name}
              </Link>
            ))}
            {districts.slice(0, 4).map((district) => (
              <Link key={district.slug} href={`/district/${district.slug}`} className="rounded-full bg-secondary px-4 py-2 text-sm hover:bg-secondary/80">
                Salons in {district.name}
              </Link>
            ))}
          </div>
        </section>

        {relatedCities.length > 0 && (
          <section className="container mx-auto px-4 mt-16">
            <h2 className="font-display text-3xl font-bold mb-5">Nearby city pages</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {relatedCities.map((city) => (
                <Link key={city.slug} href={`/city/${city.slug}`} className="rounded-lg border border-border p-4 hover:bg-secondary/60">
                  <span className="font-medium">{city.name}</span>
                  <span className="block text-sm text-muted-foreground">{city.district}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="container mx-auto px-4 mt-16">
          <h2 className="font-display text-3xl font-bold mb-5">Questions people ask</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {faqItems.map((item) => (
              <div key={item.question} className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-semibold mb-2">{item.question}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
