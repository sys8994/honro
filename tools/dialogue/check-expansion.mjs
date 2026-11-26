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
const sceneKey=s=>`${s.stage}:${s.event}`;
const oldActs=new Map(act4Old.scenes.map(s=>[sceneKey(s),s]));
assert.deepEqual(act4Now.scenes.filter(s=>oldActs.has(sceneKey(s))).map(sceneKey),[...oldActs.keys()],'original Act 4 event order changed');
const act4Runtime=['act4-events.js','act4-coast-events.js'].map(f=>text('shared/runtime/'+f)).join(' ');
for(const scene of act4Now.scenes){
 const {lines,...meta}=scene, old=oldActs.get(sceneKey(scene));
 const {lines:previous,...original}=old??{lines:[]};
 if(old)assert.deepEqual(meta,original,'original Stage 4 event gate metadata changed');
 else assert(act4Runtime.includes("play(app,'"+scene.event+"'"),'orphan Act 4 scene '+scene.event);
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
 for(const [section,old] of [[entry,oldEntry],[outro,oldOutro],...Object.keys(oldBeats).map(key=>[beats[key],oldBeats[key]])]){
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
if(opens.includes('const act6Openings')){
 const block=opens.split('const act6Openings=Object.freeze({')[1].split('});')[0];
 for(const m of block.matchAll(/(5[1-9]):\[([^]*?)\n\s{8}\]/g)){
  const source=Number(m[1])<=52?opens:text('shared/runtime/stage'+m[1]+(Number(m[1])>=58?'-normal':'')+'-entry.inc.js');
  assert(source.includes(',s,'+m[1]+')')||source.includes('startAct6Opening(app,state,'+m[1]+')'));
  for(const r of m[2].matchAll(/\['([^']+)','([^']+)'\]/g))row(Number(m[1]),r[1],r[2],newRows);
 }
}
if(opens.includes('const field52Dialogue=Object.freeze({')){
 const block=opens.split('const field52Dialogue=Object.freeze({')[1].split('});')[0];
 assert(text('shared/act6-app-qa.mjs').includes('if(s.normal51)show52FieldDialogue(app,s,id);'));
 for(const r of block.matchAll(/\['([^']+)','([^']+)'\]/g))row(52,r[1],r[2],newRows);
}
for(const n of [53,54,55,56]){
 const src=text('shared/runtime/stage'+n+'-entry.inc.js'),anchor='const field'+n+'Dialogue=Object.freeze({';
 if(!src.includes(anchor))continue;
 const block=src.split(anchor)[1].split('});')[0];
 assert(src.includes('showAct6Milestone('));
 for(const r of block.matchAll(/\['([^']+)','([^']+)'\]/g))row(n,r[1],r[2],newRows);
}
const entry57=text('shared/runtime/stage57-entry.inc.js');
if(entry57.includes('const field57Dialogue=Object.freeze({')){
 const block=entry57.split('const field57Dialogue=Object.freeze({')[1].split('});')[0];
 assert(entry57.includes('if(q.ok)show57FieldDialogue(a,e,id);'));
 for(const r of block.matchAll(/\['([^']+)','([^']+)'\]/g))row(57,r[1],r[2],newRows);
}
for(const n of [58,59,60]){
 const src=text(n===60?'shared/act6-normal-ending-qa/stage60-entry-stock.inc.js':'shared/runtime/stage'+n+'-normal-entry.inc.js'),anchor='const finale'+n+'Dialogue=Object.freeze({';
 if(!src.includes(anchor))continue;
 const block=src.split(anchor)[1].split('});')[0];
 assert(src.includes('showAct6Milestone('));
 for(const r of block.matchAll(/\['([^']+)','([^']+)'\]/g))row(n,r[1],r[2],newRows);
}
if(opens.includes('const field51Dialogue=Object.freeze({')){
 const block=opens.split('const field51Dialogue=Object.freeze({')[1].split('});')[0];
 assert(text('shared/act6-app-qa.mjs').includes('speak51State(a,active.get(a))'));
 for(const r of block.matchAll(/\['([^']+)','([^']+)'\]/g))row(51,r[1],r[2],newRows);
}
const lastCueFile='shared/act6-ending-replan/cues.mjs';
for(const [src,collect] of [[git(lastCueFile),baseRows],[text(lastCueFile),newRows]]){
 const block=src.split('export const intro=[')[1].split('];')[0];
 for(const r of block.matchAll(/\['([^']+)','([^']+)'\]/g))row(60,r[1],r[2],collect);
}
const before=unique(baseRows),now=unique(newRows),isInAct=(n,i)=>Math.ceil(n/10)===i+1;
const report=released.map((baseline,i)=>{
 const added=[...now].filter(([key,r])=>!before.has(key)&&isInAct(r.n,i)).map(([,r])=>r);
 const removed=[...before].filter(([key,r])=>!now.has(key)&&isInAct(r.n,i)).map(([,r])=>r);
 const amount=baseline+added.length-removed.length;const stageBreakdown={};for(const r of added)stageBreakdown[r.n]=(stageBreakdown[r.n]||0)+1;
 const reference=target[i], lower=Math.ceil(reference*.90), upper=Math.floor(reference*1.10);
 return {act:i+1,baseline,target:reference,band:[lower,upper],added:added.length,removed:removed.length,amount,
  remaining:Math.max(0,lower-amount),gapToReference:Math.max(0,reference-amount),aboveBand:amount>upper,
  addedChars:added.reduce((sum,r)=>sum+countChars(r.line),0),stageBreakdown};
});
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--strict'))assert(report.every(row=>!row.remaining),'Dialogue expansion is more than 10% below one or more reference targets');
