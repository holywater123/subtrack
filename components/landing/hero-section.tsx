import { DotPattern } from "@/components/ui/dot-pattern";
import { MagicCard } from "@/components/ui/magic-card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { BlurFadeText } from "@/components/ui/blur-fade";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { cn } from "@/lib/utils";

const CATEGORY_DOT_COLORS = [
  "bg-violet-500",
  "bg-pink-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-teal-500",
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:py-28">
      <DotPattern
        width={28}
        height={28}
        className="[mask-image:radial-gradient(650px_circle_at_center,white,transparent)]"
      />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
        <span className="text-muted-foreground border-border rounded-full border px-3 py-1 text-xs font-medium">
          Personal finance, unified
        </span>

        <BlurFadeText
          as="h1"
          text="Every subscription, expense, and dollar - finally in one place."
          className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
          staggerDelay={0.02}
        />

        <p className="text-muted-foreground max-w-xl text-base text-balance sm:text-lg">
          Gauge brings your subscriptions, spending, income, debts, and
          accounts together, with an AI advisor that&apos;s grounded in your
          real numbers - not generic advice.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <GoogleSignInButton className="w-auto" />
          <a
            href="#features"
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            See what&apos;s inside
          </a>
        </div>

        <MagicCard className="mt-6 w-full max-w-xs rounded-2xl p-6 text-left">
          <p className="text-muted-foreground text-xs">
            Total tracked this month
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-semibold">RM</span>
            <NumberTicker
              value={4821.5}
              decimalPlaces={2}
              className="text-4xl font-semibold tracking-tight"
            />
          </div>
          <div className="mt-4 flex gap-1.5">
            {CATEGORY_DOT_COLORS.map((color) => (
              <span
                key={color}
                className={cn("h-1.5 flex-1 rounded-full", color)}
              />
            ))}
          </div>
          <p className="text-muted-foreground mt-2 text-[11px]">
            Subscriptions · Expenses · Income · Debts
          </p>
        </MagicCard>
      </div>
    </section>
  );
}
