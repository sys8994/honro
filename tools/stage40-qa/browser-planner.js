op=>{const app=HonroApp,e=app.engine,b=e.b,g=window,C=HONRO_CORE,actions=[],assert={equal(a,z,m){if(a!==z)throw Error(m)}};const foes=()=>b.units.filter(v=>v.side===1&&!v.dead&&v.hp>0),heroes=()=>b.units.filter(v=>v.side===0&&!v.summoned&&!v.honroAct4Resident),surface=u=>e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id||u.honroEncounterSupport;
/** Planner-only current-state rollout. Never changes live state or advances enemy
 * turns. Evaluates the complete physical projectile chain, not one endpoint. */
function evaluateLegalCast(C,b,actorId,id,angle,power,{maxSteps=1440}={}){
 const beforeText=JSON.stringify(b),sim=new C.Engine(JSON.parse(beforeText),()=>{},true),u=sim.unit(actorId),before=new Map(sim.b.units.map(v=>[v.id,{hp:v.hp,shield:v.shield||0,side:v.side}])),hits=[];
 if(sim.active?.id!==actorId)return {legal:false,reason:'not-active'};
 const hurt=sim.hurt.bind(sim);sim.hurt=(v,...args)=>{const old=v.hp,shield=v.shield||0,out=hurt(v,...args);if(old!==v.hp||shield!==(v.shield||0))hits.push({id:v.id,side:v.side,hp:Math.max(0,old-v.hp),shield:Math.max(0,shield-(v.shield||0)),source:args[1]});return out;};
 if(!sim.fire(id,angle,power))return {legal:false,reason:'cast-rejected'};
 let steps=0;while(sim.b.projectiles.length&&steps<maxSteps){for(const p of [...sim.b.projectiles])if(sim.b.projectiles.includes(p))sim.stepProjectile(p,C.STEP);steps++;}
 let enemyDamage=0,friendlyDamage=0;const targets=[];for(const v of sim.b.units){const old=before.get(v.id);if(!old)continue;const loss=Math.max(0,old.hp-v.hp)+Math.max(0,old.shield-(v.shield||0));if(v.side!==u.side&&loss){enemyDamage+=loss;targets.push(v.id);}else if(v.id!==u.id)friendlyDamage+=loss;}
 if(JSON.stringify(b)!==beforeText)throw Error('Detached planner mutated live battle');
 return {legal:true,complete:sim.b.projectiles.length===0,steps,enemyDamage,friendlyDamage,targets,hits,landing:{x:u.x,y:u.y,dead:u.dead},safe:sim.b.projectiles.length===0&&friendlyDamage===0};
}
/** Current visible encounter roles; no round-scripted kills or future state. */
function finaleRoleGoal(u,{support,foes,surface}){
 const rear=foes.filter(v=>v.id.startsWith('final40-dock-left-'));
 const dock=foes.filter(v=>/final40-(dock-(left|right|stair)|departure-upper)-/.test(v.id));
 const role=['knight','occultist'].includes(u.cls)?'rear':u.cls==='archer'?'overwatch':'dock-front';
 if(support==='approved40-dock-stair'&&dock.length){
  if(role==='overwatch')return{x:2120,kind:'separate-overwatch-lane',hold:true};
  return{x:1800,kind:'rear-role-descend'};
 }
 if(support==='approved40-dock'&&dock.length&&role==='dock-front')return{x:2050,kind:'separate-dock-front-lane',hold:true};
 if(support==='approved40-dock'&&rear.length){
  if(role==='rear'){const targets=rear.toSorted((a,z)=>Math.abs(a.x-u.x)-Math.abs(z.x-u.x)),t=targets[0],spacing=u.cls==='knight'?130:360;return{x:t.x+(t.x>=u.x?-spacing:spacing),target:t.id,kind:'rear-flank-clear'};}
  return{x:u.cls==='archer'?2000:2200,kind:'recover-overwatch-lane',hold:true};
 }
 // Only after both flanks are resolved should everyone descend toward the boss.
 if(support==='approved40-dock'&&dock.length&&role==='overwatch')return{x:2000,kind:'hold-lower-approach',hold:true};
 return null;
}
/** QA policy only: existing dock/stair positions independently demonstrated in
 * actual saved-profile browser play. Uses living current actors, never rounds. */
function splitDockRoleGoal(u,{support,foes,heroes,surface,departedOverwatch=false}){
 const dock=foes.filter(v=>!v.dead&&v.hp>0&&['approved40-dock','approved40-dock-stair'].includes(surface(v)));
 if(!dock.length)return null;
 if(u.cls==='archer'){
  if(departedOverwatch)return null;
  if(support==='approved40-dock')return{x:1900,jumpLanding:'approved40-dock-stair',kind:'split-overwatch-connection'};
  if(support==='approved40-dock-stair')return{x:2120,kind:'split-overwatch-fire',hold:true};
 }
 if(support!=='approved40-dock')return null;
 if(u.cls==='mage')return{x:2152,kind:'split-front-fire',hold:true};
 if(u.cls==='occultist'){
  const frontNeedsSupport=heroes.some(v=>v.id!==u.id&&!v.dead&&v.hp>0&&v.hp<v.maxHp*.65&&v.x>1400&&Math.hypot(v.x-u.x,v.y-u.y)>600);
  const rear=dock.some(v=>v.x<1400);
  return{x:frontNeedsSupport||!rear?1630:1050,kind:frontNeedsSupport?'split-support-rejoin':rear?'split-rear-fire':'split-forward-support',hold:true};
 }
 return null;
}
/** QA movement policy: one forward flank using only present visible geometry.
 * Never force all roles to attack; a useful current-facing shot takes priority. */
function coastFlankGoal(u,{support,foes,heroes,surface,topAt,terrains}){
 if(u.cls==='knight'||support!=='approved40-coast-west'||u.moveLeft<350)return null;
 const target=foes.filter(v=>!v.dead&&v.hp>0&&surface(v)===support&&v.x>=u.x).sort((a,z)=>a.x-z.x)[0];if(!target)return null;
 const terrain=terrains.find(t=>t.id===support);if(!terrain)return null;
 const base=target.x+280;
 for(const x of [base,base+160,base+320]){
  // topAt clamps outside bounds; finite height is not proof of contact.
  const radius=u.r||24;if(x<terrain.x+radius||x>terrain.x+terrain.w-radius)continue;
  const y=topAt(terrain,x);if(surface({x,y})!==support||!Number.isFinite(y)||Math.hypot(x-u.x,y-u.y)>u.moveLeft-100)continue;
  if(heroes.some(v=>v.id!==u.id&&!v.dead&&v.hp>0&&Math.hypot(v.x-x,v.y-y)<(u.r||24)+(v.r||24)+70))continue;
  return{x,y,target:target.id,kind:'observed-coast-flank'};
 }
 return null;
}
/** Formation uses only current observed units/supports and visible tide state. */
function tideRetreatRequired(b,u){const t=b.honroAct4PreviewState?.tide,cfg=b.honroAct4Design?.tide;return !!t&&!!cfg&&u.y>=cfg.high-50&&(t.phase==='high'||t.phase==='rising'&&b.round>=t.highRound-1);}
function deckEntryUnsafe(b){const t=b.honroAct4PreviewState?.tide;return !!t&&(t.phase==='high'||t.phase==='rising'&&b.round>=t.highRound-1);}
function tideRefuge(cls){return {knight:1550,occultist:1670,mage:1820,archer:1960}[cls]||1800;}
function finaleDeckGoal(u,{b,support,foes,surface}){
 const danger=tideRetreatRequired(b,u),t=b.honroAct4PreviewState?.tide;
 if((danger||t?.phase==='high')&&support==='approved40-departure-stair')return{x:tideRefuge(u.cls),kind:'visible-tide-refuge',hold:true};
 if(u.cls==='knight')return null;
 if(support==='approved40-dock-stair')return{x:1800,kind:'front-team-descend'};
 if(support==='approved40-dock'){
  const front=foes.filter(v=>surface(v)===support&&v.x>=1450&&Math.abs(v.y-u.y)<500).sort((a,z)=>Math.abs(a.x-u.x)-Math.abs(z.x-u.x));
  if(front.length){const v=front[0],spacing=u.cls==='occultist'?360:300;return{x:Math.max(1600,v.x+(v.x>=u.x?-spacing:spacing)),target:v.id,kind:'front-dock-clear'};}
  if(deckEntryUnsafe(b))return{x:2050,kind:'visible-tide-no-descent',hold:true};
  return{x:2200,drop:true,driftRight:true,kind:'ordinary-deck-drop'};
 }
 if(support==='a4-return-deck')return{x:{mage:2480,archer:2800,occultist:2260}[u.cls],kind:'wide-deck-firing-lane',hold:true};
 if(['approved40-departure-stair','approved40-departure-ramp'].includes(support))return{x:2480,kind:'join-wide-deck'};
 return null;
}
/** React only to an already rendered current warning, not future enemy plans. */
function currentWarnings(b){return b.units.filter(u=>u.side===1&&!u.dead).map(u=>({source:u.id,target:u.honroPilotCombat?.target})).filter(x=>x.target?.seen);}
function warningEscapeGoal(e,u,{surface,separated}){
 const threats=currentWarnings(e.b).filter(x=>Math.hypot(u.x-x.target.x,(u.y-u.h*.5)-x.target.y)<230);
 if(!threats.length)return null;const support=surface(u),connected=new Set(['approved40-departure-ramp','a4-return-deck']),options=[];
 for(const dx of [-270,270,-360,360,-450,450,-540,540,-630,630,-720,720]){const x=u.x+dx,f=e.contactSurface(x,u.y-320,u.y+320);if(!f)continue;const id=f.t.id,y=f.y;
  if(id!==support&&!(connected.has(id)&&connected.has(support)))continue;
  if(Math.hypot(dx,y-u.y)>u.moveLeft-60||!separated(e.b,u,x,y,12))continue;
  if(threats.some(x0=>Math.hypot(x-x0.target.x,(y-u.h*.5)-x0.target.y)<230))continue;
  options.push({x,y,kind:'seen-warning-evade',sources:threats.map(t=>t.source),support:id});
 }
 // Prefer supported uphill space; never create a jump/drop/teleport to escape.
 return options.sort((a,z)=>a.y-z.y||Math.abs(a.x-u.x)-Math.abs(z.x-u.x))[0]||null;
}
/** Pursue a previously engaged upper foe through actual support connections.
 * Never steer horizontally toward an upper target while standing below it. */
function upperConnectionGoal(u,support){
 if(support==='a4-return-deck')return{x:2350,deckJoin:true,kind:'upper-recovery-deck-join'};
 if(support==='approved40-departure-stair')return{x:1460,jumpLanding:'approved40-dock',kind:'upper-recovery-land-on-dock'};
 if(support==='approved40-dock')return{x:1900,jumpLanding:'approved40-dock-stair',kind:'upper-recovery-land-on-stair'};
 if(support==='approved40-dock-stair')return{x:2660,jumpLanding:'approved40-coast-west',kind:'upper-recovery-land-on-coast'};
 return null;
}

function upperRecoveryGoal(u,{support,foes,surface}){if(!foes.length||!foes.every(v=>surface(v)==='approved40-coast-west'&&v.y<=2500))return null;return upperConnectionGoal(u,support);}
/** Current observed living foes only: leave the boss deck once no enemy remains
 * there. This is a controller route, not a new stage objective or terrain rule. */
function dockCleanupGoal(u,{support,foes,surface}){
 if(!foes.length||!foes.every(v=>['approved40-dock','approved40-dock-stair'].includes(surface(v))))return null;
 if(support==='a4-return-deck')return{x:2350,deckJoin:true,kind:'dock-cleanup-deck-join'};
 if(support==='approved40-departure-stair')return{x:1460,jumpLanding:'approved40-dock',kind:'dock-cleanup-land-on-dock'};
 if(support==='approved40-dock'){
  const target=[...foes].sort((a,z)=>Math.abs(a.x-u.x)-Math.abs(z.x-u.x))[0];
  const spacing={archer:320,mage:380,occultist:440,knight:145}[u.cls]||320;
  return{x:target.x+(target.x>=u.x?-spacing:spacing),target:target.id,kind:'dock-cleanup-same-level'};
 }
 return null;
}

/** QA-controller current-state sensitivity screen, not player-visible certainty.
 * Uses only current observed battle, skill physics and a bounded input envelope.
 * Sampling cannot prove safety for every intermediate angle/charge or future turn. */
function evaluateInputTolerance(C,b,actorId,id,angle,power,nominal){
 const offsets=[[0,-.10],[0,-.03],[0,-.01],[0,0],[0,.01],[0,.03],[0,.10],[-1,0],[1,0]],samples=[];
 for(const [da,dp] of offsets){const test=da===0&&dp===0&&nominal?nominal:evaluateLegalCast(C,b,actorId,id,Math.max(-85,Math.min(265,angle+da)),Math.max(0,Math.min(1,power+dp)));
  samples.push({angleOffset:da,powerOffset:dp,safe:test.safe===true,damage:test.enemyDamage||0,friendlyDamage:test.friendlyDamage||0});
  if(!test.safe||!(test.enemyDamage>0))return{safeUseful:false,minimumDamage:0,samples,scope:'bounded current-state samples; not a player-visible guide or universal guarantee'};
 }
 return{safeUseful:true,minimumDamage:Math.min(...samples.map(s=>s.damage)),samples,scope:'bounded current-state samples; not a player-visible guide or universal guarantee'};
}
function routeGoal(u,{departedOverwatch=false}={}){const support=surface(u),role=splitDockRoleGoal(u,{support,foes:foes(),heroes:heroes(),surface,departedOverwatch})||dockCleanupGoal(u,{support,foes:foes(),surface})||upperRecoveryGoal(u,{support,foes:foes(),surface})||finaleDeckGoal(u,{b,support,foes:foes(),surface})||(u.cls==='knight'?finaleRoleGoal(u,{support,foes:foes(),surface}):null);if(role)return role;const same=foes().filter(v=>surface(v)===support&&Math.abs(v.y-u.y)<700),spacing=u.cls==='knight'?145:310;
 if(same.length){const t=same.sort((a,z)=>Math.abs(a.x-u.x)-Math.abs(z.x-u.x))[0];return{x:t.x+(t.x>=u.x?-spacing:spacing),target:t.id,kind:'same-support-approach'};}
 if(support==='approved40-coast-west')return{x:2660,drop:true,kind:'coast-to-stair'};
 if(support==='approved40-dock-stair')return{x:1800,kind:'stair-to-dock'};
 if(support==='approved40-dock')return{x:1600,drop:true,kind:'dock-to-departure'};
 if(['approved40-departure-stair','approved40-departure-ramp','a4-return-deck'].includes(support)){
  const below=foes().filter(v=>v.y>=u.y-500);if(below.length){const t=below.sort((a,z)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(z.x-u.x,z.y-u.y))[0];return{x:t.x+(t.x>=u.x?-spacing:spacing),target:t.id,kind:'lower-approach'};}return{x:1445,kind:'return-upper-remaining'};}
 return null;
}
function plan(requiredFacing=null){const u=e.active,live=JSON.stringify(b),pe=new C.Engine(JSON.parse(live),()=>{},true),pu=pe.unit(u.id);let best=null;
 const visible=pe.b.units.filter(v=>v.side===1&&!v.dead&&Math.abs(v.y-pu.y)<=600&&Math.hypot(v.x-pu.x,v.y-pu.y)<1400).sort((a,z)=>Math.hypot(a.x-pu.x,a.y-pu.y)-Math.hypot(z.x-pu.x,z.y-pu.y)).slice(0,6);
 const value=(skill,hit)=>{const eff=pe.effective(skill,pu),r=Math.max(1,eff.radius||0);let score=0;for(const v of visible){const direct=hit.unit===v.id,d=pe.damageDistance(v,hit);if(!direct&&d>=r+v.r)continue;const armor=v.role==='guard'?((pu.x-v.x)*v.facing>0?.4:.05):Math.max(0,v.armor-(v.curseArmor||0)),factor=direct?1:.42+.58*(1-Math.max(0,Math.min(1,d/r)));score+=Math.min(v.hp+(v.shield||0),eff.damage*factor*(1-Math.min(.7,armor))*C.existenceMultiplier(C.attackForSkill(skill),v,pu));}return score;};
 function consider(x){if(requiredFacing!==null&&(x.angle>90?-1:1)!==requiredFacing)return;if(!(x.score>0&&(!best||x.score>best.score)))return;const complete=evaluateLegalCast(C,b,u.id,x.id,x.angle,x.power);if(!complete.safe){actions.push({op:'reject-unsafe-cast',round:b.round,hero:u.id,skill:x.id,angle:x.angle,power:x.power,reason:complete,scope:'detached-current-state-rollout'});return;}x.fullCast={damage:complete.enemyDamage,targets:complete.targets};if(complete.enemyDamage>0){const tolerance=evaluateInputTolerance(C,b,u.id,x.id,x.angle,x.power,complete);if(!tolerance.safeUseful){actions.push({op:'reject-input-sensitive-cast',round:b.round,hero:u.id,skill:x.id,angle:x.angle,power:x.power,tolerance});return;}x.nominalScore=complete.enemyDamage;x.score=tolerance.minimumDamage;x.inputTolerance=tolerance;if(!best||x.score>best.score)best=x;}}
 for(const id of pu.loadout){const s=C.SKILLS[id];if(!s||s.passive||['O13','S08'].includes(id)||!pe.skillAllowed(s,pu)||pe.cooldownLeft(pu,id)>0)continue;
  if(id==='S00'){for(const t of visible){let angle=Math.atan2(pu.y-pu.h*.58-(t.y-t.h*.5),t.x-pu.x)*180/Math.PI;if(angle< -90)angle+=360;for(const power of [1,.7,.2]){if(!pe.canAfford(s,pu,power))continue;const targets=visible.filter(v=>C.meleeContains(pe,pu,v,C.meleeRange(pu,s,power),-angle*Math.PI/180,C.meleeSpan(pu,s,power)));if(!targets.length)continue;const score=targets.reduce((sum,v)=>sum+Math.min(v.hp,pe.effective(s,pu).damage*C.existenceMultiplier(C.attackForSkill(s),v,pu)),0);consider({id,angle,power,score,targets:targets.map(v=>v.id),method:'native-melee-envelope'});}}continue;}
  for(const t of visible.slice(0,id==='S06'?3:5))for(const aim of pe.shotSeeds(pu,s,t).slice(0,id==='S06'?3:6)){
   if(!pe.canAfford(s,pu,aim.power))continue;
   if(id==='S06'||id==='S01'){
    // Exact legal cast on isolated current state. No synthetic MP, grounded,
    // loadout, cooldown, position or active-turn changes even in this clone.
    const sim=new C.Engine(JSON.parse(live),()=>{},true),su=sim.unit(pu.id),before=new Map(sim.b.units.map(v=>[v.id,{hp:v.hp,shield:v.shield||0,side:v.side}]));
    if(!sim.fire(id,aim.angle,aim.power))continue;
    for(let i=0;i<1440&&sim.b.projectiles.length;i++)for(const p of [...sim.b.projectiles])if(sim.b.projectiles.includes(p))sim.stepProjectile(p,C.STEP);
    let score=0,risk=0;const targets=[];for(const v of sim.b.units){const z=before.get(v.id);if(!z)continue;const loss=Math.max(0,z.hp-v.hp)+Math.max(0,z.shield-(v.shield||0));if(z.side===1&&loss){score+=loss;targets.push(v.id);}else if(v.id!==pu.id)risk+=loss;}
    if(!risk&&su.y<3762.5&&Number.isFinite(su.x)&&!su.dead)consider({id,...aim,score,targets,landing:{x:su.x,y:su.y},method:'isolated-legal-native-rush'});continue;
   }
   const v=C.shotViable(pe,pu,s,t,aim.angle,aim.power);if(v.ok&&v.risk<.5)consider({id,...aim,score:value(s,v.hit),target:t.id,method:'detached-physical-endpoint'});
  }
 }
 assert.equal(JSON.stringify(b),live,'Planner mutated live state');return best;
}
function healing(){const u=e.active,id='O13',s=C.SKILLS[id];if(u.cls!=='occultist'||!u.loadout.includes(id)||e.cooldownLeft(u,id)||b.units.some(v=>v.summoned&&!v.dead&&v.summonOwner===u.id&&v.summonKind==='warden'))return null;
 const ally=heroes().filter(v=>!v.dead&&v.hp<v.maxHp*.6&&Math.hypot(v.x-u.x,v.y-u.y)<650).sort((a,z)=>a.hp/a.maxHp-z.hp/z.maxHp)[0];if(!ally)return null;
 const snap=JSON.stringify(b),pe=new C.Engine(JSON.parse(snap),()=>{},true),pu=pe.unit(u.id),t={...pe.unit(ally.id),x:ally.x+(ally.x<u.x?70:-70),h:1,r:1};let choice=null;
 for(const aim of pe.shotSeeds(pu,s,t)){if(!pe.canAfford(s,pu,aim.power))continue;const hit=pe.predict(pu,s,aim.angle,aim.power,t,false),d=Math.hypot(hit.x-t.x,hit.y-t.y);if(d<180&&(!choice||d<choice.d))choice={id,...aim,d,target:ally.id,method:'support-warden'};}
 assert.equal(JSON.stringify(b),snap);return choice;
}
if(op==='return-goal')return upperConnectionGoal(e.active,surface(e.active));if(op==='tide')return tideRetreatRequired(b,e.active)?{refuge:tideRefuge(e.active.cls)}:null;if(op==='coast-flank')return coastFlankGoal(e.active,{support:surface(e.active),foes:foes(),heroes:heroes(),surface,topAt:C.topAt,terrains:b.terrain});if(op==='warning-goal')return warningEscapeGoal(e,e.active,{surface,separated:g.HonroTerrain.separated});if(op==='goal-no-overwatch')return warningEscapeGoal(e,e.active,{surface,separated:g.HonroTerrain.separated})||routeGoal(e.active,{departedOverwatch:true});if(op==='goal')return warningEscapeGoal(e,e.active,{surface,separated:g.HonroTerrain.separated})||routeGoal(e.active);if(op==='priority')return currentWarnings(b).map(w=>e.unit(w.target.id)).find(u=>u&&!u.dead&&!u.acted&&u.side===0)?.id;const u=e.active,requiredFacing=op==='plan-faced'?u.facing:null;let support=healing();if(support&&requiredFacing!==null&&(support.angle>90?-1:1)!==requiredFacing)support=null;let choice=support||plan(requiredFacing);if(u.cls==='knight'&&u.hp<u.maxHp*.35&&(!choice||choice.score<350)&&u.loadout.includes('S08')&&!e.cooldownLeft(u,'S08')&&e.canAfford(C.SKILLS.S08,u,.2))choice={id:'S08',angle:u.facing>0?0:180,power:.2,method:'low-health-response'};return{choice:choice&&{...choice,idx:u.loadout.indexOf(choice.id)},rejected:actions};}