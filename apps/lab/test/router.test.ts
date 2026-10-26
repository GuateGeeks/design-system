import { describe, expect, it } from 'vitest';
import { frameHref, parseRoute } from '../src/router.ts';

describe('parseRoute', () => {
  it('defaults to foundations', () => {
    expect(parseRoute('')).toEqual({ section: 'foundations' });
    expect(parseRoute('#/')).toEqual({ section: 'foundations' });
  });

  it('parses sections', () => {
    expect(parseRoute('#/foundations')).toEqual({ section: 'foundations' });
    expect(parseRoute('#/components/button')).toEqual({ section: 'components', id: 'button' });
    expect(parseRoute('#/components')).toEqual({ section: 'components' });
    expect(parseRoute('#/studio')).toEqual({ section: 'studio' });
  });

  it('parses frames with query', () => {
    expect(parseRoute('#/frame/button/default?theme=halloween&scheme=dark&motion=reduced')).toEqual({
      frame: { entry: 'button', state: 'default', theme: 'halloween', scheme: 'dark', motion: 'reduced', edition: null },
    });
  });

  it('defaults frame scheme and motion to auto', () => {
    expect(parseRoute('#/frame/card/open')).toEqual({
      frame: { entry: 'card', state: 'open', theme: 'guategeeks', scheme: 'auto', motion: 'auto', edition: null },
    });
  });

  it('decodes params and rejects bad values', () => {
    expect(parseRoute('#/frame/a%20b/c?scheme=purple&edition=halloween-2026')).toEqual({
      frame: { entry: 'a b', state: 'c', theme: 'guategeeks', scheme: 'auto', motion: 'auto', edition: 'halloween-2026' },
    });
  });

  it('frames index and not found', () => {
    expect(parseRoute('#/frames')).toEqual({ frames: true });
    expect(parseRoute('#/nope')).toEqual({ notFound: '/nope' });
  });

  it('builds frame hrefs that round-trip', () => {
    const href = frameHref('button', 'loading', { theme: 'halloween', scheme: 'dark', motion: 'reduced', edition: null });
    expect(parseRoute(href)).toEqual({ frame: { entry: 'button', state: 'loading', theme: 'halloween', scheme: 'dark', motion: 'reduced', edition: null } });
  });
});
