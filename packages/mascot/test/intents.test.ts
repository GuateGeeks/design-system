import { describe, expect, it } from 'vitest';
import { ACTION_LIST } from '@guategeeks/geeky/actions';
import { GEEKY_INTENTS, resolveGeekyAction, type GeekyIntent } from '@guategeeks/mascot';

const INTENTS: GeekyIntent[] = ['welcome', 'goodbye', 'celebrate', 'reward', 'waiting', 'thinking', 'idea', 'attention', 'error', 'learning', 'idle'];

describe('Geeky intents', () => {
  it('cover exactly the eleven intents and map to existing actions', () => {
    expect(Object.keys(GEEKY_INTENTS).sort()).toEqual([...INTENTS].sort());
    const ids = new Set(ACTION_LIST.map((a) => a.id));
    for (const [intent, { action }] of Object.entries(GEEKY_INTENTS)) expect(ids.has(action), `${intent} -> ${action}`).toBe(true);
  });

  it('loop only for waiting, thinking and idle', () => {
    expect(INTENTS.filter((i) => GEEKY_INTENTS[i].loop).sort()).toEqual(['idle', 'thinking', 'waiting']);
  });

  it('resolve intent first, then action, else idle', () => {
    expect(resolveGeekyAction({ intent: 'celebrate', action: 'nope' })).toEqual({ id: GEEKY_INTENTS.celebrate.action, known: true });
    expect(resolveGeekyAction({ action: 'bicycle' })).toEqual({ id: 'bicycle', known: true });
    expect(resolveGeekyAction({ action: 'nope' })).toEqual({ id: 'idle', known: false });
    expect(resolveGeekyAction({})).toEqual({ id: 'idle', known: true });
  });
});
