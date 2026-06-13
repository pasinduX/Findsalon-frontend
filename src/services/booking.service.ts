import { api } from "./api.service";
import type {
  Booking,
  BookingDto,
  BookingSearchParams,
  BulkCreateTimeSlotPayload,
  CreateBookingPayload,
  CreateWalkInBookingPayload,
  CreateTimeSlotPayload,
  PaginatedBookingResponse,
  PaginatedTimeSlotResponse,
  TimeSlotDto,
  TimeSlotSearchParams,
  UpdateBookingPayload,
  UpdateTimeSlotPayload,
  WeeklySchedule,
  ScheduleBlock,
  AvailableSlot,
  DirectBookingPayload,
  CreateWeeklySchedulePayload,
  CreateScheduleBlockPayload,
  UpdateScheduleBlockPayload,
} from "@/interfaces";

const BASE_PATH = "/api/v1/booking";

function buildQuery(params: Record<string, unknown>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  return query.toString() ? `?${query.toString()}` : "";
}

function normalizeBooking(dto: BookingDto): Booking {
  return {
    id: dto.BookingId,
    user_id: dto.UserId || null,
    salon_id: dto.SalonId,
    barber_id: dto.BarberId,
    time_slot_id: dto.SlotId,
    notes: dto.Notes || null,
    status: dto.Status as Booking["status"],
    booking_type: dto.BookingType as Booking["booking_type"],
    customer_name: dto.CustomerName || null,
    created_at: dto.CreatedAt,
  };
}

