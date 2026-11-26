(function(G){'use strict';
// Reviewed live speech reuses the existing noninteractive battle subtitle.
// Its cursor lives in the battlefield; no dialogue lock, action or camera move.
const copy=x=>JSON.parse(JSON.stringify(x)),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isBark=l=>Number.isInteger(l?.[2]?.reviewedStage)&&l[2].reviewedStage>=21&&l[2].delivery==='bark';
const state=b=>b.honroState.reviewedBarks??={revision:1,queue:[]};
const duration=l=>Math.max(2400,Math.min(6000,1800+Array.from(l[1]).length*75));
const host=()=>G.document?.getElementById('banter');
function hide(){const node=host();if(node){node.hidden=true;delete node.dataset.reviewedBark;delete node.dataset.monsterObservation;delete node.dataset.scale44Observation;}}
const scaleTrialVisible=new WeakMap();
const scaleTrialLines={
 3:{
  resisted:[['설오','몸통에선 젖은 나무만 뜯깁니다. 눈가에 난 틈을 노려 보겠습니다.'],['담허','몸통으론 깊이 안 들어가네. 눈가에 난 틈을 노려 보게.']],
  weak:[['설오','눈가엔 깊이 들어갔습니다. 다시 저기를 쏘겠습니다.'],['담허','눈가엔 통했네. 거기만 노리게.']]
 },
 34:{
  resisted:[['설오','몸통은 튕겨 냅니다. 눈 둘레가 부스러졌습니다. 저기를 노려 보겠습니다.'],['휘겸','몸통은 멀쩡하오. 눈 둘레가 부스러진 곳을 노리시오.'],['담허','파도가 눈가부터 깎아 놓았군. 그쪽을 맞혀 보게.']],
  weak:[['설오','눈가가 깨졌습니다. 한 번 더 맞히겠습니다.'],['휘겸','눈가엔 통하는군. 그리로 한 번 더 쏘시오.'],['담허','눈가에 금이 더 갔네. 다시 그쪽일세.']]
 },
 44:{
 resisted:[['설오','몸통에선 튕겨 나옵니다. 눈가엔 껍질이 얇아 보입니다. 그쪽을 노려 보겠습니다.'],
  ['담허','몸통은 껍질이 두껍네. 눈가엔 속살이 보이니 그쪽을 노려 보게.']],
 weak:[['설오','얼굴엔 통합니다. 다시 그쪽을 노리겠습니다.'],['담허','얼굴엔 통하는구먼. 그쪽을 다시 노리게.']]
 }};
const scaleTrialAlive=u=>u&&u.side===0&&!u.dead&&u.hp>0&&!u.summoned;
function scaleTrialSpeaker(app,u,entry){
 const b=app.engine.b,rows=scaleTrialLines[b.honroStage][entry.kind];
 const owner=b.units.find(v=>v.id===entry.owner),position={x:u.x,y:u.y-u.h*.45};
 const candidates=[];
 for(const row of rows){
  if(!app.canSpeak?.(row[0]))continue;
  for(const witness of app.speakerUnits?.(row[0])??[]){
   if(!scaleTrialAlive(witness))continue;
   const d=Math.hypot(witness.x-position.x,witness.y-witness.h*.63-position.y);
   if(d<=1360)candidates.push({row,owner:witness===owner||witness.id===owner?.id,d});
  }
 }
 return candidates.sort((a,b)=>Number(b.owner)-Number(a.owner)||a.d-b.d)[0]?.row;
}
function scaleTrialObservation(app,now,node){
 const b=app.engine.b,q=b.honroStage===44?b.honroState?.scaleTrialObservation44:b.honroState?.scaleTrialObservation;
 if(!node||!scaleTrialLines[b.honroStage]||q?.v!==1||
  !Array.isArray(q.queue)||app.done||app.training||['won','lost'].includes(b.phase)||app.dialogue||
  app.modal?.classList.contains('open')||G.document?.hidden||G.HonroAct3Void?.blocked(b))return false;
 const boss=b.units.find(u=>app.engine.monsterWeakPoint(u)?.discovery==='unknown');
 if(!boss)return false;
 const seen=Array.isArray(q.presented)?q.presented:[];
 const hasWeak=Number.isInteger(q.weakShot);
 // If the player found it before an inference was shown, do not narrate that inference late.
 const fresh=e=>e&&(e.kind==='weak'||e.kind==='resisted'&&!hasWeak)&&Number.isInteger(e.round)&&
  Number.isInteger(e.shot)&&e.round<=b.round&&e.round>=b.round-1&&!seen.includes(e.kind);
 const keep=q.queue.filter(fresh);
 if(keep.length!==q.queue.length){q.queue=keep;app.dirty=true;}
 let active=scaleTrialVisible.get(app);
 if(active&&(active.b!==b||active.until<=now||active.kind==='resisted'&&hasWeak||!app.canSpeak?.(active.row[0]))){
  scaleTrialVisible.delete(app);active=null;
 }
 if(!active){
  const sc=app.scene,canvas=sc?.canvas;
  if(!canvas||!(sc.scale>0)||Math.abs((boss.x-sc.x)*sc.scale)>=canvas.clientWidth/2||
   Math.abs((boss.y-boss.h*.78-sc.y)*sc.scale)>=canvas.clientHeight/2)return false;
  const next=q.queue[0],row=next&&scaleTrialSpeaker(app,boss,next);
  if(!row)return false;
  active={b,kind:next.kind,row,until:now+duration(row)};scaleTrialVisible.set(app,active);
 }
 const label='stage'+b.honroStage+'-weakpoint-'+active.kind;
 node.hidden=false;delete node.dataset.reviewedBark;delete node.dataset.monsterObservation;
 if(node.dataset.scale44Observation!==label){
  node.setAttribute('role','status');node.setAttribute('aria-live','polite');
  node.innerHTML=`<strong>${esc(active.row[0])}</strong><span> ${esc(active.row[1])}</span>`;
  node.dataset.scale44Observation=label;
 }
 if(!seen.includes(active.kind)){
  q.presented=[...seen,active.kind];q.queue=q.queue.filter(e=>e.kind!==active.kind);app.dirty=true;G.HonroStory.save(app);
 }
 return true;
}
function pending(app,stage,key){return !!app.engine?.b.honroState.reviewedBarks?.queue.some(q=>q.session===app.engine.b.session&&q.options.reviewedStage===stage&&q.options.reviewedEvent===key);}
function finish(app,q){const b=app.engine.b;state(b).queue.shift();hide();G.HonroAct23V4Reviewed.finished(app,{...q.options,lines:q.lines,index:q.lines.length,liveBarkPresented:q.presented,delivery:'bark'});G.HonroStory.save(app);}
function tick(app,now=performance.now()){const b=app.engine?.b,previous=app.reviewedBarkClock;app.reviewedBarkClock=now;if(!b||app.screen!=='battle'){hide();return;}
 const s=b.honroState.reviewedBarks;if(!s?.queue?.length){if(!scaleTrialObservation(app,now,host()) ){const node=host();if(node)delete node.dataset.scale44Observation;if(!G.HonroMonsterReworkStory?.tick(app,now,node))hide();}return;}
 if(app.dialogue||app.modal?.classList.contains('open')||G.document?.hidden||G.HonroAct3Void?.blocked(b)){hide();return;}
 let elapsed=previous===undefined?0:Math.max(0,Math.min(250,now-previous));
 for(let pass=0;pass<100&&s.queue.length;pass++){
  const q=s.queue[0];if(q.session!==b.session||q.options.reviewedStage!==b.honroStage||!G.HonroAct23V4Reviewed.rowsReviewed(q.lines)){s.queue.shift();hide();app.dirty=true;continue;}
  while(q.index<q.lines.length&&!G.HonroStory.allowed(app,q.lines[q.index][0],q.lines[q.index][2])){q.index++;q.elapsed=0;delete q.current;app.dirty=true;}
  if(q.index>=q.lines.length){finish(app,q);elapsed=0;continue;}
  const line=q.lines[q.index],id=line[2].rowId,node=host();if(!node){app.reviewedBarkClock=now;return;}
  if(q.current!==id){q.current=id;q.elapsed=0;}
  node.hidden=false;delete node.dataset.monsterObservation;delete node.dataset.scale44Observation;node.setAttribute('role','status');node.setAttribute('aria-live','polite');node.dataset.reviewedBark=id;
  if(node.dataset.reviewedBarkText!==id+'\n'+line[1]){node.innerHTML=`<strong>${esc(line[0])}</strong><span> ${esc(line[1])}</span>`;node.dataset.reviewedBarkText=id+'\n'+line[1];}
  if(!q.presented.includes(id)){q.presented.push(id);G.HonroStory.save(app);}
  q.elapsed+=elapsed;app.dirty=true;if(q.elapsed<duration(line))return;
  q.index++;q.elapsed=0;delete q.current;elapsed=0;G.HonroStory.save(app);
 }
}
function start(app,lines,options={}){const b=app.engine?.b;if(!b||app.screen!=='battle'||!lines.length||!lines.every(isBark)||!G.HonroAct23V4Reviewed.rowsReviewed(lines))return false;
 const s=state(b),stage=options.reviewedStage??lines[0][2].reviewedStage,key=options.reviewedEvent??lines[0][2].reviewedEvent;
 if(!pending(app,stage,key)){const entry={session:b.session,lines:copy(lines),options:{...copy(options),reviewedStage:stage,reviewedEvent:key},index:Math.max(0,Math.min(options.index||0,lines.length)),elapsed:0,presented:[]};if(lines.some(l=>/(?:THRUST_WARNING|FALL_WARNING|FIRE_WARNING)$/.test(l[2].group||'')))s.queue.unshift(entry);else s.queue.push(entry);}
 b.honroStory=null;G.HonroStory.save(app);if(!options.deferDisplay)tick(app);return true;
}
G.HonroStoryBarks={isBark,start,tick,pending,duration};
})(globalThis);
