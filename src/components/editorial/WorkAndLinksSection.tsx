"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Mail, Globe, Compass } from "lucide-react";
import { profile, type SocialLink } from "@/data/profile";

interface WorkAndLinksSectionProps {
  reducedMotion: boolean;
}

function getLinkBadge(kind: SocialLink["kind"]) {
  switch (kind) {
    case "email":
      return <Mail className="h-4 w-4 text-[#e49b56]" />;
    case "website":
      return <Globe className="h-4 w-4 text-[#e49b56]" />;
    default:
      return <Compass className="h-4 w-4 text-[#e49b56]" />;
  }
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
                Projects, systems, and field notes.
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

      {/* Connect & Links */}
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              <div className="lg:col-span-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-[#e49b56] mb-3">
                  03 · Elsewhere
                </p>
                <h2
                  id="connect-heading"
                  className="font-display text-3xl sm:text-4xl font-light text-[#f5efe4] leading-tight"
                >
                  Always glad to hear from thoughtful people.
                </h2>
                <p className="mt-4 text-sm sm:text-[15px] font-light leading-relaxed text-[#c6bcac]">
                  Whether you want to talk about engineering, collaborate on a
                  quietly ambitious idea, or simply trade trail notes, feel free
                  to reach out.
                </p>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {profile.links.map((link) => {
                  const isExternal = !link.href.startsWith("mailto:");
                  return (
                    <a
                      key={link.label}
                      id={`social-link-${link.kind}`}
                      href={link.href}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      className="group flex items-center justify-between rounded-xl border border-[#f3ede2]/12 bg-[#0d121d]/55 px-5 py-4 hover:border-[#e49b56]/45 hover:bg-[#141c2c]/70 transition-all"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {getLinkBadge(link.kind)}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#f3ede2] group-hover:text-[#e49b56] transition-colors">
                            {link.label}
                          </p>
                          <p className="font-mono text-[11px] text-[#9c9487] truncate">
                            {link.handle}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-[#9c9487] group-hover:text-[#e49b56] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
