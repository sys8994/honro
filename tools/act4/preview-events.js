(function(G){'use strict';
// Isolated review adapter: the seed JSON is the only source of user-facing
// prose. Receipt IDs are observations; terminal cursors never imply observation.
const P=G.HonroAct4TerrainPreview,C=G.HONRO_CORE;
const alive=u=>!!u&&!u.dead&&u.hp>0;
const party=b=>b.units.filter(u=>u.side===0&&!u.summoned&&alive(u));
const memory=b=>b.honroAct4PreviewState??={version:1,clock:0,events:{},receipts:[],boat:{phase:'waiting',x:500},door:{phase:'standing',time:0},complete:false};
const seed=(n,key)=>G.HONRO_ACT4_PREVIEW_SEEDS.scenes.find(s=>s.stage===n&&s.event===key);
const event=(q,key)=>q.events[key]??={started:false,terminal:false,presented:[],retired:[]};
function inView(app,p,pad=0){const s=app.scene,cv=s.canvas,w=cv.clientWidth,h=cv.clientHeight;return Math.abs(p.x-s.x)<w/(2*s.scale)-pad&&Math.abs(p.y-s.y)<h/(2*s.scale)-pad;}
function receipt(q,e,id){if(!e.presented.includes(id))e.presented.push(id);if(!q.receipts.includes(id))q.receipts.push(id);}
function play(app,key,bark=false){const b=app.engine.b,q=memory(b),e=event(q,key),s=seed(b.honroAct4Preview,key);if(e.started||!s||app.dialogue||q.reader||q.bark)return false;
 e.started=true;const lines=s.lines.filter(([id,who])=>{if(app.canSpeak(who))return true;e.retired.push(id);return false;});
 if(!lines.length){e.terminal=true;return true;}
 if(bark){q.bark={key,index:0,elapsed:0,lines};return true;}
 q.reader={key};G.HonroStory.start(app,lines.map(([id,who,text])=>[who,text,{kind:'character',act4PreviewRow:id}]),{id:'act4-preview-'+b.honroAct4Preview+'-'+key,title:app.stage.name});
 return true;
}
function quiet(b){return !b.units.some(u=>u.side===1&&alive(u))&&!b.projectiles.length&&!b.volley&&b.phase==='aim';}
const tourViews=[{key:'boat',x:550,y:1770,scale:.64,point:{x:500,y:1735}},{key:'dock',x:6150,y:1790,scale:.56,point:{x:6150,y:1890}},{key:'threat',x:1510,y:1780,scale:.55,point:{x:1390,y:1864}}];
function arrivalTour(app,q,dt){const t=q.arrivalTour;if(!t?.active)return false;if(app.modal.classList.contains('open')||G.document.hidden)return true;const v=tourViews[t.index];if(!v){t.active=false;Object.assign(app.scene,{manual:false,x:450,y:1840,scale:G.innerWidth<600?.62:.94});play(app,'arrival');return false;}Object.assign(app.scene,{manual:true,x:v.x,y:v.y,scale:v.scale,storyTween:null,cinematic:null,goalFocus:null,storyFrame:null});if(t.seen?.[v.key]!==undefined){t.elapsed=(t.elapsed||0)+dt;if(t.elapsed>.8){t.index++;t.elapsed=0;}}return true;}
function observe(app,dt){const b=app.engine?.b;if(!b?.honroCustom||!b.honroAct4Preview)return;const q=memory(b),n=b.honroAct4Preview;q.clock+=dt;
 P.coastObserve?.(app,dt);
 if(q.reader){const e=event(q,q.reader.key),d=app.dialogue,line=d?.lines[d.index],node=G.document.getElementById('story-line');
  if(line?.[2]?.act4PreviewRow&&node?.textContent===line[1]&&node.getClientRects().length&&!G.document.hidden&&app.canSpeak(line[0]))receipt(q,e,line[2].act4PreviewRow);
  if(!d){e.terminal=true;for(const [id]of seed(n,q.reader.key).lines)if(!e.presented.includes(id)&&!e.retired.includes(id))e.retired.push(id);q.reader=null;}
 }
 if(q.bark&&!app.dialogue){const k=q.bark,e=event(q,k.key),node=G.document.getElementById('banter');
  while(k.index<k.lines.length&&!app.canSpeak(k.lines[k.index][1])){const id=k.lines[k.index][0];if(!e.retired.includes(id))e.retired.push(id);k.index++;k.elapsed=0;}
  const line=k.lines[k.index];if(!line){if(node)node.hidden=true;e.terminal=true;q.bark=null;}
  else if(node&&!G.document.hidden){node.hidden=false;node.setAttribute('role','status');node.replaceChildren();const strong=G.document.createElement('strong');strong.textContent=line[1];node.append(strong,G.document.createTextNode(' '+line[2]));receipt(q,e,line[0]);k.elapsed+=dt;if(k.elapsed>=Math.max(2.4,1.8+line[2].length*.075)){k.index++;k.elapsed=0;}}
 }
 if(n===31){
  if(arrivalTour(app,q,dt))return;
  if(['docked','boarded'].includes(q.boat.phase)){const text=G.HONRO_ACT4_PREVIEW_SEEDS.ui.find(v=>v[0]==='A4.S31.BOARD_OBJECTIVE')[1],goal=G.document.getElementById('objective-text');app.stage.goal=text;if(goal&&goal.textContent!==text)goal.textContent=text;}
  if(!q.events.arrival?.started&&party(b).some(u=>app.engine.grounded(u))&&inView(app,{x:500,y:1735})&&inView(app,{x:6150,y:1890}))play(app,'arrival');
  if(quiet(b)&&q.boat.phase==='waiting'&&!app.dialogue&&!q.reader){q.boat.phase='approach';play(app,'boat_approach');}
  if(q.boat.phase==='approach'&&!app.dialogue){q.boat.x=Math.min(6470,q.boat.x+dt*360);if(q.boat.x===6470){q.boat.phase='docked';app.stage.goal=G.HONRO_ACT4_PREVIEW_SEEDS.ui.find(v=>v[0]==='A4.S31.BOARD_OBJECTIVE')[1];const goal=G.document.getElementById('objective-text');if(goal)goal.textContent=app.stage.goal;if(!b.terrain.some(t=>t.id==='a4-boat-deck')){b.terrain.push({id:'a4-boat-deck',x:6260,y:1860,w:450,h:24,mat:'wood',indestructible:true,oneWay:true,hp:9999,maxHp:9999});b.sceneVersion++;}play(app,'board_ready');}}
  const boat=b.honroAct4PreviewDynamic?.find(l=>l.asset?.id==='a4:boat');if(boat){boat.x=q.boat.x;const approach=Math.max(0,Math.min(1,(q.boat.x-5900)/570));boat.y=1735+175*approach;boat.scale=.6+.4*approach;}
  // MID advice remains withheld until a real reviewed-bank arc was observed.
  if(q.arcObserved&&inView(app,{x:4140,y:1730})&&party(b).some(u=>u.x>3400&&u.x<4000))play(app,'second_bank',true);
 }
 if(n===35){if(!q.events.entry?.started&&inView(app,{x:900,y:1800}))play(app,'entry');
  // The clearing advice requires explicit real shot receipts, never a string
  // or metadata-only assertion. The focused projectile audit supplies these.
  if(q.blockedAtBamboo&&q.clearShotFromSide&&q.clock-(q.blockedAt??-100)<2&&alive(app.engine.unit(q.clearShotTarget))&&app.engine.active?.x>3000&&app.engine.active?.x<3090)play(app,'blocked_shot',true);
  if(party(b).some(u=>u.x>6500)&&inView(app,{x:6980,y:1800}))play(app,'edge');
 }
 if(n===36){
  if(quiet(b)&&party(b).some(u=>u.cls==='knight'&&u.x>1800)&&inView(app,{x:3000,y:2040}))play(app,'arrival');
  if(q.door.phase==='falling'&&!app.dialogue){q.door.time=Math.min(1,q.door.time+dt);if(q.door.time===1){q.door.phase='fallen';app.audio?.play('break');q.door.soundAt=q.clock;}}
  if(q.door.renderedAt!==undefined&&q.door.soundAt!==undefined&&q.clock-Math.max(q.door.renderedAt,q.door.soundAt)>2&&quiet(b))play(app,'door_falls');
  const door=event(q,'door_falls'),all=seed(36,'door_falls').lines.map(l=>l[0]);
  if(door.terminal&&all.every(id=>door.presented.includes(id))&&q.clock-(q.door.renderedAt??q.clock)>5&&party(b).some(u=>u.x>6100)&&quiet(b))play(app,'leave');
 }
}
function interact(app=G.HonroApp){const b=app.engine?.b;if(!b?.honroCustom||!b.honroAct4Preview||app.dialogue)return false;const q=memory(b),n=b.honroAct4Preview,u=app.engine.active;if(!alive(u)||!app.engine.grounded(u))return false;
 if(n===31&&q.boat.phase==='docked'&&quiet(b)&&party(b).every(u=>u.x>6285&&u.x<6685&&Math.abs(u.y-1860)<5&&app.engine.grounded(u))){q.boat.phase='boarded';q.complete=true;return true;}
 if(n===36&&u.cls==='knight'&&quiet(b)&&Math.abs(u.x-2370)<220&&q.door.phase==='standing'){q.door.phase='falling';q.door.time=0;return true;}
 if(n===35&&quiet(b)&&party(b).every(u=>u.x>6500)){q.complete=true;return true;}
 if(n===36&&quiet(b)&&party(b).every(u=>u.x>6500)){q.complete=true;return true;}
 return false;
}
const draw=G.HonroScene.prototype.landmark;
G.HonroScene.prototype.landmark=function(c,l){const b=this.battle,q=b?.honroCustom&&b.honroAct4Preview===36?memory(b):null;
 if(q&&l.asset?.id==='a4:door'){const f=q.door.time??0,next={...l,rotation:Math.PI*.49*(f*f*(3-2*f))};draw.call(this,c,next);const app=G.HonroApp;if(q.door.phase==='fallen'&&app?.scene===this&&inView(app,{x:l.x,y:l.y-70})&&q.door.renderedAt===undefined)q.door.renderedAt=q.clock;return;}
 return draw.call(this,c,l);
};
const render=G.HonroScene.prototype.render;
G.HonroScene.prototype.render=function(engine,...args){const out=render.call(this,engine,...args),b=engine.b;if(!b.honroCustom||!b.honroAct4PreviewDynamic)return out;const {w,h,d}=this.size(),c=this.ctx;c.save();c.setTransform(d,0,0,d,0,0);c.translate(w/2-this.x*this.scale,h/2-this.y*this.scale);c.scale(this.scale,this.scale);for(const l of b.honroAct4PreviewDynamic.filter(l=>l.asset?.id==='a4:door'))this.landmark(c,l);c.restore();const app=G.HonroApp,q=memory(b),t=q.arrivalTour,v=t?.active&&tourViews[t.index];if(app?.scene===this&&v&&!G.document.hidden&&!app.dialogue&&!app.modal.classList.contains('open')&&inView(app,v.point)){t.seen??={};t.seen[v.key]??=q.clock;}return out;};
const background=G.HonroScene.prototype.background;G.HonroScene.prototype.background=function(c,w,h,b){const out=background.call(this,c,w,h,b);if(b?.honroCustom&&b.honroAct4Preview===31){c.save();c.translate(w/2-this.x*this.scale,h/2-this.y*this.scale);c.scale(this.scale,this.scale);for(const l of b.honroAct4PreviewDynamic||[])if(['a4:estuary-water','a4:boat'].includes(l.asset?.id))this.landmark(c,l);c.restore();}return out;};
const launch=P.launch;
P.launch=function(n){const r=launch(n),app=G.HonroApp,b=r.b;memory(b);b.honroAct4PreviewDynamic=b.honroLandmarks.filter(l=>['a4:boat','a4:door','a4:estuary-water'].includes(l.asset?.id));b.honroLandmarks=b.honroLandmarks.filter(l=>!b.honroAct4PreviewDynamic.includes(l));b.sceneVersion++;const hurt=app.engine.hurt.bind(app.engine);app.engine.hurt=function(u,damage,owner,...args){const p=args.find(v=>v&&typeof v==='object'&&v.skill);if(n===31&&u.side===1&&u.x>4000&&owner&&(typeof p?.skill==='string'?p.skill:p?.skill?.id)==='A01'&&p.vy>0){const source=app.engine.unit(owner);if(source?.side===0&&source.x>3400&&source.x<4000)memory(b).arcObserved=true;}if(n===35&&u.id==='a4-35-g1-1'&&owner){const source=app.engine.unit(owner);if(source?.side===0&&source.x>3300&&source.x<3500){memory(b).clearShotFromSide=true;memory(b).clearShotTarget=u.id;}}return hurt(u,damage,owner,...args);};const impact=app.engine.impact.bind(app.engine);app.engine.impact=function(p,h){if(n===35&&h.terrain?.honroElementId?.includes('thick-bamboo')){const source=app.engine.unit(p.owner);if(source?.side===0){memory(b).blockedAtBamboo=true;memory(b).blockedAt=memory(b).clock;}}return impact(p,h);};
 if(n===31)memory(b).arrivalTour={active:true,index:0,seen:{}};
 let previous=G.performance.now();function frame(now){if(app.engine?.b!==b)return;const dt=Math.min(.1,Math.max(0,(now-previous)/1000));previous=now;observe(app,dt);G.requestAnimationFrame(frame);}G.requestAnimationFrame(frame);return r;
};
function snapshot(app=G.HonroApp){const b=app.engine?.b;if(!b?.honroCustom||!b.honroAct4Preview)throw Error('No Act4 preview');const result=JSON.parse(JSON.stringify(b));if(result.honroAct4PreviewState?.reader)result.honroAct4PreviewState.reader.cursor=app.dialogue?.index??0;return result;}
function restore(saved){if(!saved?.honroCustom||!(saved.honroAct4Preview>=31&&saved.honroAct4Preview<=40)||saved.honroAct4PreviewState?.version!==1)throw Error('Invalid preview snapshot');const r=P.launch(saved.honroAct4Preview),app=G.HonroApp;Object.assign(r.b,JSON.parse(JSON.stringify(saved)));r.b.sceneVersion++;const reader=memory(r.b).reader;if(reader){const s=seed(r.b.honroAct4Preview,reader.key);G.HonroStory.start(app,s.lines.map(([id,who,text])=>[who,text,{kind:'character',act4PreviewRow:id}]),{id:'act4-preview-'+r.b.honroAct4Preview+'-'+reader.key,title:app.stage.name,index:reader.cursor??0});}return r;}
Object.assign(P,{interact,observe,previewMemory:memory,snapshot,restore,eventAPI:{alive,party,memory,seed,event,inView,play,quiet}});
const appPrototype=Object.getPrototypeOf(G.HonroApp),canInput=appPrototype.canInput;appPrototype.canInput=function(...args){if(this.engine?.b?.honroCustom&&this.engine.b.honroAct4Preview===31&&memory(this.engine.b).arrivalTour?.active)return false;return canInput.apply(this,args);};
G.document.addEventListener('keydown',ev=>{const app=G.HonroApp,b=app?.engine?.b;if(ev.code!=='Escape'||!b?.honroCustom||b.honroAct4Preview!==31)return;const q=memory(b);if(!q.arrivalTour?.active)return;q.arrivalTour.active=false;const e=event(q,'arrival');e.started=e.terminal=true;e.retired=seed(31,'arrival').lines.map(l=>l[0]);Object.assign(app.scene,{manual:false,x:450,y:1840,scale:G.innerWidth<600?.62:.94});});
})(globalThis);
