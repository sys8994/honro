import fs from 'node:fs';
import assert from 'node:assert/strict';
const [before,after,dest]=process.argv.slice(2);
assert(before&&after&&dest,'compare.mjs <ENGINE A.json> <ENGINE B.json> <receipt>');
const [A,B]=[before,after].map(p=>JSON.parse(fs.readFileSync(p,'utf8')));
assert.deepEqual(A.scope,B.scope,'different stage cohort');
const receipt={status:'HOLD',A:A.identity,B:B.identity,axes:{}};
const q=v=>JSON.stringify(v);
const scopedPlacement=new Set([31,35,37,40,43,47,48,49]);
const list=(rows,fn)=>rows.filter(fn).map(x=>x.id).sort();
const sides=rows=>Object.groupBy(rows,u=>u.side);
for(const id of A.scope){
 const a=A.stages[id],b=B.stages[id],r=receipt.axes[id]={status:'HOLD'};
 try{
   assert(a.status==='PASS'&&b.status==='PASS','missing exact executed stage');
   for(const k of ['static','physics','saveIdentity'])assert.deepEqual(b[k],a[k],k+' drift');
   assert.deepEqual(b.routes.library,a.routes.library,'active art provider changed');
   assert.equal(b.routes.encoding,a.routes.encoding,'active art encoding changed');
   for(const k of ['stage','authored','events'])assert.deepEqual(b.objective[k],a.objective[k],'authored objective/route drift in '+k);
   assert.deepEqual(list(a.actor,()=>true),list(b.actor,()=>true),'lost/reordered semantic actor identifiers');
   assert.equal(new Set(b.actor.map(u=>u.id)).size,b.actor.length,'duplicate runtime IDs');
   for(const side of [...new Set(b.actor.map(u=>u.side))].filter(x=>x!==1))assert.deepEqual(sides(a.actor)[side],sides(b.actor)[side],'party/NPC mounted state drift in side '+side);
   const delta=b.actor.filter(u=>u.side===1&&q(u)!==q(a.actor.find(v=>v.id===u.id)));
   if(scopedPlacement.has(id))assert(delta.length>0,'no edited enemy state reached exact runtime');
   else assert.equal(delta.length,0,'unauthorized runtime placement change');
   const unsafe=u=>u.status!=='deferred-or-inactive'&&(u.bounds?.some(v=>!v)||(!u.nativeFlying&&u.status!=='grounded'));
   r.newUnsupported=b.support.filter(u=>u.side===1&&unsafe(u)&&!a.support.some(v=>v.id===u.id&&unsafe(v)));
   assert.equal(r.newUnsupported.length,0,'new unsafe/outside native hostile spawn');
   if(id>=41){
     assert(a.act5Cases&&b.act5Cases,'no executed Act5 phases');
     for(const k of ['flow','links','sites','required','contest','groups'])assert.deepEqual(a.act5Cases[k],b.act5Cases[k],'Act5 '+k+' drift');
     const identity=w=>w.map(({id,key,when,units})=>({id,key,when,units}));
     assert.deepEqual(identity(a.act5Cases.waves),identity(b.act5Cases.waves),'wave eligibility/roster contract drift');
     assert(b.act5Cases.globalEliminationNotVictory.stillIncomplete===true,'global clear victory bypass');
   }
   r.changedIds=delta.map(u=>u.id);r.mapA=a.routes.map;r.mapB=b.routes.map;r.status='PASS';
 }catch(e){r.failure=String(e);}
}
if(A.status==='PASS'&&B.status==='PASS'&&Object.values(receipt.axes).every(x=>x.status==='PASS'))receipt.status='PASS';
fs.writeFileSync(dest,JSON.stringify(receipt,null,2));
console.log(receipt.status,Object.fromEntries(Object.entries(receipt.axes).map(([k,v])=>[k,v.failure??v.status])));
process.exitCode=receipt.status==='PASS'?0:1;
