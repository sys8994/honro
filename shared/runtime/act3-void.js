(function(G){'use strict';
// This scene owns no combat clock. Only a temporary Seolo pose is animated;
// the saved return pose is restored before a battle can simulate again.
const KEY='act3-void-v1',REVISION=1,TRANSIENT=new Set(['FALLING','DARKENING','VOID','RETURNING']);
const TIMING=Object.freeze({fall:2.8,fade:1.8,quiet:.4,total:5});
const clamp=x=>Math.max(0,Math.min(1,x));
const clone=x=>structuredClone(x),state=b=>b?.honroAct3Void;
const enabled=b=>!!b&&!b.honroCustom&&b.honroStage===27&&state(b)?.revision===REVISION;
const blocked=app=>enabled(app?.engine?.b||app)&&TRANSIENT.has(state(app?.engine?.b||app)?.state);
const hero=b=>b?.units?.find(u=>u.side===0&&!u.summoned&&!u.enthrall&&u.cls==='archer');
const inZone=(u,z)=>!!u&&!!z&&u.x>=z.left&&u.x<=z.right&&Math.abs(u.y-z.y)<125;
const sceneLines=[
 {text:'담허 어른? 들리십니까?',wait:1.5,align:'near'},
 {text:'',wait:1.7,align:'far'},
 {text:'여긴 어디입니까? 방금 걷던 길이 보이지 않습니다.',wait:2.5,align:'near'},
 {text:'……돌아가라.',wait:1.5,align:'far'},
 {text:'거기 누가 있습니까?',wait:1.5,align:'near'},
 {text:'',wait:2.2,align:'far'},
 {text:'담허 어른에게 돌아가려면 어디로 가야 합니까?',wait:2.5,align:'near'},
 {text:'돌아가라.',wait:1.5,align:'far'}
];
const returnLines=[['담허','발을 헛디뎠나? 어디 다친 데는 없나?'],['설오','아닙니다. 그런데…… 아래가 없었습니다.'],['담허','아래가 없었다고?'],['설오','그렇게밖에 설명을 못 하겠습니다. 먼저 발 디딜 곳부터 확인하겠습니다.']];
function initializeFresh(b){if(b?.honroStage===27&&!b.honroCustom&&b.honroSplit?.version===2&&(b.honroMap?.act3?.waterworksRevision||0)>=3)b.honroAct3Void??={revision:REVISION,state:'READY'};}
function restorePose(b){const s=state(b),u=hero(b);if(s?.return?.unit&&u){for(const k of Object.keys(u))delete u[k];Object.assign(u,clone(s.return.unit));}if(s?.return?.active)b.active=s.return.active;}
function recover(b){if(!blocked(b))return false;restorePose(b);const s=state(b);if(s.return?.camera)s.recoveredCamera=clone(s.return.camera);delete s.return;delete s.fallProgress;s.state='READY';s.recovered=true;return true;}
function restoreRecoveredCamera(app){const s=state(app.engine?.b);if(!s?.recoveredCamera||!app.scene)return false;Object.assign(app.scene,clone(s.recoveredCamera));delete s.recoveredCamera;return true;}
function save(app){if(app.training||app.done)return;app.profile.honroBattle=clone(app.engine.b);app.dirty=true;app.persist?.();}
function cameraSnapshot(scene){return scene?Object.fromEntries(['x','y','scale','manual','focusId','focusUntil','speakerId','speakerUntil','storyTween','turnTarget'].map(k=>[k,clone(scene[k])])):null;}
function visual(b){const s=state(b);return enabled(b)&&['FALLING','DARKENING'].includes(s.state)&&s.return?{progress:s.fallProgress||0,origin:{x:s.return.unit.x,y:s.return.unit.y},seam:b.honroMap?.act3?.voidEncounter?.seam}:null;}
function safe(app){const e=app.engine,b=e?.b,u=hero(b);return enabled(b)&&state(b).state==='READY'&&!app.dialogue&&!app.done&&!app.modal?.classList.contains('open')&&b.phase==='aim'&&b.side===0&&!b.projectiles?.length&&!b.volley&&u&&!u.dead&&u.hp>0&&e.grounded(u)&&b.units.filter(v=>v.side===0&&!v.summoned).every(v=>!v.dead&&v.hp>0);}
function eligible(app){if(!safe(app)||state(app.engine.b).recovered)return false;const b=app.engine.b,z=b.honroMap?.act3?.voidEncounter?.trigger||b.honroMap?.act3?.crossings?.at(-1)?.landing;
 return inZone(hero(b),z);
}
function begin(app,reason='approach'){if(!safe(app))return false;const b=app.engine.b,s=state(b),u=hero(b);s.return={unit:clone(u),active:b.active,camera:cameraSnapshot(app.scene)};s.state='FALLING';s.fallProgress=0;s.reason=reason;delete s.recovered;
 app.cancelInput?.();app.acc=0;app.honroVoidSession={elapsed:0,line:0,lineAge:0,returning:0,focus:G.document?.activeElement,rootInert:app.root?.inert,rootAria:app.root?.getAttribute?.('aria-hidden'),hudOpacity:G.document?.body?.style?.getPropertyValue?.('--void-hud-opacity')||''};
 save(app);mountOverlay(app);app.updateAudio?.();return true;
}
function mountOverlay(app){if(!G.document?.createElement)return;const session=app.honroVoidSession,host=G.document.createElement('section');host.className='honro-void-scene';host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');host.setAttribute('aria-label','설오가 떨어진 검은 공간');host.setAttribute('aria-describedby','honro-void-instructions');host.tabIndex=-1;
 host.innerHTML='<canvas class="honro-void-actor" aria-hidden="true"></canvas><p class="honro-void-text" role="status" aria-live="polite" aria-atomic="true"></p><span id="honro-void-instructions" class="honro-void-sr">화면을 누르거나 Enter, Space로 이어갑니다. Escape 또는 화면을 길게 누르면 멈춤 메뉴가 열립니다. Tab으로 장면 넘기기와 멈춤 버튼을 찾을 수 있습니다.</span><button type="button" class="honro-void-surface" aria-label="다음 문장"></button><button type="button" class="honro-void-access honro-void-pause">잠시 멈춤</button><button type="button" class="honro-void-access honro-void-skip">장면 넘기기</button>';
 session.host=host;session.canvas=host.querySelector('canvas');session.text=host.querySelector('.honro-void-text');
 const surface=host.querySelector('.honro-void-surface');
 surface.onclick=ev=>{ev.preventDefault();if(session.suppressClick){session.suppressClick=false;return;}advance(app);};
 surface.onpointerdown=()=>{session.pressAge=0;session.pressing=true;};surface.onpointerup=surface.onpointercancel=()=>{session.pressing=false;};
 host.querySelector('.honro-void-pause').onclick=()=>pause(app);host.querySelector('.honro-void-skip').onclick=()=>skip(app);
 if(app.root){app.root.inert=true;app.root.setAttribute?.('aria-hidden','true');}G.document.body.classList.add('honro-void-active');G.document.body.appendChild(host);host.focus?.({preventScroll:true});
 paint(app);
}
function cleanup(app){const session=app.honroVoidSession;if(!session)return;session.host?.remove();if(app.root){app.root.inert=session.rootInert||false;if(session.rootAria==null)app.root.removeAttribute?.('aria-hidden');else app.root.setAttribute?.('aria-hidden',session.rootAria);}G.document?.body?.classList.remove('honro-void-active','honro-void-dark');if(session.hudOpacity)G.document?.body?.style?.setProperty?.('--void-hud-opacity',session.hudOpacity);else G.document?.body?.style?.removeProperty?.('--void-hud-opacity');
 app.honroVoidSession=null;app.acc=0;app.cancelInput?.();if(session.focus?.isConnected)session.focus.focus?.({preventScroll:true});
}
function restore(app){const b=app.engine?.b,s=state(b);if(!s)return;restorePose(b);if(s.return?.camera&&app.scene)Object.assign(app.scene,clone(s.return.camera));}
function finish(app){if(!blocked(app))return false;const b=app.engine.b,s=state(b);restore(app);delete s.return;delete s.fallProgress;s.state='RESOLVED';s.completed=true;cleanup(app);
 // This evidence is experiential, never substituted for the manifest. It is
 // copied to later fresh entries; old in-progress content is left untouched.
 app.profile.honroStoryEvents??={};app.profile.honroStoryEvents[KEY]=true;b.honroVoidWitness=true;
 save(app);app.updateAudio?.();app.updateHUD?.(true);const lines=returnLines.map(([who,text])=>[who,text,{storyId:KEY+'-return',storyTitle:'검은 집하장'}]);
 // Returning is already a safe authored story boundary; waiting for another
 // combat action would postpone Damheo's response until after the manifest.
 if(G.HonroStory?.start)G.HonroStory.start(app,lines,{title:'검은 집하장'});else app.sayLines?.(lines);return true;
}
function abort(app){if(!blocked(app)){cleanup(app);return false;}restore(app);const s=state(app.engine.b);delete s.return;delete s.fallProgress;s.state='READY';s.recovered=true;cleanup(app);app.updateAudio?.();save(app);return true;}
function advance(app){const session=app.honroVoidSession,s=state(app.engine?.b);if(!blocked(app)||!session||app.modal?.classList.contains('open')||s.state!=='VOID'||session.lineAge<sceneLines[session.line].wait)return false;
 session.lineAge=0;if(session.line<sceneLines.length-1)session.line++;else{s.state='RETURNING';session.returning=0;}paint(app);return true;
}
function skip(app){if(!blocked(app)||!app.honroVoidSession)return false;app.close?.();state(app.engine.b).state='RETURNING';app.honroVoidSession.returning=0;paint(app);return true;}
function pause(app){if(!blocked(app))return false;const session=app.honroVoidSession;if(session)session.pressing=false;app.open?.('<h2>잠시 머무르기</h2><div class="pause-menu"><button class="primary" data-action="close">돌아가기</button><button data-action="void-skip">장면 넘기기</button><button data-action="settings">설정</button><button data-action="void-leave">입구 화면으로 · 이 장면은 다시 걷기</button></div>','pause-dialog');return true;}
function key(app,ev){if(!blocked(app)||app.modal?.classList.contains('open'))return false;if(ev.ctrlKey||ev.metaKey||ev.altKey)return false;
 if(ev.code==='Escape'){ev.preventDefault();if(!ev.repeat)pause(app);return true;}
 if(ev.code==='Tab'){const host=app.honroVoidSession?.host,buttons=host?[...host.querySelectorAll('button')]:[],i=buttons.indexOf(G.document.activeElement);if(buttons.length&&(i<0||ev.shiftKey&&i===0||!ev.shiftKey&&i===buttons.length-1)){ev.preventDefault();buttons[ev.shiftKey?buttons.length-1:0].focus();}return true;}
 if(['Enter','Space'].includes(ev.code)){ev.preventDefault();if(!ev.repeat){const focus=G.document?.activeElement;if(focus?.classList?.contains('honro-void-pause'))pause(app);else if(focus?.classList?.contains('honro-void-skip'))skip(app);else advance(app);}return true;}
 // Combat shortcuts are consumed while the world is frozen; browser commands
 // remain available and the normal modal keeps its keyboard/focus behavior.
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyE','KeyF','ControlLeft','ControlRight'].includes(ev.code))ev.preventDefault();return true;
}
function paint(app){const session=app.honroVoidSession,b=app.engine?.b,s=state(b);if(!session||!session.host)return;session.host.dataset.phase=s.state;
 const falling=['FALLING','DARKENING'].includes(s.state),dark=falling?clamp((session.elapsed-TIMING.fall)/TIMING.fade):1,text=s.state==='VOID'?sceneLines[session.line].text:'';
 if(session.text.textContent!==text)session.text.textContent=text;session.text.dataset.align=sceneLines[session.line].align;
 session.host.style.setProperty('--void-dark',String(dark));G.document?.body?.style?.setProperty?.('--void-hud-opacity',String(1-dark));if(dark>=1)G.document?.body?.classList.add('honro-void-dark');
 const cv=session.canvas,c=cv?.getContext?.('2d');if(!c?.setTransform)return;const w=G.innerWidth||800,h=G.innerHeight||600,dpr=Math.min(2,G.devicePixelRatio||1);if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);}c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
 if(dark>0&&s.state!=='RETURNING'&&app.scene?.unitBody){const actor=hero(b),scale=app.scene.scale,rect=app.scene.canvas?.getBoundingClientRect?.()||{left:0,top:0,width:w,height:h};c.save();c.globalAlpha=dark;c.translate(rect.left+rect.width*.5,rect.top+rect.height*.5+48*scale);c.scale(scale,scale);c.translate(-actor.x,-actor.y);app.scene.unitBody(c,actor,0);c.restore();}
}
function drawFall(app){const scene=app.scene;if(!scene?.render)return;
 // Reuse the ordinary world painter with its existing presentation switches.
 // No battle or saved camera target is changed by suppressing combat chrome.
 const temporary={skillPreview:true,missionTargets:[],goalFocus:null,storyTween:null,cinematic:null},prior=Object.fromEntries(Object.keys(temporary).map(k=>[k,{owned:Object.prototype.hasOwnProperty.call(scene,k),value:scene[k]}]));
 try{Object.assign(scene,temporary);scene.render(app.engine,0,'',app.power,false,0,true);}
 finally{for(const [key,item]of Object.entries(prior)){if(item.owned)scene[key]=item.value;else delete scene[key];}}
}
function frame(app,dt){if(!blocked(app))return;const session=app.honroVoidSession;if(!session){recover(app.engine.b);restoreRecoveredCamera(app);app.updateAudio?.();return;}if(G.document?.hidden||app.modal?.classList.contains('open'))return;
 const s=state(app.engine.b);dt=Math.min(.06,Math.max(0,dt));session.elapsed+=dt;
 if(session.pressing){session.pressAge+=dt;if(session.pressAge>=.6){session.suppressClick=true;pause(app);return;}}
 if(['FALLING','DARKENING'].includes(s.state)){s.fallProgress=clamp(session.elapsed/(TIMING.fall+TIMING.fade));const u=hero(app.engine.b),original=s.return.unit,t=s.fallProgress;u.x=original.x+75*t*t;u.y=original.y+900*t*t;u.vx=0;u.vy=0;u.airborne=true;u.jumping=true;
  if(app.scene){app.scene.x=u.x;app.scene.y=u.y-48;app.scene.scale=s.return.camera.scale+(.95-s.return.camera.scale)*clamp(session.elapsed/TIMING.fall);app.scene.manual=true;drawFall(app);}
  if(session.elapsed>=TIMING.total){s.state='VOID';session.lineAge=0;}else if(session.elapsed>=TIMING.fall)s.state='DARKENING';
 }else if(s.state==='VOID'){session.lineAge+=dt;}else if(s.state==='RETURNING'){session.returning+=dt;if(session.returning>=.35){finish(app);return;}}
 paint(app);
}
function beforeManifest(app,m){if(!enabled(app.engine?.b)||m?.id!=='family-manifest'||state(app.engine.b).state==='RESOLVED')return false;
 // Guard the document itself as well as the approach. A longer gate shot,
 // a jumping route or Damheo taking the lead may never bypass this event.
 if(blocked(app))return true;const b=app.engine.b,u=hero(b),z=b.honroMap?.act3?.voidEncounter?.trigger||b.honroMap?.act3?.crossings?.at(-1)?.landing,nearManifest=u&&Math.abs(u.y-m.y)<=150&&Math.abs(u.x-m.x)<=520;
 if(!inZone(u,z)&&!nearManifest){app.event?.('설오도 명세가 놓인 심부 석대로 와야 합니다. 이어 둔 길로 합류하세요.');return true;}
 begin(app,'manifest');return true;
}
function attach(app,e){if(!enabled(e.b)||e.honroVoidAttached)return;e.honroVoidAttached=true;
 const tick=e.tick.bind(e);e.tick=function(dt){if(blocked(app))return;if(eligible(app)&&begin(app))return;return tick(dt);};
 // Reload returns to the safe world and waits for a deliberate movement,
 // gate or shot (or the guarded document), rather than reopening black at once.
 for(const method of ['move','fire','useGate'])if(e[method]){const original=e[method].bind(e);e[method]=function(...args){if(blocked(app))return false;if(state(e.b)?.recovered)delete state(e.b).recovered;return original(...args);};}
}
// The public Act3 interaction is shared by mouse, touch, E and Workshop. The
// lexical objective writer stays unchanged; validation still runs first.
if(G.HonroAct3){const use=G.HonroAct3.use;G.HonroAct3.use=function(app,m){if(enabled(app.engine?.b)&&m?.id==='family-manifest'&&G.HonroAct3.eligibility(app,m).ok&&beforeManifest(app,m))return false;return use(app,m);};}
G.HonroAct3Void={KEY,REVISION,TIMING,enabled,blocked,initializeFresh,recover,restoreRecoveredCamera,visual,eligible,begin,attach,frame,advance,skip,pause,key,finish,abort,beforeManifest,sceneLines,returnLines};
})(globalThis);
