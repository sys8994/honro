// Actual production Engine descendants must retain one camera action. No damage
// or physics mocks: run attached and unattached twins and compare battle bytes.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {runtimeParts} from '../shared/build.mjs';
const g=vm.createContext({console,performance,structuredClone,setTimeout,clearTimeout});g.window=g;
for(const code of await runtimeParts({vector:false,render:false}))vm.runInContext(code,g);
const C=g.HONRO_CORE,A=g.HonroAttackCamera;
function fixture(cls,skill){
 const p=C.defaults(),b=C.createBattle(1,p,'practice',{party:[cls],wind:0}),u=b.units.find(u=>u.side===0);b.units=[u];b.fields=[];b.waters=[];b.drafts=[];b.width=6000;b.height=3000;b.terrain=[{id:'floor',x:0,y:2000,w:6000,h:1000,mat:'rock',hp:99999,maxHp:99999,indestructible:true}];Object.assign(u,{x:600,y:2000,vx:0,vy:0,focus:10000,maxFocus:10000,hp:10000,maxHp:10000,acted:false,airborne:false,loadout:[skill],ranks:{[skill]:8,AP01:cls==='archer'?4:0}});b.active=u.id;b.phase='aim';b.side=0;
 const cb=structuredClone(b),e=new C.Engine(b),control=new C.Engine(cb),scene={x:0,y:0,scale:.6,manual:false},app={engine:e,scene};e.checkEnd=control.checkEnd=()=>false;A.prime(scene,b);A.attach(app,e);return{b,cb,e,control,scene,u};
}
function same(f){assert.equal(JSON.stringify(f.b),JSON.stringify(f.cb),'camera observer cannot alter battle bytes');assert.equal(A.status(f.scene).attacks,1);assert(A.blocksFocus(f.scene),'descendants must preserve current attack manual intent');}
{
 const f=fixture('archer','A01');assert(f.e.fire('A01',30,.8));assert(f.control.fire('A01',30,.8));A.manual(f.scene);const n=f.b.projectiles.length;
 f.e.stepVolley(2);f.control.stepVolley(2);assert(f.b.projectiles.length>n);same(f);
 // Predictions and rejected casts are not accepted camera actions.
 const intent=A.status(f.scene).intent;f.e.predict(f.u,C.SKILLS.A01,35,.8);assert.equal(A.status(f.scene).intent,intent);assert(!f.e.fire('missing',0,.5));same(f);
}
{
 const f=fixture('mage','M11');assert(f.e.fire('M11',30,.7));assert(f.control.fire('M11',30,.7));A.manual(f.scene);
 for(let generation=0;generation<2;generation++)for(const [e,b]of [[f.e,f.b],[f.control,f.cb]])for(const p of [...b.projectiles])e.impact(p,{x:1000,y:1000,t:0,n:{x:p.vx>=0?-1:1,y:0},terrain:b.terrain[0]});
 assert(f.b.projectiles.some(p=>p.child));same(f);
}
{
 const skill=Object.values(C.SKILLS).find(s=>s.cls==='mage'&&['emberOrb','frostOrb','stormOrb'].includes(s.mode));assert(skill,'real recurring emission skill');const f=fixture('mage',skill.id);assert(f.e.fire(skill.id,30,.7,!!skill.enemyOnly),skill.id);assert(f.control.fire(skill.id,30,.7,!!skill.enemyOnly),skill.id);A.manual(f.scene);
 for(let wave=0;wave<3;wave++)for(const b of [f.b,f.cb]){const p=b.projectiles.find(p=>!p.child);p.age=wave*.5+.3;(b===f.b?f.e:f.control).emitSubProjectiles(p);}
 assert(f.b.projectiles.some(p=>p.child));same(f);
}
console.log('PASS actual action boundaries: scheduled volley, reflection/split descendants, sustained emission waves, prediction/rejected casts; attached/unattached battle bytes identical');
