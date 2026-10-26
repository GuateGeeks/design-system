# GuateGeeks Design Lab — design

Date: 2026-10-25 · Status: draft for approval

## 1. Intent

This repository becomes the **GuateGeeks Design Lab**: the one place where the look, feel and
interaction of every GuateGeeks product is decided, built, proven and packaged.

It is not just a component library. It is a laboratory whose **outputs are well defined** and
whose outputs are the **inputs of every product** (guategeeks.github.io, Socrates, the cotizador,
and future web and React Native apps). Agents working inside a product must be able to pick up
those outputs — packages, skills, guides, prompts and context — and implement or update the
design without anyone re-explaining the brand.

Why: today the three sources drift. The main page and Socrates share the brand palette (coral
`#ef8556`, sky `#5fbad6`, plum `#685599`, Inter), but each implements it differently (Tailwind v4
`@theme` vs hand-written CSS variables), and the cotizador uses its own plum `#6942a1`, orange
action `#ff9d38` and Avenir. GuateGeeks also wants to innovate with special experiences — Ada
Lovelace Day, Halloween, space, gaming, low-poly 3D — and switching those on must be a change of
inputs, not a redesign of each product.

Success looks like:

- A product can switch to "Halloween 2026" by changing one value, live, with no rebuild, and
  stay accessible.
- An agent in another repo can adopt or upgrade the design by following the lab's skill, and
  verify it with the lab's checklist.
- The lab shows every output under every theme, light and dark, phone and desktop — so a theme
  is proven before any product receives it.
- The cotizador's 3D campus and its interactivity live here as a reusable, themeable 3D kit.

## 2. Goals, non-goals, anti-goals

**Goals**

1. Define a **standard stack** that GuateGeeks products will adhere to over time.
2. Produce versioned outputs in four layers — **tokens, themes, variant contracts, editions** —
   plus **UI and 3D kits** and an **agent pack**.
3. A lab app (gallery + studio + experiences) that consumes exactly the same built outputs that
   products receive.
4. Extract the cotizador's 3D experience and interactivity into a TypeScript 3D kit with a React
   wrapper, and rebuild the campus as the lab's first reference experience.
5. Web first; React Native gets token/theme outputs now and a native kit later.

**Non-goals (this project)**

- Migrating the products themselves. Adoption happens later, per product, using the agent pack.
- The cotizador's commercial logic: pricing engine (`motor.js`, `config.js`), PDF proposals,
  quote state. They stay in the cotizador repo.
- A React Native component kit (only when the first RN app exists).
- A backend, CMS or runtime theme server.
- Storybook.

**Anti-goals (failure even if it "works")**

- A theme that can break a product's logic or fail contrast / reduced-motion checks.
- The lab showing something products can't get: the lab must import the published packages'
  build output, never private copies.
- Hard-coded colors, durations or fonts inside components or the 3D kit.
- Products paying for 3D (Three.js) when they don't use it: 3D stays in its own package, lazily
  loaded.
- Agent docs that describe a different system than the code (docs are tested where possible).

## 3. Standard stack

| Concern | Standard | Origin / reason |
|---|---|---|
| Language | TypeScript (strict) | — |
| Build / dev | Vite; npm workspaces monorepo | All sources already use Vite/esbuild and npm |
| UI framework | React 19 | Page and Socrates |
| Styling | Tailwind CSS v4, reading tokens as CSS custom properties | Page uses Tailwind v4; Socrates uses CSS-variable tokens |
| Token source | W3C Design Tokens (DTCG) JSON, built with Style Dictionary v4 | One source, many targets |
| Accessible primitives | Radix UI primitives, styled with tokens | Don't hand-roll focus, menus, dialogs |
| UI motion | Motion (motion.dev) + WAAPI presets | Socrates motion system |
| Timelines | GSAP (lazy) | Socrates engine registry |
| Characters | Rive (lazy); Geeky from GuateGeeks/geeky-animation | Socrates, cotizador |
| 3D | Three.js; React wrapper on react-three-fiber (+ drei where useful) | Page uses R3F; cotizador engine is Three.js |
| Icons | Lucide | Socrates |
| Fonts | Inter (OFL) for UI and display in the brand theme; themes may add a display font | Page and Socrates portal both moved to Inter |
| Unit tests | Vitest | — |
| Browser / visual tests | Playwright (screenshots per component × theme × scheme × viewport) | All sources use Playwright or Puppeteer |
| Versioning | Changesets, semver per package | — |
| Mobile | Responsive web / PWA on the stack above; React Native via Expo + NativeWind when needed | User decision |
| Lab hosting | GitHub Pages via GitHub Actions | Same as the other GuateGeeks sites |

