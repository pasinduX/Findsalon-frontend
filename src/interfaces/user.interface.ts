export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  // role carries only the system-level role ("user", "admin", "moderator").
  // Salon-scoped roles (owner, barber) are derived from SalonMemberDto records.
  role: "user" | "barber" | "owner" | "admin";
  created_at: string;
  // memberships is populated by AuthContext after login by querying
  // the user's actual salon/barber ownership records.
  memberships?: SalonMemberDto[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthUser {
  UserId: string;
  FullName: string;
  Email: string;
  Phone?: string;
  AvatarUrl?: string;
  GoogleAvatarUrl?: string;
  Provider?: string;
  GoogleId?: string;
  Role: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface CreateUserPayload {
  FullName: string;
  Email: string;
  PasswordHash: string;
  Phone?: string;
}

export interface UpdateUserPayload {
  FullName?: string;
  Phone?: string;
  AvatarUrl?: string;
  Role?: string;
  IsActive?: boolean;
}

export interface RefreshTokenPayload {
  RefreshToken: string;
}

export interface ProfileDto {
  UserId: string;
  FullName: string;
  Email: string;
  Phone?: string;
  AvatarUrl?: string;
  GoogleAvatarUrl?: string;
  Provider?: string;
  Role: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface UpdateProfilePayload {
  FullName?: string;
  Phone?: string;
  AvatarUrl?: string;
}

export interface UserRoleDto {
  RoleId: string;
  UserId: string;
  // SalonId is present for salon-scoped roles (salon_owner, barber, staff).
  // Empty for system roles (admin, moderator, user).
  SalonId?: string;
  Role: string;
  CreatedAt: string;
  UpdatedAt: string;
  Deleted: boolean;
}

/** Lightweight membership record used in AuthContext and dashboard routing. */
export interface SalonMemberDto {
  /** The salon this membership belongs to. */
  SalonId: string;
  SalonName?: string;
  /** "salon_owner" | "barber" | "staff" */
  Role: string;
  /** Set when Role === "barber" */
  BarberId?: string;
}

export interface CreateUserRolePayload {
  UserId: string;
  Role: string;
  /** Required for salon-scoped roles (salon_owner, barber, staff). */
  SalonId?: string;
}

export interface UpdateUserRolePayload {
  UserId: string;
  Role: string;
}

export interface BookingSummary {
  BookingId: string;
  SalonId: string;
  BarberId: string;
  SlotId: string;
  Status: string;
  BookingType: string;
  CustomerName: string;
  CreatedAt: string;
}

export interface SalonSummary {
  SalonId: string;
  Name: string;
  City: string;
  IsActive: boolean;
}

export interface ProfileSummary {
  UserId: string;
  FullName: string;
  Email: string;
  Role: string;
  CreatedAt: string;
}

export interface UserDashboardResponse {
  UserId: string;
  FullName: string;
  Email: string;
  AvatarUrl: string;
  Role: string;
  TotalBookings: number;
  UpcomingSlots: number;
  CompletedVisits: number;
  CancelledCount: number;
  RecentBookings: BookingSummary[];
}

export interface SalonOwnerDashboardResponse {
  UserId: string;
  FullName: string;
  TotalSalons: number;
  TotalBarbers: number;
  TotalBookings: number;
  TodayBookings: number;
  PendingSlots: number;
  TotalRevenue: number;
  RecentBookings: BookingSummary[];
  Salons: SalonSummary[];
}

export interface BarberDashboardResponse {
  UserId: string;
  FullName: string;
  SalonId: string;
  SalonName: string;
  /** All salons where this user has a barber record. */
  Memberships: SalonMemberDto[];
  TodaySlots: number;
  TodayBookings: number;
  TotalCompleted: number;
  AverageRating: number;
  RecentBookings: BookingSummary[];
}

export interface AdminDashboardResponse {
  TotalUsers: number;
  TotalSalons: number;
  TotalBookings: number;
  TodayBookings: number;
  ActiveSalons: number;
  TotalBarbers: number;
  RecentBookings: BookingSummary[];
  RecentUsers: ProfileSummary[];
}

export interface PaginatedData<T> {
  Data: T[];
  Page: number;
  PageSize: number;
  TotalCount: number;
  TotalPages: number;
}
