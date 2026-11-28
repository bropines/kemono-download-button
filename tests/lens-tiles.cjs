// A long strip (a webtoon) is sent to Lens as overlapping tiles and the answers come back as one, in the
// whole picture's coordinates; an ordinary page still goes up once.
const assert = require('node:assert/strict');
const { browser } = require('./lib/load-ts.cjs');

// Chromium's upload budget, the one lensImages.ts sends
const budget = { maxArea: 1500000, maxSide: 1600, jpegQuality: 0.4 };

// What Lens is asked, and what it says: one paragraph in the middle of whatever it is shown
const calls = [];
let active = 0;
let mostAtOnce = 0;
let failing = () => null;
const client = {
  callLens: async (image) => {
    const index = calls.length;
    calls.push(image);
    active++;
    mostAtOnce = Math.max(mostAtOnce, active);
    await new Promise((resolve) => setTimeout(resolve, 2));
    active--;
    const failure = failing(index, image);
    if (failure) throw failure;
    const box = { cx: 0.5, cy: 0.5, w: 0.5, h: 0.05, angle: 0 };
    return {
      contentLanguage: 'ja',
      ocr: [],
      blocks: [{ translation: `tile at ${image.top}`, geometry: box, sourceLang: 'ja', targetLang: 'ru', writingDirection: 0, alignment: 0, lines: [{ geometry: box, words: [[0, 4]] }] }],
    };
  },
};

// A canvas that remembers which part of the picture was drawn into it, and encodes to bytes that say so
const drawn = [];
const document = {
  createElement: () => ({
    width: 0, height: 0, rect: null,
    getContext() {
      const canvas = this;
      return {
        fillRect() {},
        drawImage(_source, x, y, width, height, ...target) {
          // Five arguments is the whole picture scaled to the canvas; nine is one rectangle of it
          canvas.rect = target.length ? { x, y, width, height } : { x: 0, y: 0, whole: true };
          drawn.push({ ...canvas.rect, to: [canvas.width, canvas.height] });
        },
      };
    },
    toBlob(done) { done(new Blob([JSON.stringify(this.rect)])); },
  }),
};
class HTMLImageElement {}
class HTMLVideoElement {}

const b = browser({
  mocks: { 'src/vendor/lens/lens/client.ts': client },
  globals: { Uint8Array, document, HTMLImageElement, HTMLVideoElement },
});
const { planTiles, tilingTag, mergeTiles, toPicture, MAX_TILES } = b.require('src/vendor/lens/lens/tiles.ts');
const { askLens, looksTransient } = b.require('src/vendor/lens/lens/ask.ts');
const { targetSize } = b.require('src/vendor/lens/image.ts');
const { cacheKey } = b.require('src/vendor/lens/cache.ts');
const plain = (value) => JSON.parse(JSON.stringify(value));
// The stand-in Lens above is told where each tile started through the bytes of its "JPEG"
const topOf = (image) => JSON.parse(Buffer.from(image.imageBytes).toString()).y;

