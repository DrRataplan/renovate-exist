// End-to-end test: publish fixture packages to a running public-repo, run Renovate
// with this preset against test/app, and compare the proposed updates with test/expected.json.
//
// Usage: node test/run.mjs <dir with .xar files>
// Env: PUBLIC_REPO_URL (default http://localhost:8080/exist/apps/public-repo),
//      PUBLIC_REPO_USERNAME / PUBLIC_REPO_PASSWORD (default repo / repo),
//      RENOVATE_BIN (default: npx renovate)
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const here = new URL('.', import.meta.url).pathname;
const baseUrl = process.env.PUBLIC_REPO_URL ?? 'http://localhost:8080/exist/apps/public-repo';
const auth = btoa(`${process.env.PUBLIC_REPO_USERNAME ?? 'repo'}:${process.env.PUBLIC_REPO_PASSWORD ?? 'repo'}`);
const xarDir = process.argv[2];

for (const file of (await fs.readdir(xarDir)).filter((f) => f.endsWith('.xar'))) {
  const body = new FormData();
  body.append('files[]', new Blob([await fs.readFile(join(xarDir, file))]), file);
  const res = await fetch(`${baseUrl}/publish`, { method: 'POST', body, headers: { Authorization: `Basic ${auth}` } });
  assert.ok(res.ok, `publishing ${file} failed: ${res.status} ${await res.text()}`);
}

const preset = JSON.parse(await fs.readFile(join(here, '..', 'default.json'), 'utf8'));
const registryUrl = new URL(preset.customDatasources['exist-public-repo'].defaultRegistryUrlTemplate);
preset.customDatasources['exist-public-repo'].defaultRegistryUrlTemplate = `${baseUrl}/public/apps.xml${registryUrl.search}`;

const work = await fs.mkdtemp(join(tmpdir(), 'renovate-exist-'));
const configFile = join(work, 'config.json');
await fs.writeFile(configFile, JSON.stringify({ ...preset, onboarding: false, requireConfig: 'optional', enabledManagers: ['custom.regex'] }));
const repo = join(work, 'app');
await fs.cp(join(here, 'app'), repo, { recursive: true });
execFileSync('git', ['init', '-q'], { cwd: repo });
execFileSync('git', ['add', '-A'], { cwd: repo });
execFileSync('git', ['-c', 'user.name=test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'init'], { cwd: repo });

const [cmd, ...args] = (process.env.RENOVATE_BIN ?? 'npx renovate').split(' ');
const run = spawnSync(cmd, [...args, '--platform=local', '--dry-run=lookup'], {
  cwd: repo,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
  env: { ...process.env, RENOVATE_CONFIG_FILE: configFile, LOG_LEVEL: 'debug', LOG_FORMAT: 'json' },
});
assert.equal(run.status, 0, run.stdout + run.stderr);

const logs = run.stdout.split('\n').filter(Boolean).map((line) => JSON.parse(line));
for (const log of logs.filter((l) => l.level >= 40)) console.warn('Renovate:', log.msg, log.err?.message ?? '');
const result = logs.find((l) => l.msg === 'packageFiles with updates');
assert.ok(result, 'Renovate did not report any package files');

const actual = {};
for (const file of Object.values(result.config).flat()) {
  for (const dep of file.deps) actual[dep.packageName] = (dep.updates ?? []).map((u) => u.newValue);
}
console.log(JSON.stringify(actual, null, 2));
assert.deepEqual(actual, JSON.parse(await fs.readFile(join(here, 'expected.json'), 'utf8')));
console.log('All expected updates found.');
