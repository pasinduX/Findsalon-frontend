export interface NotificationDto {
  NotificationId: string;
  UserId: string;
  Title: string;
  Body: string;
  Type: string;
  EventType: string;
  RefId: string;
  IsRead: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  Deleted: boolean;
}

export interface TemplateDto {
  TemplateId: string;
  EventType: string;
  Name: string;
  Subject: string;
  BodyTemplate: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  Deleted: boolean;
}

export interface BookingNotificationPayload {
  BookingId: string;
  UserId?: string;
  SalonId: string;
  BarberId: string;
  CustomerName: string;
  CustomerEmail?: string;
  SalonName: string;
  BarberName: string;
  Date?: string;
  StartTime?: string;
  EndTime?: string;
  EventType: string;
}

export interface CustomNotificationPayload {
  UserId: string;
  Title: string;
  Body: string;
  Type?: string;
  RefId?: string;
  SendEmail?: boolean;
  Email?: string;
}

export interface BulkNotificationPayload {
  UserIds: string[];
  Title: string;
  Body: string;
  Type?: string;
  SendEmail?: boolean;
}

export interface NotificationSearchParams {
  UserId?: string;
  Page?: number;
  PageSize?: number;
}

export interface TemplateSearchParams {
  Page?: number;
  PageSize?: number;
}

export interface PaginatedNotificationResponse {
  Data: NotificationDto[];
  Page: number;
  PageSize: number;
  TotalCount: number;
  TotalPages: number;
}

export interface PaginatedTemplateResponse {
  Data: TemplateDto[];
  Page: number;
  PageSize: number;
  TotalCount: number;
  TotalPages: number;
}
