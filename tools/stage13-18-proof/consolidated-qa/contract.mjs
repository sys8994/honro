import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const [mode,a,b,out]=process.argv.slice(2);
const raw=p=>JSON.parse(readFileSync(path.join(p,'shared/data/campaign.json'),'utf8'));
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const x=raw(a),y=raw(b);
if(mode==='metadata'){
 const A=x.stages[20],B=y.stages[20],stage22Hash=hash(x.stages[21]);
 assert.equal(hash(A),'6fa15f07f7cc67eff736408e7057ea12b1d8e30963e55f7952ec91e8e668cb35');
 assert.equal(hash(B),'fafb2dcacc8fcc184b66c89728adc749ec83a16d9285ccb7b1693e2b65c8d0a4');
 assert.equal(hash(y.stages[21]),stage22Hash);
 assert.equal(A.terrains.length,23);assert.equal(B.terrains.length,23);
 for(let n=0;n<23;n++){const t=B.terrains[n];assert.equal(hash(t.detail),'4c9d671298e1c3a4bee9e814842705d2f5e9a56770bb18775838f8bbe42ddeaf');delete t.detail;}
 assert.equal(JSON.stringify(x),JSON.stringify(y));
 writeFileSync(out,JSON.stringify({mode,stage21Before:'6fa15f07f7cc67eff736408e7057ea12b1d8e30963e55f7952ec91e8e668cb35',stage21After:'fafb2dcacc8fcc184b66c89728adc749ec83a16d9285ccb7b1693e2b65c8d0a4',stage22Hash,exactOutside23NamedDetailFields:true})+'\n');
}else{
 assert.equal(mode,'stage22');
 const s=x.stages[21],t=y.stages[21],ids=['v22-art-built-buried-west-foundation','v22-art-built-buried-east-foundation'];
 const old=s.design.space.terrainPlanes;
 assert.deepEqual(t.design.space.terrainPlanes,old.filter(q=>!ids.includes(q.id)));
 assert(old.filter(q=>ids.includes(q.id)).length===2);
 t.design.space.terrainPlanes=old;
 assert.equal(JSON.stringify(x),JSON.stringify(y));
 writeFileSync(out,JSON.stringify({mode,exactOutsideTwoAlreadyVerifiedPlaneRows:true,ids})+'\n');
}