Products adopt this stack over time; the lab's adoption guides describe the path from each
product's current stack.

## 4. Output model (the contract)

Four design layers, each with a fixed format, a version and a validator.

### 4.1 Tokens

- **Primitives**: raw palettes and scales (coral 100–900, sky, plum, success, error, neutral
  grays; type scale; spacing 4-based; radii; elevation; durations; easings; z-index; breakpoints).
- **Semantic tokens**: roles that components use — `color.action`, `color.on-action`,
  `color.link`, `color.surface`, `color.surface-2`, `color.ink`, `color.ink-muted`, `color.line`,
  `color.focus`, `color.ok|bad|hint` (+ `-soft`), `motion.feedback`, `radius.control`,
  `space.gutter`, `tap.min`, etc. Components may **only** reference semantic tokens.
- Light and dark values for every color role.
- Build targets: `tokens.css` (custom properties), `tailwind.css` (Tailwind v4 `@theme`
  mapping to the variables), `tokens.ts` (typed values + names), `tokens.native.ts` (React
  Native objects), `tokens.json` (resolved, for agents and tools).

Brand values, resolving the current drift:

- Palette from guategeeks.github.io `src/index.css` (already adopted by Socrates `tokens.css`).
- Primary action: coral fill with dark ink (`#1e2233`); links and white-on-color fills use coral
  dark `#a34825` for contrast (Socrates rule). Hero/highlight: plum with white.
- Dark scheme: start from Socrates' dark values.
- The cotizador's `#6942a1`, `#ff9d38` and Avenir are **not** brand; they are mapped to brand
  roles when the cotizador adopts the system.
- Motion tokens from Socrates `motion.ts`: durations instant 100 / fast 150 / base 240 /
  slow 420 / epic 900 ms; easings standard, responsive, enter, exit, spring.
- `tap.min` 44px default; an `audience: kids` token set raises it to 48px (Socrates).

### 4.2 Themes — how it looks, sounds and feels

A theme never changes logic, so it is always safe to apply.

A theme is a folder with a `theme.json` manifest:

```jsonc
{
  "id": "halloween",
  "name": "Halloween",
  "extends": "guategeeks",            // inherit everything not overridden
  "schemes": ["dark"],                // which color schemes it supports; forced if only one
  "tokens": { "light": { … }, "dark": { … } },   // semantic/primitive overrides (DTCG)
  "fonts": { "display": { "family": "…", "source": "…" } },
  "motion": { "intensity": "playful" },            // calm | standard | playful → scales motion tokens
  "audio": { "success": "assets/ok.mp3", … },      // optional, always muted by default
  "three": { "materialProfile": "lowpoly", "palette": { … }, "lighting": "moonlit" },
  "mascot": { "costume": "pumpkin" },
  "assets": { "texture.noise": "assets/…" }
}
```

Built outputs: a CSS block scoped to `[data-theme="<id>"]` (with scheme sub-blocks), a typed TS
manifest, a React Native object, and an asset folder. Validators: every semantic color role
resolved; WCAG 2.2 AA contrast for all text/background role pairs in each scheme; motion
intensity respects reduced motion.

Initial themes: `guategeeks` (brand, default, light + dark), `halloween`, `ada-lovelace`,
`space`, `gaming`, `lowpoly`.

### 4.3 Variants — how an experience behaves or is structured

Structural change goes through **extension points** that a product chooses to expose. Each
extension point has an id, a list of allowed values, a default, and a contract (the props/data it
receives and what it must render or do). A product that doesn't expose a point ignores requests
for it; nothing breaks.

