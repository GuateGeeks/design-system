import { defineProject, mergeConfig } from 'vitest/config';
import { sourceConditions } from '../../vitest.shared.ts';

export default mergeConfig(sourceConditions, defineProject({
  test: { name: 'lab', environment: 'jsdom', include: ['test/**/*.test.{ts,tsx}'], setupFiles: ['./test/setup.ts'] },
}));
