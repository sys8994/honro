// Act 6-8 「문턱에 걸린 사람」 owner, revision 2 (2026-11-25).
// The great daoist is a human body that appears only after two grounded rites; he fights
// with announced shapes (band / tilted floor / ink drop / the far side drawing near) that
// resolve on his NEXT turn from the same record the renderer draws (b.honroDaedosa).
// Phase floors stop a single heavy hit from skipping a phase; overflow is carried forward.
const shapes=Object.freeze({play:'901721de1ae340238e5b0a081861fb8fee3650d93e1496c519c50073439f7aec',world:'858974a56d2e448bde0149f9b3c4bad487b1fdf0ba459981144d71784f495f54'});
const hull='local-lower-08-body';
const points=Object.freeze({column:{x:3496,r:88,cls:'occultist'},threshold:{x:3680,r:88,cls:'mage'},ledger:{x:4464,r:82,cls:'occultist'},stake:{x:3680,r:114,cls:'mage'}});
const exits=Object.freeze({mage:3580,archer:3440,knight:3390,occultist:3500});
const ids=['a6-c08-boss','a6-c08-expansion-node','a6-c08-unsettled-ledger','a6-c08-margin-echo','a6-c08-vessel-a','a6-c08-vessel-b','a6-c08-ink-echo-a','a6-c08-ink-echo-b'];
export const BOSS58=Object.freeze({hp:10500,armor:.15,floors:[7600,4600],carry:.5,exposed:1.3,guarded:.6,
 stand:[4480,4800,5150],band:{w:340,dmg:.24,push:110},zone:{w:420,dmg:.16,pull:200},drop:{r:150,dmg:.28},great:{dmg:.40},lash:{reach:650,dmg:.15},rain:{r:110,dmg:.15},tether:{reach:750,pull:260,dmg:.16},swap:{r:170,dmg:.22,push:120},lift:[0,220,320],
 grot:{every:2,maxAlive:2,total:6,kinds:[['grot_hanging','거꾸로 매달린 상주',1700,.12],['grot_hands','천수귀',2400,.15],['grot_door','입 벌린 문짝',3200,.25]]},
 shelters:[{x0:2600,x1:3360,y0:3120,y1:3560,label:'법당 그늘'},{x0:5650,x1:6150,y0:2700,y1:3080,label:'움푹한 바위 아래'}],column:{x0:3410,x1:3500}});
