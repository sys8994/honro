// The isolated stage13 art test forbids ANY main/portrait change from934.
// This mixed feature intentionally changes those two files. Reuse every other
// authored/runtime/material assertion; keep the original guard failure visible.
import {readFile,writeFile,unlink} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const source=await readFile('tests/stage13-vector-art.mjs','utf8');
for(const name of ['shared/runtime/main.js','shared/runtime/portraits.js'])assert.equal(source.split("'"+name+"'").length,2);
const adapted=source.replace("'shared/runtime/main.js',",'').replace(",'shared/runtime/portraits.js'",'');
const target='tests/.portrait-stage13-preservation.mjs';
await writeFile(target,adapted);
try{process.stdout.write(execFileSync(process.execPath,[target],{cwd:process.cwd(),env:process.env,maxBuffer:10*1024*1024}));}finally{await unlink(target);}
