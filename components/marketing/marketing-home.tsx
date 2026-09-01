"use client";

import Lenis from "lenis";
import { useEffect, useRef } from "react";
import { CapabilitiesSection } from "./capabilities-section";
import { DeveloperSection } from "./developer-section";
import { HeroSection } from "./hero-section";
import { MarketingFooter } from "./marketing-footer";
import { ModelMarquee } from "./model-marquee";
import { PricingSection } from "./pricing-section";
import { PrivacySection } from "./privacy-section";

export function MarketingHome() {
  const scrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const wrapper = scrollRef.current;
    if (!wrapper) {
      return;
    }
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true, wrapper });
    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return (
    <main
      className="marketing-home fixed inset-0 z-[100] min-h-dvh overflow-x-clip overflow-y-auto bg-[var(--color-paper)] text-[var(--color-ink)]"
      ref={scrollRef}
    >
      <HeroSection />
      <ModelMarquee />
      <div className="marketing-divider" />
      <CapabilitiesSection />
      <PricingSection />
      <DeveloperSection />
      <PrivacySection />
      <section className="marketing-closing-cta">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-paper-3)]">
          Moana AI
        </p>
        <h2 className="font-serif text-4xl leading-tight tablet:text-6xl">
          Create freely. Stay private.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base text-[var(--color-paper)]/65">
          A calm, private space for your ideas, conversations, and creative
          work.
        </p>
        <a className="marketing-closing-cta__link" href="/chat">
          Start chatting
        </a>
      </section>
      <MarketingFooter />
    </main>
  );
}
