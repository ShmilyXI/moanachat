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
      className="marketing-home fixed inset-0 z-[100] min-h-screen overflow-x-clip overflow-y-auto bg-[#eeede4] text-[#0e2942] md:left-[-16rem] md:right-auto md:w-screen"
      ref={scrollRef}
    >
      <HeroSection />
      <ModelMarquee />
      <div
        className="h-[54px] w-full border-y border-[#bea989]/25 bg-[#eeede4]"
        style={{
          backgroundImage: "url(https://venice.ai/images/divider.svg)",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "auto 54px",
        }}
      />
      <CapabilitiesSection />
      <PricingSection />
      <DeveloperSection />
      <PrivacySection />
      <section className="bg-[#0e2942] px-6 py-28 text-center text-[#eeede4] tablet:py-36">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-[#9bbbd1]">
          Moana AI
        </p>
        <h2 className="font-serif text-4xl leading-tight tablet:text-6xl">
          Create freely. Stay private.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base text-[#eeede4]/65">
          A calm, private space for your ideas, conversations, and creative
          work.
        </p>
        <a
          className="mt-8 inline-flex rounded-full bg-[#eeede4] px-6 py-3 text-sm font-medium text-[#0e2942] transition hover:bg-white"
          href="/chat"
        >
          Start chatting
        </a>
      </section>
      <MarketingFooter />
    </main>
  );
}
