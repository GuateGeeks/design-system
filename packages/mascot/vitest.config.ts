import { defineProject, mergeConfig } from 'vitest/config';
import { sourceConditions } from '../../vitest.shared.ts';

export default mergeConfig(sourceConditions, defineProject({
  test: { name: 'mascot', environment: 'jsdom', setupFiles: ['../three/test/helpers/canvas-2d.ts'] },
}));
