import { useMemo, useState } from 'react';
import { Copy, Download } from 'lucide-react';
import { themes, type MotionIntensity, type SchemeName } from '@guategeeks/themes';
import { checkContrast, validateManifest } from '@guategeeks/themes/validate';
import { useTheme } from '@guategeeks/theme-runtime/react';
import { colorRoles } from '@guategeeks/tokens';
import { Button, SegmentedControl, Select, TextField } from '@guategeeks/ui';
import { Section } from '../Section.tsx';
import { exportTheme, HEX } from './exportTheme.ts';
import { RoleEditor } from './RoleEditor.tsx';
import { StudioPreview } from './StudioPreview.tsx';

const SCHEME_LABEL: Record<SchemeName, string> = { light: 'Claro', dark: 'Oscuro' };
const INTENSITY_LABEL: Record<MotionIntensity, string> = { calm: 'Calmado', standard: 'Estándar', playful: 'Juguetón' };

const baseDrafts = (themeId: string, scheme: SchemeName) => {
  const values = themes.find((t) => t.id === themeId)?.values[scheme] ?? {};
  return Object.fromEntries(colorRoles.map((role) => [role, values[`--gg-color-${role}`] ?? '']));
};

export function StudioPage() {
  const runtime = useTheme();
  const [baseId, setBaseId] = useState(runtime.theme);
  const base = themes.find((t) => t.id === baseId) ?? themes[0];
  const [scheme, setScheme] = useState<SchemeName>(base.schemes.includes(runtime.scheme) ? runtime.scheme : base.defaultScheme);
  const [drafts, setDrafts] = useState(() => baseDrafts(base.id, scheme));
  const [applied, setApplied] = useState<Record<string, string>>({});
  const [id, setId] = useState(`${base.id}-custom`);
  const [name, setName] = useState(`${base.name} personalizado`);
  const [intensity, setIntensity] = useState<MotionIntensity>(base.intensity);

  const reset = (themeId: string, nextScheme: SchemeName) => {
    setDrafts(baseDrafts(themeId, nextScheme));
    setApplied({});
  };

  const onRoleChange = (role: string, value: string) => {
    setDrafts((d) => ({ ...d, [role]: value }));
    if (HEX.test(value)) setApplied((a) => ({ ...a, [`--gg-color-${role}`]: value }));
  };

  const baseValues = base.values[scheme] ?? {};
  const overrides = useMemo(
    () => Object.fromEntries(Object.entries(applied).filter(([k, v]) => baseValues[k]?.toLowerCase() !== v.toLowerCase())),
    [applied, baseValues],
  );
  const manifest = exportTheme(base, scheme, overrides, { id, name, intensity });
  const contrast = checkContrast({ ...baseValues, ...overrides });
  const reasons = [
    ...validateManifest(manifest),
    ...colorRoles.filter((r) => !HEX.test(drafts[r] ?? '')).map((r) => `${r}: hex no válido`),
    ...contrast.filter((r) => !r.pass).map((r) => `${r.fg}/${r.bg}: ${r.ratio.toFixed(2)} < ${r.min}`),
  ];
  const json = `${JSON.stringify(manifest, null, 2)}\n`;

  const download = () => {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'theme.json' });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Section title="Estudio de temas" description="Parte de un tema, ajusta sus roles de color y exporta un theme.json listo para packages/themes/themes/<id>/.">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
        <Select
          label="Tema base"
          value={base.id}
          options={themes.map((t) => ({ value: t.id, label: t.name }))}
          onValueChange={(v) => {
            const next = themes.find((t) => t.id === v) ?? themes[0];
            const nextScheme = next.schemes.includes(scheme) ? scheme : next.defaultScheme;
            setBaseId(next.id);
            setScheme(nextScheme);
            setIntensity(next.intensity);
            setId(`${next.id}-custom`);
            setName(`${next.name} personalizado`);
            reset(next.id, nextScheme);
          }}
          className="w-44"
        />
        <SegmentedControl<SchemeName>
          label="Esquema"
          value={scheme}
          options={base.schemes.map((s) => ({ value: s, label: SCHEME_LABEL[s] }))}
          onChange={(s) => { setScheme(s); reset(base.id, s); }}
          disabled={base.schemes.length === 1}
        />
        <SegmentedControl<MotionIntensity>
          label="Intensidad del movimiento"
          value={intensity}
          options={(['calm', 'standard', 'playful'] as const).map((v) => ({ value: v, label: INTENSITY_LABEL[v] }))}
          onChange={setIntensity}
        />
        <TextField label="Id" value={id} onChange={(e) => setId(e.target.value)} className="w-44" />
        <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} className="w-56" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <RoleEditor drafts={drafts} onChange={onRoleChange} />
        <div className="flex flex-col gap-4">
          <StudioPreview theme={base.id} scheme={scheme} overrides={overrides} />
          <div className="flex flex-wrap gap-3">
            <Button iconStart={<Download aria-hidden className="size-4" />} disabled={reasons.length > 0} onClick={download}>Exportar theme.json</Button>
            <Button variant="secondary" iconStart={<Copy aria-hidden className="size-4" />} disabled={reasons.length > 0} onClick={() => void navigator.clipboard?.writeText(json)}>Copiar JSON</Button>
          </div>
          {reasons.length > 0 && (
            <ul aria-label="Motivos para no exportar" className="flex flex-col gap-1 rounded-card border border-bad bg-bad-soft p-4 text-sm text-bad">
              {reasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
          )}
          <details className="rounded-card border border-line bg-surface p-4">
            <summary className="cursor-pointer text-sm font-medium">theme.json</summary>
            <pre className="mt-3 overflow-x-auto text-xs text-ink-muted">{json}</pre>
          </details>
        </div>
      </div>
    </Section>
  );
}
