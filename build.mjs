import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

const root = import.meta.dirname;
const output = resolve(root, 'dist');
const files = [
  ['src/main.js', 'src/main.js'],
  ['src/style.css', 'src/style.css'],
  ['src/tesseract.js', 'src/tesseract.js'],
  ['src/math4d.js', 'src/math4d.js'],
  ['node_modules/three/build/three.module.min.js', 'vendor/three/three.module.min.js'],
  ['node_modules/three/build/three.core.min.js', 'vendor/three/three.core.min.js'],
  ['node_modules/three/examples/jsm/controls/OrbitControls.js', 'vendor/three/addons/controls/OrbitControls.js'],
  ['node_modules/three/LICENSE', 'vendor/three/LICENSE'],
];

let html = await readFile(resolve(root, 'index.html'), 'utf8');
const match = html.match(/<script type="importmap">([\s\S]*?)<\/script>/);
if (!match) throw new Error('Falta el importmap de Three.js en index.html.');
const imports = {
  three: './vendor/three/three.module.min.js',
  'three/addons/': './vendor/three/addons/',
};
html = html.replace(match[0], `<script type="importmap">${JSON.stringify({ imports })}</script>`);
if (html.includes('node_modules') || /(?:src|href)="\/(?!\/)/.test(html)) {
  throw new Error('El sitio contiene rutas incompatibles con GitHub Pages.');
}
for (const [source, destination] of files) {
  const target = resolve(output, destination);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve(root, source), target);
}
await writeFile(resolve(output, 'index.html'), html);
await writeFile(resolve(output, '.nojekyll'), '');
console.log('Sitio estático generado en dist/. Incluye Three.js y funciona bajo cualquier subcarpeta.');
