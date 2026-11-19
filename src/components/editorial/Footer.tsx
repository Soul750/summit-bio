"use client";

import { ArrowUp } from "lucide-react";
import { profile } from "@/data/profile";

export function Footer() {
  return (
    <footer className="relative pt-10 pb-14 px-5 sm:px-8">
      <div className="mx-auto max-w-6xl border-t border-[#f3ede2]/12 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <p className="font-display italic text-lg text-[#dfd5c5]">
            {profile.footerNote}
          </p>
          <p className="font-mono text-[11px] tracking-[0.16em] text-[#8f887d]">
            {profile.name} · {profile.elevationLabel}
          </p>
        </div>

        <a
          id="back-to-summit"
          href="#summit"
          className="inline-flex items-center gap-2 rounded-full border border-[#f3ede2]/15 bg-[#0d121d]/60 backdrop-blur-md px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#d6ccb9] hover:text-[#f3ede2] hover:border-[#e49b56]/45 transition-colors"
        >
          <span>Return to Summit</span>
          <ArrowUp className="h-3.5 w-3.5 text-[#e49b56]" />
        </a>
      </div>
    </footer>
  );
}
