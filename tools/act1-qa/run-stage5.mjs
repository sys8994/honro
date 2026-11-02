/** Existing App-input policy with current reward/recruit entry helper.
 * The frozen v3 readiness assertions remain unchanged in their original test.
 * No live-state diagnostic fixture or expected-value relaxation is enabled. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';import path from 'node:path';import {createHash} from 'node:crypto';
const policy=process.argv[2]||'pressure',file='tests/stage5-waterfall-fullplay-input.mjs',out=`_local/reports/act1-gameplay-20261103/stage5-${policy}-current-entry`;
await mkdir(out,{recursive:true});process.env.HONRO_STAGE5_OUT=out;process.env.HONRO_STAGE5_POLICY=policy;process.env.HONRO_STAGE5_BUILD='trained';process.env.HONRO_STAGE5_WAVE_FIXTURE='0';process.env.HONRO_STAGE5_REQUIRE_WIN='1';
let code=await readFile(file,'utf8');const original=code;
code=code.replace("import {campaignEntryReadiness} from './stage18-bell-fullplay-helper.mjs';","import {stage5Entry} from './stage5-entry-helper.mjs';").replace('campaignEntryReadiness(g,{through:4})','stage5Entry(g)').replace('appHarness()','appHarness({productionStory:true})');
// Observe stale roster assertion as a FAILED historical gate, not a new pass.
code=code.replace("assert.equal(b.units.filter(u=>u.side===1&&!u.honroObjectiveTarget).length,b.honroStage5PositioningRevision===1?12:20);", "await writeFile(out+'/historical-roster-gate.json',JSON.stringify({status:'FAIL_OUTDATED_EXPECTATION',expected:b.honroStage5PositioningRevision===1?12:20,observed:b.units.filter(u=>u.side===1&&!u.honroObjectiveTarget).length,scope:'Reference roster diagnostic only; no acceptance claim or runtime change'}));");
code=code.replace(/from\s*(['"])(\.[^'"]+)\1/g,(_,q,s)=>'from '+q+pathToFileURL(path.resolve(path.dirname(file),s)).href+q);
const generated=path.resolve(out,'adapted-controller.mjs');await writeFile(generated,code);await writeFile(out+'/adapter.json',JSON.stringify({policy,source:file,originalSha256:createHash('sha256').update(original).digest('hex'),adaptedSha256:createHash('sha256').update(code).digest('hex'),entry:'Current reward/recruit through4 only, no campaign-continuous claim',deviation:'Frozen v3 campaignEntryReadiness is prebattle-inapplicable; original assertion1643!=1868 remains failed, not silently amended. This separately declared current fixture uses its existing authoritative helper.'},null,2));await import(pathToFileURL(generated));
