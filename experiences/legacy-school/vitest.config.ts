import { defineProject, mergeConfig } from 'vitest/config';
import { sourceConditions } from '../../vitest.shared.ts';

export default mergeConfig(sourceConditions, defineProject({
  test: { name: 'legacy-school', environment: 'jsdom', setupFiles: ['../../packages/three/test/helpers/canvas-2d.ts'] },
}));
