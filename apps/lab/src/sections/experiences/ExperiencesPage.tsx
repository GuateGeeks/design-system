import { Section } from '../Section.tsx';
import { CampusDemo } from './CampusDemo.tsx';

export default function ExperiencesPage() {
  return (
    <Section
      title="Experiencias"
      description="Experiencias de referencia construidas solo con el sistema. El campus vivo del cotizador: configura niveles y programas y mira cómo crece la escuela de cartulina; toca un aula para editarla."
    >
      <h3 className="text-xl">Campus vivo</h3>
      <CampusDemo />
    </Section>
  );
}