Initial extension points:

| Point | Values | Notes |
|---|---|---|
| `background` | `flat`, `gradient-blobs`, `starfield`, `lowpoly-world`, `paper-campus` | Page hero blobs, space, 3D |
| `progress` | `bar`, `xp-levels`, `constellation`, `punch-cards` | Same data contract (value, max, milestones) |
| `celebration` | `confetti`, `pumpkins`, `stars`, `none` | Fired by the `reward` motion semantic |
| `mascot-presence` | `hidden`, `corner`, `companion` | Geeky |
| `cursor-fx` | `none`, `trail`, `spotlight` | Desktop only; off with reduced motion |

Each value is a component (or 3D module) in the kits, registered under its point. The lab shows
every point with every value.

### 4.4 Editions — the easy button

An edition is a named bundle: a theme + the variant values it requests + content (copy, Geeky
lines) + an optional date window.

```jsonc
{
  "id": "ada-lovelace-2026",
  "theme": "ada-lovelace",
  "variants": { "progress": "punch-cards", "celebration": "stars" },
  "content": { "es": { "banner": "…", "geeky": ["…"] } },
  "window": { "from": "2026-10-13", "to": "2026-10-15", "tz": "America/Guatemala" }
}
```

Resolution at runtime: explicit user/product choice > URL override (`?edition=`, for previews) >
active date window > product default. Users can always opt out back to the brand theme.

### 4.5 Runtime

`@guategeeks/theme-runtime`: a framework-agnostic core plus React bindings.

- Sets `data-theme`, `data-scheme` (light/dark/auto), `data-motion` (full/reduced) on `<html>`;
  CSS does the rest, so switching is live and needs no rebuild.
- `ThemeProvider`, `useTheme()`, `useVariant(point)`, `useEdition()`; edition resolution as above.
- Reduced motion = OS preference OR app setting (Socrates behavior).
- Lazy-loads theme fonts/assets only when a theme is active.

## 5. Packages and repository layout

```
packages/
  tokens/          @guategeeks/tokens        DTCG source + Style Dictionary build
  themes/          @guategeeks/themes        theme folders, editions, build + validators
  theme-runtime/   @guategeeks/theme-runtime core + React bindings
  motion/          @guategeeks/motion        motion tokens → semantic presets, engine registry
  ui/              @guategeeks/ui            React + Radix + Tailwind components, variant values
  three/           @guategeeks/three         3D engine (TS, imperative) + /react wrapper + papercraft kit
  mascot/          @guategeeks/mascot        Geeky 2D player + 3D model, costumes (vendored with provenance)
apps/
  lab/                                       the lab: gallery, studio, experiences (deployed to Pages)
agent-pack/                                  skills, guides, prompts, context (also a Claude Code plugin)
docs/                                        architecture, decisions (ADRs), specs, plans
```

`@guategeeks/ui` initial components: Button, IconButton, Link, Card, Badge/Chip, Tabs,
SegmentedControl, Dialog / BottomSheet (sheet on phones), Tooltip, Toast, TextField,
NumberStepper, Toggle/Switch, Select, Progress (variant point), AppShell (sidebar on desktop,
bottom nav on phones), GlassPanel/HUD, EmptyState. Every component: semantic tokens only,
keyboard and screen-reader support, reduced-motion behavior, documented spec (behavior, states,
a11y, theming hooks) written so a React Native implementation can follow it later.

## 6. The 3D kit (`@guategeeks/three`) — extracted from the cotizador

Approach (decided): **port the engine to TypeScript, keep it imperative, wrap it for React.**
The cotizador's code (`asesor/lab/`, ~7.7k lines) moves over with minimal behavioral change;
colors, materials, lighting and motion come from the active theme instead of constants.

**Engine core (generic)**, from `campus-scene.js`, `campus-kit.js`, `paper/scene-*.js`:

- Render on demand: build → run activity for a bounded time → rest without requesting frames.
- Entity diffing: stable keys + content signatures; rebuild only what changed, dispose what left.
- Quality governor: 30 FPS cap for visible activity; drop to "eco" (no shadow map, pixel ratio 1)
  when frame intervals stay above ~75 ms; suspend when paused, reduced motion, off-screen or tab
  hidden.
