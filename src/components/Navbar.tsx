"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Scissors, User, LogOut, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";
import { salonService } from "@/services/salon.service";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const [hasSalon, setHasSalon] = useState(false);

  useEffect(() => {
    if (user) {
      salonService.getMySalon(user.id).then(({ data }) => setHasSalon(!!data));
    } else {
      setHasSalon(false);
    }
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
              {hasSalon ? (
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="h-4 w-4 mr-1" />
                    Dashboard
                  </Button>
                </Link>
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
