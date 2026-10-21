(function(G){'use strict';
// Scene intent is expressed with stable chapter/scene metadata and real targets.
// Reading text is never parsed to guess a camera subject.
const openings={1:{anchor:'start'},2:{actor:'objective'},3:{actor:'npc-hwigyeom'},4:{actor:'objective'},5:{anchor:'cleat'},6:{actor:'objective'},7:{anchor:'resident1'},8:{anchor:'bier'},9:{anchor:'sodan'},10:{actor:'boss'},11:{marker:'knot-west'},12:{marker:'sign'},13:{actor:'resident-1'},14:{marker:'family-upper'},15:{marker:'groove'},16:{actor:'resident-1'},17:{anchor:'hoist'},18:{anchor:'bell'},19:{anchor:'bell'},20:{actor:'objective'},21:{marker:'gate-resident'},22:{marker:'ledger-case'},23:{actor:'objective'},24:{marker:'family-crest'},25:{marker:'depot-entry-seal'},26:{marker:'investigation-record'},27:{marker:'depot-route-ledger'},28:{marker:'water-release'},29:{marker:'hyeonmuk-letter'},30:{marker:'transport-map'}};
const policies={
 '1:event-1-witness':{intent:'object-introduction',targets:[{actor:'npc-woodcutter'},{actor:'archer'},{cart:true}],padding:52,maxScale:.9},
 '2:entry':{intent:'situation',targets:[{actor:'objective'},{actor:'npc-damheo'},{actor:'archer'}],padding:70,maxScale:.8},
 '2:event-2-road-pressure':{intent:'object-introduction',targets:[{actor:'objective'},{actor:'npc-damheo'}],padding:75,maxScale:.85},
 '2:event-2-sniper-seen':{intent:'situation',targets:[{anchor:'rightShelf'},{actor:'archer'}],padding:70,maxScale:.8},
 '1:event-1-cart':{intent:'situation',targets:[{anchor:'cart'}],padding:100,maxScale:.8},
 '1:event-1-more':{intent:'situation',targets:[{actor:'foe-1-cluster'}],padding:80,maxScale:.8},
 '1:event-1-ridge':{intent:'situation',targets:[{anchor:'ridge'}],padding:100,maxScale:.75},
 '2:outcome':{intent:'conversation',targets:[{actor:'objective'},{actor:'npc-damheo'},{actor:'npc-yeonsil'}],padding:45,maxScale:1},
 '8:entry':{intent:'object-introduction',targets:[{anchor:'bier'},{actor:'archer'}],padding:75,maxScale:.75},
 '9:entry':{intent:'situation',targets:[{anchor:'sodan'},{anchor:'receiverWest'},{anchor:'receiverEast'}],padding:60,maxScale:.8},
 '10:cooperation':{intent:'situation',targets:[{actor:'boss'},{actor:'mage'},{anchor:'receiverWest'},{anchor:'receiverEast'}],padding:45,maxScale:.8},
 '10:finale-midpoint':{intent:'conversation',targets:[{actor:'boss'},{actor:'archer'},{actor:'mage'}],padding:40,maxScale:1},
 '19:entry':{intent:'conversation',targets:[{actor:'mourner-brother'},{actor:'mourner-sister'},{actor:'occultist'},{anchor:'bell'}],padding:45,maxScale:.8}
};
const alive=u=>u&&!u.dead&&u.hp>0;
function actor(b,id){return b.units.find(u=>u.id===id)||b.honroConvoyActors?.find(u=>u.id===id)||Object.values(b.honroStaging?.hidden||{}).find(u=>u.id===id)||b.units.find(u=>u.cls===id&&u.side===0&&!u.summoned);}
function speakerId(app,name){const aliases={11:{'주민':'resident-4'},23:{'짐꾼':'act3-carrier'}},bound=aliases[app.engine.b.honroStage]?.[name];if(bound&&alive(actor(app.engine.b,bound)))return bound;const u=G.HonroStoryDirection?.speaker(app,name)||app.speakerUnits?.(name)?.find(alive)||app.engine.b.units.find(u=>u.name===name&&alive(u))||Object.values(app.engine.b.honroStaging?.hidden||{}).find(u=>u.name===name&&alive(u));return u?.id;}
// These are authored story-row identities, before interludes/deferred pages
// are composed. They remain stable whether the arrival has already been read.
function authorEntry(st){if(st.id!==2)return;const plans={
 0:{intent:'situation',targets:[{actor:'objective'},{actor:'npc-damheo'},{actor:'archer'}],padding:70,maxScale:.8},
 1:{intent:'object-introduction',targets:[{actor:'objective'},{actor:'npc-damheo'}],padding:65,maxScale:.9},
 2:{intent:'conversation',targets:[{actor:'objective'},{actor:'npc-damheo'}],padding:60,maxScale:.9},
 3:{intent:'portrait',targets:[{actor:'archer'}],padding:40,maxScale:1},
 4:{intent:'object-introduction',targets:[{actor:'objective'},{actor:'npc-damheo'}],padding:65,maxScale:.9},
 5:{intent:'portrait',targets:[{actor:'archer'}],padding:40,maxScale:1}};
 st.story=st.story.map(([who,text,meta={}],i)=>[who,text,{...meta,...(plans[i]?{camera:{...plans[i],id:`2:entry:story-${i}`}}:{})}]);
}
function sceneKey(app,lines,options){const id=lines[0]?.[2]?.storyId||options.id||options.after||'runtime';return id.replace(/^act1-v6:/,'').replace(new RegExp('^(entry|outcome)-'+app.stage.id+'$'),'$1');}
function conversation(app,who,subjects){
 const primary={speaker:who},p=bounds(app,primary),near=subjects.map(t=>({target:t,box:bounds(app,t)})).filter(v=>v.box&&p&&Math.abs(v.box.x-p.x)+Math.abs(v.box.y-p.y)>1).map(v=>({...v,distance:Math.hypot(v.box.x-p.x,v.box.y-p.y)})).filter(v=>v.distance<=950).sort((a,b)=>a.distance-b.distance).slice(0,2);
 return{intent:near.length?'conversation':'portrait',targets:[primary,...near.map(v=>v.target)],padding:40,maxScale:1.05,participants:subjects};
}
function bind(app,lines,options){if(!app.engine||app.screen!=='battle')return lines;
 const b=app.engine.b,key=sceneKey(app,lines,options),stage=b.honroStage,names=[...new Set(lines.filter(l=>G.HonroStory.speakerPresentation(l[0],l[2]).kind==='character').map(l=>l[0]))];
 const subjects=names.map(n=>speakerId(app,n)?{actor:speakerId(app,n)}:{speaker:n});
 return lines.map(([who,text,meta={}],index)=>{
  if(meta.camera)return[who,text,meta];
  const kind=G.HonroStory.speakerPresentation(who,meta).kind,scenePolicy=Object.entries(policies).find(([id])=>id.startsWith(stage+':')&&(key===id.slice(id.indexOf(':')+1)||key.endsWith(':'+id.slice(id.indexOf(':')+1))||key.includes(id.slice(id.indexOf(':')+1))))?.[1];
  let camera=scenePolicy?{...scenePolicy}:kind==='character'?conversation(app,who,subjects):{intent:'situation',targets:subjects.length?subjects:[openings[stage]||{objective:'current'}],padding:65,maxScale:.8};
  // An explicit authored objective overrides scene-wide conversational framing.
  if(meta.focus)camera={intent:'object-introduction',targets:[{objective:meta.focus}],padding:85,maxScale:.85};
  if(meta.eventSource){const source=meta.eventSource,targets=source.startsWith('objective:')||source.startsWith('interaction:')||source.startsWith('route:')?[{marker:source.slice(source.indexOf(':')+1)}]:({
   'escort-handoff':[{actor:'objective'}],'escort-road-cleared':[{actor:'objective'}],
   'ritual-held':[{marker:'receiver-5'},{anchor:'cleat'}],'ritual-released':[{marker:'receiver-5'},{anchor:'cleat'}],
   'refugee-following':[{actor:'objective'}],'resident-shelters':[{actor:'resident-4'}],
   'drain-revealed':[{marker:'sluice'}],'quarry-gate-open':[{marker:'route-lower-exit'}],
   'brace-restored':[{anchor:'repair'}],'quarry-collapse':[{anchor:'brace'}],
   'sodan-binding-loosened':[{actor:'boss'}],'bell-settled':[{anchor:'bell'}],
   'cargo-settled':[{x:4230,y:4290}],'ferry-settled':[{objective:'current'}],
   'soul-released':[{actor:'occultist'}],'royal-gate-open':[{actor:'objective'}]
  })[source]||[{actor:b.active}];camera={intent:'situation',targets,padding:75,maxScale:.85};}
  if(meta.eventSource==='relic-found'){const u=app.engine.active,m=b.honroMarkers.filter(m=>m.type==='relic').sort((a,c)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y))[0];if(m)camera={intent:'object-introduction',targets:[{marker:m.id}],padding:65,maxScale:.85};}
  if(kind==='guide')camera={intent:'objective',targets:[{objective:meta.focus&&G.HonroObjectives.focus(app,meta.focus)?meta.focus:'current'}],padding:100,maxScale:.75};
  const cue=options.staging?.cues?.[index]?.find(s=>s.camera||s.type==='look'&&!s.actor);
  if(cue&&kind!=='guide'&&!scenePolicy){const at=cue.at||{actor:cue.actor};if(at)camera={intent:'object-introduction',targets:[at],padding:65,maxScale:cue.scale||.9};}
  camera.targets=camera.targets.flatMap(t=>t.markers?t.markers.map(marker=>({marker})):t.between?t.between.map(actor=>({actor})):t);
  return[who,text,{...meta,camera:{...camera,id:`${stage}:${key}:${index}`}}];
 });
}
function bounds(app,target){const b=app.engine.b;
 if(target.cart){const p=G.HonroAct1StoryArt?.witnessCart(b);return p?{x:p.x-p.w/2,y:p.y-p.h,w:p.w,h:p.h}:null;}
 let u;if(target.speaker)u=actor(b,speakerId(app,target.speaker));else if(target.actor)u=actor(b,target.actor);
 if(u&&alive(u))return{x:u.x-Math.max(u.r,22),y:u.y-(G.HonroPartyPresentationHeight?.(u)||u.h)-18,w:Math.max(u.r*2,44),h:(G.HonroPartyPresentationHeight?.(u)||u.h)+28};
 let p;if(target.objective){const s=G.HonroObjectives.state(b,app.stage);p=target.objective==='current'?s.targets[0]:G.HonroObjectives.focus(app,target.objective);if(p?.unitId||p?.target)u=actor(b,p.unitId||p.target);if(p?.box){const t=p.box;return{x:t.x,y:t.y,w:t.w,h:t.h};}if(u&&alive(u))return bounds(app,{actor:u.id});}
 else if(target.anchor)p=b.honroMapAnchors?.[target.anchor];
 else if(target.marker)p=b.honroMarkers?.find(m=>m.id===target.marker)||G.HonroQuestTargets.records(b).find(t=>t.id===target.marker);
 else if(Number.isFinite(target.x)&&Number.isFinite(target.y))p=target;
 if(!p)return null;
 return{x:p.x+(target.dx||0)-(p.w?0:30),y:p.y+(target.dy||0)-(p.h?0:90),w:p.w||60,h:p.h||100};
}
function safeRect(scene){const {w,h}=scene.size(),canvas=scene.canvas.getBoundingClientRect(),pad=w<600?14:30;let top=pad,bottom=h-pad;
 for(const selector of ['.battle-head','.minimap-dock','.allied-roster']){const header=G.document.querySelector(selector)?.getBoundingClientRect?.();if(header?.height)top=Math.max(top,header.bottom-canvas.top+12);}
 const panel=G.document.querySelector('#dialogue-root .story-scene,#dialogue-root .story-guide')?.getBoundingClientRect?.();
 if(panel?.height){if(panel.top-canvas.top<h*.45)top=Math.max(top,panel.bottom-canvas.top+14);else bottom=Math.min(bottom,panel.top-canvas.top-14);}
 return{x:pad,y:top,w:Math.max(80,w-pad*2),h:Math.max(30,bottom-top)};
}
function apply(scene,e){const f=scene.storyFrame;if(!f)return;const {app,camera}=f,{w,h}=scene.size();
 const signature=[w,h,camera.id,G.document.querySelector('#story-line')?.textContent].join(':');if(f.layout!==signature){f.rect=safeRect(scene);f.layout=signature;}
 const boxes=camera.targets.map(t=>bounds(app,t)),missing=camera.targets.filter((_,i)=>!boxes[i]);let valid=boxes.filter(Boolean),fallback=null;
 if(!valid.length){const goal=G.HonroObjectives.state(e.b,app.stage).targets[0],u=e.active;fallback=goal?'current-objective':'active-actor';valid=[goal?bounds(app,{objective:'current'}):u?bounds(app,{actor:u.id}):null].filter(Boolean);}
 if(!valid.length)return;
 const pad=camera.padding??45,x=Math.min(...valid.map(p=>p.x))-pad,y=Math.min(...valid.map(p=>p.y))-pad,right=Math.max(...valid.map(p=>p.x+p.w))+pad,bottom=Math.max(...valid.map(p=>p.y+p.h))+pad,rect=f.rect;
 const scale=Math.max(.025,Math.min(camera.maxScale||1,rect.w/Math.max(1,right-x),rect.h/Math.max(1,bottom-y)));
 let cx=(x+right)/2-(rect.x+rect.w/2-w/2)/scale,cy=(y+bottom)/2-(rect.y+rect.h/2-h/2)/scale;
 const focus=G.HonroBounds.focus(e.b),rangeX=[Math.max(focus.left,right-(rect.x+rect.w-w/2)/scale),Math.min(focus.right,x-(rect.x-w/2)/scale)],rangeY=[Math.max(focus.top,bottom-(rect.y+rect.h-h/2)/scale),Math.min(focus.bottom,y-(rect.y-h/2)/scale)];
 const boundary={overscanX:rangeX[0]>rangeX[1],overscanY:rangeY[0]>rangeY[1]};
 if(!boundary.overscanX)cx=Math.max(rangeX[0],Math.min(rangeX[1],cx));if(!boundary.overscanY)cy=Math.max(rangeY[0],Math.min(rangeY[1],cy));
 // Targets may move during authored cues. Fit their current union on every frame;
 // only DOM layout is cached. This has no gameplay-camera clamp or fixed zoom.
 scene.x=cx;scene.y=cy;scene.scale=scale;scene.manual=true;scene.goalFocus=null;scene.storyTween=null;
 scene.storyFrameReport={id:camera.id,intent:camera.intent,targets:camera.targets,missing,fallback,boxes:valid,rect,boundary,camera:{x:cx,y:cy,scale}};
}
function focus(app,meta){if(!app.scene||!meta.camera)return false;app.scene.storyFrame={app,camera:meta.camera};return true;}
function clear(scene){if(scene){scene.storyFrame=null;scene.storyFrameReport=null;}}
function highlight(scene,e){if(scene.storyFrame?.camera.intent!=='objective')return;const c=scene.ctx,r=scene.storyFrameReport;if(!r)return;c.save();c.strokeStyle='#f0d58c';c.lineWidth=2/scene.scale;
 for(const box of r.boxes){c.beginPath();c.ellipse(box.x+box.w/2,box.y+box.h-4,Math.max(42,box.w*.7),14,0,0,Math.PI*2);c.stroke();const x=box.x+box.w/2,y=box.y-18;c.beginPath();c.moveTo(x-9/scene.scale,y-10/scene.scale);c.lineTo(x,y);c.lineTo(x+9/scene.scale,y-10/scene.scale);c.stroke();}
 const exit=e.b.honroMapAnchors?.exit,first=r.boxes[0];if(exit&&first){const x=first.x+first.w/2,y=first.y+first.h,dx=exit.x-x,dy=exit.y-y,len=Math.hypot(dx,dy);if(len>100){const k=Math.min(110/scene.scale,len*.35)/len,tx=x+dx*k,ty=y+dy*k;c.setLineDash([7/scene.scale,5/scene.scale]);c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.stroke();c.setLineDash([]);const a=Math.atan2(dy,dx),n=10/scene.scale;c.beginPath();c.moveTo(tx-Math.cos(a-.5)*n,ty-Math.sin(a-.5)*n);c.lineTo(tx,ty);c.lineTo(tx-Math.cos(a+.5)*n,ty-Math.sin(a+.5)*n);c.stroke();}}
 c.restore();}
G.HonroStoryFraming={authorEntry,highlight,bind,focus,clear,apply,bounds,openings,policies,safeRect};
})(globalThis);
