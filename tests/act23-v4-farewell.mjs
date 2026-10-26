/** Physical scene-state fixtures on authored geography; not normal campaign play. */
import assert from 'node:assert/strict';
import {runtimeCandidate,battlefield,plain} from './act23-v4-helpers.mjs';
const g=await runtimeCandidate(),V=g.HonroAct23V4,C=g.HONRO_CORE;
const orders=[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]];
function place(q,id,cls){const p=V.marker(q.b,id),u=q.b.units.find(u=>u.cls===cls);Object.assign(u,{x:p.x,y:p.y,acted:false,vx:0,vy:0,airborne:false,jumping:false});q.b.active=u.id;q.b.side=0;q.b.phase='aim';return p;}
function resume(q){const b=plain(q.b),e=new C.Engine(b,()=>{},true),app={...q.app,engine:e};V.prepare(b,q.p);V.bindApp(app,e);return{...q,b,e,app};}
for(const order of orders){let q=battlefield(g,19);assert(V.use(q.app,place(q,'route','mage')));V.tick(q.app,0);assert.equal(q.b.units.find(u=>u.cls==='mage').side,2);
 for(const [index,n]of order.entries()){
  const id='separate-'+n,p=place(q,id,'occultist');assert(V.eligibility(q.app,p).ok);assert(V.use(q.app,p));assert(V.mem(q.b).done[id]);V.tick(q.app,.05);
  const moving=V.mem(q.b).farewell['send-'+n];assert.equal(moving.from.x,p.x);assert.equal(moving.from.y,p.y);assert.equal(moving.status,'moving');assert.equal(V.use(q.app,V.marker(q.b,'send-'+n)),false,'departures need no second interaction');
  if(index===1){q=resume(q);assert.equal(V.mem(q.b).farewell['send-'+n].status,'moving');}
  for(let i=0;i<22;i++)V.tick(q.app,.05);
  assert.equal(V.mem(q.b).farewell['send-'+n].status,'done');assert(V.mem(q.b).done['send-'+n]);assert.equal(V.mem(q.b).checkpoints.filter(c=>c.id==='send-'+n).length,1);
  for(const other of order.slice(index+1))assert.equal(V.mem(q.b).farewell?.['send-'+other],undefined,'a different clicked soul cannot start this departure');
 }
 assert.equal(V.state(q.b).complete,false,'transport marks are separate mandatory world proof');assert(V.use(q.app,place(q,'old-soul','occultist')));for(let i=0;i<18;i++)V.tick(q.app,.05);
 assert(V.state(q.b).complete);assert.deepEqual(plain(V.mem(q.b).transportTraceProof.ids),['mumyeong-transfer','royal-seal','jeomungol-mark']);assert.equal(q.b.units.filter(u=>u.side===1).length,0);assert.equal(q.b.honroEvents.length,0);assert.equal(q.b.honroCounters.spawned,0);
 const receipt=plain(V.mem(q.b).transportTraceProof);q=resume(q);V.tick(q.app,.1);assert.deepEqual(plain(V.mem(q.b).transportTraceProof),receipt);assert.equal(V.mem(q.b).checkpoints.filter(c=>c.id==='old-soul').length,1);console.log('PASS19 order',order.join(','),'automatic correct departures, scene reload, three physical marks and local roles');
}
{
 const q=battlefield(g,19),u=q.e.unit('p-mage'),hp=u.hp,focus=u.focus,kills=q.b.kills;u.y=q.b.height+500;q.e.recover(u);assert.equal(u.hp,hp);assert.equal(u.focus,focus);assert.equal(q.b.kills,kills);assert(C.validTerrainContactPose(q.b.terrain,u));assert(u.honroV4PeacefulReturn);console.log('PASS19 noncombat fall returns to a supported free pose without damage or invented combat history');
}
