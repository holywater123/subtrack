"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Particles } from "@/components/ui/particles";

export function DashboardParticles() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard client-hydration-detection idiom, no derivable alternative
  useEffect(() => setMounted(true), []);

  return (
    <Particles
      className="pointer-events-none fixed inset-0 -z-10"
      quantity={80}
      ease={70}
      color={mounted && resolvedTheme === "dark" ? "#ffffff" : "#000000"}
      refresh={mounted}
    />
  );
}
