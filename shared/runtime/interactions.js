(function(G){'use strict';
const $=id=>document.getElementById(id),RANGE=260;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const automaticKinds=new Set(['evidence','clear','hold','defeat','destroy','reach','escort','route','pacing-event','pacing-secure']);
function automaticMarker(b,m){
 if(!b||!m||!['act2','act3'].includes(m.action))return false;
 if(G.HonroAct23V4Reviewed?.automaticMarker(b,m))return true;
 if(G.HonroAct23V4?.active(b))return false;
 const owner=m.action==='act2'?G.HonroAct2:G.HonroAct3;
 return automaticKinds.has(owner?.steps?.(b).find(s=>s.id===m.id)?.kind)||(b.honroRouteSpec?.routes||[]).some(r=>r.markerId===m.id);
}
const waterfallText=(b,value)=>G.HonroStage5Waterfall?.textFor(b,value)??value;
function eligibility(app,m){let result=rawEligibility(app,m);if(result.ok)result=G.HonroAct1ReviewRepairs?.installation(app,m)||result;const b=app.engine?.b,reason=waterfallText(b,result.reason);return {...result,reason:G.HonroAct23V4ReviewedChapters?.actionText(b,reason)??G.HonroAct3V4ReviewedCore?.interactionReason(app,reason)??G.HonroAct23V4ReviewedChapters?.interactionText(b,reason)??reason};}
function rawEligibility(app,m){if(automaticMarker(app.engine?.b,m))return{ok:false,reason:app.engine.b.honroStage===11?G.HonroAct23V4Reviewed.instruction(app.engine.b):'이 목표는 자동 진행됩니다'};const e=app.engine,b=e?.b,u=e?.active;if(u?.retreat)return{ok:false,reason:'이탈보 · 이동/점프만 가능'};if(m?.action==='skillGate'){const plan=e?.gateResolution();return app.canInput()?plan||{ok:false,reason:'축지진목을 찾을 수 없음'}:{ok:false,reason:'현재 행동이 끝난 뒤'};}if(!e||!u||!m||m.collected||u.side!==0||u.dead)return{ok:false,reason:'상호작용할 수 없음'};const point=G.HonroObjectives.interactionTarget(b,m);if(!point)return{ok:false,reason:'구조할 주민이 없음'};const d=Math.hypot(u.x-point.x,(u.y-point.y)*.75);if(d>RANGE)return{ok:false,reason:'더 가까이 이동'};if(Math.abs(u.y-point.y)>150)return{ok:false,reason:'같은 층으로 이동'};if(m.action==='ritual'&&b.honroState.ritual?.active)return{ok:false,reason:'의식 유지 중 · 이탈 시 해제'};if(m.action==='ritual'&&(Math.abs(u.x-m.x)>125||Math.abs(u.y-m.y)>80||!e.grounded(u)))return{ok:false,reason:'받이진 안에 서세요'};if(m.requiredClass&&u.cls!==m.requiredClass)return{ok:false,reason:`${G.HONRO_CONTENT.hero[m.requiredClass]?.name||'지정 인물'} 필요`};if(!app.canInput())return{ok:false,reason:'현재 행동이 끝난 뒤'};if(m.action==='act2')return G.HonroAct2.eligibility(app,m);if(m.action==='act3')return G.HonroAct3.eligibility(app,m);return{ok:true,reason:m.action==='ritual'?'의식 시작':'상호작용'};}
function candidates(app){if(!app.engine||app.done)return[];const e=app.engine,u=e.active;if(!u||u.side!==0||u.dead)return[];const v4=G.HonroAct23V4,chapter13=e.b.honroStage===13&&v4?.active(e.b);
 const ready=chapter13?new Set(v4.readySteps(e.b).map(s=>s.id)):null;
 const gate=e.gateCandidate(),markers=[...(e.b.honroMarkers||[]),...(gate?[{...gate,id:'skillGate-'+gate.id,action:'skillGate',label:'축지진목'}]:[])];return markers.filter(m=>m.action&&!m.collected&&!automaticMarker(e.b,m)&&(!ready||m.action!=='act2'||ready.has(m.id))&&!(m.action==='act2'&&G.HonroAct2.retiredSafety(e.b,m.id))).flatMap(m=>{const point=G.HonroObjectives.interactionTarget(e.b,m);return point&&Math.hypot(u.x-point.x,(u.y-point.y)*.75)<=RANGE+70?[{marker:m,d:Math.hypot(u.x-point.x,u.y-point.y),...eligibility(app,m)}]:[];}).sort((a,b)=>Number(b.ok&&b.marker.action==='skillGate')-Number(a.ok&&a.marker.action==='skillGate')||a.d-b.d);}
function linesFor(app,m){return G.HonroStoryContent.interaction(app,m)||[];}
function use(app,m){const ok=eligibility(app,m);if(!ok.ok)return false;if(m?.action==='skillGate'){const used=app.engine.useGate();if(used){app.dirty=true;app.updateHUD(true);}refresh(app);return used;}const e=app.engine,b=e.b,hs=b.honroState,u=e.active;
 if(m.action==='act3'){const used=G.HonroAct3.use(app,m);refresh(app);return used;}
 if(m.action==='act2'){const used=G.HonroAct2.use(app,m);refresh(app);return used;}
 if(m.action==='authored'){if(m.authoredAction&&G.HonroAllies.execute(app,m.authoredAction)===false)return false;m.collected=true;hs.flags['interact:'+m.id]=true;G.HonroObjectiveContributions?.interact(b,m.id,u);if(m.lines?.length)app.sayLines(m.lines);else app.event(m.label,{kind:'narration',source:'interaction:'+m.id});if(!app.checkMission(e))e.finishAction();app.dirty=true;refresh(app);return true;}
 if(m.action==='ritual'){hs.ritual={active:true,holderId:u.id};hs.waterfallSight=true;const veil=b.terrain.find(t=>t.id==='waterfall-veil');if(G.HonroStage5Waterfall?.active(b))G.HonroStage5WaterGeometry.setOpen(b,true);else if(veil){veil.broken=true;b.sceneVersion++;}e.fx('ring',m.x,m.y-20,'#a5c9bd',95);const lines=hs.flags['ritual-explained']?[]:linesFor(app,m);hs.flags['ritual-explained']=true;if(lines.length)app.sayLines(lines);if(!lines.length)app.event(waterfallText(b,'담허가 받이진을 유지한다. 설오로 바꾸어 열린 물틈의 고리쇠를 노리자.'),{kind:'narration',source:'ritual-held'});if(!app.checkMission(e))e.finishAction();app.dirty=true;refresh(app);return true;}
 if(m.action==='rescue'){const target=e.unit(m.target);G.HonroObjectiveContributions?.approach(b,m.id,[u],target,220,!!target&&!e.alive(1).some(v=>Math.abs(v.y-target.y)<=150&&Math.hypot(v.x-target.x,(v.y-target.y)*.75)<=220));}
 m.collected=true;if(m.action==='ledger')hs.ledger=true;if(m.action==='receiver'){hs.receivers=(hs.receivers||0)+1;e.fx('ring',m.x,m.y-20,'#b8c999',65);}if(m.action==='rescue'){hs.rescuedCount=(hs.rescuedCount||0)+1;const target=e.unit(m.target);if(target){target.shield=Math.max(target.shield||0,60);target.fixed=true;target.honroResolved=true;e.fx('ring',target.x,target.y-target.h*.5,'#a7c3ad',60);}}
 G.HonroObjectiveContributions?.interact(b,m.id,u,{rescue:m.action==='rescue'});
 const lines=linesFor(app,m);if(lines.length)app.sayLines(lines);const staged=m.action==='receiver'&&G.HonroStoryStaging?.receiver(app,m);if(!lines.length&&!staged)app.event(m.action==='ledger'?'홍만의 장부를 찾았다.':m.action==='receiver'?'받이진을 세웠다.':'들린 사람에게서 원혼을 떼어냈다.',{kind:'narration',source:'interaction:'+m.id});if(!app.checkMission(e))e.finishAction();app.dirty=true;refresh(app);return true;
}
function refresh(app){
 const host=$('context-interact');if(!host)return;
 const near=candidates(app),one=near.find(x=>x.ok)||near[0],b=app.engine?.b;
 const marker=one?.marker,enabled=!!one?.ok;
 const title=marker&&(G.HonroAct23V4ReviewedChapters?.actionText(b,marker.id)??G.HonroAct23V4ReviewedChapters?.interactionText(b,marker.label)??marker.label);
 const text=enabled?(one.actionLabel??title):one?.reason,sig=marker?JSON.stringify([marker.id,enabled,text]):'none';
 if(host.dataset.sig===sig)return;host.dataset.sig=sig;host.hidden=!marker;
 if(!marker){host.innerHTML='';return;}
 const label=waterfallText(b,({skillGate:'축지',ledger:'장부 확인',receiver:'받이진 설치',ritual:'담허의 의식',rescue:'구조'})[marker.action]||'상호작용');
 host.innerHTML=`<button type="button" ${enabled?'':'disabled'} data-context-interact="${escape(marker.id)}" aria-label="${escape(label)} · ${escape(text)}"><span>${escape(label)}</span><strong>${escape(text)}</strong></button>`;
}
function mount(app){const battle=app.root.querySelector('.battle');if(!battle||$('context-interact'))return;const el=document.createElement('div');el.id='context-interact';el.className='context-interact';el.hidden=true;battle.appendChild(el);refresh(app);}
function nearest(app){return candidates(app).find(x=>x.ok)?.marker||null;}
function key(app,e){
 if(e.code!=='KeyE'||e.repeat||app.dialogue||app.modal?.classList.contains('open'))return false;
 const near=candidates(app),ready=near.find(x=>x.ok);
 if(ready){e.preventDefault();use(app,ready.marker);return true;}
 if(app.engine?.manualDive()||app.engine?.turnArrow(app.scene?.turnTarget)){e.preventDefault();return true;}
 if(!near.length)return false;
 e.preventDefault();app.engine.message(near[0].reason);return true;
}
document.addEventListener('click',e=>{const btn=e.target.closest?.('[data-context-interact]');if(!btn)return;const app=G.HonroApp,m=app?candidates(app).find(x=>x.marker.id===btn.dataset.contextInteract)?.marker:null;if(app&&m)use(app,m);});
G.HonroInteractions={mount,refresh,nearest,use,key,candidates,eligibility};
})(globalThis);
