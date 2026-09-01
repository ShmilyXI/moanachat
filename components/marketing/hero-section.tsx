import { ArrowDown, Pause } from "lucide-react";
import { Composer } from "./composer";
import { MarketingHeader } from "./marketing-header";

export function HeroSection() {
  return (
    <section className="marketing-hero">
      <video
        aria-hidden
        autoPlay
        className="marketing-hero__video"
        loop
        muted
        playsInline
        preload="metadata"
        src="https://media.venice.ai/assets/lp/video/light-waves.mp4"
      />
      <div aria-hidden className="marketing-hero__fade" />
      <MarketingHeader />
      <div className="marketing-hero__content">
        <div aria-hidden className="marketing-hero__mark">
          ⌘
        </div>
        <h1 className="marketing-hero__title">Ask anything</h1>
        <div className="mt-7 w-full">
          <Composer />
        </div>
      </div>
      <a className="marketing-hero__learn" href="#models">
        Learn more about Moana <ArrowDown className="size-4" />
      </a>
      <button
        aria-label="Pause video"
        className="marketing-hero__pause"
        type="button"
      >
        <Pause className="size-4" />
      </button>
    </section>
  );
}
