"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  COUNTRIES,
  OCCUPATION_OPTIONS,
  LIFESTYLE_OPTIONS,
  TRACKING_FOCUS_OPTIONS,
  type TrackingFocus,
} from "@/lib/onboarding";
import { completeOnboarding } from "@/app/onboarding/actions";

const COUNTRY_ITEMS = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));

const STEP_COUNT = 5;

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs transition-colors",
            value === option
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function OnboardingClient() {
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [country, setCountry] = useState("");
  const [occupation, setOccupation] = useState("");
  const [lifestyle, setLifestyle] = useState("");
  const [goal, setGoal] = useState("");
  const [trackingFocus, setTrackingFocus] = useState<TrackingFocus>("everything");
  const [isPending, startTransition] = useTransition();

  const canProceedFromStep0 = fullName.trim() !== "" && country !== "";

  function next() {
    if (step === 0 && !canProceedFromStep0) {
      toast.error("Tell us your name and where you live first.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEP_COUNT - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("fullName", fullName);
    formData.set("birthdate", birthdate);
    formData.set("country", country);
    formData.set("occupation", occupation);
    formData.set("lifestyle", lifestyle);
    formData.set("goal", goal);
    formData.set("trackingFocus", trackingFocus);

    startTransition(async () => {
      // completeOnboarding redirects on success (throwing to unwind out of
      // this transition) - it only ever actually returns here on failure.
      const result = await completeOnboarding(formData);
      toast.error(result.error);
    });
  }

  return (
    <MagicCard className="rounded-2xl p-6">
      <div className="mb-6 flex items-center gap-1.5">
        {Array.from({ length: STEP_COUNT }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= step ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {step === 0 && (
          <>
            <div>
              <h1 className="text-lg font-semibold">Welcome to Gauge</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                A couple of quick questions to set things up right.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName">Your name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Where do you live?</Label>
              <Select
                items={COUNTRY_ITEMS}
                value={country}
                onValueChange={(v) => v && setCountry(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_ITEMS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Sets your default currency - editable later in Settings.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="birthdate">Birthdate (optional)</Label>
              <Input
                id="birthdate"
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
              />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <h1 className="text-lg font-semibold">A bit about you</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Helps the AI advisor give guidance that actually fits your
                life. Both optional.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Occupation</Label>
              <ChipGroup
                options={OCCUPATION_OPTIONS}
                value={occupation}
                onChange={setOccupation}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Lifestyle</Label>
              <ChipGroup
                options={LIFESTYLE_OPTIONS}
                value={lifestyle}
                onChange={setLifestyle}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h1 className="text-lg font-semibold">What are you working toward?</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Optional - keeps you focused on what actually matters.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="goal">Financial goal</Label>
              <Input
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Build a 6-month emergency fund, retire by 50..."
              />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <h1 className="text-lg font-semibold">What are you tracking?</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Sets up your Overview with the widgets that matter most -
                fully customizable later.
              </p>
            </div>
            <ChipGroup
              options={TRACKING_FOCUS_OPTIONS.map((o) => o.label)}
              value={
                TRACKING_FOCUS_OPTIONS.find((o) => o.value === trackingFocus)
                  ?.label ?? ""
              }
              onChange={(label) => {
                const match = TRACKING_FOCUS_OPTIONS.find((o) => o.label === label);
                if (match) setTrackingFocus(match.value);
              }}
            />
          </>
        )}

        {step === 4 && (
          <>
            <div>
              <h1 className="text-lg font-semibold">You&apos;re all set</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Everything here is editable later from Settings.
              </p>
            </div>
            <div className="text-sm">
              <dl className="flex flex-col gap-2">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd>{fullName || "-"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Country</dt>
                  <dd>{COUNTRIES.find((c) => c.code === country)?.name ?? "-"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Tracking</dt>
                  <dd>
                    {
                      TRACKING_FOCUS_OPTIONS.find((o) => o.value === trackingFocus)
                        ?.label
                    }
                  </dd>
                </div>
              </dl>
            </div>
          </>
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={back} className="gap-1">
              <ChevronLeft className="size-4" />
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < STEP_COUNT - 1 ? (
            <Button type="button" onClick={next}>
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={isPending}>
              {isPending ? "Setting up..." : "Get started"}
            </Button>
          )}
        </div>
      </form>
    </MagicCard>
  );
}
