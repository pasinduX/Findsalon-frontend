import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-4">
      <h1 className="font-display text-6xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground text-lg mb-8">
        Oops! The page you're looking for doesn't exist.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold"
      >
        Go Home
      </Link>
    </div>
  );
}
