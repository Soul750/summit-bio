"use client";

import { motion, type MotionValue, useTransform } from "framer-motion";
import { Sparkles, Mountain } from "lucide-react";
import { profile } from "@/data/profile";

interface NavigationProps {
  scrollYProgress: MotionValue<number>;
  isStaticMode: boolean;
  onToggleStaticMode: () => void;
}

export function Navigation({
  scrollYProgress,
  isStaticMode,
  onToggleStaticMode,
}: NavigationProps) {
  const progressHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-5 sm:pt-7 flex items-center justify-between">
          {/* Editorial Monogram & Name */}
          <a
            id="nav-home-link"
            href="#summit"
            className="pointer-events-auto group flex items-center gap-3 text-[#f3ede2] hover:text-[#e49b56] transition-colors"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#f3ede2]/20 bg-[#0d121d]/65 backdrop-blur-md font-display text-sm tracking-wider text-[#e49b56] group-hover:border-[#e49b56]/50 transition-colors">
              {profile.monogram}
            </span>
            <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-[0.22em] text-[#f3ede2]/85 group-hover:text-[#f3ede2]">
              {profile.name}
            </span>
          </a>

          {/* Primary Navigation & Motion Toggle */}
          <nav
            aria-label="Primary navigation"
            className="pointer-events-auto flex items-center gap-1 sm:gap-2 rounded-full border border-[#f3ede2]/12 bg-[#0d121d]/60 backdrop-blur-md px-2.5 py-1.5"
          >
            <a
              id="nav-bio-link"
              href="#life-and-work"
              className="px-3 py-1 text-xs sm:text-[13px] text-[#d9d0c1] hover:text-[#f3ede2] transition-colors"
            >
              Life &amp; Work
            </a>
            <a
              id="nav-work-link"
              href="#selected-work"
              className="px-3 py-1 text-xs sm:text-[13px] text-[#d9d0c1] hover:text-[#f3ede2] transition-colors"
            >
              Work
            </a>
            <a
              id="nav-connect-link"
              href="#connect"
              className="px-3 py-1 text-xs sm:text-[13px] text-[#d9d0c1] hover:text-[#f3ede2] transition-colors"
            >
              Connect
            </a>

            <span
              aria-hidden="true"
              className="h-3.5 w-px bg-[#f3ede2]/15 mx-1"
            />

            <button
              id="toggle-scene-mode"
              type="button"
              onClick={onToggleStaticMode}
              title={
                isStaticMode
                  ? "Static backdrop active — click to switch to 3D"
                  : "3D mountain scene active — click to switch to static"
              }
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#e8dfd1] hover:text-[#f3ede2] hover:bg-[#f3ede2]/8 transition-colors cursor-pointer"
            >
              {isStaticMode ? (
                <>
                  <Mountain className="h-3 w-3 text-[#9c9487]" />
                  <span className="hidden md:inline">Static</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 text-[#e49b56]" />
                  <span className="hidden md:inline">3D</span>
                </>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Delicate Vertical Ascent Progress Hairline */}
      <div
        aria-hidden="true"
        className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 hidden sm:flex flex-col items-center gap-3 pointer-events-none"
      >
        <div className="relative h-28 w-px bg-[#f3ede2]/15 overflow-hidden">
          <motion.div
            style={{ height: progressHeight }}
            className="w-full bg-[#e49b56]"
          />
        </div>
      </div>
    </>
  );
}
