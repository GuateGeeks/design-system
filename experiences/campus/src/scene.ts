// Ported from GuateGeeks/cotizador@673ee22:asesor/lab/campus-scene.js (Apache-2.0 in this repo)
/**
 * Living papercraft campus. The scene is fed by the growth plan (plan.ts): its modules are grouped into a
 * few entities (entities.ts), each one a single skinned group built from the paper catalog. New pieces
 * assemble from their `stage` declarations, activities end at rest (activity.ts) and rendering is on demand.
 * Rendering, lifecycle and quality come from @guategeeks/three's stage; camera input from its orbit; colours
 * and paper grain from the theme's ThreeProfile. All GPU resources are disposed on replacement or dispose().
 */
import { BoxGeometry, DoubleSide, Mesh, MeshBasicMaterial, RingGeometry, Vector3, type Material } from 'three';
import type { ThreeProfile } from '@guategeeks/themes';
import {
  applyAssembly, backOut, bindStaged, clamp, createOrbit, createStage, lerp, paletteSignature, paperMaterials, pendingOf, pickAt,
  planAssembly, releaseEntityGroup, withPalette, type Stage, type StageOptions,
} from '@guategeeks/three';
import { createGeeky3D } from '@guategeeks/mascot';
import { LEVEL_NAMES, PROGRAM_NAMES } from './layout.ts';
import { planCampus } from './plan.ts';
import { buildEntityGroup, entitySignature, groupPlan, selectionOf } from './entities.ts';
import { RUN, tickActors, walkerWorld } from './activity.ts';
import { applyXray, clearXray, emptyXray } from './xray.ts';
import type { CampusData, CampusFocus } from './types.ts';

// Measured budget (cotizador docs/campus-3d.md): triangles include the shadow pass.
export const CAMPUS_BUDGET = Object.freeze({ triangles: 40000, drawCalls: 150, materials: 10 });
const DEFAULT_YAW = -.55, YAW_LIMIT = 1.35, PITCH = .6, DISTANCE = 30;
const PITCH_MIN = .2, PITCH_MAX = 1.15;
// Up close the camera frames roughly one student; zoom is multiplicative.
const ZOOM_MIN = .7, ZOOM_MAX = 9;
export const VIEW_NAMES = Object.freeze(['overview', 'front', 'patio', 'people', 'program'] as const);
export type CampusView = (typeof VIEW_NAMES)[number];

export interface Insets { top: number; right: number; bottom: number; left: number }

export interface CampusSceneOptions {
  profile: ThreeProfile;
  reducedMotion?: boolean;
  createRenderer?: StageOptions['createRenderer'];
  onReady?(): void;
  onLost?(error?: unknown): void;
  onSelect?(selection: { kind: 'level' | 'program'; id: string }): void;
}

export type CampusDiagnostics = Record<string, any> & {
  entityKeys: string[];
  entities: number;
  view: CampusView;
  framePending: boolean;
  transitionsActive: number;
  contextLost: boolean;
  materials: number;
  triangles: number;
  drawCalls: number;
  errors: string[];
  selectTargets: Array<{ kind: string; id: string; x: number; y: number }>;
  breakdown: Record<string, number>;
};

export interface CampusScene {
  update(data: Partial<CampusData>): void;
  resize(): void;
  rotate(delta: number): void;
  zoom(delta: number): void;
  resetView(): void;
  setPaused(value: boolean): void;
  setReducedMotion(value: boolean): void;
  setFocus(focus: CampusFocus): void;
  setInsets(insets: Partial<Insets>): void;
  setHoverVerb(verb: string): void;
  setView(name: CampusView): void;
  setProfile(profile: ThreeProfile): void;
  capture(options?: { width?: number; height?: number }): string | null;
  getDiagnostics(): CampusDiagnostics;
  getStage(): Stage;
  dispose(): void;
}

