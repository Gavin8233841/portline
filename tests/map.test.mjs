import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { layerOf, linksInLayer } from '../src/layers.mjs';

const { boxes, spawns, nav, glassCount } = JSON.parse(readFileSync(new URL('../data/yard-07.json', import.meta.url)));

test('published yard dimensions, spawns and collision references', () => {
  assert.deepEqual([boxes.length, spawns.length, nav.length, glassCount], [725, 28, 436, 2]);
  for (const [x0, y0, z0, x1, y1, z1, flags, pane] of boxes) {
    assert.ok(x0 < x1 && y0 < y1 && z0 < z1);
    assert.ok(Number.isInteger(flags) && flags >= 0 && flags <= 3);
    assert.ok(Number.isInteger(pane) && pane >= -1 && pane < glassCount);
  }
  assert.deepEqual([0, 1].map(side => spawns.filter(p => p.side === side && p.entrance).length), [1, 1]);
});

test('links reference distinct available nodes; both sides can reach the deck', () => {
  for (const [i, [,,, links]] of nav.entries()) {
    assert.equal(new Set(links).size, links.length);
    for (const j of links) assert.ok(Number.isInteger(j) && j >= 0 && j < nav.length && j !== i);
  }
  for (const { x, y, z } of spawns.filter(p => p.entrance)) {
    const nearest = nav.map(([a, b, c], i) => [Math.hypot(x - a, y - b, z - c), i]).sort(([a], [b]) => a - b)[0][1];
    const queue = [nearest];
    const seen = new Set(queue);
    for (const i of queue) for (const j of nav[i][3]) {
      if (seen.has(j)) continue;
      seen.add(j);
      queue.push(j);
    }
    assert.ok(queue.some(i => nav[i][1] >= 2.1 && nav[i][2] < -20));
  }
});

test('the two layers omit cross-layer lines; the overview keeps them', () => {
  const all = linksInLayer(nav, 'all');
  for (const layer of ['ground', 'upper']) {
    const links = linksInLayer(nav, layer);
    assert.ok(links.length > 0 && links.length < all.length);
    assert.ok(links.every(({ y, endY }) => layerOf(y) === layer && layerOf(endY) === layer));
  }
  assert.ok(all.some(({ y, endY }) => layerOf(y) !== layerOf(endY)));
});
