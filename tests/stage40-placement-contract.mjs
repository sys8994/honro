import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';
import {authorAct4Finale} from '../shared/act4-finale-author.mjs';import {supportPoint} from '../shared/act4-finale-revision.mjs';
const old=process.env.HONRO_BASELINE_AUTHOR?fs.readFileSync(process.env.HONRO_BASELINE_AUTHOR,'utf8'):execFileSync('git',['show','7d238d20663c3ceffe430eb0304e01516ae625cf:shared/act4-finale-author.mjs'],{encoding:'utf8'});
const {authorAct4Finale:beforeAuthor}=await import('data:text/javascript;base64,'+Buffer.from(old).toString('base64'));
const original=JSON.parse(fs.readFileSync('shared/data/act4/world.json')).stages.find(s=>s.metadata.stageId===40);
const before=beforeAuthor(structuredClone(original),supportPoint),after=authorAct4Finale(structuredClone(original),supportPoint);
const stable=u=>{const v=structuredClone(u);delete v.x;delete v.y;delete v.encounterGroup;for(const k of ['group','honroDensityCell','honroEncounterSupport','honroPilotRelocation'])delete v.stageOverrides?.[k];return v;};
assert.deepEqual(after.units.map(stable),before.units.map(stable),'IDs/species/budget/stats/roles/boss preserved');
for(const k of ['terrains','elements','objectives','events','design'])assert.deepEqual(after[k],before[k],k+' unchanged');
assert.deepEqual(after.units.filter(u=>u.team!=='enemy'),before.units.filter(u=>u.team!=='enemy'));
const enemies=after.units.filter(u=>u.team==='enemy');assert.equal(enemies.length,42);assert.equal(enemies.filter(u=>u.boss===40).length,1);
const safe=after.design.act4.geometry40.safeZone;
for(const u of enemies){assert.deepEqual({x:u.x,y:u.y},supportPoint(after,u.stageOverrides.honroEncounterSupport,u.x));assert(!(u.x>=safe.x1&&u.x<=safe.x2&&u.y>=safe.y1&&u.y<=safe.y2),'safe zone clear '+u.id);}
for(let i=0;i<enemies.length;i++)for(let j=i+1;j<enemies.length;j++){const a=enemies[i],b=enemies[j];assert(Math.abs(a.x-b.x)>=50||Math.abs(a.y-b.y)>=130,'body overlap '+a.id+' '+b.id);}
assert.equal(enemies.filter(u=>u.x>3600).length,16,'east junction, arrival, upper watch and rear guard');
assert.equal(after.encounters.length,16);assert.equal(after.initialState.honroActiveLimit,6);
assert.deepEqual(enemies.find(u=>u.boss===40),before.units.find(u=>u.boss===40)?{...before.units.find(u=>u.boss===40),encounterGroup:'place40-tide-keeper',stageOverrides:{...before.units.find(u=>u.boss===40).stageOverrides,group:155,honroDensityCell:'place40-tide-keeper'}}:null);
assert.deepEqual(authorAct4Finale(after,supportPoint),after,'idempotent');
fs.mkdirSync('_local/reports/monster-placement',{recursive:true});fs.writeFileSync('_local/reports/monster-placement/stage40-before-after.json',JSON.stringify({before:before.units,after:after.units,encounters:after.encounters},null,2));
console.log('PASS stage40 author contract: 42 identities/budgets, 16 places, 16 east, support, collision-free initial bodies, protected safe zone, unchanged terrain/story/civilian routes. Not gameplay/visual acceptance.');
