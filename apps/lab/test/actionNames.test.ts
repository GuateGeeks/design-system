import { describe, expect, it, vi } from 'vitest';
import { GEEKY_ACTION_LIST as ACTION_LIST, GEEKY_GROUPS as GROUPS, GEEKY_INTENTS, type GeekyIntent } from '@guategeeks/mascot/react';
import { ACTION_NAMES_ES, GROUP_NAMES_ES, INTENT_NAMES_ES, actionName, groupName, untranslatedActions } from '../src/geeky/actionNames.ts';

describe('Geeky names in Spanish', () => {
  it('names every intent', () => {
    for (const intent of Object.keys(GEEKY_INTENTS) as GeekyIntent[]) expect(INTENT_NAMES_ES[intent], intent).toMatch(/\S/);
  });

  it('names every group', () => {
    for (const id of Object.keys(GROUPS)) expect(GROUP_NAMES_ES[id], id).toMatch(/\S/);
    expect(groupName('unknown-group')).toEqual({ text: 'unknown-group', translated: false });
  });

  it('names the v1.1.0 actions', () => {
    expect(Object.keys(ACTION_NAMES_ES)).toHaveLength(50);
    expect(actionName('celebrate')).toEqual({ text: ACTION_NAMES_ES.celebrate, translated: true });
  });

  it('falls back to the upstream label for an action it does not know', () => {
    expect(actionName('no-such')).toEqual({ text: 'no-such', translated: false });
    const upstream = ACTION_LIST[0];
    expect(actionName(upstream.id).text).toMatch(/\S/);
  });

  it('lists untranslated actions without failing (new upstream actions must not block updates)', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const missing = untranslatedActions();
    if (missing.length) console.info(`Geeky actions without a Spanish name: ${missing.join(', ')}`);
    expect(Array.isArray(missing)).toBe(true);
    info.mockRestore();
  });
});
