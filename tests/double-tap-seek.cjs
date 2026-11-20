const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/features/kui/doubleTapSeek.ts', 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const sandbox = { exports: {} };
vm.runInNewContext(js, sandbox);
const { installDoubleTapSeek } = sandbox.exports;
const listeners = new Map();
const host = {
  addEventListener(type, fn) { listeners.set(type, fn); },
  removeEventListener(type, fn) { if (listeners.get(type) === fn) listeners.delete(type); },
  contains(node) { return node === wrapper; },
};
const wrapper = { getBoundingClientRect: () => ({ left: 0, right: 300, top: 0, bottom: 200, width: 300 }) };
const video = { closest: selector => selector === '.plyr__video-wrapper' ? wrapper : null };
const control = { closest: selector => selector === '.plyr__video-wrapper' ? wrapper : {} };
let media = { currentTime: 25, duration: 60, seekable: { length: 0 } };
const cleanup = installDoubleTapSeek(host, () => media);
const send = (type, time, x = 25, options = {}) => listeners.get(type)?.({
  type, pointerType: 'touch', pointerId: 1, timeStamp: time, clientX: x, clientY: 50, target: video, ...options,
});
const tap = (time, x = 25, options = {}) => { send('pointerdown', time, x, options); send('pointerup', time + 30, x, options); };

tap(0); assert.equal(media.currentTime, 25, 'one tap must not seek');
tap(200); assert.equal(media.currentTime, 15, 'left double tap seeks back 10 seconds');
tap(600, 250); tap(800, 250); assert.equal(media.currentTime, 25, 'right double tap seeks forward');
tap(1200); tap(1800); assert.equal(media.currentTime, 25, 'slow taps do not seek');
tap(2200); tap(2400, 250); assert.equal(media.currentTime, 25, 'different sides do not seek');
tap(2800, 25, { target: control }); tap(3000, 25, { target: control }); assert.equal(media.currentTime, 25, 'controls never seek');
tap(3400, 25, { pointerType: 'mouse' }); tap(3600, 25, { pointerType: 'mouse' }); assert.equal(media.currentTime, 25, 'desktop clicks keep existing behavior');
send('pointerdown', 4000); send('pointermove', 4020, 80); send('pointerup', 4040, 80); tap(4200); assert.equal(media.currentTime, 25, 'scroll gestures do not become a tap');
send('pointerdown', 4600); send('pointercancel', 4630); tap(4800); assert.equal(media.currentTime, 25, 'cancelled touches do not seek');
send('pointerdown', 5200); send('pointerdown', 5210, 25, { pointerId: 2 }); send('pointerup', 5230); send('pointerup', 5240, 25, { pointerId: 2 }); tap(5400); assert.equal(media.currentTime, 25, 'multi-touch gestures do not seek');
tap(5800); media = { currentTime: 3, duration: 60, seekable: { length: 0 } }; tap(6000); assert.equal(media.currentTime, 3, 'a source change invalidates the first tap');
tap(6400); tap(6600); assert.equal(media.currentTime, 0, 'seek clamps to the beginning');
media.currentTime = 58; tap(7000, 250); tap(7200, 250); assert.equal(media.currentTime, 60, 'seek clamps to duration');
media = { currentTime: 102, duration: Infinity, seekable: { length: 1, start: () => 100, end: () => 120 } };
tap(7600); tap(7800); assert.equal(media.currentTime, 100, 'live video clamps to its seekable window');
cleanup(); assert.equal(listeners.size, 0, 'listeners are removed on unmount');
tap(8200); tap(8400); assert.equal(media.currentTime, 100);
console.log('double-tap video seek checks passed');
