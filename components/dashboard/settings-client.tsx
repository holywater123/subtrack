"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { LogOut, Star } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateProfile, submitFeedback } from "@/app/dashboard/settings/actions";
import { signOut } from "@/app/dashboard/actions";
import { InstallAppButton } from "@/components/install-app-button";

function calculateAge(birthdate: string): number | null {
  if (!birthdate) return null;
  const dob = new Date(`${birthdate}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

export function SettingsClient({
  email,
  fullName,
  birthdate,
  goal,
}: {
  email: string;
  fullName: string;
  birthdate: string;
  goal: string;
}) {
  const [name, setName] = useState(fullName);
  const [dob, setDob] = useState(birthdate);
  const [goalText, setGoalText] = useState(goal);
  const [isPending, startTransition] = useTransition();

  const age = calculateAge(dob);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("fullName", name);
    formData.set("birthdate", dob);
    formData.set("goal", goalText);

    startTransition(async () => {
      const result = await updateProfile(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Profile updated");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <MagicCard className="rounded-2xl p-6">
        <h2 className="font-medium">Profile</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Personalizes your greeting and helps keep you focused on what
          you&apos;re working toward.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">Name</Label>
            <Input
              id="fullName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="birthdate">Birthdate</Label>
            <Input
              id="birthdate"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
            {age !== null && (
              <p className="text-muted-foreground text-xs">Age: {age}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="goal">Personal goal (optional)</Label>
            <Input
              id="goal"
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              placeholder="e.g. Build a 6-month emergency fund, retire by 50..."
            />
          </div>
          <div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save profile"}
            </Button>
          </div>
        </form>
      </MagicCard>

      <MagicCard className="rounded-2xl p-6">
        <h2 className="font-medium">App</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Install Gauge on your device for quicker access. On iPhone, use
          Safari&apos;s Share button and tap &ldquo;Add to Home Screen&rdquo;
          instead.
        </p>
        <div className="mt-4">
          <InstallAppButton />
        </div>
      </MagicCard>

      <FeedbackCard />

      <MagicCard className="rounded-2xl p-6">
        <h2 className="font-medium">Account</h2>
        <p className="text-muted-foreground mt-1 text-sm">{email}</p>
        <form action={signOut} className="mt-4">
          <Button variant="outline" type="submit" className="gap-1.5">
            <LogOut className="size-4" />
            Sign out
          </Button>
        </form>
      </MagicCard>
    </div>
  );
}

// Always available, never a forced popup - matches the app's own
// no-added-friction principle. Nothing reads these back in-app; check
// the `feedback` table directly in Supabase.
function FeedbackCard() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Pick a star rating first.");
      return;
    }
    const formData = new FormData();
    formData.set("rating", String(rating));
    formData.set("comment", comment);

    startTransition(async () => {
      const result = await submitFeedback(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Thanks for the feedback!");
      setRating(0);
      setComment("");
    });
  }

  return (
    <MagicCard className="rounded-2xl p-6">
      <h2 className="font-medium">Feedback</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        How&apos;s Gauge working for you? Your feedback shapes what gets
        built next.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "size-6 transition-colors",
                  value <= (hoverRating || rating)
                    ? "fill-primary text-primary"
                    : "text-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="comment">Comment (optional)</Label>
          <Input
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What's working, what's missing..."
          />
        </div>
        <div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Sending..." : "Send feedback"}
          </Button>
        </div>
      </form>
    </MagicCard>
  );
}
