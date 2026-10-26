# GuateGeeks design system — context for agents

The GuateGeeks Design Lab (`GuateGeeks/design-system`) decides how every GuateGeeks product looks, sounds and feels. Its packages are the **inputs** of every product; this file is what an agent needs before touching UI in a product repo.

Spec: [design spec](../docs/superpowers/specs/2026-10-25-guategeeks-design-lab-design.md).

## Brand principles

- **Coral acts.** Primary actions are coral (`--gg-color-action`) with dark ink text (`--gg-color-on-action`). Never white text on coral.
- **Plum highlights.** The next lesson, a hero call to action: `--gg-color-hero` with `--gg-color-on-hero`.
- **Sky accents.** Decoration and illustration only: `--gg-color-accent`. Never for text.
- **Links are coral dark** (`--gg-color-link`) to keep contrast on light surfaces.
- **Inter** everywhere in the brand theme (`--gg-font-ui`, `--gg-font-display`); themes may swap the display font.
- **Calm surfaces, immersive moments.** Reading surfaces are opaque; glass is for HUDs over scenes. Motion confirms actions and connects state changes; content people read never animates continuously.

## The four layers

| Layer | What it changes | Where it lives |
|---|---|---|
| Tokens | Primitive scales and semantic roles | `packages/tokens/src/source/**/*.tokens.json` |
| Themes | Look, sound, feel — never logic | `packages/themes/themes/<id>/theme.json` |
| Variants | Structure/behavior through extension points a product exposes | `registerVariant(point, value, Component)` in `@guategeeks/ui` |
| Editions | A theme + requested variants + content + date window | `packages/themes/editions/<id>.json` |

Edition priority at runtime: explicit user choice > `?edition=<id>` (preview; `?edition=none` disables) > active date window (in the edition's timezone) > product default. Choosing a theme (or "no edition") opts out of the edition active at that moment only; later editions still apply and `?edition=` previews still work.

## Rules

1. **Semantic tokens only.** Components use `--gg-color-<role>` and the Tailwind utilities mapped to them (`bg-action`, `text-ink`, `border-line`, `rounded-control`, …). No hex/rgb literals, no raw `ms` durations, no Tailwind default palette classes (`bg-orange-500`).
2. **Appearance lives on `<html>`:** `data-theme`, `data-scheme` (`light`/`dark`), `data-motion` (`full`/`reduced`), set by `@guategeeks/theme-runtime`. CSS does the rest; switching is live.
3. **Reduced motion** is the OS preference or the app setting. Under it, `--gg-duration-base` and the other durations become `1ms` and presets play their reduced keyframes.
4. **Touch targets** are at least `--gg-tap-min` (44px).
5. **Contrast** is WCAG 2.2 AA in every theme × scheme; theme builds fail otherwise.
6. **Structure changes are variants, not themes.** A theme must always be safe to apply to any product.

## Packages

| Package | Use |
|---|---|
| `@guategeeks/tokens` | `tokens.css`, `tailwind.css`, typed values (`motion`, `colorRoles`), React Native values (`/native`) |
| `@guategeeks/themes` | `themes.css` (every theme), `themes`, `editions`, `getTheme`; `/validate` for contrast checks |
| `@guategeeks/theme-runtime` | `createThemeController`; `/react`: `ThemeProvider`, `useTheme`, `useVariant`, `useEdition` |
| `@guategeeks/motion` | `play(el, 'feedback.correct')`, presets, `stagger`, `flip`, `countUp` — theme-aware durations |
| `@guategeeks/ui` | React components on Radix: Button, Card, Dialog/BottomSheet, AppShell, Progress, … |

## 3D

3D lives in `@guategeeks/three` (stage, orbit camera, papercraft kit, `ThreeHost`), `@guategeeks/mascot` (Geeky 3D, sourced from GuateGeeks/geeky-animation by release tag) and `@guategeeks/experience-campus` (the cotizador campus). Every theme has a 3D profile (`ResolvedTheme.three`: background, lights, paper grain, palette); scenes render on demand, respect reduced motion, stay within budgets and always ship a text alternative. See the [build-3d-experience skill](skills/build-3d-experience/SKILL.md).

## Consumer CSS, in this order

```css
@import "tailwindcss";
@import "@guategeeks/ui/styles.css";
@import "@guategeeks/ui/fonts.css";
@import "@guategeeks/themes/themes.css";
```

Fonts of non-active themes are declared but never downloaded until used.
