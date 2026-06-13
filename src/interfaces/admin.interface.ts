export interface AdminStats {
  totalUsers: number;
  totalSalons: number;
  totalBarbers: number;
  totalBookings: number;
  activeSalons: number;
  // Fields below are not yet returned by the backend; shown as 0 until extended.
  totalReviews: number;
  onlineBookings: number;
  walkInBookings: number;
  avgRating: number;
}

export interface RecentBooking {
  id: string;
  created_at: string;
  booking_type: string;
  status: string;
  customer_name: string | null;
  salon_name: string;
  barber_name: string;
}

export interface RecentSalon {
  id: string;
  name: string;
  area: string;
  city: string;
  created_at: string;
  is_active: boolean;
}
