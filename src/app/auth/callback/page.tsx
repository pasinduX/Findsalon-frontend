import { Scissors } from "lucide-react";

// The Auth0 SDK middleware intercepts /auth/callback before this page renders.
// This component is a fallback and should never be visible in normal operation.
export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background">
      <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg animate-pulse">
        <Scissors className="h-8 w-8 text-primary-foreground" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-bold text-foreground">Signing you in…</h2>
        <p className="text-muted-foreground text-sm">Completing authentication, please wait.</p>
      </div>
    </div>
  );
}
