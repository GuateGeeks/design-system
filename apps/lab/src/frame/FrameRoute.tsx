import { useEffect, useState } from 'react';
import { editions, themes } from '@guategeeks/themes';
import { createThemeController } from '@guategeeks/theme-runtime';
import { ThemeProvider } from '@guategeeks/theme-runtime/react';
import { ToastProvider } from '@guategeeks/ui';
import { copy } from '../copy.ts';
import { findState } from '../gallery/registry.ts';
import type { FrameParams } from '../router.ts';

/** One gallery state on a bare page. Appearance comes from the query only; nothing is persisted. */
export function FrameRoute({ entry, state, theme, scheme, motion, edition }: { entry: string; state: string } & FrameParams) {
  const [controller] = useState(() => {
    // Detached until subscribed: a render React discards never touches <html> or adds listeners.
    const c = createThemeController({ themes, editions, storageKey: null, defaultTheme: theme, search: '', attach: false });
    const known = edition !== null && editions.some((e) => e.id === edition);
    if (known) c.setEdition(edition);
    else {
      c.setEdition(null);
      c.setTheme(theme); // unknown or absent edition: the theme param decides, never the date
    }
    c.setScheme(scheme);
    c.setMotion(motion);
    return c;
  });
  useEffect(() => () => controller.destroy(), [controller]);
  const found = findState(entry, state);
  return (
    <ThemeProvider controller={controller} options={{ themes, editions }}>
      <ToastProvider>
        <div data-frame={`${entry}/${state}`} className="min-h-dvh bg-bg p-6 text-ink">
          {found ? found.render() : <p>{copy.missingState}</p>}
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}
