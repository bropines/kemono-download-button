// The Lens request as text, for a host that cannot carry a binary body (AdGuard for Android): the
// proto3 JSON form of the same message with the picture as base64, and when the transport turns to it.
const assert = require('node:assert/strict');
const { browser } = require('./lib/load-ts.cjs');

const ENDPOINT = 'https://lensfrontend-pa.googleapis.com/v1/crupload';
const settings = { apiKey: 'KEY', timeoutMs: 1000, targetLang: 'ru', sourceLang: '', ocrLang: '', region: 'US', timeZone: 'UTC' };
const latin1 = (bytes) => Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
const fitsHost = (body) => encodeURIComponent(body).length <= 60000;

// A userscript host: answers each request with the next reply in line, through onload like Tampermonkey
// (which reports a 400 there) or through onerror like AdGuard (which reports every non-2xx there)
function host(replies, { errorsViaOnerror = false } = {}) {
  const sent = [];
  const request = (options) => {
    sent.push(options);
    const reply = replies.shift() ?? { status: 500 };
    const response = { status: reply.status, response: undefined, responseText: reply.body ?? '', responseHeaders: reply.headers ?? '' };
    setTimeout(() => (errorsViaOnerror && reply.status >= 300 ? options.onerror(response) : options.onload(response)), 0);
  };
  return { sent, request };
}

function load(request, extra = {}) {
  const fetched = [];
  const b = browser({
    globals: {
      Uint8Array, ArrayBuffer, DataView, TextEncoder, TextDecoder, crypto, btoa, atob, BigInt, AbortSignal,
      GM_xmlhttpRequest: request,
      GM_info: { scriptHandler: 'TestHost', script: { version: '0' } },
      window: {},
      fetch: async (url, init) => {
        fetched.push({ url, init });
        return { status: 200, arrayBuffer: async () => new Uint8Array([9]).buffer, headers: { get: () => 'application/x-protobuf' } };
      },
      ...extra,
    },
  });
  return {
    fetched,
    gm: b.require('src/vendor/lens/gm.ts'),
    wire: b.require('src/vendor/lens/lens/wire-text.ts'),
    request: b.require('src/vendor/lens/lens/request.ts'),
    pb: b.require('src/vendor/lens/protobuf.ts'),
    F: b.require('src/vendor/lens/gen/fields.ts').F,
  };
}

