import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(import.meta.dirname, '../src/');
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : [join(dir, f)]));

const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:])\/\/.*$/gm, '$1');

const RULES: Array<[string, RegExp]> = [
  ['color literal', /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/],
  ['raw duration', /\b\d+(\.\d+)?ms\b/],
  ['default palette class', /\b(bg|text|border|ring|fill|stroke)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}\b/],
];

describe('token guard', () => {
  it('ui source uses semantic tokens only', () => {
    const problems: string[] = [];
    for (const file of files(SRC)) {
      stripComments(readFileSync(file, 'utf8')).split('\n').forEach((line, i) => {
        for (const [name, re] of RULES) if (re.test(line)) problems.push(`${file.replace(SRC, 'src/')}:${i + 1} ${name}: ${line.trim()}`);
      });
    }
    expect(problems).toEqual([]);
  });

  it('catches violations', () => {
    expect(RULES[0][1].test('color: #ff0000')).toBe(true);
    expect(RULES[1][1].test('transition: all 200ms')).toBe(true);
    expect(RULES[2][1].test('className="bg-orange-500"')).toBe(true);
  });
});
