"use client";

import Navbar from "../../../src/components/Navbar";
import Footer from "../../../src/components/Footer";
import MobileBottomNav from "../../../src/components/MobileBottomNav";
import ToolsSection from "../../../src/components/ToolsSection";

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] selection:bg-violet-500/30">
      <Navbar />

      <main className="pt-20">
        <ToolsSection />
      </main>

      <Footer />
      <MobileBottomNav />
      <div className="h-16 md:hidden" />
    </div>
  );
}
