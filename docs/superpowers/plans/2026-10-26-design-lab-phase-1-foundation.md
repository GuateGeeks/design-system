# Design Lab — Phase 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the GuateGeeks Design Lab monorepo with tokens, themes (brand + Halloween), a theme runtime, motion presets, core UI components, the lab app (Foundations, Components, Theme studio), an agent pack v0, and CI + GitHub Pages.

**Architecture:** npm-workspaces monorepo. Design tokens are DTCG JSON resolved by Style Dictionary 5 and emitted by our own formatters (CSS variables, Tailwind v4 `@theme`, TS, React Native, JSON). Themes are manifests merged over the brand tokens and emitted as `[data-theme]`-scoped CSS. A framework-agnostic runtime sets `data-theme` / `data-scheme` / `data-motion` on `<html>`. Everything else reads CSS variables, so switching is live. The lab consumes the packages' built output only.

**Tech Stack:** Node 22, npm workspaces, TypeScript 7.0.2, Vite 8.3.5, React 19.3.1, Tailwind CSS 4.3.3, Style Dictionary 5.7.1, radix-ui 1.8.1, lucide-react 1.61.0, colorjs.io 0.7.1, Vitest 5.0.5, Playwright 1.64.1, @axe-core/playwright 4.14.0, @fontsource-variable/inter 5.3.0, @fontsource/creepster 5.3.0, @changesets/cli 3.0.3.

**Spec:** [docs/superpowers/specs/2026-10-25-guategeeks-design-lab-design.md](../specs/2026-10-25-guategeeks-design-lab-design.md). Phase 1 = spec §10 item 1. Phases 2–4 get their own plans.

## Global Constraints

- Pin exact versions (no `^`) for every dependency listed in Tech Stack.
- Package scope `@guategeeks/*`, version `0.1.0`, `"private": true` until phase 4 (the registry is decided then).
- CSS custom property prefix `--gg-`; semantic color roles are `--gg-color-<role>`.
- Components and the lab may only use **semantic** tokens (no hex/rgb literals, no raw `ms` durations, no Tailwind default palette classes such as `bg-orange-500`).
- Brand palette from guategeeks.github.io: coral `#ef8556`, sky `#5fbad6`, plum `#685599`. Primary action = coral fill + ink `#1e2233`; links = coral dark `#a34825` (light).
- Motion durations instant 100 / fast 150 / base 240 / slow 420 / epic 900 ms; easings standard `cubic-bezier(0.4, 0, 0.2, 1)`, responsive `cubic-bezier(0.2, 0, 0, 1)`, enter `cubic-bezier(0, 0, 0, 1)`, exit `cubic-bezier(0.3, 0, 1, 1)`, spring `cubic-bezier(0.34, 1.56, 0.64, 1)`.
- Contrast: WCAG 2.2 AA (4.5:1 text pairs, 3:1 focus indicator) in every theme × scheme, enforced at build.
- Reduced motion = OS preference OR app setting; under it durations become `1ms` and presets fall back to their reduced keyframes.
- `tap.min` = 44px.
- Fonts self-hosted via Fontsource; no runtime font CDN.
- Lab UI copy is Spanish; code, package docs and the agent pack are English.
- Ported code keeps a provenance header: `// Ported from GuateGeeks/<repo>@<commit>:<path> (Apache-2.0 in this repo)`.
- The lab must import packages through their public exports (default conditions → `dist`). Only Vitest and the generator scripts use the `source` export condition.

## Review Focus

1. **A dark-only theme while the user prefers light** (Halloween + "light"): it must render dark and the scheme control must show as locked. → Task 5 test `forces the only supported scheme`.
2. **Unavailable or throwing `localStorage`** (private mode, blocked storage): the runtime must work with defaults and never throw. → Task 5 test `survives throwing storage`.
3. **An unknown theme or edition id** from storage, the URL or a stale edition: fall back to `guategeeks` without crashing. → Task 5 test `falls back on unknown ids`.
4. **Edition windows at timezone edges**: `2026-10-24T05:00Z` is still Oct 23 in Guatemala. → Task 5 test `evaluates windows in the edition timezone`.
5. **Reduced motion while a `playful` theme is active**: the theme's durations must not win over `1ms`. → Task 4 test `reduced motion outranks theme durations`, and Task 7 test `uses reduced keyframes`.

---

## File Structure

```
package.json                 workspaces (ordered), root scripts
tsconfig.base.json           shared compiler options
tsconfig.json                solution file: references to every package
vitest.config.ts             test.projects
.nvmrc .gitignore .editorconfig AGENTS.md README.md
.changeset/config.json
.github/workflows/ci.yml  pages.yml
.claude-plugin/marketplace.json
packages/tokens/
  src/source/primitives/{color,dimension,typography,motion,effects}.tokens.json
  src/source/semantic/{base,light,dark}.tokens.json
  src/build/{resolve,format-css,format-tailwind,format-ts,format-native,cli,index}.ts
  src/generated/            (gitignored) tokens.ts, tokens.native.ts
  src/index.ts              re-exports generated/tokens.ts
packages/themes/
  themes/guategeeks/theme.json  themes/halloween/theme.json
  editions/halloween-2026.json
  src/{types,validate,contrast,index}.ts
  src/build/{merge,format,cli,index}.ts
  src/generated/            (gitignored) themes.ts, themes.native.ts
packages/theme-runtime/src/{controller,edition,storage,dom,index}.ts  src/react/{ThemeProvider,hooks,index}.tsx
packages/motion/src/{tokens,reduced,presets,play,index}.ts
packages/ui/src/{styles.css,cx.ts,variants.tsx,index.ts}  src/components/<Name>.tsx  src/hooks/useMediaQuery.ts
apps/lab/
  index.html vite.config.ts playwright.config.ts public/logo.svg
  src/{main.tsx,App.tsx,lab.css,router.ts,copy.ts}
  src/shell/{Toolbar,ViewportFrame,Nav}.tsx
  src/frame/{FrameRoute,FramesIndex}.tsx
  src/sections/foundations/*.tsx  src/sections/components/*.tsx  src/sections/studio/*.tsx
  src/gallery/{registry.ts,entries/*.tsx}
  e2e/{smoke,visual,a11y}.spec.ts
agent-pack/
  .claude-plugin/plugin.json  CONTEXT.md  llms.txt
  skills/adopt-guategeeks-design/SKILL.md  skills/create-theme/SKILL.md
  checklists/adoption.md  test/agent-pack.test.ts
```

Each TS package's `package.json` exports follow this shape (paths vary):

```jsonc
"exports": { ".": { "source": "./src/index.ts", "types": "./dist/index.d.ts", "default": "./dist/index.js" } }
```

---

### Task 1: Monorepo scaffold, token source files and resolver

**Files:**
- Create: `package.json`, `tsconfig.base.json`, `tsconfig.json`, `vitest.config.ts`, `.nvmrc` (`22`), `.gitignore` (`node_modules`, `dist`, `src/generated`, `test-results`, `playwright-report`), `.editorconfig`, `AGENTS.md` (stub: layout + commands; completed in Task 17)
- Create: `packages/tokens/package.json`, `tsconfig.json`, `vitest.config.ts`, `src/source/**/*.tokens.json`, `src/build/resolve.ts`, `src/build/index.ts`
- Test: `packages/tokens/test/resolve.test.ts`

