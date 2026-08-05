import { Camera, Sparkles, Zap, type LucideIcon } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { BorderBeam } from "@/components/ui/border-beam";

interface AiItem {
  icon: LucideIcon;
  color: string;
  title: string;
  description: string;
}

const AI_ITEMS: AiItem[] = [
  {
    icon: Zap,
    color: "bg-violet-500",
    title: "Quick entry",
    description:
      'Type "RM12 lunch" or "got paid 3000 salary" - Gauge figures out the rest. Review and edit before anything saves.',
  },
  {
    icon: Camera,
    color: "bg-cyan-500",
    title: "Receipt scanning",
    description:
      "Snap a photo of a receipt and AI fills in the amount, category, and date - built to extend to a whole stack at once.",
  },
  {
    icon: Sparkles,
    color: "bg-fuchsia-500",
    title: "AI Advisor",
    description:
      "Ask questions about your finances and get answers grounded in your real data, not a generic guess.",
  },
];

export function AiShowcaseSection() {
  return (
    <section className="border-border border-t">
      <div className="mx-auto max-w-5xl px-4 py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Let AI do the typing
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Less data entry, more clarity. Everything it fills in stays
            editable before it&apos;s saved.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {AI_ITEMS.map((item) => (
            <MagicCard key={item.title} className="relative rounded-2xl p-5">
              <BorderBeam
                size={80}
                duration={8}
                colorFrom="#8b5cf6"
                colorTo="#06b6d4"
              />
              <div
                className={`flex size-10 items-center justify-center rounded-full text-white ${item.color}`}
              >
                <item.icon className="size-5" />
              </div>
              <h3 className="mt-3 font-medium">{item.title}</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {item.description}
              </p>
            </MagicCard>
          ))}
        </div>
      </div>
    </section>
  );
}
