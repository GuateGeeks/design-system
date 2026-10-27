import { useState } from 'react';
import { Tabs } from '@guategeeks/ui';
import { Section } from '../Section.tsx';
import { GeekyPlayground, type GeekyChoice } from './GeekyPlayground.tsx';
import { AllActions, Integrate, Rules, Version, WhenToUse } from './guide.tsx';

/** Geeky for product teams: try it live, copy the code, learn when and how to use it. */
export default function GeekyPage() {
  const [choice, setChoice] = useState<GeekyChoice>({ intent: 'welcome', render: '2d', paused: false });
  const pick = (action: string) => {
    setChoice((c) => ({ ...c, intent: undefined, action, paused: false }));
    document.querySelector('[data-gg="geeky-stage"]')?.scrollIntoView({ block: 'nearest' });
  };

  return (
    <Section
      title="Geeky"
      description="Geeky, el guía de GuateGeeks, en las pantallas de producto: elige qué quieres comunicar, pruébalo en 2D o 3D con el tema activo y copia el código."
    >
      <GeekyPlayground choice={choice} onChange={setChoice} />
      <Tabs
        defaultValue="cuando"
        items={[
          { id: 'cuando', label: 'Cuándo usarlo', content: <WhenToUse /> },
          { id: 'integrar', label: 'Integrarlo', content: <Integrate /> },
          { id: 'reglas', label: 'Reglas', content: <Rules /> },
          { id: 'acciones', label: 'Todas las acciones', content: <AllActions onPick={pick} /> },
          { id: 'version', label: 'Versión', content: <Version /> },
        ]}
      />
    </Section>
  );
}
