# Geeky page, `<Geeky>` and legacy school Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Product teams get a ready `<Geeky>` React component and a lab page that teaches it; the cotizador's previous low-poly school appears in Experiencias as a historical reference.

**Architecture:** Part A releases geeky-animation v1.2.0 with the Live-actor gaps `<Geeky>` needs (frame colour setter, label control, lazy THREE, autonomy toggle). Part B adds Geeky palettes to themes, `<Geeky>` in `@guategeeks/mascot/react` wrapping the actor, a gallery entry (visual baselines), the lab "Geeky" section, the theme palette for the campus Geeky, and a private `experiences/legacy-school` package that vendors the cotizador files byte-identical behind a typed adapter. Part C releases, pins and merges, with the user's confirmation.

**Tech Stack:** geeky-animation `.mjs` + `node:test`; design system TypeScript 7, React 19, three 0.186.1, Vitest (jsdom), Playwright, Tailwind v4 tokens.

**Spec:** `docs/superpowers/specs/2026-10-26-geeky-page-and-legacy-school-design.md`

## Global Constraints

- Lab UI copy Spanish; code, package docs and agent pack English.
- Lab UI and components use semantic tokens only (token guard). The single exception is the legacy school backdrop `#2e1853`, which lives in the legacy package, not in lab or ui code.
- 3D is lazy: three.js never in the lab entry chunk (e2e `bundle` check); `<Geeky render="2d">` must not pull three.js.
- Every 3D view ships a text alternative without WebGL.
- Geeky behaviour gaps are fixed in geeky-animation, never worked around locally (spec §0).
- Legacy files are byte-identical to cotizador `a125f6f:asesor/lab/{campus-scene,campus-layout,campus-kit,campus-architecture,campus-actors,campus-people}.js`; only `campus-geeky.js` is the design system's own (re-export of `createGeeky3D`).
- Geeky palette contrast: `frame` ≥ 3:1 against the scheme's `--gg-color-bg`; palette values are hex.
- Intent ids (English): `welcome`, `goodbye`, `celebrate`, `reward`, `waiting`, `thinking`, `idea`, `attention`, `error`, `learning`, `idle`; looping: `waiting`, `thinking`, `idle`.
- `<Geeky>` defaults: `render: '2d'`, `size: '8rem'`, `interactive: false`, `followPointer: true`, `autonomous: false`; without `label` it is decorative (`aria-hidden`).
- Outward actions (push to `main`, merge, tag, settings) need the user's confirmation; pushing feature branches and opening PRs is approved with this plan. Push with the token in `~/.ssh/token` through a one-off credential helper; never print it.

## Review Focus

1. **Theme or scheme switch while `<Geeky>` is mounted** → recolours in place, keeps the current intent, leaks no actor (Task 4 test `recolours on scheme change without recreating`).
2. **`action` prop that is unknown** (typo, or removed by an upstream release) → no throw into React; warns once and shows the idle rest (Task 4 test `unknown action falls back to idle`).
3. **`<Geeky>` outside `<ThemeProvider>`** (a product without the runtime) → renders with Geeky's default palette and the OS motion preference (Task 4 test `works without ThemeProvider`).
4. **`render="3d"` without WebGL** → stays 2D and keeps working, no uncaught error (Task 4 test `3d without WebGL keeps 2d`).
5. **Leaving Experiencias while the legacy school runs** → the scene is disposed (canvas removed, no further frames, no page errors) and switching lab theme never changes it (Task 9 e2e `legacy school ignores theme and disposes`).

---

## Part A — geeky-animation v1.2.0 (`/home/adawolfs/projects/geeky`)

Setup: `git switch -c feature/live-embedding main` (local `main` is at `bf20fc0` = v1.1.0).

### Task 1: Live actor — frame colour, label control, lazy THREE, autonomy

**Files:**
- Modify: `src/live/actor.mjs`, `src/live/svg-renderer.mjs`, `src/live/three-renderer.mjs` (decorative label), `types/index.d.mts`, `types/svg-renderer.d.mts`, `types/three-renderer.d.mts`, `types/check.mts`, `tests/fixtures/api.json` (regenerated: no new module exports expected — methods only), `CHANGELOG.md`, `package.json` + `manifest.json` (`1.2.0`), `docs/LIVE.md` (document the new options)
- Create: `tests/actor.test.mjs`; add it to the `test` script

