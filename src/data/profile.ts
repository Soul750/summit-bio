/**
 * Personal Biography & Site Configuration
 * ---------------------------------------------------------------------------
 * Edit this file to personalize your name, bio, career highlights, selected
 * work, and social links. All text and links across the site are driven from
 * this single source of truth.
 */

export interface BioHighlight {
  period: string;
  title: string;
  organization: string;
  summary: string;
}

export interface FeaturedWork {
  year: string;
  title: string;
  role: string;
  description: string;
  href?: string;
}

export interface SocialLink {
  label: string;
  handle: string;
  href: string;
  kind: "github" | "linkedin" | "email" | "website" | "x";
}

export interface ProfileData {
  /** Your full name (displayed in the hero, navigation, and metadata). */
  name: string;
  /** Short monogram or initials for subtle editorial accents. */
  monogram: string;
  /** Concise one-line positioning statement beneath your name. */
  tagline: string;
  /** Current role and company/studio. */
  currentRole: string;
  /** City, region, or alpine coordinates. */
  location: string;
  /** Poetic elevation label shown in the summit HUD. */
  elevationLabel: string;
  /** Short opening epigraph on the hero screen. */
  heroEpigraph: string;
  /** SEO description for search engines and link previews. */
  seoDescription: string;
  /** Main "Life & Work" biographical narrative. */
  bio: {
    eyebrow: string;
    heading: string;
    lead: string;
    paragraphs: string[];
    pullQuote: string;
    focusAreas: string[];
  };
  /** Concise timeline of milestones in your life and career. */
  highlights: BioHighlight[];
  /** Selected projects, research, or writing you want to feature. */
  selectedWork: FeaturedWork[];
  /** Contact and social links. */
  links: SocialLink[];
  /** Quiet closing line in the footer. */
  footerNote: string;
}

export const profile: ProfileData = {
  name: "Your Name",
  monogram: "YN",
  tagline: "Engineer, Designer & Builder of Quiet, Enduring Systems",
  currentRole: "Staff Software Engineer · Independent Studio",
  location: "Pacific Northwest · 47.6° N, 122.3° W",
  elevationLabel: "2,840 M · TIMBERLINE OVERLOOK",
  heroEpigraph:
    "Notes from the ridge — on craft, technology, and building things meant to outlast the noise.",
  seoDescription:
    "Personal biography and selected work — set atop a golden-hour alpine peak with a weeping tree at the summit.",

  bio: {
    eyebrow: "Life & Work",
    heading: "Between the treeline and the tools we shape.",
    lead: "I am a software engineer and creative technologist drawn to the intersection of thoughtful systems, tactile interfaces, and calm, human-scale design.",
    paragraphs: [
      "Over the past decade, my work has spanned distributed infrastructure, interactive graphics, and product engineering—helping small teams turn ambitious ideas into software that feels effortless, fast, and enduring. Replace these paragraphs in src/data/profile.ts with your own story, origins, and what drives your craft today.",
      "Outside of work, I spend my time on high mountain trails, studying how light shifts across granite ridges at dusk, reading essays on architecture and ecology, and sketching small experiments in WebGL and typography.",
    ],
    pullQuote:
      "Good work, like a tree at the timberline, bends with the wind without losing its roots.",
    focusAreas: [
      "Systems Architecture",
      "Creative Engineering",
      "Interface Craft",
      "Real-Time Graphics",
    ],
  },

  highlights: [
    {
      period: "2023 — Present",
      title: "Principal / Staff Engineer",
      organization: "Your Current Company or Studio",
      summary:
        "Leading architecture and interface engineering for flagship web applications, balancing performance with expressive visual craft.",
    },
    {
      period: "2020 — 2023",
      title: "Senior Product Engineer",
      organization: "Previous Organization",
      summary:
        "Built core collaborative tools, real-time data visualizations, and design systems used by tens of thousands of people daily.",
    },
    {
      period: "2017 — 2020",
      title: "Software Engineer & Researcher",
      organization: "Early Career / Lab",
      summary:
        "Explored human-computer interaction, graphics pipelines, and developer tooling from prototype to production.",
    },
  ],

  selectedWork: [
    {
      year: "2025",
      title: "Atlas of Quiet Interfaces",
      role: "Creator & Author",
      description:
        "An interactive essay series and component study on calm typography, motion physics, and atmospheric web graphics.",
      href: "https://github.com/Soul750",
    },
    {
      year: "2024",
      title: "Timberline Engine",
      role: "Lead Engineer",
      description:
        "Lightweight procedural terrain and foliage shader toolkit built for responsive browser experiences on constrained devices.",
      href: "https://github.com/Soul750",
    },
    {
      year: "2023",
      title: "Field Notes & Open Source",
      role: "Maintainer",
      description:
        "A collection of small utilities, TypeScript libraries, and technical notes shared openly with the developer community.",
      href: "https://github.com/Soul750",
    },
  ],

  links: [
    {
      label: "GitHub",
      handle: "@Soul750",
      href: "https://github.com/Soul750",
      kind: "github",
    },
    {
      label: "LinkedIn",
      handle: "in/your-handle",
      href: "https://linkedin.com",
      kind: "linkedin",
    },
    {
      label: "Email",
      handle: "hello@yourdomain.com",
      href: "mailto:hello@yourdomain.com",
      kind: "email",
    },
    {
      label: "Journal",
      handle: "yourdomain.com",
      href: "https://github.com/Soul750/summit-bio",
      kind: "website",
    },
  ],

  footerNote: "Crafted in the quiet hours between golden hour and twilight.",
};