- Camera rig with named views, overview/focus/reset, pause; shared controls for desktop and touch.
- Focus / X-ray: translucent roof/upper floors/near wall and occluder hiding when focusing a
  room, using the shared index and glass material (no extra buffers).
- Staged build animation (floor → walls rise → furniture → roof drops with bounce → people;
  130 ms stagger, 500 ms per part); only new parts animate.
- Picking/selection emitting typed events; focus-reveal camera approach.
- Budgets enforced: ≤ 40,000 triangles, ≤ 150 draw calls, ≤ 10 materials (cotizador values).
- Rig / rigid skinning utilities, deterministic hash/pick helpers, easing helpers.

**Papercraft kit**: `paper/kit.js`, `material.js` (cardstock shader with fibre/mottle),
`pieces-*.js` (rooms, furniture, tech, nature, people, links), `compose.js`, catalog, people
contract and budgets. Its colors become a theme **material profile** (`papercraft`); a
`lowpoly` profile is added for the low-poly theme.

**Geeky 3D**: `campus-geeky.js` + embedded model → `@guategeeks/mascot` (3D), with provenance.

**Interactivity patterns** captured as lab patterns and UI components: glass HUD with title and
tools (overview, active item, reset, pause, close); live counters; expandable legend; selection
opening the related configuration; contextual feedback entry (380 ms); text summary as the
non-3D alternative (always present, also used with reduced motion or no WebGL).

**React wrapper** (`@guategeeks/three/react`): the engine works against a renderer, scene and
camera handed to it. The R3F wrapper supplies them via `useThree`, uses `frameloop="demand"` and
`invalidate()`, and exposes engine events as props. A plain `mountScene(container, options)` is
also exported for non-React hosts (the cotizador can use it before migrating).

**Campus reference experience** (in the lab, not in the kit core): `plan.js` (`planCampus`,
deterministic growth rules) and `campus-layout.js` move under `apps/lab/experiences/campus/`,
driven by a demo configurator (levels, students, programs) — the "configure → live 3D →
contextual feedback" pattern. No prices.

**Port parity**: the cotizador's tests for the planner, kit, people contract and campus
(`asesor/test/paper-plan`, `campus`, `campus-experience`, `people-contract`, `primaria-r2`)
are ported and must pass; budgets are asserted in tests.

The cotizador repo itself is not changed by this project.

## 7. The lab app (`apps/lab`)

Sections:

1. **Foundations** — token browser (primitives + semantic, per theme and scheme), type scale,
   spacing, radii, motion tokens with live demos, contrast matrix.
2. **Components** — every component, every state; global toolbar to switch theme, scheme,
   motion (full/reduced), viewport (phone/tablet/desktop frame) and edition.
3. **Theme studio** — pick a theme, edit token overrides live, see contrast validation and the
   component gallery update, export the resulting `theme.json` (copy/download) for a PR.
4. **Variants** — each extension point with each value, side by side.
5. **Editions** — list, preview, date windows on a calendar.
6. **3D kit** — material profiles, pieces catalog, inspector (ported from the cotizador's
   inspector), budget readouts.
7. **Experiences** — reference experiences built only with the system: **Campus** (from the
   cotizador) and **GuateGeeks landing** (the main page's hero, services, programs and contact
   sections rebuilt with the system to prove it).
8. **Agent pack** — browse skills, guides, prompts; copy install instructions.

