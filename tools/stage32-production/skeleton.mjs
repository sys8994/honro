/** Official Stage32 snapshot: no authored gameplay changes. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createCanvas} from '@napi-rs/canvas';
import {runtime} from '../../game/tests/helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const g=await runtime({legacyMaps:false}),a=JSON.parse(await readFile('shared/data/act4/world.json','utf8'));
const s=a.stages.find(s=>s.id==='stage-32'),p={...g.HONRO_PROJECT,stages:[s],activeStageId:s.id,library:[...g.HONRO_PROJECT.library,...a.library.filter(v=>!g.HONRO_PROJECT.library.some(w=>w.id===v.id))]};
const m=g.HonroMaps.compile(s,p),out='art/stage32-vector-production';await mkdir(out,{recursive:true});
await writeFile(out+'/skeleton-project.json',JSON.stringify(p));
await writeFile(out+'/official-stage.json',JSON.stringify(s,null,2));
const fingerprint=createHash('sha256').update(JSON.stringify({terrains:m.terrain,units:s.units,design:s.design,initialState:s.initialState,materials:s.materials,events:s.events,encounters:s.encounters})).digest('hex');
const v={id:'body',x:-300,y:1500,w:7200,h:2400,pixelWidth:1536,pixelHeight:512,terrainId:'a4-32-land'};
const c=createCanvas(v.pixelWidth,v.pixelHeight),ctx=c.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,c.width,c.height);ctx.scale(c.width/v.w,c.height/v.h);ctx.translate(-v.x,-v.y);ctx.fillStyle='#737f87';ctx.beginPath();s.terrains[0].points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.fill();await writeFile(out+'/body-skeleton.png',c.toBuffer('image/png'));await writeFile(out+'/body-mapping.json',JSON.stringify(v,null,2));
await writeFile(out+'/source-contract.json',JSON.stringify({source:'shared/data/act4/world.json',stage:s.id,fingerprint,terrainIds:m.terrain.map(t=>t.id),preserve:'All official gameplay, IDs, moving/interactive objects and source geometry unchanged',status:'skeleton only; not art approved'},null,2));console.log(fingerprint);
