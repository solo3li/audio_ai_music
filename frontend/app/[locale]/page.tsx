"use client";


import Navbar from "../../src/components/Navbar";
import HeroSection from "../../src/components/HeroSection";
import MarqueeBanner from "../../src/components/MarqueeBanner";
import ToolsSection from "../../src/components/ToolsSection";
import HowItWorks from "../../src/components/HowItWorks";
import FeaturesSection from "../../src/components/FeaturesSection";
import PricingSection from "../../src/components/PricingSection";
import TestimonialsSection from "../../src/components/TestimonialsSection";
import CTASection from "../../src/components/CTASection";
import Footer from "../../src/components/Footer";
import MobileBottomNav from "../../src/components/MobileBottomNav";
import CursorGlow from "../../src/components/CursorGlow";

export default function Page() {
  return (
    <div className="relative min-h-screen">
      {/* Noise texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Global Ambient Glow */}
      <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[80%] md:w-[60%] h-[600px] bg-violet-600/15 blur-[120px] pointer-events-none z-0 rounded-full" />

      <div className="relative z-10">
        <CursorGlow />
        <Navbar />
        <main>
          <HeroSection />
          <MarqueeBanner />
          <ToolsSection />
          <HowItWorks />
          <FeaturesSection />
          <CTASection />
        </main>
        <Footer />
        <MobileBottomNav />
        <div className="h-16 md:hidden" />
      </div>
    </div>
  );
}
