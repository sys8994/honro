/** Static command-scope guard. Does not execute browser, combat or rendering. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {scripts}=JSON.parse(await readFile('package.json','utf8'));
const offline=await readFile('tools/verify-offline.mjs','utf8');
const files=script=>script.split(' && ').map(command=>{
 assert.match(command,/^node tests\/[a-z0-9-]+\.mjs$/,'Contract commands remain explicit Node files');
 return command.slice('node tests/'.length,-'.mjs'.length);
});
assert.deepEqual(files(scripts['test:stage14-vertical:contracts']),[
 'stage14-vertical-source-boundary','stage14-vertical-composition','stage14-vertical-runtime','stage14-vertical-app-resume',
 'stage14-vertical-bridge','stage14-vertical-defense-guidance','stage14-vertical-legacy-save'
]);
assert.deepEqual(files(scripts['test:encounter-density:contracts']),[
 'encounter-density-runtime','stage8-encounter-density','stage11-encounter-density',
 'stage12-encounter-density','stage8-density-regional-entry',
 'stage161718-response-lifecycle','stage8-density-ember-recovery'
]);
assert.deepEqual(files(scripts['test:stage14-vertical:behavior']),files(scripts['test:stage14-vertical:contracts']).slice(1),'Preserve every14 behavioral contract while its old source-boundary command remains available');
assert.deepEqual(files(scripts['test:stage22-vertical:contracts']),['stage22-vertical-source-boundary','stage22-vertical-composition','stage22-vertical-runtime','stage22-vertical-app-resume','stage22-vertical-art-dispatch','stage22-vertical-activation']);
assert.equal(scripts['test:vertical-current:contracts'],'npm run test:stage14-vertical:behavior && npm run test:stage22-vertical:contracts');
for(const script of ['test:vertical-regression-wiring','test:vertical-current:contracts','test:encounter-density:contracts']){
 assert(scripts['test:integration'].includes('npm run '+script),script+' is wired into integration');
 assert(offline.includes("['run','"+script+"']"),script+' is wired into the offline check list');
}
const fullDensity=files(scripts['test:encounter-density']);
for(const name of [
 'encounter-density-runtime','encounter-density-integration','stage8-encounter-density',
 'stage11-encounter-density','stage11-density-response-pressure','stage11-density-echo-lifecycle',
 'stage11-density-real-save-continuation','stage12-encounter-density','stage161718-encounter-density',
 'stage8-density-boss-role','stage8-density-regional-entry','stage8-density-response-pressure',
 'stage2330-encounter-density','stage2330-density-response-pressure','stage161718-response-lifecycle',
 'stage161718-response-pressure','encounter-density-history-audit','stage8-bier-seam-regression',
 'stage8-density-ember-recovery'
])assert(fullDensity.includes(name),'The full historical/behavioral density suite retains '+name);
for(const kind of ['traversal','tactics','fullplay'])assert.equal(scripts['test:stage14-vertical:'+kind],'node tests/stage14-vertical-'+kind+'.mjs');
assert.equal(scripts['test:stage14-vertical:native'],'node --expose-gc tests/stage14-vertical-native-art.mjs');
for(const kind of ['traversal','fullplay'])assert.equal(scripts['test:stage22-vertical:'+kind],'node tests/stage22-vertical-'+kind+'.mjs');
assert.equal(scripts['test:stage22-vertical:native'],'node --expose-gc tests/stage22-vertical-native-art.mjs');
assert(!scripts['test:vertical-current:contracts'].match(/fullplay|native|traversal/),'Heavy evidence is a separate explicit run');
console.log('PASS current14/22 fast contracts, preserved14 historical boundary, seven density contracts and separate heavy evidence');
