// ─── Location ────────────────────────────────────────────────────────────────
export interface SalonLocation {
  latitude: number;
  longitude: number;
  address: string; // human-readable label from reverse-geocode or manual input
}

// ─── Salon ────────────────────────────────────────────────────────────────────
export interface Salon {
  id: string;
  name: string;
  description: string | null;
  address: string;
  area: string;
  city: string;
  phone: string | null;
  location: SalonLocation | null;
  cover_image_url: string | null;
  logo_url: string | null;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSalonPayload {
  OwnerId: string;
  name: string;
  description?: string | null;
  address: string;
  area: string;
  districtId: string;
  districtName: string;
  city: string;
  cityId: string;
  phone?: string | null;
  location?: SalonLocation | null;
}

export interface UpdateSalonPayload {
  name?: string;
  description?: string | null;
  address?: string;
  area?: string;
  districtId?: string;
  districtName?: string;
  city?: string;
  cityId?: string;
  phone?: string | null;
  cover_image_url?: string | null;
  location?: SalonLocation | null;
}

export interface SalonDto {
  SalonId: string;
  OwnerId: string;
  Name: string;
  Description: string;
  Address: string;
  Area: string;
  DistrictId: string;
  DistrictName: string;
  City: string;
  CityId: string;
  Phone: string;
  Location: { Latitude: number; Longitude: number; Address: string } | null;
  CoverImageUrl: string;
  LogoUrl: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  Deleted: boolean;
}

export interface CreateSalonRequest {
  OwnerId: string;
  Name: string;
  Description?: string;
  Address: string;
  Area: string;
  DistrictId: string;
  DistrictName: string;
  City: string;
  CityId: string;
  Phone?: string;
  Location?: { Latitude: number; Longitude: number; Address: string };
}

export interface UpdateSalonRequest {
  Name?: string;
  Description?: string;
  Address?: string;
  Area?: string;
  DistrictId?: string;
  DistrictName?: string;
  City?: string;
  CityId?: string;
  Phone?: string;
  CoverImageUrl?: string;
  LogoUrl?: string;
  IsActive?: boolean;
  Location?: { Latitude: number; Longitude: number; Address: string };
}

// ─── Barber ───────────────────────────────────────────────────────────────────
export interface Barber {
  id: string;
  salon_id: string;
  user_id: string | null;
  name: string;
  specialties: string[];
  bio: string | null;
  image_url: string | null;
  service_ids: string[];
  is_active: boolean;
  created_at: string;
}

export interface CreateBarberPayload {
  SalonId: string;
  Name: string;
  UserId?: string;
  Email?: string;
  Specialties?: string[];
}

export interface BarberDto {
  BarberId: string;
  SalonId: string;
  UserId: string;
  Name: string;
  Specialties: string[];
  Bio: string;
  ImageUrl: string;
  ServiceIds: string[];
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  Deleted: boolean;
}

export interface UpdateBarberPayload {
  Name?: string;
  Specialties?: string[];
  Bio?: string;
  ImageUrl?: string;
  ServiceIds?: string[];
  IsActive?: boolean;
}

export interface SpecialtyDto {
  id: number;
  name: string;
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
export interface SalonGallery {
  id: string;
  salon_id: string;
  barber_id?: string | null;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface CreateGalleryPayload {
  SalonId: string;
  BarberId?: string;
  ImageUrl: string;
  Caption?: string;
}

export interface GalleryDto {
  GalleryId: string;
  SalonId: string;
  BarberId?: string;
  ImageUrl: string;
  Caption: string;
  SortOrder: number;
  CreatedAt: string;
  Deleted: boolean;
}

export interface UpdateGalleryPayload {
  ImageUrl?: string;
  Caption?: string;
  SortOrder?: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────
export interface SalonService {
  id: string;
  salon_id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  sort_order: number;
}

export interface SalonServiceDto {
  ServiceId: string;
  SalonId: string;
  Name: string;
  Description: string;
  Price: number;
  DurationMin: number;
  SortOrder: number;
  CreatedAt: string;
  UpdatedAt: string;
  Deleted: boolean;
}

export interface CreateSalonServicePayload {
  SalonId: string;
  Name: string;
  Description?: string;
  Price?: number;
  DurationMin?: number;
}

export interface UpdateSalonServicePayload {
  Name?: string;
  Description?: string;
  Price?: number;
  DurationMin?: number;
}

// ─── Quote ────────────────────────────────────────────────────────────────────
export interface SalonQuote {
  id: string;
  salon_id: string;
  text: string;
  author: string;
  role: string | null;
}

export interface QuoteDto {
  QuoteId: string;
  SalonId: string;
  Text: string;
  Author: string;
  Role: string;
  CreatedAt: string;
  UpdatedAt: string;
  Deleted: boolean;
}

export interface CreateQuotePayload {
  SalonId: string;
  Text: string;
  Author?: string;
  Role?: string;
}

export interface UpdateQuotePayload {
  Text?: string;
  Author?: string;
  Role?: string;
}

// ─── Working Hours ────────────────────────────────────────────────────────────
export interface WorkingHour {
  id?: string;
  day: string;
  hours: string;
}

export interface WorkingHoursDto {
  HoursId: string;
  SalonId: string;
  Day: string;
  Hours: string;
  SortOrder: number;
  CreatedAt: string;
  UpdatedAt: string;
  Deleted: boolean;
}

export interface CreateWorkingHoursPayload {
  SalonId: string;
  Day: string;
  Hours: string;
}

export interface UpdateWorkingHoursPayload {
  Day?: string;
  Hours?: string;
  SortOrder?: number;
}

// ─── Districts & Cities ─────────────────────────────────────────────────────
export interface CityDto {
  id: number;
  name: string;
}

export interface DistrictDto {
  id: number;
  name: string;
  cities: CityDto[];
}

export interface CreateDistrictPayload {
  Name: string;
  Cities?: string[];
}

export interface UpdateDistrictPayload {
  Name?: string;
  Cities?: string[];
}
