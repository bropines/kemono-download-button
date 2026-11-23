const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

// src/utils/pageBody.ts: what counts as "a web page saved in place of a file"
const js = ts.transpileModule(fs.readFileSync('src/utils/pageBody.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const m = { exports: {} };
new Function('exports', 'module', js)(m.exports, m);
const { bytesLookLikePage, textLooksLikePage } = m.exports;
const bytes = (text) => Uint8Array.from(text, (c) => c.charCodeAt(0)).buffer;

const nginx302 = '<html>\r\n<head><title>302 Found</title></head>\r\n<body>\r\n<center><h1>302 Found</h1></center>\r\n<hr><center>nginx</center>\r\n</body>\r\n</html>\r\n';
assert.equal(nginx302.length, 138, 'the page found in the phone cache is 138 bytes');
assert.ok(bytesLookLikePage(bytes(nginx302)), "nginx's 302 page");
assert.ok(bytesLookLikePage(bytes('  <!DOCTYPE html><html>')), 'a doctype page with leading spaces');
assert.ok(bytesLookLikePage(new Uint8Array(bytes('<center>error</center>'))), 'a typed array view');
assert.ok(textLooksLikePage(nginx302), 'the same page as text');
assert.ok(bytesLookLikePage(bytes('\xef\xbb\xbf<!DOCTYPE html><html>')), 'a page behind a UTF-8 byte order mark');
assert.ok(textLooksLikePage('﻿<html><body>'), 'the same as decoded text');
assert.ok(!bytesLookLikePage(bytes('\xef\xbb\xbfplain text')), 'a text file with a byte order mark');
assert.ok(!bytesLookLikePage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70]).buffer), 'a JPEG');
assert.ok(!bytesLookLikePage(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer), 'a PNG');
assert.ok(!bytesLookLikePage(bytes('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), 'an SVG is a file, not a page');
assert.ok(!bytesLookLikePage(bytes('plain text notes')), 'a text file');
assert.ok(!bytesLookLikePage(new ArrayBuffer(0)), 'an empty buffer');
assert.ok(!bytesLookLikePage(null), 'nothing');
console.log('page-body: all checks passed');
