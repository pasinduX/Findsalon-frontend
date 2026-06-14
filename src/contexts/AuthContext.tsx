"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { getAccessToken } from "@auth0/nextjs-auth0/client";
import { barberService } from "@/services/barber.service";
import { salonService } from "@/services/salon.service";
import { authService } from "@/services/auth.service";
import { setTokenGetter, clearTokenGetter } from "@/services/api.service";
import type { User } from "@/interfaces/user.interface";
import type { SalonMemberDto } from "@/interfaces/user.interface";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  memberships: SalonMemberDto[];
  isBarber: boolean;
  isOwner: boolean;
  phoneVerified: boolean;
  /** Redirect to Auth0 Universal Login (sign-in). */
  signIn: () => void;
  /** Redirect to Auth0 Universal Login (sign-up). */
  signUp: () => void;
  signOut: () => void;
  refreshUser: () => Promise<void>;
  /** Called after successful phone OTP verification to update local user state. */
  onPhoneVerified: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUDIENCE = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user: auth0User, isLoading: auth0Loading } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<SalonMemberDto[]>([]);

  const refreshMemberships = useCallback(async (userId?: string) => {
    const all: SalonMemberDto[] = [];

    if (userId) {
      const salonRes = await salonService.getMySalons(userId);
      all.push(
        ...(salonRes.data ?? []).map((salon) => ({
          SalonId: salon.id,
          SalonName: salon.name,
          Role: "salon_owner",
        }))
      );
    }

    const barberRes = await barberService.getMyBarberProfile();
    const bd = (barberRes.data as any)?.data ?? barberRes.data;
    if (bd?.BarberId) {
      all.push({ SalonId: bd.SalonId, Role: "barber", BarberId: bd.BarberId });
    }

    setMemberships(all);
  }, []);

  useEffect(() => {
    if (auth0Loading) return;

    if (!auth0User) {
      clearTokenGetter();
      setUser(null);
      setMemberships([]);
      setLoading(false);
      return;
    }

    // Wire up the Auth0 access-token getter so every api.service.ts call
    // automatically receives a fresh, valid token in the Authorization header.
    setTokenGetter(() =>
      getAccessToken(AUDIENCE ? { audience: AUDIENCE } : undefined)
        .catch(() => null)
    );

    // Sync with backend: find-or-create the DB user record, then load memberships.
    const syncAndLoad = async () => {
      const sub = (auth0User.sub as string) ?? "";
      const email = (auth0User.email as string) ?? "";
      const fullName = (auth0User.name as string) ?? email;
      const avatarUrl = (auth0User.picture as string) ?? "";

      // Determine provider from Auth0 sub prefix (e.g. "google-oauth2|...", "auth0|...")
      const provider = sub.startsWith("google") ? "google" : "auth0";

      const { data: dbUser } = await authService.syncUser({
        Email: email,
        FullName: fullName,
        Provider: provider,
        GoogleId: sub,
        AvatarUrl: avatarUrl,
      });

      if (!dbUser?.id) {
        setUser(null);
        setMemberships([]);
        setLoading(false);
        return;
      }

      setUser({
        id: dbUser.id,
        email,
        full_name: dbUser.full_name ?? fullName,
        avatar_url: dbUser.avatar_url ?? avatarUrl ?? null,
        phone: dbUser.phone ?? null,
        phone_verified: dbUser.phone_verified ?? false,
        role: (dbUser.role ?? "user") as User["role"],
        created_at: dbUser.created_at ?? new Date().toISOString(),
      });

      await refreshMemberships(dbUser.id);
      setLoading(false);
    };

    syncAndLoad();
  }, [auth0User, auth0Loading, refreshMemberships]);

  const signIn = () => { window.location.href = "/auth/login"; };
  const signUp = () => { window.location.href = "/auth/login?screen_hint=signup"; };

  const signOut = () => {
    clearTokenGetter();
    setUser(null);
    setMemberships([]);
    window.location.href = "/auth/logout";
  };

  const refreshUser = useCallback(async () => {
    if (!user?.id) return;
    await refreshMemberships(user.id);
  }, [user?.id, refreshMemberships]);

  const onPhoneVerified = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  const isBarber = memberships.some((m) => m.Role === "barber");
  const isOwner = memberships.some((m) => m.Role === "salon_owner");
  const phoneVerified = user ? !!user.phone_verified : true;

  return (
    <AuthContext.Provider
      value={{ user, loading, memberships, isBarber, isOwner, phoneVerified, signIn, signUp, signOut, refreshUser, onPhoneVerified }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
