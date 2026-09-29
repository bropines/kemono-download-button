// Prints the CHANGELOG.md section for a version (default: package.json's) to stdout.
// Exits 1 when there is none, so a release cannot go out without its notes.
import fs from 'fs';

const version = (process.argv[2] ?? JSON.parse(fs.readFileSync('package.json', 'utf8')).version).replace(/^v/, '');
const lines = fs.readFileSync('CHANGELOG.md', 'utf8').split(/\r?\n/);
const start = lines.findIndex((line) => line.startsWith(`## [${version}]`));

if (start === -1) {
  console.error(`CHANGELOG.md has no "## [${version}]" section. Move the Unreleased notes under it before tagging.`);
  process.exit(1);
}
const end = lines.findIndex((line, index) => index > start && line.startsWith('## ['));
const body = lines.slice(start + 1, end === -1 ? undefined : end).join('\n').trim();

if (!body) {
  console.error(`The "## [${version}]" section of CHANGELOG.md is empty.`);
  process.exit(1);
}
console.log(body);
