import assert from 'node:assert/strict';
import {makeAct5} from '../shared/act5-world.mjs';
const {stages}=await makeAct5();
const expected={43:{count:29,required:{gateGuard:['a5-foe-0','a5-foe-2','a5-foe-7','a5-foe-8','a5-foe-10','a5-foe-11'],armorWave:['a5-foe-29','a5-foe-30','a5-foe-31','a5-foe-32']}},47:{count:19,required:{exitGuard:['a5-foe-15','a5-foe-16'],reverseGuard:['a5-foe-19','a5-foe-21','a5-foe-22']}},48:{count:19,required:{eastGuard:['a5-foe-10','a5-foe-11'],reflection:['a5-foe-19','a5-foe-20']}}};
for(const [id,e] of Object.entries(expected)){
 const s=stages[Number(id)-41], us=s.units.filter(u=>u.team==='enemy'&&!u.stageOverrides?.dead);
 assert.equal(us.length,e.count); assert.deepEqual(s.design.act5.required,e.required);
 for(let i=0;i<us.length;i++)for(let j=i+1;j<us.length;j++)
  assert(!(Math.abs(us[i].x-us[j].x)<65&&Math.abs(us[i].y-us[j].y)<90),'body overlap candidate '+id);
 const authored=us.map(u=>({...u,x:u.x/(s.width/1024),y:u.y/(s.width/1024)}));
 if(Number(id)===43){
  assert(authored.filter(u=>u.encounterGroup==='mortar').every(u=>u.y===302),'reserve belongs below arch');
  assert(!authored.some(u=>u.y===218&&u.x>455&&u.x<670),'middle transit gap');
 }
 if(Number(id)===48){
  assert(authored.filter(u=>u.encounterGroup==='westGuard').every(u=>u.x>=315&&u.x<=366),'first stake cluster');
  assert(authored.filter(u=>u.encounterGroup==='eastGuard').every(u=>u.x>=526&&u.x<=579),'second stake cluster');
  assert(!authored.some(u=>u.x>402&&u.x<505),'center activation gap');
 }
}
console.log('Act5 authored placement regression passed; this is not visual or combat acceptance.');
