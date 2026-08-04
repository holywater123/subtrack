"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Particles } from "@/components/ui/particles";

export function DashboardParticles() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard client-hydration-detection idiom, no derivable alternative
  useEffect(() => setMounted(true), []);

  // A continuous 80-circle canvas redraw every frame is real, constant main
  // thread + GPU cost - fine on desktop, but it competes with everything
  // else (scrolling, the theme toggler's view-transition) for a phone's
  // much tighter frame budget. Cut the count sharply on narrow viewports
  // instead of dropping the effect entirely.
  const [quantity, setQuantity] = useState(80);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setQuantity(mq.matches ? 20 : 80);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <Particles
      className="pointer-events-none fixed inset-0 -z-10"
      quantity={quantity}
      ease={70}
      color={mounted && resolvedTheme === "dark" ? "#ffffff" : "#000000"}
      refresh={mounted}
    />
  );
}
