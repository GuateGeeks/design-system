// Texts from GuateGeeks/cotizador@a125f6f:asesor/campus-experience.js and asesor/config.js (Apache-2.0 in this repo).

export type LegacyProgramId = 'tale' | 'master' | 'spike' | 'electronics' | 'drones' | 'immersive';
export type LegacyLevelId = 'pre' | 'prim' | 'bas' | 'bach';

/** What each workshop shows in the scene, as the cotizador described it. */
export const LEGACY_PROGRAMS: Readonly<Record<LegacyProgramId, { name: string; action: string; detail: string }>> = Object.freeze({
  tale: { name: 'Tale-Bot', action: 'Programar jugando', detail: 'Ordenan tarjetas de flechas, presionan el botón y el Tale-Bot recorre el tapete paso a paso.' },
  master: { name: 'Robot Master', action: 'Construir y mover', detail: 'Arman un dinosaurio pieza por pieza, lo programan en la tableta y lo ponen a caminar.' },
  spike: { name: 'SPIKE Prime', action: 'Inventar con sensores', detail: 'Programan en la laptop; el robot sigue la línea y activa la misión del tapete.' },
  electronics: { name: 'Electrónica', action: 'Encender una idea', detail: 'Colocan la pieza que falta, encienden el interruptor y miden el circuito con el multímetro.' },
  drones: { name: 'Drones', action: 'Explorar el vuelo', detail: 'El piloto despega, cruza el aro sobre el mapa y aterriza; luego cede el control.' },
  immersive: { name: 'Realidad virtual', action: 'Explorar otros mundos', detail: 'Con visores, exploran un planeta, el Templo I de Tikal y una molécula, guiados por su docente.' },
});

export const LEGACY_LEVELS: Readonly<Record<LegacyLevelId, string>> = Object.freeze({
  pre: 'Preprimaria', prim: 'Primaria', bas: 'Básico', bach: 'Bachillerato',
});
