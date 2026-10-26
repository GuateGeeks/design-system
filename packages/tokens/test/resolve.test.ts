import { describe, expect, it } from 'vitest';
import { resolveTokens, type ResolvedToken } from '@guategeeks/tokens/build';

const byName = (tokens: ResolvedToken[], name: string) => {
  const token = tokens.find((t) => t.name === name);
  if (!token) throw new Error(`missing token ${name}`);
  return token;
};

describe('resolveTokens', () => {
  it('resolves semantic references', async () => {
    expect(byName(await resolveTokens('light'), 'gg-color-action').value).toBe('#ef8556');
    expect(byName(await resolveTokens('dark'), 'gg-color-bg').value).toBe('#121722');
  });

  it('emits css-ready values', async () => {
    const tokens = await resolveTokens('light');
    expect(byName(tokens, 'gg-duration-base').value).toBe('0.24s');
    expect(byName(tokens, 'gg-easing-spring').value).toBe('cubic-bezier(0.34, 1.56, 0.64, 1)');
    expect(byName(tokens, 'gg-tracking-body').value).toBe('-0.01em');
    expect(String(byName(tokens, 'gg-font-ui').value).startsWith("'Inter Variable'")).toBe(true);
  });

  it('tags layers', async () => {
    const tokens = await resolveTokens('light');
    expect(byName(tokens, 'gg-color-coral-500').layer).toBe('primitive');
    expect(byName(tokens, 'gg-color-action').layer).toBe('semantic');
  });

  it('applies extra trees last', async () => {
    const tokens = await resolveTokens('light', [{ color: { action: { $value: '#000000' } } }]);
    expect(byName(tokens, 'gg-color-action').value).toBe('#000000');
  });
});
