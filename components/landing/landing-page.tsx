import { LandingHeader } from "@/components/landing/landing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { DifferentiatorsSection } from "@/components/landing/differentiators-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <LandingHeader />
      <HeroSection />
      <FeatureGrid />
      <DifferentiatorsSection />
      <PricingSection />
      <FinalCtaSection />
      <LandingFooter />
    </div>
  );
}
