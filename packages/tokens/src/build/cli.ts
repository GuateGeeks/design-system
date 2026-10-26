import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCss } from './format-css.ts';
import { buildNativeData, buildNativeTs } from './format-native.ts';
import { buildTailwind } from './format-tailwind.ts';
import { buildTokenData, buildTokenJson, buildTs } from './format-ts.ts';
import { resolveTokens } from './resolve.ts';

const root = new URL('../../', import.meta.url);
const write = (relative: string, content: string) => {
  const file = fileURLToPath(new URL(relative, root));
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
};

const light = await resolveTokens('light');
const dark = await resolveTokens('dark');

write('dist/css/tokens.css', buildCss(light, dark));
write('dist/css/tailwind.css', buildTailwind(light));
write('dist/tokens.json', `${JSON.stringify(buildTokenJson(light, dark), null, 2)}\n`);
write('src/generated/tokens.ts', buildTs(buildTokenData(light, dark)));
write('src/generated/tokens.native.ts', buildNativeTs(buildNativeData(light, dark)));
console.log(`@guategeeks/tokens: ${light.length} tokens generated`);
