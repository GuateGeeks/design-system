import { defineProject, mergeConfig } from 'vitest/config';
import { sourceConditions } from '../../vitest.shared.ts';

export default mergeConfig(sourceConditions, defineProject({
  test: { name: 'theme-runtime', environment: 'jsdom' },
}));
