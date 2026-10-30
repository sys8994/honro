/** Drop one production body at (x,y) on a built skeleton; report where it rests. */
import {readFile} from 'node:fs/promises';
import {runtime,battlefield} from '../../game/tests/helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const [n,dir,...pts]=process.argv.slice(2),stage=JSON.parse(await readFile(dir+'/stage.json'));
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,profile=C.defaults();g.HonroEquipment.fresh(profile);profile.recruited=g.HonroStageRules.stageParty(Number(n));
const {b,e}=battlefield(g,Number(n),{profile}),tpl=structuredClone(e.heroesAlive().find(u=>u.cls==='knight'));
const compiled=g.HonroMaps.compile(stage,{...g.HONRO_PROJECT,stages:[stage]});b.terrain=compiled.terrain;b.projectiles=[];e.checkEnd=()=>false;
for(const p of pts){const [x,y,vx]=p.split(',').map(Number),u=structuredClone(tpl);Object.assign(u,{x,y,vx:vx||0,vy:0,airborne:true,jumping:false});b.units=[u];b.active=u.id;
 let i=0;for(;i<600;i++){e.integrateBody(u,C.STEP);}const s=e.contactSurface(u.x,u.y-.2,u.y+.2)?.t?.id;console.log(JSON.stringify({from:[x,y,vx||0],end:[Math.round(u.x),Math.round(u.y)],vy:+u.vy.toFixed(2),grounded:e.grounded(u),airborne:u.airborne,support:s||null}));}
