import { ACTIONS, ALIASES } from '@guategeeks/geeky/actions';

/** What a product wants Geeky to communicate. Use intents rather than raw action ids. */
export type GeekyIntent =
  | 'welcome' | 'goodbye' | 'celebrate' | 'reward' | 'waiting' | 'thinking'
  | 'idea' | 'attention' | 'error' | 'learning' | 'idle';

/**
 * The geeky-animation action behind each intent. `loop` intents keep going until the intent changes;
 * the others play once and Geeky returns to rest. test/intents.test.ts fails if an upstream release
 * removes one of these actions.
 */
export const GEEKY_INTENTS: Readonly<Record<GeekyIntent, { action: string; loop: boolean }>> = Object.freeze({
  welcome: { action: 'greet', loop: false },
  goodbye: { action: 'goodbye', loop: false },
  celebrate: { action: 'celebrate', loop: false },
  reward: { action: 'gg-certificate', loop: false },
  waiting: { action: 'waiting', loop: true },
  thinking: { action: 'thinking', loop: true },
  idea: { action: 'idea', loop: false },
  attention: { action: 'get-attention', loop: false },
  error: { action: 'failed', loop: false },
  learning: { action: 'gg-mentor', loop: false },
  idle: { action: 'idle', loop: true },
});

/** The action to play: the intent's when given, else `action` if it exists, else the idle rest (`known: false`). */
export function resolveGeekyAction(input: { intent?: GeekyIntent; action?: string }): { id: string; known: boolean } {
  if (input.intent && Object.hasOwn(GEEKY_INTENTS, input.intent)) return { id: GEEKY_INTENTS[input.intent].action, known: true };
  if (input.action === undefined) return { id: 'idle', known: true };
  const id = ALIASES[input.action] ?? input.action;
  return Object.hasOwn(ACTIONS, id) ? { id, known: true } : { id: 'idle', known: false };
}

/** Whether an action loops (intents decide for themselves; raw actions follow geeky-animation). */
export function loops(input: { intent?: GeekyIntent }, id: string): boolean {
  if (input.intent && Object.hasOwn(GEEKY_INTENTS, input.intent)) return GEEKY_INTENTS[input.intent].loop;
  return !!ACTIONS[id]?.loop;
}
