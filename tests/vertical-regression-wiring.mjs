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
for(const script of ['test:vertical-regression-wiring','test:stage14-vertical:contracts','test:encounter-density:contracts']){
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
console.log('PASS vertical regression command scope: seven14 contracts, seven density contracts, aggregate wiring and retained full density evidence');
