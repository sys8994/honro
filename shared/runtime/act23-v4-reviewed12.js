(function(G){'use strict';
const P=G.HonroAct23V4ReviewedChapters,V=P.V,C=P.C,S=G.HonroAct23V4Act2Scenes,base=V.plugins.get(12),clone=x=>JSON.parse(JSON.stringify(x));
const mem=P.memory,unit=(b,id)=>b.units.find(u=>u.id===id),id=s=>'A2.S12.'+s,at=(b,r=500)=>V.heroes(b).some(u=>V.near(u,b.honroV4Recurrence.landmark,r));
function local(b,r=340){return b.units.filter(u=>V.alive(u)&&u.side===1&&!u.honroObjectiveTarget&&V.near(u,b.honroV4Recurrence.landmark,r));}
function allow(app,row){const b=app.engine.b,m=mem(b),s=S.memory(b),r=row.id;if(r.startsWith('EDGE.ARRIVALS_'))return true;if(r===id('INTRO.01'))return !!s.loop?.first;
 if(['MID.01','MID.02','MID.03'].some(x=>r===id(x)))return !!s.proof['12.recurrence'];
 if(['MID.04','MID.05'].some(x=>r===id(x)))return m.wave?.admitted&&m.wave.distance>=40&&m.wave.ids.some(x=>V.alive(unit(b,x)));
 if(r===id('MID.06'))return !!m.wave?.approaching;
 if(r===id('MID.07'))return !!m.sightline;
 if(r===id('MID.08'))return !!s.proof.sign;
 if(['CHOICE.01','CHOICE.02'].some(x=>r===id(x)))return !!s.proof.sign&&P.done(b,'adjusted');
 if(r===id('BRANCH.01'))return b.honroRouteChoice?.selectedRoute==='A';if(r===id('BRANCH.02'))return b.honroRouteChoice?.selectedRoute==='B';
 if(r===id('POPUP.01'))return !!m.adjust?.blocked;
 if(r===id('COMPLETE.01'))return !!b.honroRouteChoice?.selectedRoute&&m.descent?.distance>=40;
 if(r===id('COMPLETE.02'))return !!b.honroRouteChoice?.selectedRoute&&!!s.proof.sign;
 if(r===id('COMPLETE.03'))return !!b.honroRouteChoice?.selectedRoute&&V.heroes(b).some(u=>V.near(u,V.marker(b,b.honroRouteChoice.exitId),180));return false;
}
function author(map){const p=map.initialState.honroV4Recurrence.landmark,x=p.x-180,t=map.terrains.find(t=>t.id==='sq-lower-ground'),y=C.topAt(G.HonroGeometry.terrain(t,map.height),x);map.elements.push({id:'v4.12.recurring-pine',assetId:'act1-scene:rooted-pine',x,y,scale:.8,rotation:0,depthLayer:'L1',layer:'back',snap:false});map.initialState.honroV4Reviewed12={gap:{x:p.x+95,y:p.y-30},entries:[{x:p.x+620,y:p.y-140},{x:p.x-620,y:p.y-140}]};}
function wave(app,dt){const e=app.engine,b=e.b,m=mem(b),w=m.wave??={ids:[],offered:{},ended:{},distance:0};if(!P.done(b,'repeat'))return;w.warned=true;const active=e.active;if(active?.side===0&&!active.summoned&&!active.acted)w.offered[active.id]=true;
 if(!w.admitted&&Object.values(w.ended).some(Boolean)){for(const p of b.honroV4Reviewed12.entries){if(V.heroes(b).some(u=>Math.hypot(u.x-p.x,u.y-p.y)<340))continue;if(b.units.filter(u=>u.side===1&&V.alive(u)).length+2>G.HonroEncounters.populationCap(b))break;const before=new Set(b.units.map(u=>u.id));if(G.HonroAllies.execute(app,{type:'spawn',kind:'ghost',n:2,x:p.x,y:p.y,spacing:145,maxDistance:220,source:'reviewed.12.gap'})===false)continue;w.ids=b.units.filter(u=>!before.has(u.id)).map(u=>u.id);if(w.ids.length===2){w.admitted=true;w.entry=clone(p);w.start=Object.fromEntries(w.ids.map(id=>[id,{x:unit(b,id).x,y:unit(b,id).y}]));e.emit('save');break;}}}
 if(w.admitted&&!P.done(b,'leak'))for(const q of w.ids){const u=unit(b,q);if(!V.alive(u))continue;const before={x:u.x,y:u.y},to=b.honroV4Recurrence.landmark;u.moveLeft=Math.max(u.moveLeft,10);e.walk(u,Math.sign(to.x-u.x),Math.min(.05,Math.max(0,dt)),true);const d=Math.hypot(u.x-before.x,u.y-before.y);w.distance+=d;if(d>0)w.approaching=true;}
}
function drive(app,A,dt){const e=app.engine,b=e.b,m=mem(b),s=S.memory(b);if(!m.events.arrival){A.begin(app,'arrival',['EDGE.ARRIVALS_12_0']);return;}
 if(s.loop?.first&&!m.events.first){A.begin(app,'first',[id('INTRO.01')],s.loop.first);return;}
 if(s.proof['12.recurrence']&&!m.events.repeat){A.begin(app,'repeat',['MID.01','MID.02','MID.03'].map(id),s.proof['12.recurrence']);return;}
 wave(app,dt);if(m.wave?.admitted&&m.wave.distance>=40&&!m.events.leak){A.begin(app,'leak',['MID.04','MID.05'].map(id),m.wave);return;}
 if(P.done(b,'leak')&&!m.events.defend){A.begin(app,'defend',[id('MID.06')],m.wave);return;}
 if(P.done(b,'leak')&&!m.events.sightline){const archer=A.actor(b,'설오'),target=m.wave.ids.map(x=>unit(b,x)).find(V.alive);if(archer&&target&&!e.projectileCollision({x:archer.x,y:archer.y-archer.h*.63},{x:target.x,y:target.y-target.h*.55},1,archer.id,[],false)){m.sightline={archer:archer.id,target:target.id};A.begin(app,'sightline',[id('MID.07')],m.sightline);return;}}
 const q=m.adjust;if(q&&!q.done){const mage=unit(b,q.actor),ready=V.alive(mage)&&mage.cls==='mage'&&V.near(mage,V.marker(b,'sign'),180)&&C.validTerrainContactPose(b.terrain,mage);q.blocked=!!local(b).length;if(q.blocked&&!m.events.blocked){A.begin(app,'blocked',[id('POPUP.01')]);return;}if(ready&&!q.blocked&&e.active?.id===mage.id){q.elapsed+=Math.min(.05,Math.max(0,dt));mage.honroScenePose={kind:'kneel',time:q.elapsed};if(q.elapsed>=.8){delete mage.honroScenePose;if(base.use(app,V.marker(b,'sign'),V.steps(b).find(s=>s.id==='sign'))){q.done=true;app.dirty=true;}}}}
 if(s.proof.sign&&!m.events.adjusted){A.begin(app,'adjusted',[id('MID.08')],s.proof.sign);return;}
 if(P.done(b,'adjusted')&&!m.events.choices){A.begin(app,'choices',['CHOICE.01','CHOICE.02'].map(id));return;}
 const route=b.honroRouteChoice?.selectedRoute;if(route)m.route12=route==='A'?'upper':'lower';if(route&&!m.events.branch){A.begin(app,'branch',[id(route==='A'?'BRANCH.01':'BRANCH.02')],b.honroRouteChoice);return;}
 if(route&&P.done(b,'branch')){m.descent??={distance:0,elapsed:0};m.descent.elapsed+=Math.min(.05,Math.max(dt,0));m.descent.distance=m.descent.elapsed*150;if(m.descent.distance>=40&&!m.events.exit){A.begin(app,'exit',['COMPLETE.01','COMPLETE.02','COMPLETE.03'].map(id),{route,descent:clone(m.descent)});return;}if(P.done(b,'exit')&&!m.journal)A.journal(app,id('JOURNAL.01'));}
}
const bound=new WeakSet();function attach(app,e){if(bound.has(e))return;bound.add(e);const old=e.finishAction;e.finishAction=function(...args){const b=e.b,w=mem(b).wave,u=e.active,before=u?.acted,serial=b.honroState.actorTurnSerial||0,out=old.apply(e,args);if(w?.warned&&!w.admitted&&w.offered[u?.id]&&!before&&(u.acted||(b.honroState.actorTurnSerial||0)>serial)){w.ended[u.id]=true;e.emit('save');}return out;};}
function eligibility(app,m,s){
 if(s.id!=='sign')return;
 const b=app.engine.b,w=mem(b).wave,mage=app.engine.active;
 if(!S.memory(b).proof['12.recurrence'])return{ok:false,reason:'같은 동행으로 지나온 길표까지 갔다가 진목으로 돌아오기'};
 if(!P.done(b,'repeat'))return{ok:false,reason:'진목을 다시 발견한 대화 마치기'};
 if(!w?.admitted)return{ok:false,reason:'진목 주변에서 동행의 행동을 마치면 혼령이 나타납니다'};
 if(!P.done(b,'leak'))return{ok:false,reason:'진목에서 나타난 혼령 확인하기'};
 const remaining=w.ids.filter(id=>V.alive(unit(b,id))).length;
 if(remaining)return{ok:false,reason:`진목에서 나온 혼령 ${remaining}기 제압`};
 if(mage.cls!=='mage')return{ok:false,reason:'담허를 선택해 돌림진 조정'};
 if(!V.near(mage,m,180))return{ok:false,reason:'담허를 진목 바로 곁으로 이동'};
 if(!C.validTerrainContactPose(b.terrain,mage))return{ok:false,reason:'담허를 진목과 같은 층의 땅에 세우기'};
 const threats=local(b).length;
 if(threats)return{ok:false,reason:`진목 가까이 남은 위협 ${threats}기 제압`};
 const adjustment=mem(b).adjust;
 if(adjustment&&!adjustment.done)return{ok:false,reason:'돌림진 조정 중 · 담허를 진목 곁에 잠시 유지'};
 return{ok:true,reason:'돌림진 조정'};
}
function use(app,m,s){if(s.id!=='sign')return;if(!eligibility(app,m,s).ok)return false;const b=app.engine.b,q=mem(b).adjust??={actor:app.engine.active.id,elapsed:0};q.requested=true;app.dirty=true;return true;}
function draw(scene,c,b){const m=mem(b),p=b.honroV4Reviewed12.gap;c.save();if(m.wave?.warned&&!m.wave.admitted){c.globalAlpha=.55;c.strokeStyle='#c8b98d';c.lineWidth=3;c.beginPath();c.ellipse(p.x,p.y-70,60,22,0,0,Math.PI*2);c.stroke();}if(m.descent){const p=V.marker(b,b.honroRouteChoice.exitId);c.strokeStyle='#bbd0c6';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.ellipse(p.x-90+i*45,p.y-150+m.descent.distance,12,25,-.25,0,Math.PI*2);c.stroke();}}c.restore();}
// This is action guidance, separate from the reviewed spoken manuscript.
function loopGuidance(b,result){const s=S.memory(b),q=s.loop;if(!q?.actor||s.proof['12.recurrence'])return result;const actor=unit(b,q.actor),back=q.phase==='return',p=back?b.honroV4Recurrence.landmark:b.honroV4Recurrence.checkpoint,text=(actor?.name||'처음 진목에 닿은 동행')+' 선택 → '+(back?'진목으로 돌아오기':'지나온 길표까지 되돌아가기')+' · 같은 동행으로 왕복';return{...result,currentInstruction:text,checklist:result.checklist.map(x=>({...x,text})),visibleChecklist:result.visibleChecklist.map(x=>({...x,text})),targets:[{...p,id:'12.recurrence',kind:'move',label:text}]};}
P.register(12,{mapRevision:512,camera(app,key){const b=app.engine.b,p=['branch','exit'].includes(key)&&b.honroRouteChoice?.exitId?V.marker(b,b.honroRouteChoice.exitId):b.honroV4Recurrence.landmark;return{id:'reviewed12.'+key,intent:'situation',targets:[{x:p.x,y:p.y-100}],padding:180,maxScale:.55};},allow,author,drive,attach,eligibility,use,draw,routeReady:b=>P.done(b,'choices'),objective:b=>id(S.memory(b).proof.sign?'OBJECTIVE.03':S.memory(b).proof['12.recurrence']?'OBJECTIVE.02':'OBJECTIVE.01'),complete:b=>P.done(b,'exit')&&!!mem(b).journal&&mem(b).wave?.ids.every(id=>!V.alive(unit(b,id))),present(b,result,A){if(!S.memory(b).proof.sign)return loopGuidance(b,result);return{...result,targets:b.honroRouteSpec.routes.map(r=>({...V.marker(b,r.markerId),kind:'exit',rowId:id(r.id==='A'?'UI_CHOICE.01':'UI_CHOICE.02'),label:A.row(id(r.id==='A'?'UI_CHOICE.01':'UI_CHOICE.02')).text}))};}});
})(globalThis);
