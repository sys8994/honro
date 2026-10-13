// Verify command wiring without running the expensive map audit or browsers.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
const {scripts} = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const rootScripts = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url))).scripts;
const staticChecks = [
  'node tests/rc20-map-audit.mjs',
  'node tests/impact-audit.mjs',
  'node tests/audio-audit.mjs',
  'node tests/balance-report.mjs',
  'node tests/rc13-balance-audit.mjs',
  'node tests/charge-audit.mjs',
  'node tests/party-pacing.mjs',
];
const browsers = [
  'python -X utf8 tests/rc20-browser.py',
  'python -X utf8 tests/rc21-performance.py',
];
const planCheck = 'node --test tests/verification-plan.mjs';
function expand(name, commands, ancestors = []) {
  assert.ok(!ancestors.includes(name), `Recursive npm script: ${name}`);
  assert.equal(typeof commands[name], 'string', `Missing script: ${name}`);
  return commands[name].split(' && ').flatMap(command => {
    // Only unconditional fail-fast chains are supported. No env/caching bypass.
    assert.ok(!/[&|;\n]/.test(command), `Unexpected shell control: ${command}`);
    const nested = /^npm (?:run (\S+)|(test))$/.exec(command);
    return nested ? expand(nested[1] || nested[2], commands, [...ancestors, name]) : [command];
  });
}
function assertCoverage(commands) {
  assert.deepEqual(expand('test', commands), staticChecks);
  assert.deepEqual(expand('test:rc21:browser', commands), browsers);
  assert.deepEqual(expand('test:rc21', commands), [staticChecks[0], ...browsers]);
  const aggregate = expand('verify', commands);
  assert.deepEqual(aggregate, [planCheck, 'tsc --project engine/tsconfig.json', ...staticChecks, ...browsers]);
  assert.equal(new Set(aggregate).size, aggregate.length, 'Duplicate aggregate checks');
}
test('aggregate runs every required game check once; standalone RC21 remains complete', () => {
  assertCoverage(scripts);
});
test('root verify still reaches game verification once before integration and performance', () => {
  const root = rootScripts.verify.split(' && ');
  assert.equal(root.filter(command => command === 'npm --prefix game run verify').length, 1);
  assert.deepEqual(root.slice(-3), [
    'npm --prefix game run verify', 'npm run test:integration', 'npm run test:performance',
  ]);
});
for (const [name, mutate] of [
  ['duplicated map audit', s => { s.verify += ' && node tests/rc20-map-audit.mjs'; }],
  ['missing standalone map audit', s => { s['test:rc21'] = 'npm run test:rc21:browser'; }],
  ['missing browser regression', s => { s['test:rc21:browser'] = browsers[1]; }],
  ['missing performance regression', s => { s['test:rc21:browser'] = browsers[0]; }],
  ['changed command options', s => { s.test = s.test.replace('node tests/rc20', 'node --expose-gc tests/rc20'); }],
  ['failure suppression', s => { s.verify += ' || true'; }],
  ['recursive alias', s => { s['test:rc21:browser'] = 'npm run test:rc21'; }],
]) {
  test(`coverage contract rejects ${name}`, () => {
    const changed = {...scripts};
    mutate(changed);
    assert.throws(() => assertCoverage(changed));
  });
}
