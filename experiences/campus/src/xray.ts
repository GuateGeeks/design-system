// Ported from GuateGeeks/cotizador@673ee22:asesor/lab/campus-scene.js (x-ray section) (Apache-2.0 in this repo)
/**
 * X-ray of a focused classroom. Its roof, the floors above it, its own wall facing the camera and every tall
 * module between it and the camera are drawn as translucent card. Furniture and people of a classroom above
 * are hidden, so only its card shell remains as a veil; whole buildings between the camera and the classroom
 * are hidden. The index is reordered as [opaque | translucent | hidden]: the opaque mesh draws the first range
 * and a twin mesh (same attributes and skeleton, the glass material) the second, so no material or buffer is added.
 */
import { BufferGeometry, SkinnedMesh, type Group, type Material } from 'three';

const XRAY_TYPES = /^(room-|roof|columns|corridor|stairs|bridge|entrance|tree-)/;
const SHELL = /^\.(back|left|right|slab|rail|body|lid|posts)(\.|$)/;

export interface XrayRecord { group: Group }
export interface XrayState { key: string; parts: Array<{ mesh: any; ghost: SkinnedMesh | null; group: Group }> }

export const emptyXray = (): XrayState => ({ key: '', parts: [] });

/** Which modules veil or hide the room as seen from camera yaw `yaw`, and which of the room's own parts veil. */
export function xrayBlockers(plan, room, yaw: number): { modules: Map<string, 'veil' | 'hide'>; own: string[] } {
  const h = { x: Math.sin(yaw), z: Math.cos(yaw) }, modules = new Map<string, 'veil' | 'hide'>(), own: string[] = [];
  for (const m of plan.modules) {
    if (m === room || !XRAY_TYPES.test(m.type)) continue;
    const dx = m.x - room.x, dz = m.z - room.z;
    const above = Math.abs(dx) < 1.3 && Math.abs(dz) < 1.15 && m.y > room.y + .1;
    const along = dx * h.x + dz * h.z, lateral = Math.abs(dx * h.z - dz * h.x);
    const between = along > .6 && along < 4.5 && lateral < 2.2 && (m.y >= room.y - .1 || m.type.startsWith('tree-'));
    // Whole buildings in front would stack veils: they step aside; thin links stay as a veil.
    if (above) modules.set(m.key, 'veil');
    else if (between) modules.set(m.key, /^(room-|roof|columns)/.test(m.type) ? 'hide' : 'veil');
  }
  own.push('.slab', '.rail');
  if (h.x < -.25) own.push('.left');
  if (h.x > .25) own.push('.right');
  if (h.z < -.25) own.push('.back');
  return { modules, own: own.map(suffix => room.key + suffix) };
}

/** Undo an x-ray: full draw ranges back, twins removed (their shared buffers are detached before dispose). */
export function clearXray(state: XrayState, liveGroups: Group[]): XrayState {
  for (const part of state.parts) {
    // A released entity already disposed its meshes (and this twin with them).
    if (!liveGroups.includes(part.group)) continue;
    part.mesh.geometry.setDrawRange(0, Infinity);
    if (!part.ghost) continue;
    part.ghost.removeFromParent();
    for (const name of Object.keys(part.ghost.geometry.attributes)) part.ghost.geometry.deleteAttribute(name);
    part.ghost.geometry.setIndex(null);
    part.ghost.geometry.dispose();
  }
  return emptyXray();
}

/** Apply an x-ray of `room` to the live records. `key` identifies the view (room, yaw, entities). */
export function applyXray(plan, room, yaw: number, records: XrayRecord[], glass: Material, key: string): XrayState {
  const state: XrayState = { key, parts: [] };
  const { modules, own } = xrayBlockers(plan, room, yaw);
  const rooms = new Set(plan.modules.filter(m => m.type.startsWith('room-')).map(m => m.key));
  // 0 opaque, 1 translucent, 2 hidden
  const modeOf = (name: string) => {
    if (own.some(n => name === n || name.startsWith(n + '.'))) return 1;
    for (const [k, how] of modules) {
      if (name !== k && !name.startsWith(k + '.') && !name.startsWith(k + ':')) continue;
      if (how === 'hide') return 2;
      return name === k || !rooms.has(k) || SHELL.test(name.slice(k.length)) ? 1 : 2;
    }
    return 0;
  };
  for (const record of records) {
    const bones = record.group.userData.rig?.bones || [];
    const mode = bones.map(bone => modeOf(bone.name));
    if (!mode.some(Boolean)) continue;
    for (const mesh of record.group.children.filter((o: any) => o.isSkinnedMesh && o.name !== 'xray') as any[]) {
      const geometry = mesh.geometry, index = geometry.index, skin = geometry.getAttribute('skinIndex');
      // Glass, screens and contact shadows have no veil: they stay unless their part is hidden (blobs go with any veil).
      const card = mesh.name === 'solid' || mesh.name === 'soft';
      const lists: number[][] = [[], [], []];
      for (let i = 0; i < index.count; i += 3) {
        const m = mode[skin.getX(index.getX(i))];
        lists[card ? m : m === 2 || (m && mesh.name === 'blob') ? 2 : 0].push(index.getX(i), index.getX(i + 1), index.getX(i + 2));
      }
      const [keep, ghost, hidden] = lists;
      if (!ghost.length && !hidden.length) continue;
      index.array.set(keep.concat(ghost, hidden)); index.needsUpdate = true;
      geometry.setDrawRange(0, keep.length);
      if (!ghost.length) { state.parts.push({ mesh, ghost: null, group: record.group }); continue; }
      const twin = new BufferGeometry();
      for (const [name, attribute] of Object.entries(geometry.attributes)) twin.setAttribute(name, attribute as any);
      twin.setIndex(index); twin.setDrawRange(keep.length, ghost.length);
      const ghostMesh = new SkinnedMesh(twin, glass);
      ghostMesh.name = 'xray'; ghostMesh.frustumCulled = false; ghostMesh.renderOrder = 3;
      ghostMesh.bind(record.group.userData.skeleton, mesh.bindMatrix);
      record.group.add(ghostMesh);
      state.parts.push({ mesh, ghost: ghostMesh, group: record.group });
    }
  }
  return state;
}
