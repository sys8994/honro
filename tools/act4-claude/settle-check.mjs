/** Body-trap sweep on real Engine physics: drop a production body every 30 units
 * along every walk top; fail where it settles without a support or cannot walk
 * out in either direction (V crevices, seams between solids). Geometry only. */
import {readFile,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../../game/tests/helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const [n,dir]=[Number(process.argv[2]),process.argv[3]],stage=JSON.parse(await readFile(dir+'/stage.json')),spec=JSON.parse(await readFile(dir+'/blueprint.json'));
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,profile=C.defaults();g.HonroEquipment.fresh(profile);profile.recruited=g.HonroStageRules.stageParty(n);
const {b,e}=battlefield(g,n,{profile}),tpl=structuredClone(e.heroesAlive().find(u=>u.cls==='knight')||e.heroesAlive()[0]);
const compiled=g.HonroMaps.compile(stage,{...g.HONRO_PROJECT,stages:[stage]});b.terrain=compiled.terrain;b.width=stage.width;b.height=stage.height;b.projectiles=[];b.phase='aim';b.side=0;e.checkEnd=()=>false;
const bad=[];let tested=0;
const inside=(x,y)=>stage.terrains.some(t=>{if(t.oneWay)return false;let hit=false;const ps=t.points;for(let i=0,j=ps.length-1;i<ps.length;j=i++){const a=ps[i],c=ps[j];if((a.y>y)!==(c.y>y)&&x<(c.x-a.x)*(y-a.y)/(c.y-a.y)+a.x)hit=!hit;}return hit;});
for(const f of spec.surfaces){const xs=f.top.map(p=>p[0]);for(let x=Math.min(...xs)-80;x<=Math.max(...xs)+80;x+=30){
 const y0=Math.min(...f.top.map(p=>p[1]))-160;if([0,-40,-80].some(dy=>inside(x,y0+dy))||[-25,25].some(dx=>inside(x+dx,y0)))continue;
 const u=structuredClone(tpl);Object.assign(u,{x,y:y0,vx:0,vy:0,jumping:false,airborne:true,acted:false,moveLeft:99999});delete u.platformDrop;b.units=[u];b.active=u.id;
 for(let i=0;i<240;i++){e.integrateBody(u,C.STEP);if(i>10&&Math.abs(u.vy)<1e-6)break;}u.airborne=false;u.jumping=false;
 if(!e.grounded(u)||u.y>stage.height)continue;tested++;
 const sup=e.contactSurface(u.x,u.y-.2,u.y+.2)?.t?.id,start={x:u.x,y:u.y};let moved=0;
 let wedged=null;
 for(const d of [1,-1]){const v=structuredClone(u);b.units=[v];b.active=v.id;for(let i=0;i<180;i++){e.move(d,C.STEP);e.integrateBody(v,C.STEP);}moved=Math.max(moved,Math.abs(v.x-start.x));
  // Walking into walls must leave the body on a real support, never wedged in a seam.
  for(let i=0;i<60;i++)e.integrateBody(v,C.STEP);v.airborne=false;v.jumping=false;if(Math.abs(v.vy)<1e-6&&!e.contactSurface(v.x,v.y-.2,v.y+.2)?.t)wedged={dir:d,x:Math.round(v.x),y:Math.round(v.y)};}
 if(!sup||moved<12||wedged)bad.push({surface:f.id,x:Math.round(start.x),y:Math.round(start.y),support:sup||null,moved:Math.round(moved),wedged});
}}
await writeFile(dir+'/settle-check.json',JSON.stringify({tested,bad},null,1));console.log(JSON.stringify({tested,trapped:bad.length,bad:bad.slice(0,12)}));
