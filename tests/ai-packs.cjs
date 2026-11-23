// "For AI" packs: the generic mechanism (answer parsing, pack detection, field isolation, validation) and the
// real packs (packaging rules, embed rules, search sites, themes): their files carry the current values and a
// self-contained prompt, never a secret, and their import applies only their own fields.
const assert = require('node:assert/strict');
const { browser } = require('./lib/load-ts.cjs');

const SECRETS = { sessionCookie: 'session=SECRET-SESSION', geminiApiKey: 'SECRET-GEMINI', openaiApiKey: 'SECRET-OPENAI', deeplApiKey: 'SECRET-DEEPL' };

function makeBrowser() {
  const gm = new Map();
  const get = (key, fallback) => (gm.has(key) ? gm.get(key) : fallback);
  const b = browser({
    gm,
    mocks: {
      'src/core/registry.ts': {
        getModules: () => [],
        isModuleEnabled: () => true,
        setModuleEnabled() {},
        getModuleSetting: (id, key) => get(`mod.${id}.${key}`, id === 'creators.xlinks' && key === 'searches' ? 'Danbooru | https://danbooru.donmai.us/posts?tags={tag}' : undefined),
        setModuleSetting: (id, key, value) => gm.set(`mod.${id}.${key}`, value),
      },
      'src/i18n/index.ts': { t: (key) => key, tx: (_key, fallback) => fallback, LANG_SETTING_KEY: 'i18n.lang', setLanguageSetting() {} },
      'src/utils/saveFile.ts': { saveBlob() {} },
      'src/utils/version.ts': { scriptVersion: () => '9.9.9' },
      'src/utils/helpers.ts': { debugLog() {} },
    },
  });
  const aiPack = b.require('src/state/aiPack.ts');
  const packs = b.require('src/state/aiPacks/index.ts');
  return { ...b, aiPack, packs, store: b.require('src/state/store.ts') };
}

