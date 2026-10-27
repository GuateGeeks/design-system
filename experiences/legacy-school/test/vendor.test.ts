import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import provenance from '../src/vendor/cotizador/PROVENANCE.md?raw';
import actors from '../src/vendor/cotizador/campus-actors.js?raw';
import architecture from '../src/vendor/cotizador/campus-architecture.js?raw';
import kit from '../src/vendor/cotizador/campus-kit.js?raw';
import layout from '../src/vendor/cotizador/campus-layout.js?raw';
import people from '../src/vendor/cotizador/campus-people.js?raw';
import scene from '../src/vendor/cotizador/campus-scene.js?raw';
import { createGeeky } from '../src/vendor/cotizador/campus-geeky.js';
import { createGeeky3D } from '@guategeeks/mascot';

const FILES: Record<string, string> = {
  'campus-actors.js': actors, 'campus-architecture.js': architecture, 'campus-kit.js': kit,
  'campus-layout.js': layout, 'campus-people.js': people, 'campus-scene.js': scene,
};

describe('vendored cotizador school', () => {
  it('every file matches its SHA256 in PROVENANCE.md', () => {
    const table = Object.fromEntries([...provenance.matchAll(/^\| `([^`]+\.js)` \| `[^`]+` \| `([0-9a-f]{64})` \|$/gm)].map((m) => [m[1], m[2]]));
    expect(Object.keys(table).sort()).toEqual(Object.keys(FILES).sort());
    for (const [name, text] of Object.entries(FILES)) expect(createHash('sha256').update(text, 'utf8').digest('hex'), name).toBe(table[name]);
  });

  it('campus-geeky.js hands the scene the current Geeky', () => {
    expect(createGeeky).toBe(createGeeky3D);
  });
});
