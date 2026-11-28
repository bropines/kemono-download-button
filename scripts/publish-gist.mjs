// Updates the gist mirror (https://gist.github.com/bropines/d95924125e05f376d5bab737e1ed7463) with the gist build
// after a release: node scripts/publish-gist.mjs (needs the GitHub CLI logged in with the gist scope).
// The workflow's token cannot write gists, so this one step runs locally.
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GIST_ID = 'd95924125e05f376d5bab737e1ed7463';
const source = path.join(rootDir, 'builds/kemono-download-button.gist.user.js');
if (!fs.existsSync(source)) throw new Error('Run npm run build first: builds/kemono-download-button.gist.user.js is missing');

// gh gist edit takes the gist's file name from the local file's name
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kdl-gist-'));
const named = path.join(dir, 'kemono-download-button.user.js');
fs.copyFileSync(source, named);
try {
  execFileSync('gh', ['gist', 'edit', GIST_ID, '-f', 'kemono-download-button.user.js', named], { stdio: 'inherit' });
  const version = fs.readFileSync(source, 'utf-8').match(/@version\s+(\S+)/)?.[1];
  console.log(`Gist updated to ${version}: https://gist.github.com/bropines/${GIST_ID}`);
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