export function createCampusScene(container: HTMLElement, opts: CampusSceneOptions): CampusScene {
  let profile = opts.profile;
  let reduced = !!opts.reducedMotion;
  let disposed = false, lost = false, ready = false, paused = false;
  const stage = createStage(container, {
    profile, reducedMotion: reduced, createRenderer: opts.createRenderer,
    onReady: () => { ready = true; opts.onReady?.(); },
    onLost: (error) => { lost = true; ready = false; opts.onLost?.(error); },
  });
  const { scene, camera, canvas, renderer } = stage;
  canvas.classList.add('gg-campus-canvas');
  const tag = document.createElement('div');
  tag.className = 'gg-campus-tag'; tag.setAttribute('aria-hidden', 'true'); tag.hidden = true;
  container.appendChild(tag);

  let materials = paperMaterials({ fibre: profile.fibre, mottle: profile.mottle });
  let paletteSig = paletteSignature(profile.palette);
  const markerMaterial = new MeshBasicMaterial({ color: profile.marker, transparent: true, opacity: .85, side: DoubleSide, depthWrite: false, toneMapped: false });
  const hitMaterial = new MeshBasicMaterial({ visible: false });
  const hitGeometry = new BoxGeometry(1, 1, 1), markerGeometry = new RingGeometry(.92, 1, 40);
  const marker = new Mesh(markerGeometry, markerMaterial);
  marker.rotation.x = -Math.PI / 2; marker.visible = false; marker.renderOrder = 3;
  scene.add(marker);
  const geeky = createGeeky3D(materials, { reduced });
  scene.add(geeky.group);

  // ---- state
  const records = new Map<string, any>();
  let confirmed = planCampus({}), plan = confirmed, previewState = null, lastData: any = {}, world = walkerWorld(plan);
  let animationTime = 0, activityTicks = 0;
  // Activity runs: `run` counts them, `runStart` is when the current one began (animation clock).
  let run = 0, runStart = -1e9;
  let hovered = null;
  let insets: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
  let hoverVerb = 'Editar';
  let viewMode: CampusView = 'overview';
  let frameBox = null; // retained framing: kept while the campus fits
  let view = { x: 0, y: .6, z: 0, half: 4 }, targetView = { ...view };
  let focus: any = { kind: 'overview' }, lastCue = null, cueSequence = 0, configurationKey = '';
  let xray = emptyXray();
  let transitions = 0, transitionParts = {}, assemblyDeadline = 0;
  const orbit = createOrbit({
    yaw: DEFAULT_YAW, pitch: PITCH, yawLimit: YAW_LIMIT, pitchMin: PITCH_MIN, pitchMax: PITCH_MAX, zoomMin: ZOOM_MIN, zoomMax: ZOOM_MAX,
    panLimit: () => Math.max(plan.bounds.width, plan.bounds.depth) * .6,
  });
  const size = () => stage.size;
  const moving = () => !reduced && !paused;
  const runTime = () => moving() ? clamp(animationTime - runStart, 0, RUN) : RUN;
  const freeArea = () => ({ w: Math.max(size().w * .3, size().w - insets.left - insets.right), h: Math.max(size().h * .22, size().h - insets.top - insets.bottom) });
  const liveRecords = () => [...records.values()].filter(record => !record.removing);

  // ---------------------------------------------------------------- plan helpers
  const centerOf = p => ({ x: (p.bounds.x0 + p.bounds.x1) / 2, z: (p.bounds.z0 + p.bounds.z1) / 2 });
  const moduleFor = (p, select) => {
    if (!select) return null;
    const rooms = p.modules.filter(m => m.type.startsWith('room-'));
    if (select.kind === 'program') return rooms.find(m => m.programId === select.id) || p.modules.find(m => m.type === 'patio' && m.programId === select.id) || null;
    if (select.kind === 'level') return rooms.filter(m => m.levelId === select.id).sort((a, b) => a.y - b.y)[0] || null;
    return null;
  };
  const programLevels = id => {
    const eq = plan.normalized.equipment[id];
    return eq ? [...new Set(eq.groupIds.map(gid => plan.normalized.enrollment.find(row => row.id === gid)?.levelId).filter(Boolean))] : [];
  };

  // ---------------------------------------------------------------- camera
  function axes(y, p) {
    const right = new Vector3(Math.cos(y), 0, -Math.sin(y)), dir = new Vector3(Math.sin(y) * Math.cos(p), Math.sin(p), Math.cos(y) * Math.cos(p));
    return { right, up: new Vector3().crossVectors(dir, right).normalize() };
  }
  /** Largest screen offsets of the campus box around a centre, in world units. */
  function extent(p, center, y, pt) {
    const { right, up } = axes(y, pt), b = p.bounds, v = new Vector3();
    let sx = 0, sy = 0;
    for (const x of [b.x0, b.x1]) for (const h of [-.55, b.height]) for (const z of [b.z0, b.z1]) {
      v.set(x - center.x, h - center.y, z - center.z);
      sx = Math.max(sx, Math.abs(v.dot(right))); sy = Math.max(sy, Math.abs(v.dot(up)));
    }
    return { sx, sy };
  }
  function fitBox(p, y, pt, free) {
    const c = centerOf(p), center = { x: c.x, y: p.bounds.height * .3, z: c.z };
    const e = extent(p, center, y, pt);
    return { ...center, half: Math.max(e.sy, e.sx / (free.w / free.h)) * 1.05 };
  }
  function positionCamera(s = size(), at = { yaw: orbit.current.yaw, pitch: orbit.current.pitch, zoom: orbit.current.zoom, pan: orbit.current.pan }, inset = insets, v = view) {
    // Pixels per world unit come from the free area; the look-at point lands at its centre.
    const free = { w: Math.max(s.w * .3, s.w - inset.left - inset.right), h: Math.max(s.h * .22, s.h - inset.top - inset.bottom) };
    const ppu = (free.h / 2) / (v.half / at.zoom);
    const cx = (inset.left - inset.right) / 2, cy = (inset.bottom - inset.top) / 2;
    camera.left = (-s.w / 2 - cx) / ppu; camera.right = (s.w / 2 - cx) / ppu;
    camera.top = (s.h / 2 - cy) / ppu; camera.bottom = (-s.h / 2 - cy) / ppu;
    const cx0 = v.x + at.pan.x, cy0 = v.y + at.pan.y, cz0 = v.z + at.pan.z;
    camera.position.set(cx0 + Math.sin(at.yaw) * Math.cos(at.pitch) * DISTANCE, cy0 + Math.sin(at.pitch) * DISTANCE, cz0 + Math.cos(at.yaw) * Math.cos(at.pitch) * DISTANCE);
    camera.lookAt(cx0, cy0, cz0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }
  /** World-space focus for the camera, stable (not following moving things). */
  function focusSelect() {
    const programId = focus.programId || (focus.kind === 'program' ? focus.id : null);
    const levelId = focus.levelId || (focus.kind === 'level' ? focus.id : null);
    return programId && moduleFor(plan, { kind: 'program', id: programId }) ? { kind: 'program', id: programId }
      : levelId && moduleFor(plan, { kind: 'level', id: levelId }) ? { kind: 'level', id: levelId } : null;
  }
  function focusTarget() {
    const select = focusSelect() || (previewState?.active ? { kind: 'program', id: previewState.programId } : null);
    const m = moduleFor(plan, select);
    if (!m) return null;
    const patio = m.type === 'patio';
    return { x: m.x, y: m.y + (patio ? .45 : .85), z: m.z + (patio ? 0 : .3), base: m.y, half: patio ? 2.8 : 2.6, kind: select.kind, id: select.id, module: m, radius: patio ? 1.5 : 1.7 };
  }
  const explicit = () => ['explore', 'edit'].includes(focus.emphasis) || (!focus.emphasis && ['groups', 'sharing', 'stations', 'equipment', 'plan'].includes(focus.kind));
  /** Fixed framings for setView(); null = follow the camera rules below. */
  function viewTarget() {
    const c = centerOf(plan), b = plan.bounds;
    if (viewMode === 'patio') {
      const patio = plan.modules.find(m => m.type === 'patio');
      const at = patio ? { x: patio.x, z: patio.z } : { x: c.x, z: b.z1 - 3 };
      return { x: at.x, y: .5, z: at.z - .4, half: 3.1 };
    }
    if (viewMode === 'people') {
      // Low, close view of a table; a ground-floor room whose front is not hidden by a stair.
      const stairs = plan.modules.filter(m => m.type === 'stairs');
      const ground = plan.modules.filter(m => m.type.startsWith('room-') && (m.y || 0) < .5);
      const clear = ground.filter(m => stairs.every(st => Math.abs(st.x - m.x) > 2.2 || st.z + 1 < m.z));
      const room = [...(clear.length ? clear : ground)].sort((a, c2) => (c2.programId ? 1 : 0) - (a.programId ? 1 : 0))[0];
      return room ? { x: room.x - .35, y: .55, z: room.z + .05, half: 1.45 } : null;
    }
    if (viewMode === 'program') {
      const t = focusTarget();
      if (t) return { x: t.x, y: t.y, z: t.z, half: t.half };
      const room = plan.modules.find(m => m.type.startsWith('room-') && m.programId) || plan.modules.find(m => m.type.startsWith('room-'));
      return room ? { x: room.x, y: room.y + .85, z: room.z + .3, half: 2.6 } : null;
    }
    return null;
  }
  function applyView() {
    const free = freeArea(), fixed = viewTarget();
    if (fixed) { targetView = fixed; return; }
    // Keep the framing while the whole campus fits; widen it only to avoid clipping.
    const base = fitBox(plan, orbit.target.yaw, orbit.target.pitch, free);
    if (!frameBox) frameBox = base;
    else {
      const e = extent(plan, frameBox, orbit.target.yaw, orbit.target.pitch);
      if (e.sy > frameBox.half * .985 || e.sx > frameBox.half * (free.w / free.h) * .985) frameBox = { ...base };
    }
    const target = focusTarget();
    if (!target) { targetView = { ...frameBox }; return; }
    // Wizard context is a gentle emphasis; an explicit exploration frames the activity.
    const k = explicit() ? 1 : .2;
    targetView = { x: lerp(frameBox.x, target.x, k), y: lerp(frameBox.y, target.y, k), z: lerp(frameBox.z, target.z, k),
      half: explicit() ? lerp(frameBox.half, Math.min(frameBox.half, target.half), k) : frameBox.half * 1.03 };
  }
  /** Geeky steps out of close-up framings (people view, tight zoom) so it never covers the work. */
  const geekyHidden = () => viewMode === 'people' || view.half / orbit.current.zoom < 1.6;
  function lighting() {
    const c = centerOf(plan), b = plan.bounds, s = Math.max(b.width, b.depth) / 2 + 2.2;
    stage.setShadowBounds(new Vector3(c.x, 0, c.z), s);
  }

  // ---------------------------------------------------------------- activity
  /** Start an activity run unless one is still going (never interrupts or snaps). */
  function triggerActivity() {
    if (disposed || !moving()) return;
    if (runTime() >= RUN) { run++; runStart = animationTime; }
  }
  function tickAll() {
    const u = runTime(), drones = [];
    for (const record of records.values()) if (!record.removing && record.meta.actors) tickActors(record.meta.actors, run, u, world, drones);
  }

  // ---------------------------------------------------------------- entities
  function makeRecord(entity, previous, assembleOpts) {
    const built = withPalette(profile.palette, () => buildEntityGroup(entity, plan, materials));
    const { group } = built;
    group.userData.entityKey = entity.key;
    const staged = bindStaged(built.meta, built.rig);
    planAssembly(staged, { before: previous?.names, pending: previous ? pendingOf(previous.staged) : null, moduleKeys: entity.moduleKeys.size ? entity.moduleKeys : new Set([entity.key]), ...assembleOpts });
    const selects = [];
    for (const m of entity.modules) {
      const select = selectionOf(m);
      if (!select) continue;
      const proxy = new Mesh(hitGeometry, hitMaterial);
      proxy.position.set(m.x, m.y + .85, m.z); proxy.scale.set(2.5, 1.7, 2.2);
      proxy.userData.select = select;
      group.add(proxy);
      selects.push({ ...select, module: m, proxy });
    }
    return { entity, group, meta: built.meta, error: built.error, staged, names: new Set(built.rig.bones.map(bone => bone.name)),
      selects, people: built.rig.bones.filter(bone => bone.name.endsWith('.hips')).length, triangles: built.triangles, signature: '', removing: false, fade: 1 };
  }

  function update(data: Partial<CampusData> = {}) {
    if (disposed) return;
    lastData = data || {};
    const { preview, ...rest } = lastData;
    const before = new Set(confirmed.normalized.programs);
    confirmed = planCampus(rest);
    // Geeky celebrates a program that joins the proposal (never a preview, never on first load).
    if (ready && confirmed.normalized.programs.some(id => !before.has(id))) geeky.cue?.('celebrate');
    const programId = preview && typeof preview === 'object' ? preview.programId : null;
    const previewActive = !!programId && !confirmed.normalized.programs.includes(programId)
      && ['tale', 'master', 'spike', 'electronics', 'drones', 'immersive'].includes(programId);
    const confirmedKeys = new Set(confirmed.modules.map(m => m.key));
    plan = previewActive ? planCampus({ ...rest, programs: [...(rest.programs || []), programId] }) : confirmed;
    previewState = programId ? { programId, active: previewActive, keys: previewActive ? plan.modules.filter(m => !confirmedKeys.has(m.key)).map(m => m.key) : [] } : null;
    world = walkerWorld(plan);

    const groups = groupPlan(plan);
    const wanted = new Set(groups.map(group => group.key));
    for (const [key, record] of records) if (!wanted.has(key)) record.removing = true;
    // Fresh modules assemble in plan order, overlapping, never queued behind older work.
    const known = new Set(liveRecords().flatMap(record => [...record.entity.moduleKeys, record.entity.key]));
    const freshModules = groups.flatMap(group => (group.modules.length ? group.modules : [{ key: group.key, order: 0 }]).filter(m => !known.has(m.key)))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.key < b.key ? -1 : 1));
    const moduleIndex = new Map(freshModules.map((m, i) => [m.key, i]));
    const stagger = Math.min(.14, 1.6 / Math.max(1, freshModules.length));
    const animate = ready && moving();
    let changed = false;
    for (const group of groups) {
      const signature = entitySignature(group, plan, paletteSig);
      const previous = records.get(group.key);
      if (previous && previous.signature === signature && !previous.removing) { previous.entity = group; previous.selects.forEach(s => { s.module = group.modules.find(m => m.key === s.module.key) || s.module; }); continue; }
      const live = previous && !previous.removing ? previous : null;
      const record = makeRecord(group, live, { moduleIndex, stagger, now: animationTime, animate });
      if (record.error) console.error('campus entity', group.key, record.error);
      record.signature = signature;
      if (previous) releaseEntityGroup(previous.group);
      scene.add(record.group);
      records.set(group.key, record);
      changed = true;
      applyAssembly(record.staged, animationTime, !animate);
    }
    if (changed && animate) assemblyDeadline = performance.now() + 3500;
    lighting();
    const nextKey = JSON.stringify({ normalized: confirmed.normalized, activeConfig: lastData.activeConfig, preview: programId });
    if (nextKey !== configurationKey) {
      configurationKey = nextKey;
      const requested = lastData.activeConfig || (lastData.focusedProgram ? { kind: 'program', programId: lastData.focusedProgram } : lastData.focusedLevel ? { kind: 'level', levelId: lastData.focusedLevel } : focus);
      setFocus(requested, true);
    } else applyView();
    if (changed) triggerActivity();
    tickAll();
    if (!moving() || !canRender()) settle();
    stage.requestFrame();
  }

  // ---------------------------------------------------------------- overlays
  function updateMarker(time) {
    const target = focusTarget();
    marker.visible = !!target && (explicit() || !!previewState?.active && target.id === previewState.programId);
    if (!marker.visible) return;
    const isPreview = previewState?.active && target.id === previewState.programId && !focusSelect();
    markerMaterial.color.set(isPreview ? profile.preview : profile.marker);
    marker.position.set(target.module.x, target.base + .03 + (target.module.type === 'patio' ? 0 : .12), target.module.z);
    marker.scale.setScalar(target.radius * (moving() ? 1 + Math.sin(time * 3) * .015 : 1));
  }
  function updateTag() {
    // Hover wins: it previews what a click will open for editing.
    const target = hovered ? { kind: hovered.kind, id: hovered.id, hover: true } : focusTarget();
    const m = target && moduleFor(plan, target);
    if (!m || !ready) { tag.hidden = true; return; }
    const name = target.kind === 'program' ? PROGRAM_NAMES[target.id] : LEVEL_NAMES[target.id];
    const levels = target.kind === 'program' ? programLevels(target.id) : [];
    const isPreview = target.kind === 'program' && previewState?.active && previewState.programId === target.id;
    const text = (isPreview ? 'Vista previa · ' : '') + name + (levels.length ? ' · ' + levels.map(id => LEVEL_NAMES[id as string]).join(', ') : '');
    const label = (target as any).hover ? name + ' · ' + hoverVerb : text;
    if (tag.textContent !== label || tag.hidden) { tag.textContent = label; tag.hidden = false; tag.dataset.width = String(tag.offsetWidth); }
    const point = new Vector3(m.x, m.y + (m.type === 'patio' ? 1.3 : 2.05), m.z).project(camera);
    const width = container.clientWidth, height = container.clientHeight;
    const half = Math.min(width / 2 - 8, (Number(tag.dataset.width) || 120) / 2 + 8);
    const x = clamp((point.x * .5 + .5) * width, insets.left + half, width - insets.right - half);
    const y = clamp((.5 - point.y * .5) * height, insets.top + 34, Math.max(insets.top + 34, height - insets.bottom - 8));
    tag.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -100%)`;
    tag.hidden = false;
  }
  /** Top of the roof over the stack at (x, z), or of the ground when nothing is built there. */
  const ROOF_H = .42;
  const roofTop = (x, z) => Math.max(0, ...plan.modules.filter(m => m.type === 'roof' && Math.abs(m.x - x) < 1.3 && Math.abs(m.z - z) < 1.15).map(m => m.y + ROOF_H));
  function geekyGoal() {
    const c = centerOf(plan), target = focusTarget(), yaw = orbit.current.yaw;
    const away = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    if (target && explicit()) {
      // Above the roof of the focused activity, nudged away from the camera: never in front of a balcony or the stairs.
      const top = roofTop(target.x, target.z) || target.y + 1.3, right = { x: Math.cos(yaw), z: -Math.sin(yaw) };
      return { goal: { x: target.x + right.x * 1.1 + away.x * .5, y: top + .35, z: target.z + right.z * 1.1 + away.z * .5 }, look: [target.x, target.y, target.z] as [number, number, number], perched: false, celebrate: false, ground: top };
    }
    // At rest Geeky perches on the roof of the outermost wing (left of the camera), clear of the stairs and galleries.
    const roofs = plan.modules.filter(m => m.type === 'roof').sort((a, b) => a.x - b.x || b.z - a.z);
    const perch = roofs[0] ? [roofs[0].x, roofs[0].y + ROOF_H, roofs[0].z] : [c.x - 2, 0, c.z];
    const look = (target ? [target.x, target.y, target.z] : [c.x, .5, c.z + 1]) as [number, number, number];
    return { goal: { x: perch[0], y: perch[1] + .55, z: perch[2] }, look, perched: true, celebrate: false, ground: perch[1] };
  }

  // ---------------------------------------------------------------- x-ray of a focused classroom
  function xrayRoom() {
    const target = focusTarget();
    if (target && explicit() && target.module.type.startsWith('room-')) return target.module;
    if (viewMode !== 'people' && view.half / orbit.current.zoom >= 2) return null;
    const pan = orbit.current.pan;
    const at = { x: view.x + pan.x, y: view.y + pan.y, z: view.z + pan.z };
    const score = m => Math.hypot(m.x - at.x, m.z + .3 - at.z) + Math.abs(m.y + .85 - at.y) * .8;
    const room = plan.modules.filter(m => m.type.startsWith('room-')).sort((a, b) => score(a) - score(b))[0];
    return room && score(room) < 2.5 ? room : null;
  }
  function updateXray() {
    const room = xrayRoom();
    const key = room ? [room.key, Math.round(orbit.current.yaw * 4), ...liveRecords().map(record => record.group.id)].join(':') : '';
    if (key === xray.key) return;
    xray = clearXray(xray, [...records.values()].map(r => r.group));
    if (room) xray = applyXray(plan, room, orbit.current.yaw, liveRecords(), materials.glass, key);
  }

  // ---------------------------------------------------------------- loop
  const canRender = () => !disposed && !lost && stage.getDiagnostics().visible && !document.hidden;
  function settle() {
    for (const [key, record] of records) {
      if (record.removing) { releaseEntityGroup(record.group); records.delete(key); continue; }
      applyAssembly(record.staged, animationTime, true);
    }
    orbit.settle();
    view = { ...targetView };
    tickAll();
    const g = geekyGoal();
    geeky.tick(animationTime, 0, { ...g, cameraYaw: orbit.current.yaw, moving: false });
    geeky.group.visible = !geekyHidden();
  }
  stage.onFrame(({ dt, live }) => {
    let active = 0;
    const parts: Record<string, number> = {};
    let geekyBusy = false;
    if (live) { animationTime += dt; activityTicks++; }
    if (!live) settle();
    else {
      const rate = 1 - Math.exp(-dt * 6);
      for (const [key, record] of records) {
        if (record.removing) {
          record.fade = Math.max(0, (record.fade ?? 1) - dt * 3.5);
          record.group.scale.y = Math.max(.001, backOut(record.fade) * record.fade);
          if (record.fade === 0) { releaseEntityGroup(record.group); records.delete(key); } else active++;
          continue;
        }
        // A slow device never hangs mid-assembly: past the deadline the final state is shown.
        if (applyAssembly(record.staged, animationTime, performance.now() > assemblyDeadline)) { active++; parts['build:' + key] = 1; }
      }
      if (orbit.step(dt)) { active++; parts.camera = 1; }
      for (const key of Object.keys(view)) {
        view[key] += (targetView[key] - view[key]) * rate;
        if (Math.abs(targetView[key] - view[key]) < .002) view[key] = targetView[key]; else { active++; parts['view:' + key] = 1; }
      }
      tickAll();
      const g = geekyGoal();
      geeky.tick(animationTime, Math.min(dt, .1), { ...g, cameraYaw: orbit.current.yaw, moving: true }); // slow devices: travel keeps its pace
      geeky.group.visible = !geekyHidden();
      // Geeky's travel is a transition; its gaze, blinks and gestures only keep frames coming.
      if (!geeky.settled) { if (geeky.state.gliding) { active++; parts.geeky = 1; } else geekyBusy = true; }
    }
    transitions = active; transitionParts = parts;
    updateMarker(animationTime);
    positionCamera();
    updateXray();
    updateTag();
    // Render on demand: keep going only while something is still moving.
    // Activities keep frames coming but are not 'transitions': those settle quickly and report 0.
    const running = live && runTime() < RUN;
    return live && (active > 0 || running || geekyBusy);
  });

  // ---------------------------------------------------------------- focus, views & selection
  function setFocus(next: any = {}, keepView = false) {
    if (disposed) return;
    focus = typeof next === 'object' && next ? { ...next, kind: next.kind || 'overview' } : { kind: 'overview' };
    if (!keepView && (['explore', 'edit'].includes(focus.emphasis) || focus.kind === 'overview')) viewMode = 'overview';
    if (viewMode === 'overview' && (['explore', 'edit'].includes(focus.emphasis) || focus.kind === 'overview')) orbit.target.pan.set(0, 0, 0);
    lastCue = { kind: focus.kind, type: focus.kind, id: focus.programId || focus.levelId || focus.id || null, at: ++cueSequence };
    applyView();
    triggerActivity();
    if (!moving()) settle();
    stage.requestFrame();
  }
  /** Named framings: overview, front, patio, people, program (the active focus). Bounded, always above the ground. */
  function setView(name: CampusView) {
    if (disposed || !VIEW_NAMES.includes(name)) return;
    viewMode = name;
    frameBox = name === 'overview' ? null : frameBox;
    const angles = { overview: [DEFAULT_YAW, PITCH], front: [0, .38], patio: [-.3, .52], people: [-.4, .22], program: [DEFAULT_YAW, .5] }[name];
    if (name === 'overview') focus = { kind: 'overview' };
    orbit.set({ yaw: angles[0], pitch: clamp(angles[1], PITCH_MIN, PITCH_MAX), zoom: 1, pan: new Vector3() });
  }
  function selectTargets() {
    scene.updateMatrixWorld(true); camera.updateMatrixWorld();
    const rect = canvas.getBoundingClientRect(), out = [], proxies = [];
    for (const record of liveRecords()) for (const select of record.selects) proxies.push(select.proxy);
    for (const record of liveRecords()) {
      for (const select of record.selects) {
        const point = visiblePoint(select, proxies, rect);
        out.push({ kind: select.kind, id: select.id, x: rect.left + (point.x * .5 + .5) * rect.width, y: rect.top + (.5 - point.y * .5) * rect.height });
      }
    }
    return out;
  }
  /** A screen point that really lands on this room's proxy (stacked rooms occlude each other). */
  function visiblePoint(select, proxies, rect) {
    const m = select.module, patio = m.type === 'patio', probe = new Vector3();
    const offsets = patio ? [[0, .45, 0]] : [[0, .75, .35], [-.5, .75, .35], [.5, .75, .35], [0, .5, .6], [0, 1.1, .2], [-.6, .5, .3], [.6, .5, .3], [0, .75, -.2], [0, .3, .5], [0, 1.3, 0],
      ...[1.45, .15, -.15].flatMap(dy => [-1, -.55, .55, 1, 0].flatMap(dx => [.8, 0, -.8].map(dz => [dx, dy + .1, dz]))), ...[1.5, 1.2].flatMap(dy => [-1, 0, 1].map(dx => [dx, dy, .9]))];
    let fallback = null;
    for (const [dx, dy, dz] of offsets) {
      probe.set(m.x + dx, m.y + dy, m.z + dz).project(camera);
      if (Math.abs(probe.x) > 1 || Math.abs(probe.y) > 1) { fallback ||= { x: probe.x, y: probe.y }; continue; }
      const clientX = rect.left + (probe.x * .5 + .5) * rect.width, clientY = rect.top + (.5 - probe.y * .5) * rect.height;
      if (pickAt({ clientX, clientY }, canvas, camera, proxies) === select.proxy) return { x: probe.x, y: probe.y };
      fallback ||= { x: probe.x, y: probe.y };
    }
    return fallback;
  }
  function pickSelect(event) {
    const proxies = [];
    for (const record of liveRecords()) record.group.children.forEach(child => { if (child.userData.select) proxies.push(child); });
    // The nearest surface wins: whatever the visitor actually sees under the pointer.
    return pickAt(event, canvas, camera, proxies)?.userData.select || null;
  }
  function selectAt(event) {
    // What is under the pointer wins; a small allowance helps imprecise taps.
    const near = selectTargets().filter(target => target.kind === 'program')
      .map(target => ({ ...target, distance: Math.hypot(target.x - event.clientX, target.y - event.clientY) }))
      .filter(target => target.distance < 25).sort((a, b) => a.distance - b.distance)[0];
    const selected = pickSelect(event) || (near ? { kind: near.kind, id: near.id } : null);
    if (selected) { setFocus({ kind: selected.kind, id: selected.id, emphasis: 'explore' }); opts.onSelect?.({ ...selected }); }
  }
  const detachOrbit = orbit.attach(canvas, camera, {
    onChange() { applyView(); if (!moving()) settle(); stage.requestFrame(); },
    onTap: event => selectAt(event),
    onHover(event) {
      const select = event ? pickSelect(event) : null;
      const next = select ? { kind: select.kind, id: select.id } : null;
      if ((next?.kind + next?.id) !== (hovered?.kind + hovered?.id)) { hovered = next; stage.requestFrame(); }
      return !!next;
    },
  });
  stage.onResize(previous => {
    if (frameBox && previous) frameBox = null; // a new viewport frames the campus afresh
    applyView();
    if (!moving()) view = { ...targetView };
    positionCamera();
  });

  // ---------------------------------------------------------------- capture
  /** JPEG of the confirmed campus in the overview, for a proposal. Works while paused or hidden. */
  function capture({ width = 1200, height = 800 } = {}) {
    if (disposed || lost) return null;
    width = Math.round(clamp(Number(width) || 1200, 64, 4096)); height = Math.round(clamp(Number(height) || 800, 64, 4096));
    settle();
    const savedPlan = plan, ratio = renderer.getPixelRatio();
    // Preview modules are not part of the confirmed state: hide them for this frame only.
    const hidden = [];
    if (previewState?.active) for (const key of previewState.keys) for (const record of records.values()) {
      const bone = record.group.userData.rig?.get(key);
      if (bone) { hidden.push([bone, bone.scale.clone()]); bone.scale.setScalar(.001); }
    }
    const was = { marker: marker.visible, geeky: geeky.group.visible };
    marker.visible = false; geeky.group.visible = false;
    xray = clearXray(xray, [...records.values()].map(r => r.group)); // the figure shows the whole campus
    plan = confirmed;
    const framing = fitBox(confirmed, DEFAULT_YAW, PITCH, { w: width, h: height });
    let url = null;
    try {
      renderer.setPixelRatio(1); renderer.setSize(width, height, false);
      positionCamera({ w: width, h: height }, { yaw: DEFAULT_YAW, pitch: PITCH, zoom: 1, pan: new Vector3() }, { top: 0, right: 0, bottom: 0, left: 0 }, framing);
      renderer.render(scene, camera);
      url = canvas.toDataURL('image/jpeg', .9);
    } catch { url = null; }
    plan = savedPlan;
    hidden.forEach(([bone, scale]) => bone.scale.copy(scale));
    marker.visible = was.marker; geeky.group.visible = was.geeky;
    renderer.setPixelRatio(ratio);
    stage.resize();
    return url;
  }

  // ---------------------------------------------------------------- theme
  function setProfile(next: ThreeProfile) {
    if (disposed) return;
    const old = materials;
    profile = next;
    stage.setProfile(next);
    markerMaterial.color.set(next.marker);
    paletteSig = paletteSignature(next.palette);
    materials = paperMaterials({ fibre: next.fibre, mottle: next.mottle });
    xray = clearXray(xray, [...records.values()].map(r => r.group));
    // Rebuild every entity with the new palette and materials (signatures include the palette), then free the old set.
    for (const record of records.values()) record.signature = '';
    const ready0 = ready;
    ready = false; // a theme change does not replay the construction
    update(lastData);
    ready = ready0;
    new Set(Object.values(old)).forEach((material: Material) => { if (!Object.values(materials).includes(material as never)) material.dispose(); });
  }

  update({});
  stage.resize();

  return {
    update,
    resize: () => stage.resize(),
    rotate: delta => orbit.rotate(delta),
    zoom: delta => orbit.zoom(delta),
    resetView() { orbit.reset(); viewMode = 'overview'; frameBox = null; setFocus({ kind: 'overview' }); },
    setPaused(value) { paused = !!value; stage.setPaused(paused); if (paused) settle(); },
    setReducedMotion(value) { reduced = !!value; stage.setReducedMotion(reduced); if (reduced) settle(); },
    setFocus: next => setFocus(next),
    setInsets(next = {}) {
      if (disposed) return;
      const clean = Object.fromEntries(['top', 'right', 'bottom', 'left'].map(key => [key, Math.max(0, Math.round(Number(next[key]) || 0))])) as unknown as Insets;
      if ((['top', 'right', 'bottom', 'left'] as const).every(key => clean[key] === insets[key])) return;
      insets = clean; frameBox = null;
      applyView();
      if (!moving()) view = { ...targetView };
      positionCamera();
      stage.requestFrame();
    },
    setHoverVerb(verb) { hoverVerb = String(verb || 'Editar').slice(0, 24); },
    setView,
    setProfile,
    capture,
    getStage: () => stage,
    getDiagnostics() {
      const list = liveRecords();
      const building = list.filter(record => record.staged.some(item => item.fresh && !item.done)).length;
      const uniqueMaterials = new Set([...Object.values(materials), markerMaterial, hitMaterial, ...(geeky.ownMaterials?.() || [])]).size + 1; // + the stage's ground shadow
      const stats = confirmed.stats, services = confirmed.services, s = stage.getDiagnostics();
      const sum = record => record.group.children.reduce((n, mesh) => n + (mesh.isMesh && mesh.name !== 'xray' && mesh.geometry.attributes.position ? (mesh.geometry.index ? mesh.geometry.index.count : mesh.geometry.attributes.position.count) / 3 * (mesh.castShadow ? 2 : 1) : 0), 0);
      return {
        levels: confirmed.normalized.levels.length, programs: confirmed.normalized.programs.length, students: confirmed.normalized.students,
        rooms: stats.rooms, workshops: stats.projectRooms + (confirmed.modules.some(m => m.type === 'patio') ? 1 : 0), people: stats.people,
        equipmentUnits: (Object.values(confirmed.normalized.equipment) as any[]).reduce((n, e) => n + e.units, 0), modules: confirmed.modules.length, plan: { ...stats, services: { ...services } },
        preview: previewState ? { programId: previewState.programId, active: previewState.active, modules: previewState.keys.length } : null,
        services: list.flatMap(record => (record.meta.actors?.rooms || []).filter(room => room.service).map(room => ({ kind: room.service.kind, room: room.key, programId: room.programId, levelId: room.levelId }))),
        view: viewMode, actorCount: list.length, animatedPeople: list.reduce((n, record) => n + record.people, 0),
        activityTicks, animationTime, activityRun: run, activityTime: runTime(), reactionCount: cueSequence, actorTransitions: reduced || paused ? 0 : building,
        entities: records.size, entityKeys: list.map(record => record.entity.key), materials: uniqueMaterials, geometries: s.geometries,
        triangles: s.triangles, drawCalls: s.drawCalls,
        framePending: s.framePending, paused, visible: s.visible, contextLost: s.contextLost || lost,
        focus: { ...focus }, focusedProgram: focus.programId || (focus.kind === 'program' ? focus.id : null), lastCue,
        transitionsActive: reduced || paused ? 0 : transitions + (records.size !== list.length ? 1 : 0),
        breakdown: list.reduce((acc, record) => { const k = record.entity.kind; acc[k] = (acc[k] || 0) + sum(record); return acc; }, {}),
        errors: list.filter(record => record.error).map(record => record.entity.key),
        transitionParts: { ...transitionParts },
        selectTargets: selectTargets(), geeky: { ...geeky.state.p, settled: geeky.settled },
        xray: xray.key ? { room: xray.key.split(':').slice(0, -1 - list.length).join(':'), meshes: xray.parts.length } : null,
        quality: s.quality, frameInterval: s.frameInterval, yaw: orbit.current.yaw, pitch: orbit.current.pitch, zoom: orbit.current.zoom,
        framing: { half: view.half, target: { ...targetView }, size: { ...size() }, insets: { ...insets } }, camera: 'orthographic', maxFps: s.maxFps, limits: CAMPUS_BUDGET,
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      detachOrbit();
      xray = clearXray(xray, [...records.values()].map(r => r.group));
      for (const record of records.values()) releaseEntityGroup(record.group);
      records.clear(); releaseEntityGroup(geeky.group);
      [hitGeometry, markerGeometry].forEach(geometry => geometry.dispose());
      new Set([...Object.values(materials), markerMaterial, hitMaterial]).forEach((material: Material) => material.dispose());
      stage.dispose(); tag.remove();
    },
  };
}
