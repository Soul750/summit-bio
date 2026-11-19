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
  /** Current role, degree track, or focus. */
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
  /** Concise timeline of milestones in your life and studies. */
  highlights: BioHighlight[];
  /** Selected writing, research, or projects you want to feature. */
  selectedWork: FeaturedWork[];
  /** Contact and social links. */
  links: SocialLink[];
  /** Quiet closing line in the footer. */
  footerNote: string;
}

export const profile: ProfileData = {
  name: "Revelle",
  monogram: "R",
  tagline: "Polyglot, Biological Anthropology Student & Vivid Descriptive Writer",
  currentRole: "Undergraduate · B.A. / B.S. in Biological Anthropology",
  location: "Between Languages, Field Notes & Quiet Ridges",
  elevationLabel: "2,840 M · TIMBERLINE OVERLOOK",
  heroEpigraph:
    "Tracing the human story across bone, language, and light—one vivid sentence and open question at a time.",
  seoDescription:
    "Revelle — Polyglot, biological anthropology student, descriptive writer, and philosophical thinker.",

  bio: {
    eyebrow: "Life & Work",
    heading: "Where human origins, language, and vivid prose meet.",
    lead: "I am Revelle—a polyglot currently acquiring my bachelor's degree in biological anthropology, drawn to the deep arc of human evolution, the texture of lived languages, and the quiet discipline of philosophizing.",
    paragraphs: [
      "Studying biological anthropology lets me look at what makes us human from the ground up: anatomy, adaptation, deep time, and the subtle ways biology and culture braid together across generations. Moving between multiple languages has taught me much the same lesson—that every tongue carries its own geometry of thought, its own way of noticing the world.",
      "Outside of my coursework, I love writing descriptive prose meant to paint an unmistakable, living picture in the reader's mind—capturing the chill of dusk air, the weight of ancient stone, or the fleeting cadence of an unhurried conversation. When I am not writing or translating ideas between languages, I am usually lost in philosophical questions about meaning, perception, and our place in the natural world.",
    ],
    pullQuote:
      "To speak many languages, study ancient bones, and linger in philosophy is to ask the same question from three different summits: what does it mean to be here?",
    focusAreas: [
      "Biological Anthropology",
      "Polyglot Studies",
      "Vivid Descriptive Writing",
      "Philosophy & Inquiry",
    ],
  },

  highlights: [
    {
      period: "Present",
      title: "Acquiring Bachelor's Degree",
      organization: "Biological Anthropology",
      summary:
        "Focusing on human evolutionary biology, osteology, biocultural adaptation, and the interplay between deep ancestral history and modern human life.",
    },
    {
      period: "Ongoing",
      title: "Polyglot & Linguistic Explorer",
      organization: "Multilingual Practice",
      summary:
        "Learning and thinking across multiple languages, exploring how syntax, idiom, and sound shape memory, nuance, and worldview.",
    },
    {
      period: "Ongoing",
      title: "Descriptive Writing & Philosophical Essays",
      organization: "Personal Notebooks",
      summary:
        "Crafting sensory, atmospheric passages designed to paint vivid imagery in the mind's eye alongside reflective essays on consciousness, ethics, and wonder.",
    },
  ],

  selectedWork: [
    {
      year: "Notes",
      title: "Sketches in Bone & Light",
      role: "Descriptive Prose",
      description:
        "Short atmospheric vignettes written to evoke texture, weather, and emotion so clearly the reader can step straight inside the scene.",
    },
    {
      year: "Study",
      title: "On Adaptation & Ancestral Footprints",
      role: "Biological Anthropology",
      description:
        "Undergraduate research notes and syntheses examining how environment, migration, and culture shape the human story over millennia.",
    },
    {
      year: "Essays",
      title: "Untranslatable Rooms",
      role: "Languages & Philosophy",
      description:
        "Philosophical reflections gathered across languages—meditations on perception, solitude, and the ideas only certain tongues know how to name.",
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
      handle: "Connect on LinkedIn",
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
      label: "Writing",
      handle: "Field Notes & Essays",
      href: "#life-and-work",
      kind: "website",
    },
  ],

  footerNote: "Written between languages, alpine dusk, and unhurried thought.",
};
