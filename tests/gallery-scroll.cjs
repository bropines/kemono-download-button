const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync('src/features/kui/galleryScroll.ts', 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const sandbox = { exports: {} };
vm.runInNewContext(js, sandbox);
const { revealGalleryThumbnail } = sandbox.exports;
const calls = [];
const list = {
  isConnected: true, clientWidth: 100, clientHeight: 100, clientLeft: 0, clientTop: 0,
  scrollWidth: 100, scrollHeight: 300,
  getBoundingClientRect: () => ({ top: 1000, left: 20 }),
  scrollBy: options => calls.push({ left: options.left, top: options.top, behavior: options.behavior }),
};
let bounds = { top: 1070, bottom: 1090, left: 20, right: 100 };
const thumbnail = { isConnected: true, getBoundingClientRect: () => bounds };
revealGalleryThumbnail(list, thumbnail);
assert.equal(calls.length, 0, 'already visible thumbnail does not scroll');
bounds = { top: 1110, bottom: 1130, left: 20, right: 100 };
revealGalleryThumbnail(list, thumbnail);
assert.deepEqual(calls.pop(), { left: 0, top: 30, behavior: 'smooth' }, 'desktop moves only the thumbnail list');
list.scrollHeight = 100;
list.scrollWidth = 300;
bounds = { top: 1010, bottom: 1090, left: 130, right: 170 };
revealGalleryThumbnail(list, thumbnail);
assert.deepEqual(calls.pop(), { left: 50, top: 0, behavior: 'smooth' }, 'mobile moves only the horizontal list');
list.clientWidth = 0;
revealGalleryThumbnail(list, thumbnail);
assert.equal(calls.length, 0, 'collapsed list is not scrolled');
console.log('gallery thumbnail scroll checks passed');
