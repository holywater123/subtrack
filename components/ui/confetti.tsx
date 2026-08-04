"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CHART_CATEGORICAL } from "@/lib/chart-colors";

interface Particle {
  id: number;
  dx: number;
  dy: number;
  rotate: number;
  color: string;
  delay: number;
  duration: number;
}

function makeBurst(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    dx: (Math.random() - 0.5) * 320,
    dy: 220 + Math.random() * 160,
    rotate: (Math.random() - 0.5) * 720,
    color: CHART_CATEGORICAL[i % CHART_CATEGORICAL.length].light,
    delay: Math.random() * 0.15,
    duration: 1.1 + Math.random() * 0.6,
  }));
}

// Fires a burst of small particles from just below the top of the viewport
// each time `trigger` increases. No confetti library in the dependency
// tree, so this is hand-rolled on top of motion/react (already a
// dependency), matching the zero-extra-dependency approach used for charts.
export function ConfettiBurst({ trigger }: { trigger: number }) {
  const [bursts, setBursts] = useState<{ key: number; particles: Particle[] }[]>([]);

  useEffect(() => {
    if (trigger <= 0) return;
    const key = Date.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to an external trigger prop by spawning a one-off animation burst, not synchronizing derived state
    setBursts((prev) => [...prev, { key, particles: makeBurst(28) }]);
    const timeout = setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.key !== key));
    }, 2000);
    return () => clearTimeout(timeout);
  }, [trigger]);

  if (bursts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {bursts.map((burst) =>
        burst.particles.map((p) => (
          <motion.div
            key={`${burst.key}-${p.id}`}
            className="absolute top-24 left-1/2 h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: p.color }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: p.dx, y: p.dy, opacity: 0, rotate: p.rotate }}
            transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          />
        ))
      )}
    </div>
  );
}
