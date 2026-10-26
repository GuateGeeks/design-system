import { Check, X } from 'lucide-react';
import { checkContrast } from '@guategeeks/themes/validate';
import { useTheme } from '@guategeeks/theme-runtime/react';
import { Section } from '../Section.tsx';
import { useResolvedValues } from '../useResolved.ts';

export function ContrastMatrix() {
  const { theme, scheme } = useTheme();
  const results = checkContrast(useResolvedValues());
  return (
    <Section title="Contraste" description={`WCAG 2.2 AA para ${theme} · ${scheme}. La compilación falla si algún par no cumple.`}>
      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-ink-muted">
            <tr><th className="p-2 font-medium">Muestra</th><th className="p-2 font-medium">Texto / fondo</th><th className="p-2 font-medium">Razón</th><th className="p-2 font-medium">Mínimo</th><th className="p-2 font-medium">Estado</th></tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={`${r.fg}/${r.bg}`} data-contrast-row data-pass={r.pass} className="border-t border-line-soft">
                <td className="p-2">
                  <span className="inline-block rounded-control px-2 py-0.5 font-medium" style={{ color: `var(--gg-color-${r.fg})`, background: `var(--gg-color-${r.bg})` }}>Aa</span>
                </td>
                <td className="p-2"><code>{`${r.fg} / ${r.bg}`}</code></td>
                <td className="p-2 tabular-nums">{r.ratio.toFixed(2)}</td>
                <td className="p-2 tabular-nums">{r.min}</td>
                <td className="p-2">
                  {r.pass
                    ? <span className="inline-flex items-center gap-1 text-ok"><Check aria-hidden className="size-4" />Cumple</span>
                    : <span className="inline-flex items-center gap-1 text-bad"><X aria-hidden className="size-4" />No cumple</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
