const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// src/features/kui/playerGestures.ts: middle = play/pause (single) / fullscreen (double); sides = controls
// (single) / seek 10 s (double, then each tap of the streak)
const js = ts.transpileModule(fs.readFileSync('src/features/kui/playerGestures.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const sandbox = {
  exports: {}, setTimeout, clearTimeout, Number, Math, String,
  require: (id) => ({ '../../utils/dom': { el: () => ({ dataset: {}, classList: { add() {}, remove() {} }, replaceChildren() {}, setAttribute() {}, offsetWidth: 0 }) }, '../../config/icons': { icon: () => ({}) }, '../../i18n': { t: (k) => k } })[id],
};
vm.runInNewContext(js, sandbox);
const { installPlayerGestures } = sandbox.exports;

const listeners = new Map();
const host = {
  addEventListener(type, fn) { listeners.set(type, fn); },
  removeEventListener(type, fn) { if (listeners.get(type) === fn) listeners.delete(type); },
  contains: (node) => node === box,
};
const box = { getBoundingClientRect: () => ({ left: 0, right: 300, top: 0, bottom: 200, width: 300 }), closest: () => box };
const video = { closest: (sel) => (sel.startsWith('button') ? null : box) };
const control = { closest: (sel) => (sel.startsWith('button') ? {} : box) };
const calls = { play: 0, controls: [], fullscreen: 0 };
const player = {
  media: { currentTime: 30, duration: 120, paused: true, seekable: { length: 0 } },
  togglePlay() { calls.play++; },
  toggleControls(v) { calls.controls.push(v); },
  fullscreen: { toggle() { calls.fullscreen++; } },
  elements: { container: null },
};
const cleanup = installPlayerGestures(host, () => player);
let clock = 0;
const tap = (x, target = video) => {
  clock += 1;
  listeners.get('pointerdown')({ pointerId: 1, isPrimary: true, button: 0, clientX: x, clientY: 50, timeStamp: clock, target });
  clock += 40;
  listeners.get('pointerup')({ type: 'pointerup', pointerId: 1, clientX: x, clientY: 50, timeStamp: clock, target });
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const gap = (ms) => { clock += ms; };

(async () => {
  tap(150); await wait(300);
  assert.equal(calls.play, 1, 'a single click in the middle plays / pauses');
  assert.equal(calls.fullscreen, 0);

  gap(1000); tap(150); gap(120); tap(150); await wait(300);
  assert.equal(calls.fullscreen, 1, 'a double click in the middle toggles fullscreen');
  assert.equal(calls.play, 1, 'and does not also play / pause');

  gap(1000); tap(20); await wait(300);
  assert.equal(calls.controls.length, 1, 'a single tap on a side shows / hides the controls');

  gap(1000); tap(20); gap(120); tap(20); await wait(10);
  assert.equal(player.media.currentTime, 20, 'a double tap on the left seeks back 10 s');
  gap(200); tap(20); await wait(10);
  assert.equal(player.media.currentTime, 10, 'another tap in the streak seeks again');
  await wait(300);
  assert.equal(calls.controls.length, 1, 'seek taps never toggle the controls');

  gap(2000); tap(280); gap(120); tap(280); await wait(10);
  assert.equal(player.media.currentTime, 20, 'a double tap on the right seeks forward');
  player.media.currentTime = 115; gap(2000); tap(280); gap(100); tap(280); await wait(10);
  assert.equal(player.media.currentTime, 120, 'seeking stops at the end');

  gap(2000); tap(150, control); gap(100); tap(150, control); await wait(300);
  assert.equal(calls.fullscreen, 1, 'controls are left alone');

  // Plyr's own click and dblclick on the video are stopped (no double play / fullscreen)
  let stopped = 0; let prevented = 0;
  listeners.get('dblclick')({ type: 'dblclick', target: video, stopPropagation() { stopped++; }, preventDefault() { prevented++; } });
  listeners.get('click')({ type: 'click', target: video, stopPropagation() { stopped++; }, preventDefault() { prevented++; } });
  assert.equal(stopped, 2);
  assert.equal(prevented, 1);
  stopped = 0;
  listeners.get('click')({ type: 'click', target: control, stopPropagation() { stopped++; } });
  assert.equal(stopped, 0, 'a click on a control reaches Plyr');

  // Plyr shows the controls on touchstart / mousemove, before a single tap is known: the tap must act on what
  // they were when it began, or it hides what Plyr just showed (the controls flashed and vanished)
  const classes = new Set(['plyr--hide-controls']);
  player.elements.container = { classList: { contains: (c) => classes.has(c) }, querySelector: () => null, appendChild() {} };
  player.toggleControls = (show) => { calls.controls.push(show); if (show) classes.delete('plyr--hide-controls'); else classes.add('plyr--hide-controls'); };
  const plyrTap = (x) => {
    clock += 1;
    listeners.get('pointerdown')({ pointerId: 1, isPrimary: true, button: 0, clientX: x, clientY: 50, timeStamp: clock, target: video });
    classes.delete('plyr--hide-controls'); // Plyr's touchstart
    clock += 40;
    listeners.get('pointerup')({ type: 'pointerup', pointerId: 1, clientX: x, clientY: 50, timeStamp: clock, target: video });
  };
  gap(2000); plyrTap(20); await wait(300);
  assert.ok(!classes.has('plyr--hide-controls'), 'a side tap on hidden controls leaves them shown');
  gap(2000); plyrTap(20); await wait(300);
  assert.ok(classes.has('plyr--hide-controls'), 'a side tap on shown controls hides them');
  gap(2000); plyrTap(280); gap(100); plyrTap(280); await wait(300);
  assert.ok(classes.has('plyr--hide-controls'), 'a seek keeps hidden controls hidden');

  cleanup();
  assert.equal(listeners.size, 0, 'listeners are removed on unmount');
  console.log('player-gestures: all checks passed');
})().catch((error) => { console.error(error); process.exit(1); });
