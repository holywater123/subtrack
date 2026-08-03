import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DotPattern } from "@/components/ui/dot-pattern";
import { MagicCard } from "@/components/ui/magic-card";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { cn } from "@/lib/utils";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4">
      <DotPattern
        glow
        className={cn(
          "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]"
        )}
      />

      <MagicCard className="relative z-10 w-full max-w-sm rounded-2xl p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-2xl font-semibold tracking-tight">
            SubTrack
          </span>
          <p className="text-muted-foreground text-sm">
            Every subscription you pay for, in one place.
          </p>
        </div>

        <div className="mt-8">
          <GoogleSignInButton />
        </div>

        {error && (
          <p className="text-destructive mt-4 text-center text-sm">
            Sign-in failed. Please try again.
          </p>
        )}
      </MagicCard>
    </div>
  );
}
