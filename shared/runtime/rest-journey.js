(function(G){'use strict';
const H=G.HONRO_CONTENT,C=G.HONRO_CORE,$=id=>document.getElementById(id),clone=x=>JSON.parse(JSON.stringify(x));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const data=()=>G.HonroJourneyContent;
function state(profile){const old=profile.honroJourney;if(!old||old.version!==1)profile.honroJourney={version:1,talked:{}};const s=profile.honroJourney;s.talked??={};return s;}
function location(profile){return data().next(profile)||data().ending;}
function active(profile){return profile.honroBattle||null;}
function currentId(profile){return active(profile)?.honroStage||profile.honroJourney?.restStageId||data().next(profile)?.stageId||H.stages.at(-1).id;}
function finalConsonant(text){const last=String(text).charCodeAt(String(text).length-1)-0xac00;return last>=0&&last<=11171?last%28:0;}
function towards(place){const jong=finalConsonant(place);return place+(jong&&jong!==8?'으로':'로');}
function together(name){return name+(finalConsonant(name)?'과':'와');}
function speakerId(cls){return H.hero[cls]?.name;}
const endStoryKey=()=>H.stages.at(-1).id>20?'end-'+H.stages.at(-1).id:'end';
function talkId(next,cls){return `rest-talk-v1-${next?.stageId||endStoryKey()}-${cls}`;}
function restNext(app){return data().at(app.debugMode&&app.debugRestStage||state(app.profile).restStageId)||data().next(app.profile);}
const stage=id=>H.stages.find(s=>s.id===Number(id));
const actOf=id=>stage(id)?.act||1;
function actOpen(profile,act,debug=false){const previous=H.stages.filter(s=>(s.act||1)===act-1);return H.stages.some(s=>(s.act||1)===act)&&(debug||act===1||!!profile.cleared[previous.at(-1)?.id]);}
function actPlaces(act){return data().places.filter(v=>actOf(v.stageId)===act);}
// Urgent direct links and the uninterrupted split expedition have no rest stop.
function hasRest(id){id=Number(id);return !!data().at(id)&&data().transitionAfter(id-1)!=='direct'&&!(id>=25&&id<=28);}
function hubId(app){const id=active(app.profile)?.honroStage||data().next(app.profile)?.stageId;return id?data().places.filter(v=>v.stageId<=id&&hasRest(v.stageId)).at(-1)?.stageId:null;}
function unspentGrowth(profile){return Object.keys(state(profile).newGrowth||{}).filter(cls=>{const h=profile.heroes[cls],cue=state(profile).newGrowth[cls];return h&&C.pointsLeft(h,cls)>0&&C.pointsSpent(h,cls)<cue.spent+cue.points;});}
function chapterLabel(place){const st=H.stages.find(s=>s.id===(place.stageId||H.stages.at(-1).id));return `${st?.act||1}막 ${st?.actStage||st?.id||1}장`;}
function restMarkup(app){const p=app.profile,d=data(),next=restNext(app),place=next||d.ending,s=state(p),growth=unspentGrowth(p);
 // The signpost belongs to the displayed destination. A saved replay or an
 // explicit debug-map choice must not silently route it to another chapter.
 // Keep that snapshot until requestLaunch's existing confirmation is accepted.

 const positions={archer:[30,84],mage:[40,79],knight:[63,82],occultist:[73,78]};
 const heroes=p.recruited.filter(cls=>H.hero[cls]).map(cls=>{const [x,y]=positions[cls]||[60,80],unread=!s.talked[talkId(next,cls)];return `<button class="rest-person rest-${cls}" data-action="rest-talk" data-class="${cls}" style="--person-x:${x}%;--person-y:${y}%" aria-label="${esc(together(speakerId(cls)))} 선택 대화${unread?' · 새 대화':''}"><canvas width="220" height="300" data-rest-person="${cls}" aria-hidden="true"></canvas><span class="rest-person-label">${esc(speakerId(cls))}${unread?'<i aria-hidden="true">···</i>':''}</span></button>`;}).join('');
 return `<main class="screen rest-screen">${app.top('')}<section class="rest-landscape" aria-label="${esc(place.restName)}"><div class="rest-world"><div class="rest-background" aria-hidden="true">${G.HonroJourneyArt.scene(place.variant,place.layer,place.stageId).replace('preserveAspectRatio="xMidYMid slice"','preserveAspectRatio="xMidYMax slice"')}</div><div class="rest-people">${heroes}</div><button class="rest-fire${growth.length?' has-new-sp':''}" data-action="camp" aria-label="모닥불 · 모든 동행 능력치와 기예 준비${growth.length?' · 새 수련점 있음':''}"><span>모닥불</span><small>${growth.length?'새 수련점 · 동행의 성장':'동행 · 능력치 · 기예'}</small></button></div><div class="rest-location"><span>${esc(chapterLabel(place))}</span><h1>${esc(place.restName)}</h1></div>${!next?`<div class="rest-ending"><strong>${esc(d.ending.endingTitle||'하늘 아래, 잠시 머무르다')}</strong><span>${esc(d.ending.nextText||'다음 여정은 준비 중입니다.')}</span></div>`:''}<button class="rest-center" type="button" data-rest-center aria-label="쉼터 시점을 모닥불로 되돌리기" hidden>모닥불로 ↩</button><nav class="rest-actions" aria-label="쉼터에서 할 일"><button data-action="journey-book"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/></svg>여정첩</button><button class="rest-training" data-action="training">허공터</button>${next?`<button class="primary rest-next" data-action="journey-enter" data-id="${next.stageId}" aria-label="스테이지 진입 · ${esc(towards(next.place))} 진입">스테이지 진입 <span aria-hidden="true">→</span></button>`:'<button class="rest-next" disabled>다음 여정 준비 중</button>'}</nav></section><div id="dialogue-root"></div></main>`;
}
// Use the same cached pose-target renderer and idle clips as the battlefield.
// Rest actors have no engine units, combat timers, or saved progression state.
const restRenderers=new Map(),restActors={archer:['seol_o',1,0],mage:['damheo',1,.73],knight:['hwigyeom',-1,1.31],occultist:['sodan',-1,2.03]};
const reducedMotion=G.matchMedia?.('(prefers-reduced-motion: reduce)');
function drawActor(ctx,cls,time=0){const spec=restActors[cls];if(!spec)return;const [id,facing,phase]=spec;let renderer=restRenderers.get(id);if(!renderer){renderer=G.HonroVectorRig.createCanvasRenderer(G.HONRO_PARTY[id]);restRenderers.set(id,renderer);}renderer.draw(ctx,{height:102,facing,animation:'idle',time:Math.max(0,time)+phase});}
// Rest has its own bounded camera. No battlefield camera or save values change.
const REST_MIN_ZOOM=.9,REST_MAX_ZOOM=1.35;
// The camera must bound the painted panorama, not the viewport-sized wrapper.
// A tall phone covers the full SVG height; its hidden horizontal wings remain
// reachable at every zoom, including the deliberately limited .9 zoom-out.
function restGeometry(viewWidth,viewHeight){const height=viewHeight/REST_MIN_ZOOM,artHeight=Math.max(1,height-140),width=Math.max(viewWidth/REST_MIN_ZOOM,artHeight*1600/900),scale=width/1600,dy=artHeight-900*scale;return{width,height,artHeight,scale,dy,ground:765*scale+dy,campWidth:viewWidth/REST_MIN_ZOOM};}
// Keep the established 1280px desktop composition (SVG scale 8/9): its
// 110x150 canvas becomes 123.75x168.75 in the panorama's 1600x900 units.
// Source foot y282/300 leaves 6% transparent space below the actual feet.
// Only artwork follows this scale; labels and tap targets keep CSS minima.
function layoutRest(){const scene=document.querySelector('.rest-landscape'),box=scene?.getBoundingClientRect?.();if(!box)return;const g=restGeometry(box.width,box.height),personHeight=168.75*g.scale;for(const [key,value]of Object.entries({width:g.width,height:g.height,ground:g.ground,'camp-width':g.campWidth,'person-width':123.75*g.scale,'person-height':personHeight,'person-foot-pad':personHeight*.06,'fire-gap':48.375*g.scale}))scene.style.setProperty(`--rest-${key}`,`${value}px`);scene._restCamera?.resize(box,g.width,g.height);}
function mountRestCamera(app,scene){const world=scene?.querySelector?.('.rest-world'),far=scene?.querySelector?.('[data-rest-backdrop]'),center=scene?.querySelector?.('[data-rest-center]');if(!world||!scene.addEventListener)return;
 const contacts=new Map();let moved=false,zoom=1,x=0,y=0,box,width,height,initial=true;
 const blocked=()=>app.screen!=='rest'||!!app.dialogue||!!app.modal?.classList.contains('open');
 const apply=()=>{const mx=Math.max(0,(width*zoom-box.width)/2),my=Math.max(0,(height*zoom-box.height)/2);x=Math.max(-mx,Math.min(mx,x));y=Math.max(-my,Math.min(my,y));world.style.transform=`translate(${x}px,${y}px) scale(${zoom})`;if(center)center.hidden=Math.abs(x)<box.width*.3&&Math.abs(y)<box.height*.2;if(far){const depth=G.HonroEnvironment.ACT1_FAR,unit=1600/(width*zoom);far.setAttribute('transform',`translate(${-x*unit*(1-depth.panX)} ${-y*unit*(1-depth.panY)})`);}};
 const cancel=()=>{if(contacts.size)moved=true;contacts.clear();scene.classList.remove('dragging');};
 scene._restCamera={resize(rect,w,h){box=rect;width=w;height=h;
  // First framing only: keep each place's landmarks, party and fire on phones.
  // Later resize/pan/zoom keeps the existing camera state and full bounds.
  if(initial){initial=false;if(box.width<=700&&scene.querySelector('[data-journey-art="stage1-painted"]')){zoom=1.12;x=Math.max(0,Math.min(112,box.width*.28,(box.width-126*zoom)/2-12));y=-Math.min(90,Math.max(0,(height*zoom-box.height)/2));}else if(box.width<=700&&scene.querySelector('[data-journey-art="stage2-painted"]')){zoom=1.08;x=Math.min(42,box.width*.1);y=-Math.min(65,Math.max(0,(height*zoom-box.height)/2));}else if(box.width<=700&&scene.querySelector('[data-journey-art="stage3-painted"]')){zoom=1.04;y=-Math.min(60,Math.max(0,(height*zoom-box.height)/2));}else if(box.width<=700&&scene.querySelector('[data-journey-art="stage4-painted"]')){zoom=.94;x=Math.max(0,Math.min(115,box.width*.3,(box.width-126*zoom)/2-12));y=-Math.min(55,Math.max(0,(height*zoom-box.height)/2));}else if(box.width<=700&&scene.querySelector('[data-journey-art="stage5-painted"]')){zoom=.96;x=Math.max(0,Math.min(98,box.width*.25,(box.width-126*zoom)/2-12));y=-Math.min(55,Math.max(0,(height*zoom-box.height)/2));}else if(box.width<=700&&scene.querySelector('[data-journey-art="stage6-painted"]')){zoom=.94;x=Math.min(35,box.width*.09);y=-Math.min(55,Math.max(0,(height*zoom-box.height)/2));}else if(box.width<=700&&scene.querySelector('[data-journey-art="stage7-painted"]')){zoom=.94;x=Math.max(0,Math.min(85,box.width*.22,(box.width-126*zoom)/2-12));y=-Math.min(55,Math.max(0,(height*zoom-box.height)/2));}else if(box.width<=700&&scene.querySelector('[data-journey-art="stage8-painted"]')){zoom=.94;x=Math.max(0,Math.min(85,box.width*.22,(box.width-126*zoom)/2-12));y=-Math.min(55,Math.max(0,(height*zoom-box.height)/2));}else if(box.width<=700&&scene.querySelector('[data-journey-art="stage9-painted"]')){zoom=.94;x=Math.max(0,Math.min(85,box.width*.22,(box.width-126*zoom)/2-12));y=-Math.min(55,Math.max(0,(height*zoom-box.height)/2));}else if(box.width<=700&&scene.querySelector('[data-journey-art="stage10-painted"]')){zoom=.94;x=Math.max(0,Math.min(85,box.width*.22,(box.width-126*zoom)/2-12));y=-Math.min(55,Math.max(0,(height*zoom-box.height)/2));}}
  cancel();apply();},cancel};
 layoutRest();
 const pinch=()=>{const [a,b]=contacts.values();return b?{x:(a.x+b.x)/2,y:(a.y+b.y)/2,gap:Math.hypot(a.x-b.x,a.y-b.y)}:null;};
 const transform=(value,toX,toY,fromX=toX,fromY=toY)=>{const next=Math.max(REST_MIN_ZOOM,Math.min(REST_MAX_ZOOM,value)),cx=box.left+box.width/2,cy=box.top+box.height/2;x=toX-cx-(fromX-cx-x)*next/zoom;y=toY-cy-(fromY-cy-y)*next/zoom;zoom=next;apply();};
 scene.addEventListener('pointerdown',e=>{if(e.button!==0||blocked())return;if(!contacts.size)moved=false;if(e.target.closest('.rest-actions,.rest-location,.rest-ending,.rest-center')){if(contacts.size)moved=true;return;}contacts.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY});(e.target.closest('button')||scene).setPointerCapture?.(e.pointerId);if(contacts.size>1){moved=true;scene.classList.add('dragging');}});
 scene.addEventListener('pointermove',e=>{const p=contacts.get(e.pointerId);if(!p)return;if(blocked()){cancel();return;}const before=pinch(),dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;if(before){const after=pinch();transform(zoom*Math.max(1,after.gap)/Math.max(1,before.gap),after.x,after.y,before.x,before.y);}else if(moved||Math.hypot(p.x-p.sx,p.y-p.sy)>6){moved=true;x+=dx;y+=dy;apply();}if(moved){scene.classList.add('dragging');e.preventDefault();}});
 const stop=e=>{if(e.type!=='pointerup'&&contacts.has(e.pointerId))moved=true;contacts.delete(e.pointerId);if(!contacts.size)scene.classList.remove('dragging');};
 for(const type of ['pointerup','pointercancel','lostpointercapture'])scene.addEventListener(type,stop);
 scene.addEventListener('click',e=>{if((moved||contacts.size)&&e.detail!==0){e.preventDefault();e.stopPropagation();return;}if(e.target.closest('[data-rest-center]')&&!blocked()){cancel();x=0;y=0;zoom=1;apply();e.preventDefault();e.stopPropagation();}},{capture:true});
 scene.addEventListener('wheel',e=>{if(blocked()||e.target.closest('.rest-actions,.rest-location,.rest-ending,.rest-center'))return;e.preventDefault();if(contacts.size)return;const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?box.height:1);transform(zoom*Math.exp(-Math.max(-1000,Math.min(1000,delta))*.0014),e.clientX,e.clientY);},{passive:false});
}
// v010 full-cycle bounds: Hwigyeom hat reaches -123.454 at height 102.
// With foot y282 and 8px top margin, max uniform scale is 2.2194; use 2.21.
// All four keep one scale, their asset proportions, foot anchor and button box.
function drawPeople(time=0,canvases=document.querySelectorAll('canvas[data-rest-person]')){for(const cv of canvases){const ctx=cv.getContext('2d');ctx.clearRect(0,0,cv.width,cv.height);ctx.save();ctx.translate(110,282);ctx.scale(2.21,2.21);drawActor(ctx,cv.dataset.restPerson,time);ctx.restore();}}
function paintMotion(m,time){drawPeople(time,m.people);for(const {node,kind,phase}of m.art){const attrs=G.HonroJourneyArt.motionFrame(kind,time,phase);for(const [key,value]of Object.entries(attrs))node.setAttribute(key,value);}m.draws++;}
function stopMotion(app){app.restMotion?.scene?._restCamera?.cancel();app.restMotion=null;}
function startMotion(app){const time=app.restMotion?.time||0;stopMotion(app);layoutRest();const scene=document.querySelector('.rest-landscape');if(!scene)return;mountRestCamera(app,scene);const m=app.restMotion={scene,time,age:0,draws:0,paused:!!document.hidden,reduced:!!reducedMotion?.matches,people:[...document.querySelectorAll('canvas[data-rest-person]')],art:[...scene.querySelectorAll('[data-rest-motion]')].map(node=>({node,kind:node.dataset.restMotion,phase:Number(node.dataset.restPhase)||0}))};paintMotion(m,m.reduced?0:m.time);}
// The App already owns one rAF. Reuse its clamped dt, retain DOM handles only
// while this rest screen exists, and redraw at 24 Hz (20 Hz on narrow screens).
// No second rAF, timers, observers or per-entry listeners need cancellation.
function frame(app,dt){const m=app.restMotion;if(app.screen!=='rest'){if(m)stopMotion(app);return;}if(!m||m.scene.isConnected===false){stopMotion(app);return;}if(app.dialogue||app.modal?.classList.contains('open'))m.scene._restCamera?.cancel();if(document.hidden){m.scene._restCamera?.cancel();m.paused=true;m.age=0;return;}const reduce=!!reducedMotion?.matches;if(reduce){if(!m.reduced)paintMotion(m,0);m.reduced=true;m.age=0;return;}if(m.paused||m.reduced){m.paused=false;m.reduced=false;m.age=0;return;}const step=Math.min(.06,Math.max(0,Number(dt)||0));m.time+=step;m.age+=step;const interval=G.innerWidth<=700?1/20:1/24;if(m.age+1e-9<interval)return;m.age=Math.max(0,m.age-interval*Math.floor((m.age+1e-9)/interval));paintMotion(m,m.time);}
function showRest(app){if(G.HonroActEndings?.show(app))return;if(!state(app.profile).restStageId&&G.HonroSplitCampaign?.redirectRest(app))return;app.stopBattle();observeGrowth(app,active(app.profile));app.close();app.training=false;const pending=state(app.profile).pendingDirect,next=data().next(app.profile);if(!app.debugRestStage&&!state(app.profile).restStageId&&!active(app.profile)&&pending&&next?.stageId===pending)return launch(app,pending,'next');if(!active(app.profile))G.HonroProgression.recruitAtEntry(app.profile,next?.stageId||0);G.HonroAct2.recruit(app.profile);G.HonroProgression.repairRecruits(app.profile);app.screen='rest';const s=state(app.profile);for(const cls of Object.keys(s.newGrowth||{}))if(!unspentGrowth(app.profile).includes(cls))delete s.newGrowth[cls];s.stageId=restNext(app)?.stageId||null;app.root.innerHTML=restMarkup(app);startMotion(app);app.persist();app.updateAudio();nextStory(app);}
function prelude(completed){return (G.HonroStoryContent.mapScenes[completed]||[]).map(([who,text,meta={}])=>who==='서술'||meta.kind==='narration'?['설오',completed===0?'고개에 오르기 전에 주막에서 홍만의 소식을 물어봐야겠다.':text,{...meta,kind:'dialogue'}]:[who,text,meta]);}
function arrivalLines(profile,id,description=true,evidenceRevision=0){const place=id==null?data().ending:data().at(id);let lines=data().required(profile,id)||[];if(evidenceRevision===1&&id>=21&&place?.restDescription)lines=lines.filter(row=>row[0]!=='서술');return description&&place?.restDescription?[["서술",place.restDescription,{storyId:lines[0]?.[2]?.storyId,storyTitle:lines[0]?.[2]?.storyTitle,kind:'narration',presentation:'inline',restDescription:true}],...lines]:lines;}
function startEntry(app,title){const id=`rest-interlude-v1-${app.stage.id}`,need=!app.profile.seen[id],context=need?(data().interlude?.(app.stage.id)||[]):[],lines=G.HonroObjectives.entry(app,{interlude:false});return G.HonroStory.start(app,[...(G.HonroStoryFraming?.arrival(app,context)||context),...lines],{title,after:'entry',journeyInterludeId:need?id:null});}
function restoreStory(app){const saved=state(app.profile).story;if(!saved)return false;
 // A suspended battle can advance while an interrupted rest conversation is
 // still saved. Bind text to its original place; never regenerate a previous
 // place's dialogue from the new destination or let optional talk skip arrival.
 const nextStage=restNext(app)?.stageId??null,match=/^rest-(?:interlude|talk)-v1-(\d+|end)(?:-|$)/.exec(saved.id||''),savedStage=saved.kind==='map'?(saved.completed>=H.stages.length?null:saved.completed+1):match?(match[1]==='end'?null:Number(match[1])):undefined;
 const completed=nextStage==null?H.stages.at(-1).id:nextStage-1,mapId=`map-story-v${G.HonroStoryContent.version}-${completed}`,arrivalId=`rest-interlude-v1-${nextStage??endStoryKey()}`;
 const requiredPending=nextStage===data().next(app.profile)?.stageId&&((!app.profile.seen[mapId]&&prelude(completed).length)||!app.profile.seen[arrivalId]);
 if(savedStage!==nextStage||(saved.stageId!==undefined&&saved.stageId!==savedStage)||(saved.kind==='optional'&&requiredPending)){state(app.profile).story=null;app.persist();return false;}
 let lines;if(saved.kind==='map')lines=prelude(saved.completed);else if(saved.kind==='optional')lines=data().optional(app.profile,nextStage,saved.cls);else lines=arrivalLines(app.profile,data().next(app.profile)?.stageId??null,saved.description===true,saved.evidenceRevision||0);if(!lines?.length){state(app.profile).story=null;return false;}return G.HonroStory.start(app,lines,{id:saved.id,index:saved.index||0,title:location(app.profile).restName,after:'rest',restKind:saved.kind,restClass:saved.cls,restCompleted:saved.completed,restDescription:saved.description===true,restEvidenceRevision:saved.evidenceRevision||0});}
