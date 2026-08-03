"use client";

import { Moon, SunDim } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";

export function AnimatedThemeToggler({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard client-hydration-detection idiom, no derivable alternative
  useEffect(() => setMounted(true), []);

  async function toggleTheme() {
    const next = resolvedTheme === "dark" ? "light" : "dark";

    if (!buttonRef.current || !document.startViewTransition) {
      setTheme(next);
      return;
    }

    await document.startViewTransition(() => {
      flushSync(() => {
        setTheme(next);
      });
    }).ready;

    const { top, left, width, height } = buttonRef.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const right = window.innerWidth - left;
    const bottom = window.innerHeight - top;
    const maxRadius = Math.hypot(Math.max(left, right), Math.max(top, bottom));

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 600,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={cn(
        "hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 inline-flex size-9 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-3",
        className
      )}
    >
      {mounted && resolvedTheme === "dark" ? (
        <SunDim className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </button>
  );
}
