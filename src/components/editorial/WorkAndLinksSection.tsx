"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { profile } from "@/data/profile";

interface WorkAndLinksSectionProps {
  reducedMotion: boolean;
}

export function WorkAndLinksSection({
  reducedMotion,
}: WorkAndLinksSectionProps) {
  const revealProps = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 26 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-80px" },
        transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <>
      {/* Selected Work & Projects */}
      <section
        id="selected-work"
        aria-labelledby="work-heading"
        className="relative py-16 sm:py-24 px-5 sm:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <motion.div
            {...revealProps}
            className="alpine-panel rounded-2xl sm:rounded-3xl p-7 sm:p-12 lg:p-14"
          >
            <div className="mb-10">
              <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-[#e49b56] mb-3">
                02 · Selected Work
              </p>
              <h2
                id="work-heading"
                className="font-display text-3xl sm:text-4xl font-light text-[#f5efe4]"
              >
                Writing, studies, and explorations.
              </h2>
            </div>

            <div className="divide-y divide-[#f3ede2]/10">
              {profile.selectedWork.map((work) => {
                const Wrapper = work.href ? "a" : "div";
                const linkProps = work.href
                  ? {
                      href: work.href,
                      target: "_blank",
                      rel: "noopener noreferrer",
                    }
                  : {};

                return (
                  <Wrapper
                    key={work.title}
                    {...linkProps}
                    className="group py-7 first:pt-0 last:pb-0 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6 items-baseline transition-colors"
                  >
                    <span className="md:col-span-2 font-mono text-xs text-[#9c9487] tracking-wider">
                      {work.year}
                    </span>

                    <div className="md:col-span-4">
                      <h3 className="font-display text-2xl sm:text-[1.65rem] font-normal text-[#f3ede2] group-hover:text-[#e49b56] transition-colors inline-flex items-center gap-2">
                        <span>{work.title}</span>
                        {work.href && (
                          <ArrowUpRight className="h-4 w-4 text-[#e49b56]/75 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                        )}
                      </h3>
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#9c9487]">
                        {work.role}
                      </p>
                    </div>

                    <p className="md:col-span-6 text-sm sm:text-[15px] font-light leading-relaxed text-[#c9bfb0]">
                      {work.description}
                    </p>
                  </Wrapper>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Elsewhere — Coming Soon */}
      <section
        id="connect"
        aria-labelledby="connect-heading"
        className="relative py-16 sm:py-24 px-5 sm:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <motion.div
            {...revealProps}
            className="alpine-panel-subtle rounded-2xl sm:rounded-3xl p-7 sm:p-12"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-xl">
                <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-[#e49b56] mb-3">
                  03 · Elsewhere
                </p>
                <h2
                  id="connect-heading"
                  className="font-display text-3xl sm:text-4xl font-light text-[#f5efe4] leading-tight"
                >
                  Coming Soon
                </h2>
                <p className="mt-3 text-sm sm:text-[15px] font-light leading-relaxed text-[#c6bcac]">
                  Contact links, essays, and ways to connect are being gathered
                  and will open here soon.
                </p>
              </div>

              <div className="inline-flex items-center gap-2.5 self-start md:self-center rounded-full border border-[#f3ede2]/15 bg-[#0d121d]/60 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-[#e49b56]">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-[#e49b56]"
                />
                <span>Coming Soon</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
