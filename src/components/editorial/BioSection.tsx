"use client";

import { motion } from "framer-motion";
import { MapPin, Briefcase } from "lucide-react";
import { profile } from "@/data/profile";

interface BioSectionProps {
  reducedMotion: boolean;
}

export function BioSection({ reducedMotion }: BioSectionProps) {
  const revealProps = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-80px" },
        transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <section
      id="life-and-work"
      aria-labelledby="bio-heading"
      className="relative py-24 sm:py-36 px-5 sm:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          {...revealProps}
          className="alpine-panel rounded-2xl sm:rounded-3xl p-7 sm:p-12 lg:p-16"
        >
          {/* Section Header */}
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[#f3ede2]/10 pb-7 mb-10">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-[#e49b56] mb-3">
                01 · {profile.bio.eyebrow}
              </p>
              <h2
                id="bio-heading"
                className="font-display text-3xl sm:text-5xl font-light tracking-[-0.01em] leading-[1.12] text-[#f5efe4] max-w-2xl"
              >
                {profile.bio.heading}
              </h2>
            </div>
          </div>

          {/* Two-Column Editorial Narrative + Context Rail */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            {/* Main Biographical Summary */}
            <div className="lg:col-span-8 space-y-6">
              <p className="text-lg sm:text-xl font-normal leading-relaxed text-[#f2ece1]">
                {profile.bio.lead}
              </p>

              {profile.bio.paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-[15px] sm:text-base font-light leading-[1.85] text-[#cfc5b5]"
                >
                  {paragraph}
                </p>
              ))}

              {/* Editorial Pull Quote */}
              <blockquote className="pt-4 mt-8 border-t border-[#f3ede2]/10">
                <p className="font-display italic text-2xl sm:text-[1.7rem] leading-snug text-[#ebd9bf]">
                  “{profile.bio.pullQuote}”
                </p>
              </blockquote>
            </div>

            {/* Quiet Metadata & Focus Rail */}
            <aside className="lg:col-span-4 space-y-8 lg:border-l lg:border-[#f3ede2]/10 lg:pl-10">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Briefcase className="h-4 w-4 text-[#e49b56] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#9c9487] mb-1">
                      Current Role
                    </p>
                    <p className="text-sm text-[#ebe3d6] leading-relaxed">
                      {profile.currentRole}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-[#e49b56] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#9c9487] mb-1">
                      Based In
                    </p>
                    <p className="text-sm text-[#ebe3d6] leading-relaxed">
                      {profile.location}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-[#f3ede2]/10">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#9c9487] mb-3.5">
                  Focus Areas
                </p>
                <ul className="space-y-2 text-sm text-[#d6ccb9]">
                  {profile.bio.focusAreas.map((area) => (
                    <li key={area} className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="h-1 w-1 rounded-full bg-[#e49b56]/80"
                      />
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>

          {/* Chronological Life & Work Highlights */}
          <div className="mt-14 pt-10 border-t border-[#f3ede2]/10">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#9c9487] mb-7">
              Timeline &amp; Chapters
            </p>

            <ol className="divide-y divide-[#f3ede2]/10">
              {profile.highlights.map((item) => (
                <li
                  key={`${item.period}-${item.title}`}
                  className="py-6 first:pt-0 last:pb-0 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 items-baseline"
                >
                  <span className="md:col-span-3 font-mono text-xs tracking-wider text-[#e49b56]/90">
                    {item.period}
                  </span>
                  <div className="md:col-span-9">
                    <h3 className="text-base sm:text-lg font-medium text-[#f3ede2]">
                      {item.title}
                      <span className="font-normal text-[#a9a091]">
                        {" "}
                        · {item.organization}
                      </span>
                    </h3>
                    <p className="mt-1.5 text-sm font-light leading-relaxed text-[#c6bcac]">
                      {item.summary}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
