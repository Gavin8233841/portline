import { layerOf, linksInLayer } from './layers.mjs';

const map = document.querySelector('#map');
const stats = document.querySelector('#stats');
const paths = document.querySelector('#paths');
const layers = [...document.querySelectorAll('[data-layer]')];
let active = 'all';

function shape(name, attrs) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

function rect(x, z, w, d, paint) {
  return shape('rect', { x, y: z, width: w, height: d, class: paint });
}

function draw(data) {
  const frame = document.createDocumentFragment();
  frame.append(rect(-28, -16, 56, 32, 'yard'), rect(-12, -28, 24, 12, 'water'));
  for (const [x0, y0, z0, x1, y1, z1, flags, pane] of data.boxes) {
    const ground = y0 <= 0.35 && y1 > 0.35;
    const upper = y0 >= 0.1 && y1 > 0.35;
    if (active === 'ground' ? !ground : active === 'upper' ? !upper : !ground && !upper) continue;
    frame.append(rect(x0, z0, x1 - x0, z1 - z0, pane >= 0 ? 'glass' : flags & 2 ? 'rail' : y0 >= 0.1 ? 'raised' : 'solid'));
  }
  if (paths.checked) {
    for (const { x, y, z, endX, endY, endZ } of linksInLayer(data.nav, active)) {
      frame.append(shape('line', { x1: x, y1: z, x2: endX, y2: endZ, class: y >= 0.1 || endY >= 0.1 ? 'high-path' : 'path' }));
    }
  }
  for (const { x, y, z, side } of data.spawns) {
    if (active === 'all' || active === layerOf(y))
      frame.append(shape('circle', { cx: x, cy: z, r: 0.27, class: side ? 'east' : 'west' }));
  }
  for (const [label, x, z] of [['小船坞', 0, -28.4], ['北货道', -2, -13.2], ['装卸棚', 0, 14.7], ['北 ↑', 28.5, -27.5]]) {
    const text = shape('text', { x, y: z, 'text-anchor': 'middle' });
    text.textContent = label;
    frame.append(text);
  }
  map.replaceChildren(frame);
  const count = paths.checked ? data.nav.filter(([, y]) => active === 'all' || layerOf(y) === active).length : 0;
  stats.textContent = paths.checked ? `${count} 个导航节点` : '导航线已隐藏';
}

try {
  const response = await fetch(new URL('../data/yard-07.json', import.meta.url));
  if (!response.ok) throw new Error('Map data unavailable');
  const data = await response.json();
  draw(data);
  for (const button of layers) button.addEventListener('click', () => {
    active = button.dataset.layer;
    for (const item of layers) item.setAttribute('aria-pressed', String(item === button));
    draw(data);
  });
  paths.addEventListener('change', () => draw(data));
} catch {
  stats.textContent = '没读到地图数据';
}
