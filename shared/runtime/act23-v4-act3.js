(function(G){'use strict';
const V=G.HonroAct23V4,clone=x=>JSON.parse(JSON.stringify(x)),alive=V.alive;
const m=b=>V.mem(b),mark=(b,id)=>V.marker(b,id),unit=(b,id)=>b.units.find(u=>u.id===id);
const step=(id,kind='interact',extra={})=>({id,label:id,kind,...extra});
function at(map,id){const p=map.markers.find(p=>p.id===id);if(!p)throw Error('v4.marker:'+map.id+':'+id);return{x:p.x,y:p.y};}
function marker(map,id,point,extra={}){const old=map.markers.find(p=>p.id===id),r={id,type:map.metadata.stageId<=20?'act2':'act3',action:map.metadata.stageId<=20?'act2':'act3',label:id,...point,...extra};if(old)Object.assign(old,r);else map.markers.push(r);return r;}
function npc(map,id,point,{guard=false,...extra}={}){if(map.units.some(u=>u.id===id))return;map.units.push({id,kind:guard?'ally:guard':'object:civilian',team:guard?'ally':'npc',label:id,...point,stageOverrides:{fixed:true,honroProtected:true,honroV4Actor:true,h:92,r:22,hp:guard?1000:620,maxHp:guard?1000:620,maxMove:600,moveLeft:600,walkSpeed:200,...extra}});}
function setSteps(map,list){map.initialState.honroV4Steps=list;const keep=new Set(list.map(s=>s.id));for(const p of map.markers){if(['act2','act3'].includes(p.action)&&!keep.has(p.id))delete p.action;}}
function walk(app,u,goal,{radius=90,lead=true}={}){const b=app.engine.b;if(!alive(u)||!goal)return false;if(V.near(u,goal,radius))return true;if(!V.safe(app)||b.side!==0||b.phase!=='aim')return false;
 const dir=Math.sign(goal.x-u.x),leaders=V.heroes(b).filter(h=>Math.abs(h.y-u.y)<220&&Math.abs(h.x-u.x)<950&&(h.x-u.x)*dir>60);if(lead&&!leaders.length)return false;
 const stamp=b.round;if(u.honroV4MoveRound!==stamp){u.honroV4MoveRound=stamp;u.moveLeft=u.maxMove;}
 const before={x:u.x,y:u.y};u.fixed=false;app.engine.walk(u,dir,Math.min(app.honroV4Dt||.016,.05),true);u.honroV4Distance=(u.honroV4Distance||0)+Math.hypot(u.x-before.x,u.y-before.y);app.dirty=true;return V.near(u,goal,radius);
}
function capture(app,id,point){const b=app.engine.b,key='v4:'+b.honroStage+':'+id;if(m(b).cargo?.[key])return;const actor=V.heroes(b).find(u=>V.near(u,point,260));if(!actor)return;m(b).cargo??={};m(b).cargo[key]={id:key,owner:actor.cls,round:b.round,source:{x:point.x,y:point.y},revision:1};app.profile.honroV4Cargo??={};app.profile.honroV4Cargo[key]=clone(m(b).cargo[key]);}
function author(map){const n=map.metadata.stageId,base=clone(map.initialState[n<=20?'honroAct2Steps':'honroAct3Steps']||[]);map.initialState.honroV4Steps=base;
 if(n===19){setSteps(map,base.map(s=>s.id.startsWith('send-')?{...s,kind:'v4-farewell'}:s));map.events=[];map.units=map.units.filter(u=>u.team!=='enemy');map.initialState.honroV4Offerings=[1,2,3].map(i=>({id:'v4.19.offering.'+i,...at(map,'separate-'+i)}));}
 if(n===20){setSteps(map,base);for(const u of map.units)if(u.stageOverrides?.honroConvoyMember){delete u.stageOverrides.honroConvoyMember;u.stageOverrides.honroProtected=true;u.stageOverrides.fixed=false;u.stageOverrides.maxMove=600;u.stageOverrides.moveLeft=600;}map.initialState.honroV4Convoy=['objective','convoy-gilchan','convoy-mason'];}
 if(n===21){setSteps(map,base);const p=at(map,'refuge-hold');npc(map,'v4.gwakjin',{x:p.x+290,y:p.y},{guard:true});npc(map,'v4.gate-soldier-1',{x:p.x+410,y:p.y},{guard:true,honroProtected:false});npc(map,'v4.gate-soldier-2',{x:p.x+490,y:p.y},{guard:true,honroProtected:false});map.initialState.honroV4ArmorDistinction={current:['v4.gwakjin','v4.gate-soldier-1','v4.gate-soldier-2'],old:map.units.filter(u=>u.team==='enemy'&&/possessed/.test(u.kind)).map(u=>u.id)};}
 if(n===22){const p=at(map,'ledger-case');marker(map,'v4.record-bundle',p);setSteps(map,[step('archive-seal','interact',{requiredClass:'knight',opens:'archive-door'}),step('v4.record-bundle','interact',{opens:'upper-door'}),step('archive-exit','reach')]);map.initialState.honroV4RecordBundle={id:'v4.22.bundle',reports:3,...p};}
 if(n===23){setSteps(map,[step('dispatch-bundle','interact',{target:'act3-carrier'}),step('dock-mid','escort',{target:'act3-carrier'}),step('dock-exit','escort',{target:'act3-carrier'})]);map.initialState.honroV4MaterialEvidence=[{id:'v4.23.body-wrap',...at(map,'dispatch-bundle')},{id:'v4.23.household-metal',...at(map,'dock-mid')}];}
 if(n===24){setSteps(map,base);map.initialState.honroV4Entrances=[{id:'water',marker:'split-route-a',classes:['archer','mage']},{id:'ground',marker:'split-route-b',classes:['knight','occultist']}];}
 if(n===25){setSteps(map,base.map(s=>s.id==='household-tally'?{...s,kind:'evidence',afterEvidence:'stake-arrival-5'}:s));map.initialState.honroV4MaterialEvidence=map.markers.filter(p=>/^stake-arrival/.test(p.id)).map(p=>({id:'v4.25.item.'+p.id,...p}));}
 if(n===26){const p=at(map,'artisan-resident');marker(map,'v4.ancestor-testimony',p);setSteps(map,[step('hidden-latch','interact',{requiredClass:'knight',opens:'hidden-door'}),step('artisan-resident','rescue',{target:'act3-resident',requiredClass:'occultist'}),step('v4.ancestor-testimony','interact'),step('workshop-exit','reach',{allHeroes:true})]);map.initialState.honroV4Smoke={x:6640,y:1920};}
 if(n===27){setSteps(map,base);map.initialState.honroV4Steps.find(s=>s.id==='depot-route-ledger').kind='v4-stake-proof';map.initialState.honroV4MaterialEvidence=[{id:'v4.27.family-tags',...at(map,'family-manifest')}];}
 if(n===28){const list=base.filter(s=>!['closure-order','suppression-order'].includes(s.id));for(const s of list)if(s.id==='party-reunion')Object.assign(s,{allHeroes:true,radius:440});const p=at(map,'party-reunion');npc(map,'v4.gwakjin',{x:p.x+400,y:p.y},{guard:true,allyRole:'channeler'});npc(map,'v4.fire-resident-1',{x:p.x+510,y:p.y});npc(map,'v4.fire-resident-2',{x:p.x+600,y:p.y});setSteps(map,list);map.initialState.honroV4FireEvacuation={ids:['v4.fire-resident-1','v4.fire-resident-2'],guard:'v4.gwakjin',destination:{x:6650,y:2590}};}
}
function prepare(b){const n=b.honroStage;m(b);if(n===20){b.honroConvoyActors=[];for(const id of b.honroV4Convoy||[]){const u=unit(b,id);if(u){delete u.honroVisualOnly;u.honroProtected=true;u.maxMove=u.moveLeft=600;u.fixed=false;}}}
 if(n===19)G.HonroStage19Farewell.prepare(b);
 if(n===28){m(b).fireStartEnd??=b.teamEnds?.[1]||0;m(b).fireTurns??=0;}
 if(n===27)G.HonroAct3Void.initializeFresh(b);
 for(const u of b.units)if(u.honroV4Actor&&u.honroAlly)u.honroV4CurrentMilitary=true;
}
function use(app,p){const b=app.engine.b,s=V.current(b),n=b.honroStage;
 if(n===19&&s?.id.startsWith('send-')){const q=m(b).farewell??={};if(!q[s.id]){q[s.id]={elapsed:0,from:{x:p.x,y:p.y},status:'moving'};V.slot(app,'19.'+s.id,{source:p.id});app.engine.finishAction();}return true;}
 if(n===20&&s?.id==='escort')m(b).convoyStarted=true;
 if(n===22&&s?.id==='v4.record-bundle'){capture(app,s.id,p);V.slot(app,'22.records-compare',{source:p.id,contents:['official-report','population-register','canal-plan']});}
 if(n===23&&s?.id==='dispatch-bundle'){m(b).carrierStarted=true;V.slot(app,'23.material-tags',{source:p.id});}
 if(n===26&&s?.id==='v4.ancestor-testimony'){capture(app,s.id,p);V.slot(app,'26.ancestor-testimony',{source:p.id});}
 if(n===28&&s?.id==='petition-record'){if(!m(b).evacuationSafe)return false;capture(app,s.id,p);V.slot(app,'28.orders-bundle',{source:p.id,responsibility:['closure-approval','massacre-execution','post-event-concealment']});}
 return undefined;
}
function stepSatisfied(b,s){const n=b.honroStage,root=m(b);if(n===19&&s.id.startsWith('send-'))return root.farewell?.[s.id]?.status==='done';
 if(n===24&&s.id==='land-register')return !!root.entrances?.water&&!!root.entrances?.ground;
 if(n===27&&s.id==='depot-route-ledger')return (b.stakes||[]).some(p=>p.skill==='M09'&&p.side===0&&(p.expires===undefined||p.expires>b.round));
 if(n===27&&s.id==='family-manifest')return !!root.done[s.id]&&b.honroAct3Void?.state==='RESOLVED';
 if(n===20&&['escort-mid','escape'].includes(s.id))return !!root.convoyGoals?.[s.id];if(n===23&&['dock-mid','dock-exit'].includes(s.id))return !!root.carrierGoals?.[s.id];
 return null;
}
function escort(app,s,ids,rootkey){const b=app.engine.b,root=m(b),goal=mark(b,s.id);if(!goal)return;root[rootkey]??={};let all=true;
 const waypoints=b.honroMarkers.filter(p=>p.id.startsWith('route:'+s.id+':')).sort((a,z)=>Number(a.id.split(':').at(-1))-Number(z.id.split(':').at(-1)));
 for(const [i,id]of ids.entries()){const u=unit(b,id);if(!alive(u)){all=false;continue;}root.escortWaypoints??={};const k=s.id+':'+id;let index=root.escortWaypoints[k]||0;while(waypoints[index]&&V.near(u,waypoints[index],100))index++;root.escortWaypoints[k]=index;const dest=waypoints[index]||{x:goal.x-i*65,y:goal.y};if(!walk(app,u,dest,{radius:90}))all=false;}
 if(all&&ids.every(id=>(unit(b,id)?.honroV4Distance||0)>80))root[rootkey][s.id]=true;
}
function tick(app,dt){const b=app.engine.b,n=b.honroStage,root=m(b);app.honroV4Dt=dt;
 if(n===19){for(const [id,q]of Object.entries(root.farewell||{}))if(q.status==='moving'){q.elapsed=Math.min(1,q.elapsed+Math.max(0,dt));if(q.elapsed>=1){q.status='done';V.ackSlot(b,'19.'+id,{movement:180});}}if(root.done.route)G.HonroStage19Farewell.prepare(b);}
 if(n===20&&root.convoyStarted){const s=V.current(b);if(['escort-mid','escape'].includes(s?.id))escort(app,s,b.honroV4Convoy||['objective'],'convoyGoals');}
 if(n===23&&root.carrierStarted){const s=V.current(b);if(['dock-mid','dock-exit'].includes(s?.id))escort(app,s,['act3-carrier'],'carrierGoals');}
 if(n===24&&root.done['shrine-seal']){root.entrances??={};for(const q of b.honroV4Entrances||[])if(q.classes.every(cls=>V.heroes(b).some(u=>u.cls===cls&&V.near(u,mark(b,q.marker),115))))root.entrances[q.id]=true;}
 if(n===28){const stopped=root.done['fire-screen']&&root.done['water-release'];if(!stopped)root.fireTurns=Math.max(0,(b.teamEnds?.[1]||0)-root.fireStartEnd);
  if(stopped&&root.done['party-reunion']){const q=b.honroV4FireEvacuation;if(q){const ids=[q.guard,...q.ids];let done=true;for(const [i,id]of ids.entries())if(!walk(app,unit(b,id),{x:q.destination.x-i*80,y:q.destination.y},{lead:i===0,radius:100}))done=false;if(done&&q.ids.every(id=>(unit(b,id)?.honroV4Distance||0)>100))root.evacuationSafe=true;}}
 }
}
function failure(b){if(b.honroStage===28&&!(m(b).done['fire-screen']&&m(b).done['water-release'])&&m(b).fireTurns>=12)return'v4.28.fire';return null;}
function complete(b){if(b.honroStage===28)return !!m(b).evacuationSafe;return true;}
function draw(scene,c,b){const n=b.honroStage,root=m(b),time=scene.time||0;
 if(n===19){for(let i=1;i<=3;i++){const p=mark(b,'separate-'+i),q=root.farewell?.['send-'+i],progress=q?.elapsed||0;if(root.done['send-'+i])continue;const x=p.x+38+progress*180,y=p.y-progress*120;c.save();c.translate(x,y);c.scale(.6,.6);c.globalAlpha=(root.done['separate-'+i]?.8:.35)*(1-progress);for(const path of G.HONRO_FAREWELL_SPIRITS?.farewell||[]){c.fillStyle=path.fill;c.fill(new Path2D(path.d));}c.restore();if(root.done['separate-'+i]){c.fillStyle='#a89b76';c.fillRect(p.x-38,p.y-12,30,12);}}
 }
 for(const q of b.honroV4MaterialEvidence||[]){c.save();c.translate(q.x+45,q.y);c.fillStyle='#8c7958';c.fillRect(-27,-29,54,29);c.strokeStyle='#b9a780';c.lineWidth=3;c.strokeRect(-25,-28,50,27);c.beginPath();c.moveTo(-14,-27);c.lineTo(5,-55);c.lineTo(18,-24);c.stroke();c.restore();}
 if(n===22&&b.honroV4RecordBundle){const q=b.honroV4RecordBundle;c.fillStyle='#c1b493';for(let i=0;i<3;i++)c.fillRect(q.x-36+i*26,q.y-44+i*5,22,33);}
 if(n===26||n===28){const p=n===26?b.honroV4Smoke:{x:5270,y:2080};if(p){c.save();c.fillStyle='#20292755';for(let i=0;i<4;i++){c.beginPath();c.ellipse(p.x+Math.sin(time*.35+i)*25,p.y-i*45-(time*10%35),32+i*8,55,0,0,Math.PI*2);c.fill();}c.restore();}}
}
const plugin={author,prepare,use,stepSatisfied,tick,failure,complete,draw};for(const id of [19,20,21,22,23,24,25,26,27,28])V.register(id,plugin);
G.HonroAct23V4Act3=plugin;
})(globalThis);
