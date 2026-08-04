"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateProfile } from "@/app/dashboard/settings/actions";
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
