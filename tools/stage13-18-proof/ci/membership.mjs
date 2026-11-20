import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {runtime} from '../../game/tests/helpers.mjs';
const mode=process.argv[2];
assert(['before','after'].includes(mode));
const g=await runtime({legacyMaps:false,productionStory:true});
const load=p=>JSON.parse(readFileSync(p,'utf8'));
const raw=load('shared/data/campaign.json'), compact=load('shared/data/act2/stage18-compact-package.json');
const official=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===18);
assert.deepEqual([official.width,official.height,official.initialState.honroAct2CompactRevision],[8200,7000,1]);
assert.equal(official.encounters.length,22);
const results=[];
for (const [label,st,library] of [
 ['compat',raw.stages[17],raw.library],['reviewed',compact.source,g.HONRO_PROJECT.library],['compact',compact.stage,g.HONRO_PROJECT.library]
]) {
 const project={...raw,library,stages:[st]};
 // The unmodified official project schema is used here. The all-stage
 // Stage22 author/finalizer independently enforces every schema rule below.
 const receipt=Array.from(g.HonroMaps.validate(g.HonroMaps.normalize(project)));
 const missing=receipt.filter(v=>v.level==='err' && /: missing member /.test(v.text));
 assert.equal(missing.length,mode==='before'?45:0,label);
 assert.equal(st.encounters.length,22,label);
 assert.equal(st.encounters.filter(v=>!v.unitIds.length).length,mode==='before'?0:12,label);
 results.push({label,encounters:22,missingMembers:missing.length,empty:st.encounters.filter(v=>!v.unitIds.length).length,otherSchemaIssueCount:receipt.filter(v=>v.level==='err'&&!missing.includes(v)).length});
}
const before=mode==='before';
assert.equal(official.encounters.flatMap(q=>q.unitIds).filter(id=>!official.units.some(u=>u.id===id)).length,before?45:0);
console.log(JSON.stringify({mode,sourceAuthorLoadedCompiledCompact:true,results}));
