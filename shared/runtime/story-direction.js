(function(G){'use strict';
// Authored blocking, not random movement or inferred gestures from punctuation.
// Story text, triggers, combat and recruitment still belong to their owners.
const cast={
 1:{actor:'npc-woodcutter',scene:'event-1-witness',dx:-56,caption:'수레 뒤에 몸을 숨겼던 나무꾼이 설오의 목소리에 수레 곁으로 몸을 내민다.'},
 3:{actor:'npc-hwigyeom',entry:true,dx:-64,caption:'나루에 남은 검객이 물가에서 한 걸음 나와 일행의 앞길을 막는다.'},
 4:{actor:'npc-chunrye',speaker:'춘례',dx:42,caption:'춘례가 피란문 안에서 걸어 나와 붕대를 쥔 손을 보인다.'}
};
// Existing civilian/escort bodies already represent these people in the scene.
const speakers={13:{'석공':'resident-1'},14:{'주민':'resident-2','중층 주민':'resident-2','길찬':'resident-1'},16:{'승려':'resident-1','노승':'objective'},19:{'동생을 잃은 형':'mourner-brother','언니를 잃은 동생':'mourner-sister'},20:{'주민':'objective','길찬':'convoy-gilchan','석공':'convoy-mason'}};
function speaker(app,who){const b=app.engine?.b;if(b?.honroStaging?.cinematic!==2||b.honroCustom)return null;const fresh14=b.honroStage===14&&b.honroNarrativeRevision===1,id=fresh14&&who==='중층 주민'?(b.honroMarkers?.find(m=>m.id==='family-mid')?.target||'resident-3'):fresh14&&who==='주민'?'objective':speakers[b.honroStage]?.[who],u=b.units.find(u=>u.id===id)||b.honroConvoyActors?.find(u=>u.id===id);return u&&!u.dead&&u.hp>0?u:null;}
const face=(actor,at,pose='point',camera=false)=>({type:'look',actor,at,pose,camera,scale:camera? .8:undefined,duration:650});
const shot=at=>({type:'look',at,duration:650,scale:.8});
const pose=(actor,kind,at)=>face(actor,at||{actor:'archer'},kind);
const step=(actor,dx)=>({type:'move',actor,to:{origin:actor,dx},duration:850,focus:false});
const toward=(actor,at,distance=48)=>({type:'move',actor,towards:at,distance,duration:950,focus:false});
const rule=(stage,when,who,text,actions)=>({stage,when,who,text,actions});
const rules=G.HONRO_NARRATIVE_COMPAT.direction;
const spirit=[
 [face('archer',{actor:'$spirit'},'guard'),shot({actor:'$spirit'})],
 [face('knight',{actor:'$spirit'},'guard')],
 [face('occultist',{actor:'$spirit'},'point'),shot({between:['occultist','$spirit']})],
 [face('archer',{actor:'occultist'},'lower-bow')],
 [pose('occultist','hold-bell',{actor:'$spirit'})],[]
];
function hiddenSpeech(b,meta){const c=cast[b.honroStage];return !!c&&((c.entry||c.speaker)&&meta?.storyId?.includes('entry-'+b.honroStage)||c.scene&&meta?.storyId?.includes(c.scene));}
function build(app,lines,options={}){
 const b=app.engine?.b;if(app.screen!=='battle'||b?.honroCustom||b?.honroStaging?.cinematic!==2||options.index!==undefined)return null;
 const entry=options.after==='entry',outcome=options.after==='outcome',c=cast[b.honroStage],cues=lines.map(()=>[]),head=[];
 const origins={};for(const u of [...b.units,...(b.honroConvoyActors||[]),...Object.values(b.honroStaging.hidden||{})]){const p={x:u.x,y:u.y};origins[u.id]=p;if(u.side===0&&!u.summoned)origins[u.cls]=p;}
 for(const [i,[who,text,meta={}]]of lines.entries()){
  const id=meta.storyId||'',when=id||(entry?'entry':outcome?'outcome':'');
  if(meta.rowId)cues[i].push(...(meta.direction||[]));
  else for(const r of (!b.honroNarrativeRevision&&G.HONRO_NARRATIVE_V0?.directionRules||rules))if(r.stage===b.honroStage&&when.includes(r.when)&&who===r.who&&text.includes(r.text))cues[i].push(...r.actions);
  const evidenceGoal=meta.evidenceGoal||(id==='act3-party-reunion-v2'?'party-reunion':null);if(evidenceGoal&&!lines.slice(0,i).some(r=>(r[2]?.evidenceGoal||(r[2]?.storyId==='act3-party-reunion-v2'?'party-reunion':null))===evidenceGoal))cues[i].push(...(G.HonroEvidenceQuests?.fieldDirections(b,evidenceGoal)||[]));
  if(meta.spiritPart)cues[i].push(...spirit[{observe:0,hwigyeom:1,recognize:2,ask:3,reply:4,guide:5}[meta.spiritPart]]);
  else if(!meta.rowId&&id==='act2:first-spirit-encounter'){const part=who==='설오'?(/그럼|가리켜|맞설/.test(text)?3:0):who==='휘겸'?1:who==='소단'?(text.includes('현형부')?4:2):5;cues[i].push(...spirit[part]);}
  if(meta.kind==='guide'||meta.kind==='document')cues[i]=[];
  if(c?.speaker===who&&b.honroStaging.hidden[c.actor])cues[i].unshift({type:'move',actor:c.actor,reveal:true,to:{origin:c.actor,dx:c.dx},duration:900,focus:true});
 }
 if(c&&b.honroStaging.hidden[c.actor]&&(c.entry&&entry||c.scene&&lines.some(l=>l[2]?.storyId?.includes(c.scene))))head.push({...shot({actor:c.actor}),caption:c.caption},{type:'move',actor:c.actor,reveal:true,to:{origin:c.actor,dx:c.dx},duration:950,caption:c.caption});
 if(!head.length&&!cues.some(x=>x.length))return null;
 const context={origins,spirit:lines.find(l=>l[2]?.sceneTarget)?.[2].sceneTarget};
 // Resolve objective shots now, after deferred story has checked current progress.
 function resolve(s){const next=JSON.parse(JSON.stringify(s));for(const key of ['at','to','towards']){
  if(next[key]?.storyThread){const thread=G.HonroAct1StoryArt?.threadAttachment(b);if(thread)next[key]={...thread.at};else delete next[key].storyThread;}
  if(next[key]?.goal){const p=G.HonroObjectives.focus(app,next[key].goal);next[key]=p?{x:p.x,y:p.y}:null;}
  if(next[key]?.breach){const ids=b.honroState?.sodanBreach?.units||[],u=b.units.filter(u=>ids.includes(u.id)&&!u.dead&&u.hp>0).sort((a,b)=>b.x-a.x)[0];next[key]=u?{actor:u.id}:null;}
 }return next;}
 return {id:`direction-v2:${entry?'entry-'+b.honroStage:outcome?'outcome-'+b.honroStage:lines[0]?.[2]?.storyId}`,context,head:head.map(resolve),cues:cues.map(xs=>{const delays={};return xs.map(x=>{const s=resolve(x);if(s.actor){s.delay=delays[s.actor]||0;delays[s.actor]=(s.delay||0)+(s.duration||0);}return s;});})};
}
G.HonroStoryDirection={build,cast,hiddenSpeech,speaker,rules};
})(globalThis);
