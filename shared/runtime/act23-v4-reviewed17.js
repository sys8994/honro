(function(G){'use strict';
const P=G.HonroAct23V4ReviewedChapters;if(!P||G.HonroAct23V4Reviewed17)return;
const V=P.V,C=P.C,B=G.HonroAct23V4Act2,api=P.apiFor(17),clone=x=>JSON.parse(JSON.stringify(x));
const unit=(b,id)=>b.units.find(u=>u.id===id),mem=b=>api.memory(b),base=b=>B.memory(b),id=s=>'A2.S17.'+s,spoken=(b,k)=>mem(b).events[k]?.status==='done';
const witnesses=[1,2,4,6,8].map(i=>'A2.S16.WITNESS.0'+i);
function witnessed(p){const h=p.honroAct23V4History?.stages?.[16],f=h?.reviewedPhysical;return !!h?.run&&f?.revision===1&&f.sourceRun===h.run&&f.witness16_heard===true&&witnesses.every(k=>f.witnessRows?.includes(k)&&h.reviewedNarrative?.rows?.includes(k));}
function elderObserved(p){const h=p.honroAct23V4History?.stages?.[16];return !!h?.run&&h.reviewedPhysical?.sourceRun===h.run&&h.reviewedPhysical.elderDiscipleObserved===true;}
const aliveWorkers=b=>['17.mason','17.gilchan'].every(k=>V.alive(unit(b,k))),near=(b,p,r)=>V.heroes(b).some(u=>V.near(u,p,r));
const foes=(b,p,r=280)=>b.units.filter(u=>V.alive(u)&&u.side===1&&!u.honroObjectiveTarget&&V.near(u,p,r));
function author(map){const s=map.initialState.honroV4Worksite,hoist=map.units.find(u=>u.id==='act2-hoist'),step=map.initialState.honroV4Steps.find(s=>s.id==='17.hoist');step.kind='interact';map.initialState.honroV4Reviewed17={revision:1,hoist:{x:hoist.x,y:hoist.y},socket:{x:s.repair.x+45,y:s.repair.y-100},crack:{x:s.braceHazard.x+70,y:s.braceHazard.y+15}};hoist.stageOverrides={...hoist.stageOverrides,honroHoistSpiritAttached:true};}
function prepare(b,p){for(const [k,name]of [['17.mason','석공'],['17.gilchan','길찬']]){const u=unit(b,k);if(u)u.name=name;}const q=mem(b);q.witness16_heard=witnessed(p);q.elderDiscipleObserved=elderObserved(p);}
function separated(b){const h=unit(b,'act2-hoist'),p=mem(b).hoistSeparation;return !!p&&p.released===true&&h?.honroHoistSpiritAttached===false&&h.honroReleased===true&&h.dead===true;}
function optional(p,r){const b=p.honroBattle;if(!b||!api.active(b))return false;const q=mem(b),a=base(b);
 if(['EDGE.OPTIONAL_17_ARCHER_0','EDGE.OPTIONAL_17_KNIGHT_0'].includes(r.id))return witnessed(p)&&!a.proof['17.mesh'];
 if(r.id==='EDGE.OPTIONAL_17_MAGE_0')return !q.events.intro;
 if(r.id==='EDGE.OPTIONAL_17_OCCULTIST_0')return elderObserved(p);
 return false;
}
function clearShot(app,proof){if(!proof)return false;const e=app.engine,b=e.b,u=api.actor(b,'설오'),t=unit(b,proof.target),s=b.honroV4Worksite;if(!V.alive(u)||!V.alive(t))return false;
 const from={x:u.x,y:u.y-u.h*.63},to={x:t.x,y:t.y-t.h*.5},dx=to.x-from.x,dy=to.y-from.y,den=dx*dx+dy*dy,axle={x:s.repair.x+45,y:s.repair.y-100},f=den?Math.max(0,Math.min(1,((axle.x-from.x)*dx+(axle.y-from.y)*dy)/den)):0;
 if(Math.hypot(from.x+f*dx-axle.x,from.y+f*dy-axle.y)<85)return false;const h=e.projectileCollision(from,to,1,u.id,[],true);return !h?.terrain&&h?.unit?.id===t.id;
}
function allow(app,r){const b=app.engine.b,q=mem(b),a=base(b),w=B.worksite(b);if(r.id.startsWith('EDGE.OPTIONAL_'))return optional({...app.profile,honroBattle:b},r);
 if(r.id===id('FAIL.01'))return b.phase==='lost'||!aliveWorkers(b);if(!aliveWorkers(b))return false;
 if(r.id==='EDGE.ARRIVALS_17_0')return !!b.honroV4Reviewed17.socket;
 if(r.id.startsWith(id('INTRO.')))return !a.proof['17.mesh'];
 if(r.id===id('MID.01'))return !!q.crackObserved&&!a.proof['17.brace'];
 if(r.id===id('MID.02'))return !!q.childApproach&&!a.proof['17.mesh'];
 if(r.id===id('MID.03'))return !!q.hoistAttempt?.visiblePull&&!separated(b)&&V.alive(unit(b,'act2-hoist'));
 if(r.id===id('MID.04'))return separated(b);
 if(r.id===id('MID.05'))return separated(b)&&B.worksite(b).actors['17.mason:join']?.arrived&&!a.proof['17.mesh'];
 if(r.id===id('MID.06'))return allow(app,api.row(id('MID.05')))&&q.witness16_heard&&witnessed(app.profile);
 if(r.id===id('MID.07'))return allow(app,api.row(id('MID.05')))&&spoken(b,'shaft-question')&&(q.pause||0)>=.35;
 if(r.id===id('MID.08')||r.id===id('MID.09'))return !!w.delivery?.delivered&&w.delivery.distance>=b.honroV4Worksite.minCarry&&a.proof['17.parts']?.workerCarrier==='17.gilchan'&&B.worksite(b).actors['17.mason:join']?.arrived;
 if(r.id===id('MID.10'))return !!q.responseApproach;
 if(r.id===id('MID.11'))return clearShot(app,q.clearShot);
 if(r.id===id('MID.12'))return !!a.proof['17.lock']?.pinSeated;
 if(r.id===id('MID.13'))return (a.wheelAngle||0)>.1;
 if(r.id===id('MID.14'))return Object.keys(w.knocks||{}).length>0;
 if(r.id===id('COMPLETE.01'))return !!a.proof['17.load-test']?.locksClosed&&!!a.proof['17.load-test']?.ropeTaut&&a.wheelAngle===Math.PI*2;
 if(r.id===id('COMPLETE.02'))return allow(app,api.row(id('COMPLETE.01')))&&spoken(b,'load');
 if(r.id===id('POPUP.01'))return !!q.retreat;
 if(r.id===id('POPUP.02'))return !!a.proof['17.mesh']&&!a.proof['17.wheel']&&(q.idle||0)>=1;
 if(r.id===id('JOURNAL.01')||r.id==='EDGE.RUNTIME.STAGE17.PROTECT_LABEL')return B.complete(b)&&separated(b)&&api.done(b,'depart');
 return r.id.startsWith(id('OBJECTIVE.'));
}
// A living possessed drum physically takes up its cable before release.
// These serialized rig parts move in the scene; the bell itself stays seated.
function advanceHoist(app,dt){const b=app.engine.b,q=mem(b),h=unit(b,'act2-hoist'),point=b.honroV4Reviewed17.hoist;if(!V.alive(h)||h.honroHoistSpiritAttached!==true||separated(b)||!near(b,point,650))return;const a=q.hoistAttempt??={elapsed:0,angle:0,hookLift:0,ropeTaut:false,pulls:0};a.elapsed+=Math.max(0,Math.min(dt||0,.05));const phase=a.elapsed%1.5,up=Math.min(1,phase/.6),lift=phase<.85?up:Math.max(0,1-(phase-.85)/.65);a.angle=lift*.72;a.hookLift=lift*24;a.ropeTaut=lift>.15;a.pulls=Math.floor(a.elapsed/1.5)+(lift>=.5?1:0);if(a.angle>=.3&&a.hookLift>=10&&a.ropeTaut){a.visiblePull=true;const observer=api.actor(b,'소단');if(V.near(observer,point,650))q.hoistLiftAttemptObserved??={kind:'hoist-upward-pull',observer:observer.id,source:h.id,from:{angle:0,hookLift:0},to:{angle:a.angle,hookLift:a.hookLift},ropeTaut:true,elapsed:a.elapsed,point:clone(point)};}}
function observe(app,dt){const b=app.engine.b,q=mem(b),a=base(b),s=b.honroV4Worksite,w=B.worksite(b),delta=Math.max(0,Math.min(dt||0,.05));
 if(near(b,V.marker(b,'17.brace'),700))q.crackObserved??=clone(b.honroV4Reviewed17.crack);
 const join=w.actors['17.gilchan:join'];if(join?.distance>2&&!a.proof['17.mesh'])q.childApproach??={distance:join.distance,actor:'17.gilchan'};
 if(spoken(b,'shaft-question'))q.pause=(q.pause||0)+delta;
 if(a.proof['17.mesh']&&!a.proof['17.wheel'])q.idle=(q.idle||0)+delta;
 for(const who of ['mason','gilchan']){const k='17.'+who+':retreat',r=w.actors[k];if(r?.distance>2)q.retreat??={actor:'17.'+who,distance:r.distance,from:clone(r.from)};}
 q.positions??={};const ids=Object.values(a.defense?.sources||{}).flat();for(const k of ids){const u=unit(b,k);if(!V.alive(u))continue;const d=Math.hypot(u.x-s.repair.x,u.y-s.repair.y),old=q.positions[k];if(old&&d<old.d-1)q.responseApproach??={actor:k,from:old,to:{x:u.x,y:u.y},distance:old.d-d};q.positions[k]={x:u.x,y:u.y,d};if(clearShot(app,{target:k}))q.clearShot={target:k,actor:api.actor(b,'설오')?.id};}
}
function scene(app,key,rows,proof,targets){const out=api.begin(app,key,rows,proof||{});if(out&&targets){for(const l of app.dialogue.lines)l[2].camera={id:l[2].rowId,intent:'situation',targets:clone(targets),padding:120,maxScale:.7};G.HonroStory.draw(app);}return out;}
function drive(app,a,dt){const b=app.engine.b,q=mem(b),p=base(b);observe(app,dt);if(!V.safe(app))return;const start=(key,rows,condition,proof,targets)=>{if(!q.events[key]&&condition){scene(app,key,rows,proof,targets);return true;}return false;};
 if(start('arrival',['EDGE.ARRIVALS_17_0'],true,{},[{actor:'17.mason'},{actor:'17.gilchan'},b.honroV4Reviewed17.socket]))return;
 if(start('intro',[id('INTRO.01'),id('INTRO.02'),id('INTRO.03'),id('INTRO.04')],true,{},[{actor:'17.mason'},{actor:'17.gilchan'},b.honroV4Reviewed17.socket]))return;
 if(!spoken(b,'intro'))return;
 if(start('crack',[id('MID.01')],!!q.crackObserved&&!p.proof['17.brace'],q.crackObserved,[b.honroV4Reviewed17.crack]))return;
 if(start('hoist',[id('MID.03')],allow(app,api.row(id('MID.03')))||!V.alive(unit(b,'act2-hoist'))&&near(b,b.honroV4Reviewed17.hoist,650),{},[{actor:'act2-hoist'}]))return;
 if(start('separation',[id('MID.04')],separated(b),q.hoistSeparation,[b.honroV4Reviewed17.hoist]))return;
 if(start('child-path',[id('MID.02')],!!q.childApproach&&!p.proof['17.mesh'],q.childApproach,[{actor:'17.gilchan'}]))return;
 if(start('shaft-question',[id('MID.05'),id('MID.06')],allow(app,api.row(id('MID.05'))),{},[{actor:'17.mason'},b.honroV4Reviewed17.socket]))return;
 if(start('fetch',[id('MID.07')],allow(app,api.row(id('MID.07')))))return;
 if(start('delivery',[id('MID.08'),id('MID.09')],spoken(b,'fetch')&&allow(app,api.row(id('MID.08'))),B.worksite(b).delivery,[{actor:'17.gilchan'},{actor:'17.mason'}]))return;
 if(start('retreat',[id('POPUP.01')],!!q.retreat,q.retreat))return;
 if(start('approach',[id('MID.10')],!!q.responseApproach,q.responseApproach))return;
 if(start('shot',[id('MID.11')],clearShot(app,q.clearShot),q.clearShot))return;
 if(start('lock',[id('MID.12')],!!p.proof['17.lock'],p.proof['17.lock']))return;
 if(start('rotation',[id('MID.13')],(p.wheelAngle||0)>.1,{angle:p.wheelAngle}))return;
 if(start('knock',[id('MID.14')],spoken(b,'rotation')&&Object.keys(B.worksite(b).knocks||{}).length>0,B.worksite(b).knocks))return;
 if(start('idle',[id('POPUP.02')],allow(app,api.row(id('POPUP.02')))))return;
 if(start('load',[id('COMPLETE.01')],allow(app,api.row(id('COMPLETE.01'))),p.proof['17.load-test']))return;
 if(start('depart',[id('COMPLETE.02')],spoken(b,'load'),p.proof['17.load-test']))return;
 if(allow(app,api.row(id('JOURNAL.01')))&&!q.journal)api.journal(app,id('JOURNAL.01'));
}
function before(app,a,dt){const b=app.engine.b,q=mem(b),p=base(b);if(!V.safe(app))return false;advanceHoist(app,dt);observe(app,dt);
 if(!spoken(b,'intro'))return false;
 if(p.proof['17.brace']&&!api.done(b,'crack'))return false;
 if(separated(b)&&!api.done(b,'separation'))return false;
 if(spoken(b,'shaft-question')&&!spoken(b,'fetch'))return false;
 if(p.proof['17.mesh']&&!spoken(b,'delivery'))return false;
 if(p.proof['17.lock']&&!spoken(b,'lock'))return false;
 if((p.wheelAngle||0)>.1&&!spoken(b,'rotation'))return false;
 if(p.proof['17.load-test']&&!api.done(b,'depart'))return false;
 return true;
}
function eligibility(app,m,s){const b=app.engine.b;if(s.id==='17.hoist')return{ok:!!mem(b).events.hoist&&['mage','occultist'].includes(app.engine.active?.cls)&&!foes(b,b.honroV4Reviewed17.hoist,280).some(u=>u.id!=='act2-hoist'),reason:s.id};
 if(s.id==='17.brace'&&!api.done(b,'crack')||s.id==='17.mesh'&&!spoken(b,'delivery')||s.id==='17.lock'&&!spoken(b,'delivery')||s.id==='17.parts'&&!api.done(b,'separation'))return{ok:false,reason:s.id};return undefined;}
function use(app,m,s){if(s.id!=='17.hoist')return undefined;if(!eligibility(app,m,s).ok)return false;const e=app.engine,b=e.b,h=unit(b,'act2-hoist');if(!h)return false;h.honroHoistSpiritAttached=false;h.honroReleased=true;h.hp=0;h.dead=true;b.queue=b.queue.filter(k=>k!==h.id);mem(b).hoistSeparation={actor:e.active.id,cls:e.active.cls,released:true,machine:h.id,framePreserved:true,point:{x:h.x,y:h.y},serial:b.honroState.actorTurnSerial||0};e.fx('ring',h.x,h.y-h.h*.5,'#bccbc1',75);V.completeStep(app,s,e.active);app.dirty=true;if(!app.checkMission(e))e.finishAction();return true;}
// The father's request precedes Gilchan's loaded walk; the ordinary worker
// integrator still owns every position and may retreat immediately from danger.
function attach(app,e){if(e.honroReviewed17Bound)return;e.honroReviewed17Bound=true;const walk=e.walk;e.walk=function(u,...args){const b=e.b;if(api.active(b)&&u?.id==='17.gilchan'&&base(b).proof['17.parts']?.workerCarrier===u.id&&!spoken(b,'fetch')&&!foes(b,b.honroV4Worksite.repair).length){u.fixed=true;return false;}return walk.call(e,u,...args);};}
function draw(scene,c,b){const s=b.honroV4Reviewed17,q=mem(b),p=s.hoist;c.save();c.strokeStyle='#a39876';c.lineWidth=7;c.beginPath();c.moveTo(p.x-70,p.y);c.lineTo(p.x-50,p.y-155);c.lineTo(p.x+55,p.y-155);c.lineTo(p.x+75,p.y);c.moveTo(p.x,p.y-155);c.lineTo(p.x,p.y-65);c.stroke();// The live hoist body occupies the center. Attach the moving cable rig to
// its right crossbar so the drum and hook remain visible before separation.
const rig=q.hoistAttempt||{angle:0,hookLift:0,ropeTaut:false},rigX=p.x+190;c.beginPath();c.moveTo(p.x+55,p.y-155);c.lineTo(rigX+115,p.y-155);c.stroke();c.save();c.translate(rigX,p.y-115);c.rotate(rig.angle);c.beginPath();c.arc(0,0,26,0,Math.PI*2);c.moveTo(-26,0);c.lineTo(26,0);c.moveTo(0,-26);c.lineTo(0,26);c.stroke();c.restore();c.strokeStyle=rig.ropeTaut?'#d5c8a2':'#837b68';c.lineWidth=rig.ropeTaut?5:3;c.beginPath();c.moveTo(rigX+25,p.y-115);c.lineTo(rigX+70,p.y-155);c.lineTo(rigX+115,p.y-155);c.lineTo(rigX+115,p.y-48-rig.hookLift);c.lineTo(rigX+130,p.y-40-rig.hookLift);c.lineTo(rigX+140,p.y-53-rig.hookLift);c.stroke();if(!separated(b)){c.strokeStyle='#bfd0c2';c.globalAlpha=.55;c.beginPath();c.ellipse(p.x,p.y-105,30,45,.2,0,Math.PI*2);c.stroke();}c.strokeStyle='#c3aa84';c.lineWidth=4;c.beginPath();c.moveTo(s.crack.x-45,s.crack.y);c.lineTo(s.crack.x-10,s.crack.y+10);c.lineTo(s.crack.x+8,s.crack.y-5);c.lineTo(s.crack.x+40,s.crack.y+5);c.stroke();if(!base(b).proof['17.mesh']){c.strokeStyle='#5a554c';c.lineWidth=14;c.beginPath();c.arc(s.socket.x,s.socket.y,18,0,Math.PI*2);c.stroke();}c.restore();}
const outcome=V.recordOutcome;V.recordOutcome=function(app,won){outcome(app,won);const b=app.engine?.b,h=app.profile.honroAct23V4History?.stages?.[17];if(won&&api.active(b)&&h)h.reviewedPhysical={revision:1,sourceRun:b.session,hoistSeparated:separated(b),hoistSeparation:clone(mem(b).hoistSeparation||null),hoistLiftAttemptObserved:clone(mem(b).hoistLiftAttemptObserved||null),witness16_heard:mem(b).witness16_heard===true,axisTurned:base(b).proof['17.wheel']?.rotationCount===1&&base(b).wheelAngle===Math.PI*2,wheel:{angle:base(b).wheelAngle||0,rotationCount:base(b).proof['17.wheel']?.rotationCount||0},locksClosed:base(b).proof['17.lock']?.pinSeated===true,loadTestPassed:base(b).proof['17.load-test']?.locksClosed===true&&base(b).proof['17.load-test']?.ropeTaut===true};};
const complete=b=>separated(b)&&B.complete(b)&&api.done(b,'depart')&&!!mem(b).journal;
P.register(17,{mapRevision:517,actors:{'석공':'17.mason','길찬':'17.gilchan'},author,prepare,allow,drive,before,eligibility,use,optional,draw,attach,objective:b=>base(b).proof['17.mesh']?id('OBJECTIVE.04'):separated(b)?id('OBJECTIVE.03'):base(b).proof['17.brace']?id('OBJECTIVE.02'):id('OBJECTIVE.01'),failure:b=>b.phase==='lost'||B.failure(b)?id('FAIL.01'):null,complete,present(b,out){if(!complete(b))return out;const r=api.row('EDGE.RUNTIME.STAGE17.PROTECT_LABEL');return{...out,completionText:r.text,checklist:[{id:r.id,text:r.text,done:true}],visibleChecklist:[{id:r.id,text:r.text,done:true}]};},state:b=>({reviewedWitness16Missing:!mem(b).witness16_heard})});
G.HonroAct23V4Reviewed17={memory:mem,allow,witnessed,elderObserved,separated,optional,complete,clearShot};
})(globalThis);
