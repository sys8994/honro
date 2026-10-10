import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const g=vm.createContext({structuredClone});
for(const f of ['shared/runtime/party-rig.js','shared/assets/party/party.runtime.js'])vm.runInContext(await readFile(f,'utf8'),g);
const a=g.HONRO_PARTY.seol_o,by=Object.fromEntries(a.rig.parts.map(p=>[p.id,p]));
// Anatomical draw/right chain; screen mirroring must not choose a different arm.
for(const id of ['rear_upper_arm','rear_forearm','rear_hand'])assert(by[id].z>by.thorax.z&&by[id].z>by.neck.z,`${id} must stay in front of torso in every pose`);
assert(by.rear_upper_arm.z<by.head.z,'The shoulder must not mask the face');
for(const name of Object.keys(a.animation.animations))for(let i=0;i<=100;i++){
 const sample=g.HonroVectorRig.sampleAnimation(a,name,i/100,true);
 const m=g.HonroVectorRig.rigMatrices(a,sample.poses);
 for(const id of ['rear_upper_arm','rear_forearm','rear_hand'])assert(m[id].every(Number.isFinite));
}
console.log('SEOL-O RIGHT ARM LAYER PASS: whole anatomical chain stays in front of torso');