(async () => {
  // --- The body: the same message as the binary request, by name ---
  {
    const { wire, request, pb, F } = load(() => {});
    const picture = Uint8Array.from({ length: 256 }, (_, i) => i);
    const json = JSON.parse(wire.jsonRequest(wire.toBase64(picture), 640, 480, settings));
    const binary = pb.sub(pb.decode(request.buildRequest({ imageBytes: picture, width: 640, height: 480 }, settings)), F.LensOverlayServerRequest.objectsRequest);

    // The picture is base64 of the very bytes the binary request carries
    const data = pb.sub(binary, F.LensOverlayObjectsRequest.imageData);
    const sentBytes = pb.bytes(pb.sub(data, F.ImageData.payload), F.ImagePayload.imageBytes);
    assert.equal(json.objectsRequest.imageData.payload.imageBytes, Buffer.from(sentBytes).toString('base64'));
    assert.deepEqual([...wire.fromBase64(json.objectsRequest.imageData.payload.imageBytes)], [...picture]);
    const meta = pb.sub(data, F.ImageData.imageMetadata);
    assert.deepEqual(json.objectsRequest.imageData.imageMetadata, { width: pb.num(meta, F.ImageMetadata.width), height: pb.num(meta, F.ImageMetadata.height) });

    // The context says the same things: platform, surface, locale, one translate filter, the overlay
    const context = pb.sub(binary, F.LensOverlayObjectsRequest.requestContext);
    const client = pb.sub(context, F.LensOverlayRequestContext.clientContext);
    const jsonClient = json.objectsRequest.requestContext.clientContext;
    assert.equal(jsonClient.platform, pb.num(client, F.LensOverlayClientContext.platform));
    assert.equal(jsonClient.surface, pb.num(client, F.LensOverlayClientContext.surface));
    const locale = pb.sub(client, F.LensOverlayClientContext.localeContext);
    assert.deepEqual(jsonClient.localeContext, {
      language: pb.text(locale, F.LocaleContext.language), region: pb.text(locale, F.LocaleContext.region), timeZone: pb.text(locale, F.LocaleContext.timeZone),
    });
    const filter = pb.sub(pb.sub(client, F.LensOverlayClientContext.clientFilters), F.AppliedFilters.filter);
    assert.equal(jsonClient.clientFilters.filter.length, 1);
    assert.equal(jsonClient.clientFilters.filter[0].filterType, pb.num(filter, F.AppliedFilter.filterType));
    // An empty source language is left out, as the binary writer leaves it out
    assert.deepEqual(jsonClient.clientFilters.filter[0].translate, { targetLanguage: 'ru' });
    assert.equal(jsonClient.renderingContext.renderingEnvironment, pb.num(pb.sub(client, F.LensOverlayClientContext.renderingContext), F.RenderingContext.renderingEnvironment));
    // A 64-bit id is a string in proto3 JSON
    const id = json.objectsRequest.requestContext.requestId;
    assert.equal(typeof id.uuid, 'string');
    assert.match(id.uuid, /^\d+$/);
    assert.deepEqual([id.sequenceId, id.imageSequenceId], [1, 1]);
    // No translation asked for: the auto filter, alone
    const plain = JSON.parse(wire.jsonRequest('QUJD', 1, 1, { ...settings, targetLang: '' }));
    assert.deepEqual(plain.objectsRequest.requestContext.clientContext.clientFilters.filter, [{ filterType: 7 }]);

    // An answer is told apart from base64 by its bytes
    assert.equal(wire.isBase64Text(new TextEncoder().encode('EoIrCgAang8K')), true);
    assert.equal(wire.isBase64Text(Uint8Array.from([0x12, 0x82, 0x2b])), false);
    assert.equal(wire.isBase64Text(new Uint8Array(0)), false);
  }

  // --- The envelope, and a picture made smaller until the body fits the host ---
  {
    const drawn = [];
    const { wire } = load(() => {}, {
      createImageBitmap: async () => ({ close() {} }),
      document: {
        createElement: () => ({
          width: 0, height: 0,
          getContext: () => ({ drawImage() {} }),
          // A JPEG whose weight follows its pixels and quality, as a real one roughly does
          toBlob(done, _type, quality) {
            drawn.push([this.width, this.height, quality]);
            done(new Blob([new Uint8Array(Math.round((this.width * this.height * quality) / 10))]));
          },
        }),
      },
    });
    const small = wire.textAlternative({ imageBytes: new Uint8Array(3000), width: 100, height: 100 }, settings, ENDPOINT);
    const asIs = await small.build(fitsHost);
    assert.equal(asIs.url, `${ENDPOINT}?%24alt=proto`);
    assert.deepEqual({ ...asIs.headers }, { 'Content-Type': 'application/json', 'X-Goog-Api-Key': 'KEY', 'X-Goog-Encode-Response-If-Executable': 'base64' });
    assert.equal(JSON.parse(asIs.body).objectsRequest.imageData.payload.imageBytes.length, 4000);
    assert.equal(drawn.length, 0);

    const big = wire.textAlternative({ imageBytes: new Uint8Array(120000), width: 1000, height: 1000 }, settings, ENDPOINT);
    const shrunk = await big.build(fitsHost);
    assert.ok(fitsHost(shrunk.body));
    // Quality first, then size; the size sent is the size said
    assert.deepEqual(drawn, [[1000, 1000, 0.7], [1000, 1000, 0.55], [850, 850, 0.55]]);
    assert.deepEqual(JSON.parse(shrunk.body).objectsRequest.imageData.imageMetadata, { width: 850, height: 850 });
    // Nothing fits: an error, not a request the host will refuse
    await assert.rejects(big.build(() => false), /does not fit/);

    // The answer comes back as base64 text; a binary one is passed through
    const answer = Uint8Array.from([0x12, 0x03, 0x61, 0x62, 0x63]);
    assert.deepEqual([...small.decode(new TextEncoder().encode(Buffer.from(answer).toString('base64')))], [...answer]);
    assert.deepEqual([...small.decode(answer)], [...answer]);
  }

  // --- Tampermonkey / Violentmonkey: the binary body works and nothing else is tried ---
  {
    const { sent, request } = host([{ status: 200, body: 'ok' }, { status: 200, body: 'ok' }]);
    const { gm } = load(request);
    let built = 0;
    const post = () => gm.postBinary({
      url: ENDPOINT, headers: { 'Content-Type': 'application/x-protobuf' }, body: Uint8Array.from([0, 128, 255]), timeoutMs: 1000,
      text: { build: async () => { built++; throw new Error('not wanted'); }, decode: (bytes) => bytes },
    });
    assert.equal(latin1((await post()).bytes), 'ok');
    await post();
    assert.equal(sent.length, 2);
    assert.ok(sent.every((options) => options.data instanceof Uint8Array && options.binary === true && options.url === ENDPOINT));
    // Lens is asked without the user's Google cookies
    assert.equal(sent[0].anonymous, true);
    assert.equal(built, 0);
  }

  // --- AdGuard for Android: both binary shapes come back 400, the text form goes third and is kept ---
  {
    const answer = Uint8Array.from([0x12, 0x03, 0x61, 0x62, 0x63]);
    const asText = Buffer.from(answer).toString('base64');
    const { sent, request } = host(
      [{ status: 400 }, { status: 400 }, { status: 200, body: asText }, { status: 200, body: asText }],
      { errorsViaOnerror: true }
    );
    const { gm, wire, request: lens, fetched } = load(request);
    const image = { imageBytes: Uint8Array.from([0, 128, 255]), width: 4, height: 3 };
    const post = () => gm.postBinary({
      url: ENDPOINT,
      headers: { 'Content-Type': 'application/x-protobuf', 'X-Goog-Api-Key': 'KEY' },
      body: lens.buildRequest(image, settings),
      timeoutMs: 1000,
      text: wire.textAlternative(image, settings, ENDPOINT),
    });

    const response = await post();
    assert.equal(response.status, 200);
    assert.deepEqual([...response.bytes], [...answer]);
    assert.equal(sent.length, 3);
    assert.ok(sent[0].data instanceof Uint8Array);
    assert.equal(typeof sent[1].data, 'string');
    assert.equal(sent[1].binary, true);
    // The third is text all the way: a JSON string, not marked binary, asking for a base64 answer
    assert.equal(sent[2].url, `${ENDPOINT}?%24alt=proto`);
    assert.equal(sent[2].binary, undefined);
    assert.equal(sent[2].headers['Content-Type'], 'application/json');
    assert.equal(sent[2].headers['X-Goog-Encode-Response-If-Executable'], 'base64');
    assert.equal(JSON.parse(sent[2].data).objectsRequest.imageData.payload.imageBytes, 'AID/');

    // Remembered for the session: the next picture goes as text at once
    await post();
    assert.equal(sent.length, 4);
    assert.equal(sent[3].binary, undefined);
    assert.equal(fetched.length, 0);

    // A request with no text form (a search) is not sent in the shapes just refused: a page fetch carries it
    const search = await gm.postBinary({ url: `${ENDPOINT}?gsessionid=x`, headers: {}, body: Uint8Array.from([1]), timeoutMs: 1000 });
    assert.equal(sent.length, 4);
    assert.equal(fetched.length, 1);
    assert.deepEqual([...search.bytes], [9]);
    assert.equal(fetched[0].init.credentials, 'omit');
  }

  // --- A 400 from Lens itself is still an error once every shape has heard it ---
  {
    const text = { build: async () => ({ url: ENDPOINT, headers: {}, body: '{}' }), decode: (bytes) => bytes };
    const refusing = host([{ status: 400 }, { status: 400 }, { status: 400 }]);
    const first = load(refusing.request, { fetch: async () => { throw new Error('Failed to fetch'); } });
    await assert.rejects(
      first.gm.postBinary({ url: ENDPOINT, headers: {}, body: Uint8Array.from([1]), timeoutMs: 1000, text }),
      /HTTP 400; HTTP 400; HTTP 400; via fetch: Failed to fetch/
    );
    assert.equal(refusing.sent.length, 3);
    // Any other status is an answer and is not retried in another shape
    const other = host([{ status: 403 }]);
    const second = load(other.request);
    await assert.rejects(second.gm.postBinary({ url: ENDPOINT, headers: {}, body: Uint8Array.from([1]), timeoutMs: 1000, text }), /HTTP 403/);
    assert.equal(other.sent.length, 1);
  }

  // --- Fetching a picture: a redirect the host does not follow is followed by hand ---
  {
    const page = '<html><head><title>302 Found</title></head></html>';
    const { sent, request } = host([
      { status: 302, body: page, headers: 'Location: /real.png\r\nContent-Type: text/html\r\n' },
      { status: 200, body: '\u0089PNG', headers: 'Content-Type: image/png\r\n' },
    ], { errorsViaOnerror: true });
    const { gm } = load(request);
    const response = await gm.getBinary('https://img.example/data/a.png', 1000, { referer: 'https://site.example/post/1' });
    assert.equal(sent.length, 2);
    assert.equal(sent[1].url, 'https://img.example/real.png');
    assert.equal(sent[0].headers.Referer, 'https://site.example/post/1');
    assert.equal(response.contentType, 'image/png');
    assert.equal('location' in response, false);
    assert.equal(latin1(response.bytes), '\u0089PNG');
  }

  console.log('lens text transport checks passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
