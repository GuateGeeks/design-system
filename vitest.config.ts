import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*', 'experiences/*', 'apps/*', 'agent-pack'],
  },
});
