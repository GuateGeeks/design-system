# Geeky page, `<Geeky>` component and the legacy school — design

Decided 2026-10-26 in conversation. Builds on `2026-10-25-guategeeks-design-lab-design.md` (the lab) and `2026-10-26-geeky-upstream-design.md` (Geeky from geeky-animation by tag).

## Intent

Two additions to the lab, plus the component the first one documents:

1. **A "Geeky" section** for product teams: to learn how to use Geeky in their screens, try it, and copy working code. Not a release-review tool (the update PR's signature snapshot covers that).
2. **`<Geeky>`**, a ready-to-use React component in `@guategeeks/mascot`, so a product can put Geeky on an ordinary screen (onboarding, rewards, waiting) without touching geeky-animation directly. Today the design system only offers Geeky inside a 3D scene (`createGeeky3D`).
3. **The previous low-poly school from the cotizador**, shown in Experiencias as a **historical reference**: how the school looked before the papercraft campus, preserved, not evolved.

## Goals

- A product team reads the Geeky page, picks what Geeky should communicate (an *intent*), sees it live in 2D or 3D under the current theme, and copies a snippet that works in their product.
- `<Geeky>` follows the theme (colours per theme and scheme), the lab/product motion preference and the accessibility rules, with nothing for the product to wire by hand.
- The legacy school is viewable as it was: the full example school, explorable with the camera; tapping a workshop names it and shows its activity.

## Non-goals

- The legacy school is not themed, not configurable (no configurator), not published for products, not improved or refactored.
- No costumes yet (theme `mascot.costume` stays unused); no new Geeky actions or behaviours here — those belong in geeky-animation.
- No changes to the papercraft campus beyond receiving the theme's Geeky palette.

## Anti-goals

- Re-implementing Geeky's behaviour in the design system (the brain, interaction, loop). If `<Geeky>` needs something the actor lacks, it is added in geeky-animation and arrives with a release.
- A Geeky page that only lists actions without telling teams when (and when not) to use Geeky.
- Geeky becoming the only carrier of a message: important information is always text.
- A historical reference that silently drifts from what the cotizador had.

## Constraints

- Repo rules (AGENTS.md): semantic tokens only in lab UI and components (token guard test); 3D sections lazy (e2e bundle check: three.js never in the entry chunk); render on demand; every 3D view ships a text alternative; lab copy Spanish, code and docs English; ported code keeps provenance.
- Geeky comes from `@guategeeks/geeky` (`./model`, `./actions`, Live actor via `.`). In v1.1.0 the Live actor has gaps `<Geeky>` needs closed (see §0); they are fixed upstream in a geeky-animation **v1.2.0** that this work starts with. The actor takes `frameColor` only (no full palette); the full palette applies to the 3D model (`createGeekyModel`).
- The legacy school's code is cotizador `main@a125f6f` `asesor/lab/`: `campus-scene.js` (`createMascot(container, {reduceMotion, onSelect, onReady, onLost})` → `{update, resize, rotate, zoom, resetView, setPaused, setFocus, setInsets, setHoverVerb, getDiagnostics, dispose}`), `campus-layout.js`, `campus-kit.js`, `campus-architecture.js`, `campus-actors.js`, `campus-people.js` (~2,550 lines), three 0.186.1 (same as here). It imports `createGeeky(materials)` from `./campus-geeky.js` with the contract `{group, tick(time, dt, goal), settled, state.p}` and disposes it via `releaseEntityGroup(group)` — the same contract `createGeeky3D` keeps (it was ported from the same campus; scale `.027` matches).

## Approaches

**Legacy school**
- **A · Preserve as-is (chosen).** Copy the six files byte-identical into a private experience package with SHA256 provenance; replace only `campus-geeky.js` with a one-line module that re-exports `createGeeky3D` as `createGeeky` (the old low-poly Geeky was retired at the user's request); a small typed adapter mounts it with the showcase data and wires selection. Faithful and cheap; stays JavaScript with its own renderer, outside the 3D core.
- B · Port to TypeScript on the 3D core. Uniform, but ~2,500 lines rewritten and the reference would change. Rejected: contrary to "historical reference".

**`<Geeky>`**
- **A · Wrap the Geeky Live actor (chosen).** `GeekyActor` already has the loop, gaze, blinks, pointer/touch reactions, reduced motion, events, 2D/3D switching and switches to turn interactions off. `<Geeky>` maps intents to actions and applies theme colour, motion preference and accessibility. Upstream improvements arrive with each release.
- B · Rebuild the actor from the brain and renderers. More local control, but duplicates and drifts from geeky-animation; the control is available anyway by changing geeky-animation (same organisation). Rejected.

## Decided

### 0. geeky-animation v1.2.0 first (answered by the anti-goal: gaps go upstream)

The v1.1.0 `GeekyActor` lacks what `<Geeky>` needs; this work first ships, in geeky-animation (PR → merge → tag `v1.2.0` → the design system's update PR), a minor release that adds:
- `frameColor` in `GeekyLiveOptions` (types) and a runtime setter (`setFrameColor(hex)`) so a theme/scheme change recolours without recreating the actor;
- `THREE` accepted as a loader function (`() => import('three')`) in the actor, as the assistant already allows;
- control over the accessible label: an option to keep the host's label as given (no action label appended), and no label at all when the host is decorative;
- `autonomous` togglable at runtime (it exists as an option) and a way to hold an action's pose at rest (`setBase` already exists; document it for this use).
The design system then pins v1.2.0 through `npm run geeky:update` (its own update PR). No local workarounds for these gaps.

### 1. `<Geeky>` (`@guategeeks/mascot/react`)

- New subpath export `./react` (React is a peer dependency, as in `@guategeeks/three/react`). `data-gg="geeky"` on the host element.
- Props (names are the builder's within this shape): `intent` *or* `action` (an action id; `intent` wins when both), `render: '2d' | '3d'` (default `'2d'`), `size` (CSS length, default `8rem`, square), `interactive` (default `false`: no drag/poke reactions on product screens), `followPointer` (default `true`), `label` (accessible name; without it the element is decorative, `aria-hidden`), `onActionEnd`.
- **Intents** are the recommended way to use Geeky. Exported list with English ids and Spanish labels in the lab; each maps to one action of `ACTION_LIST`, chosen by the builder from these meanings: `welcome` (greet), `goodbye`, `celebrate` (success), `reward` (certificate/achievement), `waiting` (loading), `thinking` (processing), `idea` (tip), `attention` (look here), `error` (something failed — gentle, not alarming), `learning` (mentor), `idle` (rest). A test asserts every intent maps to an existing action id, so a removed upstream id fails the update PR.
- **3D** loads three.js lazily (dynamic import) only when `render="3d"`; no three.js in the entry chunk for 2D-only use.
- **Theme colour:** frame colour from the active theme and scheme (§3). **Motion:** follows the theme runtime's resolved motion (`data-motion`/`useTheme`), not only the OS setting; reduced motion = still pose.
- **Behaviour over time** (my call): no random idle fidgets on product screens (`autonomous: false` unless the `autonomous` prop is set). A one-shot intent (`welcome`, `celebrate`, `reward`, `idea`, `goodbye`, `error`, `attention`, `learning`) plays once, then Geeky returns to a calm rest and `onActionEnd` fires; changing `intent` (or passing a new `playKey`) plays again. Looping intents (`waiting`, `thinking`, `idle`) loop until the intent changes. Under reduced motion Geeky shows the intent's still pose and keeps it.
- **Pause** (my call, WCAG 2.2.2): a `paused` prop stops all animation (still pose). `<Geeky>` renders no control of its own; the *Reglas* tab and the agent pack require products to offer pause when a looping intent stays on screen longer than 5 s, and the lab page shows that control.
- Lifecycle: actor created on mount, destroyed on unmount, survives React StrictMode double-mount without leaks; intent/action/render/colour changes update the existing actor instead of recreating it where the actor allows it.
- Unit tests (jsdom) plus a visual baseline: a lab frame with `<Geeky>` in reduced motion, 2D, for each theme × scheme in the existing visual matrix — this also gives Geeky its first screenshot coverage.

### 2. Geeky page (lab section "Geeky", `#/geeky`)

Layout B ("Geeky en vivo primero"), chosen from the mockup:
- **Top:** a large live `<Geeky>` and a control panel — intent (radio list), exact action (select grouped like geeky-animation's groups), 2D/3D, reduced motion toggle (local preview override), and the generated code snippet for the current choices with a copy button. The theme is the lab's global theme switcher.
- **Action names in Spanish** (my call): the lab keeps a Spanish label table for the 50 actions and 7 groups, falling back to the upstream English label for an id it does not know (shown with an "(en inglés)" hint). A test lists untranslated ids without failing, so a minor upstream release never blocks its update PR; the update PR body can mention them.
- **Below, tabs:** *Cuándo usarlo* (do / don't, with examples), *Integrarlo* (install, `<Geeky>` in React, Geeky inside a 3D scene with `createGeeky3D`), *Reglas* (never cover content; important messages are text; reduced motion; pause; one Geeky per screen), *Todas las acciones* (catalogue of the 50 actions by group; choosing one plays it in the main stage), *Versión* (the `@guategeeks/geeky` version in use, link to its release and changelog).
- Spanish copy; lazy-loaded section; nav item between Experiencias and Kit 3D (builder may reorder).

### 3. Geeky colours per theme

- Theme manifest `mascot` becomes `{ costume?: string; palette?: { light?: GeekyPalette; dark?: GeekyPalette } }`, resolved along `extends` into `ResolvedTheme.mascot`.
- `<Geeky>` uses `palette[scheme].frame`; the campus (`createGeeky3D({palette})`) uses the full palette of the scheme that matches its 3D scene.
- Values: brand light keeps Geeky's default; brand dark and Halloween get palettes chosen by the builder. Validation at theme build: palette values are hex; `frame` reaches at least 3:1 contrast against the scheme's background (non-text contrast).

### 4. Legacy school (Experiencias)

- Private package `experiences/legacy-school` (`@guategeeks/experience-legacy-school`): `src/vendor/cotizador/` holds the six files byte-identical with `PROVENANCE.md` (source repo, commit `a125f6f`, paths, SHA256) and a test that recomputes the hashes; `campus-geeky.js` there is the design system's own one-line re-export of `createGeeky3D`, documented as the only replaced file.
- Typed adapter `mountLegacySchool(container, {reducedMotion, onSelect, onReady, onLost})`: calls `createMascot`, feeds the cotizador's showcase data (all four levels, 720 students, the six programs with 12 units, the same `sharing` per program as `showcaseData()`), sets the hover verb to "Explorar", returns rotate/zoom/reset/pause/dispose.
- In Experiencias, below "Campus vivo": a section titled as a historical reference with its date (24 Oct 2026) and source commit; a stage with reset-view and pause controls; tapping a workshop shows its name and activity description (the cotizador's `campus-experience.js` texts for the six programs) in a panel; a text alternative when WebGL is unavailable. Lazy-loaded.
- Looks exactly as it did, in every lab theme (its colours are fixed); only Geeky is the new one. That includes its backdrop: the old scene clears to transparent and the cotizador drew `#2e1853` behind it (`--scene` on `.campus-stage`, the landing hero). The legacy stage uses that colour as an explicit, documented exception to the semantic-token rule, scoped to the legacy stage only (answered: "tal como era… se ve igual").
- **Checks** (answered by "preserved, not evolved"): the legacy school is exempt from the lab's 3D budgets (triangles, draw calls, materials) — its diagnostics are shown for information only. It is tested for: hash integrity of the vendored files, reaching ready, tapping a workshop shows its panel, the no-WebGL text alternative, lazy loading (bundle check) and dispose without leaks.
- The floating tag the old scene creates (`.campus-tag`) is styled in lab CSS with semantic tokens.

### 5. Agent pack

- Product-facing guidance on `<Geeky>` (intents, rules, examples) in the agent pack (CONTEXT and the relevant skill/checklist), so agents in product repos use it the same way the page teaches.

## Left to the builder

- Intent → action choices within the meanings above; exact Spanish copy of the page and tabs; prop names within the stated shape.
- Brand-dark and Halloween palette values within the contrast rule.
- How the campus picks the scheme palette for its 3D scene.
- Snippet formatting; layout details of the panel and tabs; mobile arrangement (panel below Geeky).
- Whether the legacy school reuses lab stage components or has its own small stage wrapper.
