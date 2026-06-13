import { api } from "./api.service";
import type { TimeSlot, TimeSlotDto, BarberDto, SalonGallery, GalleryDto } from "@/interfaces";

function unwrapList<T>(raw: any): T[] {
  return Array.isArray(raw) ? raw : (raw?.data ?? []);
}

function normalizeSlot(dto: TimeSlotDto): TimeSlot {
  return {
    id: dto.SlotId,
    barber_id: dto.BarberId,
    salon_id: dto.SalonId,
    date: dto.Date,
    start_time: dto.StartTime,
    end_time: dto.EndTime,
    status: dto.Status ?? (dto.IsBooked ? "booked" : "available"),
    is_booked: dto.IsBooked,
    block_id: dto.BlockId || undefined,
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

export const barberService = {
  async getMyBarberProfile() {
    return api.get<BarberDto & { salons?: { name: string } }>("/api/v1/salon/FindBarberByUser");
  },

  async getMySlots(barberId: string) {
    const response = await api.get<any>(
      `/api/v1/booking/FindallTimeSlot?BarberId=${encodeURIComponent(barberId)}`
    );
    if (!response.data || response.error) return { data: [] as TimeSlot[], error: response.error };
    const dtos: TimeSlotDto[] = unwrapList(response.data);
    return { data: dtos.map(normalizeSlot), error: null };
  },

  async getAvailableSlots(barberId: string, _salonId?: string) {
    const response = await api.get<any>(
      `/api/v1/booking/FindallTimeSlot?BarberId=${encodeURIComponent(barberId)}&IsBooked=false`
    );
    if (!response.data || response.error) return { data: [] as TimeSlot[], error: response.error };
    const dtos: TimeSlotDto[] = unwrapList(response.data);
    return { data: dtos.map(normalizeSlot), error: null };
  },

  async getSlotsBySalon(salonId: string) {
    const response = await api.get<any>(
      `/api/v1/booking/FindallTimeSlot?SalonId=${encodeURIComponent(salonId)}`
    );
    if (!response.data || response.error) return { data: [] as TimeSlot[], error: response.error };
    const dtos: TimeSlotDto[] = unwrapList(response.data);
    return { data: dtos.map(normalizeSlot), error: null };
  },

  async getMyGallery(barberId: string) {
    const response = await api.get<any>(
      `/api/v1/salon/FindallGallery?BarberId=${encodeURIComponent(barberId)}`
    );
    if (!response.data || response.error) return { data: [] as SalonGallery[], error: response.error };
    const dtos: GalleryDto[] = unwrapList(response.data);
    return { data: dtos.map(normalizeGallery), error: null };
  },
};
