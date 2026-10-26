import { BookOpen, LayoutGrid, Palette } from 'lucide-react';
import { editions, themes } from '@guategeeks/themes';
import { ThemeProvider } from '@guategeeks/theme-runtime/react';
import { AppShell, EmptyState, ToastProvider } from '@guategeeks/ui';
import { copy } from './copy.ts';
import { FrameRoute } from './frame/FrameRoute.tsx';
import { FramesIndex } from './frame/FramesIndex.tsx';
import { useRoute, type Section } from './router.ts';
import { ComponentsPage } from './sections/components/ComponentsPage.tsx';
import { FoundationsPage } from './sections/foundations/FoundationsPage.tsx';
import { StudioPage } from './sections/studio/StudioPage.tsx';
import { LabProvider } from './shell/LabContext.tsx';
import { Toolbar } from './shell/Toolbar.tsx';

const NAV: Array<{ id: Section; icon: React.ReactNode }> = [
  { id: 'foundations', icon: <BookOpen /> },
  { id: 'components', icon: <LayoutGrid /> },
  { id: 'studio', icon: <Palette /> },
];

export function App() {
  const route = useRoute();
  // Keyed by the whole frame identity: a hash-only change must not reuse the previous frame's controller or toasts.
  if ('frame' in route) return <FrameRoute key={JSON.stringify(route.frame)} {...route.frame} />;
  const section = 'section' in route ? route.section : null;
  return (
    <ThemeProvider options={{ themes, editions }}>
      <ToastProvider>
        <LabProvider>
          <AppShell
            brand={<a href="#/" className="flex items-center"><img src="./logo.svg" alt="GuateGeeks" className="h-7 w-auto" /></a>}
            nav={NAV.map((n) => ({ id: n.id, label: copy.nav[n.id], icon: n.icon, href: `#/${n.id}`, current: section === n.id }))}
          >
            <div className="mx-auto flex max-w-(--gg-layout-page-max) flex-col gap-8 px-4 py-6 lg:px-8">
              <header className="flex flex-col gap-4 border-b border-line pb-6">
                <h1 className="text-3xl">{copy.title}</h1>
                <Toolbar />
              </header>
              {'frames' in route && <FramesIndex />}
              {'notFound' in route && <EmptyState title={copy.notFound} />}
              {section === 'foundations' && <FoundationsPage />}
              {section === 'components' && <ComponentsPage id={'section' in route ? route.id : undefined} />}
              {section === 'studio' && <StudioPage />}
            </div>
          </AppShell>
        </LabProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
