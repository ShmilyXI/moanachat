"use client";

import { ArrowDown, Pause, Play } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Composer } from "./composer";
import { MarketingHeader } from "./marketing-header";
import { MoanaMark } from "./moana-mark";

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setIsPlaying(false);
    }
  }, [reducedMotion]);

  const toggleVideo = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (video.paused) {
      void video.play().catch(() => {
        setIsPlaying(false);
      });
      return;
    }

    video.pause();
  };

  return (
    <section className="marketing-hero">
      <video
        aria-hidden
        autoPlay={reducedMotion !== true}
        className="marketing-hero__video"
        loop
        muted
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        playsInline
        preload="metadata"
        ref={videoRef}
        src="https://media.venice.ai/assets/lp/video/light-waves.mp4"
      />
      <div aria-hidden className="marketing-hero__fade" />
      <MarketingHeader />
      <div className="marketing-hero__content">
        <MoanaMark className="marketing-hero__mark" />
        <h1 className="marketing-hero__title">Ask anything</h1>
        <div className="marketing-hero__composer-wrap mt-6 w-full">
          <Composer />
        </div>
      </div>
      <a className="marketing-hero__learn" href="#models">
        Learn more about Moana <ArrowDown className="size-4" />
      </a>
      <button
        aria-label={isPlaying ? "Pause video" : "Play video"}
        className="marketing-hero__pause"
        onClick={toggleVideo}
        type="button"
      >
        {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
      </button>
    </section>
  );
}
