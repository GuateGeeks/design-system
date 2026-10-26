import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
window.matchMedia ??= ((query: string) => ({
  matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
})) as unknown as typeof window.matchMedia;
(Element.prototype as unknown as { animate: unknown }).animate ??= vi.fn(() => ({}));
