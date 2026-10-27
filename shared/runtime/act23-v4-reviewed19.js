(function(G){'use strict';
const P=G.HonroAct23V4ReviewedChapters,V=P.V,C=P.C,api=P.apiFor(19),alive=V.alive;
const unit=(b,id)=>b.units.find(u=>u.id===id),base=b=>V.mem(b),clone=x=>JSON.parse(JSON.stringify(x));
const memory=b=>api.memory(b).physical??={drops:{},spirits:{},marks:{},retreat:{},voices:{}};
const ids=[1,2,3],marks=['mumyeong-transfer','royal-seal','jeomungol-mark'];
const allGone=b=>ids.every(i=>base(b).done['separate-'+i]&&base(b).farewell?.['send-'+i]?.status==='done'&&memory(b).spirits[i]?.departed);
const allMarks=b=>marks.every(id=>memory(b).marks[id]?.confirmed);
const present=(b,name)=>alive(unit(b,{'설오':'p-archer','담허':'p-mage','휘겸':'p-knight','소단':'p-occultist'}[name]));
function author(map){const init=map.initialState,at=id=>map.markers.find(p=>p.id===id),p=at('route');
 init.honroV4Reviewed19={visitors:['mourner-brother','mourner-sister','objective'],rear:{x:p.x-230,y:p.y},marks:marks.map((id,i)=>({id,x:at('old-soul').x-42+i*44,y:at('old-soul').y,label:['무명사','왕실 봉인','저문골'][i]}))};
 for(const [i,id]of init.honroV4Reviewed19.visitors.entries()){const site=at('separate-'+(i+1)),old=map.units.find(u=>u.id===id);if(!old)throw Error('19.missing visitor '+id);old.x=site.x-60;old.y=G.HonroMapEngine.surfaceY(map.terrains.map(t=>G.HonroGeometry.terrain(t,map.height)),old.x,undefined,'act2-floor').y;old.stageOverrides={...old.stageOverrides,fixed:false,honroCivilian:true,honroProtected:true,honroV4Actor:true,maxMove:600,moveLeft:600,walkSpeed:180};}
 map.events=[];map.units=map.units.filter(u=>u.team!=='enemy');
}
function prepare(b){const m=memory(b);for(const i of ids)m.spirits[i]??={count:i===2?2:1,status:'entangled',x:V.marker(b,'separate-'+i).x+38,y:V.marker(b,'separate-'+i).y};}
function grounded(b,u){return alive(u)&&!u.airborne&&!u.jumping&&C.validTerrainContactPose(b.terrain,u);}
function familyCalls(b){return memory(b).familyCalls??={};}
function familyWitness(b){return ids.every(i=>{const q=familyCalls(b)[i];return q?.sourceRun===b.session&&q.encounter===i&&q.caller===b.honroV4Reviewed19.visitors[i-1]&&q.observer&&q.elapsed>=.7&&q.response?.elapsed>=.35&&q.response.spirit==='farewell-spirit-'+i&&q.aliveCaller&&q.groundedCaller&&q.visible;});}
function observeFamilyCall(app,i,d){const b=app.engine.b,m=memory(b),q=m.spirits[i],caller=unit(b,b.honroV4Reviewed19.visitors[i-1]),site=V.marker(b,'separate-'+i),calls=familyCalls(b);
 if(!base(b).done['separate-'+i]||q.departed||q.count<1||calls[i]?.elapsed>=.7)return;
 const observer=V.heroes(b).find(u=>grounded(b,u)&&V.near(u,caller,500)&&V.near(u,site,500)&&!app.engine.projectileCollision({x:u.x,y:u.y-u.h*.6},{x:caller.x,y:caller.y-caller.h*.7},1,u.id,[],false)?.terrain);
 if(!grounded(b,caller)||!V.near(caller,site,180)||!observer)return;
 const call=calls[i]??={encounter:i,caller:caller.id,observer:observer.id,sourceRun:b.session,round:b.round,point:{x:caller.x,y:caller.y},elapsed:0,aliveCaller:true,groundedCaller:true,visible:true};
 call.elapsed=Math.min(.7,call.elapsed+d);caller.honroScenePose={kind:'inspect',time:call.elapsed};
 if(call.elapsed>=.35)call.response={spirit:'farewell-spirit-'+i,point:{x:q.x,y:q.y},elapsed:Math.min(.35,call.elapsed-.35)};
 if(call.elapsed>=.7){call.response.elapsed=.35;call.completedRound=b.round;delete caller.honroScenePose;app.engine.emit?.('save');}
}
function observe(app,dt){G.HonroStage19Farewell.prepare(app.engine.b);const e=app.engine,b=e.b,m=memory(b),s=b.honroV4Reviewed19,d=Math.min(.05,Math.max(0,dt));
 for(const i of ids){const u=unit(b,s.visitors[i-1]),p=V.marker(b,'separate-'+i);if(!m.drops[i]&&grounded(b,u)&&V.near(u,p,180)){m.drops[i]={id:i===1?'hammer':i===2?'bowl':'keepsake',owner:u.id,x:p.x-28,y:p.y,status:'lowering',elapsed:0};}
  const drop=m.drops[i];if(drop?.status==='lowering'&&grounded(b,u)&&V.near(u,p,180)){drop.elapsed=Math.min(.45,drop.elapsed+d);u.honroScenePose={kind:'inspect',time:drop.elapsed};if(drop.elapsed>=.45){drop.status='placed';delete u.honroScenePose;}}
  observeFamilyCall(app,i,d);const q=m.spirits[i],f=base(b).farewell?.['send-'+i];if(m.drops[i]?.status==='placed'&&!q.departed){q.reaction=true;m.voices[i]=true;}
  if(base(b).done['separate-'+i]){q.status='departing';q.x=p.x+38+(f?.elapsed||0)*180;q.y=p.y-(f?.elapsed||0)*120;if(f?.status==='done'&&f.elapsed>=1){q.status='departed';q.departed=true;q.count=0;delete m.voices[i];}}
 }
 if(allGone(b)&&base(b).transportMarks){const actor=unit(b,base(b).transportMarks.actor);for(const p of s.marks){if(!grounded(b,actor)||!V.near(actor,p,230))continue;const q=m.marks[p.id]??={actor:actor.id,elapsed:0,x:p.x,y:p.y};q.elapsed=Math.min(.8,q.elapsed+d);if(q.elapsed>=.8)q.confirmed=true;}}
 if(api.done(b,'exit-ready'))for(const id of s.visitors){const u=unit(b,id);if(!grounded(b,u))continue;const q=m.retreat[id]??={from:{x:u.x,y:u.y},distance:0};if(V.near(u,s.rear,110)){q.arrived=q.distance>40;continue;}u.fixed=false;u.moveLeft=Math.max(u.moveLeft,30);const x=u.x,y=u.y;e.walk(u,Math.sign(s.rear.x-u.x),d,true);q.distance+=Math.hypot(u.x-x,u.y-y);}
}
function optional(profile,r){const b=profile.honroBattle;if(!api.active(b)||!present(b,r.speaker))return false;const m=memory(b),remaining=ids.filter(i=>!m.spirits[i]?.departed);
 if(r.id.includes('ARCHER'))return !!b.honroState.bellDescent&&remaining.some(i=>m.voices[i]);
 if(r.id.includes('MAGE'))return !base(b).done.route;
 if(r.id.includes('KNIGHT'))return !!base(b).done.route&&remaining.some(i=>m.drops[i]&&alive(unit(b,b.honroV4Reviewed19.visitors[i-1])));
 return !!base(b).done.route&&remaining.some(i=>m.voices[i]&&m.drops[i]&&alive(unit(b,b.honroV4Reviewed19.visitors[i-1])));
}
function allow(app,r){const b=app.engine.b,m=memory(b),id=r.id;
 if(r.channel==='optional')return optional({...app.profile,honroBattle:b},r);
 if(id==='EDGE.ARRIVALS_19_0'||id.startsWith('A2.S19.INTRO.'))return m.drops[1]?.status==='placed'&&m.drops[2]?.status==='placed';
 if(id==='A2.S19.MID.01')return ids.some(i=>m.spirits[i]?.reaction);
 if(id==='A2.S19.MID.02')return !!base(b).done.route;
 if(id==='A2.S19.MID.03')return ids.some(i=>base(b).done['separate-'+i]);
 if(id==='A2.S19.MID.04')return !!base(b).done.route&&ids.some(i=>!base(b).done['separate-'+i]&&m.spirits[i]?.status==='entangled'&&m.spirits[i]?.count===2&&V.near(unit(b,'p-occultist'),V.marker(b,'separate-'+i),260));
 if(id==='A2.S19.MID.05')return ids.some(i=>m.spirits[i]?.departed);
 if(['A2.S19.MID.06','A2.S19.MID.07','A2.S19.JOURNAL.01'].includes(id))return allGone(b);
 if(id.startsWith('A2.S19.EVIDENCE.')||id==='A2.S19.POPUP.01'||id==='A2.S19.JOURNAL.02'||id==='EDGE.RUNTIME.JOURNAL.EVIDENCE19.MARKS')return allGone(b)&&allMarks(b)&&!!base(b).transportTraceProof;
 if(id==='A2.S19.COMPLETE.01')return allMarks(b)&&api.done(b,'marks');
 if(id==='A2.S19.COMPLETE.02')return api.done(b,'exit-ready')&&Object.values(m.retreat).some(q=>q.distance>40);
 if(id==='A2.S19.COMPLETE.03')return api.done(b,'return')&&Object.values(m.retreat).some(q=>q.distance>80);
 return false;
}
function scene(app,key,rows,proof={}){if(rows.every(id=>allow(app,api.row(id))))return api.begin(app,key,rows,proof);return false;}
function drive(app){const b=app.engine.b,m=memory(b),q=api.memory(b),event=(key,rows,proof)=>{if(q.events[key])return false;return scene(app,key,rows,proof);};
 if(event('arrival',['EDGE.ARRIVALS_19_0','A2.S19.INTRO.01','A2.S19.INTRO.02','A2.S19.INTRO.03'],m.drops))return;
 if(api.done(b,'arrival')&&event('response',['A2.S19.MID.01'],m.spirits))return;
 if(event('opened',['A2.S19.MID.02'],{route:base(b).done.route}))return;
 if(event('entangled',['A2.S19.MID.04'],m.spirits))return;
 if(event('separated',['A2.S19.MID.03'],base(b).done))return;
 if(event('departure',['A2.S19.MID.05'],m.spirits))return;
 if(event('quiet',['A2.S19.MID.06','A2.S19.MID.07'],m.spirits))return;
 if(api.done(b,'quiet')&&!app.profile.record?.some(r=>r.rowId==='A2.S19.JOURNAL.01'))api.journal(app,'A2.S19.JOURNAL.01');
 if(event('marks',['A2.S19.EVIDENCE.01','A2.S19.EVIDENCE.02','A2.S19.EVIDENCE.03','A2.S19.EVIDENCE.04','A2.S19.EVIDENCE.05','A2.S19.POPUP.01'],m.marks))return;
 if(api.done(b,'marks')&&!app.profile.record?.some(r=>r.rowId==='A2.S19.JOURNAL.02'))api.journal(app,'A2.S19.JOURNAL.02');
 if(event('exit-ready',['A2.S19.COMPLETE.01'],m.marks))return;
 if(event('return',['A2.S19.COMPLETE.02'],m.retreat))return;
 event('escort-back',['A2.S19.COMPLETE.03'],m.retreat);
}
function before(app,a,dt){if(!a.safe(app))return false;observe(app,dt);drive(app);return !app.dialogue&&!ids.some(i=>base(app.engine.b).done['separate-'+i]&&!memory(app.engine.b).spirits[i]?.departed&&(familyCalls(app.engine.b)[i]?.elapsed||0)<.7);}
function eligibility(app,p,s){const b=app.engine.b;if(s.id==='route'&&!api.done(b,'response')||s.id.startsWith('separate-')&&!api.done(b,'opened')||s.id==='old-soul'&&!api.done(b,'quiet'))return{ok:false,reason:s.id};return undefined;}
function complete(b){return allGone(b)&&allMarks(b)&&api.done(b,'escort-back')&&b.honroV4Reviewed19.visitors.every(id=>memory(b).retreat[id]?.arrived);}
function draw(scene,c,b){const m=memory(b);c.save();for(const [key,q]of Object.entries(familyCalls(b))){if(q.elapsed>=.7||q.elapsed<=0)continue;const u=unit(b,q.caller),spirit=m.spirits[key];if(!alive(u)||spirit?.departed)continue;c.strokeStyle='#d7cba5';c.lineWidth=3;c.beginPath();c.moveTo(u.x+8,u.y-u.h*.5);c.lineTo(u.x+22,u.y-u.h*.68);c.lineTo(u.x+12,u.y-u.h*.78);c.stroke();for(const r of [18,28]){c.beginPath();c.arc(u.x+16,u.y-u.h*.79,r,-.65,.65);c.stroke();}if(q.response){c.strokeStyle='#d5e5d7';c.beginPath();c.ellipse(spirit.x,spirit.y-58,33,63,0,0,Math.PI*2);c.stroke();}}for(const drop of Object.values(m.drops)){const q={...drop,y:drop.y-42*(1-Math.min(1,(drop.elapsed||0)/.45))};c.fillStyle='#a89b76';if(q.id==='bowl'){c.beginPath();c.ellipse(q.x,q.y-6,17,7,0,0,Math.PI);c.fill();}else{c.fillRect(q.x-3,q.y-32,6,30);c.fillRect(q.x-17,q.y-34,29,11);}}
 for(const i of ids){const q=m.spirits[i];if(q.departed||q.count!==2||base(b).done['separate-'+i])continue;c.globalAlpha=.25;c.fillStyle='#cbd9cf';for(const dx of [14]){c.beginPath();c.ellipse(q.x+dx,q.y-60,24,58,dx/60,0,Math.PI*2);c.fill();}}c.globalAlpha=1;c.font='12px serif';c.fillStyle='#b9ae85';for(const p of b.honroV4Reviewed19.marks)c.fillText(p.label,p.x-14,p.y-10);c.restore();}
function camera(app,key){const b=app.engine.b;let targets;
 if(key==='arrival')targets=[{actor:'mourner-brother'},{actor:'mourner-sister'},V.marker(b,'separate-1'),V.marker(b,'separate-2')];
 else if(key==='entangled')targets=[V.marker(b,'separate-2')];else if(key==='opened')targets=[V.marker(b,'route'),{actor:'p-mage'}];
 else if(['marks','exit-ready'].includes(key))targets=[V.marker(b,'old-soul')];else if(['return','escort-back'].includes(key))targets=[{actor:'mourner-brother'},b.honroV4Reviewed19.rear];
 else targets=ids.map(i=>V.marker(b,'separate-'+i));return{intent:'situation',targets,padding:110,maxScale:.8};}
P.register(19,{mapRevision:519,camera,actors:{'설오':'p-archer','담허':'p-mage','휘겸':'p-knight','소단':'p-occultist','주민 1':'mourner-brother','주민 2':'mourner-sister','생존자':'objective'},author,prepare,before,drive,allow,eligibility,optional,draw,complete,objective:b=>!base(b).done.route?'A2.S19.OBJECTIVE.01':!allGone(b)?'A2.S19.OBJECTIVE.02':'A2.S19.OBJECTIVE.03'});
const outcome=V.recordOutcome;V.recordOutcome=function(app,won){outcome(app,won);const b=app.engine?.b;if(won&&api.active(b)&&complete(b)){const h=app.profile.honroAct23V4History?.stages?.[19];if(h)h.reviewed19={revision:1,run:b.session,departures:clone(memory(b).spirits),marks:clone(memory(b).marks),familyWitness:familyWitness(b),familyCalls:clone(familyCalls(b)),speakers:b.units.filter(alive).map(u=>u.id)};}};

// This reviewed scene owns the physical lowering props and automatic moving
// spirits. Suppress the older always-present prop/tableau pass for this opt-in.
const oldArt=G.HonroAct23StoryArt?.draw;if(oldArt)G.HonroAct23StoryArt.draw=function(scene,e,...args){if(api.active(e?.b))return;return oldArt.call(this,scene,e,...args);};
const oldTableau=G.HonroStage19Farewell.presentation;G.HonroStage19Farewell.presentation=function(b,...args){return api.active(b)?[]:oldTableau.call(this,b,...args);};
// Reuse the existing visual-only spirit API with the approved neutral name.
for(const key of ['spirit','actor']){const old=G.HonroStage19Farewell[key];G.HonroStage19Farewell[key]=function(b,...args){const out=old.call(this,b,...args);if(out?.honroVisualOnly&&api.active(b))return {...out,name:api.row('EDGE.RUNTIME.STAGE19.SPIRIT_LABEL.1').text};return out;};}
G.HonroAct23V4Reviewed19={memory,allow,optional,allGone,allMarks,complete,familyCalls,familyWitness};
})(globalThis);
