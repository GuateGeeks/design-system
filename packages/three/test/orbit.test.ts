import { afterEach, describe, expect, it, vi } from 'vitest';
import { BoxGeometry, Mesh, MeshBasicMaterial, OrthographicCamera, Vector3 } from 'three';
import { createOrbit, pickAt, type Orbit } from '@guategeeks/three';

const LIMITS = { yaw: -0.55, pitch: 0.6, yawLimit: 1.35, pitchMin: 0.2, pitchMax: 1.15, zoomMin: 0.7, zoomMax: 9, panLimit: () => 20 };
const W = 800, H = 500, HALF = 4;

/** The engine's job: frame the camera from the orbit state (half-height HALF/zoom, looking at pan). */
function frame(orbit: Orbit, camera: OrthographicCamera) {
  const { yaw, pitch, zoom, pan } = orbit.current;
  const half = HALF / zoom, aspect = W / H;
  Object.assign(camera, { left: -half * aspect, right: half * aspect, top: half, bottom: -half });
  camera.position.set(pan.x + Math.sin(yaw) * Math.cos(pitch) * 30, pan.y + Math.sin(pitch) * 30, pan.z + Math.cos(yaw) * Math.cos(pitch) * 30);
  camera.lookAt(pan);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}

function setup() {
  const canvas = document.createElement('canvas');
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: W, height: H, right: W, bottom: H, x: 0, y: 0, toJSON() {} }) as DOMRect;
  canvas.setPointerCapture = vi.fn();
  canvas.releasePointerCapture = vi.fn();
  canvas.hasPointerCapture = () => true;
  document.body.appendChild(canvas);
  const camera = new OrthographicCamera();
  const orbit = createOrbit(LIMITS);
  frame(orbit, camera);
  const handlers = { onChange: vi.fn(() => frame(orbit, camera)), onTap: vi.fn(), onHover: vi.fn(() => false) };
  const detach = orbit.attach(canvas, camera, handlers);
  return { canvas, camera, orbit, handlers, detach };
}

const pointer = (target: EventTarget, type: string, x: number, y: number, extra: Record<string, unknown> = {}) => {
  const e = new PointerEvent(type, { clientX: x, clientY: y, bubbles: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, ...extra });
  target.dispatchEvent(e);
};

let detachAll: Array<() => void> = [];
afterEach(() => { detachAll.forEach((d) => d()); detachAll = []; });

