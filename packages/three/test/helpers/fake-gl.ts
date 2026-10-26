import { vi } from 'vitest';

/** A WebGLRenderer stand-in: records calls, never touches WebGL. */
export function fakeRenderer() {
  const canvas = document.createElement('canvas');
  let ratio = 1;
  return {
    domElement: canvas,
    shadowMap: { enabled: true, type: 0 },
    outputColorSpace: '',
    toneMapping: 0,
    toneMappingExposure: 1,
    info: { render: { triangles: 123, calls: 4 }, memory: { geometries: 7 } },
    setClearColor: vi.fn(),
    setPixelRatio: vi.fn((r: number) => { ratio = r; }),
    getPixelRatio: () => ratio,
    setSize: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
  };
}

type Callback = (entries: Array<{ isIntersecting: boolean }>) => void;

/** Installs controllable IntersectionObserver / ResizeObserver / matchMedia. */
export function fakeEnvironment({ finePointer = false } = {}) {
  const intersections: Callback[] = [];
  const resizes: Array<() => void> = [];
  const disconnects = { intersection: 0, resize: 0 };
  const g = globalThis as Record<string, unknown>;
  const saved = { io: g.IntersectionObserver, ro: g.ResizeObserver, mm: window.matchMedia };
  g.IntersectionObserver = class { constructor(cb: Callback) { intersections.push(cb); } observe() {} disconnect() { disconnects.intersection++; } };
  g.ResizeObserver = class { constructor(cb: () => void) { resizes.push(cb); } observe() {} disconnect() { disconnects.resize++; } };
  window.matchMedia = ((q: string) => ({ matches: q === '(pointer: fine)' ? finePointer : false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
  return {
    setVisible(visible: boolean) { intersections.forEach((cb) => cb([{ isIntersecting: visible }])); },
    resize() { resizes.forEach((cb) => cb()); },
    disconnects,
    restore() { g.IntersectionObserver = saved.io; g.ResizeObserver = saved.ro; window.matchMedia = saved.mm; },
  };
}

export function sizedContainer(width = 800, height = 500) {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({ width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0, toJSON() {} }) as DOMRect;
  Object.defineProperty(el, 'clientWidth', { value: width });
  Object.defineProperty(el, 'clientHeight', { value: height });
  document.body.appendChild(el);
  return el;
}
