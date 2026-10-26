# GuateGeeks Design Lab

The laboratory where GuateGeeks decides, builds and proves how its products look, sound and feel — on the web and on phones — and the source of the design inputs every GuateGeeks product implements.

- **Tokens** — one DTCG source for color, type, spacing, radii, motion and depth, generated as CSS variables, a Tailwind v4 theme, TypeScript and React Native values.
- **Themes** — the GuateGeeks brand (light and dark) plus special looks such as Halloween, switched live with `data-theme` and verified for WCAG 2.2 AA contrast at build time.
- **Variants and editions** — structural changes through extension points (Progress today), bundled with a theme, content and dates into editions such as *Halloween 2026*.
- **Components** — accessible React components on Radix, styled only with semantic tokens.
- **The lab** — Foundations, a Components gallery rendered in real phone/tablet/desktop frames, and a Theme studio that exports `theme.json`.
- **Agent pack** — context, skills and checklists so agents in product repos can adopt and sync the design.

Design and roadmap: [docs/superpowers/specs/2026-10-25-guategeeks-design-lab-design.md](docs/superpowers/specs/2026-10-25-guategeeks-design-lab-design.md). This repository delivers phase 1 (foundation); the 3D kit from the cotizador, more themes and editions, and product adoption follow.

## Packages

| Package | What it provides |
|---|---|
| [`@guategeeks/tokens`](packages/tokens) | `tokens.css`, `tailwind.css`, `tokens.json`, typed values, `/native` |
| [`@guategeeks/themes`](packages/themes) | `themes.css`, theme and edition data, `/validate` (contrast) |
| [`@guategeeks/theme-runtime`](packages/theme-runtime) | theme/scheme/motion/edition controller; `/react` provider and hooks |
| [`@guategeeks/motion`](packages/motion) | motion presets and semantics with theme-aware durations |
| [`@guategeeks/ui`](packages/ui) | React components and variant slots |

## Develop

Requires Node 22.18 or newer.

```bash
npm ci
npm run build
npm run dev -w @guategeeks/lab
```

The lab reads the packages' built output, like a product would; run `npx tsc -b -w` in another terminal while changing packages.

## Test

```bash
npm test
npm run e2e
```

`npm test` runs every Vitest project (tokens, themes, runtime, motion, UI, lab, agent pack). `npm run e2e` runs the Playwright smoke tests, 210 visual baselines (every component state × brand light, brand dark, Halloween × phone, desktop) and axe accessibility checks against the built lab. After an intended visual change: `npm run e2e -- --update-snapshots`, then review the new images.

## Use it from a product

Install the agent pack in Claude Code from a product repository:

```text
/plugin marketplace add GuateGeeks/design-system
/plugin install guategeeks-design@guategeeks-design
```

Then ask the agent to adopt the GuateGeeks design system; the `adopt-guategeeks-design` skill walks through installation, CSS order, the provider, the token mapping and the adoption checklist. Other agents can read [agent-pack/CONTEXT.md](agent-pack/CONTEXT.md) and [agent-pack/llms.txt](agent-pack/llms.txt) directly.

## Release

Changes to `packages/*` carry a changeset (`npm run changeset`). All `@guategeeks/*` packages share one version. Packages remain private until the registry is chosen.

The lab deploys to GitHub Pages from `main` (Settings → Pages → Source: GitHub Actions).

## License

[Apache-2.0](LICENSE). Code ported from GuateGeeks/socrates.app, GuateGeeks/cotizador and GuateGeeks/geeky-animation carries a provenance note.
