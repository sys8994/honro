(function(G){'use strict';
const C=G.HONRO_CORE;
function shortShot(e,u,s,target){
 const seeds=e.shotSeeds(u,s,target).filter(a=>a.angle<45||a.angle>135).sort((a,b)=>b.power-a.power);
 for(const a of seeds){const hit=e.predict(u,s,a.angle,a.power,undefined,false);if(hit.unit===target.id||hit.closest<target.r)return a;}
 return e.bestShot(u,s,target);
}
function setup(app,id,h,canvas){
 const s=C.SKILLS[id],profile=structuredClone(app.profile);profile.heroes[s.cls]=structuredClone(h);profile.heroes[s.cls].ranks={[C.baseSkill(s.cls)]:1,[id]:Math.max(1,h.ranks[id]||0)};profile.loadouts[s.cls]=[id];
 const b=C.createBattle(1,profile,'practice',{party:[s.cls],wind:0}),floor=1000;
 Object.assign(b,{width:2400,height:1400,practiceCombat:true,terrain:[{id:'preview-floor',x:0,y:floor,w:2400,h:400,mat:'rock',hp:99999,maxHp:99999,indestructible:true}],waters:[],drafts:[],fields:[],zones:[],stakes:[],projectiles:[],wind:0,honroStage:1,honroBackdrop:'forest',honroLandmarks:[],honroMarkers:[],honroSurfaceZones:[],routePoints:[],sceneVersion:b.sceneVersion+1});
 const hero=b.units.find(u=>u.side===0);b.units=[hero];Object.assign(hero,{x:360,y:floor,spawnX:360,spawnY:floor,h:130,r:23,hp:900,maxHp:1200,focus:9999,maxFocus:9999,attack:1,acted:false,loadout:[id],ranks:{...profile.heroes[s.cls].ranks},vx:0,vy:0,airborne:false,jumping:false});
 const close=s.branch==='sword',ring=id==='M14',bounce=['M11','M12'].includes(id),positions=close?[460,560]:ring?[660,80]:[840,955,1070];
 if(id==='S05')positions[1]=260;
 if(id==='S10')positions.splice(0,positions.length,830);
 if(id==='O03')positions.splice(0,positions.length,1000,1130,1260);
 if(id==='O16')positions.splice(0,positions.length,760,870);
 if(id==='M10'||id==='M09'||id==='O13'||id==='O14'||id==='O15')positions.splice(0,positions.length,1050);
 for(const [i,x] of positions.entries()){const u=C.makeUnit('knight',1,x,floor,{id:'preview-target-'+i,name:'표적',h:115,r:27,honroType:'beast',honroVariant:'hound',hp:2400,maxHp:2400,armor:0,attack:.5,awake:true,fixed:!['A05','S15','S10','M08'].includes(id),loadout:['LA01'],focus:9999,maxFocus:9999});b.units.push(u);}
 if(id==='M10'||id==='O13'){const ally=C.makeUnit('knight',0,780,floor,{id:'preview-ally',name:'동행',h:130,hp:300,maxHp:1200,focus:20,maxFocus:200,acted:true,loadout:['S00'],ranks:{S00:1}});b.units.push(ally);}
 if(id==='O16')for(const [i,x] of [250,540].entries())b.units.push(C.makeUnit('occultist',0,x,floor-130,{id:'preview-echo-'+i,name:'반향령',summoned:true,summonOwner:hero.id,summonKind:'echo',summonRank:8,summonExpires:8,acted:true,fixed:true,summonFloating:true,h:65,r:20,hp:180,maxHp:180,attack:0,loadout:[],ranks:{...hero.ranks}}));
 if(bounce)b.terrain.push({id:'preview-wall',x:1140,y:620,w:40,h:380,mat:'rock',hp:99999,maxHp:99999,indestructible:true});
 b.active=hero.id;b.side=0;b.phase='aim';b.queue=[];
 const pr={id,b,canvas,hero,age:0,acc:0,fired:false,follow:false,cycle:0,events:[],h:structuredClone(h)};
 pr.scene=new G.HonroScene(canvas);pr.scene.manual=true;pr.scene.skillPreview=true;pr.e=new C.Engine(b,event=>{
  pr.events.push(event);if(pr.events.length>300)pr.events.shift();pr.scene.event(event);
  if(event.name==='skillGeometry'&&pr.bounds){const points=C.geometryPaths(JSON.parse(event.text)).flat();for(const p of points){pr.bounds.left=Math.min(pr.bounds.left,p.x-20);pr.bounds.right=Math.max(pr.bounds.right,p.x+20);pr.bounds.top=Math.min(pr.bounds.top,p.y-20);pr.bounds.bottom=Math.max(pr.bounds.bottom,p.y+20);}}
 },true);pr.e.checkEnd=()=>false;
 const target=b.units[1];let aim={angle:0,power:.55};
 if(close)aim={angle:0,power:.65};
 else if(ring)aim={angle:0,power:(300-180)/720};
 else if(id==='A10'||id==='S14')aim={angle:0,power:.5};
 else if(id==='O03')aim={angle:-30,power:.42};
 else if(id==='O16')aim={angle:20,power:.4};
 else if(id==='A15')aim={angle:62,power:.52};
 else if(id==='M11')aim={angle:30,power:.72};
 else if(id==='M12')aim={angle:-8,power:.62};
 else if(id==='S11'||id==='S12')aim={angle:8,power:.75};
 else if(s.branch==='stake'||['O13','O14','O15'].includes(id)){
  // Aim at the ground, not a body: the same prediction and actual landing create the stake.
  const goal=id==='M09'?780:id==='M10'||['O13','O14','O15'].includes(id)?760:840;
  let best=Infinity;for(const angle of [15,28,42])for(let power=.25;power<=.9;power+=.025){const hit=pr.e.predict(hero,s,angle,power,undefined,false),d=Math.abs(hit.x-goal)+Math.abs(hit.y-floor);if(d<best){best=d;aim={angle,power};}}
 }else aim=shortShot(pr.e,hero,s,target);
 pr.aim=aim;hero.angle=aim.angle;hero.lastPower=aim.power;
 // Fit live actors first; expand only for flight that actually happens (e.g. an apex split).
 pr.bounds={left:Math.min(hero.x-95,...positions.map(x=>x-55)),right:Math.max(hero.x+100,...positions.map(x=>x+65),bounce?1180:0),top:floor-240,bottom:floor+55};
 pr.flightRight=pr.bounds.right+180;
 if(close)pr.bounds.top=floor-235;if(ring){pr.bounds.left=hero.x-365;pr.bounds.right=hero.x+365;pr.bounds.top=floor-385;}
 return pr;
}
function ready(p,id){const u=p.hero,b=p.b;b.active=u.id;b.side=0;b.phase='aim';u.acted=false;u.retreat=false;u.focus=9999;u.loadout=[id];u.ranks[id]??=1;u.cooldowns={};}
function tick(app,p,dt){
 p.age+=dt;const e=p.e,b=p.b,s=C.SKILLS[p.id],u=p.hero;
 if(!p.fired&&p.age>=.65){p.fired=e.fire(p.id,p.aim.angle,p.aim.power);p.started=p.age;}
 if(p.fired){
  if(p.id==='A09'&&!p.follow&&b.projectiles.some(q=>q.age>.28)){p.follow=e.turnArrow({x:b.units[1].x,y:b.units[1].y-100});}
  if(p.id==='M02'&&!p.follow&&b.projectiles.some(q=>!q.secondary&&Math.hypot(q.x-b.units[1].x,q.y-b.units[1].y+55)<q.blast*.8)){p.follow=e.detonateIceGourd();}
  if(p.id==='S04'&&!p.follow&&b.projectiles.some(q=>q.body&&q.x>b.units[1].x-65)){p.follow=C.manualDive(e);}
  if(p.id==='S13'&&u.meleeFollow==='ready'&&!p.follow){p.follow=true;e.fire('S00',0,.55);}
  if(p.id==='S08'&&u.martialGuard&&p.age>1.6&&!p.follow){p.follow=true;b.side=1;e.hurt(u,40,b.units[1].id);C.tickWarrior(e,C.STEP);}
  if(p.id==='A10'&&p.age>1.8&&!p.follow){p.follow=true;ready(p,'A14');const aim=shortShot(e,u,C.SKILLS.A14,b.units[1]);e.fire('A14',aim.angle,aim.power);}
  if(p.id==='M09'&&b.stakes.length===2&&!p.follow){ready(p,p.id);p.follow=e.useGate();}
  if(p.id==='S14'&&p.age>1.5&&!p.follow){p.follow=true;const foe=b.units[1];b.active=foe.id;b.side=1;b.phase='enemy';foe.lastAct=b.round;const aim=shortShot(e,foe,C.SKILLS.LA01,u);e.fire('LA01',aim.angle,aim.power,true);}
  if(p.id==='O15'&&!p.follow&&b.phase==='aim'&&p.age>3){p.follow=true;ready(p,'O01');const aim=shortShot(e,u,C.SKILLS.O01,b.units[1]);e.fire('O01',aim.angle,aim.power);}
  p.acc+=dt;for(let n=0;n<16&&p.acc>=C.STEP;n++,p.acc-=C.STEP){
   if(['transition','enemy'].includes(b.phase)){e.stepUnits(C.STEP);C.tickRedesign(e,C.STEP);}
   else e.tick(C.STEP);
  }
 }
 const rect=p.canvas.getBoundingClientRect(),bounds={...p.bounds};
 // Expansion follows high arcs/knockback without losing the caster at ordinary distances.
 const subjects=[...b.units.filter(v=>!v.dead),...b.projectiles.filter(q=>!q.child&&q.x<p.flightRight)];
 for(const v of subjects){if(v.x< -100||v.x>1800||v.y< -250||v.y>1100)continue;bounds.left=Math.min(bounds.left,v.x-50);bounds.right=Math.max(bounds.right,v.x+65);bounds.top=Math.min(bounds.top,v.y-(v.h||0)-40);}
 p.bounds=bounds;
 const z=Math.min(1.25,(rect.width-32)/(bounds.right-bounds.left),(rect.height-28)/(bounds.bottom-bounds.top));
 p.scene.scale=Math.max(.16,z);p.scene.x=(bounds.left+bounds.right)/2;p.scene.y=(bounds.top+bounds.bottom)/2;
 p.scene.render(e,dt,p.id,p.aim.power,!p.fired);
 if(p.age>(s.mode.startsWith('summon')||p.id==='O99'||p.id==='O03'?11:7)){const cycle=p.cycle+1;app.preview=setup(app,p.id,p.h,p.canvas);app.preview.cycle=cycle;}
}
G.HonroSkillPreview={setup,tick};
})(globalThis);
