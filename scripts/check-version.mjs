// package.json, the userscript header in src/index.ts and the built script must carry one version.
// On a tag build the tag has to name it too, so a release can never ship a different script.
import fs from 'fs';

const headerVersion = (file) => fs.readFileSync(file, 'utf8').match(/^\/\/ @version\s+(\S+)/m)?.[1] ?? '(missing)';

const found = {
  'package.json': JSON.parse(fs.readFileSync('package.json', 'utf8')).version,
  'src/index.ts': headerVersion('src/index.ts'),
  'kemono-download-button.user.js': headerVersion('kemono-download-button.user.js')
};
if (process.env.GITHUB_REF_TYPE === 'tag') {
  found[`tag ${process.env.GITHUB_REF_NAME}`] = process.env.GITHUB_REF_NAME.replace(/^v/, '');
}

if (new Set(Object.values(found)).size !== 1) {
  console.error('Versions disagree:');
  for (const [where, version] of Object.entries(found)) console.error(`  ${where}: ${version}`);
  process.exit(1);
}
console.log(`Version ${found['package.json']} in ${Object.keys(found).join(', ')}`);
