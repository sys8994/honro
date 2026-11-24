import assert from 'node:assert/strict';
const live=u=>u&&u.side===1&&!u.dead&&u.hp>0&&!u.honroAct5Reserve;
const copy=x=>JSON.parse(JSON.stringify(x));
// Explicit prepared state inputs; these are native runtime event/wave tests, not player controls.
export function act5Probe(G,e,content,makeEngine,support){
 const b=e.b,d=b.honroMap?.act5,A=G.HonroAct5;
 assert(A.active(b)&&d&&Array.isArray(d.flow));
 const byId=id=>b.units.find(u=>u.id===id);
 const missing=[...new Set([...Object.values(d.groups??{}).flat(),...Object.values(d.required??{}).flat(),...d.waves.flatMap(x=>x.units)])].filter(id=>!byId(id));
 assert.deepEqual(missing,[],'live objective/guard/wave IDs missing');
 const receipt={flow:copy(d.flow),links:copy(d.links),sites:copy(d.sites),required:copy(d.required??{}),contest:copy(d.contest??{}),groups:copy(d.groups??{}),waves:copy(d.waves),wake:copy(d.wakeGroups??{}),waveTests:[]};
 for(const wave of d.waves){
   if(!['commander','reverse','stable'].includes(wave.when))continue;
   const E=makeEngine(copy(b)),B=E.b,m=B.honroState.act5??={step:0,beats:{}};
   m.step=0;if(wave.when==='stable'||wave.when==='reverse')m.field='qa-before-event';
   const app={engine:E,stage:content,notify:t=>notice.push(t),checkMission:()=>false,canInput:()=>false,sayLines(){},scene:{},updateHUD(){},dialogue:null,done:false};
   const notice=[];
   const W=()=>wave.units.map(id=>{const u=E.unit(id);assert(u,'missing exact member: '+id);return{id,live:live(u),x:u.x,y:u.y,reserve:!!u.honroAct5Reserve,support:support(E,u)};});
   const before=W(),N=B.honroCounters.spawned;
   assert(before.every(u=>u.reserve&&!u.live),'wave members were not initially reserved');
   if(wave.when==='commander'){
     const com=E.unit(d.groups.commander[0]);assert(live(com));com.hp=Math.floor(com.maxHp*.65)+1;
     A.tick(app,1/120);assert(m.waves?.[wave.id]===undefined,'wave fired above 65%');
     com.hp=Math.floor(com.maxHp*.65);
   }else{
     A.tick(app,1/120);assert(m.waves?.[wave.id]===undefined,'wave fired before matching field');
     m.field=wave.when;
   }
   A.tick(app,1/120);
   assert.equal(m.waves?.[wave.id],'pending','native wave cue not emitted on trigger');assert(W().every(u=>u.reserve&&!u.live),'reserve appeared before warning expiry');
   for(let i=0;i<120;i++)A.tick(app,1/120);
   const status=m.waves?.[wave.id],arrival=W(),spawned=B.honroCounters.spawned-N;
   for(let i=0;i<120;i++)A.tick(app,1/120);
   const after=W(),again=B.honroCounters.spawned-N;
   receipt.waveTests.push({id:wave.id,when:wave.when,notices:notice,cueCount:notice.filter(t=>t===wave.text).length,before,status,arrival,after,spawned,again});
   assert.equal(status,'arrived','exact authored phase did not land all wave members');
   assert(arrival.every(u=>u.live&&!u.reserve),'native wave member not active');
   assert(arrival.every(u=>u.support.nativeFlying||u.support.nativeContact),'unsupported actual ground wave member');
   assert.equal(notice.filter(t=>t===wave.text).length,1,'wave notice repeated');
   assert.equal(again,spawned,'spawn count repeated after settling');
 }
 const E=makeEngine(copy(b)),B=E.b,m=B.honroState.act5??={step:0,beats:{}};
 const app={engine:E,stage:content,notify(){},checkMission:()=>false,canInput:()=>false,sayLines(){},scene:{},updateHUD(){},dialogue:null,done:false};
 const state=()=>G.HonroObjectives.state(B,content);
 assert(!state().complete,'fresh mission already complete');
 for(const u of B.units)if(u.side===1){u.dead=true;u.hp=0;}
 for(let i=0;i<4;i++)A.tick(app,1/120);
 assert(!state().complete,'global clear bypasses actual Act5 route');
 receipt.globalEliminationNotVictory={stillIncomplete:true,current:state().currentObjectiveId??state().checklist?.find(v=>v.current)?.id,description:state().currentInstruction};
 if([47,48,49].includes(b.honroStage)){
   const C=makeEngine(copy(b)),P=C.b,O={engine:C,stage:content,notify(){},checkMission:()=>false,canInput:()=>false,sayLines(){},scene:{},updateHUD(){},dialogue:null,done:false};
   const memory=P.honroState.act5??={step:0,beats:{}},[kind,key,_,cls]=d.flow[0],where=d.sites[key],mark={id:'a5-step-0',...where,label:d.flow[0][2]};
   function activateAtSite(unit,place=where){
     const cand=[0,-16,16,-32,32,-48,48,-64,64].map(v=>[place.x+v,C.contactSurface(place.x+v,place.y-95,place.y+95)]).find(([,c])=>c&&Math.abs(c.y-place.y)<=95);
     assert(cand,'no tested native footing at initial phase point');
     const [x,c]=cand;P.active=unit.id;Object.assign(unit,{x,y:c.y,vx:0,vy:0,airborne:false,jumping:false});
     assert(C.grounded(unit),'prepared pose is not native grounded');
     return{x,y:c.y,terrain:c.t.id};
   }
   if(kind==='use'){
     const mage=P.units.find(u=>u.side===0&&u.cls===cls),wrong=P.units.find(u=>u.side===0&&u.cls!==cls);
     assert(mage&&wrong&&mage!==wrong);
     P.active=mage.id;const wrongLocation=A.eligibility(O,mark);assert(!wrongLocation.ok,'initial use accepted out of bounds');
     const correct=activateAtSite(mage);
     const contested=A.eligibility(O,mark);assert(!contested.ok,'initial stake skipped live contest');
     const local=(d.groups[d.contest[key].group]??[]).map(id=>C.unit(id)).filter(live);
     const oldLive=P.units.filter(live).length;for(const u of local){u.dead=true;u.hp=0;}
     activateAtSite(wrong);
     const wrongClass=A.eligibility(O,mark);assert(!wrongClass.ok,'wrong class accepted same native footing after contest');
     activateAtSite(mage);
     const allowed=A.eligibility(O,mark);assert(allowed.ok,'correct mage, clear local contest rejected');
     assert(oldLive>local.length,'no unrelated survivors present to prove local gate');
     assert(A.use(O,mark)&&memory.step===1,'actual native stake-use did not advance flow');
     const stale=A.eligibility(O,mark);assert(!stale.ok,'initial stake remains enabled on next phase');
     receipt.openingGate={kind,key,correct,wrongLocation,contested,wrongClass,allowed,stale,step:memory.step,localIds:local.map(u=>u.id),unrelatedSurvivors:P.units.filter(live).length};
   }else if(kind==='reach'){
     A.tick(O,1/120);assert.equal(memory.step,0,'first reach falsely triggered from original launch');
     const target=P.units.find(u=>u.side===0&&u.id===P.active);
     assert(target);
     const correct=activateAtSite(target);
     A.tick(O,1/120);assert.equal(memory.step,1,'native supported descent marker did not advance');
     receipt.openingGate={kind,key,correct,step:memory.step,unrelatedSurvivors:P.units.filter(live).length};
   }
 }
 return receipt;
}
