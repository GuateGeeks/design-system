import { describe, expect, it } from 'vitest';
import { geekySnippet } from '../src/sections/geeky/snippet.ts';

describe('geekySnippet', () => {
  it('imports <Geeky> and uses the intent', () => {
    const code = geekySnippet({ intent: 'celebrate', render: '2d' });
    expect(code).toContain("import { Geeky } from '@guategeeks/mascot/react';");
    expect(code).toContain('<Geeky intent="celebrate" />');
    expect(code).not.toContain('render=');
  });

  it('adds render for 3d', () => {
    expect(geekySnippet({ intent: 'welcome', render: '3d' })).toContain('<Geeky intent="welcome" render="3d" />');
  });

  it('uses the action when there is no intent', () => {
    expect(geekySnippet({ action: 'bicycle', render: '2d' })).toContain('<Geeky action="bicycle" />');
  });

  it('escapes the label for JSX', () => {
    expect(geekySnippet({ intent: 'idea', render: '2d', label: 'Geeky dice "hola" & más' })).toContain('label="Geeky dice &quot;hola&quot; &amp; más"');
  });
});