function nextStory(app){if(app.debugMode&&app.debugRestStage)return false;if(app.screen!=='rest'||app.dialogue)return false;if(restNext(app)?.stageId!==data().next(app.profile)?.stageId){const saved=state(app.profile).story;if(saved?.kind!=='optional')return false;return restoreStory(app);}if(restoreStory(app))return true;const p=app.profile,next=data().next(p),completed=next?next.stageId-1:H.stages.at(-1).id,mapId=`map-story-v${G.HonroStoryContent.version}-${completed}`,mapLines=prelude(completed);
 if(mapLines?.length&&!p.seen[mapId])return G.HonroStory.start(app,mapLines,{id:mapId,index:p.honroMapStory?.id===mapId?p.honroMapStory.index:0,title:location(p).restName,after:'rest',restKind:'map',restCompleted:completed});
 const id=`rest-interlude-v1-${next?.stageId||endStoryKey()}`;if(p.seen[id])return false;const lines=arrivalLines(p,next?.stageId??null,true,p.honroEvidenceRevision||0);return lines?.length?G.HonroStory.start(app,lines,{id,title:location(p).restName,after:'rest',restKind:'arrival',restDescription:true,restEvidenceRevision:p.honroEvidenceRevision||0}):false;
}
function saveStory(app){if(app.screen!=='rest')return;const d=app.dialogue,s=state(app.profile);s.story=d?{id:d.id,index:d.index,kind:d.restKind,cls:d.restClass,completed:d.restCompleted,description:!!d.restDescription,evidenceRevision:d.restEvidenceRevision||0,stageId:restNext(app)?.stageId??null}:null;app.persist();}
function finishStory(app,d){if(app.screen!=='rest'||d.after!=='rest')return false;const s=state(app.profile);s.story=null;if(d.restKind==='optional'){s.talked[d.id]=true;app.persist();app.root.innerHTML=restMarkup(app);startMotion(app);document.querySelector(`[data-action="rest-talk"][data-class="${d.restClass}"]`)?.focus?.({preventScroll:true});return true;}app.persist();if(!nextStory(app))document.querySelector('[data-action="camp"]')?.focus?.({preventScroll:true});return true;}
function talk(app,cls){if(app.screen!=='rest'||app.dialogue||!app.profile.recruited.includes(cls))return;const next=restNext(app),lines=data().optional(app.profile,next?.stageId??null,cls);if(lines?.length)G.HonroStory.start(app,lines,{id:talkId(next,cls),title:`${(restNext(app)||data().ending).restName} · ${speakerId(cls)}`,after:'rest',restKind:'optional',restClass:cls});}
function status(profile,place){if((active(profile)||data().next(profile))&&currentId(profile)===place.stageId)return active(profile)?'진행 중인 전투':'현재 길목';if(profile.cleared[place.stageId])return '지나온 길';return H.stages[place.stageId-1].requires.every(id=>profile.cleared[id])?'열린 길':'아직 닿지 않은 길';}
function unlocked(profile,place,debug=false){return debug||!!profile.cleared[place.stageId]||H.stages[place.stageId-1].requires.every(id=>!!profile.cleared[id]);}
const mapDefinition=act=>G.HonroJourneyImages.definition(act);
const mapAnchor=(act,id)=>mapDefinition(act)?.stages.find(s=>s.stageNumber===Number(id));
function bookMarkup(app){
 const p=app.profile,d=data(),act=app.journeyAct||actOf(currentId(p)),def=mapDefinition(act),finished=!active(p)&&!d.next(p),allowed=actOpen(p,act,app.debugMode),places=allowed?actPlaces(act):[],visible=places.filter(v=>unlocked(p,v,app.debugMode)),endSelected=app.journeySelection==='end'&&finished&&act===actOf(d.ending.stageId);
 const selected=endSelected?d.ending:visible.find(v=>v.stageId===app.journeySelection)||null,current=currentId(p);
 const pins=visible.map(v=>{const anchor=mapAnchor(act,v.stageId);if(!anchor)return '';const passed=!!p.cleared[v.stageId],here=v.stageId===current,picked=endSelected?v.stageId===d.ending.stageId:selected?.stageId===v.stageId;return `<button class="journey-pin ${passed?'passed':''} ${here?'current':''} ${picked?'selected':''}" data-action="journey-select" data-id="${v.stageId}" style="left:${anchor.x/def.width*100}%;top:${anchor.y/def.height*100}%;--label-x:${anchor.labelOffsetX};--label-y:${anchor.labelOffsetY}" aria-label="${v.stageId}장 ${esc(anchor.mapLabel)} · ${status(p,v)}" aria-pressed="${picked}" ${here?'aria-current="location"':''}><i>${v.stageId}</i><span>${passed?'✓ ':''}${esc(anchor.mapLabel)}</span>${here?'<b>현 위치</b>':''}</button>`;}).join('');
 // Fog reveals only already-authorized places; no locked names, disabled pins,
 // or interactions are emitted. Art never grants progression permissions.
 const fog=allowed&&visible.length<places.length?`<svg class="journey-fog" viewBox="0 0 ${def.width} ${def.height}" aria-hidden="true"><defs><radialGradient id="journey-reveal"><stop offset=".3" stop-color="black"/><stop offset="1" stop-color="black" stop-opacity="0"/></radialGradient><mask id="journey-fog-mask"><rect width="100%" height="100%" fill="white"/>${visible.map(v=>{const a=mapAnchor(act,v.stageId);return `<ellipse cx="${a.x}" cy="${a.y}" rx="280" ry="240" fill="url(#journey-reveal)"/>`;}).join('')}</mask></defs><rect width="100%" height="100%" fill="#081416" opacity=".92" mask="url(#journey-fog-mask)"/></svg>`:'';
 const investigations=act===3?`<svg class="journey-investigations" viewBox="0 0 ${def.width} ${def.height}" aria-hidden="true">${[[24,26,28],[24,25,27,28]].map((ids,i)=>{const pairs=ids.slice(1).map((id,n)=>[ids[n],id]).filter(pair=>pair.every(id=>visible.some(v=>v.stageId===id)));return pairs.map(pair=>`<path d="M${pair.map(id=>{const a=mapAnchor(act,id);return a.x+' '+a.y;}).join(' L')}" class="investigation-${i}"/>`).join('');}).join('')}</svg>`:'';
 const details=!selected?'<div><p>길목을 선택해 이동할 곳을 확인하세요.</p></div>':`<div><span>${esc(selected.region)} · ${endSelected?'현 위치 · '+esc(d.ending.actEnd||'막 끝'):status(p,selected)}</span><h2>${esc(selected.place)}</h2><p>${esc(selected.event)}</p></div><button class="primary" data-action="journey-travel" data-id="${endSelected?'end':selected.stageId}">${endSelected||hasRest(selected.stageId)?'휴식터로 진입':'스테이지 진입'}</button>`;
 const tabs=Array.from({length:6},(_,i)=>{const n=i+1,implemented=H.stages.some(s=>(s.act||1)===n),open=actOpen(p,n,app.debugMode);return `<button data-action="journey-act" data-id="${n}" aria-pressed="${act===n}" aria-label="${n}막${!implemented?' · 준비 중':!open?' · 잠김':''}" ${open?'':'disabled'}><span>${n}막</span>${!implemented?'<small>준비 중</small>':!open?'<small>잠김</small>':''}</button>`;}).join('');
 return `<main class="screen journey-screen journey-image-screen journey-act-${act}"><header class="journey-heading"><h1>여정첩</h1><nav class="journey-acts" aria-label="막 선택">${tabs}</nav></header><section class="journey-map-viewport" aria-label="${act}막 지리와 지나온 길">${allowed&&def?`<div class="journey-map-scroll" tabindex="0" aria-label="지도 이동: 방향 키 또는 드래그. 확대 버튼 또는 휠 사용"><div class="journey-map" style="--journey-zoom:${app.journeyZoom||1};aspect-ratio:${def.width}/${def.height}"><div class="journey-image-host" aria-hidden="true"></div>${investigations}${fog}${pins}</div></div><p class="journey-image-status" role="status">지도를 불러오는 중입니다. 길목은 선택할 수 있습니다.</p><div class="journey-map-tools" aria-label="지도 확대와 위치"><button data-action="journey-fit" aria-label="지도 맞춤">맞춤</button><button data-action="journey-zoom" data-id="out" aria-label="지도 축소">−</button><button data-action="journey-center" aria-label="선택한 길목으로">◎</button><button data-action="journey-zoom" data-id="in" aria-label="지도 확대">+</button></div><div class="journey-map-legend"><span>◎ 현 위치 · ✓ 지난 길</span><span>${act===3?'점선: 지상 / 지하 조사 관계 · 진행은 장 순서대로':act===2?'지상 11·12 / 지하 13–20 · 18·19는 같은 종':'드래그 · 휠 / 두 손가락 확대'}</span></div>`:'<p>이전 막을 완료하면 지도가 열립니다.</p>'}</section><section class="journey-detail" aria-live="polite">${details}<button class="journey-back" data-action="rest">휴식터로 돌아가기</button></section></main>`;
}
function layoutBook(app){const viewport=document.querySelector('.journey-map-scroll'),map=document.querySelector('.journey-map'),def=mapDefinition(app.journeyAct);if(!viewport||!map||!def)return;const base=Math.max(viewport.clientWidth||360,(viewport.clientHeight||400)*def.width/def.height,app.journeyAct===2?680:920);map.dataset.baseWidth=String(base);app.journeyZoom=Math.max((app.journeyAct===2?460:600)/base,Math.min(1.8,app.journeyZoom||1));map.style.setProperty('--map-base-width',base+'px');map.style.setProperty('--journey-zoom',String(app.journeyZoom));map.style.setProperty('--map-factor',String(base*app.journeyZoom/def.width));}
function revealBook(app){const viewport=document.querySelector('.journey-map-scroll'),map=document.querySelector('.journey-map'),id=app.journeySelection==='end'?data().ending.stageId:app.journeySelection,anchor=mapAnchor(app.journeyAct,id),def=mapDefinition(app.journeyAct);if(!viewport||!map||!anchor)return;viewport.scrollLeft=Math.max(0,map.offsetLeft+anchor.x/def.width*map.clientWidth-viewport.clientWidth/2);viewport.scrollTop=Math.max(0,map.offsetTop+anchor.y/def.height*map.clientHeight-viewport.clientHeight/2);}
function zoomBook(app,zoom,clientX,clientY,fromX=clientX,fromY=clientY){
 if(app.screen!=='journey'||!Number.isFinite(zoom))return;
 const viewport=document.querySelector('.journey-map-scroll'),map=document.querySelector('.journey-map');if(!viewport||!map)return;
 const rect=map.getBoundingClientRect(),fx=(fromX-rect.left)/map.clientWidth,fy=(fromY-rect.top)/map.clientHeight;
 app.journeyZoom=zoom;layoutBook(app);const nextRect=map.getBoundingClientRect();
 viewport.scrollLeft+=nextRect.left+fx*map.clientWidth-clientX;viewport.scrollTop+=nextRect.top+fy*map.clientHeight-clientY;
}
function fitBook(app){const viewport=document.querySelector('.journey-map-scroll'),map=document.querySelector('.journey-map'),def=mapDefinition(app.journeyAct);if(!viewport||!map||!def)return;const base=Number(map.dataset.baseWidth);zoomBook(app,Math.min(viewport.clientWidth/base,viewport.clientHeight*def.width/def.height/base),0,0);revealBook(app);}
function mountBook(app){
 const viewport=document.querySelector('.journey-map-scroll');if(!viewport||typeof viewport.addEventListener!=='function')return;
 layoutBook(app);G.HonroJourneyImages.mount(app);viewport._journeyResize=()=>{viewport._journeyCancel?.();layoutBook(app);revealBook(app);};
 const contacts=new Map();let moved=false,pinchZoom=1;viewport._journeyCancel=()=>{if(contacts.size)moved=true;contacts.clear();viewport.classList.remove('dragging');};
 const pinch=()=>{const [a,b]=contacts.values();return b?{x:(a.x+b.x)/2,y:(a.y+b.y)/2,gap:Math.hypot(a.x-b.x,a.y-b.y)}:null;};
 viewport.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;if(!contacts.size)moved=false;
  contacts.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY});
  // Capture on the original pin so an unmoved touch still produces its normal
  // click. Capture keeps a drag alive when it leaves the map's visible edge.
  (e.target.closest('button')||viewport).setPointerCapture?.(e.pointerId);
  if(contacts.size===2)pinchZoom=app.journeyZoom||1;
  if(contacts.size>1){moved=true;viewport.classList.add('dragging');}
 });
 viewport.addEventListener('pointermove',e=>{
  const point=contacts.get(e.pointerId);if(!point)return;
  const before=pinch(),dx=e.clientX-point.x,dy=e.clientY-point.y;point.x=e.clientX;point.y=e.clientY;
  if(before){const after=pinch();pinchZoom*=Math.max(1,after.gap)/Math.max(1,before.gap);zoomBook(app,pinchZoom,after.x,after.y,before.x,before.y);}
  else if(moved||Math.hypot(point.x-point.startX,point.y-point.startY)>5){moved=true;viewport.classList.add('dragging');viewport.scrollLeft-=dx;viewport.scrollTop-=dy;}
 });
 const stop=e=>{if(e.type!=='pointerup'&&contacts.has(e.pointerId))moved=true;contacts.delete(e.pointerId);if(contacts.size>1)pinchZoom=app.journeyZoom||1;if(!contacts.size)viewport.classList.remove('dragging');};
 for(const type of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(type,stop);
 viewport.addEventListener('click',e=>{if(moved&&e.detail!==0){e.preventDefault();e.stopPropagation();}},{capture:true});
 viewport.addEventListener('wheel',e=>{
  e.preventDefault();if(!e.deltaY||contacts.size)return;
  const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?viewport.clientHeight:1);
  zoomBook(app,(app.journeyZoom||1)*Math.exp(-Math.max(-1000,Math.min(1000,delta))*.0014),e.clientX,e.clientY);
 },{passive:false});
}
function showBook(app,id,layer,act){
 if(G.HonroActEndings?.show(app))return;if(app.screen==='battle'&&app.engine)return requestRest(app);
 const d=data(),target=id==='end'?d.ending:d.at(+id)||d.at(app.journeySelection)||d.at(currentId(app.profile))||d.places[0];
 act=Number(act)||actOf(target.stageId);if(!actOpen(app.profile,act,app.debugMode))act=1;
 const places=actPlaces(act),layers=[...new Set(places.map(v=>v.layer))];layer=layers.includes(layer)?layer:places.find(v=>v.stageId===target.stageId)?.layer||layers[0];
 app.stopBattle();app.close();app.screen='journey';app.journeyAct=act;app.journeyLayer=layer;app.journeyZoom??=1;
 const visible=places.filter(v=>unlocked(app.profile,v,app.debugMode));
 app.journeySelection=id==='end'&&!active(app.profile)&&!d.next(app.profile)&&act===actOf(d.ending.stageId)?'end':visible.some(v=>v.stageId===target.stageId)?target.stageId:visible[0]?.stageId||null;
 app.root.innerHTML=bookMarkup(app);mountBook(app);revealBook(app);app.updateAudio();
}
function selectBook(app,id){if(app.screen!=='journey')return;const place=id==='end'?data().ending:data().at(+id);if(!place||actOf(place.stageId)!==app.journeyAct||!actOpen(app.profile,app.journeyAct,app.debugMode)||!unlocked(app.profile,place,app.debugMode))return;app.journeySelection=!active(app.profile)&&!data().next(app.profile)&&place.stageId===data().ending.stageId?'end':+id;app.root.innerHTML=bookMarkup(app);mountBook(app);revealBook(app);document.querySelector(`[data-action="journey-select"][data-id="${id}"]`)?.focus?.({preventScroll:true});}
function canTravel(app,id){const place=data().at(id);return !!place&&actOpen(app.profile,actOf(id),app.debugMode)&&unlocked(app.profile,place,app.debugMode);}
function discardBattle(app){
 // The caller has explicit approval. Persist growth before severing both live
 // and serialized combat, so a later autosave/page reload cannot resurrect it.
 const b=app.engine&&!app.training&&!app.customMap?app.engine.b:active(app.profile);
 app.stopBattle();observeGrowth(app,b);
 if(!app.profile.honroGrowth&&b?.honroGrowth?.ledger)app.profile.honroGrowth=clone(b.honroGrowth.ledger);
 app.profile.honroBattle=null;delete app.profile.honroCampPending;delete app.profile.honroMapRestart;
 if(b?.honroSplit)G.HonroSplitCampaign.restartForMap(app.profile,b.honroStage,b.honroSplit);
 delete state(app.profile).pendingDirect;app.honroRouteRetry=null;app.dirty=false;app.persist();
}
function launch(app,id,kind){if(G.HonroCampaignEntry?.defer(app,id,()=>launch(app,id,kind)))return;app.pendingJourneyLaunch=null;delete state(app.profile).pendingDirect;delete state(app.profile).restStageId;const split=app.profile.honroSplitCampaign;if(split&&!split.finished&&id!==split.stage&&id!==split.nextStage)delete app.profile.honroSplitCampaign;app.launch(id);app.journeyInputAfter=performance.now()+400;if(app.engine&&!app.training){app.engine.b.honroJourneyReplay=kind==='replay';app.profile.honroBattle=clone(app.engine.b);app.persist();}}
function travel(app,id){if(app.screen==='journey'&&id==='end'&&app.journeySelection==='end'&&!data().next(app.profile)&&!active(app.profile))return requestMove(app,{action:'rest',id:null});if(app.screen!=='journey'||+app.journeySelection!==Number(id)||!canTravel(app,id))return;if(hasRest(id))return requestMove(app,{action:'rest',id:Number(id)});return requestLaunch(app,id,app.profile.cleared[id]?'replay':'next');}
function enterRest(app,id){app.journeyInputAfter=performance.now()+400;app.close();const s=state(app.profile);s.restStageId=id||null;if(app.debugMode){app.debugRestStage=id||null;app.prepareDebugCamp();}showRest(app);}
function requestRest(app){
 if(G.HonroActEndings?.show(app))return;
 // Practice/custom maps own no campaign battle; returning preserves their
 // protected owner. A later explicit campaign entry still asks to replace it.
 if(app.training||app.customMap||G.HONRO_EMBEDDED)return showRest(app);
 if(['rest','camp','journey'].includes(app.screen)&&!active(app.profile))return showRest(app);
 return requestMove(app,{action:'rest',id:hubId(app)});
}
function requestMove(app,move){
 if(G.HonroActEndings?.show(app))return;
 const b=app.engine&&!app.training?app.engine.b:active(app.profile);
 if(b){
  app.pendingJourneyLaunch={...move,session:b.session,profile:app.profile,returnMenu:app.screen==='battle'&&app.modalKind==='pause-dialog'?'pause':null};
  const returning=move.action==='rest';
  app.open(`<h2>${returning?'휴식터로 돌아갈까요?':'스테이지에 진입할까요?'}</h2><p>진행 중인 전투는 초기화됩니다. ${returning?'휴식터로 돌아가시겠습니까?':'새 전투를 시작하시겠습니까?'}</p><p>성장과 완료 기록은 유지됩니다.</p><div class="actions"><button data-action="cancel-journey-launch">취소</button><button class="primary" data-action="confirm-journey-launch">${returning?'돌아가기':'새로 시작'}</button></div>`,'journey-confirm');return;
 }
 executeMove(app,move);
}
function executeMove(app,move){if(move.action==='rest')return enterRest(app,move.id);return launch(app,move.id,move.kind);}
function requestLaunch(app,id,kind='next'){
 id=Number(id);if(!['rest','camp','journey'].includes(app.screen)||!canTravel(app,id))return;
 kind=app.profile.cleared[id]?'replay':'next';
 if(G.HonroCampaignEntry?.defer(app,id,()=>requestLaunch(app,id,kind)))return;
 requestMove(app,{action:'launch',id,kind});
}
function confirmLaunch(app){
 const pending=app.pendingJourneyLaunch;if(!pending)return;
 const b=app.engine&&!app.training?app.engine.b:active(app.profile);
 if(pending.profile!==app.profile||b?.session!==pending.session){app.pendingJourneyLaunch=null;if(pending.returnMenu==='pause')app.pause();else app.close();app.notify('저장된 전투가 바뀌었습니다. 이동할 곳을 다시 골라 주세요.');return;}
 // Load first; a failed/cancelled load leaves the approved snapshot intact.
 if(pending.action==='launch'&&G.HonroCampaignEntry?.defer(app,pending.id,()=>confirmLaunch(app)))return;
 app.pendingJourneyLaunch=null;discardBattle(app);executeMove(app,pending);
}
function observeGrowth(app,b){
 if(!b||b.honroJourneyReplay||app.debugMode||b.honroCustom||app.training)return;
 const s=state(app.profile),session=b.session||`${b.honroStage||app.stage?.id}:${JSON.stringify(b.startXP||{})}`;
 if(s.growthObserved?.session!==session)s.growthObserved={session,earned:{}};
 const observed=s.growthObserved.earned,cues=s.newGrowth??={};
 for(const cls of app.profile.recruited){const h=app.profile.heroes[cls],xp=b.startXP?.[cls];if(!h||!Number.isFinite(xp))continue;const total=C.pointsEarned(b.heroes?.[cls]||h),previous=observed[cls]??C.pointsEarned({xp}),earned=Math.max(0,total-previous),left=C.pointsLeft(h,cls),spent=C.pointsSpent(h,cls),remaining=cues[cls]?Math.max(0,cues[cls].spent+cues[cls].points-spent):0;observed[cls]=Math.max(previous,total);if(earned&&left)cues[cls]={stageId:b.honroStage||app.stage?.id,spent,points:Math.min(left,remaining+earned)};}
}
function recordOutcome(app,won){const b=app.engine?.b;observeGrowth(app,b);if(!won||b?.honroJourneyReplay)return;const next=data().next(app.profile),s=state(app.profile);if(next?.stageId===app.stage.id+1&&data().transitionAfter(app.stage.id)==='direct')s.pendingDirect=next.stageId;else delete s.pendingDirect;}
function resultLabel(app){if(app.customMap)return '원래 여정으로 돌아가기';const splitLabel=G.HonroSplitCampaign?.resultLabel(app);if(splitLabel)return splitLabel;if(app.engine?.b.phase==='lost')return '쉼터로 돌아가기';const next=data().next(app.profile);return app.engine?.b.honroJourneyReplay?'여정첩으로':next&&next.stageId===app.stage.id+1&&data().transitionAfter(app.stage.id)==='direct'?`${towards(next.place)} 이어 걷기`:'다음 쉼터로';}
function resultContinue(app){G.HonroRouteBranches?.continueFrom(app);if(G.HonroSplitCampaign?.resultContinue(app))return;if(!app.engine||!app.done)return;const b=app.engine.b,won=b.phase==='won',id=app.stage.id,replay=b.honroJourneyReplay;app.engine=null;app.profile.honroBattle=null;delete state(app.profile).restStageId;app.close();if(won)app.debugRestStage=null;if(replay)return showBook(app,id);const next=data().next(app.profile);if(won&&next?.stageId===id+1&&data().transitionAfter(id)==='direct')return launch(app,next.stageId,'next');return showRest(app);}
G.HonroRestJourney={state,location,active,currentId,towards,chapterLabel,actOpen,actOf,hasRest,restNext,travel,requestRest,arrivalLines,unspentGrowth,observeGrowth,mountRestCamera,startEntry,restMarkup,drawPeople,drawActor,restGeometry,layoutRest,startMotion,stopMotion,frame,showRest,nextStory,saveStory,finishStory,talk,bookMarkup,showBook,selectBook,zoomBook,fitBook,revealBook,requestLaunch,confirmLaunch,recordOutcome,resultLabel,resultContinue};
})(globalThis);
