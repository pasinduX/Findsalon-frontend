// Demo/mock data for previewing salon pages without real DB records

export const DEMO_SALON_ID = "demo-salon-001";

export const demoSalon = {
  id: DEMO_SALON_ID,
  name: "The Golden Scissors",
  address: "42 Galle Road",
  area: "Colombo 03",
  city: "Colombo",
  phone: "+94 77 123 4567",
  location: null,
  description:
    "Experience premium grooming at The Golden Scissors. Our skilled barbers combine traditional techniques with modern styles to give you the perfect look. We offer classic cuts, modern fades, beard grooming, hot towel shaves, and hair treatments in a relaxed, stylish atmosphere.",
  cover_image_url:
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1400&q=80",
  logo_url: null,
  owner_id: "",
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const demoBarbers = [
  {
    id: "demo-barber-1",
    name: "Kamal Perera",
    user_id: null,
    email: null,
    specialties: ["Fades & Skin Fades"],
    bio: "Master barber with 10 years experience specializing in modern fades.",
    image_url: null,
    salon_id: DEMO_SALON_ID,
    service_ids: [],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-barber-2",
    name: "Nuwan Silva",
    user_id: null,
    email: null,
    specialties: ["Beard Styling"],
    bio: "8 years of experience in beard grooming and traditional cuts.",
    image_url: null,
    salon_id: DEMO_SALON_ID,
    service_ids: [],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-barber-3",
    name: "Ashan Fernando",
    user_id: null,
    email: null,
    specialties: ["Classic Cuts"],
    bio: "Specializes in classic gentlemen cuts and hot towel shaves.",
    image_url: null,
    salon_id: DEMO_SALON_ID,
    service_ids: [],
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export const demoGallery = [
  {
    id: "demo-gallery-1",
    salon_id: DEMO_SALON_ID,
    image_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80",
    caption: "Classic haircut",
    sort_order: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-gallery-2",
    salon_id: DEMO_SALON_ID,
    image_url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&q=80",
    caption: "Beard grooming",
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-gallery-3",
    salon_id: DEMO_SALON_ID,
    image_url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&q=80",
    caption: "Modern fade",
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-gallery-4",
    salon_id: DEMO_SALON_ID,
    image_url: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&q=80",
    caption: "Our workspace",
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
];

// Generate time slots for the next 3 days
function generateDemoSlots() {
  const slots: Array<{
    id: string;
    barber_id: string;
    salon_id: string;
    date: string;
    start_time: string;
    end_time: string;
    is_booked: boolean;
    created_at: string;
  }> = [];

  const times = [
    ["09:00", "09:30"],
    ["09:30", "10:00"],
    ["10:00", "10:30"],
    ["10:30", "11:00"],
    ["11:00", "11:30"],
    ["14:00", "14:30"],
    ["14:30", "15:00"],
    ["15:00", "15:30"],
  ];

  let counter = 0;
  for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    const dateStr = date.toISOString().split("T")[0];

    for (const barber of demoBarbers) {
      // Each barber gets a random subset of times
      const barberTimes = times.filter(() => Math.random() > 0.3);
      for (const [start, end] of barberTimes) {
        counter++;
        slots.push({
          id: `demo-slot-${counter}`,
          barber_id: barber.id,
          salon_id: DEMO_SALON_ID,
          date: dateStr,
          start_time: start,
          end_time: end,
          is_booked: false,
          created_at: new Date().toISOString(),
        });
      }
    }
  }
  return slots;
}

export const demoTimeSlots = generateDemoSlots();

export const demoServices = [
  {
    id: "demo-service-1",
    name: "Classic Haircut",
    description: "Traditional scissor cut with hot towel finish",
    price: 800,
    duration: 30,
    icon: "scissors",
  },
  {
    id: "demo-service-2",
    name: "Skin Fade",
    description: "Modern skin fade with precision detailing",
    price: 1200,
    duration: 45,
    icon: "scissors",
  },
  {
    id: "demo-service-3",
    name: "Beard Trim & Shape",
    description: "Expert beard grooming with hot towel treatment",
    price: 600,
    duration: 20,
    icon: "scissors",
  },
  {
    id: "demo-service-4",
    name: "Hot Towel Shave",
    description: "Luxurious straight razor shave with essential oils",
    price: 1000,
    duration: 30,
    icon: "scissors",
  },
  {
    id: "demo-service-5",
    name: "Hair & Beard Combo",
    description: "Full haircut plus beard styling package",
    price: 1500,
    duration: 60,
    icon: "scissors",
  },
  {
    id: "demo-service-6",
    name: "Hair Treatment",
    description: "Deep conditioning keratin treatment for healthy hair",
    price: 2000,
    duration: 45,
    icon: "scissors",
  },
];

export const demoQuote = {
  text: "We don't just cut hair — we craft confidence. Every client leaves our chair looking and feeling like the best version of themselves.",
  author: "Kamal Perera",
  role: "Head Barber & Founder",
};

export const demoWorkingHours = [
  { day: "Monday", hours: "9:00 AM – 7:00 PM" },
  { day: "Tuesday", hours: "9:00 AM – 7:00 PM" },
  { day: "Wednesday", hours: "9:00 AM – 7:00 PM" },
  { day: "Thursday", hours: "9:00 AM – 8:00 PM" },
  { day: "Friday", hours: "9:00 AM – 8:00 PM" },
  { day: "Saturday", hours: "8:00 AM – 6:00 PM" },
  { day: "Sunday", hours: "Closed" },
];
