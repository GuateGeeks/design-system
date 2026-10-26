# Design Lab — Phase 2: 3D kit, campus experience and motion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the cotizador's papercraft 3D engine and its interactivity into a themeable TypeScript 3D kit (`@guategeeks/three`) plus Geeky 3D (`@guategeeks/mascot`). Rebuild the campus as the lab's first reference experience. Add a 3D Kit section. Bring motion into the components and an animated background variant.

**Architecture:**
- **Generic engine pieces** move into `@guategeeks/three/core`, rebuilt from the cotizador's `campus-scene.js`: the render-on-demand stage (FPS cap, eco quality, visibility and context loss) and the orbit camera (drag, wheel, pinch, smoothing).
- **Reusable modules** are ported file-for-file into `@guategeeks/three`, keeping their behavior: the papercraft kit, materials, pieces, people, assembly and inspector.
- **Campus domain code** moves into a private workspace `@guategeeks/experience-campus`, rebuilt on the core: growth plan, composition, actors, X-ray, HUD and contextual feedback.
- **Theme profiles:** colors and lighting come from a `three` profile per theme, so Halloween restyles the 3D.
- **Lazy loading:** the lab loads the 3D sections lazily, so pages without 3D never download three.js.

**Tech Stack:** Phase 1 stack, plus three 0.186.1 and @types/three 0.186.0 (the cotizador's version).

**Spec:** [docs/superpowers/specs/2026-10-25-guategeeks-design-lab-design.md](../specs/2026-10-25-guategeeks-design-lab-design.md) §6, and §10 item 2. Source: GuateGeeks/cotizador @ `673ee22`, cloned read-only for porting.

## Global Constraints

- Pin `three@0.186.1` and `@types/three@0.186.0` exactly.
- New workspaces, in build order after `packages/ui`: `packages/mascot` (`@guategeeks/mascot`), `packages/three` (`@guategeeks/three`), `experiences/campus` (`@guategeeks/experience-campus`, private, never published), then `apps/lab`.
- **Provenance headers.** Every ported file starts with `// Ported from GuateGeeks/cotizador@673ee22:asesor/<path> (Apache-2.0 in this repo)`. Vendored Geeky files keep the cotizador's `PROVENANCE.md` and get a header line pointing to it.
- **TypeScript for ported code.**
  - `@guategeeks/three` and `@guategeeks/experience-campus` compile with `strict: true`, `noImplicitAny: false` and `strictNullChecks: false`.
  - Every export from their `index.ts` / `react` entry points has explicit parameter and return types.
  - The vendored Geeky Live modules stay JavaScript (`allowJs`), typed through a hand-written `.d.ts`.
- **Behavior parity with the cotizador:**
  - Budget: ≤ 40,000 triangles, ≤ 150 draw calls and ≤ 10 materials at the maximum configuration.
  - Frame rate: 60 fps with a fine pointer at full quality, 30 fps otherwise.
  - Eco quality kicks in after an exponential moving average above 75 ms over more than 45 frames: no shadow map, pixel ratio 1.
  - Shadow map 2048 when width × DPR > 900, else 1024. Pixel ratio ≤ 1.75.
  - Render on demand. Activities rest after `RUN`.
  - Reduced motion settles everything immediately, and Geeky holds a static pose.
- **No color literals in `packages/three/src/core`.** Scene background, lights, ground shadow, focus marker and preview color come from the `ThreeProfile`. Piece colors come from the palette, which a profile can override.
- **Text alternative.** Every 3D view has one (the campus summary), and it is always present. When WebGL is unavailable or the context is lost, it is the only content.
- Lab UI copy is Spanish.
- Lab sections **Experiencias** and **Kit 3D** are lazy (`React.lazy` + dynamic `import()`). The initial lab JS chunk must not contain three.js.

## Review Focus

1. **WebGL unavailable or context lost:** the experience shows the text summary and controls, never a blank area or an exception. → Task 15 `e2e: no WebGL shows the summary`, Task 10 test `context loss reports onLost`.
2. **Theme switched while a scene is mounted:** the scene rebuilds with the new profile and frees the old GPU resources. → Task 10 test `setProfile rebuilds without leaking geometries`.
3. **Reduced motion toggled live (OS or app):** a running scene settles and stops requesting frames. → Task 5 test `reduced motion stops the loop`, Task 15 e2e.
4. **Scene off-screen or tab hidden:** no frames are requested. → Task 5 tests `hidden tab pauses` and `off-screen pauses`.
5. **Malformed or extreme configurator input** (negative, huge, unknown ids): the campus stays bounded and finite. → Ported tests in Tasks 8–9 (`malformed, missing and negative input…`, `maximum enrollment and programs stay within limits…`).

---

## File Structure

```
packages/themes/src/three.ts                ThreeProfile type, PAPERCRAFT/LOWPOLY defaults, resolveThreeProfile()
packages/mascot/
  src/vendor/geeky/{embedded.js, live/*.mjs, PROVENANCE.md}   vendored as-is (+ header line)
  src/vendor/geeky.d.ts                     types for the vendored modules
  src/geeky3d.ts                            port of lab/campus-geeky.js
  src/index.ts
packages/three/
  src/kit/{campus-kit.ts, palette.ts}       port of lab/campus-kit.js; active-palette swapping
  src/paper/{kit,material,catalog,pieces-kit,pieces-rooms,pieces-links,pieces-nature,pieces-furniture,pieces-tech,pieces-people,person-contract,inspector,inspector-person}.ts
  src/paper/r2/{person-r2,primaria-r2-data}.ts
  src/people/campus-people.ts
  src/assembly/scene-assembly.ts
  src/core/{stage,orbit,pick,profile}.ts    new generic engine pieces
  src/react/{ThreeHost.tsx,index.ts}
  src/index.ts
experiences/campus/
  src/{layout,plan,plan-fixtures,compose,entities,activity,actors,architecture,feedback,xray,scene,index}.ts
  src/react/{CampusStage,CampusHud,CampusSummary,index}.tsx
apps/lab/src/sections/experiences/{ExperiencesPage,CampusDemo,CampusConfigurator}.tsx
apps/lab/src/sections/kit3d/{Kit3dPage,PieceViewer}.tsx
packages/ui/src/components/Background.tsx   'flat' and 'gradient-blobs' background variants
agent-pack/skills/build-3d-experience/SKILL.md
```

Source mapping (cotizador `asesor/lab/…` → here): `campus-kit` → `three/kit/campus-kit`; `paper/{kit,material,catalog,pieces-*,person-contract,inspector,inspector-person,r2/*}` → `three/paper/…`; `campus-people` → `three/people/campus-people`; `paper/scene-assembly` → `three/assembly/scene-assembly`; `campus-layout` → `campus/layout`; `paper/plan` (+`plan-fixtures`) → `campus/plan`; `paper/compose` → `campus/compose`; `paper/scene-entities` → `campus/entities`; `paper/scene-activity` → `campus/activity`; `campus-actors` → `campus/actors`; `campus-architecture` → `campus/architecture`; `asesor/campus-experience.js` → `campus/feedback`; `campus-scene.js` → split into `three/core/{stage,orbit,pick}` + `campus/{scene,xray}`; `campus-geeky` + `geeky/**` → `mascot`. Not ported: `lab-scene.js` (the duck), `inspector-entry.js`, the cotizador's pricing, PDF and build tooling.

---

### Task 1: `@guategeeks/three` scaffold, kit utilities and palettes

**Files:** Create `packages/three/{package.json,tsconfig.json,vitest.config.ts}`, `src/kit/campus-kit.ts`, `src/kit/palette.ts`, `src/index.ts`; modify root `package.json` workspaces and `tsconfig.json` references. Test: `packages/three/test/kit.test.ts`.

**Interfaces:**
- Produces, from `campus-kit.ts` (same names and behavior as the source): `TAU, clamp, lerp, smooth, span, backOut, hash, pick, PAL, LEVEL_COLOR, PROGRAM_COLOR, col, Rig, createBuilder, rigidSkinning, releaseEntityGroup`.
- Produces, from `palette.ts`:
  - `type PaletteKey = keyof typeof PAL_BASE`
  - `withPalette<T>(overrides: Partial<Record<PaletteKey, string>>, build: () => T): T`, which swaps the values of the exported `PAL` (and `PAPER`, Task 2) for the duration of `build` and restores them in `finally`
  - `paletteSignature(overrides): string`
- `PAL` stays a mutable object, so every piece keeps reading `PAL.x` at build time. `PAL_BASE` is a frozen copy of the source values.

- [ ] **Step 1: Tests:**
  - `hash and pick are deterministic`: same seeds give the same value, values are in [0, 1).
  - `easings`: `backOut(1) === 1`, `smooth(.5) === .5`, `span(t, a, b)` is clamped.
  - `withPalette swaps and restores, even on throw`: `PAL.roof` is overridden inside `build` and restored after, including when `build` throws.
  - `paletteSignature is stable for equal overrides in any key order`.
  - `createBuilder builds skinned geometry`: a builder adds a box under one bone → one mesh with `skinIndex`.
  - `releaseEntityGroup disposes geometries`: spy on `dispose`.
- [ ] **Step 2: Run** `npx vitest run packages/three` → FAIL.
- [ ] **Step 3: Port** `campus-kit.js` with the provenance header and add `palette.ts`. Dependencies: `three@0.186.1`; dev dependency `@types/three@0.186.0`.
- [ ] **Step 4: Run** → PASS; `npx tsc -b` → 0.
- [ ] **Step 5: Commit** `feat(three): kit utilities and palette swapping (port)`.

### Task 2: Paper kit, materials and staged assembly

**Files:** Create `packages/three/src/paper/{kit,material}.ts`, `src/assembly/scene-assembly.ts`. Test: `packages/three/test/paper.test.ts`.

**Interfaces:**
- From `paper/kit.ts`: `T, SCALE, PAPER, edgeTone, shadeTone, paperKit, stage, newMeta`. `PAPER` is mutable like `PAL`; `withPalette` also accepts `PAPER` keys.
- From `paper/material.ts`: `paperMaterial({ fibre, mottle, ...params })` and `paperMaterials(opts?: { fibre?: number; mottle?: number })`. The fibre and mottle values come from the profile.
- From `scene-assembly.ts`: `MAX_ASSEMBLY, bindStaged, planAssembly, applyAssembly, pendingOf`, unchanged.

- [ ] **Step 1: Tests:**
  - `paper material is matte cardstock`: `flatShading` true, `roughness` .92, `metalness` 0, vertex colors on.
  - `paperMaterials honours fibre 0`: the compiled shader define `PAPER_FIBRE` is `0.0`, checked by running `onBeforeCompile` on a stub shader.
  - `assembly staggers fresh parts and ends at rest`: three staged parts with `animate: true`; at t = 0 they are not done, after `MAX_ASSEMBLY` they are all done with their final transforms, and `applyAssembly(..., true)` jumps straight to the end.
  - `edgeTone mixes toward ivory`: `edgeTone('#000000', 1)` → ivory.
- [ ] **Step 2: Run** → FAIL. **Step 3: Port** with headers. **Step 4: Run** → PASS. **Step 5: Commit** `feat(three): paper kit, materials and staged assembly (port)`.

### Task 3: Pieces, catalog, people and the R2 student

**Files:** Create `packages/three/src/paper/{catalog,pieces-kit,pieces-rooms,pieces-links,pieces-nature,pieces-furniture,pieces-tech,pieces-people,person-contract,inspector,inspector-person}.ts`, `src/paper/r2/{person-r2,primaria-r2-data}.ts`, `src/people/campus-people.ts`. Tests: `packages/three/test/{catalog,people}.test.ts`.

**Interfaces:**
- Same export names as the source: `GROUPS, CATALOG; PIECES` per file; `HAIR_COST, GEOMETRY_CAP, RESERVE, SHADOW_TRIANGLES, PERSON_LIMIT, personLimit, PRIMARIA_BASE, resolvePersonProfile, planPerson, personLandmarks, COMPONENTS, addPaperPerson; measureBase, alumnoContract; PERSON_SCALE, addPerson, pose, mixPose, POSES, reach, blendBody, applyPose, placePerson, along, turnTo; VIEWS, buildPiece, createInspector; PERSON_POSES, personPiece`.
- `createInspector(container, opts)` is ported, but its scene setup uses `createStage` from Task 5, and it accepts `profile`.

- [ ] **Step 1: Tests:**
  - **Ported:** from `people-contract.test.js`, `alumno base de primaria: medidas, presupuesto y plan = caras emitidas` and `presupuesto ≤ 320 con las recetas R3`. From `primaria-r2.test.js`, `R2: 20 recetas, 33 instancias, 280 triángulos…` and `R2 emitido: cada instancia en su hueso…`. Assertions are verbatim, converted to Vitest.
  - **Not ported:** the two tests that sync with the cotizador's docs or JSON. Their sources stay in the cotizador.
  - **New:** `every catalog piece builds finite geometry`, building each `CATALOG` entry with `buildPiece` and checking positions are finite and the triangle count is > 0.
  - **New:** `catalog ids are unique and grouped`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Port** with headers, keeping `inspector.ts` independent of `createStage` until Task 5 (ruling allowed: wire it then). **Step 4: Run** → PASS. **Step 5: Commit** `feat(three): papercraft pieces, catalog and people (port)`.

### Task 4: 3D theme profiles

**Files:**
- Create `packages/themes/src/three.ts`.
- Modify `packages/themes/src/{types,validate,index}.ts`, `src/build/merge.ts`, `themes/guategeeks/theme.json` and `themes/halloween/theme.json`.
- Create `packages/three/src/core/profile.ts`.
- Tests: `packages/themes/test/three.test.ts` and `packages/three/test/profile.test.ts`.

**Interfaces:**
```ts
// @guategeeks/themes
type ThreeProfileId = 'papercraft' | 'lowpoly';
interface ThreeProfile {
  id: ThreeProfileId; background: string; ground: string; groundOpacity: number;
  sky: string; skyGround: string; skyIntensity: number; sun: string; sunIntensity: number;
  fill: string; fillIntensity: number; exposure: number; marker: string; preview: string;
  fibre: number; mottle: number; palette: Record<string, string>;
}
const THREE_PROFILES: Record<ThreeProfileId, ThreeProfile>;
function resolveThreeProfile(input?: { profile?: ThreeProfileId } & Partial<Omit<ThreeProfile, 'id'>>): ThreeProfile;
// ResolvedTheme gains: three: ThreeProfile   (merged along `extends`, like tokens)
// ThemeManifest.three becomes: { profile?: ThreeProfileId } & Partial<Omit<ThreeProfile, 'id'>>
// @guategeeks/three
function profileOf(theme: ResolvedTheme): ThreeProfile;   // convenience re-export
```
- **`papercraft`** has the cotizador's values: background `#F4F1F6`; sky `#ffffff`/`#d9cfe6` at 1.55; sun `#fff3e4` at 2.1; fill `#e6dcff` at .45; ground `#3a2470` at .16; exposure 1; marker `#ffc857`; preview `#25c2c6`; fibre .045; mottle .025; palette `{}`.
- **`lowpoly`** is `papercraft` with fibre 0, mottle 0 and exposure 1.05.
- **The `halloween` manifest** sets `"three": { "profile": "papercraft", … }`. Starting values, to tune by eye in Task 12 with screenshots:
  - background `#160f1f`, sky `#b9a2e8`/`#2a1838` at .9, sun `#cfe0ff` at 1.4, fill `#ff9447` at .35, ground `#000000` at .35;
  - marker `#b6ff3b`, preview `#ff7a1a`;
  - palette `{ lawn: '#4b3a6b', lawn2: '#43345f', lawn3: '#55447a', roof: '#3b2a48', roofLight: '#4d3a5e', orange: '#ff7a1a', bloom: '#ff7a1a', sky: '#2a1838' }`.

- [ ] **Step 1: Tests:**
  - `brand resolves papercraft`.
  - `halloween overrides merge over papercraft`: `three.background === '#160f1f'` and `fibre === .045`.
  - `validateManifest rejects bad three colors and unknown profile`.
  - `profileOf returns the resolved profile`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** `npm run generate && npx vitest run packages/themes packages/three` → PASS. **Step 5: Commit** `feat(themes): 3d profiles for themes`.

### Task 5: Core stage (render on demand, quality, lifecycle)

**Files:** Create `packages/three/src/core/stage.ts`. Test: `packages/three/test/stage.test.ts` (jsdom, with a fake renderer, `requestAnimationFrame` and observers).

**Interfaces:**
```ts
interface FrameTick { time: number; dt: number; live: boolean }        // dt in s, clamped [.001,.5]; live = motion allowed
interface StageOptions {
  profile: ThreeProfile; reducedMotion?: boolean; shadows?: boolean;
  createRenderer?: () => RendererLike;  // tests inject a fake; default WebGLRenderer({ antialias: true, powerPreference: 'low-power' })
  onReady?(): void; onLost?(error?: unknown): void;
}
interface Stage {
  canvas: HTMLCanvasElement; renderer: RendererLike; scene: Scene; camera: OrthographicCamera;
  lights: { sky: HemisphereLight; sun: DirectionalLight; fill: DirectionalLight }; ground: Mesh;
  readonly size: { w: number; h: number }; readonly quality: 'full' | 'eco'; readonly reducedMotion: boolean;
  onFrame(cb: (tick: FrameTick) => boolean): () => void;  // return true while still active
  onResize(cb: (size: { w: number; h: number }) => void): () => void;
  requestFrame(): void; setProfile(p: ThreeProfile): void; setReducedMotion(v: boolean): void; setPaused(v: boolean): void;
  setShadowBounds(center: Vector3, radius: number): void;
  getDiagnostics(): { quality: 'full' | 'eco'; frameInterval: number; maxFps: number; framePending: boolean; visible: boolean; contextLost: boolean; triangles: number; drawCalls: number; geometries: number };
  dispose(): void;
}
function createStage(container: HTMLElement, opts: StageOptions): Stage;
```
The rules move from `campus-scene.js` unchanged:
- **Frames:** after a render, the next frame is scheduled after `frameBudget − elapsed` while any `onFrame` callback returns true. `maxFps` is 60 with a fine pointer at full quality, else 30.
- **Eco quality:** degrade once (exponential moving average > 75 ms for > 45 frames) → shadow map off, pixel ratio 1, every material `needsUpdate`.
- **`canRender`** = not disposed, not lost, visible, and `!document.hidden`.
- **Observers:** `IntersectionObserver` with `rootMargin: '80px'`; `visibilitychange`; `ResizeObserver`, falling back to `window` resize.
- **WebGL context:** on `webglcontextlost`, call `preventDefault`, set `lost` and call `onLost`; on restore, resize and request a frame.
- **Shadow map:** 2048 or 1024 by width.
- **Pixel ratio:** min(DPR, 1.75), or 1 in eco.

`setProfile` applies the background, lights, ground and tone-mapping exposure, then requests a frame. The canvas gets `aria-hidden="true"` and `touch-action: pan-y`.

- [ ] **Step 1: Tests:**
  - `renders on demand`: no frame is requested after the first render when every callback returns false; `requestFrame()` triggers exactly one.
  - `keeps running while active and respects the fps cap`: a callback returns true three times, and timeouts are spaced at ≥ 1000/30 ms with a coarse pointer.
  - `degrades to eco after sustained slow frames`.
  - `hidden tab pauses` and `off-screen pauses`: no frames, and the next visibility resumes.
  - `reduced motion stops the loop`: `setReducedMotion(true)` → callbacks receive `live: false` once and no further frames are scheduled.
  - `context loss reports onLost`.
  - `setProfile applies scene colors`.
  - `dispose removes listeners and observers`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (new code; the rules are copied from the source). **Step 4: Run** → PASS. Wire `createInspector` (Task 3) onto `createStage`. **Step 5: Commit** `feat(three): render-on-demand stage with adaptive quality`.

### Task 6: Core orbit camera and picking

**Files:** Create `packages/three/src/core/{orbit,pick}.ts`. Test: `packages/three/test/orbit.test.ts`.

**Interfaces:**
```ts
interface OrbitLimits { yaw: number; pitch: number; yawLimit: number; pitchMin: number; pitchMax: number; zoomMin: number; zoomMax: number; panLimit: () => number }
interface OrbitState { yaw: number; pitch: number; zoom: number; pan: Vector3 }
interface Orbit {
  readonly current: OrbitState; readonly target: OrbitState;
  rotate(delta: number): void; tilt(delta: number): void; zoom(delta: number): void;
  zoomAt(factor: number, clientX?: number, clientY?: number): void;   // keeps the world point under the pointer
  set(target: Partial<Omit<OrbitState, 'pan'>> & { pan?: Vector3 }): void; reset(): void;
  step(dt: number): boolean;   // exponential approach, rate 6/s; true while moving
  settle(): void;
  attach(canvas: HTMLCanvasElement, camera: OrthographicCamera, handlers: { onChange(): void; onTap?(e: PointerEvent): void; onHover?(e: PointerEvent | null): void }): () => void;
}
function createOrbit(limits: OrbitLimits): Orbit;
function pickAt<T>(event: { clientX: number; clientY: number }, canvas: HTMLCanvasElement, camera: Camera, targets: Object3D[]): Object3D | null;
```
Input rules, from the source:
- A drag rotates once it moves horizontally ≥ 6 px.
- A mostly vertical touch drag (> 9 px) is released to page scrolling.
- Wheel zooms by `exp(-deltaY × lines × (ctrl ? .012 : .0018))` at the pointer.
- A two-finger pinch zooms around the midpoint and never drags.
- A tap (< 7 px, no drag) calls `onTap`.
- The mouse hover cursor is `pointer` over targets, else `grab`.
- Zooming back to ≤ 1 pulls the pan toward the centre.

- [ ] **Step 1: Tests:**
  - `step converges and reports rest`.
  - `rotate clamps to yawLimit`.
  - `zoomAt keeps the point under the pointer`: project a world point before and after.
  - `vertical touch drag does not rotate`.
  - `tap fires onTap, drag does not`.
  - `pinch zooms without rotating`.
  - `detach removes listeners`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS. **Step 5: Commit** `feat(three): orbit camera and picking`.

### Task 7: `@guategeeks/mascot` — Geeky 3D

**Files:** Create `packages/mascot/{package.json,tsconfig.json,vitest.config.ts}`, `src/vendor/geeky/**` (copied as-is from cotizador `asesor/lab/geeky/`, plus a header line), `src/vendor/geeky.d.ts`, `src/geeky3d.ts`, `src/index.ts`. Test: `packages/mascot/test/geeky.test.ts`.

**Interfaces:**
- `createGeeky3D(materials: Record<string, Material>, opts?: { reduced?: boolean }): Geeky3D`, where `Geeky3D = { group: Group; tick(time: number, dt: number, goal: GeekyGoal): void; settled: boolean; state: GeekyState; cue?(name: string, params?: object): void; ownMaterials(): Material[]; dispose(): void }`.
- `GeekyGoal = { goal: { x; y; z }; look: [number, number, number]; perched: boolean; celebrate: boolean; ground: number; cameraYaw: number; moving: boolean }`.
- `tsconfig`: `allowJs: true`, `checkJs: false`.

- [ ] **Step 1: Tests:**
  - `builds with exactly two own materials`.
  - `reduced motion is static`: `tick` with `moving: false` → `settled` true.
  - `glides toward a goal and settles after REST_AFTER`.
  - `dispose releases geometries`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Vendor + port.** **Step 4: Run** → PASS. **Step 5: Commit** `feat(mascot): geeky 3d (vendored geeky live + port)`.

### Task 8: Campus domain — layout, growth plan, feedback

**Files:** Create `experiences/campus/{package.json,tsconfig.json,vitest.config.ts}`, `src/{layout,plan,plan-fixtures,feedback,index}.ts`. Tests: `experiences/campus/test/{plan,feedback}.test.ts`. Modify root workspaces and references.

**Interfaces:**
- `layout.ts` keeps the source exports: `LEVEL_IDS, PROGRAM_IDS, LEVEL_NAMES, PROGRAM_NAMES, PROGRAM_LEVELS, CAMPUS_LIMITS, CELL, FLOOR_HEIGHT, TILE, COLUMN_X, ROW_Z, ROOM, WORKSHOP_SLOTS, normalizeCampusData, getAdjacency, deriveCampus`.
- `plan.ts`: `CELL_W, CELL_D, ROW_Z, GARDEN_D, FRONT_D, PORCH, SERVICE_PLANS, PLAN_LIMITS, FOOTPRINTS, footprintOf, derivePlanServices, planCampus`. Fixtures: `stateInput, STATE_NAMES`.
- `feedback.ts` is the UMD `campus-experience.js` turned into an ES module: `export function describe(data, previous, context)` plus its catalog `CAMPUS_PROGRAMS` (name, action, detail, icon, color).
- Types: `CampusData` (the `mascotData()` shape: `levels, students, programs, enrollment[], equipment[], focusedLevel?, focusedProgram?, activeConfig?, preview?`) and `CampusPlan`, the `planCampus` result. Both are explicit.

- [ ] **Step 1: Port tests verbatim** from `paper-plan.test.js` (25 tests) and `campus-experience.test.js` (9 tests), converted to Vitest.
- [ ] **Step 2: Run** → FAIL. **Step 3: Port.** **Step 4: Run** → PASS. **Step 5: Commit** `feat(experience-campus): layout, growth plan and feedback (port)`.

### Task 9: Campus composition, entities, actors and activity

**Files:** Create `experiences/campus/src/{compose,entities,activity,actors,architecture}.ts`. Test: `experiences/campus/test/campus.test.ts`.

**Interfaces:** Same names as the source: `composeCampus`; `groupPlan, entitySignature, buildEntityGroup, selectionOf`; `RUN, walkerWorld, tickActors`; `buildWorkshop, buildPopulation`; `stage, buildRoom, buildWorkshopShell, buildStorage, buildCirculation, buildEnvironment`. `entitySignature(group, plan, paletteSig = '')` gains the palette signature, so a theme change rebuilds entities.

- [ ] **Step 1: Port tests verbatim** from `campus.test.js` (26 tests). Add `signature changes with the palette`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Port.** **Step 4: Run** → PASS. **Step 5: Commit** `feat(experience-campus): composition, entities and activity (port)`.

### Task 10: Campus scene on the core

**Files:** Create `experiences/campus/src/{scene,xray}.ts`. Test: `experiences/campus/test/scene.test.ts` (jsdom; fake renderer through `StageOptions.createRenderer`).

**Interfaces:**
```ts
interface CampusSceneOptions { profile: ThreeProfile; reducedMotion?: boolean; createRenderer?: StageOptions['createRenderer'];
  onReady?(): void; onLost?(e?: unknown): void; onSelect?(s: { kind: 'level' | 'program'; id: string }): void }
interface CampusScene {
  update(data: CampusData): void; resize(): void; rotate(delta: number): void; zoom(delta: number): void; resetView(): void;
  setPaused(v: boolean): void; setReducedMotion(v: boolean): void; setFocus(f: CampusFocus): void; setInsets(i: Partial<Insets>): void;
  setHoverVerb(v: string): void; setView(name: CampusView): void; setProfile(p: ThreeProfile): void;
  capture(o?: { width?: number; height?: number }): string | null; getDiagnostics(): CampusDiagnostics; dispose(): void;
}
type CampusView = 'overview' | 'front' | 'patio' | 'people' | 'program';
const CAMPUS_BUDGET = { triangles: 40000, drawCalls: 150, materials: 10 };
function createCampusScene(container: HTMLElement, opts: CampusSceneOptions): CampusScene;
```
Port `campus-scene.js` onto `createStage` + `createOrbit` + `pickAt`, keeping every behavior from the source:
- framing (`fitBox`, `applyView`, `viewTarget`, insets);
- focus and named views;
- the X-ray, moved into `xray.ts`;
- the focus marker (colors from the profile);
- the hover tag;
- Geeky's goal and perch;
- `capture`;
- `getDiagnostics`, with the same fields.

Entities are built inside `withPalette(profile.palette, …)`. `setProfile` calls `stage.setProfile`, rebuilds every entity (the signature includes `paletteSignature`), then releases the old ones.

- [ ] **Step 1: Tests:**
  - `state 1 builds one classroom entity and reaches ready`.
  - `growing to state 6 keeps existing entity keys` (via `getDiagnostics().entityKeys`).
  - `setProfile rebuilds without leaking geometries`: diagnostics `geometries` at state 6 is unchanged after brand → halloween → brand.
  - `setView frames named views` (the target changes, and `view` equals the name).
  - `selection emits onSelect` (simulate a tap on a proxy's projected point).
  - `reduced motion settles immediately`.
  - `context loss reports onLost`.
  - `budget at the maximum configuration` (computed from geometry: triangles ≤ 40,000 and materials ≤ 10).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS. **Step 5: Commit** `feat(experience-campus): campus scene on the 3d core`.

### Task 11: React hosts and campus UI

**Files:** Create `packages/three/src/react/{ThreeHost.tsx,index.ts}` (export `@guategeeks/three/react`) and `experiences/campus/src/react/{CampusStage,CampusHud,CampusSummary,index}.tsx` (export `@guategeeks/experience-campus/react`). Tests: `packages/three/test/react.test.tsx` and `experiences/campus/test/react.test.tsx`.

**Interfaces:**
- **`ThreeHost<E extends { dispose(): void }>`** takes `{ create(container: HTMLElement): E; onEngine?(engine: E | null): void; className?; children? }`. It creates the engine once on mount, disposes it on unmount, and is StrictMode-safe (creates in an effect, and the cleanup disposes).
- **`CampusStage`** takes `{ data: CampusData; focus?: CampusFocus; view?: CampusView; paused?: boolean; onSelect?; onState?(s: { ready: boolean; lost: boolean; diagnostics?: CampusDiagnostics }): void; engineRef? }`.
  - Its profile comes from `useTheme()` + `getTheme(theme).three`, and its reduced motion from the runtime's `motion`. Both apply live.
  - If WebGL is unavailable (`createRenderer` throws) or the context is lost, it renders nothing in the canvas area and reports `lost`.
- **`CampusHud`** is a `GlassPanel` with:
  - the title "Mi propuesta" and four counters (estudiantes atendidos, participaciones, simultáneos, equipos);
  - camera tools as `IconButton` + `Tooltip`: Vista general, Programa activo, Girar ←/→, Acercar, Alejar, Restablecer, Pausar/Reanudar;
  - a view `SegmentedControl` (General, Frente, Patio, Personas);
  - a legend disclosure "Representación de tu configuración".
- **`CampusSummary`** is the text alternative. It is always rendered: visually hidden when 3D works, and visible otherwise.

- [ ] **Step 1: Tests:**
  - `ThreeHost creates once and disposes on unmount (StrictMode)`.
  - `CampusStage passes theme profile changes to setProfile` (mock engine).
  - `CampusStage forwards reduced motion`.
  - `HUD buttons call the engine` (rotate, zoom, setView, resetView, setPaused).
  - `summary is visible when lost`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS. **Step 5: Commit** `feat(three,campus): react hosts, campus hud and summary`.

### Task 12: Lab — Experiencias (campus demo)

**Files:** Create `apps/lab/src/sections/experiences/{ExperiencesPage,CampusDemo,CampusConfigurator}.tsx`. Modify `router.ts` (section `experiences`), `App.tsx` (nav item "Experiencias" with lazy page) and `copy.ts`. Test: `apps/lab/test/experiences.test.tsx` (mock `@guategeeks/experience-campus/react`).

**Interfaces:**
- **`CampusConfigurator`** takes `{ value: CampusData; onChange(v: CampusData): void }`:
  - level toggles (Preprimaria, Primaria, Básico, Bachillerato);
  - students per level with `NumberStepper` (0–400);
  - program toggles (Tale-Bot, Robot Master, SPIKE Prime, Electrónica, Drones, Realidad virtual), with units derived as students / ratio.
  - Presets: "Un aula", "Escuela mediana", "Campus completo". They are the plan fixture states 1, 3 and 6.
- **`CampusDemo`**:
  - a configurator side panel (a bottom sheet on phones);
  - the stage filling the rest, with the HUD over it;
  - a contextual feedback card using `feedback.describe(data, previous, focus)`, which enters with the `enter.item` preset;
  - a click on a building focuses it and opens its configuration.
- The router keeps `#/experiences`, and `#/experiences/campus` is the campus.

- [ ] **Step 1: Tests:**
  - `toggling a program updates the stage data`.
  - `presets set the fixture state`.
  - `selecting a building focuses its configuration`.
  - `feedback describes the last change`.
  - `the section is lazy`: `App` renders a fallback, then the page.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** Tune the `halloween` 3D profile values by screenshots (brand light, brand dark, halloween); record the final values in the manifest. **Step 4: Run** → PASS. **Step 5: Commit** `feat(lab): experiencias section with the campus`.

### Task 13: Lab — Kit 3D

**Files:** Create `apps/lab/src/sections/kit3d/{Kit3dPage,PieceViewer}.tsx`. Modify the router, `App.tsx` (nav "Kit 3D") and `copy.ts`. Test: `apps/lab/test/kit3d.test.tsx` (mock the inspector).

**Interfaces:**
- **`PieceViewer`** takes `{ pieceId: string; profile: ThreeProfile; pose?: string }` and mounts `createInspector` through `ThreeHost`.
- **`Kit3dPage`** has:
  - tabs per `GROUPS`, with a list of the pieces and a viewer;
  - a profile switch (Tema actual / Papercraft / Low-poly);
  - views (`VIEWS` from the inspector);
  - for people, a pose selector;
  - a triangle readout against the person budget (280 / 320).

- [ ] **Step 1: Tests:** `lists every catalog group`, `choosing a piece updates the viewer`, `profile switch passes the profile`. **Step 2–4.** **Step 5: Commit** `feat(lab): kit 3d section`.

### Task 14: Motion in components and the animated background

**Files:** Create `packages/ui/src/components/Background.tsx`. Modify `packages/ui/src/components/{Card,Tabs,Toast,Dialog}.tsx` and `src/styles.css`. Modify the lab `App.tsx` header to use `<Background>`. Tests: `packages/ui/test/motion.test.tsx`.

**Interfaces:**
- **`Background({ children?, className? })`** renders `<VariantSlot point="background" fallback="flat" …>`.
  - `flat` is a plain `bg-bg` surface.
  - `gradient-blobs` is a port of the guategeeks.github.io Hero blobs:
    - three radial blobs in `color-mix(in srgb, var(--gg-color-action|accent|hero) 40%, transparent)`;
    - a pointer parallax capped by rAF;
    - a `liquid-morph` keyframe animation at `--gg-duration-*` scale.
  - Under reduced motion the blobs are static and there is no parallax.
- **Motion additions:**
  - Card `interactive` lifts 2px with `--gg-shadow-float` on hover.
  - Tabs panel enters with `rise`.
  - Toast enters with `slideInRight` (`popIn` on phones) and exits with `fadeOut`.
  - The Dialog overlay fades in.
  - Every one uses `@guategeeks/motion` presets or CSS with `--gg-duration-*`, which is zero under reduced motion.

- [ ] **Step 1: Tests:**
  - `background defaults to flat`.
  - `gradient-blobs registered and static under reduced motion` (no rAF listener).
  - `tabs panel plays rise on change`.
  - `toast plays slideInRight`.
  - `token-guard still passes`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS. Update the visual baselines for changed frames (`--update-snapshots`, then review). **Step 5: Commit** `feat(ui): component motion and animated background variant`.

### Task 15: End-to-end checks for 3D

**Files:** Create `apps/lab/e2e/{experiences,kit3d,bundle}.spec.ts`. Modify `e2e/a11y.spec.ts` to add the new pages.

- [ ] **Step 1: Tests:**
  - `campus renders and reports ready`: the stage container gets `data-ready="true"` within 10 s, and the canvas has non-zero size.
  - `maximum configuration stays within budget`: the "Campus completo" preset gives `data-triangles` ≤ 40,000, `data-draw-calls` ≤ 150 and `data-materials` ≤ 10. CampusDemo exposes the diagnostics as data attributes on its stage container.
  - `clicking a workshop focuses its program`.
  - `reduced motion settles`: `data-frame-pending="false"` within 1 s of a change.
  - `no WebGL shows the summary`: an init script makes `HTMLCanvasElement.prototype.getContext` return null for webgl/webgl2; the summary is visible and there are no page errors.
  - `kit 3d shows a piece`.
  - `bundle`: the built `dist/index.html` entry chunk does not contain the string `WebGLRenderer`.
  - Axe runs on Experiencias and Kit 3D, with the canvas excluded.
- [ ] **Step 2: Run** `npm run build && npm run e2e` → PASS (fix the code, not the tests).
- [ ] **Step 3: Commit** `test(lab): 3d experience, kit, bundle and a11y checks`.

### Task 16: Agent pack and docs

**Files:** Create `agent-pack/skills/build-3d-experience/SKILL.md`. Modify `agent-pack/CONTEXT.md` (3D section), `agent-pack/llms.txt`, `agent-pack/test/agent-pack.test.ts` (expected skills list), `README.md` and `AGENTS.md`.

The skill covers:
- choosing `createStage` + `createOrbit` for a new scene, versus reusing an experience;
- `ThreeHost` in React;
- profiles from the theme;
- budgets;
- render on demand;
- reduced motion;
- the text alternative;
- lazy loading;
- adopting the campus in the cotizador (`@guategeeks/experience-campus` + `createCampusScene` replacing `GGLab.createMascot`, with the same method names).

- [ ] **Step 1: Update the test** to expect three skills. **Step 2: Run** → FAIL. **Step 3: Write.** **Step 4: Run** `npm test` → PASS. **Step 5: Commit** `docs(agent-pack): build-3d-experience skill and 3d context`.

---

## Self-Review Notes

- **Spec §6 coverage:**
  - engine core → Tasks 5, 6 and 10;
  - papercraft kit → Tasks 2 and 3;
  - Geeky 3D → Task 7;
  - interactivity (HUD, counters, legend, selection, feedback, text summary) → Tasks 11 and 12;
  - React wrapper and `mountScene` → Task 11 (`ThreeHost`; any `createCampusScene` is itself the plain-JS mount);
  - campus reference experience → Tasks 8–12;
  - port parity tests → Tasks 3, 8 and 9;
  - budgets → Tasks 10 and 15;
  - lowpoly profile → Task 4;
  - 3D Kit section → Task 13.
- **Decision to confirm with the user:** spec §6 mentions a react-three-fiber wrapper. This plan wraps the imperative engines with `ThreeHost`, because the stage must own the renderer for its quality governor and render-on-demand loop. A react-three-fiber adapter (`useThree` supplying renderer, scene and camera) is deferred until a product composes declarative scenes with kit pieces.
- **Added at the user's request** (motion and controls feedback): Task 14, component motion and the `gradient-blobs` background.
- **Deferred:** the remaining themes and editions, more variant points and values, and the Variants and Editions pages (phase 3); product adoption (phase 4).
