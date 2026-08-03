"use client";

import { useEffect, useState } from "react";
import { quoteForDate } from "@/lib/finance-quotes";
import { BlurFade } from "@/components/ui/blur-fade";

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardGreeting({ name }: { name: string }) {
  // Computed client-side so the greeting matches the visitor's local time
  // (a server render would use the server's clock, e.g. UTC on Vercel).
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard client-hydration-detection idiom, no derivable alternative
    setNow(new Date());
  }, []);

  const greeting = now ? greetingForHour(now.getHours()) : "Hi";
  const quote = now ? quoteForDate(now) : "";

  return (
    <div>
      <BlurFade duration={0.5}>
        <h1 className="text-xl font-semibold tracking-tight">
          {greeting}
          {name ? `, ${name}` : ""}! Have you logged your finances today?
        </h1>
      </BlurFade>
      {quote && (
        <BlurFade duration={0.5} delay={0.1}>
          <p className="text-muted-foreground mt-0.5 text-sm italic">
            &ldquo;{quote}&rdquo;
          </p>
        </BlurFade>
      )}
    </div>
  );
}
