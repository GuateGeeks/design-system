---
name: adopt-guategeeks-design
description: Use when adding or updating the GuateGeeks design system in a product repo (guategeeks.github.io, Socrates, the cotizador or a new app), or when replacing a product's own colors, fonts and durations with GuateGeeks tokens.
---

# Adopt the GuateGeeks design system

Read [CONTEXT.md](../../CONTEXT.md) first. The standard stack is React 19 + TypeScript + Vite + Tailwind CSS v4.

## 1. Install

Add the packages the product needs (all versions identical):

```bash
npm i @guategeeks/tokens @guategeeks/themes @guategeeks/theme-runtime @guategeeks/motion @guategeeks/ui
```

Until the registry is chosen (phase 4), install from a checkout of `GuateGeeks/design-system` with `npm i <path>/packages/<name>` after running `npm run build` there.

## 2. Wire CSS

In the product's main stylesheet, replace its own `@theme` palette with the consumer imports from CONTEXT.md, in that order. Remove `@custom-variant dark` rules: dark is `[data-scheme="dark"]`, set by the runtime.

## 3. Wrap the app

```tsx
import { editions, themes } from '@guategeeks/themes';
import { ThemeProvider } from '@guategeeks/theme-runtime/react';

<ThemeProvider options={{ themes, editions }}>
  <App />
</ThemeProvider>
```

Plain-JS products call `createThemeController({ themes, editions })` once at startup.

## 4. Replace hard-coded values

| Product value | Token |
|---|---|
| Socrates `--c-action` / `--c-on-action` | `--gg-color-action` / `--gg-color-on-action` |
| Socrates `--c-ink`, `--c-ink-2`, `--c-ink-3` | `--gg-color-ink`, `--gg-color-ink-muted`, `--gg-color-ink-subtle` |
| Socrates `--c-bg`, `--c-surface`, `--c-surface-2` | `--gg-color-bg`, `--gg-color-surface`, `--gg-color-surface-2` |
| Socrates `--c-line`, `--c-line-soft` | `--gg-color-line`, `--gg-color-line-soft` |
| Socrates `--c-hero` / `--c-on-hero` | `--gg-color-hero` / `--gg-color-on-hero` |
| Socrates `--c-jade`, `--c-teal-ink` (coral dark text) | `--gg-color-link` |
| Socrates `--c-ok`, `--c-bad`, `--c-hint` (+ `-soft`) | `--gg-color-ok`, `--gg-color-bad`, `--gg-color-hint` (+ `--gg-color-ok-soft`, …) |
| Socrates `--dur-base`, `--ease-standard` | `--gg-duration-base`, `--gg-easing-standard` |
| Socrates `--r-sm`, `--r-md`, `--r-lg`, `--r-pill` | `--gg-radius-control`, `--gg-radius-card`, `--gg-radius-panel`, `--gg-radius-pill` |
| Socrates `--tap-min` (48px, kids) | `--gg-tap-min` (44px; keep 48px as a product override for children) |
| guategeeks.github.io `bg-coral-500` / `text-coral-300` | `bg-action` / `text-link` |
| guategeeks.github.io `text-strong-gray-900`, `bg-plum-400`, `text-sky-500` | `text-ink`, `bg-hero`, `text-accent` |
| cotizador `#6942a1`, `#ff9d38`, Avenir | `--gg-color-hero`, `--gg-color-action`, `--gg-font-ui` |

Replace any copied Geeky (Socrates' `src/design-system/geeky`, the cotizador's `asesor/lab/geeky`) with `<Geeky intent="…">` from `@guategeeks/mascot/react` (see CONTEXT.md, "Geeky in product screens"), and delete the copies.

Socrates' `motion.ts` maps 1:1 to `@guategeeks/motion` (`play`, `stagger`, `flip`, `countUp`, same preset and semantic names). Remove its `setReducedMotion` calls: use the runtime's `setMotion`.

## 5. Verify

Work through [checklists/adoption.md](../../checklists/adoption.md). Do not claim the adoption is done until every box is checked with evidence (a command output or a screenshot per theme).
