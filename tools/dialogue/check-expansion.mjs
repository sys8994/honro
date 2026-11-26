import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {chapters} from '../../shared/data/act5/chapters.mjs';

// Compare against the dialogue baseline used to set the approved budget.
// This audit measures source-admitted changes, not lines heard on one path.
const baseline='ff60f7db5ecabe2aefa0a990877186c9d462fdac';
const git=p=>execFileSync('git',['show',baseline+':'+p],{encoding:'utf8',maxBuffer:16*1024*1024});
const text=p=>readFileSync(p,'utf8');
const parsed=p=>JSON.parse(text(p));
const countChars=s=>[...s.replace(/\s/gu,'')].length;
const canon=s=>s.replace(/\s+/gu,' ').trim();
const released=[260,269,228,61,62,41], target=[260,260,260,299,299,338];
const newRows=[], baseRows=[];
function row(n,who,line,collection){
 if(!who||!line||['서술','안내','기록','시스템','ui','UI','목표 UI','실패 UI'].includes(who))return;
 collection.push({n,who,line:canon(line)});
}
const unique=xs=>new Map(xs.map(x=>[`${x.n}\u0000${x.who}\u0000${x.line}`,x]));
const json4='shared/data/act4/reviewed.json', act4Now=parsed(json4),act4Old=JSON.parse(git(json4));
assert.deepEqual(act4Now.ui,act4Old.ui,'dialogue expansion must not modify Act 4 objective UI');
const duplicateAct4=new Set();
for(const [i,scene] of act4Now.scenes.entries()){
 const {lines,...meta}=scene,{lines:previous,...original}=act4Old.scenes[i];
 assert.deepEqual(meta,original,'original Stage 4 event gates remain in order');
 const oldById=new Map(previous.map(x=>[x[0],x]));
 let seen=0;
 for(const [id,who,line] of lines){
  assert(!duplicateAct4.has(id),'duplicate Act 4 id '+id);duplicateAct4.add(id);
  if(oldById.has(id)){assert.equal(previous[seen++][0],id,'existing Act 4 receipt order changed');}
  row(scene.stage,who,line,newRows);
 }
 assert.equal(seen,previous.length);
 for(const [,who,line] of previous)row(scene.stage,who,line,baseRows);
}
const p5='shared/data/act5/chapters.mjs';
const act5Old=(await import('data:text/javascript;base64,'+Buffer.from(git(p5)).toString('base64'))).chapters;
for(const [i,chapter] of chapters.entries()){
 const {entry,beats,outro,...facets}=chapter;
 const {entry:oldEntry,beats:oldBeats,outro:oldOutro,...oldFacets}=act5Old[i];
 assert.deepEqual(facets,oldFacets,'Act 5 map/enemy data must not change');
 assert.deepEqual(Object.keys(beats),Object.keys(oldBeats),'Act 5 event keys must not change');
 for(const [section,old] of [[entry,oldEntry],[outro,oldOutro],...Object.keys(oldBeats).filter(key=>!(i===2&&key==='commander')).map(key=>[beats[key],oldBeats[key]])]){
  for(const [who,line] of section)row(i+41,who,line,newRows);
  for(const [who,line] of old)row(i+41,who,line,baseRows);
 }
}
for(let n=21;n<=30;n++){
 const p=`shared/data/reviewed/act23-v4-ch${n}.json`, old=JSON.parse(git(p)).rows, fresh=parsed(p).rows;
 const nowId=new Set(),oldId=new Set(old.map(r=>r.id)); const runtime=[`shared/runtime/act23-v4-ch${n}-reviewed.js`,`shared/runtime/act23-v4-ch${n}-reviewed-spear.js`].map(p=>{try{return text(p)}catch(e){if(e.code!=='ENOENT')throw e;return '';}}).join('\n');
 function include(r,coll){const labels=r.speaker_channel?.split(' · ')||[];if(['dialogue','대사','optional','선택 동료 대화','rest_ending','route','void27','failure'].includes(r.channel||labels[1]))row(n,r.speaker||labels[0],r.text,coll);}
 old.forEach(r=>include(r,baseRows));
 for(const r of fresh){
  assert(!nowId.has(r.id),'duplicate Act 3 id '+r.id);nowId.add(r.id);
  if(!oldId.has(r.id)){
   const [, , group,id]=r.id.split('.');
   assert(runtime.includes(r.id)||[...runtime.matchAll(new RegExp(`ids\\('${group}',(\\d+)\\)`,'g'))].some(m=>Number(m[1])>=Number(id)),'orphan Act 3 line '+r.id);
  }
  include(r,newRows);
 }
 for(const id of oldId)assert(nowId.has(id),'missing prior Act 3 id '+id);
}
// The native Act 6 owner emits dialogue only at explicit hook sites.
// Keep this table narrow and add the matching hook as each source is admitted.
const opens=text('shared/runtime/stage51-entry.inc.js');
if(opens.includes('const opening51and52')){
 const block=opens.split('const opening51and52=Object.freeze({')[1].split('});')[0];
 for(const m of block.matchAll(/(51|52):\[([^]*?)\n\s{8}\]/g)){
  assert(opens.includes('start51or52Opening(app,state,'+m[1]+')'));
  for(const r of m[2].matchAll(/\['([^']+)','([^']+)'\]/g))row(Number(m[1]),r[1],r[2],newRows);
 }
}
if(opens.includes('const field52Dialogue=Object.freeze({')){
 const block=opens.split('const field52Dialogue=Object.freeze({')[1].split('});')[0];
 assert(text('shared/act6-app-qa.mjs').includes('if(s.normal51)show52FieldDialogue(app,s,id);'));
 for(const r of block.matchAll(/\['([^']+)','([^']+)'\]/g))row(52,r[1],r[2],newRows);
}
const before=unique(baseRows),now=unique(newRows),isInAct=(n,i)=>Math.ceil(n/10)===i+1;
const report=released.map((baseline,i)=>{
 const added=[...now].filter(([key,r])=>!before.has(key)&&isInAct(r.n,i)).map(([,r])=>r);
 const removed=[...before].filter(([key,r])=>!now.has(key)&&isInAct(r.n,i)).map(([,r])=>r);
 const amount=baseline+added.length-removed.length;const stageBreakdown={};for(const r of added)stageBreakdown[r.n]=(stageBreakdown[r.n]||0)+1;
 return {act:i+1,baseline,target:target[i],added:added.length,removed:removed.length,amount,remaining:Math.max(0,target[i]-amount),addedChars:added.reduce((sum,r)=>sum+countChars(r.line),0),stageBreakdown};
});
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--strict'))assert(report.every(row=>!row.remaining),'Dialogue expansion still below its approved line budget');
