import { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { useTheme } from '@guategeeks/theme-runtime/react';
import { Link } from '@guategeeks/ui';
import { GROUPS, registry, type GalleryEntry, type GalleryState } from '../../gallery/registry.ts';
import { frameHref } from '../../router.ts';
import { useLab } from '../../shell/LabContext.tsx';
import { ViewportFrame } from '../../shell/ViewportFrame.tsx';

const sectionId = (entryId: string) => `component-${entryId}`;

function useFrameHref() {
  const { theme, schemePreference, motionPreference, edition } = useTheme();
  return (entry: string, state: string) =>
    frameHref(entry, state, { theme, scheme: schemePreference, motion: motionPreference, edition: edition?.id ?? null });
}

function StatePanel({ entry, state }: { entry: GalleryEntry; state: GalleryState }) {
  const href = useFrameHref();
  const { viewport } = useLab();
  const src = href(entry.id, state.id);
  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <figcaption className="flex items-center justify-between gap-2 text-xs font-medium text-ink-muted">
        <span>{state.label}</span>
        <a href={src} target="_blank" rel="noreferrer" aria-label={`Abrir ${entry.name} · ${state.label} en un marco`} className="rounded-control p-1 text-ink-subtle hover:text-ink">
          <ExternalLink aria-hidden className="size-3.5" />
        </a>
      </figcaption>
      {state.preview === 'frame'
        ? <ViewportFrame key={src + viewport} viewport={viewport} src={src} title={`${entry.name} · ${state.label}`} />
        : <div className="flex min-h-24 items-center rounded-card border border-line-soft bg-bg p-5">{state.render()}</div>}
    </figure>
  );
}

function ComponentSection({ entry }: { entry: GalleryEntry }) {
  const href = useFrameHref();
  const shown = entry.states.filter((s) => s.preview !== 'link');
  const linked = entry.states.filter((s) => s.preview === 'link');
  const framed = shown.some((s) => s.preview === 'frame');
  // Small components share a row; ones with many states or a device frame take the full width.
  const wide = framed || shown.length >= 3;
  return (
    <section
      id={sectionId(entry.id)}
      aria-labelledby={`${sectionId(entry.id)}-title`}
      data-wide={wide || undefined}
      className={`flex min-w-0 scroll-mt-24 lg:scroll-mt-44 flex-col gap-4 rounded-panel border border-line bg-surface p-5 lg:p-6 ${wide ? 'lg:col-span-2' : ''}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 id={`${sectionId(entry.id)}-title`} className="text-xl">{entry.name}</h3>
        {linked.length > 0 && (
          <p className="flex flex-wrap gap-3 text-xs text-ink-muted">
            <span>También en marco:</span>
            {linked.map((s) => <Link key={s.id} href={href(entry.id, s.id)} target="_blank" rel="noreferrer">{s.label}</Link>)}
          </p>
        )}
      </div>
      <p className="max-w-prose text-sm text-ink-muted">{entry.description}</p>
      <div className={framed ? 'grid gap-4 md:grid-cols-2' : 'grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))]'}>
        {shown.map((s) => <StatePanel key={s.id} entry={entry} state={s} />)}
      </div>
    </section>
  );
}

/** Every component and its states on one page, grouped; #/components/<id> scrolls to a component. */
export function ComponentsPage({ id }: { id?: string }) {
  const { motion } = useTheme();
  useEffect(() => {
    if (id) document.getElementById(sectionId(id))?.scrollIntoView({ behavior: motion === 'reduced' ? 'auto' : 'smooth', block: 'start' });
  }, [id, motion]);
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h2 className="sr-only">Componentes</h2>
        <p className="max-w-prose text-sm text-ink-muted">
          Cada componente con todos sus estados, en el tema, esquema y movimiento de la barra superior. La vista (teléfono, tableta, escritorio) se aplica a los que necesitan pantalla completa.
        </p>
      </div>
      <nav aria-label="Índice de componentes" className="z-(--gg-z-sticky) -mx-2 rounded-panel border border-line bg-bg/95 p-3 backdrop-blur lg:sticky lg:top-2">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {GROUPS.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-subtle">{g.label}</span>
              {registry.filter((e) => e.group === g.id).map((e) => (
                <a key={e.id} href={`#/components/${e.id}`} className="rounded-pill bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink hover:bg-wash">{e.name}</a>
              ))}
            </li>
          ))}
        </ul>
      </nav>
      {GROUPS.map((g) => (
        <section key={g.id} aria-labelledby={`group-${g.id}`} className="flex flex-col gap-4">
          <h2 id={`group-${g.id}`} className="text-2xl">{g.label}</h2>
          <div className="grid items-start gap-4 lg:grid-cols-2">
            {registry.filter((e) => e.group === g.id).map((e) => <ComponentSection key={e.id} entry={e} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
