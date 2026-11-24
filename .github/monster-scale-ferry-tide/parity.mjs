import fs from 'node:fs';
import assert from 'node:assert/strict';
const [a,b]=process.argv.slice(2).map(p=>JSON.parse(fs.readFileSync(p+'/PALETTES.json')));
assert.equal(a.status,'PASS');assert.equal(b.status,'PASS');
assert.equal(a.project,b.project);
for(const k of ['6','30','40','44']){
 const x=a.stages[k],y=b.stages[k];
 for(const s of ['coords','actors','goals','terrain'])assert.deepEqual(x[s],y[s],k+' '+s);
 if(k==='30'||k==='40'){
  assert.equal(x.usedTone,null);assert.equal(y.usedTone,k==='30'?'quayStoneDust':'saltTimber');
  assert.notDeepEqual(x.render,y.render);
 }else assert.deepEqual(x.render,y.render,k+' other pilot appearance');
}
console.log('PASS palette only, 30/40 unchanged mission and collision, exact Stage6/Grove active art.');
