(function(G){'use strict';
// The normal web build injects the very same still player and CSS used in Act 6.
// Not present in inline/embedded or Workshop builds, whose existing paths stay in place.
const enabled=typeof campaignStillsData!=='undefined'&&!G.HONRO_EMBEDDED;
const sessions=new WeakMap(),seenId='honro-opening-stills-v1';
const hasEnding=stage=>enabled&&!!campaignStillsData.endings[stage];

const reviewedBeatCuts={20:[0,1,1,2],30:[0,0,1,2]};
function prepareSequence(authored,stock){
 const cuts=authored.map(c=>({...c,beats:[...c.beats]}));
 // These lines describe witnessed events. The existing ending provider chooses
 // them from the profile; the art/narration data may not publish those events.
 const distribution=reviewedBeatCuts[stock?.stage];
 if(distribution){
  const ids=stock.rowIds??stock.reviewedRowIds??[],prefix=`EDGE.ACTENDINGS_${stock.stage}_LINES_`;
  for(const [i,line]of stock.lines.entries()){
   const id=ids[i];
   if(typeof line!=='string'||typeof id!=='string'||!id.startsWith(prefix))continue;
   const suffix=id.slice(prefix.length);
   if(!/^[0-3]$/.test(suffix))continue;
   const cut=cuts[distribution[Number(suffix)]];
   if(!cut.beats.includes(line))cut.beats.push(line);
  }
 }
 if(stock?.nextTitle)cuts.at(-1).beats.push(stock.nextTitle);
 let start=0;const beatOffsets=[];
 for(const c of cuts){
  let time=0;
  c.beatEnds=c.beats.map(beat=>{
   beatOffsets.push((start+time)*1000);
   const glyphs=[...beat.replace(/\s/g,'')].length;
   time+=Math.max(6.5,c.duration/c.beats.length,Math.min(11,Math.ceil((2.8+glyphs/9.5)*2)/2));
   return time;
  });
  c.duration=time;
  start+=time;
 }
 return {cuts,beatOffsets,cueAt:ms=>campaignStillsCueAt(cuts,ms)};
}
function close(app){const s=sessions.get(app);if(!s)return false; sessions.delete(app);s.close();return true;}
function open(app,authored,stock,mode,options,finish){
 const t=prepareSequence(authored,stock),stills={};
 for(const c of t.cuts){
  if(c.existing&&!c.overrideArt){
   if(!stock?.image)return false;
   stills[c.id]={land:stock.image,port:stock.portraitImage||stock.image};
  }else stills[c.id]=c.assets;
 }
 const player=campaignStillsPlayer(G,{stills},campaignStillsCss,t);
 const s=player.open(app,mode,()=>{sessions.delete(app);finish();},{
  ...options,
  startAt:t.beatOffsets[options.offset]||0,
  leaveOnLastTap:true,
  onCue:cue=>options.onBeat?.(t.cuts.slice(0,cue.index).reduce((n,c)=>n+c.beats.length,0)+cue.beat)
 });
 if(!s)return false;
 sessions.set(app,s);player.prewarm();player.play(s);return true;
}
function openFresh(app,proceed){
 if(!enabled||app.screen!=='title'||app.debugMode||app.training||app.customMap||app.profileStore?.locked||app.engine)return false;
 const p=app.profile,j=p?.honroJourney,version=G.HonroStoryContent?.version;
 if(!p||version==null||p.honroBattle||p.honroMapStory||p.honroMapRestart||p.honroActEnding||p.honroSplitCampaign||j?.story||j?.restStageId||j?.pendingDirect||j?.stageId>1||
    Object.values(p.cleared||{}).some(Boolean)||p.lastStage>1)return false;
 const mapSceneId=`map-story-v${version}-0`;
 if(p.seen?.[seenId]||p.seen?.[mapSceneId])return false;
 const original=app.screen;app.close();app.cancelInput();app.acc=0;app.screen='act-ending';
 const ok=open(app,campaignStillsData.opening,null,'opening',{id:'campaign-opening',label:'혼로의 시작',skipLabel:'오프닝'},()=>{
  // Keep the normal Stage 1 rest, objectives, and tutorial. The prologue
  // replaces the tavern map scene and the single duplicate Hongman arrival row.
  const seen=p.seen??={};seen[seenId]=true;seen[mapSceneId]=true;
  seen['rest-interlude-v1-1']=true;
  app.screen=original;app.persist();proceed();
 });
 if(!ok)app.screen=original;
 return ok;
}
function showEnding(app,s,d,mode,finish){
 const built=G.HONRO_ACT_ENDINGS?.[s.stage];
 const stock={...d,image:built?.image||d.image,portraitImage:built?.portraitImage||d.portraitImage,stage:s.stage};
 const completion=mode==='completion';
 return open(app,campaignStillsData.endings[s.stage],stock,mode,{
  id:'act-ending',stage:s.stage,label:`${s.stage/10}막 엔딩`,
  backLabel:completion?null:s.debug&&!s.book?'디버그 화면으로 돌아가기':'여정첩으로 돌아가기',
  offset:completion?s.stillBeat:0,
  onBeat:completion?index=>{if(s.stillBeat!==index){s.stillBeat=index;app.persist();}}:null
 },finish);
}
G.HonroCampaignStills={openFresh,hasEnding,showEnding,active:app=>sessions.has(app),close};
})(globalThis);
