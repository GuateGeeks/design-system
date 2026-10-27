# @guategeeks/experience-legacy-school

The GuateGeeks cotizador's low-poly school as it was before the papercraft campus (GuateGeeks/cotizador `a125f6f`, 2026-10-24), kept as a **historical reference** in the lab's Experiencias section. Private; not for products.

- `mountLegacySchool(container, { reducedMotion, onSelect, onReady, onLost })` shows the cotizador's example school (every level, 720 students, the six technologies) and returns `rotate`, `zoom`, `resetView`, `setPaused`, `getDiagnostics`, `dispose`.
- `LEGACY_PROGRAMS`, `LEGACY_LEVELS`: the workshop texts and level names it was shown with. `LEGACY_SOURCE`, `LEGACY_BACKDROP` (`#2e1853`, the cotizador's backdrop, kept in every theme).

`src/vendor/cotizador/` holds the six original files byte-identical; `PROVENANCE.md` lists their SHA256 and `test/vendor.test.ts` checks them. Only `campus-geeky.js` is this repository's: it hands the scene the current Geeky. Do not edit, port or theme the vendored files; the papercraft campus (`experiences/campus`) is where the experience evolves.
