"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { adminService } from "@/services/admin.service";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Store, Scissors, CalendarCheck, Star, TrendingUp, UserPlus, Clock,
} from "lucide-react";
import { format } from "date-fns";
import type { AdminStats, RecentBooking, RecentSalon } from "@/interfaces";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentSalons, setRecentSalons] = useState<RecentSalon[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth"); return; }
    if (user.role !== "admin") { setAccessDenied(true); return; }

    adminService.getDashboard().then(({ data, error }) => {
      if (error || !data) { setLoading(false); return; }
      setStats(data.stats);
      setRecentBookings(data.recentBookings || []);
      setRecentSalons(data.recentSalons || []);
      setLoading(false);
    });
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-24">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 text-center py-20">
          <h2 className="font-display text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { title: "Total Users", value: stats?.totalUsers, icon: Users, color: "text-blue-500" },
    { title: "Total Salons", value: stats?.totalSalons, icon: Store, color: "text-emerald-500" },
    { title: "Total Barbers", value: stats?.totalBarbers, icon: Scissors, color: "text-violet-500" },
    { title: "Total Bookings", value: stats?.totalBookings, icon: CalendarCheck, color: "text-amber-500" },
    { title: "Online Bookings", value: stats?.onlineBookings, icon: TrendingUp, color: "text-cyan-500" },
    { title: "Walk-in Bookings", value: stats?.walkInBookings, icon: UserPlus, color: "text-rose-500" },
    { title: "Total Reviews", value: stats?.totalReviews, icon: Star, color: "text-yellow-500" },
    { title: "Avg Rating", value: stats?.avgRating ? `${stats.avgRating} ★` : "N/A", icon: Star, color: "text-orange-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">System overview and analytics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value ?? 0}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />Recent Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No bookings yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Salon</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.customer_name || "Online User"}</TableCell>
                        <TableCell>{b.salon_name}</TableCell>
                        <TableCell>
                          <Badge variant={b.booking_type === "walk_in" ? "secondary" : "default"}>
                            {b.booking_type === "walk_in" ? "Walk-in" : "Online"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={b.status === "confirmed" ? "default" : "outline"}>
                            {b.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(b.created_at), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Recent Salons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />Recent Salons
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentSalons.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No salons yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSalons.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.area}</TableCell>
                        <TableCell>
                          <Badge variant={s.is_active ? "default" : "destructive"}>
                            {s.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(s.created_at), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
