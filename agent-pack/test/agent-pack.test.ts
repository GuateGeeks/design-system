import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const PACK = resolve(import.meta.dirname, '..');
const ROOT = resolve(PACK, '..');
const read = (p: string) => readFileSync(p, 'utf8');
const json = (p: string) => JSON.parse(read(p));
const markdown = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === 'node_modules' || f === 'test' ? [] : markdown(p);
    return p.endsWith('.md') ? [p] : [];
  });

describe('agent pack', () => {
  it('plugin and marketplace manifests agree', () => {
    const marketplace = json(join(ROOT, '.claude-plugin/marketplace.json'));
    const plugin = json(join(PACK, '.claude-plugin/plugin.json'));
    expect(marketplace.owner.name).toBe('GuateGeeks');
    expect(marketplace.plugins).toHaveLength(1);
    expect(marketplace.plugins[0]).toMatchObject({ name: plugin.name, source: './agent-pack' });
    expect(plugin).toMatchObject({ name: 'guategeeks-design', version: '0.1.0' });
  });

  it('skills have valid frontmatter', () => {
    const skills = readdirSync(join(PACK, 'skills'));
    expect(skills.sort()).toEqual(['adopt-guategeeks-design', 'build-3d-experience', 'create-theme']);
    for (const skill of skills) {
      const text = read(join(PACK, 'skills', skill, 'SKILL.md'));
      const front = /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? '';
      expect(/^name: (.+)$/m.exec(front)?.[1], skill).toBe(skill);
      expect(/^description: (.+)$/m.exec(front)?.[1] ?? '', skill).toMatch(/^Use when /);
    }
  });

  it('every --gg token mentioned exists', () => {
    const names = new Set(json(join(ROOT, 'packages/tokens/dist/tokens.json')).map((t: { name: string }) => t.name));
    const missing: string[] = [];
    for (const file of markdown(PACK)) {
      for (const [token] of read(file).matchAll(/--gg-[a-z0-9-]*[a-z0-9](?![a-z0-9-])/g) /* skips templates like --gg-color-<role> */) {
        if (!names.has(token)) missing.push(`${file.replace(ROOT, '')}: ${token}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('relative links resolve', () => {
    const broken: string[] = [];
    for (const file of [join(PACK, 'llms.txt'), ...markdown(PACK)]) {
      for (const [, target] of read(file).matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
        if (/^[a-z]+:/i.test(target)) continue;
        if (!existsSync(resolve(dirname(file), target))) broken.push(`${file.replace(ROOT, '')} → ${target}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('llms.txt indexes the context, skills and checklist', () => {
    const index = read(join(PACK, 'llms.txt'));
    for (const target of ['CONTEXT.md', 'skills/adopt-guategeeks-design/SKILL.md', 'skills/create-theme/SKILL.md', 'skills/build-3d-experience/SKILL.md', 'checklists/adoption.md']) {
      expect(index).toContain(`(${target})`);
    }
  });
});
