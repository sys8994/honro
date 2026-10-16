// Focused geometry probes: isolated bodies and finite ordinary jump resources.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
import {isolatedHero} from './act1-spatial-test-helpers.mjs';
import {ground} from '../tools/map-forge/stage21-eupseong.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[];
const sites=[['outside-stall',440,390,2810],['cloth-shelter',1550,400,2640],['inner-home',3590,250,2760],['potter-home',4260,340,2420],['stable',4870,200,2530],['office-store',5990,350,2220],['office-hall',5369,412,2020],['gate',2277,411,2130]];
for(const cls of C.CLASS_IDS)for(const [id,x,w,floor]of sites){
 const {b,e,u}=isolatedHero(g,21,cls),roof=b.terrain.find(t=>t.id==='eup21-'+id+'-roof');assert(roof?.oneWay);
 // Start beneath the left eave on its real street/terrace/crown support.
 const px=x-w/2-20;Object.assign(u,{x:px,y:['potter-home','office-hall','gate'].includes(id)?floor:ground(px),vx:0,vy:0,jumping:false,airborne:false,acted:false,moveLeft:u.maxMove});
 if(id==='office-hall'||id==='gate'){
  Object.assign(u,{x:id==='office-hall'?5200:2085,y:id==='office-hall'?2130:2240});
  assert(e.grounded(u));assert(e.jump(u));for(let n=0;n<180;n++){if(Math.abs(u.x-px)>2)e.walk(u,Math.sign(px-u.x)*.35,1/120);e.integrateBody(u,1/120);}
  assert(['eup21-'+(id==='gate'?'gate':'office')+'-roof-step',roof.id].includes(e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id),id+' ordinary roof approach');
 }
 for(let n=0;n<60;n++)e.integrateBody(u,1/60);
 const start={x:u.x,y:u.y},top=C.topAt(roof,u.x);assert(e.grounded(u),id+' launch support');assert(e.jump(u),id+' ordinary jump');let min=u.y;
 for(let n=0;n<180;n++){e.integrateBody(u,1/120);min=Math.min(min,u.y);}
 const landing=e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id;
 assert.equal(landing,roof.id,JSON.stringify({id,cls,start,top,min,y:u.y,landing}));assert(min<=top+1,id+' upward pass');
 assert(e.jump(u),id+' roof positioning jump');for(let n=0;n<220;n++){if(Math.abs(u.x-x)>3)e.walk(u,Math.sign(x-u.x)*.7,1/120);e.integrateBody(u,1/120);}assert(Math.abs(u.x-x)<8,id+' center reached');assert.equal(e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id,roof.id,id+' center landing');
 assert(e.drop(),id+' drop input');for(let n=0;n<300;n++)e.integrateBody(u,1/120);
 assert(Math.abs(u.y-(id==='office-hall'?2130:id==='gate'?2240:id==='potter-home'?2420:ground(u.x)))<2,JSON.stringify({id,cls,drop:u.y,start}));assert(e.grounded(u));
 assert.equal(e.projectileCollision({x:px,y:top-35},{x:px,y:top+35},0,u.id,[],false)?.terrain?.id,roof.id);
 assert.equal(e.projectileCollision({x:px,y:top+35},{x:px,y:top-35},0,u.id,[],false),null);
 rows.push({id,cls,start,top,min,landing,drop:u.y,moveRemaining:u.moveLeft});
}
await writeFile('_local/reports/stage21-eupseong/roofs.json',JSON.stringify({scope:'32 isolated real-map jump/pass/land/drop and directional projectile probes; not normal campaign play',rows},null,2));console.log('PASS roof probes',rows.length);
