import { GEEKY_ACTION_LIST as ACTION_LIST, GEEKY_ACTIONS as ACTIONS, type GeekyIntent } from '@guategeeks/mascot/react';

/** Spanish names for the lab. geeky-animation names its actions in English. */
export const INTENT_NAMES_ES: Readonly<Record<GeekyIntent, string>> = Object.freeze({
  welcome: 'Dar la bienvenida',
  goodbye: 'Despedirse',
  celebrate: 'Celebrar',
  reward: 'Premiar un logro',
  waiting: 'Esperar',
  thinking: 'Pensar',
  idea: 'Dar una idea',
  attention: 'Llamar la atención',
  error: 'Algo falló',
  learning: 'Acompañar el aprendizaje',
  idle: 'Reposo',
});

export const GROUP_NAMES_ES: Readonly<Record<string, string>> = Object.freeze({
  classic: 'Los nueve clásicos',
  assistant: 'Asistente',
  emotion: 'Emociones',
  fidget: 'Gestos en reposo',
  transform: 'Transformaciones',
  technology: 'Laboratorio de tecnología',
  guategeeks: 'Aprendizaje GuateGeeks',
});

/** The 50 actions of geeky-animation v1.1.0. A newer action shows its English name until it is added here. */
export const ACTION_NAMES_ES: Readonly<Record<string, string>> = Object.freeze({
  idle: 'Curioso',
  'running-right': 'Revolotear a la derecha',
  'running-left': 'Revolotear a la izquierda',
  waving: 'Hola',
  jumping: 'Alegría',
  failed: 'Ups',
  waiting: 'Esperando',
  running: 'Órbita',
  review: 'Mirar de cerca',
  greet: 'Saludar',
  goodbye: 'Despedirse',
  'get-attention': 'Toc, toc',
  thinking: 'Pensando',
  searching: 'Buscando',
  writing: 'Escribiendo',
  reading: 'Leyendo',
  idea: '¡Idea!',
  point: 'Señalar',
  listen: 'Escuchando',
  celebrate: 'Celebrar',
  love: 'Cariño',
  dizzy: 'Mareado',
  sleep: 'Dormir',
  wake: 'Despertar',
  surprised: 'Sorpresa',
  confused: 'Confundido',
  sad: 'Triste',
  giggle: 'Risita',
  shrug: 'Encogerse de hombros',
  nod: 'Sí',
  shake: 'No',
  'look-around': 'Mirar alrededor',
  yawn: 'Bostezar',
  polish: 'Limpiar los lentes',
  adjust: 'Subirse los lentes',
  bicycle: 'Bicicleta',
  'tech-portal': 'Portal del navegador',
  'tech-blueprint': 'Plano del proyecto',
  'tech-debug': 'Depurar y reparar',
  'tech-reboot': 'Reinicio suave',
  'tech-peek': 'Asomarse al código',
  'tech-compile': 'Torbellino de compilación',
  'tech-connect': 'Conectar el stack',
  'tech-network': 'Enrutar la red',
  'tech-focus': 'Modo concentración',
  'tech-build': 'Construir un proyecto maker',
  'tech-compress': 'Comprimir el archivo',
  'tech-deploy': 'Desplegar el código',
  'gg-certificate': 'Certificado GuateGeeks',
  'gg-mentor': 'Mentor GuateGeeks',
});

type Name = { text: string; translated: boolean };

/** The Spanish name, or geeky-animation's English label (`translated: false`) for an action not in the table yet. */
export function actionName(id: string): Name {
  if (Object.hasOwn(ACTION_NAMES_ES, id)) return { text: ACTION_NAMES_ES[id], translated: true };
  return { text: ACTIONS[id]?.label ?? id, translated: false };
}

export function groupName(id: string): Name {
  return Object.hasOwn(GROUP_NAMES_ES, id) ? { text: GROUP_NAMES_ES[id], translated: true } : { text: id, translated: false };
}

/** Actions of the installed geeky-animation without a Spanish name. */
export function untranslatedActions(): string[] {
  return ACTION_LIST.map((a) => a.id).filter((id) => !Object.hasOwn(ACTION_NAMES_ES, id));
}
