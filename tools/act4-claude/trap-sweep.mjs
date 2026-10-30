/** Trap sweep on real Engine physics: a body dropped just above every upward-
 * facing collider edge (every 40u) must come to rest grounded (able to act),
 * never in the land/fall limbo of a steep face or seam. Geometry only. */
import {readFile,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../../game/tests/helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const [n,dir]=[Number(process.argv[2]),process.argv[3]],stage=JSON.parse(await readFile(dir+'/stage.json'));
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,profile=C.defaults();g.HonroEquipment.fresh(profile);profile.recruited=g.HonroStageRules.stageParty(n);
const {b,e}=battlefield(g,n,{profile}),tpl=structuredClone(e.heroesAlive().find(u=>u.cls==='knight')||e.heroesAlive()[0]);
const compiled=g.HonroMaps.compile(stage,{...g.HONRO_PROJECT,stages:[stage]});b.terrain=compiled.terrain;b.width=stage.width;b.height=stage.height;b.projectiles=[];e.checkEnd=()=>false;
const water=(stage.design?.act4?.waterPolicies||[]);
const inside=(x,y)=>stage.terrains.some(t=>{if(t.oneWay)return false;let hit=false;const ps=t.points;for(let i=0,j=ps.length-1;i<ps.length;j=i++){const a=ps[i],c=ps[j];if((a.y>y)!==(c.y>y)&&x<(c.x-a.x)*(y-a.y)/(c.y-a.y)+a.x)hit=!hit;}return hit;});
const traps=[];let tested=0;
for(const t of stage.terrains){const ps=t.points;for(let i=0;i<ps.length;i++){const a=ps[i],c=ps[(i+1)%ps.length],L=Math.hypot(c.x-a.x,c.y-a.y);if(L<8)continue;
 const nx=(c.y-a.y)/L,ny=-(c.x-a.x)/L,mx=(a.x+c.x)/2,my=(a.y+c.y)/2,flip=inside(mx+nx*3,my+ny*3)?-1:1;if(ny*flip>-0.02&&!t.oneWay)continue;
 for(let s=0;s<L;s+=40){const k=(s+20)/L;if(k>1)break;const x=a.x+(c.x-a.x)*k,y=a.y+(c.y-a.y)*k;
  for(const sx of [-30,30]){const px=x+sx,py=y-60;if(inside(px,py)||inside(px,py-100)||px<20||px>stage.width-20)continue;
   const u=structuredClone(tpl);Object.assign(u,{x:px,y:py,vx:0,vy:0,airborne:true,jumping:false});delete u.platformDrop;b.units=[u];b.active=u.id;
   for(let f=0;f<400;f++)e.integrateBody(u,C.STEP);if(u.y>stage.height-5)continue;
   if(water.some(w=>u.x>=w.x1&&u.x<=w.x2&&u.y>=w.surface-10))continue;
   if(Math.abs(u.vy)>50)continue;tested++;const cs=e.contactSurface(u.x,u.y-.3,u.y+.3),face=cs&&C.terrainSurfaces(cs.t,u.x).find(f=>Math.abs(f.y-u.y)<3),ok=!!face&&Math.abs(face.slope)<=1.35;
   if(!ok)traps.push({terrain:t.id,x:Math.round(u.x),y:Math.round(u.y),rest:cs?.t?.id||null,slope:face?+face.slope.toFixed(2):null});}}}}
const uniq=[...new Map(traps.map(t=>[Math.round(t.x/20)+':'+Math.round(t.y/20),t])).values()];
await writeFile(dir+'/trap-sweep.json',JSON.stringify({tested,traps:uniq},null,1));console.log(JSON.stringify({stage:n,tested,traps:uniq.length,sample:uniq.slice(0,8)}));
