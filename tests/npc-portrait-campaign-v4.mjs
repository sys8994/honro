import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {readFileSync as read} from 'node:fs';
import {chapters} from '../shared/data/act5/chapters.mjs';
const json=p=>JSON.parse(read(p,'utf8')), config=json('game/config/npc-portraits.json');
const ctx={HONRO_NPC_PORTRAITS:structuredClone(config),HonroPortraits:{select:(_a,_vars,_expr,typed)=>typed}};
for(const a of Object.values(ctx.HONRO_NPC_PORTRAITS.assets))a.src=a.file;
vm.runInNewContext(read('shared/runtime/npc-portraits.js','utf8'),ctx);
const P=ctx.HonroNPCPortraits, active=stage=>({stage:{id:stage}});
const eq=(n,who,meta,aid,u)=>assert.equal(P.resolve(active(n),who,meta,u)?.id,aid,`${n}/${who} ${JSON.stringify(meta)}`);
const author=new Map(), channels=new Set(['dialogue','대사','route','rest_ending']);
for(const n of [18,19,20,21,24,28,29,30]){
 const d=json(`shared/data/reviewed/act23-v4-ch${n}.json`);
 for(const r of [...d.rows,...d.familyRestoration?.rows??[]]){
  const [who,ch]=(r.speaker_channel||'').split(' · ');
  if(channels.has(r.channel||ch))author.set(r.id,[n,r.speaker||who]);
 }
}
for(const {stage,lines} of json('shared/data/act4/reviewed.json').scenes)
 for(const [id,who]of lines)author.set(id,[stage,who]);
const checked=[];for(const [id,o]of Object.entries(config.rows)){
 if(!o.stage)continue;
 assert.deepEqual(author.get(id),[o.stage,o.speaker],id);
 const meta=id.startsWith('A4.')?{rowId:'generic-reader-id',act4PreviewRow:id}:{rowId:id};
 eq(o.stage,o.speaker,meta,o.asset);
 assert.notEqual(P.resolve(active(o.stage===60?1:o.stage+1),o.speaker,meta)?.id,o.asset,id);
 checked.push(id);
}
assert(checked.length>=70);
const shadow={도식:'dosik',곽진:'gwakjin',장무율:'jangmuyul',현묵:'hyeonmuk'};
let act5=0;
chapters.forEach(({entry,outro,beats},i)=>{
 const n=i+41;
 for(const [story,lines]of [[`entry-${n}`,entry],[`outcome-${n}`,outro],...Object.entries(beats).map(([k,ls])=>[`act5-${n}-${k}`,ls])])
  for(const [who] of lines)if(shadow[who]){eq(n,who,{storyId:'act1-v6:'+story},shadow[who]);act5++;}
});
eq(57,'곽진',{storyId:'act6-field-57-assistKeeper'},'gwakjin');
for(const key of ['threshold','second','third'])eq(58,'대도사',{storyId:'act6-milestone-58-'+key},'daedosa');
eq(58,'대도사',{storyId:'act6-opening-58'},undefined);
eq(18,'유헌',{},'keeper_ritual',{id:'act2-keeper'});
eq(18,'종지기',{},'keeper_ritual',{id:'act2-keeper'});
eq(19,'주민 1',{},'worker_mature',{id:'mourner-brother'});
eq(19,'주민 2',{},'woman_mature',{id:'mourner-sister'});
eq(18,'생존자',{},'survivor18',{id:'18.survivor'});
eq(19,'생존자',{},'survivor19',{id:'objective'});
eq(24,'주민',{},'workshop24',{id:'v4.workshop-voice'});
eq(26,'주민',{},'man_elder',{id:'act3-resident'});
eq(27,'무명 목소리(정체·이름 미공개)',{rowId:'27.void.sceneLines:bf44ea480c'},undefined);
eq(20,'읍성 피란민',{rowId:'A2.S20.NEWS.01',kind:'guide'},undefined);
eq(19,'주민',{},undefined);eq(58,'곽진',{},undefined);
assert(P.hidden('누군가',{rowId:'27.void.sceneLines:bf44ea480c'}));
assert.equal(P.forUnit(active(58),{id:'a6-c08-boss',name:'대도사',honroVisualOnly:true}),null);
for(const [k,v]of Object.entries(config.assets).filter(([,a])=>a.file.includes('/npc-campaign-v4/'))){
 assert.equal(v.id,k);assert.equal(v.width,768);assert.equal(v.height,1152);
 const b=read(v.file);assert.equal(b.subarray(0,4).toString(),'RIFF');assert.equal(b.subarray(8,12).toString(),'WEBP');
 assert.equal(createHash('sha256').update(b).digest('hex'),v.encodedSha256);
 assert(v.framing.dialogue.top<0);assert(v.framing.dialogue.face.bottom<v.framing.dialogue.height);
}
console.log(JSON.stringify({newScopedRows:checked.length,act5LineBindings:act5,act6Scenes:4,newAssets:15}));
