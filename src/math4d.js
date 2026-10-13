export const vertices = Array.from({ length: 16 }, (_, index) =>
  Array.from({ length: 4 }, (_, axis) => (index & (1 << axis)) ? 1 : -1));

export const edges = vertices.flatMap((_, index) =>
  Array.from({ length: 4 }, (_, axis) => ({ a: index, b: index ^ (1 << axis), axis }))
    .filter(edge => edge.a < edge.b));

export function rotatePlane(point, a, b, angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  const x = point[a], y = point[b];
  point[a] = c * x - s * y;
  point[b] = s * x + c * y;
  return point;
}

export function rotatedVertices(phase = 0) {
  return vertices.map(vertex => {
    const point = [...vertex];
    rotatePlane(point, 0, 3, 0.38 + phase);
    rotatePlane(point, 1, 3, -0.24 + phase * 0.61);
    rotatePlane(point, 2, 3, 0.16 + phase * 0.37);
    return point;
  });
}

export function project4D(point, distance = 4) {
  if (distance <= 2) throw new RangeError('Projection distance must exceed the 4D radius (2).');
  const factor = distance / (distance - point[3]);
  return point.slice(0, 3).map(value => value * factor);
}