**Interfaces:**
- Produces: `resolveTokens(scheme: 'light' | 'dark', extra?: DesignTokenTree[]): Promise<ResolvedToken[]>`, where `ResolvedToken = { name: string /* "gg-color-action" */; path: string[]; value: string | number; type?: string; layer: 'primitive' | 'semantic' }`. Also `loadSource(): { primitives: DesignTokenTree; semantic: { base; light; dark } }` and `type DesignTokenTree = Record<string, unknown>`. Exported from `@guategeeks/tokens/build`.

- [ ] **Step 1: Root scaffold.** Root `package.json`: `"private": true`, `"type": "module"`, `"workspaces": ["packages/tokens","packages/themes","packages/theme-runtime","packages/motion","packages/ui","apps/lab"]` (this order is the build order). Scripts: `"generate": "npm run generate --workspaces --if-present"`, `"build": "npm run generate && tsc -b && npm run build --workspaces --if-present"`, `"test": "npm run generate && vitest run"`, `"typecheck": "tsc -b"`, `"e2e": "npm run e2e -w @guategeeks/lab"`. `tsconfig.base.json`: `strict`, `target ES2022`, `module/moduleResolution NodeNext`, `jsx react-jsx`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `allowImportingTsExtensions` + `rewriteRelativeImportExtensions`, `composite`, `declaration`, `skipLibCheck`, `customConditions: ["source"]` is **not** set (default conditions only). Each package `tsconfig.json` extends the base, sets `rootDir: src`, `outDir: dist`, and lists `references` to the workspace packages it imports; root `tsconfig.json` is a solution file (`files: []`, references to every package). `vitest.config.ts`: `test.projects: ['packages/*', 'apps/lab']`.
- [ ] **Step 2: Token source.** Write DTCG files with these values (`$type` on every token).
  - `primitives/color`: `coral`, `sky`, `plum`, `success`, `error` palettes 100–900, copied verbatim from guategeeks.github.io `src/index.css` (`--color-coral-100…900`, etc.); `neutral` 50–950 = that file's `strong-gray` scale; `white #ffffff`; `ink #1e2233`.
  - `primitives/dimension`: `space` 0=0, 1=4px, 2=8px, 3=12px, 4=16px, 5=20px, 6=24px, 8=32px, 10=40px, 12=48px, 16=64px, 20=80px, 24=96px; `radius` sm 12px, md 20px, lg 24px, xl 28px, hero 32px, pill 999px; `size` (font sizes) xs .75rem, sm .875rem, md 1rem, lg 1.25rem, xl 1.5rem, 2xl 2rem, 3xl 3rem, display 4rem.
  - `primitives/typography`: `family.inter` `["Inter Variable","Inter","system-ui","-apple-system","Segoe UI","Roboto","sans-serif"]`, `family.mono` `["ui-monospace","SFMono-Regular","Menlo","monospace"]`; `weight` regular 400, medium 500, strong 600; `leading` tight 1.15, snug 1.3, body 1.5; `tracking` body -0.01em, heading -0.03em, display -0.04em.
  - `primitives/motion`: `duration` and `easing` exactly as in Global Constraints (`$type` `duration` / `cubicBezier`).
  - `primitives/effects`: `shadow.subtle` `"0 1px 2px 0 rgb(30 34 51 / 0.05)"`, `shadow.float` `"0 12px 32px rgb(30 34 51 / 0.16)"`; `z` base 0, sticky 10, overlay 40, modal 50, toast 60.
  - `semantic/base`: `radius.control {radius.sm}`, `radius.card {radius.md}`, `radius.panel {radius.lg}`, `radius.hero {radius.hero}`; `font.ui {family.inter}`, `font.display {family.inter}`, `font.mono {family.mono}`; `tap.min 44px`; `layout.content-max 720px`, `layout.page-max 1200px`; `space.gutter {space.4}`.
  - `semantic/light` and `semantic/dark`: `color.<role>` with these values (references where the value is a primitive):

