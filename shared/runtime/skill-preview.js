(function(G){'use strict';
const C=G.HONRO_CORE;
// Every active has a scenario contract; common shots share the same small fixture.
const scenarios={};const define=(ids,kind,options={})=>ids.split(' ').forEach(id=>scenarios[id]={kind,...options});
define('A01 M01 S09 O01','single');define('A14','distance',{positions:[720,1500]});define('A99','execution',{positions:[1680],hp:100});
define('A02 S11','line',{positions:[720,850,985,1120,1250]});define('A06','recovery',{focus:120,maxFocus:400});define('A10','prepare');
define('A11 A15','apex',{positions:[820,1000,1190]});define('A09 A13','offset',{positions:[820,1030,1160],heights:[0,130,55]});define('A12','return');
define('A05','push',{positions:[790,875,1010],movable:true});define('A04','spread',{positions:[800,900,1050],heights:[0,85,160]});define('A07','break');define('A03','ground-chain',{positions:[760,920,1070]});define('A08','fragments');
define('M06 M13','delayed-burst',{positions:[820,930,1020]});define('M02','bounce-ice');define('M04','lightning',{positions:[760,1010,1270]});define('M05','sky');define('M03','arc');define('M11 M12','reflection');define('M14','ring',{positions:[660,80,440]});define('M15','bagua',{positions:[560,710,360],heights:[100,0,260]});
define('M07','trap',{positions:[980],movable:true,enemy:true});define('M08','lure',{positions:[1040],movable:true,enemy:true});define('M10','healing-stake');define('M09','gate');define('M99','prison',{positions:[980],movable:true,enemy:true});
define('S00 S03','melee',{positions:[455,510]});define('S05','turn',{positions:[465,260]});define('S07','combo',{positions:[455,520,585],hp:45});define('S08','counter',{positions:[555],enemy:true});define('S02','life');
define('S01 S06 S04 S13','rush');define('S15','ground-air',{positions:[700,925],heights:[0,80],movable:true});define('S10','pull',{positions:[830],movable:true});define('S14','burst-blade',{positions:[840,860,880],heights:[0,105,205]});define('S12','orbit');
define('O02 O04','phase-wall');define('O03','reverse-rain',{positions:[1000,1130,1260]});define('O05','reverse-path',{positions:[840,970]});define('O06','weakness',{positions:[800,970],enemy:true});define('O07','betrayal',{positions:[800,975],enemy:true});define('O08','manifest',{positions:[830,955]});define('O09','enthrall',{positions:[800,1060],enemy:true});define('O10','earthbound',{positions:[840],hp:45});define('O11 O12','summon');define('O13','warden');define('O14','eater',{positions:[830,970]});define('O15','echo');define('O16','converge',{positions:[760,870]});
function shortShot(e,u,s,target){
 const seeds=e.shotSeeds(u,s,target).filter(a=>a.angle<45||a.angle>135).sort((a,b)=>b.power-a.power);
 for(const a of seeds){const hit=e.predict(u,s,a.angle,a.power,undefined,false);if(hit.unit===target.id||hit.closest<target.r)return a;}
 return e.bestShot(u,s,target);
}
function setup(app,id,h,canvas){
 const s=C.SKILLS[id],scenario=scenarios[id]||{kind:'single'},profile=structuredClone(app.profile);profile.heroes[s.cls]=structuredClone(h);profile.heroes[s.cls].ranks={[C.baseSkill(s.cls)]:1,[id]:Math.max(1,h.ranks[id]||0)};profile.loadouts[s.cls]=[id];
 const b=C.createBattle(1,profile,'practice',{party:[s.cls],wind:0}),floor=1000;
 Object.assign(b,{width:2400,height:1400,practiceCombat:true,terrain:[{id:'preview-floor',x:0,y:floor,w:2400,h:400,mat:'rock',hp:99999,maxHp:99999,indestructible:true}],waters:[],drafts:[],fields:[],zones:[],stakes:[],projectiles:[],wind:0,honroStage:1,honroBackdrop:'forest',honroLandmarks:[],honroMarkers:[],honroSurfaceZones:[],routePoints:[],sceneVersion:b.sceneVersion+1});
 const hero=b.units.find(u=>u.side===0);b.units=[hero];Object.assign(hero,{x:360,y:floor,spawnX:360,spawnY:floor,h:130,r:23,hp:900,maxHp:1200,focus:scenario.focus??9999,maxFocus:scenario.maxFocus??9999,attack:1,acted:false,loadout:[id],ranks:{...profile.heroes[s.cls].ranks},vx:0,vy:0,airborne:false,jumping:false});
 const close=s.branch==='sword',ring=id==='M14',bounce=['M11','M12'].includes(id),positions=[...(scenario.positions||(close?[460,560]:[840,955,1070]))];
 if(id==='S05')positions[1]=260;
 if(id==='S10')positions.splice(0,positions.length,830);
 if(id==='O03')positions.splice(0,positions.length,1000,1130,1260);
 if(id==='O16')positions.splice(0,positions.length,760,870);
 if(id==='M10'||id==='M09'||id==='O13'||id==='O14'||id==='O15')positions.splice(0,positions.length,1050);
 for(const [i,x] of positions.entries()){const u=C.makeUnit('knight',1,x,floor-(scenario.heights?.[i]||0),{id:'preview-target-'+i,name:'표적',h:115,r:27,honroType:'beast',honroVariant:'hound',hp:scenario.hp||2400,maxHp:scenario.hp||2400,armor:0,attack:.5,awake:true,fixed:!scenario.movable,loadout:['LA01'],focus:9999,maxFocus:9999});b.units.push(u);}
 if(id==='M10'||id==='O13'){const ally=C.makeUnit('knight',0,780,floor,{id:'preview-ally',name:'동행',h:130,hp:300,maxHp:1200,focus:20,maxFocus:200,acted:true,loadout:['S00'],ranks:{S00:1}});b.units.push(ally);}
 if(id==='O16')for(const [i,x] of [250,540].entries())b.units.push(C.makeUnit('occultist',0,x,floor-130,{id:'preview-echo-'+i,name:'반향령',summoned:true,summonOwner:hero.id,summonKind:'echo',summonRank:8,summonExpires:8,acted:true,fixed:true,summonFloating:true,h:65,r:20,hp:180,maxHp:180,attack:0,loadout:[],ranks:{...hero.ranks}}));
 if(bounce)b.terrain.push({id:'preview-wall',x:1140,y:620,w:40,h:380,mat:'rock',hp:99999,maxHp:99999,indestructible:true});
 if(['O02','O04','O05'].includes(id))b.terrain.push({id:'preview-phase-wall',x:id==='O05'?1270:690,y:540,w:35,h:460,mat:'rock',hp:99999,maxHp:99999,indestructible:true});
 if(id==='M12')b.terrain.push({id:'preview-reflect-ceiling',x:650,y:570,w:530,h:35,mat:'rock',hp:99999,maxHp:99999,indestructible:true});
 if(id==='A07')b.terrain.push({id:'preview-breakable',x:760,y:840,w:55,h:160,mat:'wood',hp:65,maxHp:65});
 if(id==='O08')for(const target of b.units.filter(v=>v.side===1))Object.assign(target,{honroType:'ghost',honroVariant:'ghost',spiritHidden:true});
 if(id==='O06'||id==='O07')for(const target of b.units.filter(v=>v.side===1))target.attack=1;
 for(const target of b.units.filter(v=>scenario.heights?.[Number(v.id.split('-').at(-1))])){target.fixed=true;target.summonFloating=true;}
 b.active=hero.id;b.side=0;b.phase='aim';b.queue=[];
 const pr={id,b,canvas,hero,age:0,acc:0,fired:false,follow:false,cycle:0,events:[],h:structuredClone(h),scenario,enemyActions:0,finishedAt:null};
 pr.scene=new G.HonroScene(canvas);pr.scene.manual=true;pr.scene.skillPreview=true;pr.e=new C.Engine(b,event=>{
  pr.events.push(event);if(pr.events.length>300)pr.events.shift();pr.scene.event(event);
  if(event.name==='skillGeometry'&&pr.bounds){const points=C.geometryPaths(JSON.parse(event.text)).flat();for(const p of points){pr.bounds.left=Math.min(pr.bounds.left,p.x-20);pr.bounds.right=Math.max(pr.bounds.right,p.x+20);pr.bounds.top=Math.min(pr.bounds.top,p.y-20);pr.bounds.bottom=Math.max(pr.bounds.bottom,p.y+20);}}
 },true);pr.e.checkEnd=()=>false;
 const enemyAction=pr.e.enemyAction.bind(pr.e),fire=pr.e.fire.bind(pr.e);
 pr.e.fire=(...args)=>{const side=b.side,ok=fire(...args);if(ok&&side===1)pr.enemyActions++;return ok;};
 pr.e.enemyAction=()=>{
  if(!scenario.enemy||pr.enemyActions>=1){if(pr.enemyActions>=1&&pr.e.active)pr.e.finishAction();return;}
  const actor=pr.e.active,stake=b.stakes[0];
  if(id==='O07'&&actor?.id==='preview-target-0'){pr.e.finishAction();return;}
  if(actor&&stake&&['M07','M99'].includes(id)){
   const touched=id==='M07'?stake.lastTriggerRound===b.round:stake.active;
   if(!touched){pr.e.walk(actor,Math.sign(stake.x-actor.x),C.STEP,true);return;}
   if(id==='M99'&&!Object.keys(stake.crossed||{}).length){pr.e.walk(actor,1,C.STEP,true);return;}
  }
  enemyAction();
 };
 const target=b.units[1];let aim={angle:0,power:.55};
 if(close)aim={angle:0,power:.65};
 else if(ring)aim={angle:0,power:(300-180)/720};
 else if(id==='A10')aim={angle:0,power:.5};
 else if(id==='O03')aim={angle:-30,power:.42};
 else if(id==='O05')aim={angle:0,power:.75};
 else if(id==='O16')aim={angle:20,power:.4};
 else if(id==='A11')aim={angle:68,power:.65};
 else if(id==='A03')aim={angle:-12,power:.5};
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
 if(scenario.heights)pr.bounds.top=floor-Math.max(...scenario.heights)-160;
 if(id==='A99')pr.flightRight=2050;
 if(close)pr.bounds.top=floor-235;if(ring){pr.bounds.left=hero.x-365;pr.bounds.right=hero.x+365;pr.bounds.top=floor-385;}
 return pr;
}
function ready(p,id){const u=p.hero,b=p.b;b.active=u.id;b.side=0;b.phase='aim';u.acted=false;u.retreat=false;u.focus=9999;u.loadout=[id];u.ranks[id]??=1;u.cooldowns={};}
function tick(app,p,dt){
 p.age+=dt;const e=p.e,b=p.b,s=C.SKILLS[p.id],u=p.hero;
 if(!p.fired&&p.age>=.65){p.fired=e.fire(p.id,p.aim.angle,p.aim.power);p.started=p.age;}
 if(p.fired){
  if(p.id==='A09'&&!p.follow&&b.projectiles.some(q=>q.age>.28)){p.follow=e.turnArrow({x:b.units[1].x,y:b.units[1].y-100});}
  if(p.id==='M02'&&!p.follow&&b.projectiles.some(q=>!q.secondary&&q.bounces>0&&Math.hypot(q.x-b.units[1].x,q.y-b.units[1].y+55)<q.blast*.8)){p.follow=e.detonateIceGourd();}
  if(p.id==='S04'&&!p.follow&&b.projectiles.some(q=>q.body&&q.x>b.units[1].x-65)){p.follow=C.manualDive(e);}
  if(p.id==='S13'&&u.meleeFollow==='ready'&&!p.follow){p.follow=true;e.fire('S00',0,.55);}

  if(p.id==='A10'&&p.age>1.8&&!p.follow){p.follow=true;ready(p,'A14');const aim=shortShot(e,u,C.SKILLS.A14,b.units[1]);e.fire('A14',aim.angle,aim.power);}
  if(p.id==='M09'&&b.stakes.length===2&&!p.follow){ready(p,p.id);p.follow=e.useGate();}

  if(p.id==='O10'&&!p.follow&&!b.projectiles.length&&b.units[1]?.earthbind){p.follow=true;ready(p,'O01');const aim=shortShot(e,u,C.SKILLS.O01,b.units[1]);e.fire('O01',aim.angle,aim.power);}
  if(p.id==='O14'&&!p.follow){const eater=b.units.find(v=>v.summonKind==='eater'&&!v.dead);if(eater&&b.units.some(v=>v.eaterCapturedBy===eater.id)){p.follow=true;ready(p,'O01');const aim=shortShot(e,u,C.SKILLS.O01,eater);e.fire('O01',aim.angle,aim.power);}}
  if(p.id==='O15'&&!p.follow&&!b.projectiles.length&&b.units.some(v=>v.summonKind==='echo')&&p.age>2.5){p.follow=true;ready(p,'O01');const aim=shortShot(e,u,C.SKILLS.O01,b.units[1]);e.fire('O01',aim.angle,aim.power);}
  p.acc+=dt;for(let n=0;n<16&&p.acc>=C.STEP;n++,p.acc-=C.STEP){
   e.planningBudget(2);e.tick(C.STEP);
  }
 }
 const rect=p.canvas.getBoundingClientRect(),bounds={...p.bounds};
 // Expansion follows high arcs/knockback without losing the caster at ordinary distances.
 const subjects=[...b.units.filter(v=>!v.dead&&!v.eaterCapturedBy),...b.projectiles,...b.stakes,...b.zones,...b.fields];
 for(const v of subjects){if(!Number.isFinite(v.x)||!Number.isFinite(v.y)||v.x< -150||v.x>b.width+150||v.y< -1800||v.y>b.height+100)continue;const reach=v.radius||v.blast||0;bounds.left=Math.min(bounds.left,v.x-Math.max(50,reach));bounds.right=Math.max(bounds.right,v.x+Math.max(65,reach));bounds.top=Math.min(bounds.top,v.y-(v.h||0)-Math.max(40,reach));bounds.bottom=Math.max(bounds.bottom,v.y+Math.max(25,reach));}
 p.bounds=bounds;
 const z=Math.min(1.25,(rect.width-32)/(bounds.right-bounds.left),(rect.height-28)/(bounds.bottom-bounds.top));
 p.scene.scale=Math.max(.06,z);p.scene.x=(bounds.left+bounds.right)/2;p.scene.y=(bounds.top+bounds.bottom)/2;
 p.scene.render(e,dt,p.id,p.aim.power,!p.fired);
 const noMotion=!b.projectiles.length&&!b.units.some(v=>v.meleeAction||v.aiMove||v.moveTarget!==undefined),needsFollow=['A10','M09','S13','O10','O14','O15'].includes(p.id),reaction=!p.scenario.enemy||p.enemyActions>0||p.id==='S08'&&u.martialGuard?.counter===false||['M07','M08'].includes(p.id)&&b.stakes.some(v=>v.lastTriggerRound===b.round);
 const summonDone=!s.mode.startsWith('summon')||b.units.some(v=>v.summoned&&v.summonActionRound===b.round)||p.id==='O14'&&p.follow||p.id==='O15'&&p.follow;
 if(p.fired&&p.age>2.4&&noMotion&&reaction&&summonDone&&(!needsFollow||p.follow))p.finishedAt??=p.age;
 if(p.finishedAt!==null&&p.age-p.finishedAt>1.3||p.age>22){const cycle=p.cycle+1;app.preview=setup(app,p.id,p.h,p.canvas);app.preview.cycle=cycle;}
}
G.HonroSkillPreview={setup,tick,scenarios};
})(globalThis);
