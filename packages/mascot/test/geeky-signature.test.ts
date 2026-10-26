import { describe, expect, it } from 'vitest';
import { Box3, Color, LinearSRGBColorSpace, Vector3, type BufferAttribute, type Mesh } from 'three';
import { createGeekyModel } from '@guategeeks/geeky/model';
import { GEEKY_THREE } from '../src/three-namespace.ts';

/**
 * What Geeky looks like, as data: no e2e screenshot renders Geeky, so this file snapshot is how a
 * geeky-animation update shows a visible change (shape, motion or colour) in its pull request.
 * update-geeky.yml rewrites it with `-u` and flags the PR when it changed; anywhere else a change fails.
 */
const SAMPLES: [action: string, frames: number[]][] = [['idle', [0, 45]], ['greet', [20, 40]], ['celebrate', [15, 45]], ['tech-deploy', [30]]];
const round = (v: number) => Math.round(v * 100) / 100;
// Vertex colours are stored linear; report them as the sRGB hex a designer would recognise.
const hex = (a: BufferAttribute) => '#' + new Color().setRGB(a.getX(0), a.getY(0), a.getZ(0), LinearSRGBColorSpace).getHexString();

function pose(action: string, frames: number[], reduced: boolean) {
  const geeky = createGeekyModel({ THREE: GEEKY_THREE, reduced });
  geeky.brain.play(action);
  const out: Record<string, unknown> = {};
  let frame = 0;
  for (const target of frames) {
    for (; frame < target; frame++) geeky.step(1 / 30);
    geeky.step(0);
    geeky.group.updateMatrixWorld(true);
    let meshes = 0, vertices = 0;
    const colours = new Set<string>(), box = new Box3();
    geeky.group.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh || !mesh.visible) return;
      meshes++;
      vertices += mesh.geometry.attributes.position.count;
      const colour = mesh.geometry.getAttribute('color') as BufferAttribute | undefined;
      if (colour) colours.add(hex(colour));
      box.expandByObject(mesh);
    });
    const size = box.getSize(new Vector3()), centre = box.getCenter(new Vector3());
    out[`frame ${target}`] = { meshes, vertices, colours: [...colours].sort(), size: size.toArray().map(round), centre: centre.toArray().map(round) };
  }
  geeky.dispose();
  return out;
}

describe('Geeky signature', () => {
  it('sampled poses match the pinned geeky-animation release', async () => {
    const signature = {
      reduced: pose('idle', [0], true),
      ...Object.fromEntries(SAMPLES.map(([action, frames]) => [action, pose(action, frames, false)])),
    };
    await expect(JSON.stringify(signature, null, 2) + '\n').toMatchFileSnapshot('./__snapshots__/geeky-signature.json');
  });
});
