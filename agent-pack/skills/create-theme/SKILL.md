---
name: create-theme
description: Use when creating or changing a GuateGeeks theme (a seasonal or event look such as Halloween, Ada Lovelace Day, space or gaming) inside the GuateGeeks Design Lab repository.
---

# Create a theme

A theme changes how things look, sound and feel. It never changes logic. If the idea needs structure to change (progress as XP levels, a starfield background), that is a **variant** requested by an **edition**; see [CONTEXT.md](../../CONTEXT.md).

1. Run the lab: `npm run build && npm run dev -w @guategeeks/lab`, then open **Estudio de temas**.
2. Pick the base theme (usually `guategeeks`) and the scheme. Dark-only themes extend the brand and list only `"dark"`.
3. Edit the color roles. The contrast list must be empty before export is enabled.
4. Choose the motion intensity: `calm` (×1.25 durations), `standard`, `playful` (×0.85).
5. **Exportar theme.json** and save it as `packages/themes/themes/<id>/theme.json`.
6. Optional: a display font. Add a Fontsource package to `packages/themes` and set `"fonts": { "display": { "family": "…", "import": "@fontsource/<font>/400.css" } }`.
7. `npm run generate` — fails with the failing pairs if contrast regressed.
8. `npm test`.
9. Add the theme to `COMBOS` in `apps/lab/e2e/combos.ts`, then `npm run build && npm run e2e -- --update-snapshots`, review the new screenshots, and `npm run e2e`.
10. If it belongs to a date (Halloween, Ada Lovelace Day), add `packages/themes/editions/<id>-<year>.json` with a `window` in `America/Guatemala`.

Check the result in the lab's **Fundamentos** contrast table for every scheme the theme supports.
