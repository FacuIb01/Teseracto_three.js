import { createTesseract } from './tesseract.js';
const $ = id => document.getElementById(id);
function updatePlaying(playing) {
  $('play').setAttribute('aria-pressed', String(playing));
  $('play-label').textContent = playing ? 'Pausar rotación' : 'Activar rotación';
  $('play-icon').textContent = playing ? 'Ⅱ' : '▷';
  $('motion-state').textContent = playing && Number($('speed').value) > 0 ? 'EN MOVIMIENTO' : 'EN PAUSA';
}
try {
  const model = createTesseract($('model'), { enableZoom: true, onPlayingChange: updatePlaying });
  const inputs = [
    ['speed', value => model.setSpeed(value), value => `${value.toFixed(1)}×`],
    ['thickness', value => model.setThickness(value), value => `${value.toFixed(1)}×`],
    ['size', value => model.setSize(value / 100), value => `${value}%`]
  ];
  const refresh = (id, set, format) => {
    const input = $(id), value = Number(input.value);
    set(value); $(`${id}-value`).textContent = format(value);
    input.style.setProperty('--fill', `${100 * (value - Number(input.min)) / (Number(input.max) - Number(input.min))}%`);
    updatePlaying(model.playing);
  };
  inputs.forEach(args => { refresh(...args); $(args[0]).addEventListener('input', () => refresh(...args)); });
  $('play').addEventListener('click', () => { model.setPlaying(!model.playing); updatePlaying(model.playing); });
  $('reset').addEventListener('click', () => {
    $('speed').value = '0.6'; $('thickness').value = '1'; $('size').value = '100';
    inputs.forEach(args => refresh(...args)); model.reset();
  });
  $('theme').addEventListener('click', () => {
    const light = $('stage').classList.toggle('light');
    $('theme').setAttribute('aria-pressed', String(light));
    $('theme').innerHTML = `${light ? 'Fondo oscuro' : 'Fondo claro'} <span aria-hidden="true">↗</span>`;
  });
  updatePlaying(model.playing);
  window.addEventListener('pagehide', event => { if (!event.persisted) model.dispose(); });
} catch (error) {
  console.error(error);
  $('error').hidden = false;
  $('error').textContent = 'No se pudo iniciar la vista 3D. Probá habilitar la aceleración gráfica del navegador y recargar la página.';
  document.querySelectorAll('input, button').forEach(control => { control.disabled = true; });
}