(async () => {
  // ---- The generic mechanism, on a pack of its own --------------------------------------------------
  const g = makeBrowser();
  const { aiPack } = g;
  const values = { size: 3, label: 'x' };
  let after = 0;
  const demo = aiPack.registerAiPack({
    id: 'demo',
    title: () => 'Demo',
    fields: () => [
      { key: 'size', get: () => values.size, set: (v) => Number.isInteger(v) && v > 0 && ((values.size = v), true) },
      { key: 'label', get: () => values.label, set: (v) => typeof v === 'string' && ((values.label = v), true) },
    ],
    systemPrompt: () => aiPack.composeAiPrompt({ id: 'demo' }, { role: 'Edit the demo.', body: '- `size`: a positive integer.', example: { size: 4 } }),
    afterApply: () => { after++; },
  });
  assert.equal(aiPack.getAiPack('demo'), demo);
  const file = aiPack.buildAiPack(demo, '9.9.9');
  assert.equal(file.format, 'kdl-ai-pack');
  assert.equal(file.pack, 'demo');
  assert.equal(file.script, '9.9.9');
  assert.deepEqual({ ...file.settings }, { size: 3, label: 'x' });
  assert.match(file.systemPrompt, /ONE JSON object of the same shape/);
  assert.match(file.systemPrompt, /any language/);
  assert.match(file.systemPrompt, /"pack": "demo"/);
  const text = aiPack.aiPackText(demo, '9.9.9');
  assert.ok(text.startsWith(file.systemPrompt));
  assert.ok(text.includes('"size": 3'), 'the copied text carries the current values');
  assert.ok(!text.slice(file.systemPrompt.length).includes('systemPrompt'), 'the JSON part has no second copy of the prompt');

  // Answers as chats give them: plain, fenced, with talk around
  assert.deepEqual(aiPack.parseAiAnswer('{"a":1}'), { a: 1 });
  assert.deepEqual(aiPack.parseAiAnswer('Here you go:\n```json\n{"a": 2}\n```\nEnjoy!'), { a: 2 });
  assert.deepEqual(aiPack.parseAiAnswer('Sure! {"a": {"b": 3}} Hope it helps'), { a: { b: 3 } });
  assert.throws(() => aiPack.parseAiAnswer('no json here'), (e) => e.code === 'noJson');

  // Detection and isolation: wrong types and foreign keys are skipped, the rest applied
  assert.equal(aiPack.detectAiPack({ format: 'kdl-ai-pack', pack: 'demo' }), demo);
  assert.equal(aiPack.detectAiPack({ pack: 'nope' }), null);
  assert.equal(aiPack.isAiPackData({ format: 'kdl-ai-pack' }), true);
  let r = await aiPack.applyAiPack({ format: 'kdl-ai-pack', pack: 'demo', systemPrompt: 'ignored', settings: { size: 'big', label: 'y', sessionCookie: 'x' } });
  assert.deepEqual([...r.applied], ['label']);
  assert.deepEqual([...r.skipped], ['size', 'sessionCookie']);
  assert.deepEqual(values, { size: 3, label: 'y' });
  assert.equal(after, 1);
  // Nothing valid: afterApply does not run
  r = await aiPack.applyAiPack({ pack: 'demo', settings: { size: -1 } });
  assert.equal(r.applied.length, 0);
  assert.equal(after, 1);
  // With the pack known from the button, a bare object or {settings} is enough; another pack is refused
  r = await aiPack.applyAiPack({ size: 7 }, demo);
  assert.deepEqual([...r.applied], ['size']);
  r = await aiPack.applyAiPack({ settings: { size: 8 } }, demo);
  assert.equal(values.size, 8);
  await assert.rejects(aiPack.applyAiPack({ size: 9 }), (e) => e.code === 'noPack');
  await assert.rejects(aiPack.applyAiPack({ pack: 'packaging', settings: {} }, demo), (e) => e.code === 'otherPack');
  await assert.rejects(aiPack.applyAiPack({ pack: 'ghost', settings: {} }), (e) => e.code === 'unknownPack');
  await assert.rejects(aiPack.applyAiPack({ pack: 'demo', version: 5, settings: {} }), (e) => e.code === 'version');
  await assert.rejects(aiPack.applyAiPack({ format: 'kdl-ai-pack', pack: 'demo' }), (e) => e.code === 'noSettings');
  await assert.rejects(aiPack.applyAiPack([1, 2]), (e) => e.code === 'notObject');
  // A throwing field counts as skipped, not as a crash
  aiPack.registerAiPack({ id: 'boom', title: () => 'Boom', systemPrompt: () => '', fields: () => [{ key: 'k', get: () => 1, set: () => { throw new Error('x'); } }] });
  r = await aiPack.applyAiPack({ pack: 'boom', settings: { k: 2 } });
  assert.deepEqual([...r.skipped], ['k']);

  // ---- Real packs ------------------------------------------------------------------------------------
  const p = makeBrowser();
  await p.store.getSettings();
  for (const [key, value] of Object.entries(SECRETS)) await p.store.saveSetting(key, value);
  const ids = p.aiPack.getAiPacks().map((pack) => pack.id);
  assert.deepEqual([...ids], ['packaging', 'themes', 'embedRules', 'searchSites', 'imageTranslation']);
  for (const pack of p.aiPack.getAiPacks()) {
    const json = JSON.stringify(p.aiPack.buildAiPack(pack, '9.9.9'));
    for (const [key, value] of Object.entries(SECRETS)) {
      assert.ok(!json.includes(value), `${pack.id} carries no ${key} value`);
      assert.ok(!Object.keys(p.aiPack.aiPackValues(pack)).includes(key), `${pack.id} has no ${key} field`);
    }
    const prompt = pack.systemPrompt();
    assert.match(prompt, /How to answer/, `${pack.id} prompt says how to answer`);
    assert.match(prompt, new RegExp(`"pack": "${pack.id}"`), `${pack.id} prompt names its pack`);
  }

  // Packaging: every placeholder documented with an example, the current values carried
  const packaging = p.packs.packagingPack;
  const prompt = packaging.systemPrompt();
  for (const tag of ['author_name', 'post_date', 'post_title', 'post_id', 'user_id', 'service', 'file_index', 'global_file_index', 'file_name', 'original_file_name', 'file_ext', 'bulk_post_index', 'post_count']) {
    assert.ok(prompt.includes(`{${tag}}`), `placeholder {${tag}} documented`);
  }
  assert.match(prompt, /Example: `2024-03-17`/);
  assert.match(prompt, /0 \(store/);
  assert.equal(p.aiPack.aiPackValues(packaging).fileNameTemplate, p.store.state.settings.fileNameTemplate);
  const before = JSON.parse(JSON.stringify(p.store.state.settings));
  r = await p.aiPack.applyAiPack(p.aiPack.parseAiAnswer('```json\n' + JSON.stringify({
    format: 'kdl-ai-pack', pack: 'packaging', systemPrompt: 'whatever',
    settings: {
      fileNameTemplate: '{service}/{author_name}/{post_date} {post_title}/{file_index}_{file_name}',
      bulkDownloadMode: 'per-post', // not allowed
      zipCompressionLevel: 9,
      ignoredFileExtensions: ['.PSD', 'zip', 'zip'],
      savedFileNameTemplates: [{ name: 'A' }], // no template
      savePostComments: 'yes', // wrong type
      bulkSingleSystemPathTemplate: '   ', // blank
      sessionCookie: 'session=EVIL', // not a field of this pack
      showZipButton: false, // not a field of this pack
    },
  }) + '\n```'));
  assert.deepEqual([...r.applied].sort(), ['fileNameTemplate', 'ignoredFileExtensions', 'zipCompressionLevel']);
  assert.deepEqual([...r.skipped].sort(), ['bulkDownloadMode', 'bulkSingleSystemPathTemplate', 'savePostComments', 'savedFileNameTemplates', 'sessionCookie', 'showZipButton']);
  const after2 = p.store.state.settings;
  assert.equal(after2.fileNameTemplate, '{service}/{author_name}/{post_date} {post_title}/{file_index}_{file_name}');
  assert.equal(after2.zipCompressionLevel, 9);
  assert.deepEqual([...after2.ignoredFileExtensions], ['psd', 'zip'], 'extensions are normalised like the dialog does');
  assert.equal(after2.sessionCookie, SECRETS.sessionCookie);
  assert.equal(after2.showZipButton, before.showZipButton);
  assert.equal(after2.bulkDownloadMode, before.bulkDownloadMode);
  assert.equal(p.gm.get('zipCompressionLevel'), 9, 'saved to storage');

  // Embed rules: all-or-nothing, so one bad rule never half-applies a set
  const embeds = p.packs.embedRulesPack;
  r = await p.aiPack.applyAiPack({ pack: 'embedRules', settings: { rules: { 'mega.nz': 'button', 'x.com': 'remove' } } });
  assert.deepEqual([...r.skipped], ['rules']);
  r = await p.aiPack.applyAiPack({ pack: 'embedRules', settings: { rules: { 'Mega.NZ': 'button', '*.tumblr.com': 'hide' } } });
  assert.deepEqual([...r.applied], ['rules']);
  assert.deepEqual({ ...p.aiPack.aiPackValues(embeds).rules }, { 'mega.nz': 'button', '*.tumblr.com': 'hide' });
  r = await p.aiPack.applyAiPack({ pack: 'embedRules', settings: { rules: { 'https://a.com/x': 'hide' } } });
  assert.equal(r.applied.length, 0);

  // Search sites: stored as the module's text, validated like the editor
  r = await p.aiPack.applyAiPack({ pack: 'searchSites', settings: { sites: [{ label: 'X', url: 'https://x.com/search?q={name}' }, { label: 'Gel', url: 'https://gelbooru.com/?tags={tag}' }] } });
  assert.deepEqual([...r.applied], ['sites']);
  assert.equal(p.gm.get('mod.creators.xlinks.searches'), 'X | https://x.com/search?q={name}\nGel | https://gelbooru.com/?tags={tag}');
  r = await p.aiPack.applyAiPack({ pack: 'searchSites', settings: { sites: [{ label: 'No placeholder', url: 'https://a.test/' }] } });
  assert.deepEqual([...r.skipped], ['sites']);
  assert.match(p.gm.get('mod.creators.xlinks.searches'), /^X \| /);

  // Themes: a new theme is added, scripts never come in, presets switch, a bad entry refuses the field
  r = await p.aiPack.applyAiPack({ pack: 'themes', settings: {
    themes: [{ name: 'Midnight', enabled: true, sites: 'any', pages: ['post'], vars: { '--kdl-site-bg': '#000' }, css: '.global-footer{display:none}', script: 'alert(1)' }],
    presets: { 'builtin-reader': true },
  } });
  assert.deepEqual([...r.applied], ['themes', 'presets']);
  const stored = p.aiPack.aiPackValues(p.packs.themesPack);
  assert.equal(stored.themes.length, 1);
  assert.equal(stored.themes[0].name, 'Midnight');
  assert.equal(stored.themes[0].script, undefined);
  assert.equal(stored.presets['builtin-reader'], true);
  const id = stored.themes[0].id;
  r = await p.aiPack.applyAiPack({ pack: 'themes', settings: { themes: [{ id, name: 'Midnight 2', css: 7 }], presets: { 'not-a-preset': true } } });
  assert.deepEqual([...r.skipped], ['themes', 'presets']);
  r = await p.aiPack.applyAiPack({ pack: 'themes', settings: { themes: [{ id, name: 'Midnight 2' }] } });
  const updated = p.aiPack.aiPackValues(p.packs.themesPack).themes;
  assert.equal(updated.length, 1, 'a known id updates in place');
  assert.equal(updated[0].name, 'Midnight 2');
  assert.equal(updated[0].css, '.global-footer{display:none}', 'fields the answer left out are kept');

  // Image translation: ranges and choices enforced
  r = await p.aiPack.applyAiPack({ pack: 'imageTranslation', settings: { imageTranslateLineSpacing: 5, imageTranslateErase: 'hull', imageTranslateSharpness: 2, imageTranslateMinPx: 12.5 } });
  assert.deepEqual([...r.applied].sort(), ['imageTranslateErase', 'imageTranslateSharpness']);
  assert.deepEqual([...r.skipped].sort(), ['imageTranslateLineSpacing', 'imageTranslateMinPx']);

  console.log('ai pack checks passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
