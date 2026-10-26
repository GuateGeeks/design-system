import { Raycaster, Vector2, type Camera, type Object3D } from 'three';

const raycaster = new Raycaster();
const ndc = new Vector2();

/** The nearest of `targets` under a pointer position, or null. */
export function pickAt(event: { clientX: number; clientY: number }, canvas: HTMLCanvasElement, camera: Camera, targets: Object3D[]): Object3D | null {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.intersectObjects(targets, false)[0]?.object ?? null;
}
