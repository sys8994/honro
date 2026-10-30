(function(G){'use strict';
// Per-stage event coordinates; authored stages may relocate them (design.act4.coords). Defaults = original layout.
const K=(b,k,d)=>{const v=b?.honroAct4Design?.coords?.[k];return Number.isFinite(v)?v:d;};
// Isolated review adapter: the seed JSON is the only source of user-facing
// prose. Receipt IDs are observations; terminal cursors never imply observation.
const P=G.HonroAct4TerrainPreview,C=G.HONRO_CORE;if(P.attachEvents)return;
const alive=u=>!!u&&!u.dead&&u.hp>0;
const party=b=>b.units.filter(u=>u.side===0&&!u.summoned&&alive(u));
const boarding=b=>({...{dockX:6470,deckX:6260,deckY:1860,deckW:450,boardX1:6285,boardX2:6685,approachX:5900,approachY:1735,boatY:1910},...(b.honroAct4Design?.boarding||{})});
const memory=b=>b.honroAct4PreviewState??={version:1,clock:0,events:{},receipts:[],boat:{phase:'waiting',x:500},door:{phase:'standing',time:0},complete:false};
const seed=(n,key)=>G.HONRO_ACT4_PREVIEW_SEEDS.scenes.find(s=>s.stage===n&&s.event===key);
const shown=node=>!!node&&!!node.getClientRects().length&&(!node.checkVisibility||node.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}));
const event=(q,key)=>q.events[key]??={started:false,terminal:false,presented:[],retired:[]};
function inView(app,p,pad=0){const s=app.scene,cv=s.canvas,w=cv.clientWidth,h=cv.clientHeight;return Math.abs(p.x-s.x)<w/(2*s.scale)-pad&&Math.abs(p.y-s.y)<h/(2*s.scale)-pad;}
function receipt(q,e,id){e.retired=e.retired.filter(v=>v!==id);if(!e.presented.includes(id))e.presented.push(id);if(!q.receipts.includes(id))q.receipts.push(id);}
function play(app,key,bark=false){const b=app.engine.b,q=memory(b),e=event(q,key),s=seed(b.honroAct4Preview,key);if(e.started||!s||app.dialogue||q.reader||q.bark)return false;
 e.started=true;const lines=s.lines.filter(([id,who])=>{if(app.canSpeak(who)&&(!P.rowAllowed||P.rowAllowed(app,id)))return true;e.retired.push(id);return false;});
 if(!lines.length){e.terminal=true;return true;}
 if(bark){q.bark={key,index:0,elapsed:0,lines};return true;}
 q.reader={key,ids:lines.map(l=>l[0])};G.HonroStory.start(app,lines.map(([id,who,text])=>[who,text,{kind:'character',act4PreviewRow:id}]),{id:'act4-preview-'+b.honroAct4Preview+'-'+key,title:app.stage.name});
 return true;
}
function quiet(b){return !b.units.some(u=>u.side===1&&alive(u))&&!b.projectiles.length&&!b.volley&&b.phase==='aim'&&(!P.quietReady||P.quietReady(b));}
const tourViews=[{key:'boat',x:550,y:1770,scale:.64,point:{x:500,y:1735}},{key:'dock',x:6150,y:1790,scale:.56,point:{x:6150,y:1890}},{key:'threat',x:1510,y:1780,scale:.55,point:{x:1390,y:1864}}];
function arrivalTour(app,q,dt){const t=q.arrivalTour;if(!t?.active)return false;if(app.modal.classList.contains('open')||G.document.hidden)return true;const v=(app.engine.b.honroAct4Design?.boarding?.tourViews||tourViews)[t.index];if(!v){t.active=false;if(!P.startCamera?.(app))Object.assign(app.scene,{manual:false,x:boarding(app.engine.b).startX??450,y:boarding(app.engine.b).startY??1840,scale:G.innerWidth<600?.62:.94});play(app,'arrival');return false;}Object.assign(app.scene,{manual:true,x:v.x,y:v.y,scale:v.scale,storyTween:null,cinematic:null,goalFocus:null,storyFrame:null});if(t.seen?.[v.key]!==undefined){t.elapsed=(t.elapsed||0)+dt;if(t.elapsed>.8){t.index++;t.elapsed=0;}}return true;}
function observe(app,dt){const b=app.engine?.b;if(!(b?.honroCustom||b?.honroAct4Official===1)||!b.honroAct4Preview)return;const q=memory(b),n=b.honroAct4Preview;q.clock+=dt;
 P.coastObserve?.(app,dt);
 if(q.reader){const e=event(q,q.reader.key),d=app.dialogue,line=d?.lines[d.index],node=G.document.getElementById('story-line');
  if(line?.[2]?.act4PreviewRow&&node?.textContent===line[1]&&shown(node)&&!app.modal.classList.contains('open')&&!G.document.hidden&&app.canSpeak(line[0])&&(!P.rowAllowed||P.rowAllowed(app,line[2].act4PreviewRow)))receipt(q,e,line[2].act4PreviewRow);
  if(!d){e.terminal=true;for(const [id]of seed(n,q.reader.key).lines)if(!e.presented.includes(id)&&!e.retired.includes(id))e.retired.push(id);q.reader=null;}
 }
 if(q.bark&&!app.dialogue){const k=q.bark,e=event(q,k.key),node=G.document.getElementById('banter');
  while(k.index<k.lines.length&&(!app.canSpeak(k.lines[k.index][1])||(P.rowAllowed&&!P.rowAllowed(app,k.lines[k.index][0])))){const id=k.lines[k.index][0];if(!e.retired.includes(id))e.retired.push(id);k.index++;k.elapsed=0;}
  const line=k.lines[k.index];if(!line){if(node)node.hidden=true;e.terminal=true;q.bark=null;}
  else if(node&&!G.document.hidden){node.hidden=false;node.setAttribute('role','status');node.replaceChildren();const strong=G.document.createElement('strong');strong.textContent=line[1];node.append(strong,G.document.createTextNode(' '+line[2]));if(!shown(node))return;receipt(q,e,line[0]);k.elapsed+=dt;if(k.elapsed>=Math.max(2.4,1.8+line[2].length*.075)){k.index++;k.elapsed=0;}}
 }
 if(n===31){
  const cfg=boarding(b);
  if(arrivalTour(app,q,dt))return;
  if(['docked','boarded'].includes(q.boat.phase)){const text=G.HONRO_ACT4_PREVIEW_SEEDS.ui.find(v=>v[0]==='A4.S31.BOARD_OBJECTIVE')[1],goal=G.document.getElementById('objective-text');app.stage.goal=text;if(goal){const instruction=G.HonroAct4Content?.active(b)?G.HonroObjectives.state(b,app.stage).currentInstruction:text;if(goal.textContent!==instruction)goal.textContent=instruction;}}
  if(!q.events.arrival?.started&&party(b).some(u=>app.engine.grounded(u))&&inView(app,{x:500,y:cfg.approachY})&&inView(app,{x:6150,y:cfg.deckY+30}))play(app,'arrival');
  if(quiet(b)&&q.boat.phase==='waiting'&&!app.dialogue&&!q.reader){q.boat.phase='approach';play(app,'boat_approach');}
  if(q.boat.phase==='approach'&&!app.dialogue){q.boat.x=Math.min(cfg.dockX,q.boat.x+dt*360);if(q.boat.x===cfg.dockX){q.boat.phase='docked';app.stage.goal=G.HONRO_ACT4_PREVIEW_SEEDS.ui.find(v=>v[0]==='A4.S31.BOARD_OBJECTIVE')[1];const goal=G.document.getElementById('objective-text');if(goal)goal.textContent=G.HonroAct4Content?.active(b)?G.HonroObjectives.state(b,app.stage).currentInstruction:app.stage.goal;if(!b.terrain.some(t=>t.id==='a4-boat-deck')){b.terrain.push({id:'a4-boat-deck',x:cfg.deckX,y:cfg.deckY,w:cfg.deckW,h:24,mat:'wood',indestructible:true,oneWay:true,hp:9999,maxHp:9999});b.sceneVersion++;}play(app,'board_ready');}}
  const boat=b.honroAct4PreviewDynamic?.find(l=>l.asset?.id==='a4:boat');if(boat){boat.x=q.boat.x;const approach=Math.max(0,Math.min(1,(q.boat.x-cfg.approachX)/(cfg.dockX-cfg.approachX)));boat.y=cfg.approachY+(cfg.boatY-cfg.approachY)*approach;boat.scale=.6+.4*approach;}
  // MID advice remains withheld until a real reviewed-bank arc was observed.
  if(q.arcObserved&&inView(app,{x:4140,y:cfg.arcY??1730})&&party(b).some(u=>u.x>3400&&u.x<4000))play(app,'second_bank',true);
 }
 if(n===35){if(!q.events.entry?.started&&inView(app,{x:900,y:1800}))play(app,'entry');
  // The clearing advice requires explicit real shot receipts, never a string
  // or metadata-only assertion. The focused projectile audit supplies these.
  if(q.blockedAtBamboo&&q.clearShotFromSide&&q.clock-(q.blockedAt??-100)<2&&alive(app.engine.unit(q.clearShotTarget))&&app.engine.active?.x>3000&&app.engine.active?.x<3090)play(app,'blocked_shot',true);
  if(party(b).some(u=>u.x>6500)&&inView(app,{x:6980,y:1800}))play(app,'edge');
 }
 if(n===36){
  if(quiet(b)&&party(b).some(u=>u.cls==='knight'&&u.x>K(b,'arrivalX',1800))&&inView(app,{x:K(b,'arrivalViewX',3000),y:K(b,'arrivalViewY',2040)}))play(app,'arrival');
  if(q.door.phase==='falling'&&!app.dialogue){q.door.time=Math.min(1,q.door.time+dt);if(q.door.time===1){q.door.phase='fallen';app.audio?.play('break');q.door.soundAt=q.clock;}}
  if(q.door.renderedAt!==undefined&&q.door.soundAt!==undefined&&q.clock-Math.max(q.door.renderedAt,q.door.soundAt)>2&&quiet(b))play(app,'door_falls');
  const door=event(q,'door_falls'),all=seed(36,'door_falls').lines.map(l=>l[0]);
  if(door.terminal&&all.every(id=>door.presented.includes(id))&&q.clock-(q.door.renderedAt??q.clock)>5&&party(b).some(u=>u.x>K(b,'leaveX',6100))&&quiet(b))play(app,'leave');
 }
}
function interact(app=G.HonroApp,probe=false){const b=app.engine?.b;if(!(b?.honroCustom||b?.honroAct4Official===1)||!b.honroAct4Preview||app.dialogue)return false;const q=memory(b),n=b.honroAct4Preview,u=app.engine.active;if(b.side!==0||b.phase!=='aim'||u?.side!==0||u.acted||!alive(u)||!app.engine.grounded(u))return false;
 if(n===31&&q.boat.phase==='docked'&&quiet(b)&&party(b).every(u=>u.x>boarding(b).boardX1&&u.x<boarding(b).boardX2&&Math.abs(u.y-boarding(b).deckY)<5&&app.engine.grounded(u))){if(probe)return true;q.boat.phase='boarded';q.complete=true;return true;}
 if(n===36&&u.cls==='knight'&&quiet(b)&&Math.abs(u.x-K(b,'doorPushX',2370))<220&&q.door.phase==='standing'){if(probe)return true;q.door.phase='falling';q.door.time=0;return true;}
 if(n===35&&quiet(b)&&party(b).every(u=>u.x>K(b,'completeX',6500))){if(probe)return true;q.complete=true;return true;}
 if(n===36&&quiet(b)&&q.door.phase==='fallen'&&q.events.leave?.terminal&&['A4.S36.DOOR.01','A4.S36.DOOR.02'].every(id=>q.receipts.includes(id))&&party(b).every(u=>u.x>K(b,'completeX',6500))){if(probe)return true;q.complete=true;return true;}
 if(n===36&&u.cls==='knight'&&quiet(b)&&Math.abs(u.x-2370)<220&&q.door.phase==='fallen'&&q.events.door_falls?.terminal&&!['A4.S36.DOOR.01','A4.S36.DOOR.02'].every(id=>q.receipts.includes(id))){if(probe)return true;const d=event(q,'door_falls');d.started=d.terminal=false;return play(app,'door_falls');}
 return false;
}
const draw=G.HonroScene.prototype.landmark;
G.HonroScene.prototype.landmark=function(c,l){const b=this.battle,q=(b?.honroCustom||b?.honroAct4Official===1)&&b.honroAct4Preview===36?memory(b):null;
 if((b?.honroCustom||b?.honroAct4Official===1)&&b.honroAct4Preview===31&&l.asset?.id==='a4:boat'){const id=b.honroMap?.vectorArrivalBoatAssetId,paint=typeof id==='string'?G.HONRO_PROJECT?.library?.find(a=>a.id===id&&a.vector&&!a.collision?.length):null;if(paint)return draw.call(this,c,{...l,asset:paint});}
 if(q&&l.asset?.id==='a4:door'){const id=b.honroMap?.vectorDoorAssetId,authored=typeof id==='string'?G.HONRO_PROJECT?.library?.find(a=>a.id===id&&a.vector&&!a.collision?.length):null,paint=authored||l.asset;const f=q.door.time??0,progress=f*f*(3-2*f),next={...l,asset:paint,rotation:Math.PI*.49*progress},pose=paint.params?.act4DoorForeshortening;
  // Art-only world-Y compression AFTER the original rotation, about the same
  // authored ground pivot. Existing instances, timing and event receipts stay untouched.
  const sy=pose?.version===1&&Number.isFinite(pose.fallenScaleY)&&pose.fallenScaleY>0&&pose.fallenScaleY<=1?1-(1-pose.fallenScaleY)*Math.max(0,Math.min(1,progress)):1;
  if(sy!==1){c.save();c.translate(l.x,l.y);c.scale(1,sy);c.translate(-l.x,-l.y);try{draw.call(this,c,next);}finally{c.restore();}}else draw.call(this,c,next);const app=G.HonroApp;if(q.door.phase==='fallen'&&app?.scene===this&&inView(app,{x:l.x,y:l.y-70})&&q.door.renderedAt===undefined)q.door.renderedAt=q.clock;return;}
 return draw.call(this,c,l);
};
const render=G.HonroScene.prototype.render;
G.HonroScene.prototype.render=function(engine,...args){const out=render.call(this,engine,...args),b=engine.b;if(!(b.honroCustom||b.honroAct4Official===1)||!b.honroAct4PreviewDynamic)return out;const {w,h,d}=this.size(),c=this.ctx;c.save();c.setTransform(d,0,0,d,0,0);c.translate(w/2-this.x*this.scale,h/2-this.y*this.scale);c.scale(this.scale,this.scale);for(const l of b.honroAct4PreviewDynamic.filter(l=>l.asset?.id==='a4:door'))this.landmark(c,l);c.restore();const app=G.HonroApp,q=memory(b),t=q.arrivalTour,v=t?.active&&(b.honroAct4Design?.boarding?.tourViews||tourViews)[t.index];if(app?.scene===this&&v&&!G.document.hidden&&!app.dialogue&&!app.modal.classList.contains('open')&&inView(app,v.point)){t.seen??={};t.seen[v.key]??=q.clock;}return out;};
const background=G.HonroScene.prototype.background;G.HonroScene.prototype.background=function(c,w,h,b){const out=background.call(this,c,w,h,b);if((b?.honroCustom||b?.honroAct4Official===1)&&b.honroAct4Preview===31){c.save();c.translate(w/2-this.x*this.scale,h/2-this.y*this.scale);c.scale(this.scale,this.scale);for(const l of b.honroAct4PreviewDynamic||[])if(['a4:estuary-water','a4:boat'].includes(l.asset?.id))this.landmark(c,l);c.restore();}return out;};
const attached=new WeakSet();P.attachEvents=function(app,{fresh=false}={}){const b=app.engine.b,n=b.honroAct4Preview;if(attached.has(app.engine))return;attached.add(app.engine);memory(b);b.honroAct4PreviewDynamic??=b.honroLandmarks.filter(l=>['a4:boat','a4:door','a4:estuary-water'].includes(l.asset?.id));b.honroLandmarks=b.honroLandmarks.filter(l=>!b.honroAct4PreviewDynamic.includes(l));b.sceneVersion++;const hurt=app.engine.hurt.bind(app.engine);app.engine.hurt=function(u,damage,owner,...args){const p=args.find(v=>v&&typeof v==='object'&&v.skill);if(n===31&&u.side===1&&u.x>4000&&owner&&(typeof p?.skill==='string'?p.skill:p?.skill?.id)==='A01'&&p.vy>0){const source=app.engine.unit(owner);if(source?.side===0&&source.x>3400&&source.x<4000)memory(b).arcObserved=true;}if(n===35&&u.id==='a4-35-g1-1'&&owner){const source=app.engine.unit(owner);if(source?.side===0&&source.x>3300&&source.x<3500){memory(b).clearShotFromSide=true;memory(b).clearShotTarget=u.id;}}return hurt(u,damage,owner,...args);};const impact=app.engine.impact.bind(app.engine);app.engine.impact=function(p,h){if(n===35&&h.terrain?.honroElementId?.includes('thick-bamboo')){const source=app.engine.unit(p.owner);if(source?.side===0){memory(b).blockedAtBamboo=true;memory(b).blockedAt=memory(b).clock;}}return impact(p,h);};
 if(n===31&&fresh)memory(b).arrivalTour={active:true,index:0,seen:{}};
 if(b.honroAct4Official===1)return;let previous=G.performance.now();function frame(now){if(app.engine?.b!==b)return;const dt=Math.min(.1,Math.max(0,(now-previous)/1000));previous=now;if(!P.freezeReviewClock)observe(app,dt);G.requestAnimationFrame(frame);}G.requestAnimationFrame(frame);
};
const launch=P.launch;P.launch=function(n){const r=launch(n);P.attachEvents(G.HonroApp,{fresh:true});return r;};
function snapshot(app=G.HonroApp){const b=app.engine?.b;if(!(b?.honroCustom||b?.honroAct4Official===1)||!b.honroAct4Preview)throw Error('No Act4 preview');const result=JSON.parse(JSON.stringify(b));if(result.honroAct4PreviewState?.reader){const reader=result.honroAct4PreviewState.reader;if(!app.dialogue){const q=result.honroAct4PreviewState,e=event(q,reader.key);e.terminal=true;for(const [id]of seed(result.honroAct4Preview,reader.key).lines)if(!e.presented.includes(id)&&!e.retired.includes(id))e.retired.push(id);q.reader=null;return result;}reader.cursor=app.dialogue?.index??0;reader.cursorId=app.dialogue?.lines[reader.cursor]?.[2]?.act4PreviewRow;reader.ids=app.dialogue?.lines.map(l=>l[2]?.act4PreviewRow).filter(Boolean)||reader.ids;}return result;}
function restore(saved){if(!saved?.honroCustom||!(saved.honroAct4Preview>=31&&saved.honroAct4Preview<=40)||saved.honroAct4PreviewState?.version!==1)throw Error('Invalid preview snapshot');const r=P.launch(saved.honroAct4Preview),app=G.HonroApp;Object.assign(r.b,JSON.parse(JSON.stringify(saved)));r.b.sceneVersion++;const reader=memory(r.b).reader;if(reader){const s=seed(r.b.honroAct4Preview,reader.key),lines=reader.ids?s.lines.filter(l=>reader.ids.includes(l[0])):s.lines,cursor=reader.cursorId?Math.max(0,lines.findIndex(l=>l[0]===reader.cursorId)):(reader.cursor??0);G.HonroStory.start(app,lines.map(([id,who,text])=>[who,text,{kind:'character',act4PreviewRow:id}]),{id:'act4-preview-'+r.b.honroAct4Preview+'-'+reader.key,title:app.stage.name,index:cursor});}return r;}
Object.assign(P,{interact,observe,previewMemory:memory,snapshot,restore,eventAPI:{alive,party,memory,seed,event,inView,play,quiet}});
function attachApp(){const appPrototype=Object.getPrototypeOf(G.HonroApp),canInput=appPrototype.canInput;appPrototype.canInput=function(...args){if((this.engine?.b?.honroCustom||this.engine?.b?.honroAct4Official===1)&&this.engine.b.honroAct4Preview===31&&memory(this.engine.b).arrivalTour?.active)return false;return canInput.apply(this,args);};}
if(G.HonroApp)attachApp();else G.HONRO_APP_READY.then(attachApp);
G.document.addEventListener('keydown',ev=>{const app=G.HonroApp,b=app?.engine?.b;if(ev.code!=='Escape'||!(b?.honroCustom||b?.honroAct4Official===1)||b.honroAct4Preview!==31)return;const q=memory(b);if(!q.arrivalTour?.active)return;q.arrivalTour.active=false;const e=event(q,'arrival');e.started=e.terminal=true;e.retired=seed(31,'arrival').lines.map(l=>l[0]);if(!P.startCamera?.(app))Object.assign(app.scene,{manual:false,x:boarding(app.engine.b).startX??450,y:boarding(app.engine.b).startY??1840,scale:G.innerWidth<600?.62:.94});});
})(globalThis);
