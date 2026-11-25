// Stage 6-3 local source candidate. No victory, save, stats, phase or supplied
// archive restoration. The App must bind ordinary trusted input/owner/renderer.
const lower='south', upper='upper-threshold-footing', first='act6.innerStakeAReady';
const skill='M09', near=(x,a,b)=>Number.isFinite(x)&&x>=a&&x<=b;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const denied=reason=>({ok:false,reason});
export function createStage53PhysicalActions({C, authenticate, entryX=425, passageX=425}){
 const owners=new WeakMap();
 const safe=(app,e,g)=>!!g&&g.app===app&&g.b===e?.b&&app.engine===e&&app.stageId===53&&
   !app.debugMode&&!app.training&&!app.workshopMode&&!app.customMap&&!app.embedded&&authenticate(app,e,g.author)&&
   e.b.units.filter(u=>u.side===0&&!u.dead&&!u.summoned).length===1&&e.unit(g.u.id)===g.u;
 const current=(app,e)=>{const g=owners.get(e);return safe(app,e,g)?g:null;};
 const contact=(e,u)=>e.contactSurface(u.x,u.y-4,u.y+4)?.t.id;
 const live=(e,g)=>e.active===g.u&&g.u.side===0&&g.u.hp>0&&!g.u.dead&&e.canAct()&&e.grounded(g.u)&&C.validTerrainContactPose(e.b.terrain,g.u);
 function mount(app,e,author){
  if(!authenticate(app,e,author)||owners.has(e))return false;
  const b=e.b,u=b.units.find(u=>u.side===0&&!u.summoned&&!u.dead);
  if(!u||u.cls!=='mage'||!Array.isArray(u.loadout)||b.stakes?.length||b.honroState?.flags?.[first]||b.projectiles?.length)return false;
  const g={app,b,u,author,launch:null,pair:null};
  if(!safe(app,e,g)||!live(e,g)||contact(e,u)!==lower||u.x!==entryX)return false;
  if(![lower,upper].every(id=>b.terrain.filter(t=>t.id===id).length===1))return false;
  // These are two visible retained pieces of the authored passage, not an
  // invisible teleport. Native Engine owns useGate's check and movement.
  const control=(id,surface,x)=>({id,x,y:C.topAt(b.terrain.find(t=>t.id===surface),x),side:0,skill,rank:1,owner:u.id,hp:90,r:13,h:36,authoredPassage:true});
  const pair=[control(11,lower,passageX),control(12,upper,2640)];
  if(pair.some(s=>!Number.isFinite(s.y)))return false;
  for (const s of pair) if(!C.validTerrainContactPose(b.terrain,{...u,x:s.x,y:s.y}))return false;
  b.stakes=pair;
  g.pair=pair.slice();
  owners.set(e,g);
  return true;
 }
 function usePassage(app,e){
  const g=current(app,e);
  if(!g||!live(e,g)||g.launch||!g.pair.every(p=>g.b.stakes.includes(p)))return denied('지금은 남은 진목 사이로 건널 수 없습니다.');
  const p=contact(e,g.u);
  const expected=p===lower?g.pair[1]:p===upper?g.pair[0]:null;
  if(!expected)return denied('진목에 가까이 서야 합니다.');
  if(!e.useGate())return denied('진목에 가까이 서야 합니다.');
  return {ok:true,grounded:e.grounded(g.u),destination:expected.id};
 }
 function aim(app,e){
  const g=current(app,e);
  if(!g||!live(e,g)||g.b.honroState?.flags?.[first]||contact(e,g.u)!==upper||!near(g.u.x,2520,2700))return null;
  if(g.launch&&g.b.projectiles?.some(p=>p.shot===g.launch))return null;
  if(g.launch&&g.b.stakes?.some(p=>p.shot===g.launch&&p.skill===skill&&p.owner===g.u.id&&near(p.x,2450,2600)))return null;
  return C.SKILLS[skill];
 }
 function cast(app,e,angle,power){
  const available=aim(app,e),g=current(app,e);
  if(!available||!g||!Number.isFinite(angle)||!near(power,0.00001,1))return denied('이 자리에서는 진목을 놓을 수 없습니다.');
  const prediction=e.predict(g.u,available,angle,power,undefined,true);
  if(prediction?.terrain!==upper||!near(prediction.x,2450,2600))return denied('문지방 안쪽의 받침을 겨누십시오.');
  // Engine.fire checks includes(), so grant only the exact existing skill
  // for this synchronous attempt. Slots, rank and persisted profile unchanged.
  const eq=g.u.loadout, prior=Object.getOwnPropertyDescriptor(eq,'includes'), native=eq.includes, contents=eq.slice();
  let ok;
  try {
    Object.defineProperty(eq,'includes',{configurable:true,value:(s,...q)=>s===skill||native.call(eq,s,...q)});
    ok=e.fire(skill,angle,power);
  } finally {
    if(prior)Object.defineProperty(eq,'includes',prior);else delete eq.includes;
  }
  if(!same(eq,contents))throw new Error('Stage53 action mutated equipped slots');
  if(!ok)return denied('아직 진목을 쓸 수 없습니다.');
  g.launch=g.b.shot;
  return {ok:true,skill,shot:g.launch,aim:[prediction.x,prediction.y]};
 }
 return Object.freeze({mount,usePassage,aim,cast});
}