(async () => {
  // --- Planning ---
  // A page goes up once, as it always did: not scaled at all, or scaled about as far as the area would
  for (const [width, height] of [[1200, 1600], [1500, 2000], [1061, 1414], [800, 1600], [1600, 900], [500, 3000], [4000, 3000], [0, 0]]) {
    assert.equal(planTiles(width, height, budget), null, `${width}x${height}`);
  }

  // The strip from the bug report: one upload made it 113x1600, with every line of text a row of dots
  assert.deepEqual(plain(targetSize(800, 11352, budget)), { width: 113, height: 1600 });
  const plan = planTiles(800, 11352, budget);
  assert.ok(plan);
  assert.equal(plan.vertical, true);
  assert.equal(plan.tiles.length, 10);
  assert.ok(plan.tiles.length <= MAX_TILES);
  // Each tile is the strip's full width and goes up at natural size
  for (const tile of plan.tiles) {
    assert.deepEqual([tile.x, tile.width, tile.height], [0, 800, 1600]);
    assert.deepEqual(plain(targetSize(tile.width, tile.height, budget)), { width: 800, height: 1600 });
  }
  // Together they cover the whole height, top to bottom
  assert.equal(plan.tiles[0].y, 0);
  assert.equal(plan.tiles.at(-1).y + plan.tiles.at(-1).height, 11352);
  for (let i = 1; i < plan.tiles.length; i++) {
    const previous = plan.tiles[i - 1];
    const tile = plan.tiles[i];
    // ...each sharing a good part of itself with the one before, so a bubble on a seam is whole in one
    const overlap = previous.y + previous.height - tile.y;
    assert.ok(overlap >= 400 && overlap < 800, `overlap ${overlap}`);
    // ...and the bands they answer for meet in the middle of that overlap, covering the picture once
    assert.equal(tile.bandStart, previous.bandEnd);
    assert.ok(tile.bandStart > tile.y && tile.bandStart < previous.y + previous.height);
  }
  assert.equal(plan.tiles[0].bandStart, 0);
  assert.equal(plan.tiles.at(-1).bandEnd, 11352);

  // A panorama is cut the other way
  const wide = planTiles(11352, 800, budget);
  assert.equal(wide.vertical, false);
  assert.ok(wide.tiles.every((tile) => tile.y === 0 && tile.height === 800 && tile.width === 1600));
  // Never more than twelve requests: past that the tiles grow longer instead
  const huge = planTiles(800, 40000, budget);
  assert.equal(huge.tiles.length, MAX_TILES);
  assert.ok(huge.tiles[0].height > 1600);
  assert.equal(huge.tiles.at(-1).y + huge.tiles.at(-1).height, 40000);

  // Switched off: one upload, and the answer is kept apart from the tiled one
  assert.equal(planTiles(800, 11352, { ...budget, tileLongImages: 'off' }), null);
  assert.equal(tilingTag(800, 11352, budget), '.tiled');
  assert.equal(tilingTag(800, 11352, { ...budget, tileLongImages: 'off' }), '');
  assert.equal(tilingTag(1200, 1600, budget), '');
  const lang = { targetLang: 'ru', sourceLang: '', ocrLang: '' };
  assert.notEqual(cacheKey('https://x.test/a.png', { ...lang, tileLongImages: 'off' }), cacheKey('https://x.test/a.png', lang));
  assert.ok(cacheKey('https://x.test/a.png', { ...lang, tileLongImages: 'off' }).endsWith('untiled'));
  assert.equal(cacheKey('https://x.test/a.png', { ...lang, tileLongImages: 'auto' }), cacheKey('https://x.test/a.png', lang));

  // --- Coordinates: a box in a tile is the same pixels in the picture ---
  const third = plan.tiles[2];
  const moved = toPicture({ cx: 0.25, cy: 0.5, w: 0.5, h: 0.125, angle: 7 }, third, plan);
  assert.ok(Math.abs(moved.cx * 800 - 200) < 1e-6);
  assert.ok(Math.abs(moved.cy * 11352 - (third.y + 800)) < 1e-6);
  assert.ok(Math.abs(moved.w * 800 - 400) < 1e-6);
  assert.ok(Math.abs(moved.h * 11352 - 200) < 1e-6);
  assert.equal(moved.angle, 7);

  // The same paragraph read by two neighbours (it lies in their overlap) comes back once
  const first = plan.tiles[0];
  const second = plan.tiles[1];
  const shared = first.bandEnd + 30; // a row just past the seam, inside both tiles
  const inTile = (tile, text) => {
    const box = { cx: 0.5, cy: (shared - tile.y) / tile.height, w: 0.5, h: 60 / tile.height, angle: 0 };
    return { contentLanguage: 'ja', ocr: [], blocks: [{ translation: text, geometry: box, sourceLang: 'ja', targetLang: 'ru', writingDirection: 0, alignment: 0, lines: [{ geometry: box, words: [[0, text.length]] }] }] };
  };
  const empty = { contentLanguage: '', ocr: [], blocks: [] };
  const merged = mergeTiles(plan, [inTile(first, 'from the first'), inTile(second, 'from the second'), ...plan.tiles.slice(2).map(() => empty)]);
  assert.equal(merged.blocks.length, 1);
  // ...from the tile whose band it is in
  assert.equal(merged.blocks[0].translation, 'from the second');
  assert.ok(Math.abs(merged.blocks[0].geometry.cy * 11352 - shared) < 1e-6);
  assert.equal(merged.contentLanguage, 'ja');

  // --- Asking ---
  const strip = { width: 800, height: 11352 };
  client.callLens = ((inner) => async (image, options) => inner({ ...image, top: topOf(image) }, options))(client.callLens);

  // A page: one upload of the whole picture, exactly as before
  const page = await askLens({ width: 1200, height: 1600 }, budget);
  assert.equal(calls.length, 1);
  assert.equal(drawn.length, 1);
  assert.equal(drawn[0].whole, true);
  assert.equal(page.blocks.length, 1);

  // A strip: one request per tile, the first alone and then two at a time
  calls.length = 0; drawn.length = 0; mostAtOnce = 0;
  const whole = await askLens(strip, budget);
  assert.equal(calls.length, 10);
  assert.equal(mostAtOnce, 2);
  assert.deepEqual(drawn.map((rect) => rect.y).sort((a, b) => a - b), plain(plan.tiles.map((tile) => tile.y)));
  assert.ok(drawn.every((rect) => rect.width === 800 && rect.height === 1600 && rect.to[0] === 800 && rect.to[1] === 1600));
  assert.ok(calls.every((image) => image.width === 800 && image.height === 1600));
  // One answer, in the picture's coordinates and in reading order: each tile's paragraph at that tile's middle
  assert.equal(whole.blocks.length, 10);
  whole.blocks.forEach((block, i) => {
    assert.equal(block.translation, `tile at ${plan.tiles[i].y}`);
    assert.ok(Math.abs(block.geometry.cy * 11352 - (plan.tiles[i].y + 800)) < 1e-6);
    assert.ok(Math.abs(block.geometry.h * 11352 - 80) < 1e-6);
    assert.ok(Math.abs(block.lines[0].geometry.cx - 0.5) < 1e-9);
  });

  // A dropped connection on one tile is asked again, once
  calls.length = 0;
  let dropped = 0;
  failing = (index) => (index === 3 && !dropped++ ? new Error('via TestHost: network error') : null);
  assert.equal((await askLens(strip, budget)).blocks.length, 10);
  assert.equal(calls.length, 11);

  // A refusal is not: the first tile goes alone, so a request that was never going to work costs one
  calls.length = 0;
  failing = () => new Error('HTTP 403');
  await assert.rejects(askLens(strip, budget), /part 1 of 10 of a long picture: HTTP 403/);
  assert.equal(calls.length, 1);
  // A tile that keeps failing fails the translation: a strip with a silent hole looks finished and is not
  calls.length = 0;
  failing = (_index, image) => (image.top === plan.tiles[4].y ? new Error('HTTP 503') : null);
  await assert.rejects(askLens(strip, budget), /part 5 of 10 of a long picture: HTTP 503/);
  failing = () => null;

  assert.equal(looksTransient(new Error('via Tampermonkey: network error')), true);
  assert.equal(looksTransient(new Error('HTTP 503')), true);
  assert.equal(looksTransient(new Error('HTTP 429')), true);
  assert.equal(looksTransient(new Error('HTTP 403')), false);
  assert.equal(looksTransient(new Error('HTTP 400; HTTP 400')), false);
  assert.equal(looksTransient(Object.assign(new Error('Timed out'), { name: 'TimeoutError' })), false);

  console.log('lens tiles checks passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
