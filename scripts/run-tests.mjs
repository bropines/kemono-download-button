// Runs every tests/*.cjs check in its own process. A check passes only when it exits with 0 *and* prints its
// "checks passed" line: an async check whose promise never settles lets Node exit quietly with 0.
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const files = readdirSync('tests').filter((name) => name.endsWith('.cjs')).sort();
let failed = 0;
for (const name of files) {
  const run = spawnSync(process.execPath, [`tests/${name}`], { encoding: 'utf8', timeout: 60000 });
  const output = `${run.stdout || ''}${run.stderr || ''}`;
  if (run.status === 0 && /checks passed/.test(run.stdout || '')) {
    console.log(`ok   ${name}`);
    continue;
  }
  failed++;
  const why = run.error ? run.error.message : run.status !== 0 ? `exit code ${run.status}` : 'finished without its "checks passed" line (a pending promise never settled?)';
  console.log(`FAIL ${name}: ${why}`);
  if (output.trim()) console.log(output.trim().split('\n').slice(0, 20).map((line) => `     ${line}`).join('\n'));
}
console.log(failed ? `\n${failed} of ${files.length} checks failed` : `\nall ${files.length} checks passed`);
process.exitCode = failed ? 1 : 0;
