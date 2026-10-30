/** Source-bound noncritical contact calibration, not normal-play acceptance. */
import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
const data=JSON.parse(await readFile('shared/data/act4/pilot-combat-reference.json')),bytes=await readFile(data.evidence.fixture),fixture=JSON.parse(bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),data.evidence.sha256);
for(const [file,hash] of Object.entries(data.evidence.sourceHashes))assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),hash,'Damage source changed: rerun reference matrix '+file);
assert.equal(fixture.damage.rows.length,56);assert.equal(fixture.incoming.rows.length,9);const stage=data.stages[31];assert.equal(stage.referenceHp,1085);for(const row of fixture.damage.rows)assert.equal(row.actorBody.h,92);for(const row of fixture.incoming.rows)assert.equal(row.targetBody.h,92);
for(const [role,r]of Object.entries(stage.roles)){if(role==='midboss'){assert.equal(r.hp,Math.round(.75*(2*r.plan.guardFullPartyDamage+.5*r.plan.exposedFullPartyDamage)));assert.equal(r.plan.partyRounds,2.5);continue;}
 for(const skill of r.counterSkills){const measured=fixture.damage.rows.find(q=>q.role===role&&q.skill===skill&&q.direction==='front');assert(measured&&!measured.critical&&measured.uniqueTargets===1);assert(Math.ceil(r.hp/measured.perTargetCastDamage)<=2,role+'/'+skill);}
 for(const [skill,d]of Object.entries(r.incomingDamagePerAttackUnit)){assert(d>0);const m=fixture.incoming.rows.find(q=>q.role===role&&q.skill===skill);assert.equal(d,m.perTargetCastDamage/m.attack);}
}
const legacy=fixture.damage.legacyReference.shot,current=fixture.damage.rows.find(r=>r.role==='bow'&&r.skill==='A01').effectiveDamage;assert(legacy>current*1.9,'P06 regression: obsolete LA01 is not a current basic-hit reference');assert.equal(stage.roles.guard.hp,266);assert.equal(stage.roles.midboss.hp,1191);
console.log('PASS P06: fixed current-skill role counters, per-skill incoming coefficients, source hashes; no play acceptance claim');

const preflightBytes=await readFile('tests/fixtures/act4-pilot-app-preflight31.json');for(const matrix of [fixture.damage,fixture.incoming]){assert.equal(matrix.preflight.sha256,createHash('sha256').update(preflightBytes).digest('hex'));assert.equal(matrix.preflight.checked.length,38);assert.equal(matrix.preflight.training,false);assert.equal(matrix.preflight.mode,'campaign');assert(matrix.preflight.excluded.includes('revival'));}
