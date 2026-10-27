# Provenance: the cotizador's low-poly school

A historical reference: the GuateGeeks cotizador's 3D school as it was before the papercraft campus. These files are preserved, not evolved. Do not edit them; `test/vendor.test.ts` checks every hash below.

- Source: GuateGeeks/cotizador, commit `a125f6fc13387f979fe96857a9a355fcbab7eae8` (2026-10-24), folder `asesor/lab/`.
- Copied unchanged (byte-identical, no header line) on 2026-10-26, Apache-2.0 in this repository.

| File here | Path in the source | SHA256 |
|---|---|---|
| `campus-actors.js` | `asesor/lab/campus-actors.js` | `fde1207c84687a2148f7184b93fbe2752d6bfbcd426ec87ae703e0464783f9b1` |
| `campus-architecture.js` | `asesor/lab/campus-architecture.js` | `9c934c44755ce47be11fc71b21a69c6ff3a4e4b305d0a5af9d789cb15a67411a` |
| `campus-kit.js` | `asesor/lab/campus-kit.js` | `a5beae40efa2ad69a6da7b3721a917977fb1baf6a8d00e660f300cd1dd90aebb` |
| `campus-layout.js` | `asesor/lab/campus-layout.js` | `fe79e434dbbccf0e6dd4813ebdb250c0c52f325d562033cb54e9287b26fe66ca` |
| `campus-people.js` | `asesor/lab/campus-people.js` | `9b1c12f2f8ea6146f4a0c65850f4536dcfd0bdc36c8390e95b8edc9304b08a25` |
| `campus-scene.js` | `asesor/lab/campus-scene.js` | `b911b07ecacb120c6d5c8f247105ba8185ccecfdf356f81ad77af3cdf353b545` |

## Not copied

- `campus-geeky.js`: the school's low-poly Geeky was retired at the owner's request (2026-10-24). The `campus-geeky.js` here is this repository's own one-line module that hands `campus-scene.js` the current Geeky (`createGeeky3D` from `@guategeeks/mascot`, which keeps the same `createGeeky(materials)` contract and scale).
- The page around the scene (`asesor.js`, `asesor.css`, `campus-experience.js`): `src/showcase.ts` and `src/programs.ts` keep the showcase data and the workshop texts the scene was shown with; the backdrop colour `#2e1853` came from `asesor.css` (`--scene` on `.campus-stage`).

## Types

`campus-scene.d.ts` is this repository's declaration of `createMascot` for the TypeScript adapter.