The lab's UI copy is Spanish (GuateGeeks' audience); code, package docs and the agent pack are
in English. *(Builder's call — see §10.)*

## 8. Agent pack (`agent-pack/`)

The agent pack is how outputs become inputs in other repos.

- **Context**: `CONTEXT.md` (brand principles, voice, what the layers are, rules such as
  "semantic tokens only"), `llms.txt` index, the resolved `tokens.json` and theme manifests.
- **Skills** (Claude Code `SKILL.md` format, also usable as plain guides by other agents):
  - `adopt-guategeeks-design` — install packages, wire runtime and Tailwind, replace hard-coded
    values, verify.
  - `sync-guategeeks-design` — upgrade to a new version, read changesets, apply migrations, verify.
  - `create-theme`, `create-edition`, `add-variant-point` — for work inside the lab.
  - `audit-design-adherence` — scan a product for drift (hard-coded colors, raw durations,
    non-semantic tokens, missing reduced-motion) and report.
  - `build-3d-experience` — use `@guategeeks/three` patterns and budgets.
- **Guides**: per-product adoption paths (guategeeks.github.io: Tailwind v4 theme swap;
  Socrates: map `--c-*` tokens to semantic tokens; cotizador: brand mapping + `mountScene`).
- **Prompts**: reusable prompts for designing a new theme, a new edition, a new experience.
- **Checklists**: definition of done for adopting, theming, and 3D.
- Distributed as a **Claude Code plugin** from this repo (`.claude-plugin/marketplace.json`), so
  agents in product repos can install it; plain files remain readable by any agent.

## 9. Quality gates

- Token and theme builds are deterministic; validators fail the build on missing roles or
  contrast failures.
- Vitest unit tests for runtime, edition resolution, motion presets, engine utilities, planner.
- Playwright: component screenshots per theme × scheme × motion × viewport; lab smoke tests;
  3D campus states (ported from the cotizador's browser checks).
- Budgets: per-package bundle size (UI core small; three/mascot lazy), 3D triangle/draw-call/
  material budgets.
- Accessibility: axe checks on the gallery; keyboard paths for every component.
- CI on every PR; lab deployed to GitHub Pages from `main`.

## 10. Phases

Order agreed with the approach; each phase ends with a working lab deploy.

1. **Foundation** — monorepo, tooling, CI, Pages; tokens package; themes package with the
   `guategeeks` brand theme + `halloween` as a proof of switching; theme runtime; motion;
   core UI components; lab sections 1–3; agent pack v0 (context + `adopt` + `create-theme`).
2. **3D** — port the engine and papercraft kit; React wrapper and `mountScene`; Campus
   reference experience; 3D kit section; `lowpoly` profile; Geeky 3D.
3. **Editions** — themes `ada-lovelace`, `space`, `gaming`, `lowpoly`; variant points and their
   values; editions; lab sections 4–5; GuateGeeks landing reference experience.
4. **Adoption** — agent pack complete (sync, audit, 3D skill, per-product guides, checklists),
   plugin distribution, release v1.0 of the packages.

## 11. Decided vs left to the builder

**Decided in conversation**

- The lab is the source of truth; outputs are defined and versioned; products consume them as
  inputs; agents use the agent pack to implement and sync.
- One standard stack (§3); products migrate to it later.
- Mobile = web technology or React Native; web first; RN gets token/theme outputs now.
- Separate layers: themes (look/sound/feel) vs variants (structure/behavior via extension
  points) vs editions (bundles).
- Cotizador: extract the 3D experience and its interactivity; port to TS, keep imperative,
  React wrapper.
- Licensing: code ported from Socrates (private repo), the cotizador and geeky-animation may be
  published here under this repo's Apache-2.0 license. Ported files keep a provenance note
  (source repo, path, commit).

**My calls (to confirm when reading)**

- Brand palette from the main page; Inter for everything in the brand theme; Socrates dark
  values and motion tokens as the starting point.
- Radix, Lucide, Style Dictionary, Changesets, Vitest, Playwright; npm workspaces.
- Lab UI copy in Spanish; code and agent docs in English.
- Agent pack distributed as a Claude Code plugin from this repo.
- `halloween` as the phase-1 proof theme.
- Fonts self-hosted through Fontsource packages (no runtime font CDN), so products can keep a
  strict CSP like GuateGeeks Maker Tools.
- The package registry is decided in phase 4 (default: public npm under `@guategeeks`); phases
  1–3 consume packages inside the monorepo only.

**Left to the builder**

- Internal file structure within packages, naming of internal modules.
- Exact component API shapes, within the rules above.
- How the lab's viewport frames and toolbar look, within the brand.
- Which cotizador internals are split into "engine core" vs "papercraft kit" at the line level.
