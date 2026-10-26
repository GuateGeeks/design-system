# Geeky from upstream Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** GuateGeeks/geeky-animation ships as the versioned package `@guategeeks/geeky`, `@guategeeks/mascot` depends on it by git tag instead of vendoring files, and each geeky-animation release opens an update pull request in the design system.

**Architecture:** Two repositories. Part A works in `/home/adawolfs/projects/geeky`, on the branch `feature/package`, branched from `0089c59` (remote `main`). It adds `package.json`/`exports`/types, a headless `ThreeRenderer` mode plus `createGeekyModel` (replacing the design system's `embedded.js`), contract tests, CI, the release workflow, license and docs. Part B works in this repo. `packages/mascot` imports from `@guategeeks/geeky`, `src/vendor/geeky` is deleted, and a `scripts/update-geeky.mjs` plus an `update-geeky.yml` workflow turn a release into a PR. Part C is the release and connection, with the user's confirmation at each outward step.

**Tech Stack:**
- geeky-animation: plain ES modules (`.mjs`), Node 22 `node:test`, hand-written `.d.mts` checked by TypeScript, GitHub Actions.
- Design system: npm workspaces, TypeScript 7 (`tsc -b`, NodeNext), Vitest, Playwright, changesets.

**Spec:** `docs/superpowers/specs/2026-10-26-geeky-upstream-design.md`

## Global Constraints

- **Package and version:** the package name is `@guategeeks/geeky`. The first release is `1.1.0`, tag `v1.1.0`. `package.json`, `manifest.json` and the `CHANGELOG.md` heading carry the same version.
- **Dependency spec:** `"@guategeeks/geeky": "github:GuateGeeks/geeky-animation#v<version>"`, in `packages/mascot/package.json`.
- **Entry points:** `.`, `./actions`, `./brain`, `./core`, `./three`, `./model`, `./svg`, `./player`, `./motion`, `./manifest.json`, `./package.json`, `./assets/*`. Every code entry has a `types` condition pointing to `types/<name>.d.mts`.
- **No `three` import:** geeky-animation never imports `three`; `THREE` is injected. The design system passes a narrow namespace.
- **Two materials:** Geeky owns exactly two materials at every moment, whatever the pose.
- **Package contents:** never GIF, MP4, `sprites_*`, `previews/`, `_site/`, `vendor/`, `docs/` or `tests/`. Unpacked size stays under 3 MB.
- **Semver contract:**
  - Removing or renaming an export or an action id is major.
  - Adding one is minor.
  - Motion or geometry tweaks are patch.
- **geeky-animation style:** keep its terse `.mjs` style and English docs. Pin GitHub Actions by commit SHA, as `pages.yml` does.
- **Design-system rules (AGENTS.md):**
  - Provenance headers stay.
  - Generated files are not committed.
  - Package docs are English; lab copy is Spanish.
- **Outward actions need explicit user confirmation:** pushing to geeky-animation `main`, merging, tagging, repository settings and secrets. Pushing a feature branch and opening its PR is already approved. Push with the token in `~/.ssh/token` through a one-off credential helper; never print or persist it.

## Review Focus

1. **An upstream release removes or renames an action id a product cues.** `cue('<unknown>')` must return `false`, not throw. Upstream's action-id contract test must fail before such a release ships. Covered by Task 3 and Task 5.
2. **The lockfile resolves a different commit than the tag in the spec**, for example after a hand-run `npm update` or a moved tag. A mascot test must fail when the installed version ≠ the spec's tag. Covered by Task 5.
3. **A palette value that is not a hex colour** (`var(--x)`, `rgb()`, `undefined`) must throw a `TypeError` that names the key, instead of rendering a black frame. Unknown keys are ignored. Covered by Task 2.
4. **A tag that does not match `package.json`/`manifest.json`** must fail the release workflow before a GitHub Release or dispatch exists. Covered by Task 4.
5. **The update workflow runs when already on the latest version, or receives an older version** (a replayed dispatch). It must make no change, open no PR and exit 0. Covered by Task 6 (pure logic) and Task 7, Step 3 (real repo).

---

## Part A — geeky-animation (`/home/adawolfs/projects/geeky`)

Setup, before Task 1:
1. `git fetch https` (the `origin` SSH remote has no key here; `https` uses the token helper).
2. `git switch -c feature/package https/main`, then confirm `git rev-parse --short HEAD` is `0089c59`.

### Task 1: Package manifest, entry points and types

**Files:**
- Create: `package.json`, `package-lock.json`, `types/{index,actions,brain,core,three-renderer,svg-renderer,geeky-player,geeky-motion}.d.mts`, `types/check.mts`, `types/tsconfig.json`
- Modify: `.gitignore` (nothing new; `node_modules/` is already there)

**Interfaces:**
- Produces:
  - `package.json`, with:
    - `"name": "@guategeeks/geeky"`, `"version": "1.1.0"`, `"type": "module"`, `"license": "Apache-2.0"`.
    - `"engines": {"node": ">=22"}`, `"sideEffects": false`.
    - `exports` mapping each entry to `{ "types": "./types/<x>.d.mts", "default": "./src/..." }`:
      - `.` → `src/live/index.mjs`
      - `./actions` → `src/live/actions.mjs`
      - `./brain` → `src/live/brain.mjs`
      - `./core` → `src/live/core.mjs`
      - `./three` → `src/live/three-renderer.mjs`
      - `./model` → `src/live/model.mjs` (created in Task 2)
      - `./svg` → `src/live/svg-renderer.mjs`
      - `./player` → `src/geeky-player.mjs`
      - `./motion` → `src/geeky-motion.mjs`
      - Plus `./manifest.json`, `./package.json` and `./assets/*`.
    - `files`: `src/`, `types/*.d.mts`, `manifest.json`, `assets/original/`, `assets/static/`, `assets/states/*/poster.svg`, `assets/states/*/poster.webp`, `assets/gaze/*.svg` (only if that folder exists; check `ls assets`), `LICENSE`, `CHANGELOG.md`, `README.md`.
    - `devDependencies`: `typescript` (same version as the design system, `7.0.2`), `three` `0.186.1`, `@types/three` `0.186.0`. These serve the type check and the model tests only.
    - `scripts`:
      - `"test": "node tests/player.test.mjs && node tests/live.test.mjs && node --test tests/technology.test.mjs tests/model.test.mjs tests/package.test.mjs"`
      - `"typecheck": "tsc -p types/tsconfig.json"`
      - `"release:notes": "node tools/release-notes.mjs"`
  - Types:
    - Start from the Socrates declarations (`/home/adawolfs/projects/socrates.app/src/design-system/geeky/live/{brain,svg-renderer,three-renderer}.d.mts`, `geeky-player.d.mts`). Move `actions.d.mts` from the design system's `packages/mascot/src/vendor/geeky/live/actions.d.mts`.
    - Every runtime export of each entry is declared; Task 3's API snapshot checks names, and `types/check.mts` imports each entry through the package name.
    - `ThreeRenderer`'s options type gains `scene?`, `lights?`, `beforeBuild?` (Task 2).
    - `types/model.d.mts` and the `./model` lines of `check.mts` arrive in Task 2.

- [ ] **Step 1:** In `types/check.mts`, write the failing type check: one `import * as X from '@guategeeks/geeky/<entry>'` per code entry, plus typed uses (`new GeekyBrain({seed: 1}).update(1/60)`, `resolveAction('greet').dur satisfies number`). `types/tsconfig.json`: `module`/`moduleResolution` `NodeNext`, `strict`, `noEmit`, `include: ["check.mts"]`.
- [ ] **Step 2:** `npm install` (creates the lockfile), then `npm run typecheck`. Expected: FAIL, cannot find module `@guategeeks/geeky/...`.
- [ ] **Step 3:** Write `package.json` (as above; the `./model` export may point at the not-yet-existing file) and the `.d.mts` files.
- [ ] **Step 4:** `npm run typecheck` passes. `node -e "import('@guategeeks/geeky/actions').then(m => console.log(m.ACTION_LIST.length))"` prints `50`.
- [ ] **Step 5:** Commit: `git add package.json package-lock.json types && git commit -m "Package Geeky as @guategeeks/geeky with entry points and types"`.

### Task 2: Headless ThreeRenderer and `createGeekyModel`

**Files:**
- Modify: `src/live/three-renderer.mjs` (constructor, `resize`, `destroy`)
- Create: `src/live/model.mjs` (moved from the design system's `packages/mascot/src/vendor/geeky/embedded.js` and adapted)
- Create: `tests/model.test.mjs`, `types/model.d.mts`
- Modify: `types/three-renderer.d.mts`, `types/check.mts` (a typed `createGeekyModel({THREE, palette: {frame: '#123456'}})` call)

**Interfaces:**
- Consumes: `ThreeRenderer`, `GeekyBrain`, `core.mjs` (`FRAME`, `PALETTE`, `PATHS`, `C`, `EYEBALL`, `PUPIL_R`, `GLYPHS`, `color`, `parsePath`).
- Produces:
  - `new ThreeRenderer(host, {THREE, scene, lights = true, beforeBuild, ...existing})`:
    - When `scene` is given: `host` may be `null`, and no `WebGLRenderer`, canvas, camera, raycaster or lights are created.
    - Geometry is built into `scene`.
    - `beforeBuild(renderer)` runs after `_materials()` and before `_build()`.
    - `resize`, `screenToChar`, `charToScreen`, `setZoom` and `setLabel` are no-ops (screen methods return `{x: 0, y: 0}`).
    - `destroy()` skips `gl` and the canvas.
    - Without `scene`, behaviour is byte-for-byte what it was.
  - `model.mjs` exports:
    - `DETAIL` (frozen, same values as `embedded.js`).
    - `MODEL_THREE_KEYS` (a frozen array of every `THREE` member the model and the headless renderer touch: the `THREE_NS` list from `embedded.js` plus `Color` and `Float32BufferAttribute`).
    - `MODEL_PALETTE` (frozen defaults: `{frame: FRAME, back: PALETTE.back, lid: PALETTE.lid3d, heart: PALETTE.heart, blush: PALETTE.blush}`).
    - `createGeekyModel({THREE, seed = 7, reduced = false, palette = {}, detail = {}})` → `{group, brain, renderer, step(dt), materials(): Material[], dispose()}`.
      - `group.name === 'geeky-model'`.
      - `materials()` always returns the same two materials.
      - `dispose()` is idempotent and removes `group` from its parent.
    - Errors:
      - A missing `THREE` member throws `TypeError('createGeekyModel: THREE.<Key> is missing')`.
      - A palette value not matching `/^#([0-9a-f]{3}|[0-9a-f]{6})$/i` throws `TypeError('createGeekyModel: palette.<key> must be a hex colour')`.
      - Unknown palette keys are ignored.

- [ ] **Step 1:** Write `tests/model.test.mjs` (`node:test`, `import * as THREE from 'three'`). It imports through `@guategeeks/geeky/model` and `@guategeeks/geeky/three`.
  - `builds headless with two materials`: `createGeekyModel({THREE, reduced: true})`.
    - `materials().length === 2`.
    - `group` has meshes.
    - No `canvas` property on `renderer`.
  - `step keeps every mesh finite`: after `step(1/60)` ×120 with `brain.play('celebrate')`, every mesh position is finite.
  - `default palette paints the rims FRAME`: the first rim mesh's `color` attribute equals `new THREE.Color(FRAME)` components.
  - `palette.frame recolours the rims`: with `{frame: '#ff0000'}`, the first rim's colour is `(1, 0, 0)` and there are still 2 materials.
  - `rejects non-hex palette values`: `{frame: 'var(--x)'}` throws `TypeError` matching `/palette.frame/`; `{costume: 'x'}` does not throw.
  - `reports missing THREE members`: `{THREE: {...THREE, Color: undefined}}` throws `/THREE.Color is missing/`.
  - `MODEL_THREE_KEYS is sufficient`: a namespace built only from `MODEL_THREE_KEYS` builds and steps.
  - `dispose is idempotent`: call it twice; `group.parent === null`.
  - `windowed ThreeRenderer is unchanged`: `new ThreeRenderer(null, {THREE})` throws as before (no DOM in Node), which shows the default path still creates a `WebGLRenderer`.
- [ ] **Step 2:** `node --test tests/model.test.mjs`. Expected: FAIL, cannot resolve `@guategeeks/geeky/model`.
- [ ] **Step 3:** Implement the headless mode in `three-renderer.mjs`, then `model.mjs`. Port `embedded.js` but construct with `new ThreeRenderer(null, {THREE, scene: group, lights: false, shadow: false, bleed: 0, frameColor: palette.frame, beforeBuild: r => prepare(r, shared, pal)})` instead of `Object.create`. Every `three` import becomes `THREE.<Key>`, and `tint` calls take the merged palette instead of `FRAME`/`PALETTE.*`. Keep the `embedded.js` comments that explain the two-material budget.
- [ ] **Step 4:** Run `npm test`. All suites pass, including the unchanged `live.test.mjs` and `technology.test.mjs` (the windowed path and choreography are preserved). Run `npm run typecheck`; it passes.
- [ ] **Step 5:** Commit: `git commit -am "Add headless ThreeRenderer mode and createGeekyModel for embedding Geeky in a host scene"`, adding the new files.

### Task 3: Contract tests (API, action ids, versions, package contents)

**Files:**
- Create: `tests/package.test.mjs`, `tests/fixtures/api.json`, `tests/fixtures/action-ids.json`, `tools/snapshot-api.mjs`

**Interfaces:**
- Produces:
  - `tools/snapshot-api.mjs` imports every code entry through the package name and prints `{ "<entry>": [sorted export names] }`. `--write` writes `tests/fixtures/api.json`.
  - `action-ids.json` is the sorted list of the current 50 `ACTION_LIST` ids. Like `original-live-actions.json`, it is never regenerated to hide a removal.

- [ ] **Step 1:** Write `tests/package.test.mjs` (`node:test`):
  - `exported API matches the snapshot`: the deep-equal of the live snapshot and `api.json`. On failure, the message says: "intended API change? run node tools/snapshot-api.mjs --write and bump the version per docs/PACKAGE.md".
  - `no action id disappears`: every id in `action-ids.json` is in `ACTION_LIST`, and `resolveAction(id)` returns it.
  - `versions agree`: `package.json` version === `manifest.json` version, and `CHANGELOG.md` contains `## [<version>]`.
  - `every export target exists and ships`: run `npm pack --dry-run --json` once (`execFileSync`). Every `exports` target path is in its `files` list. No path matches `/\.(gif|mp4)$|sprites_|^previews\/|^_site\/|^vendor\/|^docs\/|^tests\//`. `unpackedSize < 3_000_000`.
- [ ] **Step 2:** `node --test tests/package.test.mjs`. Expected: FAIL, missing fixtures and `CHANGELOG.md`.
- [ ] **Step 3:** Write `tools/snapshot-api.mjs`, run it with `--write`, and write `action-ids.json`. Add `CHANGELOG.md` with a `## [1.1.0] - 2026-10-26` section listing:
  - The package and entry points.
  - `createGeekyModel` and the headless renderer.
  - The palette option.
  - Types.
  - The Apache-2.0 license.
  - Earlier history as `## [1.0.0]`: the animation kit and Geeky Live.

  Set `manifest.json` `version` to `1.1.0`.
- [ ] **Step 4:** `npm test` passes. If `unpackedSize` exceeds 3 MB, drop `poster.webp` from `files` and say so in the commit.
- [ ] **Step 5:** Commit: `git commit -m "Add API, action-id, version and package-content contract tests"`, with all new files and `manifest.json`.

### Task 4: CI, release workflow, license and docs

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `tools/release-notes.mjs`, `LICENSE`, `docs/PACKAGE.md`
- Modify: `README.md` (an "Install" section near the top; replace the "Artwork and licensing" paragraph), `.github/workflows/pages.yml` (its test steps become `npm ci` + `npm test`)
- Test: `tests/package.test.mjs` (add cases)

**Interfaces:**
- Produces:
  - `tools/release-notes.mjs <tag>`:
    - Exits 1 with `tag v<x> does not match package.json <y>` (or manifest) on mismatch.
    - Otherwise prints the body of the `## [<version>]` section of `CHANGELOG.md`, and exits 1 if it is empty.
    - Exports `notesFor(changelog: string, version: string): string` and `checkTag(tag, pkgVersion, manifestVersion): string` (returns the version or throws) for tests.
  - `release.yml`, on `push: tags: ['v*']`, `permissions: contents: write`:
    1. checkout
    2. setup-node 22
    3. `npm ci`
    4. `npm test`
    5. `npm run typecheck`
    6. `node tools/release-notes.mjs "$GITHUB_REF_NAME" > notes.md`
    7. `gh release create "$GITHUB_REF_NAME" --notes-file notes.md --verify-tag`
    8. If `secrets.DESIGN_SYSTEM_DISPATCH_TOKEN` is set: `gh api repos/GuateGeeks/design-system/dispatches -f event_type=geeky-release -f "client_payload[version]=${GITHUB_REF_NAME#v}"` with that token. Otherwise `echo "::notice::..."` that the design system picks the release up on its weekly run.
  - `ci.yml` runs on `pull_request` and on `push` to `main`: `npm ci`, `npm test`, `npm run typecheck`.

- [ ] **Step 1:** Add tests to `package.test.mjs`:
  - `release notes for the current version`: `notesFor(changelog, version)` is non-empty and does not include the next `## [` heading.
  - `checkTag rejects a mismatched tag`: `checkTag('v9.9.9', '1.1.0', '1.1.0')` throws `/does not match/`; so does `checkTag('v1.1.0', '1.1.0', '1.0.0')`. `checkTag('v1.1.0', '1.1.0', '1.1.0') === '1.1.0'`.
- [ ] **Step 2:** `npm test`. Expected: FAIL, `tools/release-notes.mjs` not found.
- [ ] **Step 3:** Write `tools/release-notes.mjs` and both workflows (pin `actions/checkout` and `actions/setup-node` by commit SHA, like `pages.yml`).
- [ ] **Step 4:** Write the license and docs:
  - `LICENSE`: Apache-2.0 text, copyright 2026 GuateGeeks.
  - `docs/PACKAGE.md`:
    - Install.
    - The entry-point table.
    - `createGeekyModel` usage with a narrow `THREE` namespace.
    - The semver contract.
    - "Changing the API" (`tools/snapshot-api.mjs --write`).
    - Release steps: bump `package.json` + `manifest.json`, add the changelog section, merge, `git tag vX.Y.Z && git push origin vX.Y.Z`.
    - What the design system does next.
  - `README.md`: the Install section (`npm i github:GuateGeeks/geeky-animation#v1.1.0`) links `docs/PACKAGE.md`; the licensing paragraph states Apache-2.0.
- [ ] **Step 5:** Run `npm test` and `npm run typecheck`; both pass. Run `npx --yes @action-validator/cli .github/workflows/release.yml` (and the same for `ci.yml` and `pages.yml`); each reports no errors. If that tool cannot be fetched, parse each with `node -e` and the `yaml` package instead, and report which check ran.
- [ ] **Step 6:** Commit: `git commit -m "Add CI, tag-driven release with design-system dispatch, Apache-2.0 license and package docs"`.
- [ ] **Step 7:** Push and open the PR (already approved):
  - `git push https feature/package` through the token helper.
  - Open the PR to `main` with `gh pr create` (or the REST API with the token). Its body covers the summary, the API, the contract and the manual steps from Part C.

## Part B — design system (this repo)

Setup: create `feat/geeky-upstream` from `main` (via `superpowers:using-git-worktrees`).

### Task 5: Mascot consumes `@guategeeks/geeky`

**Files:**
- Modify:
  - `packages/mascot/package.json`: dependency, drop the `build` script.
  - `packages/mascot/tsconfig.json`: `include: ["src/**/*.ts"]`.
  - `packages/mascot/src/geeky3d.ts`: imports, model creation, `palette` option, `cue` on unknown ids.
  - `packages/mascot/src/index.ts`.
- Create: `packages/mascot/src/three-namespace.ts`, `packages/mascot/README.md`, `packages/mascot/test/upstream.test.ts`
- Delete: `packages/mascot/src/vendor/` (whole folder, including `PROVENANCE.md`; its provenance content moves to the README)
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: from Task 2, `createGeekyModel`, `MODEL_THREE_KEYS` and `MODEL_PALETTE` (`@guategeeks/geeky/model`); `ACTIONS` and `resolveAction` (`@guategeeks/geeky/actions`).
- Produces:
  - `GEEKY_THREE` (`src/three-namespace.ts`): a frozen object of named imports from `three`, exactly the members in `MODEL_THREE_KEYS`.
  - `createGeeky3D(_materials?, {reduced?, palette?: GeekyPalette})`: same `Geeky3D` contract as today. `ownMaterials()` returns `Material[]` of length 2. `cue(name)` returns `false` for an unknown id instead of throwing.
  - `index.ts` additionally re-exports `type GeekyPalette` from `@guategeeks/geeky/model`; `GEEKY_ACTIONS` and `GEEKY_ACTION_LIST` now come from `@guategeeks/geeky/actions`.

- [ ] **Step 1:** While v1.1.0 is not tagged, point the dependency at the pushed branch: `npm pkg set -w @guategeeks/mascot "dependencies.@guategeeks/geeky=github:GuateGeeks/geeky-animation#feature/package"`, then `npm install`. Part C switches it to `#v1.1.0`.
- [ ] **Step 2:** Write `packages/mascot/test/upstream.test.ts`:
  - `installed Geeky matches the pinned tag`: read `packages/mascot/package.json`. If the spec matches `#v(\d+\.\d+\.\d+)$`, expect `(await import('@guategeeks/geeky/package.json', {with: {type: 'json'}})).default.version` to equal it. Use `it.skipIf(!pinned)`, so while the spec is the temporary `#feature/package` the check is reported as skipped. Part C pins the tag and it runs.
  - `GEEKY_THREE covers MODEL_THREE_KEYS`: every key is a function in `GEEKY_THREE`.
  - `palette reaches the model`: `createGeeky3D({}, {reduced: true, palette: {frame: '#ff0000'}})` has 2 own materials and a rim mesh coloured `(1, 0, 0)`.
  - `unknown cue returns false`: `createGeeky3D({}, {reduced: false}).cue('no-such-action') === false`.
- [ ] **Step 3:** `npx vitest run --project @guategeeks/mascot`. Expected: FAIL, `three-namespace.ts` missing and `cue` throws `RangeError`.
- [ ] **Step 4:** Implement the source changes. `geeky3d.ts` keeps its provenance header and logic. Change only the imports, `createGeekyModel({THREE: GEEKY_THREE, reduced, palette})` (rename `stage` → `group` locally), `ownMaterials()`, and `cue` (a guard with `Object.hasOwn(ACTIONS, ALIASES[name] ?? name)` or a try/catch around `resolveAction` that returns `false`). Then delete `src/vendor/` and write `packages/mascot/README.md` covering:
  - What the package provides.
  - That Geeky comes from `@guategeeks/geeky` at the pinned tag.
  - How to update: `npm run geeky:update -- <version>`, from Task 6.
  - The provenance of `geeky3d.ts`.
- [ ] **Step 5:** Run `npm run build`, `npm test` and `npm run e2e` (no `--update-snapshots`). All pass with zero visual diffs, which proves parity with the vendored copy. `grep -rn "vendor/geeky" --exclude-dir=node_modules .` finds nothing outside `docs/`.
- [ ] **Step 6:** Commit: `git commit -m "feat(mascot): consume Geeky from @guategeeks/geeky instead of vendored files"` (with the lockfile; add a changeset `"@guategeeks/mascot": minor`).

### Task 6: Update script, workflow and docs

**Files:**
- Create: `scripts/update-geeky.mjs`, `.github/workflows/update-geeky.yml`, `packages/mascot/test/update-geeky.test.ts`
- Modify:
  - Root `package.json`: script `"geeky:update": "node scripts/update-geeky.mjs"`.
  - `AGENTS.md`: the `packages/mascot` row now reads "Geeky 3D adapter over `@guategeeks/geeky` (GuateGeeks/geeky-animation, pinned by tag; update with `npm run geeky:update`)", plus a Rules line: "Geeky changes are made in geeky-animation, never here".
  - `README.md`: the mascot row, and Release: how Geeky updates arrive.
  - `agent-pack/CONTEXT.md` and `agent-pack/skills/build-3d-experience/SKILL.md`, wherever they mention vendored Geeky.

**Interfaces:**
- Produces:
  - `scripts/update-geeky.mjs` exports:
    - `GEEKY_REPO = 'GuateGeeks/geeky-animation'`.
    - `geekySpec(version: string): string`, which throws on non-`X.Y.Z`.
    - `pinnedVersion(spec: string): string | null`.
    - `shouldUpdate(current: string | null, next: string): boolean`: true only when `next` is semver-greater, or `current` is null.
    - `changeset(version: string): string`: the frontmatter `"@guategeeks/mascot": minor` plus `Update Geeky to v<version> (GuateGeeks/geeky-animation).`
  - When run as main, `node scripts/update-geeky.mjs <version|latest>`:
    1. Resolves `latest` with `gh release view -R GuateGeeks/geeky-animation --json tagName -q .tagName`.
    2. If `!shouldUpdate`, prints `geeky already at v<current>`, writes `changed=false` to `$GITHUB_OUTPUT` when set, and exits 0.
    3. Otherwise sets the dependency with `npm pkg set -w @guategeeks/mascot`, runs `npm install`, writes `.changeset/geeky-v<version>.md`, and writes `changed=true` and `version=<v>`.
  - `update-geeky.yml`:
    - Triggers: `repository_dispatch: types: [geeky-release]`; `schedule: - cron: '0 14 * * 1'`; `workflow_dispatch: inputs: version (default 'latest')`.
    - `permissions: contents: write, pull-requests: write`; concurrency group `update-geeky`.
    - Steps:
      1. checkout, setup-node (`.nvmrc`, npm cache)
      2. `npm ci`
      3. `node scripts/update-geeky.mjs "${{ github.event.client_payload.version || inputs.version || 'latest' }}"` (id `bump`, `GH_TOKEN: ${{ github.token }}`)
      4. If changed: `npm run build`, `npm test`, playwright install
      5. `npm run e2e || { npm run e2e -- --update-snapshots && echo "snapshots=updated" >> "$GITHUB_OUTPUT"; }` (id `e2e`)
      6. `gh release view v$VERSION -R GuateGeeks/geeky-animation --json body -q .body > notes.md`
      7. `peter-evans/create-pull-request@v7`:
         - `token: ${{ secrets.GEEKY_UPDATE_TOKEN || github.token }}`
         - `branch: deps/geeky-v<version>`, `title: chore(mascot): update Geeky to v<version>`
         - `body`: the release notes, plus a checklist line. When `snapshots=updated`, the line reads "⚠️ Visual baselines were updated: review the images"; otherwise "Visual baselines unchanged".
         - Labels `dependencies`, `geeky`.

- [ ] **Step 1:** Write `packages/mascot/test/update-geeky.test.ts`, importing `../../../scripts/update-geeky.mjs`:
  - `geekySpec('1.2.0') === 'github:GuateGeeks/geeky-animation#v1.2.0'`; `geekySpec('v1.2')` throws.
  - `pinnedVersion(geekySpec('1.2.0')) === '1.2.0'`; `pinnedVersion('github:GuateGeeks/geeky-animation#feature/package') === null`.
  - `shouldUpdate`:
    - `('1.1.0', '1.1.0') === false`
    - `('1.2.0', '1.1.0') === false` (no downgrade)
    - `('1.1.0', '1.1.1') === true`
    - `('1.9.0', '1.10.0') === true` (numeric, not lexical)
    - `(null, '1.1.0') === true`
  - `changeset('1.2.0')` contains `"@guategeeks/mascot": minor` and `v1.2.0`.
- [ ] **Step 2:** `npx vitest run --project @guategeeks/mascot`. Expected: FAIL, module not found.
- [ ] **Step 3:** Implement the script (the guard is `import.meta.url === pathToFileURL(process.argv[1]).href`), the workflow and the doc edits.
- [ ] **Step 4:**
  - `npx vitest run --project @guategeeks/mascot` passes.
  - Run `node scripts/update-geeky.mjs 1.0.0` while pinned to the branch: it updates (current is null). Revert with `git checkout -- packages/mascot/package.json package-lock.json && rm -f .changeset/geeky-v1.0.0.md`. This proves the IO path. In Part C, once pinned to v1.1.0, re-run with `1.1.0`: it prints `geeky already at v1.1.0` and changes nothing.
  - Validate the workflow with `npx --yes @action-validator/cli .github/workflows/update-geeky.yml`.
- [ ] **Step 5:** Commit: `git commit -m "ci: open a pull request when GuateGeeks/geeky-animation publishes a release"`.

## Part C — release and connect (each step needs the user's confirmation)

### Task 7: Tag, pin, wire the automation

- [ ] **Step 1 (user):** Review and merge the geeky-animation PR from Task 4.
- [ ] **Step 2 (confirm, then do):** Tag and release:
  1. `git fetch https && git tag v1.1.0 https/main && git push https v1.1.0`.
  2. Watch `release.yml`: `gh run watch` or the REST API.
  3. Expected: the GitHub Release `v1.1.0` exists. The dispatch step logs the notice, because the secret is not set yet.
- [ ] **Step 3:** In the design system, run `npm run geeky:update -- 1.1.0`. It replaces the branch spec with `#v1.1.0`, because the branch spec has no pinned version.
  1. Then run `npm run build && npm test && npm run e2e`; all pass.
  2. `node scripts/update-geeky.mjs 1.1.0` prints `geeky already at v1.1.0`, which proves Review Focus 5 on the real repo.
  3. Commit `chore(mascot): pin Geeky v1.1.0`.
- [ ] **Step 4 (confirm, then do):** Finish the branch with `superpowers:finishing-a-development-branch`: merge `feat/geeky-upstream` to `main` and push. The site redeploys.
- [ ] **Step 5 (user, or with confirmation using their token):**
  - **geeky-animation:** create the secret `DESIGN_SYSTEM_DISPATCH_TOKEN`. It is a fine-grained PAT scoped to GuateGeeks/design-system, with Contents read & write.
  - **design-system:**
    - Settings → Actions → General → enable "Allow GitHub Actions to create and approve pull requests".
    - Optionally add the secret `GEEKY_UPDATE_TOKEN`, a PAT with Contents and Pull requests write. With it, CI also runs on the bot's PRs; with `GITHUB_TOKEN`, those PRs don't trigger `ci.yml`.
- [ ] **Step 6:** Prove the loop end to end: run `update-geeky.yml` by hand with `version=latest`. Expected: "geeky already at v1.1.0", no PR. The next real release (v1.1.1 or later) should produce a `deps/geeky-v…` PR.
