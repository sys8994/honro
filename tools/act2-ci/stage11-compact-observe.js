/* QA observation/planning only. Called through the driver's battle/profile
 * mutation guard; no Engine command, state assignment, event acknowledgement,
 * modal dismissal or global installation is permitted here. */
query => {
  const app=HonroApp,e=app.engine,b=e.b,C=HONRO_CORE,u=e.active;
  const dist=(a,z)=>Math.hypot(a.x-z.x,a.y-z.y), alive=v=>!v.dead&&v.hp>0;
  const party=b.units.filter(v=>v.side===0&&!v.summoned&&!v.summonOwner);
  const current=HonroAct2.current(b), marker=b.honroMarkers?.find(v=>v.id===current?.id);
  const memory=b.honroState?.act23v4||b.honroState?.act2||{}, physical=memory.chapter11||{};
  const sc=app.scene,r=sc.canvas.getBoundingClientRect(),lo=sc.world(0,0),hi=sc.world(r.width,r.height);
  const inView=v=>v.x>=Math.min(lo.x,hi.x)&&v.x<=Math.max(lo.x,hi.x)&&v.y>=Math.min(lo.y,hi.y)&&v.y-v.h<=Math.max(lo.y,hi.y);
  const foes=b.units.filter(v=>v.side===1&&alive(v)&&HonroAct2.visible(b,v));
  const spirits=new Set([...(physical.release?.ids||[]),...(physical.north?.ids||[])]);
  const afterClear=['11.exit','11.north'].includes(current?.id),remainingSpirits=foes.filter(v=>spirits.has(v.id));
  let targets=current?.id==='11.thread'?[]:afterClear?remainingSpirits:current?.kind==='clear'?foes.filter(v=>current.defeatIds?.includes(v.id)||spirits.has(v.id)):foes;
  targets.sort((a,z)=>Number(spirits.has(z.id))-Number(spirits.has(a.id))||dist(a,u)-dist(z,u));
  const allDone=memory.done||{},compact=HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===11)?.design?.compact11;
  // Engine.canAct is wrapped by encounter-density and offers warning receipts;
  // even that apparent query must not be called by QA observation. Read the
  // base eligibility fields plus visible modal/turn notice instead. Actual UI
  // handlers remain authoritative when a real key is sent.
  const can=b.phase==='aim'&&b.side===0&&!!u&&!u.dead&&!u.summoned&&!u.enthrall&&!u.acted&&!u.equipmentState?.motion&&!u.airborne&&(!u.platformDrop||u.platformDrop.phase==='land')&&!app.dialogue&&!app.modal.classList.contains('open')&&!app.done&&!(app.turnNotice&&performance.now()<app.turnNotice.pauseUntil);
  const state={stage:b.honroStage,width:b.width,height:b.height,revision:b.honroCampaignMapRevision,
    compactRevision:b.honroStage11CompactRevision,round:b.round,side:b.side,phase:b.phase,
    active:u?.id,cls:u?.cls,x:u?.x,y:u?.y,angle:u?.angle,facing:u?.facing,moveLeft:u?.moveLeft,
    can,grounded:!!u&&e.grounded(u),drop:!!document.getElementById('drop')&&!document.getElementById('drop').disabled,retreat:!!u?.retreat,
    support:u&&e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id,shots:b.shots,
    dialogue:!!app.dialogue,dialogueRow:app.dialogue?.lines?.[app.dialogue.index],
    modal:app.modal.classList.contains('open'),goal:current?.id,marker,done:allDone,
    enemyHpSum:foes.reduce((n,v)=>n+v.hp,0),enemies:b.units.filter(v=>v.side===1&&alive(v)).length,
    enemyUnits:b.units.filter(v=>v.side===1).map(v=>({id:v.id,hp:v.hp,dead:v.dead,source:v.honroSpawnSource})),
    health:party.map(v=>({id:v.id,cls:v.cls,x:v.x,y:v.y,hp:v.hp,maxHp:v.maxHp,shield:v.shield,
      dead:v.dead,acted:v.acted,focus:v.focus,moveLeft:v.moveLeft,level:v.level,grounded:e.grounded(v)})),
    items:b.items,physical,seed:b.seed,rng:b.rng,reason:b.winnerReason,
    gathered:HonroAct23V4Reviewed.gathered(b),
    summons:b.units.filter(v=>v.side===0&&(v.summoned||v.summonOwner)).map(v=>({id:v.id,owner:v.summonOwner,kind:v.summonKind,hp:v.hp,dead:v.dead})),
    camera:{x:sc.x,y:sc.y,scale:sc.scale,manual:sc.manual},
    targetIds:targets.map(v=>v.id),visibleTargets:targets.filter(inView).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp})),
    gather:afterClear&&!remainingSpirits.length,initialEnemies:compact?.budget?.initial,
    stored:localStorage.getItem('honro-first-act-profile-1')!==null};
  if(query.mode==='state')return state;
  if(query.mode==='source')return{stage:HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===11),battle:b,profile:app.profile};
  if(query.mode==='safe-shot'){
    const q=query.choice,s=C.SKILLS[q.id],t=e.unit(q.target);
    if(!t||!alive(t)||!e.canAfford(s,u,1))return false;
    const intersects=(a,z,v)=>{let low=0,high=1;for(const [x,d,l,h]of [[a.x,z.x-a.x,v.x-v.r-18,v.x+v.r+18],[a.y,z.y-a.y,v.y-v.h-18,v.y+18]]){if(Math.abs(d)<1e-9){if(x<l||x>h)return false;continue;}let x0=(l-x)/d,x1=(h-x)/d;if(x0>x1)[x0,x1]=[x1,x0];low=Math.max(low,x0);high=Math.min(high,x1);if(low>high)return false;}return true;};
    return [-.1,0,.1].every(d=>{const shot=C.shotViable(e,u,s,t,u.angle+d,1),points=e.predict(u,s,u.angle+d,1,t,true).points||[];
      return shot.ok&&shot.risk<.5&&shot.friendlyDamage===0&&shot.enemyDamage>0&&!b.units.filter(v=>v.side===0&&alive(v)&&v.id!==u.id).some(v=>points.slice(1).some((p,i)=>intersects(points[i],p,v)));});
  }
  if(query.mode==='utility'){
    // Only existing, equipped camp skills. Full charge only, then the driver
    // rechecks the actual settled angle before ordinary Space release.
    const target=targets[0],hurt=party.filter(v=>alive(v)&&v.hp/v.maxHp<.70).sort((a,z)=>a.hp/a.maxHp-z.hp/z.maxHp)[0];
    const id=u.cls==='mage'&&hurt?'M10':u.cls==='occultist'&&query.allowSummon&&target&&!b.units.some(v=>alive(v)&&v.summonOwner===u.id)?'O11':null;
    const idx=u.loadout.indexOf(id),s=C.SKILLS[id],at=id==='M10'?hurt:target;
    if(!id||idx<0||!e.skillAllowed(s,u)||e.cooldownLeft(u,id)>0||!e.canAfford(s,u,1))return null;
    let best=null;
    const angles=query.angle===undefined?Array.from({length:70},(_,i)=>-84+i*5):[query.angle];
    for(const angle of angles){const hit=e.predict(u,s,angle,1,null,true),d=dist(hit,at);
      if(!hit.terrain||Math.abs(hit.y-at.y)>(id==='M10'?70:120)||d>(id==='M10'?85:400))continue;
      if(id==='M10'&&(b.stakes||[]).some(v=>v.skill==='M10'&&v.expires>b.round+1&&dist(v,at)<180))continue;
      if(!best||d<best.distance)best={id,idx,angle,power:1,target:at.id,utility:true,distance:d};}
    return best;
  }
  if(query.mode!=='navigation')throw Error('Unknown observation mode');
  if(!compact?.routes||!compact?.sites)throw Error('Compact routes/sites missing');
  let goal,enemy=false;
  if(query.strategy==='flank'&&current?.id==='11.entry-threat'&&u.cls==='archer'&&e.unit(b.honroV4Chapter11.host)&&alive(e.unit(b.honroV4Chapter11.host)))goal={...compact.sites.firingRock,id:'firing-rock'};
  else if(state.gather){const x=marker.x+({archer:-125,mage:-45,knight:45,occultist:125}[u.cls]),floor=b.terrain.find(t=>t.id==='compact-floor');goal={...marker,x,y:C.topAt(floor,x),surfaceId:floor.id};}
  else if(targets[0]){goal=targets[0];enemy=true;}
  else goal=marker;
  if(!goal)return{state,blocked:'no current goal'};
  if(query.strategy==='cohesive'&&goal.x>u.x&&u.x-Math.min(...party.filter(alive).map(v=>v.x))>650)return{state,goal,blocked:'formation waits for rear companion'};
  if(query.summaryOnly)return{state,goal,enemy,distance:dist(u,goal)};
  const nodes=[],edges=[],keys=new Map(),surfaces=new Map();
  function node(p){const key=(p.surfaceId||'unknown')+':'+Math.round(p.x*10)+':'+Math.round(p.y*10);let i=keys.get(key);if(i===undefined){i=nodes.length;nodes.push({...p});edges.push([]);keys.set(key,i);}if(p.surfaceId){if(!surfaces.has(p.surfaceId))surfaces.set(p.surfaceId,new Set());surfaces.get(p.surfaceId).add(i);}return i;}
  function edge(i,j,jump=null){if(i!==j&&!edges[i].some(v=>v.to===j&&!!v.jump===!!jump))edges[i].push({to:j,cost:dist(nodes[i],nodes[j])+(jump?120:0),jump});}
  function join(p,z,jump=null){const i=node(p),j=node(z);edge(i,j,jump);if(!jump&&p.surfaceId===z.surfaceId)edge(j,i);}
  for(const route of compact.routes)for(let i=0;i<route.anchors.length-1;i++){let p=route.anchors[i],z=route.anchors[i+1];if(p.jumpTo){const t=b.terrain.find(t=>t.id===p.jumpTo.support);if(!t)throw Error('Missing jump support');const land={x:p.jumpTo.x,y:C.topAt(t,p.jumpTo.x),surfaceId:t.id};join(p,land,p.jumpTo);p=land;}if(p.surfaceId===z.surfaceId){const t=b.terrain.find(t=>t.id===p.surfaceId),count=Math.max(1,Math.ceil(Math.abs(z.x-p.x)/100));let prev=p;for(let j=1;j<=count;j++){const x=p.x+(z.x-p.x)*j/count,next={x,y:C.topAt(t,x),surfaceId:t.id};join(prev,next);prev=next;}}else join(p,z);}
  for(const t of b.terrain.filter(t=>t.honroSpaceSurfaceId&&!t.honroCeiling)){const left=Math.max(25,t.x),right=Math.min(b.width-25,t.x+t.w);for(const x of [...Array.from({length:Math.floor((right-left)/90)+1},(_,i)=>left+i*90),right]){const y=C.topAt(t,x);if(Number.isFinite(y)&&y>=0&&y<=b.height&&C.validTerrainContactPose(b.terrain,{...u,x,y}))node({x,y,surfaceId:t.id});}}
  for(const p of Object.values(compact.sites))node(p);
  for(const set of surfaces.values()){const list=[...set].sort((i,j)=>nodes[i].x-nodes[j].x);for(let n=1;n<list.length;n++){const i=list[n-1],j=list[n];if(nodes[j].x-nodes[i].x<420&&Math.abs(nodes[j].y-nodes[i].y)<=Math.abs(nodes[j].x-nodes[i].x)*1.35+.2){edge(i,j);edge(j,i);}}}
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const p=nodes[i],z=nodes[j];if(p.surfaceId!==z.surfaceId&&Math.abs(p.x-z.x)<=100&&Math.abs(p.y-z.y)<=45){edge(i,j);edge(j,i);}}
  const support=e.contactSurface(u.x,u.y-5,u.y+5)?.t?.id;
  // Replanning while partway along an edge must start at the actual foot,
  // not repeatedly walk back to its nearest authored sample. These are local
  // candidate graph nodes; production movement still resolves all collision.
  if(support&&e.grounded(u)){
    const at=node({x:u.x,y:u.y,surfaceId:support}),same=[...(surfaces.get(support)||[])].filter(i=>i!==at);
    for(const direction of [-1,1]){
      const next=same.filter(i=>(nodes[i].x-u.x)*direction>=0).sort((a,z)=>Math.abs(nodes[a].x-u.x)-Math.abs(nodes[z].x-u.x))[0];
      if(next!==undefined&&Math.abs(nodes[next].x-u.x)<420&&Math.abs(nodes[next].y-u.y)<=Math.abs(nodes[next].x-u.x)*1.35+.2){edge(at,next);edge(next,at);}
    }
  }
  let start=-1,cost=Infinity;
  for(let i=0;i<nodes.length;i++){const value=dist(u,nodes[i])+(support===nodes[i].surfaceId?0:350);if(value<cost){start=i;cost=value;}}
  if(start<0)return{state,goal,blocked:'no support nodes'};
  const d=nodes.map(()=>Infinity),prev=nodes.map(()=>null),done=new Set();d[start]=0;
  for(let n=0;n<nodes.length;n++){let i=-1;for(let j=0;j<nodes.length;j++)if(!done.has(j)&&(i<0||d[j]<d[i]))i=j;if(i<0||!Number.isFinite(d[i]))break;done.add(i);for(const link of edges[i])if(d[i]+link.cost<d[link.to]){d[link.to]=d[i]+link.cost;prev[link.to]={from:i,...link};}}
  let target=-1,score=Infinity;const range={archer:550,mage:450,knight:90,occultist:340}[u.cls];
  for(let i=0;i<nodes.length;i++){const p=nodes[i],delta=dist(p,goal),dy=Math.abs(p.y-goal.y);if(enemy&&(delta>1400||dy>(u.cls==='knight'?350:700)))continue;const penalty=enemy?Math.abs(delta-range)*1.4+Math.max(0,dy-(u.cls==='knight'?120:380))*3:delta*8,total=d[i]+penalty;if(total<score){score=total;target=i;}}
  if(target<0||!Number.isFinite(score))return{state,goal,blocked:'no graph route'};
  const links=[];for(let i=target;i!==start;){const link=prev[i];if(!link)return{state,goal,blocked:'disconnected graph'};links.push({from:nodes[link.from],point:nodes[i],jump:link.jump});i=link.from;}links.reverse();
  if(dist(u,nodes[start])>13||Math.abs(u.y-nodes[start].y)>35)links.unshift({from:{x:u.x,y:u.y},point:nodes[start],jump:null});
  // Authored and 90px contour samples can be almost coincident. Already
  // reached walk links are skipped locally, just as the model nav.index did;
  // no actor position or mission receipt is changed.
  while(links[0]&&!links[0].jump&&Math.abs(u.x-links[0].point.x)<13&&Math.abs(u.y-links[0].point.y)<35&&e.grounded(u))links.shift();
  const next=links[0]||null;return{state,goal,enemy,next,links,distance:dist(u,goal),routeCost:d[target],atGoal:!next,graphNodes:nodes.length};
}
