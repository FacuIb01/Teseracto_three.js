# Teseracto interactivo

Visor local en Three.js, inspirado en la referencia de barras gruesas turquesa, azul, hielo y marfil.

## Abrir

Requiere Node.js 22 o posterior. Ejecutar `npm install` la primera vez y `npm run dev`; abrir la dirección que aparece en la terminal (por defecto http://localhost:5173). Si el puerto está ocupado, el servidor prueba los siguientes automáticamente, hasta 20 alternativas. El servidor escucha solamente en este equipo. No abrir index.html con doble clic: los módulos necesitan HTTP.

Arrastrar gira la cámara; la rueda acerca y aleja. Las flechas permiten girar desde el teclado con el canvas enfocado. Los controles ajustan velocidad, grosor y tamaño; se puede pausar, restablecer y probar sobre fondo claro.

## Publicar en GitHub Pages

GitHub Pages sirve archivos estáticos y no ejecuta `server.mjs`. El archivo de desarrollo depende de `node_modules`, que no se incluye en Git. Usar `npm run build` genera `dist/` con HTML, CSS, módulos y las dependencias de Three.js incluidas. Todas las rutas son relativas para funcionar también bajo `/nombre-del-repositorio/`.

Para publicar desde GitHub:

1. Subir los archivos del proyecto, incluido `package-lock.json` y `.github/workflows/pages.yml`, a la rama predeterminada del repositorio.
2. En **Settings → Pages → Build and deployment → Source**, seleccionar **GitHub Actions**.
3. En **Actions → Publicar teseracto en GitHub Pages → Run workflow**, ejecutar la publicación sobre la rama deseada.
4. Abrir la URL que muestra el paso de despliegue al finalizar.

El workflow es manual. Para actualizar el sitio, subir los cambios y ejecutarlo otra vez. `dist/` se genera dentro del workflow y no se necesita subir al repositorio.

Para otro hosting estático, ejecutar `npm run build` y subir **el contenido de `dist/`** a la raíz del sitio. No publicar la carpeta del proyecto completa.

## Integración futura

`src/tesseract.js` exporta `createTesseract(element, options)`. Importa Three.js y OrbitControls; funciona con un bundler que resuelva el paquete `three`. `src/math4d.js` contiene la geometría y proyección, sin dependencia del visor.

```js
import { createTesseract } from './src/tesseract.js';
const tesseract = createTesseract(document.querySelector('.hero-model'), {
  speed: 0.6,
  thickness: 1,
  size: 1,
  enableZoom: false,
});
// Al desmontar el componente:
// tesseract.dispose();
```

Dar al contenedor ancho y alto explícitos, por ejemplo `width: min(100%, 420px); height: 380px`. El canvas es transparente y se adapta mediante ResizeObserver. El contenedor se puede trasladar por la página con CSS o una futura animación de scroll sin reconstruir el modelo. El visor actual no implementa aún ese recorrido por la landing.

API: `setSpeed(0…1.5)`, `setThickness(0.5…1.8)`, `setSize(0.65…1.2)`, `setPlaying(boolean)`, `reset()` (fase y cámara), `dispose()`, `playing`. El zoom está desactivado por defecto para respetar el scroll de la landing, y activado en este visor.

## Geometría y rendimiento

16 vértices en {−1,+1}⁴, 32 aristas entre vecinos que difieren en una coordenada. Rotaciones reales en XW, YW y ZW; proyección perspectiva 4D → 3D con distancia 4. Las barras son prismas de sección cuadrada. La referencia guía paleta, grosor y carácter; la silueta cambia con la rotación 4D.

Sin texturas, modelos descargados ni posprocesado. Geometrías y materiales compartidos. Resolución limitada a 1.75×. Se suspende el dibujo fuera del viewport o en pestañas ocultas; una escena pausada se vuelve a dibujar solo al interactuar. Respeta `prefers-reduced-motion`, con reproducción manual disponible. Incluye liberación de recursos al desmontar. Las fuentes del visor usan Google Fonts y tienen fallback local; el modelo funciona sin esas fuentes.

`npm test` valida topología, conservación de distancias en 4D, proyección y transformación real de geometría. Referencia de implementación: [documentación oficial de Three.js](https://threejs.org/docs/).
