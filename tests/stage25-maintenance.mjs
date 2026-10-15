import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {traverse} from './act1-spatial-test-helpers.mjs';
const p=JSON.parse(readFileSync('shared/data/campaign.json')),old=JSON.parse(execFileSync('git',['show','d7c1f8457dd33decda5481c7c3b57d8505f6f157:shared/data/campaign.json'],{maxBuffer:64e6}));
for(let i=0;i<30;i++)if(i!==24)assert.deepEqual(p.stages[i],old.stages[i]);
assert.deepEqual(p.library.slice(0,old.library.length),old.library);
const s=p.stages[24],b=old.stages[24];
for(const key of ['units','markers','initialState','objectives','events','encounters','terrains','materials','anchors','environment'])assert.deepEqual(s[key],b[key],key);
assert.deepEqual(s.design.act3.crossings,b.design.act3.crossings);
assert.equal(s.design.act3.crossings.length,5);
const g=await runtime({legacyMaps:false});
for(const cls of ['archer','mage'])for(const reverse of [false,true]){
 const{b,e}=battlefield(g,25),u=b.units.find(u=>u.side===0&&u.cls===cls);b.units=[u];e.checkEnd=()=>false;
 Object.assign(u,{x:reverse?1000:620,y:4050,vx:0,vy:0,airborne:false,jumping:false});
 const r=traverse(g,b,e,u,[{x:reverse?620:1000,y:4050}],{jump:false});assert(r.passed&&!r.damage,JSON.stringify(r));
}
console.log('PASS unchanged29stages/old library/25story+units+crossings;4 basic-walk crest crossings. Enemy-free geometry fixture, not normal combat.');
