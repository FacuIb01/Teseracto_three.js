import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vertices, edges, rotatedVertices, project4D } from '../src/math4d.js';
test('the hypercube has 16 unique vertices, 32 unique edges, and degree four', () => {
  assert.equal(new Set(vertices.map(JSON.stringify)).size, 16);
  assert.equal(edges.length, 32);
  assert.equal(new Set(edges.map(edge => `${edge.a}-${edge.b}`)).size, 32);
  vertices.forEach((_, index) => assert.equal(edges.filter(edge => edge.a === index || edge.b === index).length, 4));
});
test('4D rotation preserves distances and all edges through a full animation sample', () => {
  for (let phase = 0; phase < 40; phase += 0.13) {
    const points = rotatedVertices(phase);
    points.forEach(point => {
      assert.ok(Math.abs(Math.hypot(...point) - 2) < 1e-12);
      assert.ok(project4D(point).every(Number.isFinite));
    });
    edges.forEach(({ a, b }) => assert.ok(Math.abs(Math.hypot(...points[a].map((v, i) => v - points[b][i])) - 2) < 1e-12));
  }
});
test('the animation changes 3D geometry, beyond merely rotating the camera', () => {
  const lengths = phase => { const p = rotatedVertices(phase).map(v => project4D(v)); return edges.map(({a,b}) => Math.hypot(...p[a].map((v,i) => v-p[b][i]))); };
  assert.ok(lengths(0).some((length, i) => Math.abs(length - lengths(1)[i]) > 0.1));
  assert.throws(() => project4D(vertices[0], 2), RangeError);
});
