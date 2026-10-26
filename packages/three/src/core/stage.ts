/**
 * Render-on-demand stage: renderer, scene, orthographic camera, lights and ground shadow, plus the
 * lifecycle every GuateGeeks scene needs. Rules come from GuateGeeks/cotizador@673ee22:asesor/lab/campus-scene.js:
 * frames are requested only while something moves; 60 fps with a fine pointer at full quality, else 30;
 * sustained slow frames switch to eco quality once (no shadow map, pixel ratio 1); nothing renders while
 * the tab is hidden, the stage is off-screen, paused, disposed or the WebGL context is lost.
 * Colours and lights come from the theme's ThreeProfile.
 */
import {
  Color, DirectionalLight, HemisphereLight, Mesh, NeutralToneMapping, OrthographicCamera, PCFShadowMap, PlaneGeometry, Scene,
  ShadowMaterial, SRGBColorSpace, Vector3, WebGLRenderer, type Material,
} from 'three';
import type { ThreeProfile } from '@guategeeks/themes';

/** The renderer surface the stage uses (a WebGLRenderer, or a fake in tests). */
export interface RendererLike {
  domElement: HTMLCanvasElement;
  shadowMap: { enabled: boolean; type: number };
  outputColorSpace: string;
  toneMapping: number;
  toneMappingExposure: number;
  info: { render: { triangles: number; calls: number }; memory: { geometries: number } };
  setClearColor(color: string, alpha?: number): void;
  setPixelRatio(ratio: number): void;
  getPixelRatio(): number;
  setSize(width: number, height: number, updateStyle?: boolean): void;
  render(scene: Scene, camera: OrthographicCamera): void;
  dispose(): void;
}

export interface FrameTick {
  /** rAF timestamp (ms). */
  time: number;
  /** Seconds since the previous frame, clamped to [.001, .5]. */
  dt: number;
  /** Motion allowed: false when reduced motion or paused — settle and return false. */
  live: boolean;
}

export interface StageOptions {
  profile: ThreeProfile;
  reducedMotion?: boolean;
  shadows?: boolean;
  /** Keep the drawing buffer (screenshots via canvas.toDataURL). */
  preserveDrawingBuffer?: boolean;
  createRenderer?: () => RendererLike;
  onReady?(): void;
  onLost?(error?: unknown): void;
}

export interface StageDiagnostics {
  quality: 'full' | 'eco';
  frameInterval: number;
  maxFps: number;
  framePending: boolean;
  visible: boolean;
  contextLost: boolean;
  triangles: number;
  drawCalls: number;
  geometries: number;
}

export interface Stage {
  canvas: HTMLCanvasElement;
  renderer: RendererLike;
  scene: Scene;
  camera: OrthographicCamera;
  lights: { sky: HemisphereLight; sun: DirectionalLight; fill: DirectionalLight };
  ground: Mesh;
  readonly size: { w: number; h: number };
  readonly quality: 'full' | 'eco';
  readonly reducedMotion: boolean;
  readonly profile: ThreeProfile;
  /** Called every frame before rendering; return true while still active. */
  onFrame(cb: (tick: FrameTick) => boolean): () => void;
  onResize(cb: (size: { w: number; h: number }) => void): () => void;
  requestFrame(): void;
  setProfile(profile: ThreeProfile): void;
  setReducedMotion(value: boolean): void;
  setPaused(value: boolean): void;
  /** Fits the sun's shadow camera around `center` (world units). */
  setShadowBounds(center: Vector3, radius: number): void;
  resize(): void;
  getDiagnostics(): StageDiagnostics;
  dispose(): void;
}

const MAX_PIXEL_RATIO = 1.75;
const SLOW_FRAME_MS = 75;
const SLOW_FRAMES_TO_DEGRADE = 45;

