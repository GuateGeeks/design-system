/**
 * jsdom has no 2D canvas. Scenes draw small textures (Geeky's lenses, contact blobs) with it; unit tests
 * only need the calls to succeed. Real rendering is covered by the Playwright suites.
 */
const noop = () => {};
const gradient = { addColorStop: noop };
const context2d = new Proxy({ createRadialGradient: () => gradient, createLinearGradient: () => gradient, measureText: () => ({ width: 0 }), getImageData: () => ({ data: new Uint8ClampedArray(4) }) } as Record<string, unknown>, {
  get: (target, key) => (key in target ? target[key as string] : noop),
  set: () => true,
});
const original = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
  return type === '2d' ? (context2d as unknown as CanvasRenderingContext2D) : (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
} as typeof HTMLCanvasElement.prototype.getContext;
