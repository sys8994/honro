const shapes=Object.freeze({play:'901721de1ae340238e5b0a081861fb8fee3650d93e1496c519c50073439f7aec',world:'858974a56d2e448bde0149f9b3c4bad487b1fdf0ba459981144d71784f495f54'});
const hull='local-lower-08-body';
const points=Object.freeze({column:{x:3496,r:88,cls:'occultist'},threshold:{x:3680,r:88,cls:'mage'},ledger:{x:4464,r:82,cls:'occultist'},stake:{x:3680,r:114,cls:'mage'}});
const exits=Object.freeze({mage:3580,archer:3440,knight:3390,occultist:3500});
const ids=['a6-c08-boss','a6-c08-expansion-node','a6-c08-unsettled-ledger','a6-c08-margin-echo'];
const used=new WeakSet();
const fields=Object.freeze({
 entry:{id:'local-sealed-axis',x:2490,y:2200,w:2780,h:1340,gravity:{x:320,y:0},projectileOnly:true},
 phase2:{id:'a6-c08-stage-proj-02',x:2490,y:2200,w:2780,h:1340,gravity:{x:175,y:145},projectileOnly:true},
 ledger:{id:'local-08-ledger-marginal-strike',x:4630,y:2850,w:575,h:580,gravity:{x:-260,y:90},projectileOnly:true},
 echo:{id:'local-08-ledger-echo-reinforcement',x:4750,y:2890,w:500,h:400,gravityScale:1.65,projectileOnly:true}
});
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const alive=u=>u&&u.hp>0&&!u.dead;
const death=u=>u?.hp===0&&u.dead===true;
const vital=['id','cls','hp','maxHp','focus','maxFocus','shield','loadout','equipmentState','h','r','ranks','level','attack','armor','regen','walkSpeed','maxMove','tune','dead'];
const no=reason=>Object.freeze({accepted:false,reason});
export function createStage58Owner({C,authorize,isolate=()=>false,preview=()=>false,readPrevious,fingerprint}){
 if(!C?.Engine||typeof authorize!=='function'||typeof readPrevious!=='function'||typeof fingerprint!=='function')throw TypeError('trusted native host required');
 return function mount({engine:e,activation,previous,carriedProfile,reserved}={}){
  const b=e?.b;
  if(!activation?.enabled||activation.integerStageKey!==58||!(e instanceof C.Engine)||used.has(e)||!authorize({engine:e,activation}))return no('off or unauthorized owner');
  const detached=isolate(activation,e)===true;
  const previewed=preview(activation,e)===true;
  if(previewed&&!(b.mode==='act6-isolated'&&b.honroCanonical===true&&b.honroCustom===false&&b.stage===58&&b.stageId===58&&b.honroStage===58&&b.honroMapOrigin==='act6-qa'&&b.honroAuthoredId==='stage-58'&&['debug','embedded','training','custom'].every(k=>activation[k]===false)))return no('wrong private preview mode');
  if(!detached&&!previewed&&!(b.mode==='campaign'&&b.honroCanonical===true&&b.honroCustom===false&&b.stage===58&&b.stageId===58&&b.honroStage===58&&b.honroMapOrigin==='campaign'&&b.honroAuthoredId==='stage-58'&&['debug','embedded','training','custom'].every(k=>activation[k]===false)))return no('wrong canonical mode');
  if(detached&&!(b.mode==='skirmish'&&b.honroAuthoredId==='a6-local-playable-08'))return no('wrong proof carrier');
  if(b.width!==7200||b.height!==3600||fingerprint(b.terrain)!==shapes.play||fingerprint(b.honroWorldTerrain)!==shapes.world||b.phase!=='aim'||b.honroGrowth||b.honroJourneyReplay)return no('wrong exact author packet');
  const prev=readPrevious(previous,e), four=b.units.filter(u=>u.side===0&&!u.summoned&&!u.honroAlly);
  if(prev?.stage!==57||prev.won!==true||prev.flags?.['act6.fourCorporealJoined']!==true||prev.flags?.['act6.fallbackRelaySecured']!==true||!eq(prev.profile,carriedProfile)||prev.actors?.length!==4||four.length!==4||new Set(four.map(u=>u.id)).size!==4||b.units.some(u=>u.side===1)||!Object.keys(exits).every(cls=>four.some(v=>v.cls===cls)))return no('no trusted four-person 57 crossing');
  if(four.some(a=>{
   const s=prev.actors.find(v=>v.id===a.id),pos=prev.receiving?.[a.cls];
   return !s||!pos||!alive(a)||vital.some(k=>!eq(a[k],s[k]))||Math.abs(a.x-pos.x)>.001||Math.abs(a.y-pos.y)>.001||!e.grounded(a)||!C.validTerrainContactPose(b.terrain,a);
  }))return no('body identity/vitals/receiving mismatched');
  if(!Array.isArray(reserved)||reserved.length!==4||!eq(reserved.map(x=>x.id),ids)||reserved.some(a=>b.units.some(u=>u.id===a.id)||!alive(a)||!e.grounded(a)||!C.validTerrainContactPose(b.terrain,a)))return no('authored reserved roles missing');
  const [boss,node,ledger,echo]=reserved;
  if(boss.hp!==1350||boss.maxHp!==1350||boss.x!==4480||boss.h!==146||boss.r!==35||boss.side!==1||!boss.loadout.includes('LA01')||node.hp!==260||node.maxHp!==260||node.side!==1||node.x!==4896||node.r!==48||node.h!==110||ledger.x!==5144||echo.x!==5708||ledger.y-echo.y<500||[ledger,echo].some(r=>r.side!==2||!r.honroVisualOnly||!r.localFieldAuthority||r.loadout.length))return no('reserved role profile changed');
  const flags=b.honroState.flags, mage=four.find(a=>a.cls==='mage'), guard=JSON.stringify(carriedProfile);
  const sites=Object.fromEntries(Object.entries(points).map(([k,m])=>{const s=e.contactSurface(m.x,2100,3555);return [k,s?{...m,y:s.y,support:s.t.id}:null]}));
  if(!flags||typeof flags!=='object')return no('missing author event storage');
  if(Object.values(sites).some(v=>!v)||Object.values(sites).some(v=>v.support!==hull))return no('grounded rites not present');
  if(['localColumnSealAligned','localThresholdGravityNormalized','localBossManifested','localLedgerCounterSpent','localDaedosaDefeated','place(correctedInnerStake)','localFourBodyExit'].some(k=>flags[k]))return no('stale episode flags');
  const originalUnits=new Set(four), east=new Set(), log=[], ritual=[], shots=[], dead=[], fieldEvents=[];let phase=1, quiet=false, quietFire=false,pending=null,fired=null,usedWarning=false,terminal=null,tick=0;
  const profileExact=()=>JSON.stringify(carriedProfile)===guard;
  const act=()=>profileExact()&&!['won','lost'].includes(b.phase)&&b.side===0&&e.canAct()&&b.projectiles.length===0;
  const getRegion=(variant='observed')=>phase===2?[structuredClone(fields.phase2)]:phase===3&&!death(node)&&b.honroConvoyActors?.includes(ledger)&&variant!=='quiet'&&!(variant==='observed'&&quiet)?[structuredClone(fields.ledger),...(variant==='ledger-only'?[]:[structuredClone(fields.echo)])]:[];
  const sync=()=>e.setEnvironment({regions:getRegion()});
  const note=(kind, data={})=>{const v={kind,tick,round:b.round,...data};log.push(v);return v;};
  const mark=(id,meta)=>{b.honroMarkers=[...(b.honroMarkers??[]).filter(x=>x.id!==id),{id,...meta}];};
  const remove=id=>{if(b.honroMarkers?.some(x=>x.id===id))b.honroMarkers=b.honroMarkers.filter(x=>x.id!==id);};
  const validPlace=(cls,k)=>{const a=e.active,q=sites[k];return a&&originalUnits.has(a)&&alive(a)&&a.cls===cls&&e.grounded(a)&&Math.abs(a.x-q.x)<=q.r&&Math.abs(a.y-q.y)<100&&e.contactSurface(a.x,a.y-4,a.y+5)?.t.id===q.support;};
  function interact(k){
   if(!act()||!sites[k]||!validPlace(sites[k].cls,k))return false;
   const a=e.active;
   if(k==='column'){
    if(flags.localColumnSealAligned||flags.localBossManifested)return false;
    flags.localColumnSealAligned=true;flags.localThresholdGravityNormalized=true;e.setEnvironment({regions:[]});
   }else if(k==='threshold'){
    if(!flags.localColumnSealAligned||!flags.localThresholdGravityNormalized||flags.localBossManifested||b.units.some(x=>x.side===1)||!e.grounded(boss))return false;
    flags.localBossManifested=true;b.units.push(boss);b.honroConvoyActors=[...(b.honroConvoyActors??[]),ledger,echo];
   }else if(k==='ledger'){
    if(phase!==3||flags.localLedgerCounterSpent||death(node))return false;
    flags.localLedgerCounterSpent=true;quiet=true;sync();fieldEvents.push(note('suppression',{actor:a.id,x:a.x,y:a.y,ground:true}));
    return true;
   }else if(k==='stake'){
    if(flags['place(correctedInnerStake)']||!flags.localDaedosaDefeated||!death(boss)||!death(node))return false;
    flags['place(correctedInnerStake)']=true;note('place(correctedInnerStake)',{actor:a.id});
    return true;
   }else return false;
   ritual.push(note(k,{actor:a.id,x:a.x,y:a.y,bossPresent:b.units.includes(boss),activeEnemyCount:b.units.filter(v=>v.side===1&&alive(v)).length,phase}));
   return true;
  }
  function poll(takeTick=tick){
   tick=takeTick;if(!profileExact())return null;
   if(flags.localBossManifested){
    for(const a of four)if(a.x>points.threshold.x+25&&e.grounded(a))east.add(a);
    const want=boss.hp<=boss.maxHp*.38?3:boss.hp<=boss.maxHp*.72?2:1;
    if(phase!==want){phase=want;
     if(phase===3){
      if(!b.units.includes(node))b.units.push(node);
      mark('local-08-ledger-seam',{type:'interaction',action:'authored',authoredAction:'localLedgerCounter',label:'먹선을 끊어 한 발의 사선 되찾기',x:sites.ledger.x,y:sites.ledger.y,radius:82});
      fieldEvents.push(note('field-active',{roles:[ledger.id,echo.id]}));
     }
     sync();note('bossPhase',{phase,id:boss.id,hp:boss.hp});
    }
   }
   if(quiet&&((quietFire&&!b.projectiles.length)||(!quietFire&&b.side!==0))){
    quiet=false;quietFire=false;sync();fieldEvents.push(note('suppression-ended'));
   }
   if(flags['place(correctedInnerStake)']&&!flags.localFourBodyExit&&four.every(a=>east.has(a)&&alive(a)&&a.x<=exits[a.cls]&&e.grounded(a)&&C.validTerrainContactPose(b.terrain,a))){
    flags.localFourBodyExit=true;note('localFourBodyExit',{actors:four.map(a=>({id:a.id,x:a.x,y:a.y,hp:a.hp}))});
   }
   if(phase===3&&!usedWarning)requestThreat();
   return project();
  }
  function requestThreat(){
   if(pending&&e.active===mage&&act())return structuredClone(pending);
   if(usedWarning||phase!==3||death(node)||!b.units.includes(node)||!act()||e.active!==mage||!e.grounded(mage)||mage.x<4070||mage.x>4210)return null;
   const candidates=[];
   for(const a of [136,142,148,154,160,166,172,178,184,190,196,202,208])for(const p of [.38,.44,.5,.56,.62,.68,.74,.80,.86,.92,.98]){
    const v=e.predict(boss,C.SKILLS.LA01,a,p,mage,true);
    if(v.unit===mage.id)candidates.push({a,p,impact:[v.x,v.y]});
   }
   if(!candidates.length)return null;
   const aim=candidates.sort((m,n)=>Math.abs(m.a-160)-Math.abs(n.a-160)||m.p-n.p)[0];
   usedWarning=true;pending={...aim,round:b.round,tick,mark:[mage.x,mage.y],shotBefore:b.shot,paid:false};
   mark('local-08-expansion-line-show',{type:'objective',label:'법술 유지점이 당긴 포격 · 붉은 자리를 벗어나십시오',x:mage.x,y:mage.y,radius:72});
   shots.push(note('announced',{...pending}));
   return structuredClone(pending);
  }
  function nativeFireArgs(args){
   if(!pending||!pending.paid||e.active!==boss||b.side!==1||death(node)||death(boss)||b.projectiles.length)return args;
   return ['LA01',pending.a,pending.p,true];
  }
  function afterNativeFire({actor,args,nativeArgs,ok}){
   if(!ok)return;
   if(originalUnits.has(actor)){
    if(quiet&&nativeArgs[0]!=='S00')quietFire=true;
    if(pending&&b.shot>pending.shotBefore)pending.paid=true;
   }
   if(actor===boss&&pending&&args!==nativeArgs){
    fired={...pending,release:{tick,round:b.round}};pending=null;shots.push(note('released',structuredClone(fired)));
   }
  }
  function nativeImpact(p,h,before,after){
   if(!fired||p.owner!==boss.id||p.skill!=='LA01')return false;
   shots.push(note('landed',{id:h.unit?.id??h.terrain?.id??null,x:h.x,y:h.y,teamBefore:before,teamAfter:after,heroBefore:before.find(r=>r[0]===mage.id)?.[1],heroAfter:after.find(r=>r[0]===mage.id)?.[1]}));
   fired=null;remove('local-08-expansion-line-show');return true;
  }
  function nativeHurt(t,hpBefore,source){
   if(t===boss&&flags.localBossManifested&&death(t)&&hpBefore>0&&!flags.localDaedosaDefeated){
    flags.localDaedosaDefeated=true;dead.push(note('localDaedosaNativeDefeat',{id:t.id,from:hpBefore,to:t.hp,dead:true,source,expansionStillPending:!death(node)}));
    if(pending){pending=null;remove('local-08-expansion-line-show');}
   }
   if(t===node&&b.units.includes(node)&&death(t)&&hpBefore>0){
    sync();remove('local-08-ledger-seam');pending=null;remove('local-08-expansion-line-show');
    fieldEvents.push(note('actual-expansion-node-disabled',{id:t.id,fields:getRegion(),source}));
   }
  }
  function advanceReturn(){
   if(!act()||!death(boss)||!death(node)||!originalUnits.has(e.active))return false;
   const before=JSON.stringify(four.map(a=>[a.hp,a.focus,a.shield]));e.finishAction(true);
   if(JSON.stringify(four.map(a=>[a.hp,a.focus,a.shield]))!==before)throw Error('noncombat march changed stored vitals');
   return true;
  }
  function project(){
   if(!profileExact())return null;
   const failed=four.some(a=>!alive(a)||!b.units.includes(a));
   const complete=!failed&&flags.localFourBodyExit===true&&flags['place(correctedInnerStake)']===true&&flags.localDaedosaDefeated===true&&death(boss)&&death(node);
   return {complete,objectiveReady:complete,failed,phase,flags:{column:!!flags.localColumnSealAligned,bossManifested:!!flags.localBossManifested,bossDead:death(boss),nodeDead:death(node),stake:!!flags['place(correctedInnerStake)'],allPhysicallyReturned:!!flags.localFourBodyExit}};
  }
  function commit(){
   if(terminal||b.phase!=='won'||!project()?.complete)return null;
   terminal=Object.freeze({stage:58,won:true,flags:Object.freeze({'act6.daedosaStopped':true,'act6.innerRevisionReady':true,'act6.fourCorporealReturned':true}),actors:structuredClone(four),profile:structuredClone(carriedProfile),settlement:false});
   return terminal;
  }
  used.add(e);e.setEnvironment({regions:[structuredClone(fields.entry)]});
  return Object.freeze({accepted:true,interact,poll,requestThreat,nativeFireArgs,afterNativeFire,nativeImpact,nativeHurt,advanceReturn,project,commit,getRegion,inspect:()=>structuredClone({phase,ritual,log,shots,dead,fieldEvents,enteredRoles:[...east].map(x=>x.id),pending,fired})});
 };
}
