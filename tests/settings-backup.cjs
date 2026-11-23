// Settings files: a full backup round-trips everything, the "without secrets" file holds no secret and keeps the
// secrets of the browser it is imported into, and exports from older versions (a flat object) still import.
const assert = require('node:assert/strict');
const { browser } = require('./lib/load-ts.cjs');

const SECRETS = { sessionCookie: 'session=SECRET-SESSION', geminiApiKey: 'SECRET-GEMINI', openaiApiKey: 'SECRET-OPENAI', deeplApiKey: 'SECRET-DEEPL' };

function makeBrowser() {
  const gm = new Map();
  const saved = [];
  const modules = [
    { id: 'demo', settings: [
      { key: 'flag', type: 'boolean', default: false },
      { key: 'mode', type: 'select', default: 'a', options: [{ value: 'a' }, { value: 'b' }] },
      { key: 'notes', type: 'textarea', default: '' },
    ] },
    { id: 'locked.one', locked: true, settings: [] },
  ];
  const get = (key, fallback) => (gm.has(key) ? gm.get(key) : fallback);
  const registry = {
    getModules: () => modules,
    isModuleEnabled: (id) => get(`mod.${id}.enabled`, true),
    setModuleEnabled: (id, value) => gm.set(`mod.${id}.enabled`, value),
    getModuleSetting: (id, key) => get(`mod.${id}.${key}`, modules.find((m) => m.id === id)?.settings.find((s) => s.key === key)?.default),
    setModuleSetting: (id, key, value) => gm.set(`mod.${id}.${key}`, value),
  };
  const b = browser({
    gm,
    mocks: {
      'src/core/registry.ts': registry,
      'src/i18n/index.ts': { t: (key) => key, tx: (_key, fallback) => fallback, LANG_SETTING_KEY: 'i18n.lang', setLanguageSetting: (value) => gm.set('i18n.lang', value) },
      'src/utils/saveFile.ts': { saveBlob: (blob, name) => saved.push({ blob, name }) },
      'src/utils/version.ts': { scriptVersion: () => '9.9.9' },
      'src/utils/helpers.ts': { debugLog() {} },
    },
  });
  return { ...b, saved, store: b.require('src/state/store.ts'), registry };
}

