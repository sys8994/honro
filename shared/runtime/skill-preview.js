(function(G){'use strict';
const C=G.HONRO_CORE;
// Every active has a scenario contract; common shots share the same small fixture.
const scenarios={};const define=(ids,kind,options={})=>ids.split(' ').forEach(id=>scenarios[id]={kind,...options});
define('A01 M01 S09 O01','single');define('A14','distance',{positions:[1500]});define('A99','execution',{positions:[1680],hp:500,maxHp:2400});
define('A02 S11','line',{positions:[720,790,860,930,1000]});define('A06','recovery',{focus:120,maxFocus:400});define('A10','prepare');
define('A11','apex',{positions:[1050]});define('A15','apex',{positions:[820,1000,1190]});define('A13','offset',{positions:[1000],heights:[180]});define('A12','return',{positions:[430]});define('A09','turn-once',{positions:[1080],heights:[0],turnLift:0});
define('A05','push',{positions:[790,875,1010],movable:true});define('A04','spread',{positions:[1050,1050,1050],heights:[80,130,180],flying:[0,1,2],targetHeight:42,targetRadius:18});define('A07','break');define('A03','ground-chain',{positions:[760,840,920]});define('A08','fragments');
define('M06 M13','delayed-burst',{positions:[820,930,1020]});define('M02','bounce-ice');define('M04','lightning',{positions:[760,870,1000]});define('M05','sky');define('M03','arc');define('M11 M12','reflection');define('M14','ring',{positions:[660,80,440]});define('M15','bagua',{positions:[840,920,1000]});
define('M07','trap',{positions:[980],movable:true,enemy:true});define('M08','lure',{positions:[1040],movable:true,enemy:true});define('M10','healing-stake');define('M09','gate');define('M99','prison',{positions:[980],movable:true,enemy:true});
define('S00 S03','melee',{positions:[455,510]});define('S05','turn',{positions:[465,260]});define('S07','combo',{positions:[455,520,585],hp:25});define('S08','counter',{positions:[555],enemy:true});define('S02','life');
define('S01 S04 S13','rush');define('S06','sweep',{positions:[500,560,620]});define('S15','ground-air',{positions:[700,760],heights:[0,80],flying:[1],movable:true});define('S10','pull',{positions:[830],movable:true});define('S14','burst-blade',{positions:[840,865,890]});define('S12','orbit');
define('O02 O04','phase-wall');define('O03','reverse-rain',{positions:[1000,1130,1260]});define('O05','reverse-path',{positions:[840,970]});define('O06','weakness',{positions:[800,970],enemy:true});define('O07','betrayal',{positions:[800,975],enemy:true});define('O08','manifest',{positions:[830,955]});define('O09','enthrall',{positions:[800,1060],enemy:true});define('O10','earthbound',{positions:[840]});define('O11 O12','summon');define('O13','warden');define('O14','eater',{positions:[830,970]});define('O15','echo');define('O16','converge',{positions:[760,790]});
function shortShot(e,u,s,target){
 const seeds=e.shotSeeds(u,s,target).filter(a=>a.angle<45||a.angle>135).sort((a,b)=>b.power-a.power);
 for(const a of seeds){const hit=e.predict(u,s,a.angle,a.power,undefined,false);if(hit.unit===target.id||hit.closest<target.r)return a;}
 return e.bestShot(u,s,target);
}
// A passive is shown through its real trigger, with an identical unlearned control.
const passiveScenarios={
 AP01:{cast:'A01',kind:'passive-volley',label:'한 발 뒤 이어지는 후속 사격',metric:'followups'},
 AP02:{cast:'A14',kind:'passive-critical',label:'급소 확률·배율을 높인 정밀 사격',metric:'critical'},
 AP03:{cast:'A01',kind:'passive-retreat',label:'사격을 마친 뒤 이탈보로 후퇴',metric:'retreat',turns:true},
 AP04:{cast:'A14',kind:'passive-trajectory',label:'먼 표적의 거리 보너스 비교',metric:'damage',positions:[1400]},
 AP05:{cast:'A01',kind:'passive-history',label:'다음 내 턴에 같은 적의 살흔을 재현',metric:'damage',sequence:['A01','A01'],turns:true},
 MP01:{cast:'M06',kind:'passive-secondary',label:'폭발 뒤 불꽃 파편의 위력 비교',metric:'damage'},
 MP02:{cast:'M01',kind:'passive-mana',label:'기력 최대량과 턴 회복 비교',metric:'mana',turns:true},
 MP03:{cast:'M06',kind:'passive-refund',label:'적을 빗나간 도술의 기력 환급',metric:'focus',positions:[1600],miss:true},
 MP04:{cast:'M01',kind:'passive-ward',label:'명중 뒤 가까운 동행에게 방호',metric:'shield',ally:true},
 MP05:{cast:'M06',kind:'passive-circulation',label:'기력을 쌓아 주천을 완성하고 다음 도술 강화',metric:'jucheon',sequence:['M06','M06','M06','M06','M06','M06','M06','M06'],turns:true},
 SP01:{cast:'S03',kind:'passive-sword',label:'힘을 모은 검술의 사거리·피해 비교',metric:'damage'},
 SP02:{cast:'S00',kind:'passive-durability',label:'같은 적 공격에 대한 체력·방어 비교',metric:'durability',incoming:true,positions:[660]},
 SP03:{cast:'S00',kind:'passive-mobility',label:'실제 도약 높이·소모 이동력 비교',metric:'jump'},
 SP04:{cast:'S03',kind:'passive-harmony',label:'검술 → 돌격 → 검기 → 합세 강화',metric:'harmony',sequence:['S03','S01','S09','S03'],turns:true,positions:[470,700,920]},
 SP05:{cast:'S00',kind:'passive-last-stand',label:'치명적인 한 발을 불굴로 버티기',metric:'lastStand',incoming:true,positions:[660],lowHealth:true},
 OP01:{cast:'O06',kind:'passive-trap',label:'빗나간 부적을 밟은 적에게 잔부 발동',metric:'trap',positions:[980],movable:true,miss:true,enemy:true},
 OP02:{cast:'O06',kind:'passive-mark-priority',label:'주박한 적을 배회령이 우선 추적',metric:'marked',sequence:['O06','O11'],turns:true,positions:[1000,500],goal:650},
 OP03:{cast:'O13',goal:600,kind:'passive-share',label:'소환령을 부른 뒤 적 공격의 피해 분담',metric:'share',incomingAfter:true,enemy:true,positions:[920]},
 OP04:{cast:'O11',kind:'passive-expiry',label:'턴을 보내 자연 소멸한 소환령의 기력 회수',metric:'expiry',turns:true},
 OP05:{cast:'O10',survivorHp:2400,kind:'passive-remnants',label:'적 셋의 잔혼을 모아 다음 혼행 강화',metric:'remnants',sequence:['O10','O01'],turns:true,positions:[780,810,840,1100],hp:25}
};
function groundAim(e,u,s,goal,floor=1000){let aim={angle:28,power:.5},best=Infinity;for(const angle of [15,28,42])for(let power=.25;power<=.9;power+=.025){const hit=e.predict(u,s,angle,power,undefined,false),d=Math.abs(hit.x-goal)+Math.abs(hit.y-floor);if(d<best){best=d;aim={angle,power};}}return aim;}
function setup(app,selectedId,h,canvas,options={}){
 const passive=passiveScenarios[selectedId],id=passive?.cast||selectedId,s=C.SKILLS[id],scenario={...(scenarios[id]||{kind:'single'}),...passive},profile=structuredClone(app.profile);profile.heroes[s.cls]=structuredClone(h);profile.heroes[s.cls].ranks={[C.baseSkill(s.cls)]:1,[id]:s.basic?1:Math.max(1,h.ranks[id]||0)};if(passive){profile.heroes[s.cls].ranks[selectedId]=options.passiveOff?0:Math.max(1,h.ranks[selectedId]||0);for(const next of passive.sequence||[])profile.heroes[s.cls].ranks[next]=1;}profile.loadouts[s.cls]=[id];
 const b=C.createBattle(1,profile,'practice',{party:[s.cls],wind:0}),floor=1000;
 Object.assign(b,{width:2400,height:1400,practiceCombat:true,terrain:[{id:'preview-floor',x:0,y:floor,w:2400,h:400,mat:'rock',hp:99999,maxHp:99999,indestructible:true}],waters:[],drafts:[],fields:[],zones:[],stakes:[],projectiles:[],wind:0,honroStage:1,honroBackdrop:'forest',honroLandmarks:[],honroMarkers:[],honroSurfaceZones:[],routePoints:[],sceneVersion:b.sceneVersion+1});
 const hero=b.units.find(u=>u.side===0);b.units=[hero];Object.assign(hero,{x:360,y:floor,spawnX:360,spawnY:floor,h:130,r:23,hp:900,maxHp:1200,focus:scenario.focus??9999,maxFocus:scenario.maxFocus??9999,attack:1,acted:false,loadout:[id],ranks:{...profile.heroes[s.cls].ranks},vx:0,vy:0,airborne:false,jumping:false});
 if(passive?.metric==='critical'||id==='A99')b.rng=0;
 // Reproducible demo seed: the normal critical roll still decides the result.
 if(id==='A14'&&!passive)b.rng=7;
 if(passive){const stats=C.heroStats(profile.heroes[s.cls],s.cls);Object.assign(hero,{maxHp:stats.hp,hp:passive.lowHealth?15:Math.round(stats.hp*.75),maxFocus:stats.mp,focus:['mana','expiry'].includes(passive.metric)?Math.round(stats.mp*.35):stats.mp,attack:stats.attack,maxMove:stats.move,moveLeft:stats.move,regen:stats.regen,armor:stats.armor,critChance:stats.critChance,critMultiplier:stats.critMultiplier});if(passive.turns||passive.lowHealth)b.mode='campaign';if(passive.lowHealth)b.practiceCombat=false;}
 const close=s.branch==='sword',ring=id==='M14',bounce=['M11','M12'].includes(id),positions=[...(scenario.positions||(close?[460,560]:[840,955,1070]))];
 if(id==='S05')positions[1]=260;
 if(id==='S10')positions.splice(0,positions.length,830);
 if(id==='O03')positions.splice(0,positions.length,1000,1130,1260);
 if(id==='M10'||id==='M09'||id==='O13'||id==='O15')positions.splice(0,positions.length,1050);if(id==='O14')positions.splice(0,positions.length,800);
 for(const [i,x] of positions.entries()){const u=C.makeUnit('knight',1,x,floor-(scenario.heights?.[i]||0),{id:'preview-target-'+i,name:'표적',h:115,r:27,honroType:'beast',honroVariant:'hound',hp:scenario.hp||2400,maxHp:scenario.maxHp||scenario.hp||2400,armor:0,attack:.5,awake:true,fixed:!scenario.movable,loadout:['LA01'],focus:9999,maxFocus:9999});if(id==='A99')u.existenceDefense={form:1,qi:1,soul:1};if(scenario.survivorHp&&i===positions.length-1)u.hp=u.maxHp=scenario.survivorHp;if(passive?.incomingAfter)u.attack=4;if(scenario.flying?.includes(i))Object.assign(u,{honroType:'bat',honroVariant:'bat',fixed:true,h:scenario.targetHeight||65,r:scenario.targetRadius||25});b.units.push(u);}
 if(id==='O06'&&!passive)b.units[1].armor=.35;
 if(id==='M10'||id==='O13'||id==='O08'||passive?.ally){const ally=C.makeUnit('knight',0,id==='O08'?180:passive?.ally?650:780,floor,{id:'preview-ally',name:'동행',h:130,hp:300,maxHp:1200,focus:20,maxFocus:200,moveLeft:100,maxMove:900,acted:true,loadout:['S00'],ranks:{S00:1}});b.units.push(ally);}
 if(bounce)b.terrain.push({id:'preview-wall',x:1140,y:620,w:40,h:380,mat:'rock',hp:99999,maxHp:99999,indestructible:true});
 if(['O02','O04','O05'].includes(id))b.terrain.push({id:'preview-phase-wall',x:id==='O05'?1270:690,y:540,w:35,h:460,mat:'rock',hp:99999,maxHp:99999,indestructible:true});
 if(id==='M12')b.terrain.push({id:'preview-reflect-ceiling',x:650,y:570,w:530,h:35,mat:'rock',hp:99999,maxHp:99999,indestructible:true});
 if(id==='A02'&&(h.ranks.A02||1)>=3)b.terrain.push({id:'preview-pierce-wood',x:650,y:860,w:12,h:140,mat:'wood',hp:100,maxHp:100});
 if(id==='A07')b.terrain.push({id:'preview-breakable',x:760,y:840,w:55,h:160,mat:'wood',hp:65,maxHp:65});
 if(id==='O08')for(const target of b.units.filter(v=>v.side===1))Object.assign(target,{honroType:'ghost',honroVariant:'ghost',spiritHidden:true});
 if(id==='O06'||id==='O07')for(const target of b.units.filter(v=>v.side===1))target.attack=1;
 for(const [i,height] of (scenario.heights||[]).entries()){if(height>0&&!scenario.flying?.includes(i))b.terrain.push({id:'preview-platform-'+i,x:positions[i]-65,y:floor-height,w:130,h:height,mat:'rock',hp:99999,maxHp:99999,indestructible:true});}
 b.active=hero.id;b.side=0;b.phase='aim';b.queue=[];
 const pr={id:selectedId,castId:id,passive,quiet:options.quiet,b,canvas,hero,age:0,acc:0,fired:false,follow:false,cycle:0,trace:{before:[],after:[]},turns:0,events:[],h:structuredClone(h),scenario,enemyActions:0,finishedAt:null};
 pr.scene=new G.HonroScene(canvas);pr.scene.manual=true;pr.scene.skillPreview=true;pr.scene.scale=pr.scene.scale||1;pr.scene.x=pr.scene.x||0;pr.scene.y=pr.scene.y||0;pr.e=new C.Engine(b,event=>{
  pr.events.push(event);pr.metrics?.events.add(event.name||event.type);if(event.name==='skillGeometry'&&pr.metrics){const geometry=JSON.parse(event.text);pr.metrics.geometry.add(geometry.kind);pr.metrics.geometryDetails.push(geometry);}if(pr.events.length>300)pr.events.shift();pr.scene.event(event);
  if(event.name==='skillGeometry'&&pr.bounds){const points=C.geometryPaths(JSON.parse(event.text)).flat();for(const p of points){pr.bounds.left=Math.min(pr.bounds.left,p.x-20);pr.bounds.right=Math.max(pr.bounds.right,p.x+20);pr.bounds.top=Math.min(pr.bounds.top,p.y-20);pr.bounds.bottom=Math.max(pr.bounds.bottom,p.y+20);}}
 },true);pr.e.checkEnd=()=>false;
 pr.metrics={events:new Set(),modes:new Set(),geometry:new Set(),geometryDetails:[],maxProjectiles:0,returning:false,wraithReturn:false,apex:false,prepared:false,enthrall:false,manifest:false,earthbind:false,captured:false,prisonCross:false,effectBoost:0,projectiles:new Set(),followups:new Set(),secondary:new Set(),bounces:0,damage:0,hits:[],orbiters:0,sharedDamage:0,heroHpMin:hero.hp,heroHpMax:hero.hp,guard:false,counter:false,traps:0,curse:0,soulBoost:false,shield:0,jucheon:0,jucheonReady:false,harmony:false,lastStand:false,remnants:0,expiry:0,jump:0,retreat:0,summons:0,stakes:0,casts:[]};
 pr.metrics.expiryRecovered=0;const expireSummon=pr.e.expireSummon.bind(pr.e);pr.e.expireSummon=(target)=>{const owner=pr.e.unit(target.summonOwner),focus=owner?.focus||0,result=expireSummon(target);if(result&&owner)pr.metrics.expiryRecovered+=Math.max(0,owner.focus-focus);return result;};
 const hurt=pr.e.hurt.bind(pr.e);pr.e.hurt=(target,...args)=>{const hp=target.hp,shield=target.shield;const result=hurt(target,...args);const actual=hp-target.hp;if(target.summoned&&String(args[1]).startsWith('preview-target'))pr.metrics.sharedDamage+=Math.max(0,actual)+Math.max(0,shield-target.shield);if(actual>0){pr.metrics.hits.push({target:target.id,damage:actual,source:args[1],skill:args[3]?.skill});if(target.id.startsWith('preview-target'))pr.metrics.damage+=actual;}return result;};
 const enemyAction=pr.e.enemyAction.bind(pr.e),fire=pr.e.fire.bind(pr.e);
 pr.e.fire=(...args)=>{const side=b.side,focus=pr.e.active?.focus,ok=fire(...args);if(ok){pr.metrics.casts.push({id:args[0],side,cost:focus-(pr.e.active?.focus??focus),time:pr.age});if(side===1)pr.enemyActions++;}return ok;};
 pr.e.enemyAction=()=>{
  if(passive?.turns){pr.e.finishAction(true);return;}
  if(passive?.incomingAfter&&!pr.enemyActions){const actor=pr.e.active,skill=C.SKILLS.LA01,aim=shortShot(pr.e,actor,skill,hero);pr.e.fire('LA01',aim.angle,aim.power,true);return;}
  if(passive?.metric==='trap'){const actor=pr.e.active,trap=b.occultTraps?.[0];if(trap){pr.e.walk(actor,Math.sign(trap.x-actor.x),C.STEP,true);return;}}
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
 if(passive?.miss)aim={angle:-10,power:.28};
 else if(close)aim={angle:0,power:.65};
 else if(ring)aim={angle:0,power:(300-180)/720};
 else if(id==='A09')aim={angle:25,power:.68};
 else if(id==='A12')aim={angle:40,power:.8};
 else if(id==='A07')aim={angle:0,power:.6};
 else if(id==='A10')aim={angle:0,power:.5};
 else if(id==='O03')aim={angle:-30,power:.42};
 else if(id==='O05')aim={angle:0,power:.75};
 else if(id==='A11')aim={angle:68,power:.65};
 else if(id==='A13')aim={angle:65,power:.55};
 else if(id==='A03')aim={angle:0,power:.8};
 else if(id==='A15')aim={angle:62,power:.52};
 else if(id==='M11')aim={angle:30,power:.72};
 else if(id==='M12')aim={angle:45,power:.8};
 else if(id==='S11'||id==='S12')aim={angle:8,power:.75};
 else if(s.branch==='stake'||['O11','O12','O13','O14','O15'].includes(id)){
  // Aim at the ground, not a body: the same prediction and actual landing create the stake.
  const goal=passive?.goal??(['O11','O12'].includes(id)?650:id==='M09'?780:id==='M10'||['O13','O14','O15'].includes(id)?760:840);
  aim=groundAim(pr.e,hero,s,goal,floor);
 }else aim=shortShot(pr.e,hero,s,target);
 pr.aim=aim;hero.angle=aim.angle;hero.lastPower=aim.power;
 if(passive?.metric==='expiry')hero.focus=Math.min(hero.maxFocus,pr.e.manaCost(s,hero,aim.power)+10);
 // Survive the charm itself, then die to the real follow-up: avoid creating a spirit inside the still-resolving charm blast.
 if(selectedId==='O10'){const target=b.units[1];target.existenceDefense={form:1,qi:1,soul:1};target.hp=target.maxHp=Math.ceil(pr.e.effective(s,hero).damage)+8;}
 // Fit live actors first; expand only for flight that actually happens (e.g. an apex split).
 pr.bounds={left:Math.min(hero.x-95,...positions.map(x=>x-55)),right:Math.max(hero.x+100,...positions.map(x=>x+65),bounce?1180:0),top:floor-240,bottom:floor+55};
 pr.flightRight=pr.bounds.right+180;
 if(scenario.heights)pr.bounds.top=floor-Math.max(...scenario.heights)-160;
 if(id==='A99')pr.flightRight=2050;
 if(close)pr.bounds.top=floor-235;if(ring){pr.bounds.left=hero.x-365;pr.bounds.right=hero.x+365;pr.bounds.top=floor-385;}
 pr.initial={terrain:b.terrain.map(t=>({id:t.id,mat:t.mat,hp:t.hp})),hero:{hp:hero.hp,focus:hero.focus,x:hero.x,y:hero.y,maxHp:hero.maxHp,maxFocus:hero.maxFocus,armor:hero.armor,move:hero.maxMove,critChance:hero.critChance,critMultiplier:hero.critMultiplier},targets:b.units.filter(u=>u.side===1).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp}))};
 if(passive?.incoming){const enemy=b.units[1];enemy.attack=passive.lowHealth?20:4;b.active=enemy.id;b.side=1;b.phase='enemy';pr.aim=shortShot(pr.e,enemy,C.SKILLS.LA01,hero);}
 if(passive&&!options.noControl){pr.control=setup(app,selectedId,h,canvas,{passiveOff:true,noControl:true,quiet:true});pr.control.hold=true;}
 return pr;
}
function ready(p,id){const u=p.hero,b=p.b;b.active=u.id;b.side=0;b.phase='aim';u.acted=false;u.retreat=false;u.focus=9999;u.loadout=[id];u.ranks[id]??=1;u.cooldowns={};}
function tick(app,p,dt){
 p.age+=dt;const e=p.e,b=p.b,s=C.SKILLS[p.castId],u=p.hero;
 if(p.control)tick(app,p.control,dt);
 if(p.passive?.metric==='jump'&&!p.jumped&&p.age>.2){p.jumped=e.jump(u);p.jumpCost=p.initial.hero.move-u.moveLeft;}
 if(!p.fired&&p.age>=.65){p.fired=e.fire(p.passive?.incoming?'LA01':p.castId,p.aim.angle,p.aim.power,!!p.passive?.incoming);p.started=p.age;}
 if(p.passive?.turns&&p.fired&&(p.hold||p.finishedAt===null)&&b.phase==='aim'&&b.side===0&&!b.projectiles.length&&p.age>(p.nextAction||1.8)){
  const casts=p.metrics.casts.filter(v=>v.side===0),sequence=p.passive.sequence||[],next=sequence[casts.length];
  if(p.passive.metric==='retreat'&&u.retreat){e.move(-1,dt);p.metrics.retreat=Math.max(p.metrics.retreat,p.initial.hero.x-u.x);}
  else if(next){const target=b.units.find(v=>v.side===1&&!v.dead),skill=C.SKILLS[next];u.loadout=[next];const aim=next==='O11'&&p.passive.goal?groundAim(e,u,skill,p.passive.goal):skill.branch==='sword'?{angle:0,power:.65}:shortShot(e,u,skill,target||b.units[1]);if(e.fire(next,aim.angle,aim.power))p.nextAction=p.age+.5;}
  else if(['expiry','mana'].includes(p.passive.metric)&&b.round<9&&!(p.passive.metric==='expiry'&&p.metrics.expiry>0)){e.wait();p.nextAction=p.age+.4;}
 }

 if((p.fired||p.jumped)&&!u.dead){
  if(p.id==='A09'){const q=b.projectiles.find(q=>q.skill==='A09');if(q){p.trace[q.turned?'after':'before'].push({x:q.x,y:q.y});if(!p.follow&&q.age>.48){p.turnVelocity={before:{vx:q.vx,vy:q.vy}};p.follow=e.turnArrow({x:b.units[1].x,y:b.units[1].y-b.units[1].h*.5-(p.scenario.turnLift??150)});if(p.follow){p.turns++;p.turnVelocity.after={vx:q.vx,vy:q.vy};}}}}
  if(p.id==='M02'&&!p.follow&&b.projectiles.some(q=>!q.secondary&&q.bounces>0&&Math.hypot(q.x-b.units[1].x,q.y-b.units[1].y+55)<q.blast*.8)){p.follow=e.detonateIceGourd();}
  if(p.id==='S04'&&!p.follow&&b.projectiles.some(q=>q.body&&q.x>b.units[1].x-65)){p.follow=C.manualDive(e);}
  if(p.id==='S13'&&u.meleeFollow==='ready'&&!p.follow){p.follow=true;e.fire('S00',0,.55);}

  if(p.id==='A10'&&p.age>1.8&&!p.follow){p.follow=true;ready(p,'A14');const aim=shortShot(e,u,C.SKILLS.A14,b.units[1]);e.fire('A14',aim.angle,aim.power);}
  if(p.id==='M09'&&b.stakes.length===2&&!p.follow){ready(p,p.id);p.follow=e.useGate();}

  if(p.id==='O10'&&!p.follow&&!b.projectiles.length&&b.units[1]?.earthbind){p.follow=true;if(!b.units[1].dead&&b.units[1].hp>0){ready(p,'O01');const aim=shortShot(e,u,C.SKILLS.O01,b.units[1]);e.fire('O01',aim.angle,aim.power);}}
  if(p.id==='O14'&&!p.follow){const eater=b.units.find(v=>v.summonKind==='eater'&&!v.dead);if(eater&&b.units.some(v=>v.eaterCapturedBy===eater.id)){p.follow=true;ready(p,'O01');const aim=shortShot(e,u,C.SKILLS.O01,eater);e.fire('O01',aim.angle,aim.power);}}
  if(p.id==='O15'&&!p.follow&&!b.projectiles.length&&b.units.some(v=>v.summonKind==='echo')&&p.age>2.5){p.follow=true;ready(p,'O01');const aim=shortShot(e,u,C.SKILLS.O01,b.units[1]);e.fire('O01',aim.angle,aim.power);}
  p.acc+=dt;for(let n=0;n<16&&p.acc>=C.STEP;n++,p.acc-=C.STEP){
   e.planningBudget(2);e.tick(C.STEP);
  }
 }
 for(const q of b.projectiles){p.metrics.orbiters=Math.max(p.metrics.orbiters,q.orbit?.blades.length||0);p.metrics.modes.add(q.mode);p.metrics.returning||=!!q.returning;p.metrics.wraithReturn||=q.wraithState==='return';p.metrics.apex||=!!q.apex;p.metrics.effectBoost=Math.max(p.metrics.effectBoost,q.effectBoost||0);p.metrics.soulBoost||=!!q.soulBoost;p.metrics.projectiles.add(q.id);if(q.followup)p.metrics.followups.add(q.id);if(q.secondary)p.metrics.secondary.add(q.id);p.metrics.bounces=Math.max(p.metrics.bounces,q.bounces||0);}
 const m=p.metrics;m.heroHpMin=Math.min(m.heroHpMin,u.hp);m.heroHpMax=Math.max(m.heroHpMax,u.hp);m.guard||=!!u.martialGuard;m.counter||=u.martialGuard?.counter===false;m.maxProjectiles=Math.max(m.maxProjectiles,b.projectiles.length);m.prepared||=!!u.prepared;m.enthrall||=b.units.some(v=>!!v.enthrall);m.manifest||=b.units.some(v=>!!v.manifestedUntil);m.earthbind||=b.units.some(v=>!!v.earthbind);m.captured||=b.units.some(v=>!!v.eaterCapturedBy);m.prisonCross||=b.stakes.some(v=>Object.keys(v.crossed||{}).length>0);m.traps=Math.max(m.traps,b.occultTraps?.length||0);m.curse=Math.max(m.curse,...b.units.map(v=>v.curseTurns||v.enthrall?.actions||0));m.shield=Math.max(m.shield,...b.units.filter(v=>v.side===0).map(v=>v.shield||0));m.jucheon=Math.max(m.jucheon,u.jucheon||0);m.jucheonReady||=!!u.jucheonReady;m.harmony||=!!u.harmony;m.lastStand||=!!u.lastStandUsed;m.remnants=Math.max(m.remnants,u.soulRemnants||0);m.expiry=Math.max(m.expiry,u.nextSummonDiscount||0);m.jump=Math.max(m.jump,p.initial.hero.y-u.y);m.summons=Math.max(m.summons,b.units.filter(v=>v.summoned).length);m.stakes=Math.max(m.stakes,b.stakes.length);
 if(p.quiet)return;
 const rect=p.canvas.getBoundingClientRect(),bounds={...p.bounds};
 // Expansion follows high arcs/knockback without losing the caster at ordinary distances.
 const subjects=[...b.units.filter(v=>!v.dead&&!v.eaterCapturedBy),...b.projectiles,...b.stakes,...b.zones,...b.fields];
 for(const v of subjects){if(!Number.isFinite(v.x)||!Number.isFinite(v.y)||v.x< -150||v.x>b.width+150||v.y< -1800||v.y>b.height+100)continue;const reach=v.radius||v.blast||0;bounds.left=Math.min(bounds.left,v.x-Math.max(50,reach));bounds.right=Math.max(bounds.right,v.x+Math.max(65,reach));bounds.top=Math.min(bounds.top,v.y-(v.h||0)-Math.max(40,reach));bounds.bottom=Math.max(bounds.bottom,v.y+Math.max(25,reach));}
 const z=Math.min(1.25,(rect.width-32)/(bounds.right-bounds.left),(rect.height-28)/(bounds.bottom-bounds.top));
 const target={scale:Math.max(.06,z),x:(bounds.left+bounds.right)/2,y:(bounds.top+bounds.bottom)/2},blend=p.cameraReady&&target.scale>=p.scene.scale?1-Math.exp(-dt*9):1;p.cameraReady=true;p.scene.scale+=(target.scale-p.scene.scale)*blend;p.scene.x+=(target.x-p.scene.x)*blend;p.scene.y+=(target.y-p.scene.y)*blend;
 if(!p.quiet)p.scene.render(e,dt,p.castId,p.aim.power,!p.fired);
 if(!p.quiet&&p.id==='A09'&&p.canvas.getContext){const c=p.canvas.getContext('2d'),r=p.canvas.getBoundingClientRect();c.save();c.setTransform(p.canvas.width/r.width,0,0,p.canvas.height/r.height,0,0);for(const [key,color] of [['before','#d1bc83'],['after','#99d7cc']]){const points=p.trace[key];if(points.length<2)continue;c.beginPath();for(const [i,v] of points.entries()){const x=r.width/2+(v.x-p.scene.x)*p.scene.scale,y=r.height/2+(v.y-p.scene.y)*p.scene.scale;i?c.lineTo(x,y):c.moveTo(x,y);}c.strokeStyle=color;c.lineWidth=2;c.stroke();}c.restore();}

 updateReadout(p);
 const noMotion=!b.projectiles.length&&!b.units.some(v=>v.meleeAction||v.aiMove||v.moveTarget!==undefined),needsFollow=['A10','M09','S13','O10','O14','O15'].includes(p.id),reaction=!p.scenario.enemy||p.enemyActions>0||p.id==='S08'&&u.martialGuard?.counter===false||['M07','M08'].includes(p.id)&&b.stakes.some(v=>v.lastTriggerRound===b.round);
 const summonDone=!s.mode.startsWith('summon')||b.units.some(v=>v.summoned&&v.summonActionRound===b.round)||p.id==='O14'&&p.follow||p.id==='O15'&&p.follow;
 if(p.passive&&p.fired&&p.age>2.4&&noMotion&&passiveResolved(p))p.finishedAt??=p.age;
 if(!p.passive&&p.fired&&p.age>2.4&&noMotion&&reaction&&summonDone&&(!needsFollow||p.follow))p.finishedAt??=p.age;
 // O05 may still be falling on a deep map; its Engine guard is120s.
 const cycleLimit=p.id==='O05'&&b.projectiles.some(q=>q.skill==='O05'&&q.wraithVersion===1)?123:(p.passive?24:22);
 if(!p.hold&&(p.finishedAt!==null&&p.age-p.finishedAt>1.3||p.age>cycleLimit)){const cycle=p.cycle+1;app.preview=setup(app,p.id,p.h,p.canvas);app.preview.cycle=cycle;}
}
function passiveResolved(p){const m=p.metrics;switch(p.passive.metric){case 'followups':return m.followups.size>0;case 'retreat':return m.retreat>100;case 'jucheon':return m.effectBoost>0;case 'harmony':return m.harmony&&m.casts.filter(v=>v.side===0).length>=4;case 'lastStand':return m.lastStand;case 'expiry':return m.expiry>0;case 'remnants':return m.soulBoost;case 'trap':return m.traps>0&&m.curse>0;case 'marked':return m.summons>0&&m.hits.some(v=>String(v.source).startsWith('summon'));case 'share':return m.sharedDamage>0;case 'shield':return m.shield>0;case 'focus':return p.b.phase!=='flight';case 'jump':return m.jump>0&&p.e.grounded(p.hero);case 'mana':return p.b.round>=2;default:return m.damage>0;}}
function snapshot(p){const m=p.metrics;return {camera:{scale:p.scene.scale,x:p.scene.x,y:p.scene.y,actorPixels:p.hero.h*p.scene.scale},id:p.id,cast:p.castId,age:p.age,fired:p.fired,follow:p.follow,turns:p.turns,kind:p.scenario.kind,rank:p.hero.ranks[p.id]||0,initial:p.initial,terrain:p.b.terrain.map(t=>({id:t.id,mat:t.mat,hp:t.hp,broken:!!t.broken})),hero:{hp:p.hero.hp,focus:p.hero.focus,maxHp:p.hero.maxHp,maxFocus:p.hero.maxFocus,x:p.hero.x,y:p.hero.y,critChance:p.hero.critChance,critMultiplier:p.hero.critMultiplier,dead:p.hero.dead},targets:p.b.units.filter(u=>u.id.startsWith('preview-target')).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,maxHp:u.maxHp,armor:u.curseArmor||0,curse:u.curseTurns||0,dead:u.dead,type:u.honroType,grounded:p.e.grounded(u),flying:['bat','crow','lantern'].includes(u.honroType)&&u.fixed})),metrics:Object.fromEntries(Object.entries(m).map(([k,v])=>[k,v instanceof Set?[...v]:v])),ally:p.b.units.find(v=>v.id==='preview-ally')?{hp:p.b.units.find(v=>v.id==='preview-ally').hp,focus:p.b.units.find(v=>v.id==='preview-ally').focus,move:p.b.units.find(v=>v.id==='preview-ally').moveLeft}:null,jumpCost:p.jumpCost,control:p.control?snapshot(p.control):null};}
function describe(p){const m=p.metrics,q=p.control,number=x=>Math.round(x*100)/100,compare=(a,b)=>`${number(a)} → ${number(b)}`;
 if(q){const c=q.metrics;switch(p.passive.metric){
 case 'critical':return `치명 확률 ${compare(q.hero.critChance*100,p.hero.critChance*100)}% · 배율 ${compare(q.hero.critMultiplier,p.hero.critMultiplier)}`;
 case 'mana':return `최대 기력 ${compare(q.hero.maxFocus,p.hero.maxFocus)} · 현재 기력 ${compare(q.hero.focus,p.hero.focus)}`;
 case 'durability':return `최대 체력 ${compare(q.hero.maxHp,p.hero.maxHp)} · 남은 체력 ${compare(q.hero.hp,p.hero.hp)}`;
 case 'lastStand':return `미적용 체력 ${number(q.hero.hp)} · 적용 체력 ${number(p.hero.hp)}${m.lastStand?' · 불굴 발동':''}`;
 case 'jump':return `도약 높이 ${compare(c.jump,m.jump)} · 소비 이동력 ${compare(q.jumpCost||0,p.jumpCost||0)}`;
 case 'focus':return `남은 기력 ${compare(q.hero.focus,p.hero.focus)}`;
 case 'shield':return `부여한 방호 ${compare(c.shield,m.shield)}`;
 case 'followups':return `후속 화살 ${compare(c.followups.size,m.followups.size)}발`;
 case 'retreat':return `사격 후 후퇴 ${compare(c.retreat,m.retreat)}`;
 case 'jucheon':return `소비 기력 누적 ${number(m.jucheon)}${m.jucheonReady?' · 주천 완성':''}${m.effectBoost?' · 강화 도술 발사':''}`;
 case 'harmony':return `${m.harmony?'합세 완성':'검술·돌격·검기를 준비'} · 누적 피해 ${compare(c.damage,m.damage)}`;
 case 'trap':return `잔부 ${m.traps?'생성':'준비'} · 주박 ${m.curse}턴 · 피해 ${compare(c.damage,m.damage)}`;
 case 'expiry':return `소멸 회수 기력 +${number(m.expiryRecovered)} · 다음 초혼 비용 ${m.expiry?Math.round(m.expiry*100)+'% 감소':'대기'}`;
 case 'share':return `남은 체력 ${compare(q.hero.hp,p.hero.hp)} · 소환령 분담 ${number(m.sharedDamage)}`;
 case 'remnants':return `모은 잔혼 ${m.remnants}/3${m.soulBoost?' · 다음 혼행 강화':''} · 피해 ${compare(c.damage,m.damage)}`;
 default:return `누적 피해 ${compare(c.damage,m.damage)}`;}}
 if(p.id==='A09')return `${p.turns?'한 번 꺾음 · 황색: 이전 / 청록: 이후':'올려 쏜 뒤 한 번 꺾습니다'} · 명중 피해 ${number(m.damage)}`;
 if(p.id==='A06')return `체력 ${compare(p.initial.hero.hp,p.hero.hp)} · 기력 회수 +${number(Math.max(0,p.hero.focus-p.initial.hero.focus+(m.casts[0]?.cost||0)))} · 피해 ${number(m.damage)}`;
 if(p.id==='A10')return `${p.hero.prepared?'집중 준비 완료':m.prepared?'집중을 소비한 강화 사격':'집중 준비 전'} · 피해 ${number(m.damage)}`;
 if(p.id==='S02')return `체력 ${compare(p.initial.hero.hp,p.hero.hp)} · 피해 ${number(m.damage)}`;
 if(p.id==='S08')return `체력 ${compare(p.initial.hero.hp,p.hero.hp)} · ${m.counter?'반격 발동':m.guard?'방어 준비':'회복·방어 전'} · 피해 ${number(m.damage)}`;
 if(p.id==='S04')return `${p.follow?'추가 입력으로 급강하':'도약 후 추가 입력 대기'} · 피해 ${number(m.damage)}`;
 if(p.id==='S13')return `${p.follow?'착지 후 후속 베기 입력':'착지 후 후속 입력 대기'} · 피해 ${number(m.damage)}`;
 if(p.id==='O06'){const t=p.b.units[1];return `공격 위력 ${compare(p.e.effective(C.SKILLS.LA01,{...t,curseAttack:0}).damage,p.e.effective(C.SKILLS.LA01,t).damage)} · 방어 ${compare(t.armor*100,Math.max(0,t.armor-(t.curseArmor||0))*100)}% · ${t.curseTurns||0}턴`;}
 if(p.id==='O08'){const ally=p.b.units.find(v=>v.id==='preview-ally');return `소단은 혼령을 봅니다 · 동행의 자동조준 ${p.e.guidanceTarget(ally,p.b.units[1])?'가능':'불가'} · 현형 ${m.manifest?'발동':'전'}`;}
 if(p.id==='O14')return `포획 ${p.b.units.filter(v=>v.eaterCapturedBy).length}명 · 포획 적에게 전달한 피해 ${number(m.damage)}`;
 if(p.id==='M10'||p.id==='O13'){const ally=p.b.units.find(v=>v.id==='preview-ally');return `동행 체력 300 → ${number(ally?.hp||300)} · 기력 20 → ${number(ally?.focus||20)}${p.id==='M10'?` · 이동력 100 → ${number(ally?.moveLeft||100)}`:` · 방호 ${number(m.shield)}`}`;}
 if(p.id==='M09')return `진목 ${m.stakes}/2 · ${p.follow?'이동 완료':'두 진목 사이를 건너갑니다'}`;
 return `${p.scenario.kind} · 명중 ${new Set(m.hits.filter(v=>v.target.startsWith('preview-target')).map(v=>v.target)).size}명 · 피해 ${number(m.damage)}${m.summons?' · 소환 '+m.summons:''}`;
}
const activeLabels={single:'기본 발사',distance:'먼 표적 정밀 사격',execution:'먼 거리의 약해진 적',line:'일렬 관통',recovery:'명중 후 체력·기력 회수',prepare:'집중 후 강화 사격',apex:'최고점 이후 낙하',offset:'높은 발판의 표적 추적',return:'나가는 길과 돌아오는 길',push:'적을 밀어 뒤의 적과 충돌',spread:'비행 군집에 펼치는 부채꼴',break:'파괴 가능한 목재', 'ground-chain':'적 사이 연속 도약',fragments:'명중 뒤 파편', 'delayed-burst':'착탄 뒤 후속 폭발','bounce-ice':'반사 뒤 재입력 폭발',lightning:'군집에 연결되는 번개',sky:'착탄 뒤 수직 천뢰',arc:'충돌 방향의 양옆 원호',reflection:'벽·천장 반사',ring:'원주 타격 · 중심은 안전',bagua:'팔각형과 기선',trap:'진목을 밟은 적',lure:'진목 쪽으로 유인',prison:'봉쇄 경계 통과', 'healing-stake':'손상된 동행이 진목 이용',gate:'진목 사이 상호작용',melee:'전방 베기',turn:'앞뒤 베기',combo:'처치 후 다음 적으로 연속 베기',counter:'회복·방어 후 적 공격에 반격',life:'체력을 써서 일격 강화',rush:'비행 중 베고 착지',sweep:'비행 경로 연속 베기','ground-air':'지상 적 운반·비행 적 통과',pull:'적을 끌어온 뒤 베기','burst-blade':'충돌점에서 수직 검압',orbit:'공전하는 검기의 다중 명중','phase-wall':'벽을 통과하는 혼행','reverse-rain':'위로 솟은 뒤 원혼비','reverse-path':'원래 궤적을 거슬러 귀환',weakness:'공격·방어 약화',betrayal:'적의 공격 대상 변경',manifest:'숨은 혼령 현형',enthrall:'적을 동맹으로 섭혼',earthbound:'저주 후 사망한 자리에 지박령',summon:'소환 뒤 소환령의 차례',warden:'동행 방호·회복',eater:'포획 후 먹귀 피해 전달',echo:'소환 뒤 혼행 동시 사격',converge:'흩어졌다 귀결점으로 모이는 혼령'};
function updateReadout(p){const el=p.canvas.closest?.('.skill-preview-shell')?.querySelector('.preview-observation');if(!el)return;const text=`${p.scenario.label||activeLabels[p.scenario.kind]||'격리 시연'} · ${C.SKILLS[p.id].passive?'미적용 → 적용 비교 · ':''}${describe(p).replace(p.scenario.kind+' · ','')}`;if(el.textContent!==text)el.textContent=text;}
G.HonroSkillPreview={setup,tick,scenarios,passiveScenarios,snapshot,describe};
})(globalThis);
