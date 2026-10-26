import { describe, expect, it } from 'vitest';
import { MeshStandardMaterial } from 'three';
import {
  applyAssembly, bindStaged, edgeTone, MAX_ASSEMBLY, newMeta, PAPER, paperMaterial, paperMaterials, planAssembly, Rig, stage, withPalette,
} from '@guategeeks/three';

const compiled = (material: MeshStandardMaterial) => {
  const shader = {
    vertexShader: '#include <skinbase_vertex>\n#include <skinnormal_vertex>\n#include <skinning_vertex>\n#include <project_vertex>',
    fragmentShader: '#include <color_fragment>',
  };
  material.onBeforeCompile(shader as never, undefined as never);
  return shader;
};

describe('paper materials', () => {
  it('paper material is matte cardstock', () => {
    const m = paperMaterial();
    expect(m.flatShading).toBe(true);
    expect(m.roughness).toBe(0.92);
    expect(m.metalness).toBe(0);
    expect(m.vertexColors).toBe(true);
  });

  it('paperMaterials honours fibre and mottle', () => {
    const plain = compiled(paperMaterials({ fibre: 0, mottle: 0 }).solid as MeshStandardMaterial);
    expect(plain.fragmentShader).toContain('#define PAPER_FIBRE 0.0000');
    expect(plain.fragmentShader).toContain('#define PAPER_MOTTLE 0.0000');
    const brand = compiled(paperMaterials().solid as MeshStandardMaterial);
    expect(brand.fragmentShader).toContain('#define PAPER_FIBRE 0.0450');
  });

  it('edgeTone mixes toward ivory', () => {
    expect(edgeTone('#000000', 1)).toBe('#fff8ec');
  });

  it('PAPER is a swappable palette', () => {
    const bg = PAPER.background;
    expect(withPalette({ background: '#000000' }, () => PAPER.background)).toBe('#000000');
    expect(PAPER.background).toBe(bg);
  });
});

/** As campus entities do before assembling: rest pose including scale (scene-entities.js:64). */
const snapshotRest = (rig: Rig) => rig.bones.forEach((bone) => {
  bone.userData.rest = { position: bone.position.clone(), quaternion: bone.quaternion.clone(), scale: bone.scale.clone() };
});

describe('staged assembly', () => {
  const build = () => {
    const rig = new Rig();
    const meta = newMeta();
    stage(meta, rig.add('room', 'root'), 0, 'rise');
    stage(meta, rig.add('room.roof', 'room', 0, 1, 0), 2, 'drop');
    stage(meta, rig.add('room.desk', 'room'), 4, 'pop');
    snapshotRest(rig);
    const staged = bindStaged(meta, rig);
    planAssembly(staged, { before: new Set(), pending: null, moduleKeys: new Set(['room']), moduleIndex: new Map([['room', 0]]), stagger: 0.1, now: 0, animate: true });
    return { rig, staged };
  };

  it('fresh parts start hidden and end at rest', () => {
    const { rig, staged } = build();
    expect(applyAssembly(staged, 0, false)).toBe(true);
    expect(rig.get('room.desk').scale.x).toBeLessThan(0.01);
    expect(applyAssembly(staged, MAX_ASSEMBLY, false)).toBe(false);
    expect(rig.get('room.roof').position.y).toBeCloseTo(1);
    expect(rig.get('room').scale.y).toBe(1);
    expect(staged.every((i) => i.done)).toBe(true);
  });

  it('settle jumps to the end', () => {
    const { rig, staged } = build();
    expect(applyAssembly(staged, 0, true)).toBe(false);
    expect(rig.get('room.desk').scale.x).toBe(1);
  });

  it('parts already built do not animate', () => {
    const rig = new Rig();
    const meta = newMeta();
    stage(meta, rig.add('room', 'root'), 0, 'rise');
    snapshotRest(rig);
    const staged = bindStaged(meta, rig);
    planAssembly(staged, { before: new Set(['room']), pending: null, moduleKeys: new Set(['room']), moduleIndex: new Map(), stagger: 0.1, now: 0, animate: true });
    expect(applyAssembly(staged, 0, false)).toBe(false);
  });
});
