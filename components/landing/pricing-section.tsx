import { Check } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

const FREE_FEATURES = [
  "Unlimited subscriptions, expenses & income",
  "Wallets, cash pool & transfers",
  "Budgets per category",
  "AI Advisor",
  "Installable app (PWA)",
];

const PLUS_FEATURES = [
  "Everything in Free",
  "AI quick-entry (type or speak your spending)",
  "Batch receipt scanning",
  "Shared household budgets",
  "Priority AI credits",
];

export function PricingSection() {
  return (
    <section id="pricing" className="border-border border-t">
      <div className="mx-auto max-w-5xl px-4 py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Simple, honest pricing
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Start free. No credit card, no trial clock.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
          <MagicCard className="rounded-2xl p-6">
            <p className="text-sm font-medium">Free Forever</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">RM0</p>
            <p className="text-muted-foreground text-xs">
              manual entry, forever
            </p>
            <ul className="mt-6 flex flex-col gap-2.5 text-sm">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="text-primary mt-0.5 size-4 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <GoogleSignInButton />
            </div>
          </MagicCard>

          <div className="border-border rounded-2xl border border-dashed p-6 opacity-60">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Plus</p>
              <span className="border-border text-muted-foreground rounded-full border px-2 py-0.5 text-[10px]">
                1-week free trial
              </span>
            </div>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              $4.99<span className="text-lg font-medium">/mo</span>
            </p>
            <p className="text-muted-foreground text-xs">
              or $49/yr - for households &amp; power users
            </p>
            <ul className="mt-6 flex flex-col gap-2.5 text-sm">
              {PLUS_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Button disabled className="w-full">
                Coming soon
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