describe('createOrbit', () => {
  it('step converges and reports rest', () => {
    const orbit = createOrbit(LIMITS);
    orbit.rotate(0.5);
    expect(orbit.step(0.016)).toBe(true);
    for (let i = 0; i < 400; i++) orbit.step(0.016);
    expect(orbit.step(0.016)).toBe(false);
    expect(orbit.current.yaw).toBeCloseTo(-0.05, 5);
  });

  it('rotate clamps to yawLimit and tilt to the pitch range', () => {
    const orbit = createOrbit(LIMITS);
    orbit.rotate(10);
    expect(orbit.target.yaw).toBe(1.35);
    orbit.tilt(10);
    expect(orbit.target.pitch).toBe(1.15);
    orbit.tilt(-10);
    expect(orbit.target.pitch).toBe(0.2);
  });

  it('zoomAt keeps the point under the pointer', () => {
    const { orbit, camera } = setup();
    const at = { x: 620, y: 140 };
    const ndc = new Vector3((at.x / W) * 2 - 1, -(at.y / H) * 2 + 1, 0);
    const world = ndc.clone().unproject(camera);
    orbit.zoomAt(2, at.x, at.y);
    orbit.settle();
    frame(orbit, camera);
    const back = world.clone().project(camera);
    expect(back.x).toBeCloseTo(ndc.x, 3);
    expect(back.y).toBeCloseTo(ndc.y, 3);
  });

  it('zoom limits and recentering on zoom out', () => {
    const { orbit } = setup();
    orbit.zoomAt(100, 700, 100);
    expect(orbit.target.zoom).toBe(9);
    orbit.zoomAt(0.01);
    expect(orbit.target.zoom).toBe(0.7);
    expect(orbit.target.pan.length()).toBe(0);
  });

  it('drag rotates, tap fires onTap', () => {
    const { canvas, orbit, handlers, detach } = setup();
    detachAll.push(detach);
    pointer(canvas, 'pointerdown', 100, 100);
    pointer(canvas, 'pointermove', 160, 102);
    pointer(window, 'pointerup', 160, 102);
    expect(orbit.target.yaw).not.toBe(LIMITS.yaw);
    expect(handlers.onTap).not.toHaveBeenCalled();
    pointer(canvas, 'pointerdown', 300, 300);
    pointer(window, 'pointerup', 302, 301);
    expect(handlers.onTap).toHaveBeenCalledTimes(1);
  });

  it('vertical touch drag does not rotate', () => {
    const { canvas, orbit, detach } = setup();
    detachAll.push(detach);
    pointer(canvas, 'pointerdown', 100, 100, { pointerType: 'touch' });
    pointer(canvas, 'pointermove', 102, 160, { pointerType: 'touch' });
    pointer(canvas, 'pointermove', 140, 200, { pointerType: 'touch' });
    pointer(window, 'pointerup', 140, 200, { pointerType: 'touch' });
    expect(orbit.target.yaw).toBe(LIMITS.yaw);
  });

  it('pinch zooms without rotating', () => {
    const { canvas, orbit, detach } = setup();
    detachAll.push(detach);
    pointer(canvas, 'pointerdown', 300, 250, { pointerType: 'touch', pointerId: 1 });
    pointer(canvas, 'pointerdown', 500, 250, { pointerType: 'touch', pointerId: 2, isPrimary: false });
    pointer(canvas, 'pointermove', 250, 250, { pointerType: 'touch', pointerId: 1 });
    pointer(canvas, 'pointermove', 550, 250, { pointerType: 'touch', pointerId: 2, isPrimary: false });
    expect(orbit.target.zoom).toBeGreaterThan(1);
    expect(orbit.target.yaw).toBe(LIMITS.yaw);
  });

  it('wheel zooms toward the pointer', () => {
    const { canvas, orbit, detach } = setup();
    detachAll.push(detach);
    canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: -200, clientX: 400, clientY: 250, cancelable: true }));
    expect(orbit.target.zoom).toBeGreaterThan(1);
  });

  it('hover asks the engine and sets the cursor', () => {
    const { canvas, handlers, detach } = setup();
    detachAll.push(detach);
    handlers.onHover.mockReturnValueOnce(true);
    pointer(canvas, 'pointermove', 10, 10);
    expect(canvas.style.cursor).toBe('pointer');
    pointer(canvas, 'pointermove', 20, 20);
    expect(canvas.style.cursor).toBe('grab');
  });

  it('detach removes listeners', () => {
    const { canvas, orbit, handlers, detach } = setup();
    detach();
    pointer(canvas, 'pointerdown', 100, 100);
    pointer(canvas, 'pointermove', 200, 100);
    pointer(window, 'pointerup', 200, 100);
    expect(orbit.target.yaw).toBe(LIMITS.yaw);
    expect(handlers.onChange).not.toHaveBeenCalled();
  });
});

describe('pickAt', () => {
  it('returns the nearest target under the pointer', () => {
    const camera = new OrthographicCamera(-4, 4, 2.5, -2.5, 0.1, 100);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    const canvas = document.createElement('canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: W, height: H, right: W, bottom: H, x: 0, y: 0, toJSON() {} }) as DOMRect;
    const box = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
    box.updateMatrixWorld();
    expect(pickAt({ clientX: 400, clientY: 250 }, canvas, camera, [box])).toBe(box);
    expect(pickAt({ clientX: 10, clientY: 10 }, canvas, camera, [box])).toBeNull();
  });
});
