import { redirect } from "next/navigation";

// Auth0 Universal Login handles all authentication — redirect immediately.
export default function AuthPage() {
  redirect("/auth/login");
}
