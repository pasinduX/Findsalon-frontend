import { api } from "./api.service";
import type {
  AuthUser,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  CreateUserPayload,
  RefreshTokenPayload,
  UpdateUserPayload,
  User,
} from "@/interfaces";


const BASE_PATH = "/api/v1/auth";


function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function mapAuthUserToUser(authUser: AuthUser): User {
  return {
    id: authUser.UserId,
    email: authUser.Email,
    full_name: authUser.FullName,
    avatar_url: authUser.AvatarUrl ?? authUser.GoogleAvatarUrl ?? null,
    phone: authUser.Phone ?? null,
    phone_verified: authUser.PhoneVerified ?? false,
    role: authUser.Role as User["role"],
    created_at: authUser.CreatedAt,
  };
}

function unwrapAuthUser(raw: any): AuthUser | null {
  const user = raw?.User ?? raw?.user ?? raw?.data?.User ?? raw?.data?.user ?? raw?.data ?? raw;
  return user?.UserId ? (user as AuthUser) : null;
}

export const authService = {
  async login(payload: LoginPayload) {
    const res = await api.post<any>(`${BASE_PATH}/login`, payload);
    const raw = (res.data as any)?.data ?? res.data;
    if (raw?.AccessToken) {
      const user: User | null = raw.User ? mapAuthUserToUser(raw.User as AuthUser) : null;
      return { data: { token: raw.AccessToken, user } as AuthResponse, error: null };
    }
    return { data: null, error: res.error || (res.data as any)?.message || "Login failed" };
  },

  async register(payload: RegisterPayload) {
    const res = await api.post<any>(`${BASE_PATH}/register`, payload);
    const raw = (res.data as any)?.data ?? res.data;
    if (raw?.AccessToken) {
      const user: User | null = raw.User ? mapAuthUserToUser(raw.User as AuthUser) : null;
      return { data: { token: raw.AccessToken, user } as AuthResponse, error: null };
    }
    return { data: null, error: res.error || (res.data as any)?.message || "Registration failed" };
  },

  /** Looks up the current user by their Auth0 sub (or legacy backend UserId). */
  async getMe(userId: string) {
    const result = await authService.findUser(userId);
    if (!result.data) {
      return { data: null, error: result.error ?? "Unable to load user" };
    }
    return { data: mapAuthUserToUser(result.data), error: null };
  },

  async createUser(payload: CreateUserPayload) {
    return api.post<any>(`${BASE_PATH}/CreateUser`, payload);
  },

  async updateUser(userId: string, payload: UpdateUserPayload) {
    return api.put<any>(`${BASE_PATH}/UpdateUser?UserId=${encodeURIComponent(userId)}`, payload);
  },

  async deleteUser(userId: string) {
    return api.delete<any>(`${BASE_PATH}/DeleteUser?UserId=${encodeURIComponent(userId)}`);
  },

  async findUser(userId: string) {
    return api.get<AuthUser>(
      `${BASE_PATH}/FindUser?UserId=${encodeURIComponent(userId)}`
    );
  },

  async findAllUsers() {
    return api.get<AuthUser[]>(`${BASE_PATH}/FindallUser`);
  },

  async refreshToken(payload: RefreshTokenPayload) {
    return api.post<any>(`${BASE_PATH}/refresh`, payload);
  },

  async logout() {
    return api.post<any>(`${BASE_PATH}/logout`, {});
  },

  async sendPhoneOtp(userId: string, phone: string) {
    return api.post<any>(`${BASE_PATH}/phone/send-otp`, { UserId: userId, Phone: phone });
  },

  async verifyPhoneOtp(userId: string, code: string) {
    const res = await api.post<any>(`${BASE_PATH}/phone/verify-otp`, { UserId: userId, Code: code });
    const raw = (res.data as any)?.data ?? res.data;
    const user = raw?.UserId ? mapAuthUserToUser(raw as AuthUser) : null;
    if (res.error || !user) return { data: null, error: res.error ?? (res.data as any)?.message ?? "Verification failed" };
    return { data: user, error: null };
  },

  /** Find-or-create the user in the DB using their Auth0 profile. Returns the DB record. */
  async syncUser(payload: { Email: string; FullName: string; Provider?: string; GoogleId?: string; AvatarUrl?: string }) {
    const res = await api.post<any>(`${BASE_PATH}/sync`, payload);
    const user = unwrapAuthUser(res.data);
    if (res.error || !user) return { data: null, error: res.error ?? "Sync failed" };
    return { data: mapAuthUserToUser(user), error: null };
  },
};
