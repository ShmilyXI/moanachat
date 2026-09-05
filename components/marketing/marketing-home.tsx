"use client";

import Lenis from "lenis";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { CapabilitiesSection } from "./capabilities-section";
import { Composer } from "./composer";
import { DeveloperSection } from "./developer-section";
import { HeroSection } from "./hero-section";
import { MarketingFooter } from "./marketing-footer";
import { ModelMarquee } from "./model-marquee";
import { PricingSection } from "./pricing-section";
import { PrivacySection } from "./privacy-section";

export function MarketingHome() {
  const scrollRef = useRef<HTMLElement>(null);
  const { data: session, status } = useSession();
  // Guest sessions are auto-created for first-time visitors; only real
  // sign-ins should swap the sign-up CTA for an app entry.
  const signedIn =
    status === "authenticated" && session?.user?.type === "regular";

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
        <div className="marketing-closing-cta__inner">
          <h2>
            Create freely. <span>Stay private.</span>
          </h2>
          <p>
            A calm, private space for your ideas, conversations, and creative
            work.
          </p>
          <div className="marketing-closing-cta__composer">
            <Composer showPresets={false} />
          </div>
          <div className="marketing-closing-cta__actions">
            <a
              className="marketing-closing-cta__link"
              data-testid="closing-cta-primary"
              href={signedIn ? "/chat" : "/sign-up"}
            >
              {signedIn ? "Open app" : "Sign up for free"}
            </a>
            <a className="marketing-closing-cta__secondary-link" href="#pricing">
              View pricing
            </a>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
