(function(G){'use strict';
// Chapter 13 owns only its reviewed rows and physical scene proofs. Ordinary
// extraction, supported escort walking and the upper inside-bolt route remain
// the Phase A plugin's responsibility.
const P=G.HonroAct23V4ReviewedChapters,V=P.V,C=P.C,A=G.HonroAct23V4Act2Scenes;
if(G.HonroAct23V4Reviewed13)return;
const unit=(b,id)=>b.units.find(u=>u.id===id),m=b=>P.memory(b),done=(b,key)=>P.done(b,key),alive=V.alive;
const mason=b=>unit(b,'resident-1'),spirit=b=>unit(b,'resident-spirit-1'),scenes=b=>A.memory(b),base=b=>A.base.memory(b);
const near=V.near,supported=(b,u)=>alive(u)&&C.validTerrainContactPose(b.terrain,u);
const threats=(b,p,r)=>b.units.filter(u=>u.side===1&&alive(u)&&!u.honroObjectiveTarget&&near(u,p,r));
const branch=b=>b.honroEntryVariant?.choice==='A'?'A2.S13.BRANCH.01':b.honroEntryVariant?.choice==='B'?'A2.S13.BRANCH.02':'A2.S13.BRANCH.03';
function routeClear(app){const b=app.engine.b,u=mason(b),p=V.marker(b,'13.escort');if(!supported(b,u)||!p)return false;for(let x=u.x;x<=p.x;x+=20){const t=app.engine.surface(x,u.y-40,p.y+50);if(!t||Math.abs(t.y-(u.y+(p.y-u.y)*(x-u.x)/(p.x-u.x||1)))>35)return false;}return true;}
function safeMason(b){const u=mason(b),p=V.marker(b,'13.escort');return supported(b,u)&&!!scenes(b).proof['13.escort']&&near(u,p,55)&&!threats(b,p,240).length;}
const inspected=b=>!!m(b).gateInspection&&!b.terrain.find(t=>t.id==='gate-gate')?.broken;
function allow(app,row){const b=app.engine.b,q=m(b),u=mason(b),id=row.id;if(id.startsWith('EDGE.OPTIONAL_13_'))return false;
 if(id==='EDGE.ARRIVALS_13_0')return alive(u)&&alive(spirit(b))&&!!q.lowerApproach&&alive(unit(b,q.lowerApproach.id));
 if(id.startsWith('A2.S13.BRANCH.')){if(id!==branch(b)||!alive(u))return false;const who=P.actor(b,row.speaker);if(!who)return false;return id.endsWith('.01')?who.y<u.y-30:id.endsWith('.02')?who.y>u.y+30:V.heroes(b).some(h=>near(h,u,850));}
 if(id==='A2.S13.INTRO.01')return done(b,'branch')&&alive(u)&&V.heroes(b).some(h=>near(h,u,850));
 if(id==='A2.S13.INTRO.02')return done(b,'discovery')&&alive(spirit(b))&&near(P.actor(b,'소단'),u,650);
 if(id==='A2.S13.MID.01'){const a=P.actor(b,'설오'),ledge=b.terrain.find(t=>t.id==='forecourt-shot-ledge');return alive(spirit(b))&&supported(b,a)&&!!ledge&&a.x>=ledge.x&&a.x<=ledge.x+ledge.w&&Math.abs(a.y-ledge.y)<5;}
 if(id==='A2.S13.MID.02')return !!q.lowerApproach&&alive(unit(b,q.lowerApproach.id))&&alive(u);
 if(id==='A2.S13.MID.03')return !!q.extractRequest&&!base(b).proof['13.extract']&&near(P.actor(b,'담허'),u,650)&&near(P.actor(b,'소단'),u,260);
 if(id==='A2.S13.MID.04')return !!base(b).proof['13.extract']&&!alive(spirit(b))&&!!q.footRoute&&supported(b,u)&&near(P.actor(b,'소단'),u,650);
 if(['A2.S13.MID.05','A2.S13.MID.06','A2.S13.MID.07','A2.S13.MID.08'].includes(id))return safeMason(b)&&done(b,'separated');
 if(id==='A2.S13.MID.09')return safeMason(b)&&q.latch?.latched===true&&u.honroScenePose?.kind==='inspect';
 if(id==='A2.S13.MID.10')return inspected(b)&&supported(b,P.actor(b,'설오'))&&near(P.actor(b,'설오'),V.marker(b,'gate'),430);
 if(id==='A2.S13.MID.11')return inspected(b)&&safeMason(b)&&q.boltPoint?.done===true&&u.honroScenePose?.kind==='point';
 if(id==='A2.S13.MID.12')return q.arrivals?.ids?.length===2&&q.arrivals.ids.every(id=>alive(unit(b,id))&&q.arrivals.moved[id]?.distance>=95&&q.arrivals.moved[id]?.rise>=20);
 if(['A2.S13.COMPLETE.01','A2.S13.COMPLETE.02'].includes(id))return safeMason(b)&&!!scenes(b).proof.gate?.inside&&!!scenes(b).proof['13.party-pass']&&done(b,'lower-arrivals')&&done(b,'latch');
 if(id==='A2.S13.POPUP.01')return !!q.aimedAtMason&&alive(u)&&!base(b).proof['13.extract'];
 return false;
}
function author(map){
 // The finite lower approach uses one existing enemy, preserving the initial
 // population. Entry variants retain their distinct existing placements.
 const u=map.units.find(u=>u.id==='a2-enemy-3');if(u){u.x=2930;u.y=3540.125;}
 map.initialState.honroV4Reviewed13={rope:{x:2445,y:3444.5,anchor:{x:2445,y:3240}},latch:{x:2765,y:3415},bolt:{x:4517,y:3990},lowerEntry:{x:5480,y:4219.2}};
 // A previous finite density response must not duplicate the two new souls.
 map.events=map.events.filter(e=>!['13.extract','gate'].includes(e.honroDensityTrigger?.objectiveDone));
}
function prepare(b){const u=mason(b);if(u)u.name=base(b).proof['13.extract']&&supported(b,u)?'석공':'???';}
function before(app){const b=app.engine.b,q=m(b);if(!done(b,'attached'))return false;if(base(b).proof['13.extract']&&!done(b,'separated'))return false;if(scenes(b).proof['13.escort']&&!done(b,'latch'))return false;if(q.gateInspection&&!done(b,'lower-arrivals'))return false;return true;}
function drive(app,api,dt){const e=app.engine,b=e.b,q=m(b),u=mason(b),delta=Math.max(0,Math.min(dt,.05));if(!alive(u))return;
 const begin=(key,ids,proof)=>api.begin(app,key,ids,proof);
 if(!base(b).proof['13.extract']&&!q.lowerApproach){const foe=unit(b,'a2-enemy-3');if(alive(foe)&&foe.x>u.x+150&&foe.y>u.y+35){const a=q.approach??={id:foe.id,start:{x:foe.x,y:foe.y},distance:0};foe.fixed=false;const from={x:foe.x,y:foe.y};e.walk(foe,-1,delta);a.distance+=Math.hypot(foe.x-from.x,foe.y-from.y);if(a.distance>=35&&near(foe,u,700))q.lowerApproach={id:foe.id,distance:a.distance,from:a.start,to:{x:foe.x,y:foe.y}};}}
 if(!q.events.arrival){if(allow(app,api.row('EDGE.ARRIVALS_13_0')))begin('arrival',['EDGE.ARRIVALS_13_0'],q.lowerApproach);return;}
 if(done(b,'arrival')&&!q.events.branch){if(allow(app,api.row(branch(b))))begin('branch',[branch(b)],{entry:b.honroEntryVariant?.choice||null});return;}
 if(done(b,'branch')&&!q.events.discovery&&V.heroes(b).some(h=>near(h,u,850))){begin('discovery',['A2.S13.INTRO.01']);return;}
 if(done(b,'discovery')&&!q.events.attached&&near(P.actor(b,'소단'),u,650)){begin('attached',['A2.S13.INTRO.02'],{spirit:spirit(b)?.id,arm:{x:u.x+18,y:u.y-60}});return;}
 if(!done(b,'attached'))return;
 if(!q.events['living-person']&&q.aimedAtMason&&!base(b).proof['13.extract']){begin('living-person',['A2.S13.POPUP.01'],q.aimedAtMason);return;}
 if(!q.events['high-shot']&&allow(app,api.row('A2.S13.MID.01'))){begin('high-shot',['A2.S13.MID.01'],{actor:P.actor(b,'설오').id,surface:'forecourt-shot-ledge'});return;}
 if(!base(b).proof['13.extract']&&q.lowerApproach&&!q.events['lower-defense']){begin('lower-defense',['A2.S13.MID.02'],q.lowerApproach);return;}
 if(base(b).proof['13.extract']&&!q.events.separated&&routeClear(app)){q.footRoute={supported:true,surface:app.engine.surface(u.x,u.y-5,u.y+5)?.id,from:{x:u.x,y:u.y},to:V.marker(b,'13.escort')};u.name='석공';begin('separated',['A2.S13.MID.04'],q.footRoute);return;}
 if(safeMason(b)&&!q.events.family){begin('family',['A2.S13.MID.05','A2.S13.MID.06','A2.S13.MID.07','A2.S13.MID.08'],scenes(b).proof['13.escort']);return;}
 if(safeMason(b)&&done(b,'family')&&!q.events.latch){const a=q.latch??={elapsed:0,latched:false};a.elapsed=Math.min(.7,a.elapsed+delta);u.honroScenePose={kind:'inspect',time:a.elapsed};if(a.elapsed>=.7){a.latched=true;begin('latch',['A2.S13.MID.09'],{actor:u.id,point:b.honroV4Reviewed13.latch,elapsed:a.elapsed,latched:true});}return;}
 if(done(b,'latch')&&u.honroScenePose?.kind==='inspect')delete u.honroScenePose;
 const archer=P.actor(b,'설오'),gate=V.marker(b,'gate');if(done(b,'latch')&&!q.events['locked-door']&&supported(b,archer)&&near(archer,gate,430)&&!b.terrain.find(t=>t.id==='gate-gate')?.broken){q.gateInspection={actor:archer.id,point:{x:archer.x,y:archer.y},closed:true};begin('locked-door',['A2.S13.MID.10'],q.gateInspection);return;}
 if(done(b,'locked-door')&&!q.events['inside-bolt']){const a=q.boltPoint??={elapsed:0,done:false};a.elapsed=Math.min(.5,a.elapsed+delta);u.facing=1;u.honroScenePose={kind:'point',time:a.elapsed};if(a.elapsed>=.5){a.done=true;begin('inside-bolt',['A2.S13.MID.11'],{actor:u.id,point:b.honroV4Reviewed13.bolt,elapsed:a.elapsed});}return;}
 if(done(b,'inside-bolt')&&u.honroScenePose?.kind==='point')delete u.honroScenePose;
 if(done(b,'inside-bolt')&&!q.events['lower-arrivals']){if(!q.arrivals){const p=b.honroV4Reviewed13.lowerEntry;if(V.heroes(b).some(h=>Math.hypot(h.x-p.x,h.y-p.y)<400)||b.units.filter(v=>v.side===1&&alive(v)).length+2>G.HonroEncounters.populationCap(b))return;const before=new Set(b.units.map(v=>v.id));if(G.HonroAllies.execute(app,{type:'spawn',kind:'ghost',n:2,...p,spacing:145,maxDistance:180,source:'reviewed.13.lower-pair'})===false)return;const ids=b.units.filter(v=>!before.has(v.id)).map(v=>v.id);if(ids.length!==2)throw Error('reviewed13 non-atomic lower pair');q.arrivals={ids,starts:Object.fromEntries(ids.map(id=>{const v=unit(b,id);return[id,{x:v.x,y:v.y}];})),moved:{}};e.emit('save');}
  for(const id of q.arrivals.ids){const v=unit(b,id),a=q.arrivals.moved[id]??={distance:0,rise:0};if(!alive(v))continue;if(a.distance<95||a.rise<20){v.fixed=false;const from={x:v.x,y:v.y};e.walk(v,-1,delta);a.distance+=Math.hypot(v.x-from.x,v.y-from.y);a.rise=Math.max(a.rise,q.arrivals.starts[id].y-v.y);}}
  if(allow(app,api.row('A2.S13.MID.12')))begin('lower-arrivals',['A2.S13.MID.12'],q.arrivals);return;}
 if(scenes(b).proof['13.party-pass']&&!q.events.departure&&safeMason(b)){begin('departure',['A2.S13.COMPLETE.01','A2.S13.COMPLETE.02'],{gate:scenes(b).proof.gate,party:scenes(b).proof['13.party-pass'],mason:{x:u.x,y:u.y}});return;}
 if(done(b,'departure')&&!q.journal)api.journal(app,'A2.S13.JOURNAL.01');
}
function eligibility(app,mark,s){const b=app.engine.b;if(s.id==='13.extract')return{ok:done(b,'attached')&&supported(b,mason(b)),reason:s.id};if(s.id==='13.release')return{ok:done(b,'latch')&&safeMason(b),reason:s.id};if(s.id==='gate'&&!done(b,'lower-arrivals'))return{ok:false,reason:s.id};}
function use(app,mark,s){if(s.id!=='13.extract')return;const b=app.engine.b,q=m(b);if(!q.events.separating){q.extractRequest={actor:app.engine.active.id,point:{x:app.engine.active.x,y:app.engine.active.y}};P.begin(app,'separating',['A2.S13.MID.03'],q.extractRequest);return false;}if(!done(b,'separating'))return false;}
const attached=new WeakSet();function attach(app,e){if(attached.has(e))return;attached.add(e);const predict=e.predict;e.predict=function(u,skill,angle,power,target,collect=true,...args){const out=predict.call(e,u,skill,angle,power,target,collect,...args);if(P.active(e.b)&&e.b.honroStage===13&&collect&&u.side===0&&out.unit==='resident-1'&&!base(e.b).proof['13.extract'])m(e.b).aimedAtMason={actor:u.id,skill:skill.id,angle,power,target:out.unit};return out;};}
function draw(scene,c,b){const q=m(b),u=mason(b),spec=b.honroV4Reviewed13;if(!spec)return;c.save();c.lineCap='round';c.strokeStyle='#77664d';c.lineWidth=5;const held=!base(b).proof['13.extract'],x=held?u.x+17:spec.latch.x,y=held?u.y-64:spec.latch.y;c.beginPath();c.moveTo(spec.rope.anchor.x,spec.rope.anchor.y);c.lineTo(x,y);c.lineTo(x+12,y+105);c.stroke();if(held&&alive(u)){c.strokeStyle='#9b4e43';c.lineWidth=7;c.beginPath();c.moveTo(x-7,y-9);c.lineTo(x+6,y+8);c.stroke();if(alive(spirit(b))){c.globalAlpha=.6;c.strokeStyle='#b7cbbf';c.lineWidth=2;c.beginPath();c.moveTo(spirit(b).x,spirit(b).y-spirit(b).h*.5);c.quadraticCurveTo(u.x+80,u.y-115,x,y);c.stroke();}}
 c.globalAlpha=1;c.save();c.translate(spec.latch.x,spec.latch.y);c.rotate(-.8+Math.min(1,(q.latch?.elapsed||0)/.7)*.8);c.strokeStyle=q.latch?.latched?'#c5b68e':'#827760';c.lineWidth=8;c.beginPath();c.moveTo(-20,0);c.lineTo(18,0);c.lineTo(18,18);c.stroke();c.restore();const open=!!b.terrain.find(t=>t.id==='gate-gate')?.broken;c.strokeStyle='#a8a08a';c.lineWidth=9;c.beginPath();c.moveTo(spec.bolt.x+(open?38:0),spec.bolt.y);c.lineTo(spec.bolt.x+70+(open?38:0),spec.bolt.y);c.stroke();c.restore();}
function camera(app,key){const b=app.engine.b,spec=b.honroV4Reviewed13;if(key==='lower-arrivals')return{id:'reviewed13.lower-arrivals',intent:'situation',targets:m(b).arrivals.ids.map(actor=>({actor})),padding:130,maxScale:.8,speakerPolicy:'none'};if(['locked-door','inside-bolt'].includes(key))return{id:'reviewed13.'+key,intent:'situation',targets:[{x:spec.bolt.x,y:spec.bolt.y},{actor:P.actor(b,'설오')?.id}],padding:130,maxScale:.8,speakerPolicy:'none'};}
P.register(13,{mapRevision:513,actors:{'석공':'resident-1'},allow,author,prepare,before,drive,eligibility,use,attach,draw,camera,objective(b){return safeMason(b)?'A2.S13.OBJECTIVE.03':base(b).proof['13.extract']?'A2.S13.OBJECTIVE.02':'A2.S13.OBJECTIVE.01';},complete(b){return safeMason(b)&&done(b,'departure')&&!!m(b).journal&&!!scenes(b).proof.gate?.inside;},failure(b){return !alive(mason(b))?'A2.S13.FAIL.01':null;}});
G.HonroAct23V4Reviewed13={allow,routeClear,safeMason,branch};
})(globalThis);
