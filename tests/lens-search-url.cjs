// Google Lens search by image: the results address, and the three requests behind it, against a fake Lens.
const assert = require('node:assert/strict');
const { browser } = require('./lib/load-ts.cjs');

const posts = [];
let respond = () => new Uint8Array();
const gm = {
  postBinary: async (request) => {
    posts.push(request);
    return { status: 200, bytes: respond(request), contentType: 'application/x-protobuf' };
  },
  getBinary: async () => { throw new Error('not used'); },
  hostName: () => 'test',
  // What transport.ts hands the engine: the host's ladder
  get gmTransport() { return { post: gm.postBinary, get: gm.getBinary }; },
};
const b = browser({
  mocks: { 'src/vendor/lens/gm.ts': gm },
  globals: { Uint8Array, DataView, TextEncoder, TextDecoder, URLSearchParams, crypto, btoa, atob, BigInt },
});
const { ImageSearch, buildSearchUrl, textSearchUrl, base64Url, clampBox } = b.require('src/vendor/lens/lens/search.ts');
const { writer, decode, sub, num, text, bytes } = b.require('src/vendor/lens/protobuf.ts');
const { F } = b.require('src/vendor/lens/gen/fields.ts');
const plain = (value) => JSON.parse(JSON.stringify(value));
const query = (url) => Object.fromEntries(new URL(url).searchParams);

// Search by image: no words, the Lens tab
assert.deepEqual(query(buildSearchUrl('SESSION', 'VSRID')), {
  q: '', lns_mode: 'un', lns_fp: '1', lns_surface: '42', gsessionid: 'SESSION', udm: '26', vsrid: 'VSRID', source: 'chrome.cr.ctxi',
});
assert.ok(buildSearchUrl('S', 'V').startsWith('https://www.google.com/search?'));
// Words added to the picture make it a multimodal search
assert.equal(query(buildSearchUrl('S', 'V', { text: ' red hat ' })).udm, '24');
assert.equal(query(buildSearchUrl('S', 'V', { text: ' red hat ' })).q, 'red hat');
// AI Mode, with and without a question; language and colour scheme only when given
const ai = query(buildSearchUrl('S', 'V', { mode: 'ai', text: 'Who drew this?', uiLanguage: 'ru', dark: true }));
assert.deepEqual([ai.udm, ai.lns_mode, ai.q, ai.hl, ai.cs], ['50', 'mu', 'Who drew this?', 'ru', '1']);
const silent = query(buildSearchUrl('S', 'V', { mode: 'ai', dark: false }));
assert.deepEqual([silent.udm, silent.lns_mode, silent.q, silent.cs, 'hl' in silent], ['50', 'mu', '', '0', false]);
assert.equal('cs' in query(buildSearchUrl('S', 'V', { mode: 'ai', dark: undefined })), false);

assert.deepEqual(query(textSearchUrl('  cat & dog ', { uiLanguage: 'de' })), { q: 'cat & dog', lns_fp: '1', lns_mode: 'text', lns_surface: '42', hl: 'de' });

// vsrid is base64url without padding
assert.equal(base64Url(new Uint8Array([0xfb, 0xff, 0xfe])), '-__-');
assert.equal(base64Url(new Uint8Array([1])), 'AQ');
assert.deepEqual(plain(clampBox({ cx: 0.9, cy: 0.5, w: 0.4, h: 2 })), { cx: 0.85, cy: 0.5, w: 0.30000000000000004, h: 1 });

// The whole exchange: a session, the upload into it, then one interaction per search on the same upload
const requestIdOf = (body, kind) => {
  const request = sub(decode(body), F.LensOverlayServerRequest[kind]);
  const context = sub(request, kind === 'objectsRequest' ? F.LensOverlayObjectsRequest.requestContext : F.LensOverlayInteractionRequest.requestContext);
  return sub(context, F.LensOverlayRequestContext.requestId);
};
respond = (request) => {
  if (request.url.endsWith('/v1/gsessionid')) {
    return writer()
      .str(F.LensOverlayServerClusterInfoResponse.serverSessionId, 'server-1')
      .str(F.LensOverlayServerClusterInfoResponse.searchSessionId, 'search-1')
      .bytes(F.LensOverlayServerClusterInfoResponse.routingInfo, new Uint8Array([7, 7]))
      .finish();
  }
  return new Uint8Array();
};

(async () => {
  const settings = { apiKey: 'KEY', timeoutMs: 1000, targetLang: 'ru', sourceLang: '', ocrLang: '', region: 'US', timeZone: 'UTC' };
  const image = { imageBytes: new Uint8Array([1, 2, 3]), width: 40, height: 30 };
  const search = await ImageSearch.upload(image, settings);
  assert.equal(posts.length, 2);
  assert.equal(posts[0].url, 'https://lensfrontend-pa.googleapis.com/v1/gsessionid');
  assert.equal(posts[1].url, 'https://lensfrontend-pa.googleapis.com/v1/crupload?gsessionid=server-1');
  assert.equal(posts[1].headers['X-Goog-Api-Key'], 'KEY');
  assert.equal(num(requestIdOf(posts[1].body, 'objectsRequest'), F.LensOverlayRequestId.sequenceId), 1);

  const first = new URL(await search.search({ kind: 'image' }, { mode: 'visual' }));
  assert.equal(posts.length, 3);
  assert.equal(first.searchParams.get('gsessionid'), 'search-1');
  assert.equal(first.searchParams.get('udm'), '26');
  // The interaction is request 2 of the session; the address names the step after it
  assert.equal(num(requestIdOf(posts[2].body, 'interactionRequest'), F.LensOverlayRequestId.sequenceId), 2);
  const vsrid = first.searchParams.get('vsrid');
  assert.match(vsrid, /^[A-Za-z0-9_-]+$/);
  const named = decode(new Uint8Array(Buffer.from(vsrid, 'base64url')));
  assert.equal(num(named, F.LensOverlayRequestId.sequenceId), 3);
  assert.equal(num(named, F.LensOverlayRequestId.imageSequenceId), 1);
  assert.deepEqual([...bytes(named, F.LensOverlayRequestId.routingInfo)], [7, 7]);

  // A question on the same picture: one more request, no second upload, and the question goes to Lens too
  const second = new URL(await search.search({ kind: 'image' }, { mode: 'ai', text: 'Who drew this?' }));
  assert.equal(posts.length, 4);
  assert.equal(second.searchParams.get('udm'), '50');
  assert.equal(second.searchParams.get('q'), 'Who drew this?');
  assert.notEqual(second.searchParams.get('vsrid'), vsrid);
  const interaction = sub(decode(posts[3].body), F.LensOverlayServerRequest.interactionRequest);
  const metadata = sub(interaction, F.LensOverlayInteractionRequest.interactionRequestMetadata);
  const asked = sub(sub(metadata, F.LensOverlayInteractionRequestMetadata.queryMetadata), F.LensOverlayInteractionRequestMetadata_QueryMetadata.textQuery);
  assert.equal(text(asked, F.TextQuery.query), 'Who drew this?');
  assert.equal(num(requestIdOf(posts[3].body, 'interactionRequest'), F.LensOverlayRequestId.sequenceId), 4);

  // A server error is an error, not an address that shows nothing
  respond = () => writer().sub(F.LensOverlayServerResponse.error, (e) => e.int(F.LensOverlayServerError.errorType, 2)).finish();
  await assert.rejects(search.search({ kind: 'image' }), /server error type 2/);

  console.log('lens search url checks passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