(async () => {
  // ---- A configured browser ----------------------------------------------------------------------
  const a = makeBrowser();
  await a.store.getSettings();
  for (const [key, value] of Object.entries(SECRETS)) await a.store.saveSetting(key, value);
  await a.store.saveSetting('fileNameTemplate', '{service}/{author_name}/{post_date}/{file_name}');
  await a.store.saveSetting('bulkDownloadMode', 'multiple');
  await a.store.saveSetting('ignoredFileExtensions', ['psd', 'zip']);
  await a.store.saveSetting('savedFileNameTemplates', [{ name: 'Mine', template: '{author_name}/{file_name}' }]);
  await a.store.saveSetting('zipCompressionLevel', 6);
  await a.store.saveSetting('imageTranslateLineSpacing', 1.5);
  a.registry.setModuleEnabled('demo', false);
  a.registry.setModuleSetting('demo', 'mode', 'b');
  a.registry.setModuleSetting('demo', 'notes', 'line 1\nline 2');
  a.require('src/state/kuiState.ts').setEmbedRules({ 'mega.nz': 'button', 'x.com': 'hide' });
  a.gm.set('kui_comments_layout', 'grid');
  a.gm.set('kui.video.loop', true);
  a.gm.set('i18n.lang', 'ru');
  a.gm.set('ui.sidebar.collapsed', 's1 s3');
  a.gm.set('mod.creators.overview.collapsed.tags', true);
  a.gm.set('postBlocks.order', JSON.stringify(['files', 'content', 'downloads', 'videos']));
  const themes = a.require('src/modules/restyle/store.ts');
  const local = themes.createTheme({ name: 'Mine', css: '.post-card { border-radius: 12px; }', vars: { '--kdl-site-bg': '#101010' }, script: 'console.log(1)' });
  themes.setThemeEnabled('builtin-reader', true);

  // ---- Full backup -------------------------------------------------------------------------------
  const full = await a.store.buildBackup('full');
  assert.equal(full.format, 'kdl-settings');
  assert.equal(full.version, 2);
  assert.equal(full.kind, 'full');
  assert.equal(full.script, '9.9.9');
  assert.equal(full.containsSecrets, true);
  assert.match(full.note, /private/i);
  for (const [key, value] of Object.entries(SECRETS)) assert.equal(full.settings[key], value, `full backup keeps ${key}`);
  assert.deepEqual(full.settings['postBlocks.order'], ['files', 'content', 'downloads', 'videos']);
  assert.equal(full.settings['restyle.userThemes'][0].name, 'Mine');
  assert.equal(full.settings['restyle.userThemes'][0].script, undefined, 'theme scripts are never exported');
  assert.equal(full.settings['restyle.builtins']['builtin-reader'], true);
  assert.equal(full.settings['mod.locked.one.enabled'], undefined, 'locked modules have no switch');
  await a.store.exportBackup('full');
  assert.match(a.saved[0].name, /PRIVATE/);

  // Restored into an empty browser, the backup exports the same again
  const b = makeBrowser();
  const plan = b.store.inspectImport(JSON.stringify(full));
  assert.equal(plan.kind, 'full');
  assert.equal(plan.secrets, 4);
  assert.equal(plan.script, '9.9.9');
  const result = await b.store.applyBackup(plan);
  assert.deepEqual([...result.skipped], [], 'nothing of a full backup is skipped');
  const again = await b.store.buildBackup('full');
  const strip = (backup) => {
    const settings = { ...backup.settings };
    settings['restyle.userThemes'] = settings['restyle.userThemes'].map(({ id, ...rest }) => rest);
    return JSON.parse(JSON.stringify(settings));
  };
  assert.deepEqual(strip(again), strip(full), 'full round trip');
  assert.equal(b.gm.get('kui_session_key'), 'SECRET-SESSION', 'the KUI session key follows the cookie');

  // A restore over the same browser updates its theme in place and keeps the local script
  await a.store.applyBackup(a.store.inspectImport(JSON.stringify(full)));
  const kept = themes.getThemes().filter((t) => t.origin !== 'builtin');
  assert.equal(kept.length, 1);
  assert.equal(kept[0].id, local.id);
  assert.equal(kept[0].script, 'console.log(1)');

  // ---- Without secrets ---------------------------------------------------------------------------
  const safe = await a.store.buildBackup('safe');
  const safeJson = JSON.stringify(safe);
  assert.equal(safe.kind, 'safe');
  assert.equal(safe.containsSecrets, false);
  for (const key of Object.keys(SECRETS)) assert.ok(!(key in safe.settings), `${key} is removed, not blanked`);
  for (const value of Object.values(SECRETS)) assert.ok(!safeJson.includes(value.replace('session=', '')), 'no secret value anywhere');
  assert.equal(safe.settings.fileNameTemplate, '{service}/{author_name}/{post_date}/{file_name}');

  // Imported into a browser with its own keys: the keys stay, the rest is applied
  const c = makeBrowser();
  await c.store.getSettings();
  await c.store.setSession('OWN-SESSION');
  await c.store.saveSetting('geminiApiKey', 'OWN-GEMINI');
  // Even a doctored "safe" file with a secret in it never touches the keys
  const doctored = JSON.parse(safeJson);
  doctored.settings.openaiApiKey = 'INJECTED';
  const safePlan = c.store.inspectImport(JSON.stringify(doctored));
  assert.equal(safePlan.kind, 'safe');
  assert.equal(safePlan.secrets, 0);
  await c.store.applyBackup(safePlan);
  assert.equal(c.store.state.settings.sessionCookie, 'session=OWN-SESSION');
  assert.equal(c.store.state.settings.geminiApiKey, 'OWN-GEMINI');
  assert.equal(c.store.state.settings.openaiApiKey, '');
  assert.equal(c.store.state.settings.bulkDownloadMode, 'multiple');
  assert.deepEqual([...c.store.state.settings.ignoredFileExtensions], ['psd', 'zip']);
  assert.equal(c.gm.get('mod.demo.mode'), 'b');

  // ---- Older exports: the flat object --------------------------------------------------------------
  const d = makeBrowser();
  const legacy = {
    savePostTags: false,
    sessionCookie: 'session=OLD',
    fileNameTemplate: '{author_name}/{file_name}',
    zipCompressionLevel: 'nine', // wrong type: skipped
    bulkDownloadMode: 'sideways', // not an allowed value: skipped
    kui_embed_rules: { 'MEGA.nz ': 'button', 'bad.example': 'explode' },
    kui_comments_limit: 12,
    'mod.demo.enabled': false,
    'mod.demo.mode': 'z', // not an option: skipped
    somethingElse: 1,
  };
  const legacyPlan = d.store.inspectImport(JSON.stringify(legacy));
  assert.equal(legacyPlan.kind, 'legacy');
  assert.equal(legacyPlan.secrets, 1);
  const count = await d.store.importSettings(JSON.stringify(legacy));
  assert.equal(count, 6);
  assert.equal(d.store.state.settings.savePostTags, false);
  assert.equal(d.store.state.settings.sessionCookie, 'session=OLD');
  assert.equal(d.store.state.settings.zipCompressionLevel, 0);
  assert.equal(d.store.state.settings.bulkDownloadMode, 'single');
  assert.deepEqual(JSON.parse(d.gm.get('kui_embed_rules')), { 'mega.nz': 'button' });
  assert.equal(d.gm.get('mod.demo.enabled'), false);
  assert.equal(d.gm.has('mod.demo.mode'), false);
  const legacyResult = await d.store.applyBackup(legacyPlan);
  assert.deepEqual([...legacyResult.skipped].sort(), ['bulkDownloadMode', 'mod.demo.mode', 'somethingElse', 'zipCompressionLevel']);

  // Not ours at all
  assert.throws(() => d.store.inspectImport('{"hello": 1}'), /settings.import.notSettings/);
  assert.throws(() => d.store.inspectImport('nope'), /settings.import.notJson/);
  assert.throws(() => d.store.inspectImport(JSON.stringify({ format: 'kdl-settings', version: 99, settings: {} })), /settings.import.newerVersion/);
  assert.equal(d.store.inspectImport(JSON.stringify({ format: 'kdl-ai-pack', pack: 'packaging', settings: {} })).kind, 'ai');
  assert.equal(d.store.inspectImport(JSON.stringify({ format: 'kdl-theme', version: 1, theme: {} })).kind, 'theme');

  console.log('settings backup checks passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
