import fs from 'node:fs';
process.env.HONRO_ACT4_RELEASE='1';process.env.HONRO_ACT5_RELEASE='1';
const {runtime,battlefield}=await import('../game/tests/helpers.mjs');
const g=await runtime({legacyMaps:false,productionStory:true});
fs.mkdirSync('_local/reports/monster-placement',{recursive:true});const all=[];
for(let id=1;id<=50;id++){try{const {b}=battlefield(g,id), units=b.units.filter(u=>u.side===1&&!u.dead&&!u.honroObjectiveTarget).map(u=>({id:u.id,kind:u.kind||u.type,role:u.role,x:u.x,y:u.y,group:u.group,support:u.honroEncounterSupport,elite:u.elite,boss:u.boss}));const xs=units.map(u=>u.x),ys=units.map(u=>u.y);all.push({id,n:units.length,width:b.width,height:b.height,rangeX:[Math.min(...xs),Math.max(...xs)],rangeY:[Math.min(...ys),Math.max(...ys)],units});console.log(id,units.length,Math.min(...xs),Math.max(...xs));}catch(e){all.push({id,error:e.message});console.log(id,e.message)}}fs.writeFileSync('_local/reports/monster-placement/all50-final-initial.json',JSON.stringify(all,null,2));
