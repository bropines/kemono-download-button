const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Which way a navigation goes (src/modules/pageTransitions)
const window = { location: { href: 'https://kemono.cr/fanbox/user/1' } };
const mod = {};
const source = ts.transpileModule(fs.readFileSync('src/modules/pageTransitions/index.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
vm.runInNewContext(source, { exports: mod, window, URL, require: () => ({ onCloak() {}, onReveal() {} }) });
const { directionTo, pageTransitionsModule } = mod;
const tabs = ['/fanbox/user/1', '/fanbox/user/1/fancards', '/fanbox/user/1/links'];

assert.equal(directionTo('/fanbox/user/1/links', tabs), 'next', 'a later creator tab slides in from the right');
window.location.href = 'https://kemono.cr/fanbox/user/1/links';
assert.equal(directionTo('/fanbox/user/1', tabs), 'prev', 'an earlier tab from the left');
window.location.href = 'https://kemono.cr/fanbox/user/1?o=50';
assert.equal(directionTo('/fanbox/user/1?o=100', tabs), 'next', 'the next page of posts');
assert.equal(directionTo('/fanbox/user/1', tabs), 'prev', 'the previous page of posts');
assert.equal(directionTo('/fanbox/user/1/post/9', tabs), 'in', 'a post rises in');
window.location.href = 'https://kemono.cr/fanbox/user/1/post/9';
assert.equal(directionTo('/fanbox/user/1', []), 'out', 'back up to the creator');
assert.equal(directionTo('/artists', []), 'in', 'anywhere else');

const css = pageTransitionsModule.styles();
assert.doesNotMatch(css, /scale\(/, 'nothing zooms: a full-width background shows it');
assert.match(css, /prefers-reduced-motion: no-preference/, 'nothing moves with reduced motion');
assert.equal(JSON.stringify(pageTransitionsModule.requires), '["ui.shadcn"]', 'goes with the redesign');

console.log('page transitions checks passed');