const used=new WeakSet();
const fields=Object.freeze({
 entry:{id:'local-sealed-axis',x:2490,y:2200,w:2780,h:1340,gravity:{x:320,y:0},projectileOnly:true},
 far:{id:'a6-c08-far-sight',x:4100,y:2300,w:1000,h:1250,gravity:{x:-260,y:0},projectileOnly:true},
 phase2:{id:'a6-c08-stage-proj-02',x:2490,y:2200,w:2780,h:1340,gravity:{x:175,y:145},projectileOnly:true},
 ledger:{id:'local-08-ledger-marginal-strike',x:4630,y:2850,w:575,h:580,gravity:{x:-260,y:90},projectileOnly:true},
 echo:{id:'local-08-ledger-echo-reinforcement',x:4750,y:2890,w:500,h:400,gravityScale:1.65,projectileOnly:true}
});
const lines=Object.freeze({
 entry:['담허: 법당이 비어 있군. 문턱이 우리를 기다리고 있었던 것 같네.','소단: 기둥에 감긴 술식이 비뚤어요. 이걸 먼저 바로잡을게요.'],
 column:['설오: 화살이 옆으로 끌리던 게 멎었습니다.','담허: 이제 문턱이 대답할 걸세. 모두 내 뒤로 서게.'],
 manifest:['대도사: 현묵의 진목이 또 문턱을 두드리는군.','담허: 저문골에 종을 친 사람이 당신이었습니까.','대도사: 종은 닿았네. 이제 돌아오는 소리를 마저 듣겠네.'],
 firstBand:['휘겸: 저 줄이 접히는 데로 서지 마시오. 그림자가 먼저 오오.'],
 phase2:['대도사: 바닥이 어느 쪽인지는 내가 정하지.','소단: 발밑이 저쪽으로 기울어요. 진목을 박으면 버틸 수 있어요.'],
 phase3:['대도사: 들리나. 거의 닿았네.','담허: 저 매듭이 틈을 붙들고 있네. 먼저 끊어야 하네.'],
 nearGreat:['설오: 법당 기둥 뒤로! 아니면 아래 움푹한 데로 내려가십시오.'],
 node:['소단: 실이 풀렸어요. 지금은 저 사람이 그대로 드러나요.'],
 defeat:['대도사: …소리가, 멎는군.','담허: 여기서 멈추겠습니다.'],
 stake:['소단: 떠나는 혼이 지나갈 틈이 남았어요.','담허: 바깥이 무너지기 전에 돌아가세.'],
 lost:['담허: 진목을… 놓쳤네.']
});
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const alive=u=>u&&u.hp>0&&!u.dead;
const death=u=>u?.hp===0&&u.dead===true;
const vital=['id','cls','hp','maxHp','focus','maxFocus','shield','loadout','equipmentState','h','r','ranks','level','attack','armor','regen','walkSpeed','maxMove','tune','dead'];
const no=reason=>Object.freeze({accepted:false,reason});
export function createStage58Owner({C,authorize,isolate=()=>false,preview=()=>false,normalBudget=()=>false,readPrevious,fingerprint}){
 if(!C?.Engine||typeof authorize!=='function'||typeof readPrevious!=='function'||typeof fingerprint!=='function')throw TypeError('trusted native host required');
 return function mount({engine:e,activation,previous,carriedProfile,reserved}={}){
  const b=e?.b;
  if(!activation?.enabled||activation.integerStageKey!==58||!(e instanceof C.Engine)||used.has(e)||!authorize({engine:e,activation}))return no('off or unauthorized owner');
  const detached=isolate(activation,e)===true;
  const previewed=preview(activation,e)===true;
  if(previewed&&!(b.mode==='act6-isolated'&&b.honroCanonical===true&&b.honroCustom===false&&b.stage===58&&b.stageId===58&&b.honroStage===58&&b.honroMapOrigin==='act6-qa'&&b.honroAuthoredId==='stage-58'&&['debug','embedded','training','custom'].every(k=>activation[k]===false)))return no('wrong private preview mode');
  if(!detached&&!previewed&&!(b.mode==='campaign'&&b.honroCanonical===true&&b.honroCustom===false&&b.stage===58&&b.stageId===58&&b.honroStage===58&&b.honroMapOrigin==='campaign'&&b.honroAuthoredId==='stage-58'&&['debug','embedded','training','custom'].every(k=>activation[k]===false)))return no('wrong canonical mode');
  if(detached&&!(b.mode==='skirmish'&&b.honroAuthoredId==='a6-local-playable-08'))return no('wrong proof carrier');
  const authorizedZeroBudget=b.mode==='campaign'&&b.honroGrowth?.limit?.total===0&&b.honroGrowth?.limit?.combat===0&&normalBudget(activation,e)===true;
  if(b.width!==7200||b.height!==3600||fingerprint(b.terrain)!==shapes.play||fingerprint(b.honroWorldTerrain)!==shapes.world||b.phase!=='aim'||(b.honroGrowth&&!authorizedZeroBudget)||b.honroJourneyReplay)return no('wrong exact author packet');
  const prev=readPrevious(previous,e), four=b.units.filter(u=>u.side===0&&!u.summoned&&!u.honroAlly);
  if(prev?.stage!==57||prev.won!==true||prev.flags?.['act6.fourCorporealJoined']!==true||prev.flags?.['act6.fallbackRelaySecured']!==true||!eq(prev.profile,carriedProfile)||prev.actors?.length!==4||four.length!==4||new Set(four.map(u=>u.id)).size!==4||b.units.some(u=>u.side===1)||!Object.keys(exits).every(cls=>four.some(v=>v.cls===cls)))return no('no trusted four-person 57 crossing');
  if(four.some(a=>{
   const s=prev.actors.find(v=>v.id===a.id),pos=prev.receiving?.[a.cls];
   return !s||!pos||!alive(a)||vital.some(k=>!eq(a[k],s[k]))||Math.abs(a.x-pos.x)>.001||Math.abs(a.y-pos.y)>.001||!e.grounded(a)||!C.validTerrainContactPose(b.terrain,a);
  }))return no('body identity/vitals/receiving mismatched');
  if(!Array.isArray(reserved)||reserved.length!==ids.length||!eq(reserved.map(x=>x.id),ids)||reserved.some(a=>b.units.some(u=>u.id===a.id)||!alive(a)))return no('authored reserved roles missing');
  const [boss,node,ledger,echo,vesselA,vesselB,inkA,inkB]=reserved;
  if(boss.maxHp!==BOSS58.hp||boss.honroRigAsset!=='boss_daedosa'||boss.loadout.length||boss.side!==1||node.side!==1||[ledger,echo].some(r=>r.side!==2||!r.honroVisualOnly||!r.localFieldAuthority||r.loadout.length)||[vesselA,vesselB,inkA,inkB].some(r=>r.side!==1||!r.loadout.length))return no('reserved role profile changed');
  const flags=b.honroState.flags, guard=JSON.stringify(carriedProfile);
  const originalTerrain=b.terrain;
  const ground=x=>C.terrainSurface(originalTerrain,x,2100,3555,Infinity);
  const sites=Object.fromEntries(Object.entries(points).map(([k,m])=>{const s=ground(m.x);return [k,s?{...m,y:s.y,support:s.t.id}:null]}));
  if(!flags||typeof flags!=='object')return no('missing author event storage');
  if(Object.values(sites).some(v=>!v)||Object.values(sites).some(v=>v.support!==hull))return no('grounded rites not present');
  if(['localColumnSealAligned','localThresholdGravityNormalized','localBossManifested','localLedgerCounterSpent','localDaedosaDefeated','place(correctedInnerStake)','localFourBodyExit'].some(k=>flags[k]))return no('stale episode flags');
  const place=(u,x)=>{const s=ground(x);if(!s)return false;Object.assign(u,{x,y:s.y,spawnX:x,spawnY:s.y,vx:0,vy:0,airborne:false,jumping:false});return e.grounded(u)&&C.validTerrainContactPose(b.terrain,u);};
  // Flight: past the first phase he floats; when exposed he sinks to the floor (a melee window).
  const hover=(u,x,lift)=>{const g=ground(x);if(!g)return false;Object.assign(u,{x,y:g.y-lift,spawnX:x,spawnY:g.y-lift,vx:0,vy:0,airborne:lift>0,jumping:false,fixed:u.fixed||lift>0});return true;};
  for(const [u,x] of [[boss,BOSS58.stand[0]],[node,4896],[vesselA,4300],[vesselB,5000],[inkA,5420],[inkB,5560]])if(!place(u,x))return no('reserved pose unsupported '+u.id);
  const originalUnits=new Set(four), east=new Set(), log=[], ritual=[], dead=[], fieldEvents=[], said=new Set();
  let phase=1,pendingPhase=0,carryOver=0,presented=false,quiet=false,quietFire=false,terminal=null,tick=0,lostSpoken=false,firstBand=false,nearWarned=false;
  // Serializable fight record; the renderer draws marks/shelters from exactly this object.
  const rec=b.honroDaedosa={version:2,boss:boss.id,phase:0,mark:null,charge:0,exposed:false,guarded:false,exposedRounds:0,nodeDead:false,dead:false,shelters:[],shadowOffset:-70,history:[]};
  const profileExact=()=>JSON.stringify(carriedProfile)===guard;
  const act=()=>profileExact()&&!['won','lost'].includes(b.phase)&&b.side===0&&e.canAct()&&b.projectiles.length===0;
  const say=key=>{if(said.has(key))return;said.add(key);for(const l of lines[key])e.message(l);};
  const regions=()=>{
   const r=[];
   if(!flags.localColumnSealAligned)r.push(fields.entry);
   if(flags.localBossManifested&&!rec.dead){
    if(phase===1&&!rec.exposed)r.push(fields.far);
    if(phase===2)r.push(fields.phase2);
    if(phase===3&&!rec.nodeDead&&!quiet)r.push(fields.ledger,fields.echo);
   }
   return r.map(x=>structuredClone(x));
  };
  const sync=()=>e.setEnvironment({regions:regions()});
  const note=(kind,data={})=>{const v={kind,tick,round:b.round,...data};log.push(v);rec.history.push({kind,round:b.round});if(rec.history.length>40)rec.history.shift();return v;};
  const mark=(id,meta)=>{b.honroMarkers=[...(b.honroMarkers??[]).filter(x=>x.id!==id),{id,...meta}];};
  const remove=id=>{if(b.honroMarkers?.some(x=>x.id===id))b.honroMarkers=b.honroMarkers.filter(x=>x.id!==id);};
  const heroes=()=>four.filter(alive);
  const validPlace=(cls,k)=>{const a=e.active,q=sites[k];return a&&originalUnits.has(a)&&alive(a)&&a.cls===cls&&e.grounded(a)&&Math.abs(a.x-q.x)<=q.r&&Math.abs(a.y-q.y)<100&&e.contactSurface(a.x,a.y-4,a.y+5)?.t.id===q.support;};
  // Ground walk used for knockback/pull: same rules as the stock monster shove (supported, no
  // walking into bodies or solid terrain, never off a ledge).
  function shift(u,dir,amount){
   if(!alive(u)||u.airborne||u.jumping||!e.grounded(u))return 0;let moved=0;
   while(moved<amount){const step=Math.min(4,amount-moved),x=u.x+step*dir,top=e.surface(x,u.y-12,u.y+12);
    if(!top||x<u.r+30||x>b.width-u.r-30)break;
    if(!e.surface(x-u.r,top.y-16,top.y+16)||!e.surface(x+u.r,top.y-16,top.y+16))break;
    if(b.units.some(v=>v!==u&&alive(v)&&Math.abs(v.x-x)<u.r+v.r&&top.y>v.y-v.h+2&&top.y-u.h<v.y-2))break;
    if(e.collisionTerrain(u,{x,y:top.y},u.r).some(t=>!t.broken&&!t.oneWay&&C.terrainRectIntersects(t,x-u.r,top.y-u.h,u.r*2,u.h-.5,0)))break;
    u.x=x;u.y=top.y;moved+=step;}
   if(moved){u.vx=u.vy=0;u.moving=.12;delete u.moveTarget;}return moved;
  }
  const inRect=(u,m)=>u.x>=m.x0&&u.x<=m.x1&&u.y>=m.y0&&u.y<=m.y1;
  const sheltered=u=>BOSS58.shelters.some(s=>inRect(u,s));
  function densest(){
   const h=heroes();let best=null;
   for(const u of h){const n=h.filter(v=>Math.abs(v.x-u.x)<260).length;if(!best||n>best.n||n===best.n&&Math.abs(u.x-boss.x)<Math.abs(best.u.x-boss.x))best={u,n};}
   return best?.u;
  }
  const farthest=()=>heroes().sort((a,c)=>Math.abs(c.x-boss.x)-Math.abs(a.x-boss.x))[0];
  function rect(cx,w){const g=ground(cx)?.y??boss.y;return {x0:Math.round(cx-w/2),x1:Math.round(cx+w/2),y0:Math.round(g-330),y1:Math.round(g+50)};}
  const drop=t=>({kind:'circle',x:Math.round(t.x),y:Math.round(t.y-t.h*.5),r:BOSS58.drop.r,label:'먹줄 낙하'});
  function announce(){
   if(!heroes().length)return null;
   let m=null;
   const n=rec.history.filter(x=>x.kind==='announce'&&x.phase===phase).length;
   const rain=()=>({kind:'rain',circles:heroes().slice().sort((a,c)=>c.hp/c.maxHp-a.hp/a.maxHp).slice(0,3).map(t=>({x:Math.round(t.x+(t.vx||0)),y:Math.round(t.y-t.h*.5),r:BOSS58.rain.r})),label:'거꾸로 내리는 기와비'});
   const tether=()=>{const h=heroes(),t=h.sort((a,c)=>h.filter(v=>Math.abs(v.x-a.x)<300).length-h.filter(v=>Math.abs(v.x-c.x)<300).length||Math.abs(a.x-boss.x)-Math.abs(c.x-boss.x))[0];return {kind:'tether',target:t.id,x:Math.round(t.x),y:Math.round(t.y-t.h*.5),reach:BOSS58.tether.reach,label:'먹줄 올가미 · '+t.name+' 붙잡힘 (750 밖으로 벗어나면 끊김)'};};
   const swap=()=>{const t=farthest(),x=Math.round(t.x+(t.x<boss.x?-60:60)),g=ground(x)?.y??t.y;return {kind:'swap',x,y:Math.round(g-40),r:BOSS58.swap.r,label:'그림자 바꿔치기 · 이 자리에 내려앉음'};};
   if(phase===1){const pick=n%3;if(pick===0){const t=densest();m={kind:'band',...rect(t.x,BOSS58.band.w),label:'접히는 사선'};if(!firstBand){firstBand=true;say('firstBand');}}else m=pick===1?tether():rain();}
   else if(phase===2){
    const pick=n%4;
    if(pick===0){const t=densest();m={kind:'zone',...rect(t.x,BOSS58.zone.w),pull:Math.sign(boss.x-t.x)||1,label:'기울어진 바닥'};}
    else m=pick===1?swap():pick===2?rain():drop(farthest());
   }else{
    if(!rec.nodeDead){
     if(rec.charge>=3){m={kind:'great',x0:2600,x1:7000,y0:2350,y1:3560,label:'저편이 덮친다 · 그늘로'};rec.shelters=BOSS58.shelters.map(s=>({...s}));}
     else if(rec.charge===2&&!nearWarned){nearWarned=true;say('nearGreat');rec.shelters=BOSS58.shelters.map(s=>({...s}));}
    }
    if(!m)m=[drop(farthest()),tether(),rain(),swap()][n%4];
   }
   if(phase===1&&flags.localColumnSealAligned)rec.shelters=[{x0:BOSS58.column.x0,x1:BOSS58.column.x1,y0:3080,y1:3420,label:'기둥 그늘'}];
   m.phase=phase;m.round=b.round;rec.mark=m;rec.guarded=true;rec.exposed=false;
   if(phase>1){const t=densest(),dx=Math.max(-260,Math.min(260,(t?.x??boss.x)+(boss.x>(t?.x??0)?520:-520)-boss.x));hover(boss,Math.max(4200,Math.min(5400,boss.x+dx)),BOSS58.lift[phase-1]);}boss.anim=.4;boss.intent=m.label;
   boss.facing=Math.sign((densest()?.x??boss.x-1)-boss.x)||-1;note('announce',{mark:m.kind,phase});rec.history[rec.history.length-1].phase=phase;
   e.message('대도사 · '+m.label);sync();
   return m;
  }
  function resolve(m){
   const hits=[];
   for(const u of heroes()){
    let take=0,dir=0,amount=0;
    if(m.kind==='band'&&inRect(u,m)&&!rec.shelters.some(s=>inRect(u,s))){take=BOSS58.band.dmg;dir=-1;amount=BOSS58.band.push;}
    else if(m.kind==='zone'&&inRect(u,m)&&!m.neutralized){take=BOSS58.zone.dmg;dir=m.pull;amount=BOSS58.zone.pull;}
    else if(m.kind==='circle'&&Math.hypot(u.x-m.x,(u.y-u.h*.5)-m.y)<=m.r+u.r){take=BOSS58.drop.dmg;}
    else if(m.kind==='great'&&!sheltered(u)){take=BOSS58.great.dmg;}
    else if(m.kind==='rain'&&m.circles.some(c=>Math.hypot(u.x-c.x,(u.y-u.h*.5)-c.y)<=c.r+u.r)){take=BOSS58.rain.dmg;}
    else if(m.kind==='tether'&&u.id===m.target&&Math.abs(u.x-boss.x)<=m.reach){take=BOSS58.tether.dmg;dir=Math.sign(boss.x-u.x)||1;amount=BOSS58.tether.pull;}
    else if(m.kind==='swap'&&Math.abs(u.x-m.x)<=m.r+u.r){take=BOSS58.swap.dmg;dir=Math.sign(u.x-m.x)||1;amount=BOSS58.swap.push;}
    if(!take)continue;
    const before=u.hp;e.hurt(u,u.maxHp*take,boss.id,false,undefined,{x:boss.x,y:boss.y-boss.h*.6},'normal',undefined,{attackSide:1});
    if(amount&&alive(u))shift(u,dir,amount);
    hits.push({id:u.id,from:before,to:u.hp});
   }
   // Ink lash: whoever stands closest within reach pays for crowding him, telegraph or not.
   const near=heroes().filter(u=>!hits.some(h=>h.id===u.id)&&Math.abs(u.x-boss.x)<=BOSS58.lash.reach).sort((a,c)=>Math.abs(a.x-boss.x)-Math.abs(c.x-boss.x))[0];
   if(near){const before=near.hp;e.hurt(near,near.maxHp*BOSS58.lash.dmg,boss.id,false,undefined,{x:boss.x,y:boss.y-boss.h*.6},'normal',undefined,{attackSide:1});hits.push({id:near.id,from:before,to:near.hp,lash:true});}
   if(m.kind==='great'){rec.charge=0;rec.shelters=[];nearWarned=false;}
   if(m.kind==='swap'){hover(boss,m.x,BOSS58.lift[phase-1]);rec.shadowOffset=-rec.shadowOffset;}
   if(m.kind==='band')rec.shelters=[];
   e.fx('ring',m.kind==='circle'?m.x:(m.x0+m.x1)/2,m.kind==='circle'?m.y:m.y1-60,'#2a2f33',m.kind==='circle'?m.r:180);e.emit('sound',{name:'hit'});
   boss.anim=1;if(m.phase===phase)presented=true;note('resolve',{mark:m.kind,hits,neutralized:!!m.neutralized});
   rec.mark=null;rec.guarded=false;rec.exposed=true;hover(boss,boss.x,0);sync();
   e.message('대도사 · '+m.label+(hits.length?` · ${hits.length}명 적중`:' · 비껴감')+' · 지금 드러났습니다');
   return hits;
  }
  // P2: Damheo's M09 stake inside the tilted zone holds a short normal floor.
  const stakeHolds=m=>m.kind==='zone'&&(b.stakes??[]).some(s=>s.skill==='M09'&&s.side===0&&s.x>=m.x0&&s.x<=m.x1);
  function transition(to){
   phase=to;rec.phase=to;pendingPhase=0;presented=false;rec.mark=null;rec.shelters=[];rec.exposed=false;rec.guarded=false;rec.exposedRounds=0;
   const carry=Math.round(carryOver*BOSS58.carry);carryOver=0;
   if(carry>0){const floor=to<3?BOSS58.floors[to-1]:1;boss.hp=Math.max(floor+1,boss.hp-carry);}
   const x=BOSS58.stand[to-1];rec.shadowOffset=x>boss.x?90:-90;hover(boss,x,BOSS58.lift[to-1]);boss.facing=-1;
   if(to===2)say('phase2');
   if(to===3){say('phase3');rec.charge=1;for(const u of [node,inkA,inkB])if(!b.units.includes(u))b.units.push(u);
    mark('local-08-ledger-seam',{type:'interaction',action:'authored',authoredAction:'localLedgerCounter',label:'먹선을 끊어 충전 늦추기',x:sites.ledger.x,y:sites.ledger.y,radius:82});
    fieldEvents.push(note('field-active',{roles:[ledger.id,echo.id]}));}
   note('bossPhase',{phase:to,hp:boss.hp,carry});e.fx('ring',boss.x,boss.y-60,'#1b2124',140);
   announce();
  }
  // Enemy-side boss action; returns true when it consumed the boss's action.
  // Mid-boss grotesques: every second turn of his, one body comes through the warped hall.
  const grots=[];let grotSpawned=0,bossTurns=0;const gid=new Set();
  const grotLines={grot_hanging:'천장도 없는 허공에서 거꾸로 매달린 상주가 내려옵니다.',grot_hands:'바닥 틈에서 손 무더기가 일어섭니다. 가까이 서면 끌려갑니다.',grot_door:'법당 문짝 하나가 걸어 나와 길을 막습니다. 문틈이 입처럼 벌어집니다.'};
  function spawnGrot(){
   const [rig,name,hp,armor]=BOSS58.grot.kinds[grotSpawned%BOSS58.grot.kinds.length],t=densest();if(!t)return;
   const x=Math.round(rig==='grot_hanging'?t.x+(t.x<boss.x?240:-240):rig==='grot_hands'?t.x+(boss.x>t.x?320:-320):(t.x+boss.x)/2),id='a6-c08-grot-'+grotSpawned;
   const tpl=structuredClone(vesselA);delete tpl.id;
   const u=C.makeUnit(tpl.cls,1,x,0,{...tpl,id,name,hp,maxHp:hp,armor,honroRigAsset:rig,honroGrotesque:rig,h:rig==='grot_hands'?140:150,r:rig==='grot_door'?36:30,fixed:rig!=='grot_hands',dead:false,acted:false,attack:(tpl.attack||1)*1.2,elite:true});
   if(!hover(u,x,rig==='grot_hanging'?260:0))return;
   b.units.push(u);grots.push(u);gid.add(u.id);grotSpawned++;note('grotesque',{id,rig});e.message(grotLines[rig]);e.fx('ring',u.x,u.y-60,'#1b2124',120);
  }
  function grotTurn(){
   const u=e.active;if(!u||!gid.has(u.id)||!alive(u))return false;const h=heroes();if(!h.length)return false;
   if(u.honroGrotesque==='grot_hanging'){
    if(u.honroDrop){const d=u.honroDrop;rec.extra=(rec.extra||[]).filter(x=>x.owner!==u.id);
     for(const v of h)if(Math.abs(v.x-d.x)<=d.r+v.r)e.hurt(v,v.maxHp*.22,u.id,false,undefined,{x:u.x,y:u.y},'normal',undefined,{attackSide:1});
     e.fx('ring',d.x,d.y,'#2a2f33',d.r);delete u.honroDrop;e.message('매달린 상주가 떨어졌다가 다시 허공에 걸립니다.');}
    else{const t=h.sort((a,c)=>Math.abs(c.x-boss.x)-Math.abs(a.x-boss.x))[0],g=ground(t.x);hover(u,t.x,260);u.honroDrop={x:Math.round(t.x),y:Math.round((g?.y??t.y)-40),r:130};
     rec.extra=[...(rec.extra||[]).filter(x=>x.owner!==u.id),{owner:u.id,kind:'circle',...u.honroDrop,label:'매달린 것이 떨어짐'}];e.message('매달린 상주 · '+t.name+' 위로 옮겨 갑니다');}
    e.finishAction();return true;}
   if(u.honroGrotesque==='grot_hands'){const t=h.filter(v=>Math.abs(v.x-u.x)<=520).sort((a,c)=>Math.abs(a.x-u.x)-Math.abs(c.x-u.x))[0];if(!t)return false;
    e.hurt(t,t.maxHp*.14,u.id,false,undefined,{x:u.x,y:u.y-60},'normal',undefined,{attackSide:1});shift(t,Math.sign(u.x-t.x)||1,160);u.anim=1;e.message('천수귀 · '+t.name+'을 움켜쥐어 끌어갑니다');e.finishAction();return true;}
   if(u.honroGrotesque==='grot_door'){u.honroInhale=(u.honroInhale||0)+1;if(u.honroInhale%2)return false;
    for(const v of h)if(Math.abs(v.x-u.x)<=600){e.hurt(v,v.maxHp*.1,u.id,false,undefined,{x:u.x,y:u.y-70},'normal',undefined,{attackSide:1});shift(v,Math.sign(u.x-v.x)||1,120);}
    u.anim=1;e.message('입 벌린 문짝 · 숨을 들이마십니다');e.finishAction();return true;}
   return false;
  }
  function bossTurn(){
   if(grotTurn())return true;
   if(e.active!==boss||!alive(boss))return false;
   bossTurns++;if(bossTurns%BOSS58.grot.every===0&&grotSpawned<BOSS58.grot.total&&grots.filter(alive).length<BOSS58.grot.maxAlive)spawnGrot();
   // A phase ends only after its signature shape has been announced AND resolved once,
   // so a heavy opening volley cannot erase the pattern the player is meant to read.
   // P3: the node draws the far side closer on every turn he takes (a cut ledger seam delays one).
   if(phase===3&&!pendingPhase&&!rec.nodeDead&&rec.mark?.kind!=='great'){
    if(quiet){quiet=false;sync();fieldEvents.push(note('suppression-ended'));}
    else{rec.charge=Math.min(3,rec.charge+1);note('charge',{charge:rec.charge});}
    if(rec.charge===2&&!nearWarned){nearWarned=true;say('nearGreat');rec.shelters=BOSS58.shelters.map(s=>({...s}));}
   }
   const m=rec.mark;
   if(m){if(stakeHolds(m)){m.neutralized=true;note('stake-held',{x0:m.x0,x1:m.x1});}
    resolve(m);if(m.neutralized){rec.exposedRounds=2;e.message('소단: 진목이 바닥을 붙들었어요. 저 사람이 휘청여요.');}
    if(pendingPhase&&presented)transition(pendingPhase);
    else if(phase===3&&rec.charge>=3&&!rec.nodeDead)announce();}
   else if(pendingPhase&&presented)transition(pendingPhase);
   else if(rec.exposedRounds>1&&!pendingPhase){rec.exposedRounds--;rec.exposed=true;note('stagger');}
   else{rec.exposedRounds=0;announce();}
   e.finishAction();return true;
  }
  // Damage pass for the boss: guarded/exposed factor, phase floors and carried overflow.
  function hurtThrough(t,amount,call){
   if(t!==boss||!flags.localBossManifested||!alive(boss))return call(amount);
   const f=rec.exposed?BOSS58.exposed:rec.guarded?BOSS58.guarded:1, scaled=amount*f;
   if(phase>=3&&!pendingPhase)return call(scaled);
   const floor=BOSS58.floors[(pendingPhase||phase+1)-2],before=boss.hp,buffer=200000;
   boss.hp+=buffer;let out;try{out=call(scaled);}finally{const lost=before+buffer-boss.hp;boss.hp=before-lost;boss.dead=false;}
   if(boss.hp<=floor){carryOver+=floor-boss.hp;boss.hp=floor;if(!pendingPhase){pendingPhase=phase+1;note('floor-reached',{phase,next:pendingPhase,carry:carryOver});e.message('대도사의 그림자가 문턱 너머로 물러섭니다.');}}
   return out;
  }
  function interact(k){
   if(!act()||!sites[k]||!validPlace(sites[k].cls,k))return false;
   const a=e.active;
   if(k==='column'){
    if(flags.localColumnSealAligned||flags.localBossManifested)return false;
    flags.localColumnSealAligned=true;flags.localThresholdGravityNormalized=true;sync();say('column');
   }else if(k==='threshold'){
    if(!flags.localColumnSealAligned||!flags.localThresholdGravityNormalized||flags.localBossManifested||b.units.some(x=>x.side===1))return false;
    flags.localBossManifested=true;b.units.push(boss,vesselA,vesselB);b.honroConvoyActors=[...(b.honroConvoyActors??[]),ledger,echo];
    rec.phase=1;rec.shadowOffset=-90;say('manifest');sync();
   }else if(k==='ledger'){
    if(phase!==3||flags.localLedgerCounterSpent||rec.nodeDead)return false;
    flags.localLedgerCounterSpent=true;quiet=true;sync();fieldEvents.push(note('suppression',{actor:a.id,x:a.x,y:a.y,ground:true}));
    e.message('소단: 먹선을 끊었어요. 한 번은 늦출 수 있어요.');
    return true;
   }else if(k==='stake'){
    if(flags['place(correctedInnerStake)']||!flags.localDaedosaDefeated||!death(boss)||!death(node))return false;
    flags['place(correctedInnerStake)']=true;note('place(correctedInnerStake)',{actor:a.id});say('stake');
    return true;
   }else return false;
   ritual.push(note(k,{actor:a.id,x:a.x,y:a.y,bossPresent:b.units.includes(boss),activeEnemyCount:b.units.filter(v=>v.side===1&&alive(v)).length,phase}));
   return true;
  }
  function poll(takeTick=tick){
   tick=takeTick;if(!profileExact())return null;
   if(!said.has('entry')&&b.round===1)say('entry');
   if(flags.localBossManifested)for(const a of four)if(a.x>points.threshold.x+25&&e.grounded(a))east.add(a);
   if(quiet&&quietFire&&!b.projectiles.length&&phase!==3){quiet=false;quietFire=false;sync();fieldEvents.push(note('suppression-ended'));}
   if(flags['place(correctedInnerStake)']&&!flags.localFourBodyExit&&four.every(a=>east.has(a)&&alive(a)&&a.x<=exits[a.cls]&&e.grounded(a)&&C.validTerrainContactPose(b.terrain,a))){
    flags.localFourBodyExit=true;note('localFourBodyExit',{actors:four.map(a=>({id:a.id,x:a.x,y:a.y,hp:a.hp}))});
   }
   if(four.some(a=>!alive(a))&&!lostSpoken){lostSpoken=true;say('lost');}
   return project();
  }
  function afterNativeFire({actor,nativeArgs,ok}){if(ok&&originalUnits.has(actor)&&quiet&&nativeArgs[0]!=='S00')quietFire=true;}
  function nativeHurt(t,hpBefore,source){
   if(t===boss&&flags.localBossManifested&&death(t)&&hpBefore>0&&!flags.localDaedosaDefeated){
    flags.localDaedosaDefeated=true;rec.dead=true;rec.mark=null;rec.shelters=[];rec.charge=0;rec.shadowOffset=0;rec.exposed=false;rec.guarded=false;
    dead.push(note('localDaedosaNativeDefeat',{id:t.id,from:hpBefore,to:t.hp,dead:true,source,expansionStillPending:!death(node)}));
    // Bodies he bound lose their binding with him; the node is a working of the threshold and stays.
    rec.extra=[];for(const v of [vesselA,vesselB,inkA,inkB,...grots])if(alive(v)&&b.units.includes(v)){v.hp=0;v.dead=true;e.fx('ring',v.x,v.y-40,'#2a2f33',60);}
    say('defeat');sync();
   }
   if(t===node&&b.units.includes(node)&&death(t)&&hpBefore>0&&!rec.nodeDead){
    rec.nodeDead=true;rec.charge=0;rec.shelters=[];if(rec.mark?.kind==='great'){rec.mark=null;rec.guarded=false;}rec.exposed=true;
    sync();remove('local-08-ledger-seam');say('node');
    fieldEvents.push(note('actual-expansion-node-disabled',{id:t.id,fields:regions(),source}));
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
   return {complete,objectiveReady:complete,failed,phase,charge:rec.charge,exposed:rec.exposed,mark:rec.mark?.label??null,
    flags:{column:!!flags.localColumnSealAligned,bossManifested:!!flags.localBossManifested,bossDead:death(boss),nodeDead:death(node),stake:!!flags['place(correctedInnerStake)'],allPhysicallyReturned:!!flags.localFourBodyExit,ledgerSpent:!!flags.localLedgerCounterSpent}};
  }
  function commit(){
   if(terminal||b.phase!=='won'||!project()?.complete)return null;
   terminal=Object.freeze({stage:58,won:true,flags:Object.freeze({'act6.daedosaStopped':true,'act6.innerRevisionReady':true,'act6.fourCorporealReturned':true}),actors:structuredClone(four),profile:structuredClone(carriedProfile),settlement:false});
   return terminal;
  }
  used.add(e);sync();
  return Object.freeze({accepted:true,interact,poll,bossTurn,hurtThrough,afterNativeFire,nativeHurt,advanceReturn,project,commit,getRegion:regions,
   inspect:()=>structuredClone({phase,pendingPhase,carryOver,ritual,log,dead,fieldEvents,record:rec,enteredRoles:[...east].map(x=>x.id),boss:{hp:boss.hp,maxHp:boss.maxHp,x:boss.x}})});
 };
}
