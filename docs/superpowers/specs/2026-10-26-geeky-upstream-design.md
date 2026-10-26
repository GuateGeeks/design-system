# Geeky from upstream — design

Decided 2026-10-26 (option 1 of the integration proposal).

## Goal

GuateGeeks/geeky-animation is the lab where Geeky is created: actions, poses, rig, artwork, renderers, demos. The design system consumes Geeky from there as a versioned dependency instead of copying files, and a new geeky-animation release reaches the design system as a ready-to-review pull request.

## Today

- geeky-animation has no `package.json`, no tags, no types and no declared license. `main` is `0089c59`.
- The design system vendors 8 files byte-identical to `0089c59` in `packages/mascot/src/vendor/geeky`, plus `embedded.js` (from the cotizador). `embedded.js` mounts `ThreeRenderer` into a host scene with `Object.create(ThreeRenderer.prototype)`, a stub `gl`, two shared materials and hard-coded colours.
- Socrates and the cotizador keep their own copies (out of scope here; they move to `@guategeeks/mascot` during phase 4 adoption).

## Decision

1. **geeky-animation becomes the package `@guategeeks/geeky`**, installed by git tag: `"@guategeeks/geeky": "github:GuateGeeks/geeky-animation#vX.Y.Z"`. No npm registry yet; switching to a registry later changes only that spec string.
2. **Entry points** (`exports`, each with `.d.mts` types): `.` (Live: actor, assistant, brain, actions, renderers), `./actions`, `./brain`, `./core`, `./three`, `./model`, `./svg`, `./player`, `./motion`, `./manifest.json`, `./package.json`, `./assets/*`. The package `files` ship source, types, the manifest, static/original artwork and posters; never GIFs, sprite sheets, previews, video or the Pages site.
3. **Official embedding API** upstream, replacing `embedded.js`: `createGeekyModel({ THREE, seed, reduced, palette, detail })` returns `{ group, brain, renderer, step(dt), materials(), dispose() }`. `THREE` is injected, as everywhere else in geeky-animation, so the host controls the three.js version and bundle. `ThreeRenderer` gains a headless mode (`scene`, `lights: false`, `beforeBuild`) so no prototype hack is needed. Exactly two materials at every moment, as today.
4. **Palette** (`frame`, `back`, `lid`, `heart`, `blush`; hex strings) at creation time. A theme change recreates the model (the campus already rebuilds on profile changes). Theme/edition wiring and costumes are phase 3.
5. **Contract**: the exported API (names per entry point) and the action ids are snapshot-tested upstream. Removing or renaming an export or an action id is a major release; adding one is minor; motion/geometry tweaks are patch. `package.json` and `manifest.json` carry the same version; `CHANGELOG.md` has a section per version.
6. **Release flow**: a `vX.Y.Z` tag in geeky-animation runs the tests, checks the tag against the version, creates a GitHub Release from the changelog and sends `repository_dispatch` (`geeky-release`) to GuateGeeks/design-system. The design system's `update-geeky` workflow (on that dispatch, weekly, or by hand) bumps the dependency, adds a changeset, builds, runs unit, e2e and visual suites (updating baselines if Geeky changed visibly) and opens a pull request. People review and merge.
7. **License**: geeky-animation declares Apache-2.0, as the design system does.

## Out of scope

Costumes, theme-driven palettes, a 2D Geeky UI component, migrating Socrates and the cotizador, npm publishing.
