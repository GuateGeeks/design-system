---
name: build-3d-experience
description: Use when building or adopting a 3D scene in a GuateGeeks product — the papercraft campus from the cotizador, a new scene with the papercraft kit, or Geeky in 3D — so it follows the theme, the budgets, reduced motion and the text alternative.
---

# Build a 3D experience

Read [CONTEXT.md](../../CONTEXT.md) first. 3D lives in its own packages, so products that don't use it never download three.js:

| Package | Use |
|---|---|
| `@guategeeks/three` | `createStage` (renderer, lights, render-on-demand loop, adaptive quality, lifecycle), `createOrbit` (drag, wheel, pinch, tap), `pickAt`, the papercraft kit (`createBuilder`, `paperKit`, `paperMaterials`, `CATALOG`, people), `withPalette`, `createInspector`; `/react`: `ThreeHost` |
| `@guategeeks/mascot` | `createGeeky3D(materials, { reduced })` — Geeky inside your scene |
| `@guategeeks/experience-campus` | `createCampusScene` (the cotizador campus), `planCampus`, `campusCounts`, `describeCampusChange`; `/react`: `CampusStage`, `CampusHud`, `CampusSummary`; `/styles.css` |

## Rules

1. **Theme profile.** Every scene takes a `ThreeProfile`: `getTheme(theme).three` from `@guategeeks/themes`. Apply changes live with `setProfile(profile)`; build geometry inside `withPalette(profile.palette, () => …)` so theme colours reach the pieces. No colour literals for scene background, lights, ground or markers.
2. **Render on demand.** Register work with `stage.onFrame(tick => stillMoving)`; return `false` when settled. Never run your own `requestAnimationFrame` loop.
3. **Reduced motion.** Pass `reducedMotion` (the runtime's `motion === 'reduced'`) and call `setReducedMotion` when it changes; under `tick.live === false` jump to the final state.
4. **Budgets.** The campus stays within 40,000 triangles, 150 draw calls and 10 materials at its maximum configuration; measure new scenes the same way (`stage.getDiagnostics()`).
5. **Text alternative.** Always render a text summary of what the scene shows (`CampusSummary` for the campus). When WebGL is unavailable or the context is lost (`ThreeHost` `onError`, scene `onLost`), the summary is the content.
6. **Lazy load.** Import 3D sections with `React.lazy(() => import(…))` (or a dynamic `import()` in plain JS).
7. **Assembly.** Before `planAssembly`/`applyAssembly`, snapshot each bone's rest pose including `scale` (`bone.userData.rest = { position, quaternion, scale }`), as the campus entities do.

## React

```tsx
import { CampusHud, CampusStage } from '@guategeeks/experience-campus/react';

<CampusStage data={campusData} onSelect={openConfiguration} className="h-[70dvh]">
  <CampusHud engine={engine} data={campusData} paused={paused} onPausedChange={setPaused} />
</CampusStage>
```

`CampusStage` follows the theme and reduced motion by itself; pass overlay sizes to `engine.setInsets({ right, bottom })` so the campus frames in the free area.

## Adopting the campus in the cotizador

`createCampusScene(container, { profile, reducedMotion, onSelect, onLost })` replaces `GGLab.createMascot(container, opts)` with the same methods (`update(mascotData())`, `setFocus`, `setView`, `setInsets`, `setHoverVerb`, `rotate`, `zoom`, `resetView`, `setPaused`, `capture`, `getDiagnostics`, `dispose`) plus `setProfile` and `setReducedMotion`. Keep the pricing engine, PDF and quote state in the cotizador; feed the scene the same `mascotData()` shape (`CampusData`). Map the cotizador's own colours to brand roles with [adopt-guategeeks-design](../adopt-guategeeks-design/SKILL.md).

## Verify

- The lab's **Experiencias** and **Kit 3D** sections show the reference behaviour in every theme.
- `npm run e2e` covers: ready state, budget at the maximum configuration, selection, reduced motion, no-WebGL summary, and that the entry chunk has no three.js.
