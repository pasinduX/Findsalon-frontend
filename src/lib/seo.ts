import type { Metadata } from "next";

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.APP_BASE_URL ||
  "https://findsalon.lk"
).replace(/\/$/, "");

export const siteName = "FindSalonLK";

export const defaultDescription =
  "Book salon appointments online in Sri Lanka. Find salons, barbers, beauty services, bridal services, prices, availability, and reviews in one place.";

export const seoKeywords = [
  "FindSalon",
  "FindSalon Sri Lanka",
  "FindSalon.lk",
  "salon booking Sri Lanka",
  "find salons near me",
  "find barber near me",
  "beauty salon booking Sri Lanka",
  "salons in Colombo",
  "salons in Kandy",
  "barber appointment booking",
  "salon management software Sri Lanka",
  "online salon booking system",
  "salon website builder",
];

export const publicRoutes = [
  "/",
  "/salons",
  "/about",
  "/contact",
  "/pricing",
  "/privacy",
  "/terms",
];

export function absoluteUrl(path = "/") {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function createMetadata({
  title,
  description = defaultDescription,
  path = "/",
  keywords = [],
  image = "/opengraph-image",
  noIndex = false,
}: {
  title: string;
  description?: string;
  path?: string;
  keywords?: string[];
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    keywords: [...seoKeywords, ...keywords],
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: "website",
      siteName,
      title,
      description,
      url,
      images: [{ url: absoluteUrl(image), width: 1200, height: 630, alt: `${siteName} salon booking platform` }],
      locale: "en_LK",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(image)],
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: absoluteUrl("/favicon.ico"),
    areaServed: "Sri Lanka",
    description: defaultDescription,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/salons")}?area={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteName,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: siteUrl,
    areaServed: "Sri Lanka",
    description:
      "A web platform for salon discovery, online booking, salon websites, staff scheduling, services, galleries, and booking management.",
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
