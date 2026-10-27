# Adoption checklist

Evidence for each item: a command and its output, or a screenshot.

- [ ] Packages installed at one shared version.
- [ ] Main stylesheet imports, in order: `tailwindcss`, `@guategeeks/ui/styles.css`, `@guategeeks/ui/fonts.css`, `@guategeeks/themes/themes.css`.
- [ ] App wrapped in `ThemeProvider` (or `createThemeController` for plain JS); `<html>` carries `data-theme`, `data-scheme`, `data-motion`.
- [ ] No hex/rgb literals, raw `ms` durations or Tailwind default palette classes left in product UI code (`grep -rnE "#[0-9a-fA-F]{3,8}\b|[0-9]+ms\b|(bg|text|border)-(orange|gray|slate)-[0-9]{2,3}" src`).
- [ ] Primary actions use `--gg-color-action` with `--gg-color-on-action`; links use `--gg-color-link`.
- [ ] Touch targets ≥ `--gg-tap-min`.
- [ ] Screens checked in `guategeeks` light, `guategeeks` dark and `halloween`, at phone and desktop widths.
- [ ] Reduced motion checked (OS setting and `data-motion="reduced"`): nothing essential depends on animation.
- [ ] Geeky, if used, is `<Geeky>` from `@guategeeks/mascot/react` with an intent: one per screen, next to text that carries the message, with a pause control for looping intents longer than 5 seconds; no copied Geeky files in the product.
- [ ] Accessibility scan (axe) shows no serious or critical violations on the main screens.
- [ ] `?edition=halloween-2026` previews the edition; `?edition=none` returns to the brand.