**Interfaces:**
- Produces (GeekyActor):
  - option `frameColor?: string` (typed now; behaviour unchanged at mount)
  - `setFrameColor(hex: string): this`, which re-mounts the current renderer kind with the new colour and keeps brain state and the current action
  - option `actionLabels?: boolean` (default `true`); `false` keeps `label` exactly as given on action start
  - option `label: string | null`; `null` = decorative, so renderers set `aria-hidden="true"` and no `role`/`aria-label`
  - `setAutonomous(on: boolean): this`, which sets `brain.autonomous`
  - `loadRenderer(kind: 'svg' | 'three', options?: {THREE?: object | (() => Promise<object>)}): Promise<this>`, which resolves a loader function, then calls `setRenderer`. The constructor with `renderer: 'three'` and a loader function mounts SVG first, then calls `loadRenderer('three')`; an import or WebGL failure keeps SVG and emits `'renderer'` with `{kind: 'svg', error}`.
  - Renderers: `new SvgRenderer(host, {label: null})` / `ThreeRenderer` with `label: null` render decorative.

- [ ] **Step 1:** Write `tests/actor.test.mjs` (`node:test`). Build actors with the existing `Object.assign(Object.create(GeekyActor.prototype), …)` pattern from `tests/live.test.mjs:251`, or a stub host plus a spy `_mount`, so no DOM is needed. Tests:
  - `setFrameColor remounts with the new colour and keeps the action`: after `play('celebrate')` and `setFrameColor('#ff0000')`, `_mount` was called with kind `'svg'`, `opts.frameColor === '#ff0000'`, and `brain.act.id === 'celebrate'`.
  - `actionLabels false keeps the label`: on `'start'`, `setLabel` receives `'Geeky celebra'` unchanged. With the default, it receives `'Geeky celebra: <action label>'`.
  - `null label stays decorative`: `setLabel` is never called.
  - `setAutonomous toggles the brain`: `setAutonomous(false)` gives `brain.autonomous === false`.
  - `loadRenderer resolves a loader`: `loadRenderer('three', {THREE: async () => ns})` calls `setRenderer('three', {THREE: ns})`. A rejecting loader resolves with the renderer still `'svg'` and emits `{kind: 'svg', error}`.
  - `SvgRenderer null label is decorative`: with a minimal `document.createElementNS` stub, the `svg` element has `aria-hidden="true"` and no `aria-label`.
- [ ] **Step 2:** Run `node --test tests/actor.test.mjs`. Expected: FAIL (`setFrameColor` is not a function, …).
- [ ] **Step 3:** Implement the interfaces above in `actor.mjs` and the renderers. Update the types and `types/check.mts` (typed uses of each new member), and the docs.
- [ ] **Step 4:** Run `npm test` and `npm run typecheck`. Both pass. Bump to `1.2.0` in `package.json`/`manifest.json` and add a `## [1.2.0] - <date>` changelog section (Added: the members above). If `api.json` changed, it is only by additions, regenerated with `node tools/snapshot-api.mjs --write`. `action-ids.json` is unchanged.
- [ ] **Step 5:** Commit: `Live actor: frame colour setter, label control, lazy THREE loader and autonomy toggle`. Push `feature/live-embedding` and open the PR to `main` (approved), with its body ending in the Claude Code attribution line.

## Part B — design system

Setup:
1. Work on a new branch `feat/geeky-page` from `main`.
2. Pin the branch spec while v1.2.0 is untagged: `npm pkg set -w @guategeeks/mascot "dependencies.@guategeeks/geeky=github:GuateGeeks/geeky-animation#feature/live-embedding" && npm install -w @guategeeks/mascot @guategeeks/geeky@github:GuateGeeks/geeky-animation#feature/live-embedding`.
3. The `installed Geeky matches the pinned tag` test skips until Part C.

### Task 2: Geeky palettes in themes

