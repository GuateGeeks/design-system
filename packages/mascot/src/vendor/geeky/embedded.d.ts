import type { Group, Material } from 'three';

export const DETAIL: Readonly<Record<string, number>>;
export interface EmbeddedGeeky {
  brain: any;
  stage: Group;
  renderer: any;
  step(dt: number): void;
  materials(): Material[];
  dispose(): void;
}
export function createEmbeddedGeeky(options?: { seed?: number; reduced?: boolean }): EmbeddedGeeky;
