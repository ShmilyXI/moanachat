import { ArrowDown, Pause } from "lucide-react";
import { Composer } from "./composer";
import { MarketingHeader } from "./marketing-header";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden text-[#0e2942]">
      <video
        aria-hidden
        autoPlay
        className="absolute inset-0 size-full object-cover opacity-55"
        loop
        muted
        playsInline
        preload="metadata"
        src="https://media.venice.ai/assets/lp/video/light-waves.mp4"
      />
      <div className="absolute inset-x-0 bottom-0 h-[30vh] bg-gradient-to-b from-transparent via-[#eeede4]/75 to-[#eeede4]" />
      <MarketingHeader />
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center px-6 pt-16 text-center">
        <div className="mb-5 text-4xl text-[#0e2942]">⌘</div>
        <h1 className="font-serif text-[30px] leading-tight tablet:text-[36px]">
          Ask anything
        </h1>
        <div className="mt-7 w-full">
          <Composer />
        </div>
      </div>
      <a
        className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 text-sm font-medium text-[#1260a2]"
        href="#models"
      >
        Learn more about Moana <ArrowDown className="size-4" />
      </a>
      <button
        aria-label="Pause video"
        className="absolute bottom-6 right-6 z-10 flex size-9 items-center justify-center rounded-full border border-[#0e2942]/10 bg-white/50 text-[#0e2942]/60 backdrop-blur"
        type="button"
      >
        <Pause className="size-4" />
      </button>
    </section>
  );
}
