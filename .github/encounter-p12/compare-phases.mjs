import fs from 'node:fs';
import assert from 'node:assert/strict';
const [aPath,bPath,out]=process.argv.slice(2);
assert(aPath&&bPath&&out,'compare-phases.mjs <ACT5-PHASES A> <ACT5-PHASES B> <receipt>');
const [a,b]=[aPath,bPath].map(f=>JSON.parse(fs.readFileSync(f,'utf8')));
assert.equal(a.manifest,'8e1051183d08528a4a9594917dfc94c0e75451fae4940ac0129422dca6254879');
assert(a.status==='PASS'&&b.status==='PASS'&&a.arm==='A'&&b.arm==='B','incomplete exact runtime source');
assert.notEqual(a.manifest,b.manifest,'candidate must be independently compiled B');
const A=a.case,B=b.case;
for(const k of ['camp41','guide41','drum42','noDrum42','44rootsUpper','44rootsLower','tree44','wave50First','wave50Second','protected50'])
 assert.deepEqual(B[k],A[k],'protected native observation changed: '+k);
assert.deepEqual(b.compact,a.compact,'static provider references differ on native round trips');
assert.deepEqual(b.maps['50'],a.maps['50'],'control 50 active map alias changed');
for(const k of ['41','42','44'])assert.notEqual(b.maps[k].sha256,a.maps[k].sha256,'missing authored phase changed stage '+k);
const changed=(left,right)=>Object.keys(left).filter(k=>JSON.stringify(left[k])!==JSON.stringify(right[k]));
assert.deepEqual(changed(A.roster41,B.roster41),['a5-foe-21']);
assert.deepEqual(changed(A.roster42,B.roster42),[]);
assert.deepEqual(B.wake41,{early:false,late:true});
assert.deepEqual(B.wake42,{lower:false,upper:true});
const [a41,b41]=[A.roster41['a5-foe-21'],B.roster41['a5-foe-21']];
for(const k of ['x','y','hp'])assert.equal(b41[k],a41[k],'changed non-signed 41 '+k);
const summitDiff={};
for(const k of ['44Primary','44Fallback']){
 const X=A[k],Y=B[k];assert.equal(Y.first.spawned,X.first.spawned);
 const x=X.afterClearingBlockingHound.units,y=Y.afterClearingBlockingHound.units;
 assert.deepEqual(y.slice(0,2),x.slice(0,2),'lead rushers or physics changed');
 assert.equal(y[2].id,'a5-foe-29');
 for(const key of ['id','role','y','support','dead','reserve','flying'])assert.equal(y[2][key],x[2][key],'rear caster unsanctioned '+key);
 assert(y[2].x>x[2].x,'caster still crowded toward the leaders');
 summitDiff[k]={xA:x[2].x,xB:y[2].x};
}
const receipt={status:'PASS',manifests:[a.manifest,b.manifest],actualRun:'normal compiled stage phase functions; prepared checkpoints, not full playthrough',proof41:'two distinct waves and after-watch flank',proof42:'lower shelf stays asleep; intact drum spawns 3 after enemy turn; destroyed drum spawns 0',proof44:{paths:'upper/lower native support and local contest, not global clear',summitDiff},proof50:'control remains exact, two separate waves and both stair dependencies'};
fs.writeFileSync(out,JSON.stringify(receipt,null,2));console.log(receipt);
