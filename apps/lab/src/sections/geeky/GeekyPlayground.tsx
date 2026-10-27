import { Pause, Play } from 'lucide-react';
import { Geeky, GEEKY_ACTION_LIST, GEEKY_INTENTS, type GeekyIntent } from '@guategeeks/mascot/react';
import { useTheme } from '@guategeeks/theme-runtime/react';
import { Button, Card, SegmentedControl, Select, Switch, useToast } from '@guategeeks/ui';
import { actionName, groupName, INTENT_NAMES_ES } from '../../geeky/actionNames.ts';
import { geekySnippet } from './snippet.ts';

export interface GeekyChoice {
  intent?: GeekyIntent;
  action?: string;
  render: '2d' | '3d';
  /** Local preview override; undefined follows the lab's motion setting. */
  reducedMotion?: boolean;
  paused: boolean;
}

const INTENTS = Object.keys(GEEKY_INTENTS) as GeekyIntent[];
const ACTION_OPTIONS = GEEKY_ACTION_LIST.map((a) => ({ value: a.id, label: `${groupName(a.group).text} · ${actionName(a.id).text}` }));

/** Live Geeky and its controls; the code below always matches what is on stage. */
export function GeekyPlayground({ choice, onChange }: { choice: GeekyChoice; onChange(next: GeekyChoice): void }) {
  const { motion } = useTheme();
  const toast = useToast();
  const set = (patch: Partial<GeekyChoice>) => onChange({ ...choice, ...patch });
  const looping = choice.intent ? GEEKY_INTENTS[choice.intent].loop : !!GEEKY_ACTION_LIST.find((a) => a.id === choice.action)?.loop;
  const code = geekySnippet({ intent: choice.intent, action: choice.action, render: choice.render });

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      toast.show({ title: 'Código copiado', tone: 'ok' });
    } catch {
      toast.show({ title: 'No se pudo copiar', description: 'Selecciona el código y cópialo a mano.', tone: 'bad' });
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <Card data-gg="geeky-stage" className="flex min-h-80 flex-col items-center justify-center gap-4 lg:sticky lg:top-4 lg:min-h-[28rem] lg:self-start">
        <Geeky
          intent={choice.intent}
          action={choice.action}
          render={choice.render}
          size="min(16rem, 60vw)"
          reducedMotion={choice.reducedMotion}
          paused={choice.paused}
          label="Geeky en vivo"
        />
        {looping && (
          <Button variant="secondary" iconStart={choice.paused ? <Play /> : <Pause />} onClick={() => set({ paused: !choice.paused })}>
            {choice.paused ? 'Reanudar a Geeky' : 'Pausar a Geeky'}
          </Button>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-ink">Intención</legend>
          <div className="flex flex-wrap gap-2">
            {INTENTS.map((intent) => (
              <label
                key={intent}
                className="inline-flex min-h-(--gg-tap-min) cursor-pointer items-center rounded-control border border-line bg-surface px-3 text-sm text-ink has-checked:border-action has-checked:bg-action has-checked:text-on-action has-focus-visible:outline-2 has-focus-visible:outline-focus"
              >
                <input
                  type="radio"
                  name="geeky-intent"
                  className="sr-only"
                  checked={choice.intent === intent}
                  onChange={() => set({ intent, action: undefined, paused: false })}
                />
                {INTENT_NAMES_ES[intent]}
              </label>
            ))}
          </div>
        </fieldset>

        <Select
          label="Acción exacta"
          placeholder="Según la intención"
          options={ACTION_OPTIONS}
          value={choice.intent ? undefined : choice.action}
          onValueChange={(action) => set({ action, intent: undefined, paused: false })}
        />

        <SegmentedControl label="Dibujo" options={[{ value: '2d', label: '2D' }, { value: '3d', label: '3D' }]} value={choice.render} onChange={(render) => set({ render })} />

        <Switch
          label="Movimiento reducido"
          checked={choice.reducedMotion ?? motion === 'reduced'}
          onCheckedChange={(reducedMotion) => set({ reducedMotion })}
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-ink">Código</span>
            <Button variant="ghost" onClick={copyCode}>Copiar código</Button>
          </div>
          <pre data-gg="geeky-snippet" className="overflow-x-auto whitespace-pre-wrap break-words rounded-control border border-line bg-surface-2 p-3 font-mono text-xs text-ink"><code>{code}</code></pre>
        </div>
      </Card>
    </div>
  );
}
