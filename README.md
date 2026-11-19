# Summit Bio

A modern, responsive biographical website set atop a golden-hour alpine peak with a procedural 3D weeping tree, layered foreground overlook elements, custom GLSL atmospheric shaders, and scroll-driven camera & lighting choreography.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/import?s=https://github.com/Soul750/summit-bio)

## Features

- **Custom 3D Alpine Scene (`Three.js` / `@react-three/fiber` / GLSL):**
  - Procedural golden-hour → twilight sky dome with Mie sun scattering and emerging stars
  - Sculpted multi-layer mountain ridges with alpenglow rim lighting and atmospheric perspective
  - Procedural gnarled weeping tree at the summit with custom GLSL wind- & scroll-reactive drooping foliage
  - Foreground alpine boulders, weathered trail marker post, stone cairn, swaying grasses, wildflowers, and drifting light motes / windblown leaves
- **Scroll Choreography (`Framer Motion`):**
  - Smooth camera framing, sun elevation, sky twilight transition, and foliage breeze synced to scroll progress
- **Performance & Accessibility:**
  - Adaptive DPR and geometry scaling for mobile / low-power devices
  - Automatic `prefers-reduced-motion` detection + manual **Calm / 3D** toggle
  - React Error Boundary and WebGL context-loss fallback to a layered static alpine SVG scene

## Personalizing Your Biography

All personal copy, milestones, selected work, and links live in a single strongly typed configuration file:

- **`src/data/profile.ts`** — Update your name, tagline, current role, location, biographical summary paragraphs, pull quote, career highlights, featured projects, and social links.
- **`src/app/layout.tsx`** — Metadata automatically reads from `src/data/profile.ts`.
- **`src/app/globals.css`** — Color tokens and editorial glass panel styles.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Deploying to Vercel

Click the **Deploy with Vercel** button above or import `https://github.com/Soul750/summit-bio` in the [Vercel Dashboard](https://vercel.com/new). Vercel automatically detects Next.js (`vercel.json` is preconfigured) and deploys every push to `main`.
