# GuateGeeks Design Lab — agent notes

The lab where GuateGeeks' design system is decided, built and proven. Its packages are the inputs of every GuateGeeks product.

- Spec (why and what): `docs/superpowers/specs/2026-10-25-guategeeks-design-lab-design.md`
- Plans (how, per phase): `docs/superpowers/plans/`
- Context for agents working in *product* repos: `agent-pack/CONTEXT.md` (shipped as the `guategeeks-design` Claude Code plugin)

## Layout

| Path | What |
|---|---|
| `packages/tokens` | DTCG token source (`src/source`) → `dist/css/tokens.css`, `dist/css/tailwind.css`, `dist/tokens.json`, generated TS/native |
| `packages/themes` | Theme manifests (`themes/<id>/theme.json`), editions (`editions/*.json`), build + contrast validation |
| `packages/theme-runtime` | Controller that sets `data-theme` / `data-scheme` / `data-motion` on `<html>`; React bindings in `/react` |
| `packages/motion` | Motion presets and semantics (ported from Socrates), theme-aware durations |
| `packages/ui` | React + Radix + Tailwind components; extension points via `registerVariant` (`progress`, `background`) |
| `packages/three` | 3D core (`createStage`, `createOrbit`, `pickAt`), papercraft kit and inspector ported from the cotizador; `/react` `ThreeHost` |
| `packages/mascot` | Geeky 3D adapter over `@guategeeks/geeky` (GuateGeeks/geeky-animation, pinned by tag; update with `npm run geeky:update -- <version>`) |
| `experiences/campus` | The cotizador campus on the 3D core: plan, entities, scene, x-ray, HUD/summary in `/react` |
| `apps/lab` | The lab app: Foundations, Components page (every component and state inline; full-screen states in device frames), Theme studio; Playwright suites in `e2e/` |
| `agent-pack` | Context, skills and checklists for agents in product repos |

## Commands

- `npm ci && npm run build` — generate tokens/themes, compile packages, build the lab.
- `npm test` — generate, then every Vitest project (packages, lab, agent pack).
- `npm run dev -w @guategeeks/lab` — the lab at http://127.0.0.1:5173 (run `npx tsc -b -w` alongside to pick up package changes; the lab reads packages from `dist`).
- `npm run e2e` — Playwright smoke, visual (every frame × theme × viewport) and axe suites against the built lab. `npm run e2e -- --update-snapshots` after intended visual changes; review the images before committing.

## Rules

- Components and lab UI use semantic tokens only; `packages/ui/test/token-guard.test.ts` fails on hex/rgb literals, raw `ms` durations and Tailwind default palette classes.
- Tests import packages from source through the `source` export condition (`vitest.shared.ts`); the lab build never does.
- Generated files (`dist/`, `src/generated/`) are not committed; never edit them by hand.
- A theme never changes logic. Structural changes are variants registered under an extension point; editions request them.
- 3D: no colour literals in `packages/three/src/core` — scene colours come from the theme's `three` profile; build pieces inside `withPalette`; render on demand via `stage.onFrame`; 3D sections are lazy (the e2e `bundle` check fails if three.js reaches the entry chunk).
- Ported code is TypeScript with `noImplicitAny`/`strictNullChecks` off in `packages/three`, `packages/mascot` and `experiences/campus`; new code there is fully typed.
- Ported code keeps a provenance header: `// Ported from GuateGeeks/<repo>@<commit>:<path> (Apache-2.0 in this repo)`.
- Lab UI copy is Spanish; code, package docs and the agent pack are English.
- Geeky (actions, poses, geometry, artwork) changes in GuateGeeks/geeky-animation, never here; `packages/mascot` only adapts it. A geeky-animation release arrives as a pull request from `.github/workflows/update-geeky.yml`.

## Adding things

- **Theme**: follow `agent-pack/skills/create-theme/SKILL.md`.
- **Component**: `packages/ui/src/components/<Name>.tsx` with `data-gg="<name>"`, export from `src/index.ts`, tests in `packages/ui/test/`, a gallery entry in `apps/lab/src/gallery/entries/` registered in `registry.ts`, then update the visual baselines.
- **Token**: edit `packages/tokens/src/source/**`; semantic color roles also need a value in `semantic/light` and `semantic/dark`, the `COLOR_ROLES` list and contrast pairs if they carry text.
