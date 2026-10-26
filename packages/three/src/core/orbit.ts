/**
 * Orbit camera state and input for orthographic scenes. Input rules come from
 * GuateGeeks/cotizador@673ee22:asesor/lab/campus-scene.js: a horizontal drag rotates (a mostly vertical touch
 * drag is left to page scrolling), the wheel and a two-finger pinch zoom toward the pointer, a short press
 * without dragging is a tap. The engine owns the projection: it reads `current` every frame and frames the
 * camera so that the half-height of the view shrinks with `zoom` and the view centre moves with `pan`.
 */
import { Vector3, type OrthographicCamera } from 'three';

export interface OrbitLimits {
  yaw: number;
  pitch: number;
  yawLimit: number;
  pitchMin: number;
  pitchMax: number;
  zoomMin: number;
  zoomMax: number;
  /** Largest pan distance, in world units (usually from the scene size). */
  panLimit: () => number;
}

export interface OrbitState { yaw: number; pitch: number; zoom: number; pan: Vector3 }

export interface OrbitHandlers {
  /** Targets changed: request a frame. */
  onChange(): void;
  /** A press released without dragging. */
  onTap?(event: PointerEvent): void;
  /** Mouse hover (null when leaving). Return true when something selectable is under the pointer. */
  onHover?(event: PointerEvent | null): boolean | void;
}