**Files:**
- Modify:
  - `packages/themes/src/types.ts`: `MascotPalette`; `ThemeManifest.mascot`; `ResolvedTheme.mascot`.
  - `packages/themes/src/validate.ts`: `mascot` structure and hex checks.
  - `packages/themes/src/build/merge.ts`: resolve along `extends`; contrast check of `frame` against `--gg-color-bg` ≥ 3.
  - `packages/themes/src/index.ts`: export `geekyPalette`.
  - `packages/themes/themes/guategeeks/theme.json`: a dark palette.
  - `packages/themes/themes/halloween/theme.json`: a dark palette.
  - `agent-pack/skills/create-theme/SKILL.md`: one paragraph on `mascot.palette`.
- Test: `packages/themes/test/mascot.test.ts`

**Interfaces:**
- Produces:
  - `interface MascotPalette { frame?: string; back?: string; lid?: string; heart?: string; blush?: string }` — structurally `GeekyPalette`.
  - `ThemeManifest.mascot?: { costume?: string; palette?: Partial<Record<SchemeName, MascotPalette>> }`
  - `ResolvedTheme.mascot: { palette: Partial<Record<SchemeName, MascotPalette>> }`, merged per scheme along `extends` (child keys win).
  - `geekyPalette(theme: ResolvedTheme | undefined, scheme: SchemeName): MascotPalette`, which returns `{}` when nothing is set.

- [ ] **Step 1:** Write `mascot.test.ts`:
  - `validateManifest` rejects:
    - `{mascot: {palette: {dark: {frame: 'red'}}}}` → `mascot.palette.dark.frame must be a hex color`
    - `{mascot: {palette: {sepia: {}}}}` → `mascot.palette keys must be light | dark`
  - `geekyPalette(getTheme('halloween'), 'dark').frame` is a hex string whose `contrastRatio` against `getTheme('halloween').values.dark['--gg-color-bg']` is ≥ 3.
  - The same holds for `guategeeks` dark.
  - `geekyPalette(getTheme('guategeeks'), 'light')` is `{}`, so Geeky's default `#34314f` applies; on `#ffffff` it passes 3:1.
  - The resolved `halloween` theme inherits nothing it doesn't set (extends merge).
  - A build of a manifest whose dark `frame` is `#1a1222` on Halloween's bg reports `contrast` among its errors. Use the same build function the existing contrast tests use in `packages/themes/test/build.test.ts`.
- [ ] **Step 2:** `npx vitest run --project themes`. Expected: FAIL.
- [ ] **Step 3:** Implement. Choose the dark palette values: a light frame (and matching `lid`/`back`) for brand dark; a Halloween-orange frame family for Halloween. Both must pass the 3:1 rule.
- [ ] **Step 4:** `npm test` passes; `npm run build` passes (theme build includes the new contrast check).
- [ ] **Step 5:** Commit `feat(themes): Geeky palette per theme and scheme`.

### Task 3: Pin geeky-animation v1.2.0 features (branch spec)

**Files:** `packages/mascot/package.json`, `package-lock.json`, `packages/mascot/test/upstream.test.ts`

- [ ] **Step 1:** Add a test to `upstream.test.ts`: `the Live actor exposes what <Geeky> needs`. It checks that `GeekyActor.prototype` has `setFrameColor`, `setAutonomous` and `loadRenderer`.
- [ ] **Step 2:** Run it against v1.1.0. Expected: FAIL.
- [ ] **Step 3:** Pin the branch spec (Setup above).
- [ ] **Step 4:** `npx vitest run --project mascot` passes.
- [ ] **Step 5:** Commit `chore(mascot): use geeky-animation feature/live-embedding until v1.2.0`.

### Task 4: `<Geeky>` and intents (`@guategeeks/mascot/react`)

**Files:**
- Create: `packages/mascot/src/intents.ts`, `packages/mascot/src/react/Geeky.tsx`, `packages/mascot/src/react/index.ts`
- Modify:
  - `packages/mascot/src/index.ts`: export intents.
  - `packages/mascot/package.json`:
    - `./react` export, same shape as `@guategeeks/three`'s;
    - `peerDependencies.react` `19.3.1`;
    - dependencies `@guategeeks/themes` and `@guategeeks/theme-runtime`, at `0.1.0` like the other workspace deps.
  - `packages/mascot/tsconfig.json`: add `jsx` if the base lacks it, plus project references.
  - `packages/mascot/vitest.config.ts`
- Test: `packages/mascot/test/intents.test.ts`, `packages/mascot/test/geeky-component.test.tsx`

