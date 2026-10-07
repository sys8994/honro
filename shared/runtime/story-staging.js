(function(G){'use strict';
// A small presentation sequence on the existing Story lock and actor boundary.
// No combat clock, pathfinder, second frame loop, or parallel save cursor.
const clone=x=>JSON.parse(JSON.stringify(x)),registry=new Map(),ID='act1-sodan-first-receiver-v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function state(b){const s=b.honroStaging??={version:1};s.once??={};s.hidden??={};return s;}
function actor(b,id){return b.units.find(u=>u.id===id)||b.units.find(u=>u.side===0&&!u.summoned&&u.cls===id)||null;}
function alive(u){return !!u&&!u.dead&&u.hp>0;}
function point(b,p,context={}){
 if(!p)return null;let q;
 if(p.actor){const id=p.actor==='$actor'?context.actor:p.actor,u=actor(b,id)||b.honroStaging?.hidden?.[id];if(alive(u))q={x:u.x,y:u.y-(p.feet?0:u.h*.5)};}
 else if(p.anchor)q=b.honroMapAnchors?.[p.anchor];
 else if(p.marker)q=b.honroMarkers?.find(m=>m.id===(p.marker==='$trigger'?context.marker:p.marker));
 else if(Number.isFinite(p.x)&&Number.isFinite(p.y))q=p;
 return q&&Number.isFinite(q.x)&&Number.isFinite(q.y)?{x:q.x+(p.dx||0),y:q.y+(p.dy||0)}:null;
}
function register(d){if(!d?.id||!Array.isArray(d.steps)||d.steps.at(-1)?.type!=='dialogue'||d.steps.slice(0,-1).some(s=>!['move','look','fx'].includes(s.type)))throw Error('A staged scene needs visual steps followed by dialogue');registry.set(d.id,clone(d));}
function describe(id){const d=registry.get(id);return d?clone(d):null;}
function prepareFresh(b){
 if(b.honroCustom)return;
 const s=state(b);if(b.honroStage!==9)return;const u=actor(b,'npc-sodan');if(!u)return;
 // Hidden cast is outside the engine roster, so it cannot leak via minimap,
 // hover, damage/collision, AI selection or speaker focus before its entrance.
 s.hidden[u.id]=u;b.units=b.units.filter(v=>v!==u);s.entrance=ID;
}
function reveal(b,id){const s=state(b);let u=actor(b,id);if(u)return u;u=s.hidden[id];if(!alive(u))return null;b.units.push(u);delete s.hidden[id];return u;}
function request(app,id,context={}){
 const b=app.engine?.b,d=registry.get(id);if(!b||!d||d.stage&&d.stage!==b.honroStage||!G.HonroStory)return false;
 const s=state(b);if(s.once[id])return false;s.once[id]='queued';
 G.HonroStory.queue(app,[['서술',d.title,{storyId:id,storyTitle:d.title,stagingRequest:{id,context:clone(context)}}]]);return true;
}
function receiver(app,m){const b=app.engine.b;if(b.honroStaging?.entrance===ID&&b.honroState.receivers===1)request(app,ID,{marker:m.id});}
// Decorate only a newly queued authored event; its trigger, wait boundary and
// original speech remain owned by the existing event system. Saved queues stay raw.
function eligible(b,d){return !!b&&!b.honroCustom&&b.honroStaging?.version===1&&(!d.stage||d.stage===b.honroStage)&&(!d.requiredActors||d.requiredActors.every(id=>alive(actor(b,id))));}
function decorateQueue(app,lines){const b=app.engine?.b;if(!lines.length||lines[0][2]?.stagingRequest)return lines;const story=lines[0][2]?.storyId;if(typeof story!=='string'||!story)return lines;const d=[...registry.values()].find(d=>d.onStory===story&&eligible(b,d)&&!state(b).once[d.id]);if(!d)return lines;state(b).once[d.id]='queued';return [['서술',d.title,{storyId:story,storyTitle:lines[0][2]?.storyTitle,stagingRequest:{id:d.id,context:{actor:b.active},dialogue:clone(lines)}}]];}
function recoverQueued(b,lines){return lines.flatMap(line=>{const r=line[2]?.stagingRequest;if(!r?.dialogue)return[line];if(b?.honroStaging)state(b).once[r.id]='done';return r.dialogue;});}
function opening(app,lines,options){
 const b=app.engine?.b;if(options.staging)return{lines,options};let r=lines[0]?.[2]?.stagingRequest;
 if(!r&&['entry','outcome'].includes(options.after)&&options.index===undefined&&b?.honroStaging?.version===1){const d=[...registry.values()].find(d=>d.on===options.after&&eligible(b,d)&&(!d.requireSplit||b.honroSplit?.version===1)&&!state(b).once[d.id]);if(d)r={id:d.id,context:{actor:b.active}};}
 if(!r)return{lines,options};
 const def=registry.get(r.id);if(!def||!b||def.stage&&def.stage!==b.honroStage||state(b).once[r.id]==='done')return{lines:[],options};
 const supplied=r.dialogue||lines;if(!eligible(b,def)&&def.onStory)return{lines:supplied,options};state(b).once[r.id]='running';
 const waitForIndex=def.beforeSpeaker?supplied.findIndex(l=>l[0]===def.beforeSpeaker):null;
 const staging={id:def.id,steps:clone(def.steps),context:clone(r.context||{}),cursor:0,elapsed:0,applied:{},results:{},position:def.position||'before',waitForDialogue:def.position==='after',complete:def.position==='after'||waitForIndex>0,...(waitForIndex>0?{waitForIndex}:{})};
 const dialogue=def.steps.filter(s=>s.type==='dialogue').flatMap(s=>s.lines||supplied).map(([who,text,meta={}])=>[who,text,{storyId:def.id,storyTitle:def.title,...meta,stagingScene:def.id}]);
 return{lines:dialogue,options:{...options,title:def.title,staging}};
}
function canSpeak(app,who,meta){const b=app.engine?.b,s=b?.honroStaging;if(!meta?.stagingScene||s?.once[meta.stagingScene]!=='running')return false;return Object.values(s.hidden||{}).some(u=>u.name===who&&alive(u));}
function active(app){return app.dialogue?.staging;}
function snapshot(app){const s=active(app),c=app.scene;if(s&&c&&[c.x,c.y,c.scale].every(Number.isFinite))s.currentCamera={x:c.x,y:c.y,scale:c.scale,manual:!!c.manual};}
function restore(app){const s=active(app),c=app.scene;if(!s||!c||s.complete)return;if(s.currentCamera)Object.assign(c,s.currentCamera);c.goalFocus=null;if(s.focusActor&&alive(actor(app.engine.b,s.focusActor)))c.storyFocus?.(s.focusActor,120);else if(s.focus)c.storyFocusPoint?.(s.focus.x,s.focus.y,350);}

function draw(app,node){const s=active(app);if(s?.waitForIndex!=null&&app.dialogue.index>=s.waitForIndex){delete s.waitForIndex;s.complete=false;app.stagingLastTime=null;G.HonroStory.save(app);}if(!s||s.complete)return false;const step=s.steps[s.cursor],focused=node.contains?.(G.document?.activeElement)?G.document.activeElement?.dataset?.action:null;
 node.innerHTML=`<div class="story-overlay staging-overlay"><section class="staging-cue" role="dialog" aria-modal="true" aria-label="${esc(app.dialogue.title)}"><p id="story-line">${esc(step?.caption||'')}</p><div class="story-actions"><button class="ghost" data-action="dialogue-skip">장면 넘기기</button><button class="primary" data-action="dialogue-next">대화로 ›</button></div></section></div>`;
 node.querySelector(`[data-action="${focused==='dialogue-skip'?'dialogue-skip':'dialogue-next'}"]`)?.focus({preventScroll:true});return true;
}
function move(app,s,step,dt,skip){
 const b=app.engine.b,u=step.reveal?reveal(b,step.actor):actor(b,step.actor),aim=point(b,step.towards,s.context);
 const to=s.results[s.cursor]?.target||(step.towards?(alive(u)&&aim?{x:u.x+Math.sign(aim.x-u.x)*Math.min(step.distance||36,Math.abs(aim.x-u.x)),y:u.y}:null):point(b,step.to,s.context));
 if(!alive(u))return 'actor-unavailable';if(!to)return 'anchor-unavailable';if(!skip&&dt<=0)return null;
 if(u.airborne||u.jumping||Math.abs(u.vy||0)>3)return 'actor-airborne';
 const distance=to.x-u.x,max=step.maxDistance||800;
 if(Math.abs(distance)>max)return 'route-too-long';
 if(Math.abs(distance)<.001)return 'arrived';
 const surface=G.HonroMapEngine.surfaceY(b.terrain,to.x,to.y);if(!surface||Math.abs(surface.y-to.y)>80)return 'support-unavailable';
 const saved={fixed:u.fixed,moveLeft:u.moveLeft,walkSpeed:u.walkSpeed,bound:u.bound},before=u.x;
 const speed=Math.max(30,Math.abs(s.results[s.cursor]?.distance??distance)/Math.max(.05,(step.duration||600)/1000));
 s.results[s.cursor]??={distance,target:clone(to)};
 Object.assign(u,{fixed:false,moveLeft:Math.abs(distance)+2,walkSpeed:speed,bound:0});
 try{app.engine.walk(u,Math.sign(distance),skip?Math.abs(distance)/speed:Math.min(dt,Math.abs(distance)/speed),true);}finally{Object.assign(u,saved);}
 u.honroScenePose={kind:'move',time:(s.elapsed+dt*1000)/1000};
 if(Math.abs(to.x-u.x)<.6){const p=G.HonroTerrain.place(b,u,{x:to.x,y:surface.y,flying:false,maxDistance:1,clearance:0});if(p){Object.assign(u,p);return 'arrived';}}
 return Math.abs(u.x-before)<.01?'path-blocked':null;
}
function apply(app,s,step,skip=false,dt=0){
 const b=app.engine.b,key=s.cursor,first=!s.applied[key];
 if(first){s.applied[key]=true;
  if(step.type==='fx'&&!skip){if(step.sound)app.audio?.play(step.sound);const p=point(b,step.at,s.context);if(p&&step.effect)app.engine.fx(step.effect,p.x,p.y-15,step.color||'#c9b37f',step.radius||48);}
  if(step.type==='move'){const u=step.reveal?reveal(b,step.actor):actor(b,step.actor);if(alive(u)&&step.focus!==false){s.focusActor=u.id;if(!skip)app.scene?.storyFocus?.(u.id,120);}}
  if(step.type==='look'&&(!step.actor||step.camera===true)&&!skip){const p=point(b,step.at,s.context);if(p&&app.scene){s.focus=clone(p);delete s.focusActor;app.scene.goalFocus=null;app.scene.storyFocusPoint?.(p.x,p.y,Math.min(550,step.duration||500));}}
 }
 if(step.type==='move'){const status=move(app,s,step,dt,skip);if(status){s.results[key]={...s.results[key],status};return true;}}
 if(step.type==='look'&&(step.actor||step.actors)){const p=point(b,step.at,s.context);for(const id of step.actors||[step.actor]){const u=actor(b,id==='$actor'?s.context.actor:id);if(!alive(u))continue;const facing=step.facing||(p&&p.x!==u.x?Math.sign(p.x-u.x):u.facing);if(step.visualOnly){u.honroScenePose={kind:step.pose||'regard',time:(s.elapsed+dt*1000)/1000,duration:(step.duration||1)/1000,facing,visualOnly:true};}else{if(facing!==u.facing&&Number.isFinite(u.angle))u.angle=180-u.angle;u.facing=facing;if(step.pose)u.honroScenePose={kind:step.pose,time:(s.elapsed+dt*1000)/1000};}}}
 return skip||s.elapsed+dt*1000>=(step.duration||0);
}
function settle(app,s){for(const u of app.engine.b.units){if(u.honroScenePose){if(!u.honroScenePose.visualOnly)u.moving=0;delete u.honroScenePose;}}}
function advance(app,dt,skip=false){
 const s=active(app);if(!s||s.complete)return false;
 let budget=skip?s.steps.length:1;
 while(budget--&&s.cursor<s.steps.length){const step=s.steps[s.cursor];
  if(step.type==='dialogue'){s.complete=true;break;}
  if(!apply(app,s,step,skip,dt)){s.elapsed+=dt*1000;break;}
  s.cursor++;s.elapsed=0;settle(app,s);if(!skip)break;
 }
 if(s.cursor>=s.steps.length||s.steps[s.cursor]?.type==='dialogue')s.complete=true;
 snapshot(app);app.engine.b.honroStory=clone(app.dialogue);app.dirty=true;
 return true;
}
function tick(app,now){
 const s=active(app);if(!s||s.complete){app.stagingLastTime=null;return;}
 const dt=app.stagingLastTime==null?0:Math.min(.06,Math.max(0,(now-app.stagingLastTime)/1000));app.stagingLastTime=now;
 if(G.document?.hidden||app.storyHistoryOpen||app.modal?.classList.contains('open'))return;
 const cursor=s.cursor;advance(app,dt);if(s.cursor!==cursor||s.complete){G.HonroStory.draw(app);G.HonroStory.save(app);}
}
function skipMotion(app){const s=active(app);if(!s||s.complete)return false;advance(app,0,true);settle(app,s);G.HonroStory.draw(app);return true;}
// Read-only foreground props for a short authored beat. They are not engine
// units, pickup items, projectiles, collision, or new objective markers.
function drawProps(scene,e){const b=e.b,s=b.honroStory?.staging;if(!s||s.complete)return;const step=s.steps[s.cursor],c=scene.ctx;if(!step?.props?.length)return;const t=Math.max(0,Math.min(1,s.elapsed/Math.max(1,step.duration||1))),a=Math.min(1,t*5,(1-t)*5);for(const prop of step.props){const p=point(b,prop.at,s.context);if(!p)continue;c.save();c.translate(p.x,p.y-8);c.globalAlpha*=Math.max(0,a);
 if(prop.kind==='hammer'){c.rotate(-.15);c.fillStyle='#967753';c.fillRect(-3,-26,6,31);c.fillStyle='#9da5a0';c.fillRect(-20,-34,40,13);c.strokeStyle='#26363b';c.lineWidth=2;c.strokeRect(-20,-34,40,13);}
 else if(prop.kind==='records'){for(let i=0;i<3;i++){const spread=26*(1-t)+7*t;c.save();c.translate((i-1)*spread,-18-i*4);c.rotate((i-1)*.13*(1-t));c.fillStyle=['#c5b593','#d2c5a7','#c6bcaa'][i];c.fillRect(-27,-32,54,36);c.strokeStyle='#625b4b';c.lineWidth=1.5;c.strokeRect(-27,-32,54,36);for(let j=0;j<3;j++){c.beginPath();c.moveTo(-19,-23+j*7);c.lineTo(15-j*4,-23+j*7);c.stroke();}c.restore();}}
 else if(prop.kind==='departing-light'){for(let i=0;i<3;i++){c.fillStyle=['#d7c8a0','#bcd2c5','#d5dcbe'][i];c.beginPath();c.ellipse((i-1)*16+Math.sin(t*2+i)*5,-17-t*43-i*9,3.5,7,0,0,Math.PI*2);c.fill();}}
 c.restore();}}
function finish(app,natural=false){const s=active(app);if(!s)return false;if(s.waitForIndex!=null){delete s.waitForIndex;s.complete=false;}if(s.waitForDialogue){s.waitForDialogue=false;s.complete=false;app.stagingLastTime=null;if(natural){G.HonroStory.draw(app);G.HonroStory.save(app);return true;}}advance(app,0,true);settle(app,s);state(app.engine.b).once[s.id]='done';app.stagingLastTime=null;}
register({id:ID,stage:9,title:'한쪽 줄이 느슨해질 때',steps:[
 {type:'fx',sound:'sodanBell',at:{marker:'$trigger'},effect:'ring',color:'#b8c999',duration:300,caption:'첫 받이진이 붉은 실의 힘을 받아 낸다. 위쪽에서 방울이 짧게 울린다.'},
 {type:'look',at:{anchor:'sodan'},duration:550,caption:'방울 소리가 난 사당 문간으로 시선이 향한다.'},
 {type:'move',actor:'npc-sodan',reveal:true,to:{anchor:'sodan',dx:-76},duration:950,caption:'붉은 실에 손이 감긴 소단이 매듭을 붙든 채 문턱으로 나온다.'},
 {type:'look',actor:'npc-sodan',at:{marker:'$trigger'},pose:'hold-bell',duration:450,caption:'방울 소리가 멎는다. 소단은 줄을 놓지 않은 채 아래를 살핀다.'},
 {type:'dialogue',lines:[
  ['소단','거기, 줄에 손대지 마요! 방금 아래에서 뭘 한 거예요?'],
  ['설오','혼을 받을 진을 하나 폈습니다. 주민들이 말한 소단입니까? 덕수 씨 일행은 무사히 나갔습니다.'],
  ['소단','덕수 아저씨가… 걸어서 나갔어요?'],
  ['설오','예. 담허 어른이 몸에 든 혼을 떼어냈습니다. 당신도 도우러 왔습니다.'],
  ['소단','한쪽에서 당기던 힘이 조금 줄었어요. 다른 빈자리에도 진을 놓는 건 막지 않겠지만, 가운데 제 줄에는 손대지 마요.'],
  ['설오','손에서 피가 납니다. 남은 자리까지 받이진을 이으면 혼이 한꺼번에 사람에게 쏟아지는 걸 막을 수 있습니다.'],
  ['소단','제가 놓으면 저 실들이 전부 아래로 쏟아져요. 쉬라고 하지 말아요.'],
  ['담허','방울로 혼을 다루는 이를 영매라 부르네. 저 아이는 부리는 것보다 붙잡는 데 힘을 다 쓰고 있어.'],
  ['휘겸','사람 없는 자리부터 잇겠소. 믿으라고 다그쳐 봐야 손을 놓지는 못할 거요.']
 ]}
]});
// The approved split uses the existing Act 3 outro verbatim, then takes only
// short supported steps toward the two authored routes. No roster/carry edits.
register({id:'act3-split-departure-v1',stage:24,on:'outcome',position:'after',requireSplit:true,title:'기록을 나누어 찾다',steps:[
 {type:'look',at:{marker:'split-route-a'},duration:350,caption:'휘겸과 담허가 사당 뒤 기록실로 이어지는 길을 살핀다.'},
 {type:'move',actor:'knight',towards:{marker:'split-route-a'},distance:36,duration:450,caption:'휘겸이 기록실 쪽으로 걸음을 옮긴다.'},
 {type:'move',actor:'mage',towards:{marker:'split-route-a'},distance:28,duration:350,caption:'담허가 휘겸과 같은 길을 향한다.'},
 {type:'look',at:{marker:'split-route-b'},duration:350,caption:'설오와 소단은 성 밖 공방으로 이어지는 길을 확인한다.'},
 {type:'move',actor:'archer',towards:{marker:'split-route-b'},distance:36,duration:450,caption:'설오가 공방 쪽으로 걸음을 옮긴다.'},
 {type:'move',actor:'occultist',towards:{marker:'split-route-b'},distance:28,duration:350,caption:'소단도 같은 방향으로 몸을 돌린다.'},
 {type:'dialogue'}
]});
G.HonroStoryStaging={register,describe,decorateQueue,recoverQueued,request,prepareFresh,receiver,opening,canSpeak,draw,tick,skipMotion,finish,snapshot,restore,drawProps,point,actor,ID};
})(globalThis);
