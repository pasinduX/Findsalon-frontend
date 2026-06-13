export interface TimeSlot {
  id: string;
  barber_id: string;
  salon_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: SlotStatus;
  is_booked: boolean;
  block_id?: string;
  created_at: string;
}

export type SlotStatus = "available" | "booked" | "blocked";
export type BlockType = "lunch" | "break" | "critical";

export interface WorkDay {
  Day: string;        // "Monday", etc.
  StartTime: string;  // "09:00"
  EndTime: string;    // "17:00"
  IsWorkDay: boolean;
}

export interface WeeklySchedule {
  ScheduleId: string;
  BarberId: string;
  SalonId: string;
  /** Grid step in minutes (new field). Falls back to SlotDuration for old documents. */
  SlotStep?: number;
  SlotDuration: number; // legacy
  /** IANA timezone, e.g. "Asia/Colombo" */
  Timezone?: string;
  WorkDays: WorkDay[];
  CreatedAt: string;
  UpdatedAt: string;
}

export interface ScheduleBlock {
  BlockId: string;
  BarberId: string;
  SalonId: string;
  /** UTC ISO-8601 timestamp */
  StartTime: string;
  /** UTC ISO-8601 timestamp */
  EndTime: string;
  BlockType: BlockType;
  Note: string;
  CreatedAt: string;
  UpdatedAt: string;
}

/** AvailableSlot returned by GET /Availability */
export interface AvailableSlot {
  StartTime: string;    // UTC RFC3339
  EndTime: string;      // UTC RFC3339
  DisplayStart: string; // pre-formatted in salon timezone, e.g. "09:30"
  DisplayEnd: string;
}

/** Request body for POST /DirectBooking */
export interface DirectBookingPayload {
  BarberId: string;
  SalonId: string;
  ServiceId: string;
  /** RFC3339 UTC start time, taken from AvailableSlot.StartTime */
  StartTime: string;
  CustomerName?: string;
  Notes?: string;
}

export interface CreateWeeklySchedulePayload {
  BarberId: string;
  SalonId: string;
  SlotDuration: number;
  WorkDays: WorkDay[];
}

export interface CreateScheduleBlockPayload {
  BarberId: string;
  SalonId: string;
  Date: string;
  StartTime: string;
  EndTime: string;
  BlockType: BlockType;
  Note?: string;
}

export interface UpdateScheduleBlockPayload {
  Date?: string;
  StartTime?: string;
  EndTime?: string;
  BlockType?: BlockType;
  Note?: string;
}


export interface Booking {
  id: string;
  user_id: string | null;
  salon_id: string;
  barber_id: string;
  time_slot_id: string;
  notes: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  booking_type: "online" | "walk_in";
  customer_name: string | null;
  created_at: string;

  // Joined relations (optional)
  salons?: { name: string; area: string } | null;
  barbers?: { name: string } | null;
  time_slots?: { date: string; start_time: string; end_time: string } | null;
}

export interface CreateBookingPayload {
  SalonId: string;
  BarberId: string;
  SlotId: string;
  CustomerName?: string;
  Notes?: string;
}

export interface CreateWalkInBookingPayload {
  SalonId: string;
  BarberId: string;
  SlotId: string;
  CustomerName: string;
  Notes?: string;
}

export interface UpdateBookingPayload {
  SalonId?: string;
  BarberId?: string;
  SlotId?: string;
  Status?: string;
  CustomerName?: string;
  Notes?: string;
}

export interface BookingSearchParams {
  SalonId?: string;
  BarberId?: string;
  UserId?: string;
  Date?: string;
  FromDate?: string;
  ToDate?: string;
  Status?: string;
  Page?: number;
  PageSize?: number;
}

export interface BookingDto {
  BookingId: string;
  UserId: string;
  SalonId: string;
  BarberId: string;
  SlotId: string;
  Status: string;
  BookingType: string;
  CustomerName: string;
  Notes: string;
  CreatedAt: string;
  UpdatedAt: string;
  Deleted: boolean;
}

export interface PaginatedBookingResponse {
  Data: BookingDto[];
  Page: number;
  PageSize: number;
  TotalCount: number;
  TotalPages: number;
}

export interface TimeSlotDto {
  SlotId: string;
  BarberId: string;
  SalonId: string;
  Date: string;
  StartTime: string;
  EndTime: string;
  Status: SlotStatus;
  IsBooked: boolean;
  BlockId: string;
  CreatedAt: string;
  UpdatedAt: string;
  Deleted: boolean;
}

export interface CreateTimeSlotPayload {
  SalonId: string;
  BarberId: string;
  Date: string;
  StartTime: string;
  EndTime: string;
}

export interface BulkCreateTimeSlotPayload {
  TimeSlots: CreateTimeSlotPayload[];
}

export interface UpdateTimeSlotPayload {
  SalonId?: string;
  BarberId?: string;
  Date?: string;
  StartTime?: string;
  EndTime?: string;
  IsBooked?: boolean;
}

export interface TimeSlotSearchParams {
  SalonId?: string;
  BarberId?: string;
  Date?: string;
  FromDate?: string;
  ToDate?: string;
  IsBooked?: boolean;
  Page?: number;
  PageSize?: number;
}

export interface PaginatedTimeSlotResponse {
  Data: TimeSlotDto[];
  Page: number;
  PageSize: number;
  TotalCount: number;
  TotalPages: number;
}
