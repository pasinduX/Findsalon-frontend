export interface Review {
  id: string;
  salon_id: string;
  barber_id: string;
  booking_id: string;
  user_id: string;
  rating: number; // 1–5
  comment: string | null;
  created_at: string;

  // Joined relations (optional)
  profiles?: { full_name: string | null } | null;
  barbers?: { name: string } | null;
}

export interface CreateReviewPayload {
  salon_id: string;
  barber_id: string;
  booking_id: string;
  rating: number;
  comment?: string | null;
}

export interface ReviewDto {
  ReviewId: string;
  SalonId: string;
  BarberId: string;
  BookingId: string;
  UserId: string;
  UserName?: string;
  Rating: number;
  Comment: string;
  IsVisible: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  Deleted: boolean;
}

export interface CreateReviewRequest {
  SalonId: string;
  BarberId?: string;
  BookingId: string;
  UserId: string;
  Rating: number;
  Comment?: string;
}

export interface ReviewSearchParams {
  SalonId?: string;
  BarberId?: string;
  UserId?: string;
  Rating?: number;
  IsVisible?: boolean;
  Page?: number;
  PageSize?: number;
}

export interface RatingSummaryDto {
  EntityId: string;
  EntityType: string;
  AverageRating: number;
  TotalReviews: number;
  Distribution: Record<string, number>;
  RecentReviews: ReviewDto[];
}

export interface PaginatedReviewResponse {
  Reviews: ReviewDto[];
  Page: number;
  PageSize: number;
  TotalCount: number;
  TotalPages: number;
}
