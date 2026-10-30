import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {controllerHash,checkFreeze} from '../tools/quantitative-playtest/freeze.mjs';
const dir=await mkdtemp(join(tmpdir(),'honro-freeze-')),path=join(dir,'manifest.json');
try{
 const run={stage:31,policy:'advance',seed:1001,maxFrames:600,maxWallSeconds:60};
 const m={controllerHash:await controllerHash(),stages:[31],policies:['advance'],seeds:[1001],maxFrames:600,maxWallSeconds:60};
 await writeFile(path,JSON.stringify(m));assert.equal((await checkFreeze(path,run)).controllerHash,m.controllerHash);
 for(const changed of [{seed:1002},{policy:'companions'},{stage:39},{maxFrames:601},{maxWallSeconds:61}])await assert.rejects(checkFreeze(path,{...run,...changed}));
 await writeFile(path,JSON.stringify({...m,controllerHash:'changed'}));await assert.rejects(checkFreeze(path,run));
 console.log('PASS frozen controller hash and preregistered stage/policy/seed/frame/wall budgets');
}finally{await rm(dir,{recursive:true});}
