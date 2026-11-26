import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const base=vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('../shared/assets/actors/actors.runtime.js',import.meta.url),'utf8'),base);
const limits={boss_daedosa:2177,grot_hanging:477,grot_hands:1014,grot_door:924,wonhon:1034,wonhon_knotted:847,gate_armor:531,forepaw:1608};
const nodeCount=d=>[...d.matchAll(/([MLCQZ])([^MLCQZ]*)/gi)].reduce((sum,[,cmd,body])=>sum+(body.match(/[-+]?(?:\d*\.)?\d+/g)?.length??0)/({M:2,L:2,C:6,Q:4,Z:1}[cmd.toUpperCase()]),0);
for(const [id,cap] of Object.entries(limits)){
 const asset=base.HONRO_ACTORS.assets[id], paths=asset.parts.flatMap(x=>x.paths);
 for(const p of asset.parts.filter(r=>r.paths.length>0))assert.equal(p.paths[0].lod,0,id+' body cannot disappear');
 assert(paths.every(p=>[0,1,2].includes(p.lod)),id+' valid tier');
 const n=paths.filter(p=>p.lod<=1).reduce((a,p)=>a+nodeCount(p.d),0);
 assert(n<=cap,id+' battle zoom draws '+n+' vs '+cap);
}
console.log('PASS eight Act 6 rigs preserve base geometry and satisfy battle-zoom node caps');
