"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Scissors, User, LogOut, LayoutDashboard, Store, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { salonService } from "@/services/salon.service";
import type { Salon } from "@/interfaces";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const [ownedSalons, setOwnedSalons] = useState<Salon[]>([]);
  const [salonsOpen, setSalonsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (user) {
      salonService.getMySalons(user.id).then(({ data }) => {
        if (!cancelled) setOwnedSalons(data ?? []);
      });
    } else {
      setOwnedSalons([]);
      setSalonsOpen(false);
    }

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Scissors className="h-6 w-6 text-primary" />
          <span className="font-display text-xl font-bold text-foreground">FindSalonLK</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/salons">
            <Button variant="ghost" size="sm">Find Salons</Button>
          </Link>

          {user ? (
            <>
              {ownedSalons.length > 0 ? (
                <>
                  <div className="relative">
                    <Button variant="ghost" size="sm" onClick={() => setSalonsOpen((open) => !open)}>
                      <Store className="h-4 w-4 mr-1" />
                      My Salons
                    </Button>
                    {salonsOpen && (
                      <div className="absolute right-0 top-10 w-72 rounded-lg border border-border bg-popover shadow-lg p-2 z-50">
                        <div className="max-h-80 overflow-y-auto">
                          {ownedSalons.map((salon) => (
                            <div key={salon.id} className="rounded-md p-2 hover:bg-muted">
                              <p className="text-sm font-medium truncate">{salon.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{salon.area}, {salon.city}</p>
                              <div className="flex gap-2 mt-2">
                                <Link href={`/salon/${salon.id}`} onClick={() => setSalonsOpen(false)}>
                                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs">View</Button>
                                </Link>
                                <Link href={`/dashboard?salonId=${salon.id}`} onClick={() => setSalonsOpen(false)}>
                                  <Button size="sm" className="h-7 px-2 text-xs">Manage</Button>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Link href="/dashboard/create" onClick={() => setSalonsOpen(false)}>
                          <Button variant="ghost" size="sm" className="w-full justify-start gap-1.5 mt-1">
                            <Plus className="h-3.5 w-3.5" />
                            Create another salon
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                      <LayoutDashboard className="h-4 w-4 mr-1" />
                      Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href="/dashboard/create">
                  <Button variant="ghost" size="sm">Create Salon</Button>
                </Link>
              )}
              <Link href="/my-bookings">
                <Button variant="ghost" size="sm">My Bookings</Button>
              </Link>
              {/* Use <a> so Auth0 logout URL is a full navigation, not client-side */}
              <a href="/auth/logout">
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </a>
            </>
          ) : (
            /* Use <a> so Auth0 login URL is a full navigation, not client-side */
            <a href="/auth/login">
              <Button size="sm" className="gradient-primary text-primary-foreground">
                <User className="h-4 w-4 mr-1" />
                Sign In
              </Button>
            </a>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