**Interfaces:**
- Consumes:
  - `GeekyActor` (v1.2.0 members from Task 1);
  - `geekyPalette`, `getTheme` (Task 2);
  - `useTheme` from `@guategeeks/theme-runtime/react`. It throws outside a provider, so read the context through a non-throwing path: add `useOptionalTheme()` to theme-runtime returning `UseThemeResult | null`, with a test in `packages/theme-runtime/test/react.test.tsx`.
- Produces:
  - `type GeekyIntent = 'welcome' | 'goodbye' | 'celebrate' | 'reward' | 'waiting' | 'thinking' | 'idea' | 'attention' | 'error' | 'learning' | 'idle'`
  - `GEEKY_INTENTS: Readonly<Record<GeekyIntent, { action: string; loop: boolean }>>`
  - `resolveGeekyAction(input: { intent?: GeekyIntent; action?: string }): { id: string; known: boolean }`: intent wins; an unknown action gives `{ id: 'idle', known: false }`.
  - `function Geeky(props: GeekyProps): JSX.Element`, rendering `<div data-gg="geeky">`, where:

    ```ts
    interface GeekyProps {
      intent?: GeekyIntent; action?: string; render?: '2d' | '3d'; size?: string;
      interactive?: boolean; followPointer?: boolean; autonomous?: boolean; paused?: boolean;
      label?: string; playKey?: unknown; palette?: MascotPalette; reducedMotion?: boolean;
      onActionEnd?: (id: string) => void; className?: string;
    }
    ```

- [ ] **Step 1:** Write `intents.test.ts`:
  - every `GEEKY_INTENTS[i].action` is in `ACTION_LIST` ids;
  - `loop` is true exactly for `waiting`, `thinking` and `idle`;
  - `resolveGeekyAction({ action: 'nope' })` equals `{ id: 'idle', known: false }`;
  - `resolveGeekyAction({ intent: 'celebrate', action: 'nope' }).known === true`.
- [ ] **Step 2:** Write `geeky-component.test.tsx` (jsdom; use the repo's fake `matchMedia` helper from `packages/theme-runtime/test/fake-media.ts`). Tests:
  - `renders an SVG Geeky decorative by default`: the `svg` has `aria-hidden="true"`, the host has `data-gg="geeky"`, and three.js is not imported (spy on the dynamic import, or assert no `canvas`).
  - `label names it`: `label="Geeky te da la bienvenida"` gives `role="img"` with exactly that name after an action starts.
  - `plays the intent once, then rests`: with fake timers and `requestAnimationFrame`, `intent="celebrate"` fires `onActionEnd('celebrate')` once, and `brain.act.id` returns to `'idle'`. `intent="waiting"` never fires it.
  - `playKey replays`: changing `playKey` replays the same intent.
  - `reduced motion holds the intent's still pose`: under `reducedMotion`, after longer than the action duration the actor's base is the intent's action.
  - `paused stops the loop`: `paused` → no `requestAnimationFrame` scheduled.
  - `recolours on scheme change without recreating` (Review Focus 1): inside a `ThemeProvider`, switching scheme calls `setFrameColor` with the dark palette frame, and the actor instance is the same.
  - `unknown action falls back to idle` (Review Focus 2): `action="nope"` warns once (`console.warn` spy) and does not throw.
  - `works without ThemeProvider` (Review Focus 3): the frame is Geeky's default and it renders.
  - `3d without WebGL keeps 2d` (Review Focus 4): `render="3d"` with a loader that throws → still an `svg`, no uncaught error.
  - `StrictMode leaves one actor and unmount destroys it`: a destroy spy is called for every created actor, and one is alive while mounted.
- [ ] **Step 3:** Run `npx vitest run --project mascot`. Expected: FAIL (modules missing).
- [ ] **Step 4:** Implement `intents.ts` (pick the action ids within the spec meanings) and `Geeky.tsx`:
  - create the `GeekyActor` in an effect, with `actionLabels: false` and `label ?? null`;
  - map props onto actor calls on change;
  - one-shot intents: `play(id)`, then on `'end'` call `onActionEnd`;
  - reduced motion: `setBase(id)`;
  - `render="3d"`: `loadRenderer('three', { THREE: () => import('three') })`;
  - the palette comes from `props.palette ?? geekyPalette(getTheme(theme), scheme)`;
  - motion comes from `props.reducedMotion ?? theme motion ?? 'system'`.
- [ ] **Step 5:** Run `npx vitest run --project mascot --project theme-runtime` and `npm run typecheck`. Both pass.
- [ ] **Step 6:** Commit `feat(mascot): <Geeky> component with intents, theme colour and motion`, with a changeset (`@guategeeks/mascot`: minor, `@guategeeks/theme-runtime`: minor).

### Task 5: Campus Geeky follows the theme palette

**Files:**
- Modify:
  - `experiences/campus/src/scene.ts`: option and setter.
  - `experiences/campus/src/types.ts`, if the options live there.
  - `experiences/campus/src/react/CampusStage.tsx`: passes the palette.
- Test: `experiences/campus/test/scene.test.ts`, `experiences/campus/test/stage.test.tsx` (or the existing React test file)

**Interfaces:**
- Consumes: `geekyPalette` (Task 2), `createGeeky3D(materials, { reduced, palette })`.
- Produces:
  - `CampusSceneOptions.geekyPalette?: MascotPalette`;
  - `CampusScene.setGeekyPalette(palette?: MascotPalette): void`, which disposes the current Geeky and builds a new one in place, keeping it hidden or visible as before.
  - `CampusStage` passes `geekyPalette(theme, sceneScheme)`. `sceneScheme` is `'dark'` when the profile `background` has relative luminance < 0.5, otherwise `'light'`; if that scheme has no palette, use the other one.

- [ ] **Step 1:** Tests:
  - `setGeekyPalette rebuilds Geeky without leaking geometries`: same geometry count after setting a palette and back.
  - `geeky uses the palette`: a mesh with vertex colour equal to the palette frame exists after `setGeekyPalette({ frame: '#ff0000' })`.
  - `CampusStage passes the theme palette`: switching to Halloween calls `setGeekyPalette` with Halloween's dark palette.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npx vitest run --project experience-campus` (use the project's `test.name`).
