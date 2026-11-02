/** Validate all published Act 4 stage bounds using the checkout's real bounds code. */
import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import path from'node:path';import vm from'node:vm';
const root=process.argv[2]||'.',g=vm.createContext({});vm.runInContext(await readFile(path.join(root,'shared/map/bounds.js'),'utf8'),g);
const world=JSON.parse(await readFile(path.join(root,'shared/data/act4/world.json'),'utf8'));assert.equal(world.stages.length,10);
for(let i=31;i<=40;i++){const s=world.stages.find(v=>v.metadata.stageId===i);assert(s,`missing ${i}`);const errors=g.HonroBounds.validate(s);assert.equal(errors.length,0,JSON.stringify({stage:i,errors}));}
console.log('PASS published 31–40 bounds fixtures; not general schema or mission acceptance');
