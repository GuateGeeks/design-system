/** Spanish UI copy for the lab. */
export const copy = {
  title: 'Laboratorio de diseño GuateGeeks',
  nav: { foundations: 'Fundamentos', components: 'Componentes', studio: 'Temas', experiences: 'Experiencias', geeky: 'Geeky', kit3d: 'Kit 3D' },
  loading: 'Cargando…',
  toolbar: {
    label: 'Apariencia',
    theme: 'Tema',
    scheme: 'Esquema',
    motion: 'Movimiento',
    edition: 'Edición',
    viewport: 'Vista',
    schemeOptions: { auto: 'Auto', light: 'Claro', dark: 'Oscuro' },
    motionOptions: { auto: 'Auto', full: 'Completo', reduced: 'Reducido' },
    viewportOptions: { phone: 'Teléfono', tablet: 'Tableta', desktop: 'Escritorio' },
    noEdition: 'Ninguna',
    schemeLocked: (theme: string) => `${theme} solo tiene un esquema.`,
  },
  frames: { title: 'Marcos', description: 'Cada estado de cada componente, sin el entorno del laboratorio.' },
  notFound: 'Esta página no existe.',
  missingState: 'Este estado no existe.',
} as const;
