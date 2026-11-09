(function(G){'use strict';
// Physical evidence for the reviewed chapter11 rows, on the existing ravine.
const V=G.HonroAct23V4,C=G.HONRO_CORE,clone=x=>JSON.parse(JSON.stringify(x)),unit=(b,id)=>b.units.find(u=>u.id===id);
const enabled=()=>G.HonroAct23V4Reviewed?.enabled()===true;
const active=b=>enabled()&&V.active(b)&&b.honroStage===11&&b.honroV4Chapter11?.revision===1;
const memory=b=>V.mem(b).chapter11??={version:1,incoming:{count:3,elapsed:0,distance:0},release:{ids:[],distance:0},north:{ids:[],offered:{},ended:{}}};
const alive=V.alive;
function author(map,p){base.author(map,p);if(!enabled())return;const host=map.units.find(u=>u.id==='rv11-entry-root-pack-0'),support=map.terrains.find(t=>t.id==='rv-west-shoulder'),top=x=>{for(let i=0;i<support.points.length-1;i++){const a=support.points[i],z=support.points[i+1];if(z.x>a.x&&x>=a.x&&x<=z.x)return a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x);}throw Error('11.reviewed.support');};
 const id='v4.11.bier',left=1400,right=1600,height=116;
 map.terrains.push({id,name:id,type:'solid',baseMaterial:'wood',breakable:false,layer:'terrain',points:[{x:left,y:top(left)-height},{x:right,y:top(right)-height},{x:right,y:top(right)},{x:left,y:top(left)}],properties:{honroV4Bier:true,honroCave:false}});
 // One connected, rooted outcrop. The four short ledges stay within every
 // companion's ordinary jump, instead of four isolated rectangular columns.
 map.terrains.push({id:'v4.11.firing-rock',name:'v4.11.firing-rock',type:'solid',baseMaterial:'rock',breakable:false,layer:'terrain',points:[[700,6500],[738,6438],[760,6400],[875,6400],[880,6322],[898,6300],[995,6300],[1000,6224],[1022,6200],[1115,6200],[1120,6130],[1145,6100],[1235,6100],[1260,6240],[1242,6500]].map(([x,y])=>({x,y})),properties:{honroV4FiringRock:true}});
 map.initialState.honroV4Chapter11={revision:1,bier:{id,x:1500,y:top(1500),left,right,slope:(top(right)-top(left))/(right-left)},host:host.id,other:'rv11-entry-root-pack-2',high:{x:1180,y:6100,support:'v4.11.firing-rock'},entries:[2700,2940,3180].map(x=>({x,y:top(x),support:'rv-west-shoulder'}))};
 const steps=map.initialState.honroV4Steps,entry={id:'11.entry-threat',label:'11.entry-threat',kind:'clear',defeatIds:[host.id,'rv11-entry-root-pack-2']};steps.splice(1,0,entry);map.markers.push({id:entry.id,label:entry.id,type:'act2',action:'act2',x:1710,y:top(1710)});
}
function prepare(b,p){base.prepare(b,p);if(active(b)){const m=memory(b),spec=b.honroV4Chapter11;m.hostAlive??=alive(unit(b,spec.host));}}
function facts(b,id){if(!active(b))return false;const m=memory(b),s=b.honroV4Chapter11,t=b.terrain.find(t=>t.id===s.bier.id),real=!!t&&!t.broken&&t.honroV4Bier;
 if(id==='EDGE.ARRIVALS_11_0')return real;
 if(id==='A2.S11.MID.01')return real&&!!m.rise&&alive(unit(b,s.host));
 if(id==='A2.S11.MID.02')return real&&!!m.rise&&!!b.terrain.find(t=>t.id===s.high.support&&!t.broken);
 if(id==='A2.S11.MID.03')return !!m.release.attached&&m.release.distance>=40&&alive(unit(b,m.release.attached))&&m.release.ids.some(id=>alive(unit(b,id)));
 if(id==='A2.S11.MID.04')return !!m.north.warned&&!m.north.admitted;
 if(id==='A2.S11.MID.05')return m.north.admitted===true&&m.north.ids.length===2&&m.north.ids.every(id=>alive(unit(b,id)));
 if(id==='A2.S11.WARN.01')return real&&!!m.blockedShot;
 if(id==='A2.S11.POPUP.01')return real&&!!m.rise&&V.heroes(b).some(u=>V.near(u,s.bier,700));return false;
}
function safeSpawn(app,source,n,at,minimum=340){const b=app.engine.b;if(b.units.filter(u=>u.side===1&&alive(u)).length+n>G.HonroEncounters.populationCap(b))return null;if(V.heroes(b).some(u=>Math.hypot(u.x-at.x,(u.y-at.y)*.75)<minimum))return null;const before=new Set(b.units.map(u=>u.id));if(G.HonroAllies.execute(app,{type:'spawn',kind:'ghost',n,x:at.x,y:at.y,support:at.support,spacing:145,maxDistance:220,source})===false)return null;const ids=b.units.filter(u=>!before.has(u.id)).map(u=>u.id);return ids.length===n?ids:null;}
function tick(app,dt){const e=app.engine,b=e.b;if(!active(b)||!V.safe(app))return;const spec=b.honroV4Chapter11,m=memory(b),host=unit(b,spec.host),r=m.release,w=m.north;
 if(['done','skipped'].includes(G.HonroAct23V4Reviewed.memory(b).events.thread?.status)){m.incoming.elapsed=Math.min(2,m.incoming.elapsed+Math.max(0,Math.min(dt,.05)));m.incoming.distance=Math.min(400,m.incoming.elapsed*400);}
 if(!m.rise&&alive(host)&&V.heroes(b).some(u=>V.near(u,spec.bier,700))){m.rise={id:host.id,point:{x:host.x,y:host.y}};host.awake=true;e.impulse(host,0,-48);e.fx('ring',host.x,host.y-host.h*.6,'#b6c8bf',40);}
 if(m.hostAlive&&!alive(host)&&!r.admitted){const x=Math.max(30,Math.min(b.width-30,host.x)),surface=e.surface(x,host.y-8,b.height+120);if(!surface)return;const at={x,y:surface.y,support:surface.t.id},ids=safeSpawn(app,'reviewed.11.beast-spirit',1,at,0);if(ids){r.ids=ids;r.admitted=true;r.support={id:surface.t.id,x,y:surface.y,corpse:{x:host.x,y:host.y}};r.from={x:host.x,y:host.y-host.h*.6};r.start={x:unit(b,ids[0]).x,y:unit(b,ids[0]).y};e.fx('ring',r.from.x,r.from.y,'#b6c8bf',45);}}
 if(r.admitted&&!r.attached){const ghost=unit(b,r.ids[0]),target=unit(b,spec.other);if(alive(ghost)&&alive(target)){const before={x:ghost.x,y:ghost.y};ghost.fixed=false;ghost.moveLeft=Math.max(ghost.moveLeft,0);e.walk(ghost,Math.sign(target.x-ghost.x),Math.min(Math.max(dt,0),.05),true);r.distance+=Math.hypot(ghost.x-before.x,ghost.y-before.y);if(r.distance>=40&&V.near(ghost,target,180)){r.attached=target.id;target.honroPossessedBy=ghost.id;}}}
 const reviewed=G.HonroAct23V4Reviewed.memory(b),warning=reviewed.events['north-warning'];
 const releaseSeen=['done','skipped'].includes(reviewed.events['spirit-release']?.status)||r.admitted&&(!alive(unit(b,spec.other))||r.ids.every(id=>!alive(unit(b,id))));
 if(!w.warned&&releaseSeen&&V.heroes(b).some(u=>u.x>2200||V.near(u,spec.high,100))){w.warned=true;w.serial=b.honroState.actorTurnSerial||0;for(const p of spec.entries.slice(0,1))e.fx('ring',p.x,p.y-60,'#c9b18a',70);}
 if(w.warned&&!w.admitted&&['done','skipped'].includes(warning?.status)){
  const h=e.active;if(b.side===0&&b.phase==='aim'&&e.canAct()&&V.heroes(b).includes(h))w.offered[h.id]=true;
  if(Object.keys(w.ended).some(id=>w.ended[id]))for(const at of spec.entries){const ids=safeSpawn(app,'reviewed.11.north-pair',2,at);if(!ids)continue;w.ids=ids;w.admitted=true;w.entry=clone(at);e.emit('save');break;}}
}
function attach(app,e){base.attach(app,e);if(!active(e.b)||e.honroReviewed11Scenes)return;e.honroReviewed11Scenes=true;
 const impact=e.impact.bind(e);e.impact=function(p,hit,...args){const b=e.b,m=memory(b),owner=unit(b,p.owner);if(owner?.cls==='archer'&&p.skill==='A01'&&!m.firstShot){m.firstShot={terrain:hit.terrain?.id,owner:p.owner};if(hit.terrain?.id===b.honroV4Chapter11.bier.id)m.blockedShot=clone(m.firstShot);}return impact(p,hit,...args);};
 const finish=e.finishAction.bind(e);e.finishAction=function(...args){const b=e.b,u=e.active,w=memory(b).north,before=u?.acted,serial=b.honroState.actorTurnSerial||0,out=finish(...args);if(w.warned&&!w.admitted&&u?.side===0&&!u.summoned&&!u.enthrall&&!before&&(u.acted||(b.honroState.actorTurnSerial||0)>serial)&&w.offered[u.id]){w.ended[u.id]=true;e.emit('save');}return out;};
}
function complete(b){if(!active(b))return true;const m=memory(b);return m.north.admitted&&m.north.ids.length===2&&m.release.admitted&&[...m.north.ids,...m.release.ids].every(id=>{const u=unit(b,id);return !!u&&!alive(u);});}
function draw(scene,c,b){if(!active(b))return;const s=b.honroV4Chapter11,m=memory(b),p=s.bier,host=unit(b,s.host);c.save();c.translate(p.x,p.y);c.rotate(Math.atan(p.slope));scene.landmark(c,{kind:'bierRest',x:0,y:0,size:1.2});c.strokeStyle='#756347';c.lineWidth=9;c.beginPath();c.moveTo(-142,-22);c.lineTo(145,-22);c.moveTo(-134,-50);c.lineTo(139,-50);c.stroke();c.restore();c.save();c.strokeStyle='#293a35';c.lineWidth=4;for(let i=0;i<6;i++){const x=p.left-190+i*31;c.beginPath();c.moveTo(x,6500);c.lineTo(x+20,6500);c.stroke();}c.restore();
 if(m.incoming.elapsed>0&&m.incoming.elapsed<2){c.save();c.strokeStyle='#b7ccc2';c.globalAlpha=.55;c.lineWidth=2;for(let i=0;i<m.incoming.count;i++){c.beginPath();c.ellipse(1150+i*44-m.incoming.distance,6150+i*20+m.incoming.distance*.55,13,28,.3,0,Math.PI*2);c.stroke();}c.restore();}
 const possessed=m.release.attached?unit(b,m.release.attached):host;if(alive(possessed)&&(!m.release.admitted||alive(unit(b,m.release.ids[0])))){c.save();c.strokeStyle='#bdd0c6';c.globalAlpha=.62;c.lineWidth=3;c.beginPath();c.ellipse(possessed.x,possessed.y-possessed.h*.58,31,42,-.3,0,Math.PI*2);c.stroke();c.restore();}}
const base=V.plugins.get(11);V.register(11,{...base,author,prepare,tick(app,dt){base.tick(app,dt);tick(app,dt);},attach,complete(b){return base.complete(b)&&complete(b);}});
G.HonroAct23V4Chapter11={enabled,active,author,prepare,facts,memory,tick,attach,complete,draw};
})(globalThis);
