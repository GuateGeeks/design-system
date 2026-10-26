import { useState } from 'react';
import { getTheme, THREE_PROFILES, type ThreeProfile } from '@guategeeks/themes';
import { CATALOG, GROUPS } from '@guategeeks/three';
import { useTheme } from '@guategeeks/theme-runtime/react';
import { Badge, Button, Card, cx, SegmentedControl, Tabs } from '@guategeeks/ui';
import { Section } from '../Section.tsx';
import { PieceViewer, type InspectorView, type PieceInfo, type PieceViewerProps } from './PieceViewer.tsx';

type ProfileChoice = 'theme' | 'papercraft' | 'lowpoly';
const VIEWS: Array<{ value: InspectorView; label: string }> = [
  { value: '34', label: '3/4' }, { value: 'front', label: 'Frente' }, { value: 'side', label: 'Lado' }, { value: 'top', label: 'Arriba' }, { value: 'close', label: 'Cerca' },
];

export default function Kit3dPage({ createInspector }: { createInspector?: PieceViewerProps['createInspector'] } = {}) {
  const { theme } = useTheme();
  const [group, setGroup] = useState<string>(GROUPS[0].id);
  const [pieceId, setPieceId] = useState<string>(() => CATALOG.find((p) => p.group === GROUPS[0].id)!.id);
  const [choice, setChoice] = useState<ProfileChoice>('theme');
  const [view, setView] = useState<InspectorView>('34');
  const [info, setInfo] = useState<PieceInfo | null>(null);
  const profile: ThreeProfile = choice === 'theme' ? getTheme(theme)?.three ?? THREE_PROFILES.papercraft : THREE_PROFILES[choice];
  const piece = CATALOG.find((p) => p.id === pieceId);
  return (
    <Section title="Kit 3D" description="Las piezas de cartulina con las que se construyen las escenas: aulas, conexiones, vegetación, mobiliario, tecnologías y personajes. Se ven con el perfil 3D del tema.">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
        <SegmentedControl<ProfileChoice> label="Perfil" value={choice} onChange={setChoice}
          options={[{ value: 'theme', label: 'Tema actual' }, { value: 'papercraft', label: 'Papercraft' }, { value: 'lowpoly', label: 'Low-poly' }]} />
        <SegmentedControl<InspectorView> label="Vista" value={view} onChange={setView} options={VIEWS} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <Card className="max-h-[65dvh] overflow-y-auto p-4">
          <Tabs
            value={group}
            onValueChange={setGroup}
            items={GROUPS.map((g) => ({
              id: g.id,
              label: g.label,
              content: (
                <ul className="flex flex-col gap-1">
                  {CATALOG.filter((p) => p.group === g.id).map((p) => (
                    <li key={p.id}>
                      <Button variant="ghost" aria-pressed={p.id === pieceId} onClick={() => setPieceId(p.id)}
                        className={cx('w-full justify-start text-left', p.id === pieceId && 'bg-surface-2')}>{p.label}</Button>
                    </li>
                  ))}
                </ul>
              ),
            }))}
          />
        </Card>
        <div className="flex flex-col gap-3">
          <PieceViewer pieceId={pieceId} profile={profile} view={view} createInspector={createInspector} onInfo={setInfo}
            className="relative h-[60dvh] min-h-80 overflow-hidden rounded-panel border border-line bg-bg" />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <strong>{piece?.label}</strong>
            {info && <Badge>{`${info.triangles.toLocaleString('es-GT')} triángulos`}</Badge>}
            {info?.budget != null && <Badge tone={info.triangles <= info.budget ? 'ok' : 'bad'}>{`presupuesto ${info.budget}`}</Badge>}
          </div>
        </div>
      </div>
    </Section>
  );
}