| role | light | dark |
|---|---|---|
| bg | `{color.white}` | `#121722` |
| surface | `{color.white}` | `#1b2230` |
| surface-2 | `#f3f4f6` | `#232c3d` |
| ink | `{color.neutral.900}` (#2a3040) | `#f3f5f9` |
| ink-muted | `{color.neutral.600}` | `#c3cad8` |
| ink-subtle | `#5b6474` | `#a1abc0` |
| line | `{color.neutral.200}` | `#313c52` |
| line-soft | `{color.neutral.100}` | `#293347` |
| action | `{color.coral.500}` | `{color.coral.500}` |
| on-action | `{color.ink}` | `{color.ink}` |
| action-hover | `{color.coral.600}` | `{color.coral.600}` |
| link | `{color.coral.300}` | `{color.coral.600}` |
| focus | `{color.coral.300}` | `{color.coral.600}` |
| hero | `{color.plum.400}` | `{color.plum.300}` |
| on-hero | `{color.white}` | `{color.white}` |
| wash | `{color.coral.900}` | `{color.coral.100}` |
| accent | `{color.sky.500}` | `{color.sky.600}` |
| ok / ok-soft | `{color.success.300}` / `{color.success.900}` | `#65d99a` / `#173a29` |
| bad / bad-soft | `{color.error.300}` / `{color.error.900}` | `#ff9e9e` / `#43201f` |
| hint / hint-soft | `{color.plum.400}` / `{color.plum.900}` | `#b9aaff` / `#2a2552` |

- [ ] **Step 3: Write failing tests** in `test/resolve.test.ts`:
  - `resolves semantic references`: light `gg-color-action` = `#ef8556`; dark `gg-color-bg` = `#121722`.
  - `emits css-ready values`: `gg-duration-base` = `0.24s`; `gg-easing-spring` = `cubic-bezier(0.34, 1.56, 0.64, 1)`; `gg-tracking-body` = `-0.01em`; `gg-font-ui` starts with `'Inter Variable'`.
  - `tags layers`: `gg-color-coral-500` has layer `primitive`, `gg-color-action` has `semantic`.
  - `applies extra trees last`: `resolveTokens('light', [{ color: { action: { $value: '#000000' } } }])` → `gg-color-action` = `#000000`.
- [ ] **Step 4: Run** `npx vitest run packages/tokens` → FAIL (module not found).
- [ ] **Step 5: Implement `resolve.ts`.** Deep-merge `primitives`, `semantic.base`, `semantic[scheme]`, then `extra` (a later `$value` replaces, `$type` is inherited from the base). Pass the result to `new StyleDictionary({ tokens, platforms: { css: { transformGroup: 'css', prefix: 'gg' } }, log: { verbosity: 'silent' } })` and use `getPlatformTokens('css').allTokens`. Layer = `semantic` when the path's first segment comes from a semantic file.
- [ ] **Step 6: Run** `npx vitest run packages/tokens` → PASS. Run `npx tsc -b` → exit 0.
- [ ] **Step 7: Commit** `feat(tokens): DTCG token source and resolver`.

### Task 2: Token outputs

**Files:**
- Create: `packages/tokens/src/build/{format-css,format-tailwind,format-ts,format-native,cli}.ts`, `packages/tokens/src/index.ts`
- Modify: `packages/tokens/package.json` (scripts, exports)
- Test: `packages/tokens/test/format.test.ts`

**Interfaces:**
- Consumes: `resolveTokens` (Task 1).
- Produces:
  - `formatCssBlock(selector: string, tokens: ResolvedToken[], extra?: string[]): string` — `selector { --name: value; … }`. Themes reuse it.
  - `COLOR_ROLES: readonly string[]` (the 23 roles from Task 1, in table order), exported from `@guategeeks/tokens/build`.
  - Generated files: `dist/css/tokens.css`, `dist/css/tailwind.css`, `dist/tokens.json`, `src/generated/tokens.ts`, `src/generated/tokens.native.ts`.
  - `@guategeeks/tokens` (".") exports `tokenNames: readonly TokenName[]`, `type TokenName`, `light: Record<TokenName, string | number>`, `dark: Record<TokenName, string | number>`, `motion: { duration: Record<'instant'|'fast'|'base'|'slow'|'epic', number /* ms */>; easing: Record<'standard'|'responsive'|'enter'|'exit'|'spring', string> }`.
  - `@guategeeks/tokens/native` exports `{ light, dark }` keyed by camelCase role (`colorAction`), with dimensions as numbers (px; rem × 16).
  - Package exports: `"./tokens.css"`, `"./tailwind.css"`, `"./tokens.json"`, `"./native"`, `"./build"`, `"."`.

- [ ] **Step 1: Write failing tests** in `format.test.ts` (each one runs the formatter on `resolveTokens` output):
  - `tokens.css has brand light on :root`: contains `:root {` with `--gg-color-action: #ef8556;` and `color-scheme: light;`.
  - `tokens.css has explicit dark`: contains a `[data-scheme="dark"] {` block with `--gg-color-bg: #121722;`.
  - `tokens.css follows OS dark without JS`: contains `@media (prefers-color-scheme: dark)` with selector `:root:where(:not([data-scheme]))`.
  - `tokens.css reduced motion`: contains `:root[data-motion="reduced"], [data-motion="reduced"] [data-theme] {` setting all five `--gg-duration-*` to `1ms`, and an `@media (prefers-reduced-motion: reduce)` block with selector `:root:not([data-motion="full"]), :root:not([data-motion="full"]) [data-theme]`.
  - `tailwind maps semantic roles`: `tailwind.css` starts with `@theme inline {` and contains `--color-action: var(--gg-color-action);`, `--radius-control: var(--gg-radius-control);`, `--font-display: var(--gg-font-display);`, `--ease-spring: var(--gg-easing-spring);`, `--shadow-float: var(--gg-shadow-float);`, `--text-display: var(--gg-size-display);`, and **no** `--color-coral-500` (primitives are not exposed as utilities).
  - `ts output`: `motion.duration.base === 240` and `motion.easing.enter === 'cubic-bezier(0, 0, 0, 1)'`.
  - `native output`: `light.colorAction === '#ef8556'`, `light.radiusControl === 12`, `light.sizeMd === 16`.
- [ ] **Step 2: Run** `npx vitest run packages/tokens` → FAIL.
- [ ] **Step 3: Implement the formatters and `cli.ts`.** `cli.ts` writes all five files. The color-only dark blocks contain only `gg-color-*` semantic tokens. `tokens.css` order: `:root` (all tokens, brand light), `[data-scheme="dark"]`, OS-dark media block, the reduced-motion rules. Package scripts: `"generate": "node --conditions=source src/build/cli.ts"`.
- [ ] **Step 4: Run** `npm run generate -w @guategeeks/tokens && npx vitest run packages/tokens` → PASS; `npx tsc -b` → exit 0.
- [ ] **Step 5: Commit** `feat(tokens): css, tailwind, ts, native and json outputs`.

### Task 3: Theme types, manifest validation and contrast validator

**Files:**
- Create: `packages/themes/package.json`, `tsconfig.json`, `vitest.config.ts`, `src/types.ts`, `src/validate.ts`, `src/contrast.ts`
- Test: `packages/themes/test/validate.test.ts`

**Interfaces:**
- Produces (browser-safe, exported from `@guategeeks/themes/validate`; no Style Dictionary or `node:` imports):
  - Types in `src/types.ts` (re-exported from "."):
    ```ts
    type SchemeName = 'light' | 'dark';
    type MotionIntensity = 'calm' | 'standard' | 'playful';
    interface ThemeManifest {
      id: string; name: string; extends?: string; schemes: SchemeName[];
      tokens?: { shared?: DesignTokenTree; light?: DesignTokenTree; dark?: DesignTokenTree };
      fonts?: { display?: { family: string; import: string } };
      motion?: { intensity: MotionIntensity };
      audio?: Record<string, string>; three?: Record<string, unknown>; mascot?: { costume: string }; assets?: Record<string, string>;
    }
    interface ResolvedTheme {
      id: string; name: string; schemes: SchemeName[]; defaultScheme: SchemeName; intensity: MotionIntensity;
      displayFont?: { family: string };
      values: Partial<Record<SchemeName, Record<string, string>>>; // keys are CSS names: '--gg-color-action'
    }
    interface Edition {
      id: string; name: string; theme: string; variants: Record<string, string>;
      content?: Record<string, { banner?: string; geeky?: string[] }>;
      window?: { from: string; to: string; tz: string }; // YYYY-MM-DD inclusive, IANA tz
    }
    ```
  - `validateManifest(input: unknown): string[]` (empty = valid).
  - `CONTRAST_PAIRS: ReadonlyArray<{ fg: string; bg: string; min: number }>` (role names).
  - `checkContrast(values: Record<string, string>): ContrastResult[]`, where `ContrastResult = { fg; bg; ratio: number; min: number; pass: boolean }`. Invalid colors yield `pass: false, ratio: 0`.

- [ ] **Step 1: Write failing tests:**
  - `accepts a minimal manifest`: `{ id: 'x', name: 'X', schemes: ['light'] }` → `[]`.
  - `rejects bad ids and schemes`: id `'Bad Id'` → an error mentioning `id`; `schemes: []` → an error mentioning `schemes`; `motion.intensity: 'wild'` → an error mentioning `intensity`.
  - `contrast pairs`: `CONTRAST_PAIRS` contains, with min 4.5: ink/bg, ink/surface, ink/surface-2, ink-muted/surface, ink-muted/surface-2, ink-subtle/surface, ink-subtle/surface-2, on-action/action, on-action/action-hover, link/bg, link/surface, link/surface-2, on-hero/hero, ok/surface, bad/surface, hint/surface, ink/wash, ok/ok-soft, bad/bad-soft, hint/hint-soft; with min 3: focus/bg, focus/surface.
  - `flags failing pairs`: `--gg-color-ink: #777777` on `--gg-color-bg: #ffffff` → that result has `pass: false` and `ratio` ≈ 4.48 (±0.01).
  - `invalid colors fail safely`: `--gg-color-ink: 'nope'` → `pass: false, ratio: 0`, no throw.
- [ ] **Step 2: Run** `npx vitest run packages/themes` → FAIL.
- [ ] **Step 3: Implement.** Ids must match `/^[a-z][a-z0-9-]*$/`. Contrast uses `new Color(a).contrast(new Color(b), 'WCAG21')` from colorjs.io.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(themes): manifest types, validation and contrast checks`.

### Task 4: Theme build — brand, Halloween, first edition

**Files:**
- Create: `packages/themes/themes/guategeeks/theme.json`, `themes/halloween/theme.json`, `editions/halloween-2026.json`, `src/build/{merge,format,cli,index}.ts`, `src/index.ts`
- Test: `packages/themes/test/build.test.ts`

**Interfaces:**
- Consumes: `resolveTokens`, `formatCssBlock`, `COLOR_ROLES` (`@guategeeks/tokens/build`); validators (Task 3).
- Produces:
  - `buildTheme(manifest: ThemeManifest, all: ThemeManifest[]): Promise<{ resolved: ResolvedTheme; css: string; errors: string[] }>`.
  - Generated `dist/css/themes.css` (all themes), `dist/css/<id>.css`, `src/generated/themes.ts` (`themes: ResolvedTheme[]`, `editions: Edition[]`), `src/generated/themes.native.ts`.
  - `@guategeeks/themes` exports `themes`, `editions`, `getTheme(id: string): ResolvedTheme | undefined`, and the types. Package exports: `"."`, `"./validate"`, `"./build"`, `"./themes.css"`, `"./native"`, `"./css/*"`.

- [ ] **Step 1: Manifests.**
  - `guategeeks`: `{ "id": "guategeeks", "name": "GuateGeeks", "schemes": ["light","dark"], "motion": { "intensity": "standard" } }`.
  - `halloween`: `"extends": "guategeeks"`, `"schemes": ["dark"]`, `"motion": { "intensity": "playful" }`, `"fonts": { "display": { "family": "Creepster", "import": "@fontsource/creepster/400.css" } }`, `tokens.dark.color`: bg `#0f0b14`, surface `#1a1222`, surface-2 `#251a30`, ink `#f6efe6`, ink-muted `#d6c8b8`, ink-subtle `#b3a28f`, line `#3b2a48`, line-soft `#2b1f36`, action `#ff7a1a`, on-action `#1a0f05`, action-hover `#ff9447`, link `#ffa25c`, focus `#b6ff3b`, hero `#5b2a86`, on-hero `#ffffff`, wash `#2a1708`, accent `#b6ff3b`, ok `#8be36b`, ok-soft `#1c2f16`, bad `#ff8a8a`, bad-soft `#3a1414`, hint `#c9a7ff`, hint-soft `#2b1d45`. (All pairs pass; checked when this plan was written.)
  - `halloween-2026`: `{ "id": "halloween-2026", "name": "Halloween 2026", "theme": "halloween", "variants": {}, "content": { "es": { "banner": "¡Feliz Halloween geek!" } }, "window": { "from": "2026-10-24", "to": "2026-11-02", "tz": "America/Guatemala" } }`.
- [ ] **Step 2: Write failing tests:**
  - `brand resolves both schemes`: resolved `guategeeks` has `defaultScheme 'light'`, `values.dark['--gg-color-bg'] === '#121722'`, `errors` empty.
  - `extends merges`: resolved `halloween.values.dark['--gg-color-action'] === '#ff7a1a'` and `['--gg-radius-control'] === '12px'` (inherited).
  - `display font`: halloween `--gg-font-display` starts with `'Creepster'` followed by the brand stack; `css` starts with `@import "@fontsource/creepster/400.css";`.
  - `intensity scales durations`: playful multiplies durations by 0.85 (`--gg-duration-base` = `0.204s`); calm by 1.25; standard leaves them unchanged.
  - `scoped selectors`: brand css contains `[data-theme="guategeeks"] {` and `[data-theme="guategeeks"][data-scheme="dark"] {`; halloween (one scheme) contains a single `[data-theme="halloween"] {` block that holds its dark values and `color-scheme: dark;`.
  - `reduced motion outranks theme durations`: the selectors emitted by Task 2 have higher specificity than `[data-theme="x"]`. Assert by computing specificity of each selector with a small helper (count of attribute + pseudo-class parts): `:root[data-motion="reduced"]` > `[data-theme="x"]`, and `[data-motion="reduced"] [data-theme]` > `[data-theme="x"]`.
  - `build fails on contrast`: a manifest overriding `ink` to `#777777` on a white `bg` returns an `errors` entry naming `ink/bg`, and `cli.ts` exits non-zero when any theme has errors.
  - `themes.css hoists imports`: every `@import` line comes before the first rule.
- [ ] **Step 3: Run** `npx vitest run packages/themes` → FAIL.
- [ ] **Step 4: Implement.** `merge.ts` resolves the `extends` chain (cycle → error). For each scheme: `resolveTokens(scheme, [parentOverrides…, tokens.shared, tokens[scheme]])`. Single-scheme themes emit one block containing that scheme's values. Validate with `checkContrast` on the resolved semantic colors. Generated TS embeds the resolved data as literals. Package `generate` script: `node --conditions=source src/build/cli.ts`. Add dependency `@fontsource/creepster@5.3.0`.
- [ ] **Step 5: Run** `npm run generate -w @guategeeks/tokens -w @guategeeks/themes && npx vitest run packages/themes` → PASS; `npx tsc -b` → exit 0.
- [ ] **Step 6: Commit** `feat(themes): brand and halloween themes, first edition, css build`.

### Task 5: Theme runtime core

**Files:**
- Create: `packages/theme-runtime/{package.json,tsconfig.json,vitest.config.ts}`, `src/{controller,edition,storage,dom,index}.ts`
- Test: `packages/theme-runtime/test/{edition,controller}.test.ts` (environment `jsdom`)

**Interfaces:**
- Consumes: `ResolvedTheme`, `Edition`, `SchemeName` types (`@guategeeks/themes`).
- Produces:
  ```ts
  type SchemePreference = 'auto' | 'light' | 'dark';
  type MotionPreference = 'auto' | 'full' | 'reduced';
  interface ThemeState {
    theme: string; scheme: SchemeName; schemeLocked: boolean; schemePreference: SchemePreference;
    motion: 'full' | 'reduced'; motionPreference: MotionPreference;
    edition: Edition | null; variants: Record<string, string>;
  }
  interface ThemeControllerOptions {
    themes: ResolvedTheme[]; editions?: Edition[]; defaultTheme?: string; defaultEdition?: string | null;
    root?: HTMLElement; now?: () => Date; search?: string; storageKey?: string | null; // default 'gg-appearance'; null = no persistence
  }
  interface ThemeController {
    getState(): ThemeState; subscribe(listener: (s: ThemeState) => void): () => void;
    setTheme(id: string): void; setScheme(p: SchemePreference): void; setMotion(p: MotionPreference): void;
    setEdition(id: string | null): void; destroy(): void;
  }
  function createThemeController(opts: ThemeControllerOptions): ThemeController;
  function resolveEdition(editions: Edition[], ctx: { explicit?: string | null; search?: string; now: Date; productDefault?: string | null }): Edition | null;
  function isWithinWindow(window: NonNullable<Edition['window']>, now: Date): boolean;
  ```

- [ ] **Step 1: Write failing tests (`edition.test.ts`):**
  - `explicit beats everything`: `explicit: 'none'` → `null` even inside an active window; `explicit: 'halloween-2026'` → that edition outside its window.
  - `url override beats window`: `search: '?edition=halloween-2026'` on `2026-06-01` → the edition.
  - `active window applies`: `now = 2026-10-31T18:00Z` → `halloween-2026`.
  - `evaluates windows in the edition timezone`: `2026-10-24T05:00Z` (Oct 23, 23:00 in Guatemala) → `false`; `2026-10-24T06:00Z` → `true`; `2026-11-03T05:59Z` (Nov 2, 23:59 in Guatemala) → `true`.
  - `product default last`: no window match, `productDefault: 'halloween-2026'` → that edition.
- [ ] **Step 2: Write failing tests (`controller.test.ts`)** with a fake `matchMedia`:
  - `applies attributes`: after creation `document.documentElement` has `data-theme="guategeeks"`, `data-scheme="light"`, `data-motion="full"`.
  - `follows the OS when auto`: `matchMedia('(prefers-color-scheme: dark)')` matches → `data-scheme="dark"`; a change event updates it and notifies subscribers.
  - `forces the only supported scheme`: `setScheme('light')` then `setTheme('halloween')` → `scheme 'dark'`, `schemeLocked true`, `data-scheme="dark"`; `schemePreference` stays `'light'` and applies again after `setTheme('guategeeks')`.
  - `edition drives theme and variants`: with `now` inside the Halloween window → `theme 'halloween'`, `edition.id 'halloween-2026'`; `setTheme('guategeeks')` sets the explicit edition to `'none'` → `edition null`.
  - `reduced motion`: `setMotion('reduced')` → `data-motion="reduced"`; with `'auto'` it follows `(prefers-reduced-motion: reduce)`.
  - `persists and restores`: the choices are written to `localStorage['gg-appearance']` and a new controller restores them.
  - `survives throwing storage`: `localStorage.getItem`/`setItem` throw → still creates and switches themes, no throw.
  - `falls back on unknown ids`: stored theme `'gone'` and `?edition=nope` → `theme 'guategeeks'`, `edition null`; `setTheme('nope')` leaves the state unchanged.
  - `destroy removes listeners`: after `destroy()`, matchMedia changes no longer notify.
- [ ] **Step 3: Run** `npx vitest run packages/theme-runtime` → FAIL.
- [ ] **Step 4: Implement.** `isWithinWindow` formats `now` as `YYYY-MM-DD` with `new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })` and compares strings inclusively. Storage access is wrapped in try/catch (`storage.ts`). The theme is `edition?.theme ?? explicitTheme ?? defaultTheme`, validated against `themes`.
- [ ] **Step 5: Run** → PASS.
- [ ] **Step 6: Commit** `feat(theme-runtime): controller, edition resolution, persistence`.

### Task 6: Theme runtime React bindings

**Files:**
- Create: `packages/theme-runtime/src/react/{ThemeProvider.tsx,hooks.ts,index.ts}` (export path `@guategeeks/theme-runtime/react`)
- Test: `packages/theme-runtime/test/react.test.tsx`

**Interfaces:**
- Consumes: `createThemeController`, `ThemeController`, `ThemeState` (Task 5).
- Produces: `<ThemeProvider controller?: ThemeController; options?: ThemeControllerOptions; children />` (creates a controller from `options` when none is passed, and destroys it on unmount); `useTheme(): ThemeState & Pick<ThemeController, 'setTheme' | 'setScheme' | 'setMotion' | 'setEdition'> & { themes: ResolvedTheme[]; editions: Edition[] }`; `useVariant(point: string, fallback: string): string`; `useEdition(): Edition | null`. Uses `useSyncExternalStore`. Peer dependency `react@19.3.1`.

- [ ] **Step 1: Write failing tests** (@testing-library/react 16.3.3):
  - `useTheme re-renders on change`: a button calling `setTheme('halloween')` changes the rendered `theme` text.
  - `useVariant returns fallback then edition value`: with an edition whose `variants.progress = 'xp-levels'` → `'xp-levels'`; without → the fallback `'bar'`.
  - `provider destroys owned controller`: unmounting the provider leaves no matchMedia listeners (spy on `removeEventListener`).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(theme-runtime): react provider and hooks`.

### Task 7: Motion package (port from Socrates)

**Files:**
- Create: `packages/motion/{package.json,tsconfig.json,vitest.config.ts}`, `src/{tokens,reduced,presets,play,index}.ts`
- Test: `packages/motion/test/play.test.ts` (jsdom; stub `Element.prototype.animate`)

**Interfaces:**
- Consumes: `motion` from `@guategeeks/tokens`.
- Produces: `duration`, `easing` (re-exports of the token values), `type DurationToken`, `type EasingToken`, `spring = { firm: { bounce: 0, duration: 'base' }, soft: { bounce: 0.15, duration: 'base' } }`, `presets`, `type PresetName`, `semantic`, `type Semantic`, `play(el, name: PresetName | Semantic, opts?: { delay?: number; duration?: DurationToken; iterations?: number }): Animation | null`, `stagger(els, name, step = 45): void`, `flip(els: HTMLElement[], mutate: () => void): void`, `countUp(from, to, onFrame, ms?): () => void`, `prefersReducedMotion(): boolean`, `onReducedMotionChange(fn): () => void`, `effectiveDuration(el: Element, token: DurationToken): number`.

- [ ] **Step 1: Port** Socrates `src/design-system/motion.ts` (GuateGeeks/socrates.app @ `7d60a1b`) with the provenance header. Keep every preset and semantic mapping exactly (presets: fadeIn, fadeOut, rise, slideInRight, slideInLeft, sheetUp, pop, popIn, press, shake, wiggle, glowOk, pulse, float, stamp; semantics: feedback.correct→pop, feedback.incorrect→shake, feedback.hint→wiggle, select→press, enter.screen→rise, enter.step→slideInRight, enter.item→popIn, reward.badge→stamp, attention→pulse, idle.mascot→float) and add `reward.celebrate`→`pop`. Make three changes:
  1. Reduced motion is `document.documentElement.dataset.motion === 'reduced'` OR (the attribute is not `'full'` AND the media query matches), so it agrees with the runtime. Remove `setReducedMotion`: the runtime owns the setting.
  2. `effectiveDuration` reads `--gg-duration-<token>` from `getComputedStyle(el)` (parses `s`/`ms`) and falls back to the token value, so theme intensity applies to WAAPI. `play` uses it.
  3. `glowOk` builds its box-shadow from the computed `--gg-color-ok` (`color-mix(in srgb, <ok> 55%, transparent)` → `transparent`) instead of a literal RGB.
- [ ] **Step 2: Write failing tests:**
  - `maps semantics`: `play(el, 'feedback.correct')` calls `animate` with the `pop` keyframes.
  - `uses theme durations`: the element's computed `--gg-duration-base: 0.204s` → `animate` options `duration === 204`.
  - `uses reduced keyframes`: `data-motion="reduced"` → `rise` animates `[{opacity:0},{opacity:1}]` with duration ≤ 150 and `iterations 1`; `pop` (reduced `null`) returns `null`.
  - `full overrides OS`: `data-motion="full"` with the OS query matching → full keyframes.
  - `countUp jumps when reduced`: calls `onFrame(to)` once synchronously.
- [ ] **Step 3: Run** → FAIL. **Step 4: Implement** the changes. **Step 5: Run** → PASS.
- [ ] **Step 6: Commit** `feat(motion): port socrates motion presets with theme-aware durations`.

### Task 8: UI foundation and primitives

**Files:**
- Create: `packages/ui/{package.json,tsconfig.json,vitest.config.ts}`, `src/styles.css`, `src/fonts.css`, `src/cx.ts`, `src/index.ts`, `src/components/{Button,IconButton,Link,Card,Badge,GlassPanel,EmptyState}.tsx`
- Test: `packages/ui/test/{primitives.test.tsx,token-guard.test.ts}`

**Interfaces:**
- Consumes: `@guategeeks/tokens/tailwind.css`, `@guategeeks/tokens/tokens.css`, `play` from `@guategeeks/motion`.
- Produces:
  - `styles.css` (copied to `dist/styles.css` by the package `build` script) = `@import "@guategeeks/tokens/tokens.css"; @import "@guategeeks/tokens/tailwind.css"; @source "./";` plus base rules: `:focus-visible { outline: 2px solid var(--gg-color-focus); outline-offset: 2px }`, body font `var(--gg-font-ui)`, and headings using `--gg-font-display` with tracking `--gg-tracking-heading`. `fonts.css` imports `@fontsource-variable/inter`. Consumers: `@import "tailwindcss"; @import "@guategeeks/ui/styles.css"; @import "@guategeeks/ui/fonts.css"; @import "@guategeeks/themes/themes.css";`.
  - `cx(...parts: Array<string | false | null | undefined>): string`.
  - `Button({ variant?: 'primary' | 'secondary' | 'ghost' | 'hero'; size?: 'md' | 'lg'; loading?: boolean; iconStart?: ReactNode; ...ButtonHTMLAttributes })`, height ≥ `--gg-tap-min`, plays `select` on press; `IconButton({ label: string; icon: ReactNode; variant? })` (renders `aria-label`); `Link` (anchor, `text-link`, underline on hover); `Card({ as?, interactive?: boolean })`; `Badge({ tone?: 'neutral' | 'ok' | 'bad' | 'hint' | 'action' })`; `GlassPanel` (surface at 82% via `color-mix(in srgb, var(--gg-color-surface) 82%, transparent)` + `backdrop-blur`, fully opaque under `@media (prefers-reduced-transparency: reduce)`); `EmptyState({ icon?, title, description?, action? })`.
  - Every component sets `data-gg="<name>"` on its root, and its state as data attributes (`data-variant`, `data-tone`).

- [ ] **Step 1: Write failing tests:**
  - `button variants`: `data-variant="primary"` by default; `loading` → `aria-busy="true"` and disabled.
  - `icon button requires label`: renders `aria-label="Cerrar"`.
  - `badge tones`: `data-tone="ok"`.
  - `token-guard`: read every file under `packages/ui/src` and fail with file:line on (a) `#[0-9a-fA-F]{3,8}\b`, `rgb(`, `hsl(` literals; (b) a number followed by `ms` outside comments; (c) Tailwind default palette classes `/\b(bg|text|border|ring|fill|stroke)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}\b/`.
- [ ] **Step 2: Run** `npx vitest run packages/ui` → FAIL. **Step 3: Implement** with Tailwind utilities that map to tokens (`bg-action text-on-action rounded-control`, `duration-(--gg-duration-fast) ease-(--gg-easing-responsive)`). Icons come from `lucide-react`. **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(ui): styles entry and primitive components`.

### Task 9: UI form controls

**Files:**
- Create: `packages/ui/src/components/{Tabs,SegmentedControl,Switch,TextField,NumberStepper,Select}.tsx`
- Test: `packages/ui/test/forms.test.tsx`

**Interfaces:**
- Consumes: `radix-ui` (`Tabs`, `ToggleGroup`, `Switch`, `Select`, `Label`).
- Produces: `Tabs({ items: { id; label; content: ReactNode }[]; value?; defaultValue?; onValueChange? })`; `SegmentedControl<T extends string>({ label: string; options: { value: T; label: string; icon?: ReactNode }[]; value: T; onChange(v: T): void; disabled?: boolean })`; `Switch({ label; checked?; defaultChecked?; onCheckedChange? })`; `TextField({ label; hint?; error?; ...InputHTMLAttributes })` (`aria-describedby` wires hint/error, `aria-invalid` when error); `NumberStepper({ label; value: number; min?; max?; step?: number; onChange(v: number): void })` (− / + buttons each ≥ tap min; typing clamps on blur); `Select<T extends string>({ label; options: { value: T; label: string }[]; value?: T; onValueChange?(v: T): void; placeholder? })`.

- [ ] **Step 1: Write failing tests:**
  - `segmented keyboard`: ArrowRight moves the selection; the selected item has `aria-checked="true"`; `disabled` disables every item.
  - `text field errors`: with `error="Requerido"` → the input has `aria-invalid="true"` and `aria-describedby` points to the element with that text.
  - `stepper clamps`: `min 1, max 5`, typing `9` and blurring → `onChange(5)`; `+` at max is disabled.
  - `switch labels`: `getByRole('switch', { name: 'Sonido' })` exists.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS (including `token-guard`).
- [ ] **Step 5: Commit** `feat(ui): form controls`.

### Task 10: UI overlays

**Files:**
- Create: `packages/ui/src/components/{Dialog,Tooltip,Toast}.tsx`, `packages/ui/src/hooks/useMediaQuery.ts`
- Test: `packages/ui/test/overlays.test.tsx`

**Interfaces:**
- Produces: `Dialog({ open?; onOpenChange?; title: string; description?; trigger?: ReactNode; children; size?: 'compact' | 'wide' })`, a centered dialog at ≥ 640px and a bottom sheet below that (`data-presentation="dialog" | "sheet"`; the sheet enters with the `sheetUp` preset and respects the safe-area bottom inset); `Tooltip({ content: ReactNode; children })`; `ToastProvider` + `useToast(): { show(t: { title: string; description?: string; tone?: 'neutral' | 'ok' | 'bad' }): void }`; `useMediaQuery(query: string): boolean` (SSR-safe: `false` without `window`).

- [ ] **Step 1: Write failing tests:**
  - `sheet on phones`: mock `matchMedia('(min-width: 640px)')` → false → open dialog has `data-presentation="sheet"`; true → `"dialog"`.
  - `dialog a11y`: `getByRole('dialog', { name: title })`; Escape closes it and calls `onOpenChange(false)`; focus returns to the trigger.
  - `toast announces`: `show({ title: 'Guardado' })` → text inside a `role="status"` region.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** on Radix `Dialog`, `Tooltip`, `Toast`. **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(ui): dialog/bottom sheet, tooltip, toast`.

### Task 11: UI layout, Progress and variant slots

**Files:**
- Create: `packages/ui/src/components/{AppShell,Progress}.tsx`, `packages/ui/src/variants.tsx`
- Test: `packages/ui/test/layout.test.tsx`

**Interfaces:**
- Consumes: `useVariant` (`@guategeeks/theme-runtime/react`).
- Produces:
  - `registerVariant(point: string, value: string, component: ComponentType<any>): void`; `getVariants(point: string): string[]`; `VariantSlot<P>({ point: string; fallback: string; props: P })`. It renders the registered component for `useVariant(point, fallback)`, or the fallback's component when that value is unregistered.
  - `Progress({ value: number; max: number; label: string; milestones?: number[] })`. It renders `<VariantSlot point="progress" fallback="bar" …/>`. Value `bar` is registered here (a native `role="progressbar"` with `aria-valuenow/min/max`).
  - `AppShell({ brand: ReactNode; nav: { id; label; icon: ReactNode; href: string; current?: boolean }[]; actions?: ReactNode; children })`: a sidebar (`lg:w-56`, 224px) at ≥ 1024px and a bottom nav below that, with `aria-current="page"` on the current item and safe-area padding.

- [ ] **Step 1: Write failing tests:**
  - `progress bar`: `role="progressbar"` with `aria-valuenow="3"`, `aria-valuemax="10"`.
  - `unregistered variant falls back`: a provider whose edition requests `progress: 'constellation'` (unregistered) → still renders the bar.
  - `registered variant renders`: register `progress/test` and request it → the test component receives `{ value, max, label }`.
  - `app shell nav`: the current item has `aria-current="page"`; nav landmark name `Principal`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(ui): app shell, progress and variant slots`.

### Task 12: Lab shell, routing, toolbar and frames

**Files:**
- Create: `apps/lab/{package.json,index.html,vite.config.ts,tsconfig.json,playwright.config.ts}`, `public/logo.svg` (copy of guategeeks.github.io `public/logo.svg`, provenance in `public/PROVENANCE.md`), `src/{main.tsx,App.tsx,lab.css,router.ts,copy.ts}`, `src/shell/{Nav,Toolbar,ViewportFrame}.tsx`, `src/frame/{FrameRoute,FramesIndex}.tsx`, `src/gallery/registry.ts`
- Test: `apps/lab/test/router.test.ts`, `apps/lab/e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: every package through its default exports; `themes`, `editions` (`@guategeeks/themes`).
- Produces:
  - `parseRoute(hash: string): Route`, where `Route = { section: 'foundations' | 'components' | 'studio'; id?: string } | { frame: { entry: string; state: string; theme: string; scheme: SchemePreference; motion: MotionPreference } } | { frames: true } | { notFound: string }`, and `useRoute(): Route`. Hash formats: `#/foundations`, `#/components/<entry>`, `#/studio`, `#/frame/<entry>/<state>?theme=&scheme=&motion=`, `#/frames`. Empty → foundations.
  - `GalleryEntry = { id: string; name: string; description: string; states: { id: string; label: string; render: () => ReactNode }[] }`; `registry: GalleryEntry[]` (populated in Task 14) and `findState(entry, state)`.
  - Frame route: renders one state on a bare page and applies `theme/scheme/motion` from the query through its own `ThemeProvider` (`storageKey: null`), so iframes never touch the user's saved choice.
  - `#/frames` lists every `<a data-frame href="#/frame/…">`, one per entry × state, with no theme params.
  - `ViewportFrame({ viewport: 'phone' | 'tablet' | 'desktop'; src: string; title: string })` → iframe at 390×844, 820×1180 or 1280×800, scaled to fit.
  - Toolbar (Spanish labels: Tema, Esquema, Movimiento, Edición, Vista) drives the app's `ThemeProvider`, and passes the state to frames through the query.
  - `vite.config.ts`: `base: './'`, React plugin, `@tailwindcss/vite`. Scripts: `dev`, `build` (`tsc -p . --noEmit && vite build`), `preview`, `e2e` (`playwright test`).

- [ ] **Step 1: Write failing tests:** `router.test.ts` parses each hash format, decodes query params, defaults `scheme`/`motion` to `auto`, and returns `notFound` for `#/nope`. `smoke.spec.ts` (Playwright `webServer`: `npm run preview -- --port 4173`, built lab): the home renders the heading `Laboratorio de diseño GuateGeeks`; choosing `Halloween` in the toolbar sets `html[data-theme="halloween"]` and `[data-scheme="dark"]`, and disables the Esquema control; reload keeps the choice.
- [ ] **Step 2: Run** `npx vitest run apps/lab` → FAIL. **Step 3: Implement.** **Step 4: Run** vitest → PASS; `npm run build && npm run e2e -- smoke` → PASS.
- [ ] **Step 5: Commit** `feat(lab): shell, hash routing, toolbar and frame routes`.

### Task 13: Lab — Foundations

**Files:**
- Create: `apps/lab/src/sections/foundations/{FoundationsPage,ColorRoles,TypeScale,SpacingRadii,MotionTokens,ContrastMatrix}.tsx`
- Test: `apps/lab/test/foundations.test.tsx`

**Interfaces:**
- Consumes: `tokenNames`, `light`, `dark`, `motion` (`@guategeeks/tokens`); `themes`, `getTheme`; `checkContrast`, `CONTRAST_PAIRS` (`@guategeeks/themes/validate`); `play` (`@guategeeks/motion`).
- Produces: `FoundationsPage`. Color roles show a swatch, the CSS name, the current value (read live with `getComputedStyle`) and a copy button. Contrast matrix shows each `CONTRAST_PAIRS` row for the active theme × scheme from `ResolvedTheme.values`, with ratio and pass/fail. The motion demo plays each preset on click; under reduced motion it shows "Movimiento reducido activo".

- [ ] **Step 1: Write failing tests:** renders 23 role rows; the contrast matrix for `halloween` shows 22 rows, all with `data-pass="true"`; clicking a preset button calls `play` (mocked) with that preset.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(lab): foundations section`.

### Task 14: Lab — Components gallery

**Files:**
- Create: `apps/lab/src/gallery/entries/{button,icon-button,link,card,badge,glass-panel,empty-state,tabs,segmented-control,switch,text-field,number-stepper,select,dialog,tooltip,toast,app-shell,progress}.tsx`
- Modify: `apps/lab/src/gallery/registry.ts`
- Create: `apps/lab/src/sections/components/{ComponentsPage,EntryView}.tsx`
- Test: `apps/lab/test/gallery.test.tsx`

**Interfaces:**
- Consumes: `GalleryEntry`, `ViewportFrame` (Task 12); all `@guategeeks/ui` exports.
- Produces: one entry per component (18 entries). Each has these states where they apply: `default`, `hover-focus` (rendered with `data-force-focus` styling), `disabled`, `loading`, `error`, `open` (overlays render already open), and for AppShell `phone` / `desktop`. `EntryView` shows the selected viewport frame plus a list of states. Copy is Spanish.

- [ ] **Step 1: Write failing tests:** `registry` has 18 unique ids; every state renders without throwing inside a `ThemeProvider` (loop render in jsdom); every entry has a non-empty `description`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(lab): components gallery`.

### Task 15: Lab — Theme studio

**Files:**
- Create: `apps/lab/src/sections/studio/{StudioPage,RoleEditor,StudioPreview,exportTheme}.ts(x)`
- Test: `apps/lab/test/studio.test.tsx`

**Interfaces:**
- Consumes: `themes`, `ResolvedTheme`, `ThemeManifest`; `checkContrast`, `validateManifest`; gallery entries for the preview.
- Produces:
  - `exportTheme(base: ResolvedTheme, scheme: SchemeName, overrides: Record<string, string>, meta: { id: string; name: string }): ThemeManifest`. It returns `{ id, name, extends: base.id, schemes: [scheme] or base.schemes, tokens: { [scheme]: { color: { <role>: { $value } } } }, motion: { intensity: base.intensity } }`.
  - Studio UI: pick a base theme and scheme, edit any color role (a color input plus a hex text field), and set the motion intensity. The preview container gets `data-theme=<base>` and `data-scheme`, with the overrides as inline `--gg-color-*` styles. Live contrast list. "Exportar theme.json" offers download and copy, and is disabled while `validateManifest` or contrast reports errors (the reasons are listed).

- [ ] **Step 1: Write failing tests:** `exportTheme` with `{ '--gg-color-action': '#00aa88' }` produces `tokens.light.color.action.$value === '#00aa88'` and passes `validateManifest`; an invalid hex (`#zz`) marks the field invalid, keeps the previous preview value and disables export; a failing contrast override lists `on-action/action` as the reason.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(lab): theme studio with live contrast and export`.

### Task 16: Visual regression and accessibility suite

**Files:**
- Create: `apps/lab/e2e/{visual,a11y}.spec.ts`, `apps/lab/e2e/combos.ts`
- Generated: `apps/lab/e2e/visual.spec.ts-snapshots/` (committed)

**Interfaces:**
- Consumes: `#/frames` and `#/frame/…` (Task 12).
- Produces: `COMBOS = [{ theme: 'guategeeks', scheme: 'light' }, { theme: 'guategeeks', scheme: 'dark' }, { theme: 'halloween', scheme: 'dark' }]`; `VIEWPORTS = { phone: { width: 390, height: 844 }, desktop: { width: 1280, height: 800 } }`.

- [ ] **Step 1: Write `visual.spec.ts`.** Collect frame links from `#/frames`. For each link × combo × viewport, open the frame with `motion=reduced` (stable screenshots), wait for `document.fonts.ready`, and call `expect(page).toHaveScreenshot(<entry>-<state>-<theme>-<scheme>-<viewport>.png, { maxDiffPixelRatio: 0.01 })`.
- [ ] **Step 2: Write `a11y.spec.ts`.** For each frame × combo (desktop), run `new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag22aa']).analyze()` and expect no violations with impact `serious` or `critical`. Also: Foundations, Components and Studio pages pass the same check, and Tab reaches the toolbar's first control.
- [ ] **Step 3: Generate baselines:** `npm run build && npm run e2e -- --update-snapshots`, then run `npm run e2e` again → PASS. Fix any axe violations in `@guategeeks/ui` (not with lab-only overrides) and re-run.
- [ ] **Step 4: Commit** `test(lab): visual and accessibility suites with baselines`.

### Task 17: Agent pack v0

**Files:**
- Create: `agent-pack/.claude-plugin/plugin.json`, `agent-pack/CONTEXT.md`, `agent-pack/llms.txt`, `agent-pack/skills/adopt-guategeeks-design/SKILL.md`, `agent-pack/skills/create-theme/SKILL.md`, `agent-pack/checklists/adoption.md`, `.claude-plugin/marketplace.json`, `agent-pack/test/agent-pack.test.ts`, `agent-pack/vitest.config.ts`
- Modify: `vitest.config.ts` (add `'agent-pack'` to projects), `AGENTS.md` (complete)

**Interfaces:**
- Consumes: `dist/tokens.json` (Task 2), the theme manifests (Task 4).
- Produces:
  - `marketplace.json`: `{ "name": "guategeeks-design", "owner": { "name": "GuateGeeks" }, "plugins": [{ "name": "guategeeks-design", "source": "./agent-pack", "description": "GuateGeeks design system: adopt, theme and verify." }] }`. `plugin.json`: `{ "name": "guategeeks-design", "version": "0.1.0", "description": … }`.
  - `CONTEXT.md`: brand principles (coral action + dark ink, plum hero, sky accent, Inter, calm surfaces with immersive moments), the four layers (tokens → themes → variants → editions) and their files, the rules (semantic tokens only, `data-theme`/`data-scheme`/`data-motion` on `<html>`, reduced motion, 44px tap targets, contrast AA), the package map and the consumer CSS import order (Task 8).
  - `adopt-guategeeks-design`: frontmatter `name` and `description` ("Use when adding or updating the GuateGeeks design system in a product repo"). Steps: install the packages, add the CSS imports, wrap the app in `ThemeProvider`, replace hard-coded colors/durations using a mapping table (Socrates `--c-action`→`--gg-color-action`, `--c-ink`→`--gg-color-ink`, `--c-surface`→`--gg-color-surface`, `--c-line`→`--gg-color-line`, `--c-hero`→`--gg-color-hero`, `--dur-base`→`--gg-duration-base`; guategeeks.github.io `coral-500`→`action`, `strong-gray-900`→`ink`), then verify with `checklists/adoption.md`.
  - `create-theme`: in the lab, use the Theme studio → export → `packages/themes/themes/<id>/theme.json` → `npm run generate` → `npm test` (contrast gate) → add to the visual `COMBOS` → update the snapshots.
  - `llms.txt`: an index linking CONTEXT, skills, checklists and the spec.
- [ ] **Step 1: Write failing tests** (`agent-pack.test.ts`): both JSON files parse and the names match; each `SKILL.md` has frontmatter with `name` equal to its folder and a `description` starting with "Use when"; every `--gg-[a-z0-9-]+` mentioned in any `agent-pack/**/*.md` exists in `packages/tokens/dist/tokens.json`; every relative link in `llms.txt` resolves to a file.
- [ ] **Step 2: Run** → FAIL. **Step 3: Write the content.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(agent-pack): context, adopt and create-theme skills, plugin manifest`.

### Task 18: CI, Pages, changesets and README

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/pages.yml`, `.changeset/config.json`, `.changeset/README.md`
- Modify: `README.md`, root `package.json` (devDependency `@changesets/cli@3.0.3`, script `"changeset": "changeset"`)

**Interfaces:**
- Produces: `ci.yml` on `pull_request` and `push` to `main`: Node from `.nvmrc`, `npm ci`, `npm run build`, `npm test`, `npx playwright install --with-deps chromium`, `npm run e2e`; on failure it uploads `apps/lab/test-results` as an artifact (actual screenshots let baselines be refreshed from CI). `pages.yml` on `push` to `main` and `workflow_dispatch`: build, then `actions/upload-pages-artifact` with `apps/lab/dist` and `actions/deploy-pages`. Permissions `pages: write`, `id-token: write`; concurrency group `pages`. `.changeset/config.json`: `"privatePackages": { "version": true, "tag": false }`, `"baseBranch": "main"`.
- [ ] **Step 1: Write** the workflows and changeset config. Rewrite `README.md`: what the lab is, a link to the spec, the packages table, `npm ci && npm run build && npm run dev -w @guategeeks/lab`, testing commands, and how to install the agent pack plugin (`/plugin marketplace add GuateGeeks/design-system`).
- [ ] **Step 2: Verify locally:** `npm ci && npm run build && npm test && npm run e2e` → all PASS. Validate the workflow syntax with `npx --yes action-validator@0.6.0 .github/workflows/*.yml` → exit 0 (if unavailable, check that both files parse as YAML with `node -e` and the `yaml` package).
- [ ] **Step 3: Commit** `ci: build, test, e2e and pages deploy; changesets`.

---

## Self-Review Notes

- Spec §10 phase 1 coverage: monorepo/tooling/CI/Pages (1, 18); tokens (1–2); themes + brand + Halloween (3–4); runtime (5–6); motion (7); core UI (8–11; all components listed in spec §5); lab sections 1–3 (12–15); agent pack v0 with context, adopt and create-theme (17); quality gates of spec §9 that apply to phase 1 (2–4 contrast, 16 visual + axe).
- Deferred on purpose (later plans): the three/mascot packages, variant values beyond `progress: bar`, the remaining themes and editions, the Variants/Editions/3D/Experiences/Agent-pack lab sections, the sync/audit/3D skills, publishing.
