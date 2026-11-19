import fs from 'node:fs';import assert from 'node:assert/strict';
import {supportPoint,applyAct4FinaleRevision} from '../shared/act4-finale-revision.mjs';
import {authorAct4Stage35Encounter} from '../shared/act4-stage35-encounter.mjs';
const project=JSON.parse(fs.readFileSync('shared/data/act4/world.json','utf8')),s=project.stages.find(s=>s.metadata?.stageId===35),before=JSON.stringify(s),out=authorAct4Stage35Encounter(s,supportPoint);
assert.equal(JSON.stringify(s),before);assert.equal(out.units.filter(u=>u.team==='enemy').length,30);
assert.deepEqual({...s,units:null,encounters:null},{...out,units:null,encounters:null});
assert.deepEqual(authorAct4Stage35Encounter(out,supportPoint),out);
for(const u of out.units){const old=s.units.find(v=>v.id===u.id),strip=v=>{const c=structuredClone(v);delete c.x;delete c.y;delete c.encounterGroup;if(c.stageOverrides){delete c.stageOverrides.group;delete c.stageOverrides.honroEncounterSupport;}return c;};assert.deepEqual(strip(u),strip(old));}
const ids=out.encounters.flatMap(e=>e.unitIds);assert.equal(ids.length,30);assert.equal(new Set(ids).size,30);for(const e of out.encounters)for(const id of e.unitIds)assert.equal(out.units.find(u=>u.id===id).encounterGroup,e.id);
const integrated=applyAct4FinaleRevision({stages:[s]}).stages[0];assert.deepEqual(integrated,out);
for(const id of [31,32,33,34,36,37,38,39,40]){const other={...s,metadata:{...s.metadata,stageId:id}};assert.equal(authorAct4Stage35Encounter(other,supportPoint),other);}
console.log('Stage35 production wiring,30 enemies,unique groups,terrain/events/objectives/stats preserved,other stage identity,immutability and idempotence PASS');
