(function(G){'use strict';
const F=G.HonroAct3V4ReviewedCore,V=G.HonroAct23V4,C=G.HONRO_CORE,copy=F.copy,cls=F.classes,hero=(b,c)=>V.heroes(b).find(u=>u.cls===c),root=b=>V.mem(b),mark=V.marker;let R;
const mem=b=>R.memory(b),spec=b=>b.honroReviewed24Spec,ground=(b,u)=>V.alive(u)&&C.validTerrainContactPose(b.terrain,u),distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*.75);
const wagonKnown=p=>p.honroAct23V4History?.stages?.[23]?.reviewedNarrative?.proof?.goods?.familyCrest==='family-three-petals';
const porterSafe=p=>!!p.honroAct23V4History?.stages?.[23]?.reviewedNarrative?.proof?.safe;
const talked=(p,c)=>!!p.honroJourney?.talked?.['rest-talk-v1-24-'+c+'-reviewed1'];
const received=(b,id)=>Object.values(mem(b).events).some(e=>G.HonroAct23V4Reviewed.receiptIds(e).includes(id));
const heard=(p,c,b)=>talked(p,c)||!!b&&received(b,'EDGE.OPTIONAL_24_'+c.toUpperCase()+'_0');
function crestVisible(app){const b=app.engine?.b,s=app.scene,p=b&&mark(b,'family-crest'),view=s?.honroReviewed24CrestDraw,size=s?.size?.();if(!R.active(b)||!p||s?.battle!==b||view?.run!==b.session||view.x!==p.x+38||view.y!==p.y-82||!size||s.scale<.4)return false;
 const x=(view.x-s.x)*s.scale+size.w/2,y=(view.y-s.y)*s.scale+size.h/2;return x>35&&x<size.w-35&&y>35&&y<size.h-120;
}
function fieldWindow(b){const q=mem(b);return !q.events.intro&&!q.events.crest&&!q.events.split&&!root(b).done['family-crest']&&!q.proof.familyCrest&&!q.proof.departure;}
function fieldView(app,meta){const b=app.engine.b,q=mem(b),key=meta?.reviewedEvent,v=q.fieldViews?.[key],p=mark(b,'family-crest');return crestVisible(app)||!!(key?.startsWith('field-talk.')&&q.events[key]?.status==='open'&&v?.run===b.session&&p&&v.x===p.x+38&&v.y===p.y-82);}
function fieldOptional(app,r,meta){const b=app.engine.b,c=cls[r.speaker],u=hero(b,c),p=mark(b,'family-crest');if(b.side!==0||b.phase!=='aim'||r.id==='EDGE.OPTIONAL_24_OCCULTIST_0'||!fieldWindow(b)||!fieldView(app,meta)||!ground(b,u)||!app.engine.grounded(u)||distance(u,p)>650)return false;
 if((r.id==='EDGE.OPTIONAL_24_ARCHER_0'||r.id.startsWith('EDGE.OPTIONAL_24_KNIGHT_'))&&(!ground(b,hero(b,'knight'))||!app.engine.grounded(hero(b,'knight'))||distance(hero(b,'knight'),p)>650))return false;
 const target={x:p.x+38,y:p.y-82},eye={x:u.x,y:u.y-u.h*.7};if(b.terrain.some(t=>!t.broken&&!t.oneWay&&C.segmentTerrain(eye,target,t,0)?.t<.97))return false;
 if(r.id==='EDGE.OPTIONAL_24_ARCHER_0')return porterSafe(app.profile)&&!heard(app.profile,'knight',b);if(r.id==='EDGE.OPTIONAL_24_MAGE_0')return wagonKnown(app.profile);return true;
}
function nearCrest(b){return ground(b,hero(b,'knight'))&&V.near(hero(b,'knight'),mark(b,'family-crest'),180);}
function routesVisible(b){const p=spec(b).gather;return V.heroes(b).some(u=>ground(b,u)&&distance(u,p)<360)&&!!mem(b).proof.routes;}
function voiceHeard(b){const u=b.honroReviewed24Voice;return ground(b,u)&&V.heroes(b).some(h=>distance(h,u)<=650);}
function routeSafe(b){return root(b).done['shrine-seal']&&['split-route-a','split-route-b'].every(id=>!b.units.some(u=>V.alive(u)&&u.side===1&&!u.honroObjectiveTarget&&V.near(u,mark(b,id),500)));}
function gathered(b){return ['archer','mage','knight','occultist'].every(c=>ground(b,hero(b,c))&&V.near(hero(b,c),spec(b).gather,300));}
function finalArrivals(b){const q=mem(b);return ['archer','mage','knight','occultist'].every(c=>{const p=mark(b,['archer','mage'].includes(c)?'split-route-a':'split-route-b'),u=hero(b,c);return ground(b,u)&&V.near(u,p,115)&&(q.departWalk?.[c]?.distance||0)>=30;});}
function observe(app,dt){const b=app.engine.b,q=mem(b),s=spec(b),a=mark(b,'split-route-a'),z=mark(b,'split-route-b');
 if(root(b).done['family-crest']&&nearCrest(b))q.proof.familyCrest={emblem:'family-three-petals',actor:hero(b,'knight').id,source:'family-crest'};
 if(V.heroes(b).some(u=>ground(b,u)&&distance(u,s.gather)<360))q.proof.routes={water:{id:a.id,x:a.x,y:a.y},ground:{id:z.id,x:z.x,y:z.y}};
 if(V.heroes(b).some(u=>distance(u,a)<650)){q.souls??={first:0,second:0};q.souls.first=Math.min(100,q.souls.first+Math.max(0,Math.min(dt,.05))*100);if(F.closed(q.events.entry)&&!F.closed(q.events.split))q.souls.second=Math.min(100,q.souls.second+Math.max(0,Math.min(dt,.05))*100);}
 if(q.departStart){q.departWalk??={};for(const c of ['archer','mage','knight','occultist']){const u=hero(b,c);if(!u)continue;const p=q.departWalk[c]??={x:q.departStart[c].x,y:q.departStart[c].y,distance:0},d=Math.hypot(u.x-p.x,u.y-p.y);if(d>0&&d<=(u.walkSpeed||200)*Math.max(.001,Math.min(dt,.05))*1.7+3&&ground(b,u))p.distance+=d;p.x=u.x;p.y=u.y;}
  if(finalArrivals(b)&&!q.proof.departure)q.proof.departure={teams:{water:['archer','mage'].map(c=>({id:hero(b,c).id,cls:c,x:hero(b,c).x,y:hero(b,c).y,distance:q.departWalk[c].distance})),ground:['knight','occultist'].map(c=>({id:hero(b,c).id,cls:c,x:hero(b,c).x,y:hero(b,c).y,distance:q.departWalk[c].distance}))},resourceContinuity:true};
 }
}
const ids=(part,n)=>Array.from({length:n},(_,i)=>'A3.S24.'+part+'.0'+(i+1));
R=F.register({stage:24,
 author(map){const floor=map.terrains.find(t=>t.id==='a3-foundation'),x=6150;let y;for(let i=0;i<floor.points.length-1;i++){const a=floor.points[i],z=floor.points[i+1];if(z.x>a.x&&x>=a.x&&x<=z.x)y=a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x);}
  map.initialState.honroReviewed24Spec={familyCrest:'family-three-petals',gather:{x,y},voice:{x:6720,y:2440}};
  // Stationary noncombat scene cast inside the workshop, separate from the
  // battlefield roster. It has a real supported pose/life and saved identity;
  // no target, XP budget, rescue quest or invented remote sense is added.
  map.initialState.honroReviewed24Voice={id:'v4.workshop-voice',name:'주민',cls:'knight',honroType:'civilian',honroCivilian:true,side:2,x:6720,y:2440,r:22,h:92,hp:620,maxHp:620,fixed:true,vx:0,vy:0};
 },
 prepare(b,p){delete p.honroReviewed24RestObservation;},
 observe,
 speaker(app,r){return r.speaker==='주민'&&voiceHeard(app.engine.b);},
 facts(app,r){const b=app.engine.b,q=mem(b);if(r.id==='A3.S24.INTRO.01')return wagonKnown(app.profile)&&!heard(app.profile,'mage',b);if(r.id==='A3.S24.INTRO.02')return !heard(app.profile,'knight',b);if(r.id==='A3.S24.ENTRY.03')return voiceHeard(b);return true;},
 optional(p,r){return r.id==='EDGE.OPTIONAL_24_OCCULTIST_0'&&!talked(p,'occultist')&&porterSafe(p);},
 fieldOptional,fieldStart(app,key){if(!crestVisible(app))return false;const b=app.engine.b;mem(b).fieldViews??={};mem(b).fieldViews[key]={...copy(app.scene.honroReviewed24CrestDraw),source:'actual-stage-render'};return true;},fieldChoice(app,c){return c!=='occultist'&&!heard(app.profile,c,app.engine.b);},
 events:[
  {key:'arrival',ids:['EDGE.ARRIVALS_24_0'],when:app=>nearCrest(app.engine.b)&&wagonKnown(app.profile)},
  {key:'intro',ids:['A3.S24.INTRO.01','A3.S24.INTRO.02'],when:app=>nearCrest(app.engine.b)},
  {key:'crest',ids:ids('CREST',2),when:app=>!!root(app.engine.b).done['family-crest']},
  {key:'entry',ids:ids('ENTRY',3),when:app=>routesVisible(app.engine.b)},
  {key:'heard',ids:['A3.S24.INTRO.03'],when:app=>{const q=mem(app.engine.b);return F.closed(q.events.entry)&&q.events.entry.ids.includes('A3.S24.ENTRY.03')&&voiceHeard(app.engine.b)&&(q.souls?.first||0)>=30;}},
  {key:'approach',ids:ids('APPROACH_DANGER',1),when:app=>(mem(app.engine.b).souls?.second||0)>=30&&!F.closed(mem(app.engine.b).events.split)},
  {key:'split',ids:ids('SPLIT',5),when:app=>{const b=app.engine.b;return routeSafe(b)&&gathered(b)&&F.closed(mem(b).events.entry)&&F.closed(mem(b).events.heard);}},
  {key:'depart',ids:ids('DEPART',2),when:app=>['archer','mage','knight','occultist'].every(c=>(mem(app.engine.b).departWalk?.[c]?.distance||0)>=30)},
  {key:'guide',ids:['A3.S24.GUIDE.01'],when:app=>!!mem(app.engine.b).proof.departure}
 ],
 finished(app,key,event){const b=app.engine.b,q=mem(b);if(key==='split'){q.departStart=Object.fromEntries(V.heroes(b).map(u=>[u.cls,{id:u.id,x:u.x,y:u.y}]));q.proof.splitDecision={actors:V.heroes(b).map(u=>u.id),safe:routeSafe(b)};}},
 journals:[{id:'EDGE.RUNTIME.JOURNAL.EVIDENCE24.PLAN',when:app=>!!mem(app.engine.b).proof.routes},{id:'A3.S24.JOURNAL.01',when:app=>!!mem(app.engine.b).proof.departure&&F.closed(mem(app.engine.b).events.depart)}],
 complete:b=>!!mem(b).proof.departure&&F.closed(mem(b).events.depart)&&F.closed(mem(b).events.guide)&&!!mem(b).journals['A3.S24.JOURNAL.01'],
 failure:b=>!V.alive(b.honroReviewed24Voice)?'v4.24.workshop-voice-lost':['archer','mage','knight','occultist'].some(c=>!hero(b,c))?'v4.24.required-party':null,
 objective:b=>'A3.S24.OBJ.0'+(F.closed(mem(b).events.split)?2:1),
 camera(app,key){const b=app.engine.b;return{id:'v4.24.'+key,intent:'situation',targets:key.startsWith('field-talk.')?[{marker:'family-crest'},...V.heroes(b).filter(u=>distance(u,mark(b,'family-crest'))<650).map(u=>({actor:u.id}))]:['arrival','intro','crest'].includes(key)?[{marker:'family-crest'}]:[{marker:'split-route-a'},{marker:'split-route-b'},spec(b).voice],padding:110,maxScale:.75};},
 draw(scene,c,b){const q=mem(b);scene.honroReviewed24CrestDraw=null;for(const p of[mark(b,'family-crest'),mark(b,'shrine-seal')].filter(Boolean)){c.save();c.translate(p.x+38,p.y-82);c.fillStyle='#4e513c';c.fillRect(-25,-28,50,55);c.strokeStyle='#bdb18a';c.lineWidth=3;for(let i=0;i<3;i++){c.beginPath();c.ellipse(Math.cos(i*2.094)*7,Math.sin(i*2.094)*7,7,11,i*2.094,0,Math.PI*2);c.stroke();}c.restore();if(p.id==='family-crest')scene.honroReviewed24CrestDraw={run:b.session,x:p.x+38,y:p.y-82};}
 const a=mark(b,'split-route-a');if(q.souls){c.save();c.strokeStyle='#b5cfc1';c.lineWidth=2;for(const [i,d]of[q.souls.first,q.souls.second].entries()){if(d<=0)continue;c.globalAlpha=.4;c.beginPath();c.ellipse(a.x+d*1.4-i*30,a.y-40-d*.7,12,28,-.2,0,Math.PI*2);c.stroke();}c.restore();}
 const v=b.honroReviewed24Voice;c.save();c.fillStyle='#4c5546';c.fillRect(v.x-44,v.y-136,88,136);c.strokeStyle='#ad9b74';c.lineWidth=5;c.strokeRect(v.x-44,v.y-136,88,136);if(V.alive(v))scene.unitBody(c,v,0);c.fillStyle='#56604d';c.fillRect(v.x-38,v.y-76,76,76);c.strokeStyle='#ad9b74';c.lineWidth=4;c.strokeRect(v.x-38,v.y-76,76,76);c.beginPath();c.moveTo(v.x,v.y-76);c.lineTo(v.x,v.y);c.moveTo(v.x-35,v.y-72);c.lineTo(v.x+35,v.y-5);c.stroke();c.lineWidth=3;for(const x of[-26,-10,10,26]){c.beginPath();c.moveTo(v.x+x,v.y-121);c.lineTo(v.x+x,v.y-80);c.stroke();}c.strokeStyle='#817456';c.lineWidth=7;c.beginPath();c.moveTo(v.x-32,v.y-118);c.lineTo(v.x-32,v.y);c.moveTo(v.x+32,v.y-118);c.lineTo(v.x+32,v.y);c.stroke();c.restore();
 }
});
G.HonroAct23V4Chapter24Reviewed=R;G.HonroAct23V4Chapter24Facts={crestVisible,fieldWindow,fieldOptional,received,nearCrest,routesVisible,voiceHeard,routeSafe,gathered,finalArrivals,wagonKnown,porterSafe,spec};
})(globalThis);