export const bookingService = {
  async createTimeSlot(payload: CreateTimeSlotPayload) {
    return api.post<any>(`${BASE_PATH}/CreateTimeSlot`, payload);
  },

  async bulkCreateTimeSlot(payload: BulkCreateTimeSlotPayload) {
    return api.post<any>(`${BASE_PATH}/BulkCreateTimeSlot`, payload);
  },

  async updateTimeSlot(slotId: string, payload: UpdateTimeSlotPayload) {
    return api.put<any>(`${BASE_PATH}/UpdateTimeSlot?SlotId=${encodeURIComponent(slotId)}`, payload);
  },

  async deleteTimeSlot(slotId: string) {
    return api.delete<any>(`${BASE_PATH}/DeleteTimeSlot?SlotId=${encodeURIComponent(slotId)}`);
  },

  async findTimeSlot(slotId: string) {
    return api.get<TimeSlotDto>(
      `${BASE_PATH}/FindTimeSlot?SlotId=${encodeURIComponent(slotId)}`
    );
  },

  async findAllTimeSlot(filters: TimeSlotSearchParams = {}) {
    return api.get<PaginatedTimeSlotResponse>(
      `${BASE_PATH}/FindallTimeSlot${buildQuery(filters as Record<string, unknown>)}`
    );
  },

  async createBooking(payload: CreateBookingPayload) {
    return api.post<any>(`${BASE_PATH}/CreateBooking`, payload);
  },

  async createWalkInBooking(payload: CreateWalkInBookingPayload) {
    return api.post<any>(`${BASE_PATH}/CreateWalkInBooking`, payload);
  },

  async updateBooking(bookingId: string, payload: UpdateBookingPayload) {
    return api.put<any>(`${BASE_PATH}/UpdateBooking?BookingId=${encodeURIComponent(bookingId)}`, payload);
  },

  async deleteBooking(bookingId: string) {
    return api.delete<any>(`${BASE_PATH}/DeleteBooking?BookingId=${encodeURIComponent(bookingId)}`);
  },

  async findBooking(bookingId: string) {
    return api.get<BookingDto>(
      `${BASE_PATH}/FindBooking?BookingId=${encodeURIComponent(bookingId)}`
    );
  },

  async findAllBooking(filters: BookingSearchParams = {}) {
    return api.get<PaginatedBookingResponse>(
      `${BASE_PATH}/FindallBooking${buildQuery(filters as Record<string, unknown>)}`
    );
  },

  async downloadBooking(filters: BookingSearchParams = {}) {
    return api.get<string>(`${BASE_PATH}/DownloadBooking${buildQuery(filters as Record<string, unknown>)}`);
  },

  // ── Weekly Schedule ──────────────────────────────────────────────────────
  async createWeeklySchedule(payload: CreateWeeklySchedulePayload) {
    return api.post<{ Schedule: WeeklySchedule; SlotsGenerated: number }>(
      `${BASE_PATH}/CreateWeeklySchedule`,
      payload
    );
  },

  async getWeeklySchedule(barberId: string) {
    return api.get<WeeklySchedule>(
      `${BASE_PATH}/GetWeeklySchedule?BarberId=${encodeURIComponent(barberId)}`
    );
  },

  // ── Schedule Blocks ──────────────────────────────────────────────────────
  async createScheduleBlock(payload: CreateScheduleBlockPayload) {
    return api.post<ScheduleBlock>(`${BASE_PATH}/CreateScheduleBlock`, payload);
  },

  async updateScheduleBlock(blockId: string, payload: UpdateScheduleBlockPayload) {
    return api.put<ScheduleBlock>(
      `${BASE_PATH}/UpdateScheduleBlock?BlockId=${encodeURIComponent(blockId)}`,
      payload
    );
  },

  async deleteScheduleBlock(blockId: string) {
    return api.delete<any>(
      `${BASE_PATH}/DeleteScheduleBlock?BlockId=${encodeURIComponent(blockId)}`
    );
  },

  async findAllScheduleBlocks(barberId: string, date?: string) {
    const q = buildQuery({ BarberId: barberId, Date: date } as Record<string, unknown>);
    return api.get<ScheduleBlock[]>(`${BASE_PATH}/FindallScheduleBlock${q}`);
  },

  // ── Real-time Availability Engine ────────────────────────────────────────

  /** GET /Availability — returns open time slots for a barber + service + date */
  async getAvailability(barberId: string, serviceId: string, date: string) {
    const q = buildQuery({ BarberId: barberId, ServiceId: serviceId, Date: date });
    return api.get<AvailableSlot[]>(`${BASE_PATH}/Availability${q}`);
  },

  /** POST /DirectBooking — books a slot returned by getAvailability */
  async directBooking(payload: DirectBookingPayload) {
    return api.post<BookingDto>(`${BASE_PATH}/DirectBooking`, payload);
  },

  // ── My Bookings (customer-facing) ────────────────────────────────────────

  /** Returns all bookings for the currently logged-in user (JWT userId used server-side). */
  async getMyBookings(): Promise<{ data: Booking[] | null; error: string | null }> {
    const res = await api.get<{ Data: BookingDto[] }>(`${BASE_PATH}/FindallBookingByUser`);
    if (res.error || !res.data) return { data: null, error: res.error };
    const bookings = (res.data.Data ?? []).map(normalizeBooking);
    return { data: bookings, error: null };
  },

  /** Cancel a booking by setting Status → "cancelled". */
  async cancelBooking(bookingId: string): Promise<{ error: string | null }> {
    const res = await api.put<any>(
      `${BASE_PATH}/UpdateBooking?BookingId=${encodeURIComponent(bookingId)}`,
      { Status: "cancelled" }
    );
    return { error: res.error };
  },

  /**
   * Returns booking IDs that the current user has already reviewed.
   * Reviews are stored in the Booking MS review collection; we fetch all
   * reviews by this user and return their BookingIds.
   */
  async getReviewedBookingIds(): Promise<{ data: string[] | null; error: string | null }> {
    const res = await api.get<{ Data: { BookingId: string }[] }>(`${BASE_PATH}/FindallReview`);
    if (res.error || !res.data) return { data: [], error: null };
    const ids = (res.data.Data ?? []).map((r) => r.BookingId).filter(Boolean);
    return { data: ids, error: null };
  },
};
