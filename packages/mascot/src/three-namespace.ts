/**
 * The three.js members Geeky's model needs (MODEL_THREE_KEYS of @guategeeks/geeky/model), passed instead of
 * the whole namespace so the bundle keeps only what is used. test/upstream.test.ts checks it stays complete.
 */
import {
  Color, CylinderGeometry, DoubleSide, ExtrudeGeometry, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial,
  MeshStandardMaterial, Path, Plane, Shape, ShapeUtils, SphereGeometry, TorusGeometry, Vector3,
} from 'three';
import type { GeekyModelThree } from '@guategeeks/geeky/model';

export const GEEKY_THREE: GeekyModelThree = Object.freeze({
  Color, CylinderGeometry, DoubleSide, ExtrudeGeometry, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial,
  MeshStandardMaterial, Path, Plane, Shape, ShapeUtils, SphereGeometry, TorusGeometry, Vector3,
});
