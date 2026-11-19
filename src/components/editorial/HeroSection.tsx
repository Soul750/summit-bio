"use client";

import { motion, type MotionValue, useTransform } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { profile } from "@/data/profile";

interface HeroSectionProps {
  scrollYProgress: MotionValue<number>;
  reducedMotion: boolean;
}

export function HeroSection({
  scrollYProgress,
  reducedMotion,
}: HeroSectionProps) {
  const titleY = useTransform(scrollYProgress, [0, 0.28], [0, reducedMotion ? 0 : -56]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.24], [1, 0]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  return (
    <section
      id="summit"
      className="relative min-h-[100svh] flex flex-col justify-end pb-14 sm:pb-20 pt-28 px-5 sm:px-8"
    >
      <motion.div
        style={{ y: titleY, opacity: titleOpacity }}
        className="mx-auto w-full max-w-6xl"
      >
        <div className="max-w-2xl">
          {/* Subtle Elevation Coordinate */}
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-[#e49b56]/90 mb-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]">
            {profile.elevationLabel}
          </p>

          {/* Editorial Display Name */}
          <h1 className="font-display text-5xl sm:text-7xl md:text-[5.25rem] font-light tracking-[-0.015em] leading-[1.02] text-[#f7f2e8] drop-shadow-[0_6px_28px_rgba(8,11,18,0.72)]">
            {profile.name}
          </h1>

          {/* Positioning Tagline */}
          <p className="mt-5 text-base sm:text-xl font-light leading-relaxed text-[#e6ddd0] max-w-xl drop-shadow-[0_3px_18px_rgba(8,11,18,0.82)]">
            {profile.tagline}
          </p>

          {/* Quiet Epigraph */}
          <p className="mt-4 font-display italic text-lg sm:text-xl text-[#cfc3b1]/90 max-w-lg drop-shadow-[0_2px_14px_rgba(8,11,18,0.85)]">
            “{profile.heroEpigraph}”
          </p>
        </div>
      </motion.div>

      {/* Scroll Cue */}
      <motion.a
        id="hero-scroll-cue"
        href="#life-and-work"
        style={{ opacity: cueOpacity }}
        className="mx-auto mt-12 sm:mt-14 flex flex-col items-center gap-2.5 text-[#dfd5c5]/80 hover:text-[#f3ede2] transition-colors group"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.28em]">
          Scroll to Explore
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f3ede2]/20 bg-[#0d121d]/45 backdrop-blur-sm group-hover:border-[#e49b56]/50 transition-colors">
          <ArrowDown className="h-3.5 w-3.5 text-[#e49b56] animate-bounce" />
        </span>
      </motion.a>
    </section>
  );
}
