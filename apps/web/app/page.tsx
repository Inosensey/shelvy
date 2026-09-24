import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { AIHighlight } from "@/components/marketing/AIHighlight";
import { PricingSection } from "@/components/marketing/PricingSection";
import { Footer } from "@/components/marketing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <Hero />
      <FeatureGrid />
      <AIHighlight />
      <PricingSection />
      <Footer />
    </div>
  );
}
