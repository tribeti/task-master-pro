"use client";

import React from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import GamificationSection from "@/components/landing/GamificationSection";
import PricingSection from "@/components/landing/PricingSection";
import CtaSection from "@/components/landing/CtaSection";
import Footer from "@/components/landing/Footer";

export default function TaskMasterLandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans overflow-x-hidden selection:bg-[#28B8FA] selection:text-white">
      {/* --- BACKGROUND PATTERN --- */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-200 h-100 bg-[#28B8FA] opacity-[0.08] blur-[120px] rounded-full pointer-events-none z-0"></div>

      <Navbar />

      <main className="relative z-10 pt-32 pb-20">
        <HeroSection />
        <FeaturesSection />
        <GamificationSection />
        <PricingSection />
        <CtaSection />
      </main>

      <Footer />
    </div>
  );
}