export function createStage(container: HTMLElement, opts: StageOptions): Stage {
  const renderer: RendererLike = opts.createRenderer?.() ?? (new WebGLRenderer({ antialias: true, powerPreference: 'low-power', preserveDrawingBuffer: !!opts.preserveDrawingBuffer }) as unknown as RendererLike);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.shadowMap.enabled = opts.shadows !== false;
  renderer.shadowMap.type = PCFShadowMap;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.touchAction = 'pan-y';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  const scene = new Scene();
  const camera = new OrthographicCamera(-8, 8, 6, -6, 0.1, 80);
  const sky = new HemisphereLight();
  const sun = new DirectionalLight();
  sun.castShadow = opts.shadows !== false;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 4;
  const fill = new DirectionalLight();
  fill.position.set(8, 5, -9);
  scene.add(sky, sun, sun.target, fill);
  const groundMaterial = new ShadowMaterial();
  const groundGeometry = new PlaneGeometry(240, 240);
  const ground = new Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.552;
  ground.receiveShadow = true;
  scene.add(ground);

  let profile = opts.profile;
  let reduced = !!opts.reducedMotion;
  let paused = false;
  let disposed = false;
  let lost = false;
  let ready = false;
  let visible = true;
  let quality: 'full' | 'eco' = 'full';
  let pendingFrame = 0;
  let pendingTimer: ReturnType<typeof setTimeout> | 0 = 0;
  let lastTime = 0;
  let frameEma = 33;
  let slowFrames = 0;
  let size = { w: 800, h: 500 };
  const frameCallbacks = new Set<(tick: FrameTick) => boolean>();
  const resizeCallbacks = new Set<(s: { w: number; h: number }) => void>();
  const finePointer = typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches;
  const maxFps = () => (quality === 'full' && finePointer ? 60 : 30);
  const live = () => !reduced && !paused;
  const canRender = () => !disposed && !lost && visible && !(typeof document !== 'undefined' && document.hidden);

  function applyProfile(p: ThreeProfile) {
    profile = p;
    renderer.setClearColor(p.background, 1);
    scene.background = new Color(p.background);
    sky.color.set(p.sky);
    sky.groundColor.set(p.skyGround);
    sky.intensity = p.skyIntensity;
    sun.color.set(p.sun);
    sun.intensity = p.sunIntensity;
    fill.color.set(p.fill);
    fill.intensity = p.fillIntensity;
    groundMaterial.color.set(p.ground);
    groundMaterial.opacity = p.groundOpacity;
    renderer.toneMappingExposure = p.exposure;
  }
  applyProfile(profile);

  function cancelFrame() {
    if (pendingFrame) cancelAnimationFrame(pendingFrame);
    if (pendingTimer) clearTimeout(pendingTimer);
    pendingFrame = 0;
    pendingTimer = 0;
  }
  function schedule() {
    if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = 0; }
    if (canRender() && !pendingFrame) pendingFrame = requestAnimationFrame(frame);
  }
  function degrade() {
    if (quality === 'eco') return;
    quality = 'eco';
    renderer.shadowMap.enabled = false;
    scene.traverse((o) => {
      const material = (o as Mesh).material as Material | Material[] | undefined;
      for (const m of Array.isArray(material) ? material : material ? [material] : []) m.needsUpdate = true;
    });
    resize();
  }
  function frame(time: number) {
    pendingFrame = 0;
    if (!canRender()) return;
    const interval = lastTime ? time - lastTime : 33;
    const dt = lastTime ? Math.min(0.5, Math.max(0.001, interval / 1000)) : 0.033;
    lastTime = time;
    const isLive = live();
    if (isLive && interval < 400) {
      frameEma += (interval - frameEma) * 0.1;
      slowFrames = frameEma > SLOW_FRAME_MS ? slowFrames + 1 : Math.max(0, slowFrames - 2);
      if (slowFrames > SLOW_FRAMES_TO_DEGRADE) degrade();
    }
    let active = false;
    for (const cb of [...frameCallbacks]) if (cb({ time, dt, live: isLive })) active = true;
    try {
      renderer.render(scene, camera);
    } catch (error) {
      lost = true;
      opts.onLost?.(error);
      return;
    }
    if (!ready) { ready = true; opts.onReady?.(); }
    // Render on demand: keep going only while something moves, at most maxFps.
    if (isLive && active && canRender()) {
      const budget = 1000 / maxFps();
      pendingTimer = setTimeout(() => { pendingTimer = 0; schedule(); }, Math.max(0, budget - (performance.now() - time)));
    } else lastTime = 0;
  }

  function resize() {
    if (disposed || lost) return;
    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    size = { w: rect.width, h: rect.height };
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    renderer.setPixelRatio(quality === 'eco' ? 1 : Math.min(dpr, MAX_PIXEL_RATIO));
    renderer.setSize(rect.width, rect.height, false);
    // Smaller canvases do not need a 2K shadow map.
    const shadowSize = rect.width * Math.min(dpr, MAX_PIXEL_RATIO) > 900 ? 2048 : 1024;
    if (sun.shadow.mapSize.x !== shadowSize) {
      sun.shadow.mapSize.set(shadowSize, shadowSize);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
    }
    for (const cb of [...resizeCallbacks]) cb(size);
    schedule();
  }

  function onVisibility() {
    if (document.hidden) { cancelFrame(); lastTime = 0; } else { resize(); schedule(); }
  }
  function onContextLost(event: Event) {
    event.preventDefault();
    lost = true;
    ready = false;
    cancelFrame();
    opts.onLost?.();
  }
  function onContextRestored() {
    if (disposed) return;
    lost = false;
    ready = false;
    resize();
    schedule();
  }
  canvas.addEventListener('webglcontextlost', onContextLost, false);
  canvas.addEventListener('webglcontextrestored', onContextRestored, false);
  document.addEventListener('visibilitychange', onVisibility);
  const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => resize()) : null;
  resizeObserver?.observe(container);
  if (!resizeObserver) window.addEventListener('resize', resize);
  const intersectionObserver = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver((entries) => {
        visible = entries[0]?.isIntersecting ?? true;
        if (visible) { resize(); schedule(); } else { cancelFrame(); lastTime = 0; }
      }, { rootMargin: '80px' })
    : null;
  intersectionObserver?.observe(container);
  resize();

  return {
    canvas, renderer, scene, camera, lights: { sky, sun, fill }, ground,
    get size() { return size; },
    get quality() { return quality; },
    get reducedMotion() { return reduced; },
    get profile() { return profile; },
    onFrame(cb) { frameCallbacks.add(cb); schedule(); return () => frameCallbacks.delete(cb); },
    onResize(cb) { resizeCallbacks.add(cb); return () => resizeCallbacks.delete(cb); },
    requestFrame: schedule,
    setProfile(p) { applyProfile(p); schedule(); },
    setReducedMotion(value) { reduced = !!value; schedule(); },
    setPaused(value) { paused = !!value; schedule(); },
    setShadowBounds(center, radius) {
      sun.position.set(center.x - 3, 14, center.z + 4);
      sun.target.position.set(center.x, 0, center.z);
      Object.assign(sun.shadow.camera, { left: -radius, right: radius, top: radius, bottom: -radius, near: 1, far: 40 });
      sun.shadow.camera.updateProjectionMatrix();
    },
    resize,
    getDiagnostics() {
      return {
        quality, frameInterval: Math.round(frameEma), maxFps: maxFps(), framePending: !!pendingFrame || !!pendingTimer, visible,
        contextLost: lost, triangles: renderer.info.render.triangles, drawCalls: renderer.info.render.calls, geometries: renderer.info.memory.geometries,
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelFrame();
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', resize);
      frameCallbacks.clear();
      resizeCallbacks.clear();
      groundGeometry.dispose();
      groundMaterial.dispose();
      sun.shadow.map?.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