export interface Orbit {
  readonly current: OrbitState;
  readonly target: OrbitState;
  rotate(delta: number): void;
  tilt(delta: number): void;
  zoom(delta: number): void;
  /** Zoom by `factor`, keeping the world point under (clientX, clientY) in place. */
  zoomAt(factor: number, clientX?: number, clientY?: number): void;
  set(target: Partial<Omit<OrbitState, 'pan'>> & { pan?: Vector3 }): void;
  reset(): void;
  /** Exponential approach toward the target (rate 6/s). Returns true while still moving. */
  step(dt: number): boolean;
  settle(): void;
  attach(canvas: HTMLCanvasElement, camera: OrthographicCamera, handlers: OrbitHandlers): () => void;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const DRAG_START = 6;
const SCROLL_RELEASE = 9;
const TAP_SLOP = 7;
const ROTATE_PER_PX = -0.009;

export function createOrbit(limits: OrbitLimits): Orbit {
  const current: OrbitState = { yaw: limits.yaw, pitch: limits.pitch, zoom: 1, pan: new Vector3() };
  const target: OrbitState = { yaw: limits.yaw, pitch: limits.pitch, zoom: 1, pan: new Vector3() };
  const axisX = new Vector3(), axisY = new Vector3();
  let camera: OrthographicCamera | null = null;
  let canvasEl: HTMLCanvasElement | null = null;
  let changed: () => void = () => {};

  function clampPan() {
    const limit = limits.panLimit();
    if (target.pan.length() > limit) target.pan.setLength(limit);
  }

  function zoomAt(factor: number, clientX?: number, clientY?: number) {
    if (!Number.isFinite(factor)) return;
    const previous = target.zoom;
    const next = clamp(previous * factor, limits.zoomMin, limits.zoomMax);
    if (next === previous) return;
    if (clientX != null && clientY != null && camera && canvasEl) {
      const rect = canvasEl.getBoundingClientRect();
      const u = (clientX - rect.left) / rect.width, v = (clientY - rect.top) / rect.height;
      camera.updateMatrixWorld();
      axisX.setFromMatrixColumn(camera.matrixWorld, 0);
      axisY.setFromMatrixColumn(camera.matrixWorld, 1);
      const sx = camera.left + u * (camera.right - camera.left);
      const sy = camera.top - v * (camera.top - camera.bottom);
      const k = (current.zoom / previous) * (1 - previous / next);
      target.pan.addScaledVector(axisX, sx * k).addScaledVector(axisY, sy * k);
      clampPan();
    }
    target.zoom = next;
    // Zooming back out drifts toward the framed centre.
    if (next < previous && next <= 1.001) target.pan.multiplyScalar(next <= limits.zoomMin + 0.01 ? 0 : 0.5);
    changed();
  }

  const orbit: Orbit = {
    current,
    target,
    rotate(delta) {
      if (!Number.isFinite(delta)) return;
      target.yaw = clamp(target.yaw + delta, -limits.yawLimit, limits.yawLimit);
      changed();
    },
    tilt(delta) {
      if (!Number.isFinite(delta)) return;
      target.pitch = clamp(target.pitch + delta, limits.pitchMin, limits.pitchMax);
      changed();
    },
    zoom(delta) { if (Number.isFinite(delta)) zoomAt(Math.exp(delta * 2)); },
    zoomAt,
    set(next) {
      if (next.yaw != null) target.yaw = clamp(next.yaw, -limits.yawLimit, limits.yawLimit);
      if (next.pitch != null) target.pitch = clamp(next.pitch, limits.pitchMin, limits.pitchMax);
      if (next.zoom != null) target.zoom = clamp(next.zoom, limits.zoomMin, limits.zoomMax);
      if (next.pan) target.pan.copy(next.pan);
      changed();
    },
    reset() {
      target.yaw = limits.yaw;
      target.pitch = limits.pitch;
      target.zoom = 1;
      target.pan.set(0, 0, 0);
      changed();
    },
    step(dt) {
      const rate = 1 - Math.exp(-dt * 6);
      let moving = false;
      for (const key of ['yaw', 'pitch', 'zoom'] as const) {
        current[key] += (target[key] - current[key]) * rate;
        const epsilon = key === 'zoom' ? 0.0005 * target.zoom : 0.0005;
        if (Math.abs(target[key] - current[key]) < epsilon) current[key] = target[key];
        else moving = true;
      }
      current.pan.lerp(target.pan, rate);
      if (current.pan.distanceToSquared(target.pan) < 1e-6) current.pan.copy(target.pan);
      else moving = true;
      return moving;
    },
    settle() {
      current.yaw = target.yaw;
      current.pitch = target.pitch;
      current.zoom = target.zoom;
      current.pan.copy(target.pan);
    },
    attach(canvas, cam, handlers) {
      camera = cam;
      canvasEl = canvas;
      changed = () => handlers.onChange();
      canvas.style.cursor = 'grab';
      let pointer: null | { id?: number; x?: number; y?: number; lastX?: number; dragging: boolean; pinch?: boolean; distance?: number } = null;
      let hovering = false;
      const touches = new Map<number, { x: number; y: number }>();

      function down(event: PointerEvent) {
        if (event.pointerType === 'touch') {
          touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (touches.size === 2) {
            const [a, b] = [...touches.values()];
            pointer = { pinch: true, distance: Math.hypot(a.x - b.x, a.y - b.y), dragging: true };
            return;
          }
        }
        if (event.isPrimary === false || event.button > 0) return;
        pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, dragging: false };
      }
      function move(event: PointerEvent) {
        if (event.pointerType === 'touch' && touches.has(event.pointerId)) touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointer?.pinch) {
          if (touches.size < 2) return;
          const [a, b] = [...touches.values()];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          // Pinch zooms toward the fingers' midpoint; it never drags the model.
          if (pointer.distance > 0) zoomAt(distance / pointer.distance, (a.x + b.x) / 2, (a.y + b.y) / 2);
          pointer.distance = distance;
          return;
        }
        if (!pointer) {
          if (event.pointerType !== 'mouse') return;
          const hit = !!handlers.onHover?.(event);
          if (hit !== hovering) { hovering = hit; canvas.style.cursor = hit ? 'pointer' : 'grab'; }
          return;
        }
        if (pointer.id !== event.pointerId) return;
        const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
        if (!pointer.dragging) {
          // Dragging only rotates; a vertical touch drag keeps scrolling the page.
          if (Math.abs(dy) > SCROLL_RELEASE && Math.abs(dy) > Math.abs(dx)) { pointer = null; return; }
          if (Math.abs(dx) < DRAG_START) return;
          pointer.dragging = true;
          canvas.setPointerCapture?.(event.pointerId);
          canvas.style.cursor = 'grabbing';
        }
        orbit.rotate((event.clientX - pointer.lastX) * ROTATE_PER_PX);
        pointer.lastX = event.clientX;
      }
      function up(event: PointerEvent) {
        if (event.pointerType === 'touch') touches.delete(event.pointerId);
        if (pointer?.pinch) { if (touches.size === 0) pointer = null; return; }
        if (!pointer || pointer.id !== event.pointerId) return;
        const tap = !pointer.dragging && event.type !== 'pointercancel' && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) < TAP_SLOP;
        if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
        pointer = null;
        canvas.style.cursor = hovering ? 'pointer' : 'grab';
        if (tap) handlers.onTap?.(event);
      }
      function leave() {
        if (!hovering) return;
        hovering = false;
        canvas.style.cursor = 'grab';
        handlers.onHover?.(null);
      }
      function wheel(event: WheelEvent) {
        event.preventDefault();
        const lines = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1;
        // Trackpad pinch arrives as ctrl+wheel with small deltas.
        zoomAt(Math.exp(-event.deltaY * lines * (event.ctrlKey ? 0.012 : 0.0018)), event.clientX, event.clientY);
      }
      canvas.addEventListener('pointerdown', down);
      canvas.addEventListener('pointermove', move);
      canvas.addEventListener('pointerleave', leave);
      canvas.addEventListener('pointercancel', up);
      canvas.addEventListener('wheel', wheel, { passive: false });
      window.addEventListener('pointerup', up);
      return () => {
        canvas.removeEventListener('pointerdown', down);
        canvas.removeEventListener('pointermove', move);
        canvas.removeEventListener('pointerleave', leave);
        canvas.removeEventListener('pointercancel', up);
        canvas.removeEventListener('wheel', wheel);
        window.removeEventListener('pointerup', up);
        changed = () => {};
        camera = null;
        canvasEl = null;
      };
    },
  };
  return orbit;
}
