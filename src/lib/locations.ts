export type SriLankaLocation = {
  name: string;
  slug: string;
  district?: string;
  description: string;
};

export const districts: SriLankaLocation[] = [
  {
    name: "Colombo",
    slug: "colombo",
    description:
      "Find salons, barbers, beauty services, and bridal appointments in Colombo with online booking options.",
  },
  {
    name: "Kandy",
    slug: "kandy",
    description:
      "Browse salons and barbers in Kandy for haircuts, grooming, beauty care, and appointment bookings.",
  },
  {
    name: "Galle",
    slug: "galle",
    description:
      "Compare salons in Galle by service, location, contact details, and available appointment times.",
  },
  {
    name: "Gampaha",
    slug: "gampaha",
    description:
      "Discover salon and barber booking options across Gampaha district, including nearby city pages.",
  },
  {
    name: "Jaffna",
    slug: "jaffna",
    description:
      "Search salon and barber appointment options in Jaffna from one public salon directory.",
  },
  {
    name: "Kurunegala",
    slug: "kurunegala",
    description:
      "Find salons in Kurunegala for everyday grooming, beauty appointments, and salon owner profiles.",
  },
];

export const cities: SriLankaLocation[] = [
  {
    name: "Colombo",
    slug: "colombo",
    district: "Colombo",
    description:
      "Book salon and barber appointments in Colombo and compare public salon profiles before visiting.",
  },
  {
    name: "Maharagama",
    slug: "maharagama",
    district: "Colombo",
    description:
      "Find Maharagama salons for haircuts, beauty services, grooming, and appointment booking.",
  },
  {
    name: "Nugegoda",
    slug: "nugegoda",
    district: "Colombo",
    description:
      "Browse Nugegoda salons and barbers by area, services, contact details, and availability.",
  },
  {
    name: "Kandy",
    slug: "kandy",
    district: "Kandy",
    description:
      "Search Kandy salons for hair, beauty, barber, and bridal appointment options.",
  },
  {
    name: "Galle",
    slug: "galle",
    district: "Galle",
    description:
      "Find Galle salons and book appointments online where the salon has published availability.",
  },
  {
    name: "Negombo",
    slug: "negombo",
    district: "Gampaha",
    description:
      "Discover salons and barbers in Negombo with public profiles, services, and appointment options.",
  },
  {
    name: "Jaffna",
    slug: "jaffna",
    district: "Jaffna",
    description:
      "Browse Jaffna salon and barber profiles for grooming and beauty appointments.",
  },
  {
    name: "Kurunegala",
    slug: "kurunegala",
    district: "Kurunegala",
    description:
      "Find Kurunegala salons, services, and booking options in one Sri Lankan salon directory.",
  },
];

export const serviceLandings = {
  "barber-shops": {
    label: "Barber Shops",
    service: "barber shops",
    titlePrefix: "Barber Shops in",
    descriptionPrefix: "Find barber shops in",
    searchLabel: "Barber appointments",
  },
  "beauty-salons": {
    label: "Beauty Salons",
    service: "beauty salons",
    titlePrefix: "Beauty Salons in",
    descriptionPrefix: "Find beauty salons in",
    searchLabel: "Beauty salon appointments",
  },
  "bridal-salons": {
    label: "Bridal Salons",
    service: "bridal salons",
    titlePrefix: "Bridal Salons in",
    descriptionPrefix: "Find bridal salons in",
    searchLabel: "Bridal salon appointments",
  },
} as const;

export type ServiceLandingKey = keyof typeof serviceLandings;

export function getDistrict(slug: string) {
  return districts.find((district) => district.slug === slug);
}

export function getCity(slug: string) {
  return cities.find((city) => city.slug === slug);
}
