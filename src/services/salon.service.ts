import { api } from "./api.service";
import type {
  Salon,
  Barber,
  SalonGallery,
  SalonService,
  SalonQuote,
  WorkingHour,
  BarberDto,
  CreateBarberPayload,
  CreateDistrictPayload,
  CreateGalleryPayload,
  CreateQuotePayload,
  CreateSalonPayload,
  CreateSalonServicePayload,
  CreateWorkingHoursPayload,
  DistrictDto,
  GalleryDto,
  QuoteDto,
  SalonDto,
  SalonServiceDto,
  UpdateBarberPayload,
  UpdateDistrictPayload,
  UpdateQuotePayload,
  UpdateSalonPayload,
  UpdateSalonServicePayload,
  UpdateWorkingHoursPayload,
  WorkingHoursDto,
  SpecialtyDto,
} from "@/interfaces";

const BASE_PATH = "/api/v1/salon";

function buildQuery(params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  return query.toString() ? `?${query.toString()}` : "";
}

// ── DTO → model normalizers ───────────────────────────────────────────────────

function normalizeSalon(dto: SalonDto): Salon {
  return {
    id: dto.SalonId,
    name: dto.Name,
    description: dto.Description || null,
    address: dto.Address,
    area: dto.Area,
    city: dto.City,
    phone: dto.Phone || null,
    location: dto.Location
      ? {
          latitude: dto.Location.Latitude,
          longitude: dto.Location.Longitude,
          address: dto.Location.Address,
        }
      : null,
    cover_image_url: dto.CoverImageUrl || null,
    logo_url: dto.LogoUrl || null,
    owner_id: dto.OwnerId,
    is_active: dto.IsActive,
    created_at: dto.CreatedAt,
    updated_at: dto.UpdatedAt,
  };
}

function normalizeBarber(dto: BarberDto): Barber {
  return {
    id: dto.BarberId,
    salon_id: dto.SalonId,
    user_id: dto.UserId || null,
    name: dto.Name,
    specialties: Array.isArray(dto.Specialties) ? dto.Specialties : [],
    bio: dto.Bio || null,
    image_url: dto.ImageUrl || null,
    service_ids: dto.ServiceIds || [],
    is_active: dto.IsActive,
    created_at: dto.CreatedAt,
  };
}

function normalizeGallery(dto: GalleryDto): SalonGallery {
  return {
    id: dto.GalleryId,
    salon_id: dto.SalonId,
    barber_id: dto.BarberId || null,
    image_url: dto.ImageUrl,
    caption: dto.Caption || null,
    sort_order: dto.SortOrder,
    created_at: dto.CreatedAt,
  };
}

function normalizeService(dto: SalonServiceDto): SalonService {
  return {
    id: dto.ServiceId,
    salon_id: dto.SalonId,
    name: dto.Name,
    description: dto.Description || null,
    price: dto.Price,
    duration: dto.DurationMin,
    sort_order: dto.SortOrder,
  };
}

function normalizeQuote(dto: QuoteDto): SalonQuote {
  return {
    id: dto.QuoteId,
    salon_id: dto.SalonId,
    text: dto.Text,
    author: dto.Author,
    role: dto.Role || null,
  };
}

function normalizeWorkingHours(dto: WorkingHoursDto): WorkingHour {
  return { id: dto.HoursId, day: dto.Day, hours: dto.Hours };
}

function unwrapList<T>(raw: any): T[] {
  return Array.isArray(raw) ? raw : (raw?.data ?? []);
}

// ── Service ───────────────────────────────────────────────────────────────────

