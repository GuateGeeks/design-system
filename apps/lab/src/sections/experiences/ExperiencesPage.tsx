import { lazy, Suspense } from 'react';
import { Section } from '../Section.tsx';
import { CampusDemo } from './CampusDemo.tsx';

const LegacySchoolDemo = lazy(() => import('./LegacySchoolDemo.tsx'));

export default function ExperiencesPage() {
  return (
    <Section
      title="Experiencias"
      description="Experiencias de referencia construidas solo con el sistema. El campus vivo del cotizador: configura niveles y programas y mira cómo crece la escuela de cartulina; toca un aula para editarla. Debajo, la escuela low poly anterior, conservada como referencia histórica."
    >
      <h3 className="text-xl">Campus vivo</h3>
      <CampusDemo />
      <Suspense fallback={<p className="text-ink-muted">Cargando…</p>}>
        <LegacySchoolDemo />
      </Suspense>
    </Section>
  );
}
