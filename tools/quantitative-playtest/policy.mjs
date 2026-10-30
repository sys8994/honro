/** State-reactive input policy. No battle clones, damage forecasts or saved route tapes. */
export const CONTRACT=Object.freeze({version:'pilot-controller-v6-public-objective-exploration-calibration',status:'calibration-not-holdout',navigation:'public support graph; physics-only body locomotion checks; no combat clone, hidden actor or authored path tape',policies:['ranged-hold','advance','high-route','gimmick','companions'],angleErrorDegrees:6,powerError:.07,maxCombatRounds:20,snapshotFrames:120,preview:'ordinary Engine.predict points only; 25 fixed aim candidates per action',entry:'plan(stage).entryLevel, six legal stat investments, three legal training attempts per chosen skill, default starter equipment; no earned-history claim'});
export function objective(b,u,stage,publicState={}){
 if(publicState.requiresThreatSearch)return {x:u.x,y:u.y,kind:"search-threats",remainingThreats:publicState.remainingThreats,source:"public-objective-instruction"};
 const q=b.honroAct4PreviewState||{},cfg=b.honroAct4Design||{};
 if(stage===39){const r=cfg.rescue;if(r){if(!q.exitStable)return {...r.anchor,kind:'stabilize'};if(!q.netOpen)return {...r.net,kind:'release-net'};return {x:r.exit-100,y:r.net.y,kind:'rescue-exit'};}}
 if(stage===31){
  const c=cfg.boarding||{},live=b.terrain?.find(t=>t.id==='a4-boat-deck'&&!t.broken),deck=live||{x:c.deckX,y:c.deckY,w:c.deckW};
  if(![deck.x,deck.y,deck.w].every(Number.isFinite)||deck.w<=0)return {x:u.x,y:u.y,kind:'objective-unavailable',reason:'No current authored boarding geometry or observed boat deck'};
  const margin=(u.r||20)+8,left=Math.max(deck.x+margin,Number.isFinite(c.boardX1)?c.boardX1+8:-Infinity),right=Math.min(deck.x+deck.w-margin,Number.isFinite(c.boardX2)?c.boardX2-8:Infinity);
  if(right<=left)return {x:u.x,y:u.y,kind:'objective-unavailable',reason:'Observed/authored boarding interval has no usable interior'};
  const party=b.units.filter(v=>v.side===0&&!v.summoned&&!v.dead&&v.hp>0&&v.id===v.cls),index=Math.max(0,party.findIndex(v=>v.id===u.id));
  return {x:left+(right-left)*(index+1)/(party.length+1),y:deck.y,kind:'board',source:live?'observed-boat-deck':'authored-boarding',boatPhase:q.boat?.phase};
 }
 if(cfg.exit)return {...cfg.exit,x:cfg.exit.x-100,kind:'exit'};
 return {x:b.honroMapAnchors?.shotGap?.x??u.x,y:u.y,kind:'objective'};
}
export function foesFor(b,u,stage,view,isVisible=()=>true){
 if(!view||![view.left,view.right,view.top,view.bottom].every(Number.isFinite))return [];
 return b.units.filter(v=>v.side===1&&!v.dead&&v.hp>0&&!v.eaterCapturedBy&&!v.honroObjectiveTarget&&!v.hidden&&isVisible(v)&&!(stage===39&&v.id==='a4-wreck')&&v.x+(v.r||20)>=view.left&&v.x-(v.r||20)<=view.right&&v.y>=view.top&&v.y-(v.h||80)<=view.bottom).sort((a,c)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y));
}
export function movementGoal(b,u,target,stage,policy,publicState={}){
 const goal=objective(b,u,stage,publicState),priority=stage===39&&(policy==='gimmick'||!target||Math.abs(target.x-u.x)>650);
 let p=target&&!priority?{x:target.x,y:target.y,kind:'enemy'}:goal;
 if(policy==='high-route'&&target){const dir=Math.sign(p.x-u.x);const t=b.terrain.filter(t=>!t.broken&&t.w&&Math.sign(t.x+t.w/2-u.x)===dir&&Math.abs(t.x+t.w/2-u.x)<500&&t.y<u.y-50&&t.y>u.y-260).sort((a,c)=>Math.abs(a.x+a.w/2-u.x)-Math.abs(c.x+c.w/2-u.x))[0];if(t)p={x:t.x+t.w/2,y:t.y,kind:'high-route'};}
 return p;
}
export function previewAim(e,u,skill,target,random){
 let best={score:Infinity,angle:35,power:.6};
 for(const angle of [-10,15,35,55,75])for(const power of [.25,.42,.59,.76,.93]){
  const global=u.facing>=0?angle:180-angle,p=e.predict(u,skill,global,power);
  const score=Math.min(...[...(p.points||[]),p].map(v=>Math.hypot(v.x-target.x,v.y-(target.y-target.h*.5))));
  if(score<best.score)best={score,angle,power};
 }
 return {angle:Math.max(-85,Math.min(90,best.angle+(random()-.5)*12)),power:Math.max(.15,Math.min(.98,best.power+(random()-.5)*.14)),previewDistance:best.score};
}
export function selectSkill(e,u,skills,policy){
 let order=policy==='companions'&&u.cls!=='archer'?[...u.loadout].reverse():[...u.loadout];
 if(policy==='ranged-hold'&&u.cls==='knight')order=['S06',...order.filter(id=>id!=='S06')].filter(id=>u.loadout.includes(id));
 return order.find(id=>{const s=skills[id];return s&&!s.passive&&e.skillAllowed(s,u)&&e.canAfford(s,u,0)&&e.cooldownLeft(u,id)<=0;});
}
export function engagementDistance(policy,u,skill){
 if(skill?.mode==='melee')return Math.max(70,skill.radius*.8);
 return policy==='ranged-hold'?1800:policy==='companions'&&u.cls==='knight'?250:800;
}