- [ ] **Step 5:** Commit `feat(campus): Geeky follows the theme palette`.

### Task 6: Gallery entry and Spanish action names

**Files:**
- Create:
  - `apps/lab/src/gallery/entries/mascot.tsx`: entry `geeky`, group `surfaces`.
  - `apps/lab/src/geeky/actionNames.ts`
  - `apps/lab/test/actionNames.test.ts` (use the lab's existing test folder)
- Modify: `apps/lab/src/gallery/registry.ts`

**Interfaces:**
- Produces:
  - `ACTION_NAMES_ES: Readonly<Record<string, string>>` for the 50 v1.1.0 actions;
  - `GROUP_NAMES_ES: Readonly<Record<string, string>>` for the 7 groups;
  - `actionName(id: string): { text: string; translated: boolean }`, which falls back to the upstream English label;
  - `untranslatedActions(): string[]`;
  - `INTENT_NAMES_ES: Readonly<Record<GeekyIntent, string>>`.
- Gallery entry states (2D, reduced motion in frames):
  - `bienvenida` (`intent="welcome"`, `label`);
  - `celebrar` (`intent="celebrate"`);
  - `error` (`intent="error"`);
  - `decorativo` (`intent="idle"`, no label).

- [ ] **Step 1:** Write `actionNames.test.ts`:
  - every `GEEKY_INTENTS` key has a Spanish name;
  - every v1.1.0 group id has one;
  - `actionName('no-such').translated === false`, and its text falls back;
  - `untranslatedActions()` is logged, not asserted empty: `console.info` with the list, test passes.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement the tables and the gallery entry.
- [ ] **Step 4:**
  - `npm test` passes.
  - `npm run build && npm run e2e -- --update-snapshots`: new baselines exist for the 4 states × 3 combos × 2 viewports, and no other baseline changed (`git status apps/lab/e2e`).
  - Look at the new images: Geeky visible and centred, frame contrast fine in dark and Halloween.
- [ ] **Step 5:** Commit `feat(lab): Geeky in the component gallery` (images included).

### Task 7: Lab section "Geeky"

**Files:**
- Create:
  - `apps/lab/src/sections/geeky/GeekyPage.tsx`: default export, lazy.
  - `apps/lab/src/sections/geeky/GeekyPlayground.tsx`: the stage plus panel.
  - `apps/lab/src/sections/geeky/snippet.ts`
  - `apps/lab/src/sections/geeky/guide.tsx`: tab contents.
  - `apps/lab/e2e/geeky.spec.ts`
  - `apps/lab/test/snippet.test.ts`
- Modify:
  - `apps/lab/src/router.ts`: `Section` adds `'geeky'`.
  - `apps/lab/src/App.tsx`: nav item with a lucide icon, lazy page.
  - `apps/lab/src/copy.ts`: `nav.geeky: 'Geeky'`.
  - `apps/lab/e2e/a11y.spec.ts`: add `'geeky'` to the sections.

**Interfaces:**
- Consumes: `Geeky`, `GEEKY_INTENTS`, `ACTION_LIST`/`GROUPS` (`@guategeeks/geeky/actions`), `actionName`, `GROUP_NAMES_ES`, `INTENT_NAMES_ES`, `@guategeeks/geeky/package.json` version.
- Produces: `geekySnippet(choice: { intent?: GeekyIntent; action?: string; render: '2d' | '3d'; label?: string }): string`, a JSX snippet that imports `Geeky` from `@guategeeks/mascot/react`.

- [ ] **Step 1:** Write `snippet.test.ts`:
  - `geekySnippet({ intent: 'celebrate', render: '2d' })` contains `import { Geeky } from '@guategeeks/mascot/react'` and `<Geeky intent="celebrate" />`;
  - `render: '3d'` adds `render="3d"`;
  - an action without intent emits `action="bicycle"`;
  - a label is escaped for JSX (`"` → `&quot;`).
- [ ] **Step 2:** Write `geeky.spec.ts`:
  - `geeky page shows Geeky and the snippet follows the choice`: open `#/geeky`; choosing intent *Celebrar* updates the code block to `intent="celebrate"`; the copy button writes it to the clipboard (grant the permission in the test context).
  - `3d loads lazily`: before choosing 3D, the page has no `canvas`; after choosing 3D, a `canvas` appears inside `[data-gg="geeky"]`.
  - `catalogue plays an action in the stage`: in the *Todas las acciones* tab, choosing one sets the action select to it.
  - `version tab shows the pinned version`: the text contains the installed `@guategeeks/geeky` version.
- [ ] **Step 3:** Run `npx vitest run --project lab` and `npm run build && npm run e2e -- geeky`. Expected: FAIL.
- [ ] **Step 4:** Implement layout B from the spec §2:
  - **Top:** stage plus a panel with intent radios, a grouped action select, a 2D/3D segmented control, a reduced-motion switch, a pause button (shown when a looping intent is selected), and the snippet with a copy button.
  - **Tabs below:** *Cuándo usarlo*, *Integrarlo*, *Reglas*, *Todas las acciones*, *Versión*.
  - Spanish copy. On phones the panel sits below the stage.
- [ ] **Step 5:** Run `npm test`, `npm run build` and `npm run e2e` (the a11y suite now includes `geeky`; the bundle check still passes). If the new section changed no frames, baselines stay unchanged.
- [ ] **Step 6:** Commit `feat(lab): Geeky section for product teams`.

### Task 8: Legacy school package

**Files (all under `experiences/legacy-school/`):**
- Create:
  - `package.json`: name `@guategeeks/experience-legacy-school`, private, `source`/`types`/`default` exports like `experience-campus`, dependencies `three` `0.186.1` and `@guategeeks/mascot` `0.1.0`.
  - `tsconfig.json`: `allowJs`; the vendor folder is copied to `dist` by a `build` script like mascot's former `cp -r src/vendor dist/`.
  - `vitest.config.ts`
  - `src/vendor/cotizador/{campus-scene,campus-layout,campus-kit,campus-architecture,campus-actors,campus-people}.js`: `git show a125f6f:asesor/lab/<f>.js`, byte-identical, no header line (provenance lives in `PROVENANCE.md`).
  - `src/vendor/cotizador/campus-geeky.js`: `export { createGeeky3D as createGeeky } from '@guategeeks/mascot';` plus one comment line saying it replaces the original.
  - `src/vendor/cotizador/PROVENANCE.md`: source, commit `a125f6f` (2026-10-24), paths, SHA256 of the six files, why `campus-geeky.js` differs.
  - `src/vendor/cotizador/campus-scene.d.ts`: types for `createMascot`.
  - `src/showcase.ts`, `src/school.ts`, `src/index.ts`
  - `test/vendor.test.ts`, `test/school.test.ts`
- Modify: root `package.json` workspaces (add `experiences/legacy-school` after `experiences/campus`); root `tsconfig.json` references.

**Interfaces:**
- Produces:
  - `LEGACY_SOURCE = { repo: 'GuateGeeks/cotizador', commit: 'a125f6f', date: '2026-10-24', path: 'asesor/lab' } as const`
  - `LEGACY_BACKDROP = '#2e1853'`
  - `LEGACY_PROGRAMS: Readonly<Record<'tale' | 'master' | 'spike' | 'electronics' | 'drones' | 'immersive', { name: string; action: string; detail: string }>>`: the Spanish texts from `a125f6f:asesor/campus-experience.js`.
  - `LEGACY_LEVELS: Readonly<Record<'pre' | 'prim' | 'bas' | 'bach', string>>`
  - `legacyShowcase(): object`: `showcaseData()` of `a125f6f:asesor/asesor.js` with the context resolved to overview:
    - levels `pre`, `prim`, `bas`, `bach`; `students` 720; all six programs;
    - equipment `units` 12, plan `'INTEGRA'`, sharing `{ tale: 'separate', master: 'simultaneous', spike: 'separate', electronics: 'simultaneous', drones: 'separate', immersive: 'simultaneous' }`, `stations: false`.
  - `mountLegacySchool(container: HTMLElement, opts?: { reducedMotion?: boolean; onSelect?: (s: { kind: 'program' | 'level'; id: string }) => void; onReady?: () => void; onLost?: () => void }): LegacySchool`
  - `interface LegacySchool { rotate(delta: number): void; zoom(factor: number): void; resetView(): void; setPaused(paused: boolean): void; getDiagnostics(): Record<string, unknown>; dispose(): void }`
  - It calls `createMascot(container, { reduceMotion, onSelect, onReady, onLost })`, `update(legacyShowcase())`, `setHoverVerb('Explorar')`, and sets `container.style.background = LEGACY_BACKDROP`.

- [ ] **Step 1:** Write `vendor.test.ts`: the SHA256 of each of the six files equals the value in `PROVENANCE.md`'s table (parse it), and `campus-geeky.js` exports `createGeeky === createGeeky3D`.
- [ ] **Step 2:** Write `school.test.ts`, with `fakeEnvironment` / `fakeRenderer` from `packages/three/test/helpers/fake-gl.ts`, the way `experiences/campus/test/scene.test.ts` does. If `createMascot` builds its own `WebGLRenderer`, stub `three`'s `WebGLRenderer` with `vi.mock` returning `fakeRenderer()`.
  - `mounts the showcase school and reaches ready`: `onReady` is called after frames, and the diagnostics `animatedPrograms` include all six ids.
  - `selecting a workshop reports it`: dispatch `pointerdown`/`pointerup` at a `selectTargets` program target, then `onSelect` gets `{ kind: 'program', id }`.
  - `dispose removes the canvas`.
  - `backdrop is the cotizador colour`: `container.style.background` contains `rgb(46, 24, 83)`.
- [ ] **Step 3:** Run `npx vitest run --project legacy-school`. Expected: FAIL.
- [ ] **Step 4:** Copy the six files from `/home/adawolfs/projects/makecode/cotizador` (`git show a125f6f:asesor/lab/<f>.js > …`), write the shim, provenance, types and adapter.
- [ ] **Step 5:** `npx vitest run --project legacy-school` passes. `npm run build` passes, with `dist` containing the vendor files.
- [ ] **Step 6:** Commit `feat(experiences): preserve the cotizador's low-poly school as a historical reference`.

### Task 9: Legacy school in Experiencias

**Files:**
- Create: `apps/lab/src/sections/experiences/LegacySchoolDemo.tsx` (lazy within the page), `apps/lab/e2e/legacy-school.spec.ts`
- Modify:
  - `apps/lab/src/sections/experiences/ExperiencesPage.tsx`
  - `apps/lab/src/lab.css`: `.campus-tag` styled with semantic tokens, scoped under the legacy stage.
  - `apps/lab/package.json`: dependency on `@guategeeks/experience-legacy-school`.

**Interfaces:**
- Consumes: `mountLegacySchool`, `LEGACY_PROGRAMS`, `LEGACY_LEVELS`, `LEGACY_SOURCE` (Task 8).
- Produces: `LegacySchoolDemo`:
  - a section heading «Escuela low poly · Referencia histórica», with a line naming the cotizador commit and date;
  - a stage (`data-gg="legacy-school-stage"`, `data-ready`, `data-targets` from diagnostics `selectTargets`, refreshed every second like the campus stage);
  - buttons «Restablecer vista» and «Pausar»/«Reanudar»;
  - a panel (`role="status"`) that shows the tapped workshop's `name`, `action` and `detail`, or the level name for a classroom;
  - without WebGL, a text alternative that lists the school's levels and the six workshops with their activity.

- [ ] **Step 1:** Write `legacy-school.spec.ts`:
  - `legacy school renders and reports ready`: `#/experiences`, scroll to the legacy stage, `data-ready="true"` within 20 s, no page errors.
  - `tapping a workshop names its activity`: click a `data-targets` program point; the panel shows that program's Spanish `name` (for example «Drones») and its `action`.
  - `no WebGL shows the text alternative`: patch `getContext` like `experiences.spec.ts:52`; the six workshop names are visible as text.
  - `legacy school ignores theme and disposes` (Review Focus 5):
    - the stage background is `rgb(46, 24, 83)` under `?theme=halloween&scheme=dark` and under brand light;
    - navigating to `#/foundations` removes the legacy canvas;
    - no page errors.
- [ ] **Step 2:** Run `npm run build && npm run e2e -- legacy-school`. Expected: FAIL.
- [ ] **Step 3:** Implement. Update the page description to name both experiences.
- [ ] **Step 4:** Run `npm test`, `npm run build` and `npm run e2e`. Everything passes: the bundle check, a11y on `experiences`, and the existing campus specs unchanged.
- [ ] **Step 5:** Commit `feat(lab): the legacy low-poly school in Experiencias`.

### Task 10: Docs and agent pack

**Files:**
- Modify:
  - `AGENTS.md`: layout rows for `experiences/legacy-school` and the mascot `/react`; a Rules line on the legacy backdrop exception.
  - `README.md`: the packages table and the lab bullet (Geeky section, legacy school).
  - `packages/mascot/README.md`: `<Geeky>`, intents, rules.
  - `agent-pack/CONTEXT.md`: a short "Geeky in product screens" section, covering intents, decorative vs labelled, pause for loops, one Geeky per screen, the important message in text.
  - `agent-pack/checklists/adoption.md`: one item.
  - `agent-pack/llms.txt`: one line.
  - `agent-pack/skills/adopt-guategeeks-design/SKILL.md`: one step that points to `<Geeky>`.
- Test: the agent-pack Vitest project. If it checks links, headings or llms consistency, it must pass.

- [ ] **Step 1:** Edit the docs.
- [ ] **Step 2:** `npm test` passes.
- [ ] **Step 3:** Commit `docs: <Geeky>, the Geeky section and the legacy school`.

## Part C — release and merge (each outward step confirmed by the user)

### Task 11: geeky-animation v1.2.0 and pin

- [ ] **Step 1 (user):** Review and merge the geeky-animation PR from Task 1.
- [ ] **Step 2 (confirm):** Tag `v1.2.0` on the merged `main` and push it. Watch `release.yml`: the Release exists, and the dispatch reaches the design system ("Update Geeky" run).
- [ ] **Step 3:** The update workflow opens `deps/geeky-v1.2.0` on `main`. That PR is for `main`; this branch pins locally instead:
  1. Run `npm run geeky:update -- 1.2.0`. Expected output `geeky … -> v1.2.0`; the lockfile `resolved` ends with the tag's commit.
  2. Then `npm ci` with SSH disabled (`GIT_SSH_COMMAND=false`), `npm run build`, `npm test` (the pin test now runs) and `npm run e2e`. Everything passes.
  3. Commit `chore(mascot): pin Geeky v1.2.0`.
  4. Close the bot PR once this branch merges, because it is superseded. Say so in the final message.
- [ ] **Step 4:** Final whole-branch review. Then confirm and merge `feat/geeky-page` to `main` and push. Watch CI and the Pages deploy.
