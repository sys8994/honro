import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
// Integration seam: official pinned checkout, NOT the old Native replay.
import {runtimeEntries} from '../../shared/build.mjs';
const out=process.argv[2], src=import.meta.dirname;
const sha=s=>createHash('sha256').update(s).digest('hex');
const parsed=async f=>JSON.parse(await readFile(join(src,f),'utf8'));
process.env.HONRO_ACT4_RELEASE='1';
process.env.HONRO_ACT5_RELEASE='1';
const entries=await runtimeEntries({vector:true,render:true,app:false,productionStory:true});
const campaign=entries.find(e=>e.name==='campaign');
assert(campaign?.project,'Pinned official runtime did not export the campaign project');
const b=campaign.project;
const smoke=process.env.HONRO_QA_SMOKE==='1';
const far=entries.find(e=>e.global==='HONRO_AUTHORED_FAR')?.data;
const farSpec=far?.stages?.[42];
assert(farSpec?.key&&[farSpec.key,farSpec.enclosed].filter(Boolean).every(k=>far.images[k]?.startsWith('data:image/')),'Stage42 official background is not embedded');
const views=await parsed('views.json');
const c=structuredClone(b);
const body=c.library.find(a=>a.id==='act5:near:42');
assert(body?.edgeWall?.id,'No official registered BODY');
if(!smoke){const replacement=await parsed('candidate-body.json');assert.equal(replacement.id,body.edgeWall.id,'Wrong registered-body ID');body.edgeWall=replacement;}
for(const p of [b,c]) assert.equal(p.stages.filter(s=>s.id==='stage-42').length,1);
assert.deepEqual(b.stages,c.stages,'unexpected stage metadata/geometry change');
assert.deepEqual(Object.keys(b).sort(),Object.keys(c).sort());
for(const k of Object.keys(b))if(k!=='library')assert.deepEqual(b[k],c[k],k);
const idx=b.library.findIndex(a=>a.id==='act5:near:42');
assert(idx>=0&&c.library[idx]?.id===b.library[idx].id);
assert.deepEqual(b.library.filter((_,i)=>i!==idx),c.library.filter((_,i)=>i!==idx));
if(smoke)assert.deepEqual(b.library[idx],c.library[idx]);else assert.notDeepEqual(b.library[idx],c.library[idx]);
const runtime=entries.map(e=>`(()=>{'use strict';\n${e.code}\n})();`).join('\n;\n');
const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
function boot(){
 globalThis.HONRO_APP_READY=new Promise(()=>{});
 let seed=3910;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
 for(const k of ['localStorage','sessionStorage','indexedDB'])
  Object.defineProperty(globalThis,k,{configurable:true,get(){throw Error('Unexpected storage: '+k);}});
}
async function capture(p,v,variant,runtimeSha,projectSha){
 const put=o=>document.getElementById('result').textContent=encode(o);
 function encode(o){const bytes=new TextEncoder().encode(JSON.stringify(o));let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s);}
 try{
  if(devicePixelRatio!==1)throw Error('DPR');
  const original=p.stages.find(s=>s.id==='stage-42');
  if(!original)throw Error('Stage42 missing before finalize');
  p=HonroMaps.finalize({...p,stages:[original],activeStageId:'stage-42'}); const s=p.stages[0];
  const b=HonroMaps.createBattle(s,p,HonroProfileStore.fresh(),{origin:'campaign'}); HonroStageRules.sanitizeStageBattle(b);
  const canvas=document.querySelector('canvas'); canvas.width=v.w;canvas.height=v.h;
  const engine=new HONRO_CORE.Engine(b,()=>{},true),sc=new HonroScene(canvas);
  Object.assign(sc,{manual:true,x:v.x,y:v.y,scale:v.scale,time:2,editorView:false,skillPreview:false});
  HonroBounds.constrain(sc,b);
  const ctx=canvas.getContext('2d'), render=()=>{sc.render(engine,0,'',.6,false,0);ctx.getImageData(0,0,1,1);};
  const far=()=>globalThis.HonroAuthoredFarArt?.frames?.(sc,canvas.width,canvas.height,b)??null;
  const t=performance.now();render();const firstMs=performance.now()-t;
  const ready=()=>globalThis.HonroAuthoredFarArt.ready(42,b.honroPreviewFar,b);
  for(let i=0;i<80&&!ready();i++){await new Promise(r=>setTimeout(r,100));render();}
  if(!ready())throw Error('Stage42 authored far readiness timeout');
  render();
  const stats=far(); if(!stats?.length)throw Error('Far readiness API absent or no frames; bind exact current checkout API');
  if((globalThis.HonroAuthoredFarArt?.stats?.()?.errors??[]).length)throw Error('Far backdrop load errors');
  put({ok:true,view:v.name,variant,stageId:s.id,runtimeSha,projectSha,farReady:true,firstMs,camera:[sc.x,sc.y,sc.scale,v.w,v.h],physics:b.terrain,units:b.units,png:canvas.toDataURL()});
 }catch(e){put({ok:false,error:String(e.stack??e)});}
}
await mkdir(out,{recursive:true});
for(const name of process.env.HONRO_QA_SINGLE==='1'?['overview']:['overview','west','east','top','bottom','contact','portrait']){
 const view=views[name];assert(view?.name===name&&['w','h','x','y','scale'].every(k=>Number.isFinite(view[k])),name);
 for(const [t,p] of [['baseline',b],['candidate',c]]){
  const params=[view,t,sha(runtime),sha(JSON.stringify(p))].map(x=>JSON.stringify(x)).join(',');
  const patch=smoke||t==='baseline'?'':`HONRO_PROJECT.library.find(a=>a.id==='act5:near:42').edgeWall=${JSON.stringify(p.library[idx].edgeWall)};`;
  await writeFile(join(out,t+'-'+name+'.html'),`<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'"><canvas></canvas><pre id="result">pending</pre>`+script('('+boot+')()')+script(runtime)+script(patch+'('+capture+')(HONRO_PROJECT,'+params+')'));
 }
}
