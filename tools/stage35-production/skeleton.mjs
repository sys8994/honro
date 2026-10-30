import {runtime} from '../../game/tests/helpers.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createCanvas} from '@napi-rs/canvas';
process.env.HONRO_ACT4_RELEASE='1';
const g=await runtime({legacyMaps:false}),clone=x=>JSON.parse(JSON.stringify(x));
const p=clone(g.HONRO_PROJECT),pinned=await readFile('art/stage35-vector-production/stage35-skeleton.json','utf8').then(JSON.parse).catch(()=>null),usePinned=pinned&&!process.argv.includes('--reauthor');
const s=usePinned?pinned:p.stages.find(s=>s.metadata.stageId===35);
if(!s)throw Error('Official Stage35 missing');
if(!usePinned){const original=clone(s),t=s.terrains[0];
// Gameplay authoring only. Central shot pocket x2820–3900 remains exact.
for(const q of t.points){if(q.x===1840)q.y=1840;if(q.x===2180)q.y=2040;if(q.x===2650)q.y=2055;if(q.x===4390)q.y=1955;if(q.x===4820)q.y=1960;if(q.x===5340)q.y=1790;if(q.x===5790)q.y=1790;if(q.x===6220)q.y=1850;}
s.elements=s.elements.filter(e=>e.assetId!=='a4:empty-house');
const terrain=s.terrains.map(t=>g.HonroGeometry.terrain(t,s.height));
const floor=x=>g.HonroMapEngine.surfaceY(terrain,x).y;
for(const u of s.units)u.y=floor(u.x);
for(const e of s.elements)e.y=floor(e.x);
// Explicit parent-approved gameplay placement correction: original wall shapes
// straddled stairs/slopes and floated. Same IDs/colliders, grounded clearings.
const wallPlacementCorrections=[];
for(const[id,x]of[['a4-35-old-wall-13',1100],['a4-art-35-extra-1',4600]]){const e=s.elements.find(e=>e.id===id),before={x:e.x,y:e.y};e.x=x;const collider=p.library.find(a=>a.id===e.assetId).collision.flat();const foot=collider.filter(q=>q.y===0);e.y=Math.max(...foot.map(q=>floor(e.x+q.x*e.scale)));wallPlacementCorrections.push({id,before,after:{x:e.x,y:e.y},reason:'Existing collider floated over step/slope; same physical shape moved to grounded clearing.'});}
s.design.act4.revision=2;
s.design.act4.production={revision:1,source:'tools/stage35-production/skeleton.mjs',centralShotContract:'x3040 blocked; x3350 clear; a4-35-g1-1 unchanged',clearings:[[920,1840],[3160,3900],[5340,5790]],ditch:[1840,2820],exit:6500};
s.design.act4.production.wallPlacementCorrections=wallPlacementCorrections;
s.initialState.honroAct4Design=clone(s.design.act4);}
p.stages=[s];p.activeStageId=s.id;
await mkdir('art/stage35-vector-production',{recursive:true});
await writeFile('art/stage35-vector-production/skeleton-project.json',JSON.stringify(p));
await writeFile('art/stage35-vector-production/stage35-skeleton.json',JSON.stringify(s,null,2));
const profile=g.HONRO_CORE.defaults();g.HonroEquipment.fresh(profile);const b=g.HonroMaps.createBattle(s,p,profile);
for(const [name,x,y,scale,w,h]of [['overview',3600,1740,.23,1800,650],['central',2920,1830,.65,1500,700]]){
 const cv=createCanvas(w,h),c=cv.getContext('2d');c.fillStyle='#e6ebed';c.fillRect(0,0,w,h);c.translate(w/2-x*scale,h/2-y*scale);c.scale(scale,scale);
 for(const t of b.terrain){const pts=g.HONRO_CORE.poly(t);c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle=t.honroElementId?'#434f57':'#7c868d';c.fill();c.strokeStyle='#25313a';c.lineWidth=1/scale;c.stroke();}
 for(const u of b.units){c.fillStyle=u.side?'#bd6d65':'#3d8486';c.fillRect(u.x-15,u.y-70,30,70);}
 await writeFile(`art/stage35-vector-production/skeleton-${name}.png`,cv.toBuffer('image/png'));
}
console.log('Official Stage35 scaffold created, central shot geometry unchanged.');