export const salonService = {
  /**
   * Returns the first salon owned by the given user.
   * Pass the authenticated user's ID (Auth0 `sub` or backend UUID).
   * The backend must recognise the ID format; if using Auth0 tokens directly,
   * the backend should be configured to accept the Auth0 `sub` as OwnerId.
   */
  async getMySalon(ownerId: string) {
    if (typeof window === "undefined") {
      return { data: null as Salon | null, error: "Client only" };
    }
    if (!ownerId) {
      return { data: null as Salon | null, error: "No owner ID" };
    }

    const response = await api.get<any>(
      `${BASE_PATH}/FindallSalon${buildQuery({ OwnerId: ownerId })}`
    );
    if (!response.data || response.error) {
      return { data: null as Salon | null, error: response.error || "Unable to load salon" };
    }

    const dtos: SalonDto[] = unwrapList(response.data);
    return { data: dtos[0] ? normalizeSalon(dtos[0]) : null, error: null };
  },

  // ── UI-facing convenience methods (normalized) ────────────────────────────

  async getSalonById(salonId: string) {
    const response = await api.get<any>(
      `${BASE_PATH}/FindSalon?SalonId=${encodeURIComponent(salonId)}`
    );
    if (!response.data || response.error) {
      return { data: null as Salon | null, error: response.error };
    }
    const raw = response.data as any;
    const dto: SalonDto = raw?.data ?? raw;
    return { data: normalizeSalon(dto), error: null };
  },

  async getBarbers(salonId: string) {
    const response = await api.get<any>(
      `${BASE_PATH}/FindallBarber${buildQuery({ SalonId: salonId })}`
    );
    if (!response.data || response.error) return { data: [] as Barber[], error: response.error };
    const dtos: BarberDto[] = unwrapList(response.data);
    return { data: dtos.map(normalizeBarber), error: null };
  },

  async getGallery(salonId: string) {
    const response = await api.get<any>(
      `${BASE_PATH}/FindallGallery?SalonId=${encodeURIComponent(salonId)}`
    );
    if (!response.data || response.error) return { data: [] as SalonGallery[], error: response.error };
    const dtos: GalleryDto[] = unwrapList(response.data);
    return { data: dtos.map(normalizeGallery), error: null };
  },

  async getServices(salonId: string) {
    const response = await api.get<any>(
      `${BASE_PATH}/FindallSalonService${buildQuery({ SalonId: salonId })}`
    );
    if (!response.data || response.error) return { data: [] as SalonService[], error: response.error };
    const dtos: SalonServiceDto[] = unwrapList(response.data);
    return { data: dtos.map(normalizeService), error: null };
  },

  async getQuote(salonId: string) {
    const response = await api.get<any>(
      `${BASE_PATH}/FindallQuote${buildQuery({ SalonId: salonId })}`
    );
    if (!response.data || response.error) return { data: null as SalonQuote | null, error: response.error };
    const dtos: QuoteDto[] = unwrapList(response.data);
    return { data: dtos[0] ? normalizeQuote(dtos[0]) : null, error: null };
  },

  async getWorkingHours(salonId: string) {
    const response = await api.get<any>(
      `${BASE_PATH}/FindallWorkingHours${buildQuery({ SalonId: salonId })}`
    );
    if (!response.data || response.error) return { data: [] as WorkingHour[], error: response.error };
    const dtos: WorkingHoursDto[] = unwrapList(response.data);
    return { data: dtos.map(normalizeWorkingHours), error: null };
  },

  // ── Raw DTO methods (used internally / admin) ─────────────────────────────

  async createSalon(payload: CreateSalonPayload) {
    const body: Record<string, unknown> = { ...payload };
    // Backend expects PascalCase JSON. Map location to Location.
    if (payload.location) {
      body.Location = {
        Latitude: payload.location.latitude,
        Longitude: payload.location.longitude,
        Address: payload.location.address,
      };
      delete body.location;
    }
    return api.post<any>(`${BASE_PATH}/CreateSalon`, body);
  },

  async updateSalon(salonId: string, payload: UpdateSalonPayload) {
    return api.put<any>(
      `${BASE_PATH}/UpdateSalon?SalonId=${encodeURIComponent(salonId)}`,
      payload
    );
  },

  async deleteSalon(salonId: string) {
    return api.delete<any>(`${BASE_PATH}/DeleteSalon?SalonId=${encodeURIComponent(salonId)}`);
  },

  async findSalon(salonId: string) {
    return api.get<SalonDto>(`${BASE_PATH}/FindSalon?SalonId=${encodeURIComponent(salonId)}`);
  },

  async findAllSalon(filters: { City?: string; CityId?: string; Area?: string; IsActive?: boolean } = {}) {
    return api.get<SalonDto[]>(`${BASE_PATH}/FindallSalon${buildQuery(filters)}`);
  },

  async findAllDistricts() {
    return api.get<DistrictDto[]>(`${BASE_PATH}/FindallDistrict`);
  },

  async findAllSpecialties() {
    return api.get<SpecialtyDto[]>(`${BASE_PATH}/FindallSpecialty`);
  },

  async findDistrict(districtId: number) {
    return api.get<DistrictDto>(`${BASE_PATH}/FindDistrict${buildQuery({ DistrictId: districtId })}`);
  },

  async createDistrict(payload: CreateDistrictPayload) {
    return api.post<any>(`${BASE_PATH}/CreateDistrict`, payload);
  },

  async updateDistrict(districtId: number, payload: UpdateDistrictPayload) {
    return api.put<any>(
      `${BASE_PATH}/UpdateDistrict?DistrictId=${encodeURIComponent(districtId)}`,
      payload
    );
  },

  async deleteDistrict(districtId: number) {
    return api.delete<any>(`${BASE_PATH}/DeleteDistrict?DistrictId=${encodeURIComponent(districtId)}`);
  },

  async uploadSalon(formData: FormData) {
    return api.upload<any>(`${BASE_PATH}/UploadSalon`, formData);
  },

  async uploadImage(formData: FormData) {
    return api.upload<any>(`${BASE_PATH}/UploadImage`, formData);
  },

  async downloadSalon(salonId: string) {
    return api.get<string>(`${BASE_PATH}/DownloadSalon?SalonId=${encodeURIComponent(salonId)}`);
  },

  async createBarber(payload: CreateBarberPayload) {
    return api.post<any>(`${BASE_PATH}/CreateBarber`, payload);
  },

  async updateBarber(salonId: string, barberId: string, payload: UpdateBarberPayload) {
    return api.put<any>(
      `${BASE_PATH}/UpdateBarber?SalonId=${encodeURIComponent(salonId)}&BarberId=${encodeURIComponent(barberId)}`,
      payload
    );
  },

  async deleteBarber(salonId: string, barberId: string) {
    return api.delete<any>(
      `${BASE_PATH}/DeleteBarber?SalonId=${encodeURIComponent(salonId)}&BarberId=${encodeURIComponent(barberId)}`
    );
  },

  async findBarber(barberId: string) {
    return api.get<BarberDto>(`${BASE_PATH}/FindBarber?BarberId=${encodeURIComponent(barberId)}`);
  },

  async findAllBarber(salonId?: string) {
    return api.get<BarberDto[]>(`${BASE_PATH}/FindallBarber${buildQuery({ SalonId: salonId })}`);
  },

  async createSalonService(payload: CreateSalonServicePayload) {
    return api.post<any>(`${BASE_PATH}/CreateSalonService`, payload);
  },

  async updateSalonService(salonId: string, serviceId: string, payload: UpdateSalonServicePayload) {
    return api.put<any>(
      `${BASE_PATH}/UpdateSalonService?SalonId=${encodeURIComponent(salonId)}&ServiceId=${encodeURIComponent(serviceId)}`,
      payload
    );
  },

  async deleteSalonService(salonId: string, serviceId: string) {
    return api.delete<any>(
      `${BASE_PATH}/DeleteSalonService?SalonId=${encodeURIComponent(salonId)}&ServiceId=${encodeURIComponent(serviceId)}`
    );
  },

  async findSalonService(serviceId: string) {
    return api.get<SalonServiceDto>(`${BASE_PATH}/FindSalonService?ServiceId=${encodeURIComponent(serviceId)}`);
  },

  async findAllSalonService(salonId?: string) {
    return api.get<SalonServiceDto[]>(
      `${BASE_PATH}/FindallSalonService${buildQuery({ SalonId: salonId })}`
    );
  },

  async createWorkingHours(payload: CreateWorkingHoursPayload) {
    return api.post<any>(`${BASE_PATH}/CreateWorkingHours`, payload);
  },

  async updateWorkingHours(salonId: string, hoursId: string, payload: UpdateWorkingHoursPayload) {
    return api.put<any>(
      `${BASE_PATH}/UpdateWorkingHours?SalonId=${encodeURIComponent(salonId)}&HoursId=${encodeURIComponent(hoursId)}`,
      payload
    );
  },

  async deleteWorkingHours(salonId: string, hoursId: string) {
    return api.delete<any>(
      `${BASE_PATH}/DeleteWorkingHours?SalonId=${encodeURIComponent(salonId)}&HoursId=${encodeURIComponent(hoursId)}`
    );
  },

  async findAllWorkingHours(salonId?: string) {
    return api.get<WorkingHoursDto[]>(
      `${BASE_PATH}/FindallWorkingHours${buildQuery({ SalonId: salonId })}`
    );
  },

  async createGallery(payload: CreateGalleryPayload) {
    return api.post<any>(`${BASE_PATH}/CreateGallery`, payload);
  },

  async deleteGallery(salonId: string, galleryId: string, barberId?: string) {
    let url = `${BASE_PATH}/DeleteGallery?GalleryId=${encodeURIComponent(galleryId)}`;
    if (barberId) url += `&BarberId=${encodeURIComponent(barberId)}`;
    else url += `&SalonId=${encodeURIComponent(salonId)}`;
    return api.delete<any>(url);
  },

  async findAllGallery(salonId: string) {
    return api.get<GalleryDto[]>(`${BASE_PATH}/FindallGallery?SalonId=${encodeURIComponent(salonId)}`);
  },

  async createQuote(payload: CreateQuotePayload) {
    return api.post<any>(`${BASE_PATH}/CreateQuote`, payload);
  },

  async updateQuote(salonId: string, quoteId: string, payload: UpdateQuotePayload) {
    return api.put<any>(
      `${BASE_PATH}/UpdateQuote?SalonId=${encodeURIComponent(salonId)}&QuoteId=${encodeURIComponent(quoteId)}`,
      payload
    );
  },

  async deleteQuote(salonId: string, quoteId: string) {
    return api.delete<any>(
      `${BASE_PATH}/DeleteQuote?SalonId=${encodeURIComponent(salonId)}&QuoteId=${encodeURIComponent(quoteId)}`
    );
  },

  async findAllQuote(salonId?: string) {
    return api.get<QuoteDto[]>(`${BASE_PATH}/FindallQuote${buildQuery({ SalonId: salonId })}`);
  },
};
