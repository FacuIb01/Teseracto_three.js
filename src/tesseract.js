import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { edges, rotatedVertices, project4D } from './math4d.js';

/** Self-contained transparent renderer. Its host can be positioned anywhere in a page. */
export function createTesseract(container, options = {}) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const state = { speed: 0.6, thickness: 1, size: 1, playing: !reducedMotion.matches, phase: 0, ...options };
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.domElement.setAttribute('aria-label', 'Teseracto animado: arrastrá para girar la vista. También podés usar las flechas del teclado.');
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.tabIndex = 0;
  container.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  const initialCamera = new THREE.Vector3(5.9, 4.2, 6.9);
  camera.position.copy(initialCamera);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.minDistance = 6.8;
  controls.maxDistance = 17;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.5;
  // A landing's scroll remains available; zoom is opt-in for this preview.
  controls.enableZoom = options.enableZoom ?? false;
  controls.saveState();

  scene.add(new THREE.HemisphereLight(0xdcf9ff, 0x325665, 2.3));
  const key = new THREE.DirectionalLight(0xfff5dd, 3.4);
  key.position.set(4, 7, 6); scene.add(key);
  const fill = new THREE.DirectionalLight(0x83e8ff, 1.5);
  fill.position.set(-5, 0, 3); scene.add(fill);
  const rim = new THREE.DirectionalLight(0x7799ff, 2.6);
  rim.position.set(1, 2, -5); scene.add(rim);

  const palette = [0x009db3, 0x4569c4, 0xa1d7dc, 0xffedc7];
  const materials = palette.map(color => new THREE.MeshStandardMaterial({ color, metalness: 0.28, roughness: 0.32 }));
  // Square bars preserve the broad, flat faces of the supplied brand reference.
  const barGeometry = new THREE.BoxGeometry(1, 1, 1);
  const jointGeometry = new THREE.SphereGeometry(1, 8, 6);
  const model = new THREE.Group(); scene.add(model);
  const beams = edges.map(edge => {
    let materialIndex;
    if (edge.axis === 3) materialIndex = edge.a % 3 === 0 ? 3 : 2;
    else if (edge.a & 8) materialIndex = edge.axis === 1 ? 1 : 0;
    else materialIndex = edge.axis === 0 ? 3 : edge.axis === 1 ? 0 : 2;
    const mesh = new THREE.Mesh(barGeometry, materials[materialIndex]);
    model.add(mesh); return mesh;
  });
  const joints = Array.from({ length: 16 }, () => {
    const mesh = new THREE.Mesh(jointGeometry, materials[0]); model.add(mesh); return mesh;
  });
  const positions = Array.from({ length: 16 }, () => new THREE.Vector3());
  const up = new THREE.Vector3(0, 1, 0), direction = new THREE.Vector3();
  let visible = true, disposed = false, frame = 0, previous = 0;
  function updateModel() {
    rotatedVertices(state.phase).forEach((vertex, index) => positions[index].fromArray(project4D(vertex)));
    const width = 0.075 * state.thickness;
    edges.forEach((edge, index) => {
      const a = positions[edge.a], b = positions[edge.b], mesh = beams[index];
      direction.subVectors(b, a);
      mesh.position.copy(a).add(b).multiplyScalar(0.5);
      mesh.scale.set(width, direction.length(), width);
      mesh.quaternion.setFromUnitVectors(up, direction.normalize());
    });
    joints.forEach((joint, index) => { joint.position.copy(positions[index]); joint.scale.setScalar(width * 0.59); });
    model.scale.setScalar(state.size);
  }
  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height;
    // Preserve the same comfortable framing in narrow hero containers.
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(34 / 2)) / Math.min(1, camera.aspect)));
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    wake();
  }
  function draw(now) {
    frame = 0;
    if (disposed || !visible || document.hidden) { previous = 0; return; }
    const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
    previous = now;
    if (state.playing) state.phase += delta * state.speed * 0.28;
    updateModel();
    const movingCamera = controls.update();
    renderer.render(scene, camera);
    if ((state.playing && state.speed > 0) || movingCamera) {
      if (!frame) frame = requestAnimationFrame(draw);
    } else previous = 0;
  }
  function wake() { if (!frame && !disposed && visible && !document.hidden) frame = requestAnimationFrame(draw); }
  function visibilityChanged() { previous = 0; wake(); }
  function onKey(event) {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const spherical = new THREE.Spherical().setFromVector3(camera.position);
    if (event.key === 'ArrowLeft') spherical.theta -= 0.12;
    if (event.key === 'ArrowRight') spherical.theta += 0.12;
    if (event.key === 'ArrowUp') spherical.phi -= 0.12;
    if (event.key === 'ArrowDown') spherical.phi += 0.12;
    spherical.makeSafe(); camera.position.setFromSpherical(spherical); wake();
  }
  function contextLost(event) { event.preventDefault(); cancelAnimationFrame(frame); frame = 0; previous = 0; }
  function motionChanged(event) { if (event.matches) { state.playing = false; options.onPlayingChange?.(false); wake(); } }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(container);
  const intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; previous = 0; wake(); });
  intersectionObserver.observe(container);
  controls.addEventListener('change', wake);
  document.addEventListener('visibilitychange', visibilityChanged);
  renderer.domElement.addEventListener('keydown', onKey);
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  renderer.domElement.addEventListener('webglcontextrestored', wake);
  reducedMotion.addEventListener('change', motionChanged);
  resize();
  return {
    get playing() { return state.playing; },
    setSpeed(value) { state.speed = THREE.MathUtils.clamp(value, 0, 1.5); wake(); },
    setThickness(value) { state.thickness = THREE.MathUtils.clamp(value, 0.5, 1.8); wake(); },
    setSize(value) { state.size = THREE.MathUtils.clamp(value, 0.65, 1.2); wake(); },
    setPlaying(value) { state.playing = Boolean(value); previous = 0; wake(); },
    reset() { state.phase = 0; controls.reset(); wake(); },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); resizeObserver.disconnect(); intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', visibilityChanged);
      reducedMotion.removeEventListener('change', motionChanged);
      renderer.domElement.removeEventListener('keydown', onKey);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', wake);
      controls.removeEventListener('change', wake); controls.dispose();
      barGeometry.dispose(); jointGeometry.dispose(); materials.forEach(material => material.dispose());
      renderer.dispose(); renderer.domElement.remove();
    }
  };
}
