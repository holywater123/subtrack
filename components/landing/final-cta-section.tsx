import { GoogleSignInButton } from "@/components/google-sign-in-button";

export function FinalCtaSection() {
  return (
    <section className="border-border border-t">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-20 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          Ready to see where your money actually goes?
        </h2>
        <p className="text-muted-foreground max-w-md text-sm">
          Sign in with Google and you&apos;re tracking your first
          subscription in under a minute.
        </p>
        <div className="mt-2 w-full max-w-xs">
          <GoogleSignInButton />
        </div>
      </div>
    </section>
  );
}
