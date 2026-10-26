import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildThemesCss, buildThemesNativeTs, buildThemesTs } from './format.ts';
import { buildTheme, checkEditions, loadEditions, loadManifests } from './merge.ts';

const root = new URL('../../', import.meta.url);
const write = (relative: string, content: string) => {
  const file = fileURLToPath(new URL(relative, root));
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
};

const manifests = loadManifests();
const editions = loadEditions();
const builds = await Promise.all(manifests.map((m) => buildTheme(m, manifests)));
const errors = [...builds.flatMap((b) => b.errors), ...checkEditions(editions, manifests)];
if (errors.length) {
  console.error(`@guategeeks/themes: ${errors.length} error(s)\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  process.exit(1);
}

for (const b of builds) write(`dist/css/${b.resolved.id}.css`, b.css);
write('dist/css/themes.css', buildThemesCss(builds));
write('src/generated/themes.ts', buildThemesTs(builds.map((b) => b.resolved), editions));
write('src/generated/themes.native.ts', buildThemesNativeTs(builds));
console.log(`@guategeeks/themes: ${builds.length} themes, ${editions.length} editions generated`);
