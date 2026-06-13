import { api } from "./api.service";
import type { AdminStats, RecentBooking, RecentSalon } from "@/interfaces";

interface AdminDashboardData {
  stats: AdminStats;
  recentBookings: RecentBooking[];
  recentSalons: RecentSalon[];
}

// Shape returned by GET /api/v1/user/AdminDashboard
interface BackendAdminDashboard {
  TotalUsers: number;
  TotalSalons: number;
  ActiveSalons: number;
  TotalBarbers: number;
  TotalBookings: number;
}

export const adminService = {
  /** Fetch admin dashboard stats from the unified backend. */
  async getDashboard(): Promise<{ data: AdminDashboardData | null; error: string | null }> {
    const res = await api.get<{ data: BackendAdminDashboard }>("/api/v1/user/AdminDashboard");
    if (res.error || !res.data) return { data: null, error: res.error };

    // Backend wraps the payload in a { status, code, data } envelope.
    const raw = (res.data as any)?.data ?? res.data as unknown as BackendAdminDashboard;

    const stats: AdminStats = {
      totalUsers: raw.TotalUsers ?? 0,
      totalSalons: raw.TotalSalons ?? 0,
      totalBarbers: raw.TotalBarbers ?? 0,
      totalBookings: raw.TotalBookings ?? 0,
      activeSalons: raw.ActiveSalons ?? 0,
      // Not yet provided by the backend.
      totalReviews: 0,
      onlineBookings: 0,
      walkInBookings: 0,
      avgRating: 0,
    };

    return {
      data: { stats, recentBookings: [], recentSalons: [] },
      error: null,
    };
  },

  /** Activate or deactivate a salon (admin only). */
  async toggleSalonStatus(salonId: string, is_active: boolean) {
    return api.put<{ success: boolean }>(
      `/api/v1/salon/UpdateSalon?SalonId=${encodeURIComponent(salonId)}`,
      { IsActive: is_active }
    );
  },
};
