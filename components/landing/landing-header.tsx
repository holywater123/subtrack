import Link from "next/link";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export function LandingHeader() {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6">
      <span className="text-lg font-semibold tracking-tight">Gauge</span>
      <div className="flex items-center gap-1">
        <AnimatedThemeToggler />
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground px-3 text-sm font-medium transition-colors"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
