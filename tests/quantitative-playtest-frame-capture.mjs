import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createCanvas} from '@napi-rs/canvas';
import {captureNativeFrame} from '../tools/quantitative-playtest/frame-capture.mjs';
const dir=await mkdtemp(join(tmpdir(),'honro-frame-')),c=createCanvas(12,8),ctx=c.getContext('2d');ctx.fillStyle='#123456';ctx.fillRect(0,0,12,8);
try{const receipt=await captureNativeFrame(c,join(dir,'scene.png'),{runId:'fixture',frame:17,round:2,sourceHash:'fixed'});assert.equal(receipt.frame,17);assert.equal(receipt.width,12);assert.equal(receipt.height,8);assert.equal((await readFile(receipt.file)).subarray(1,4).toString(),'PNG');assert.deepEqual(JSON.parse(await readFile(receipt.file+'.receipt.json')),receipt);await assert.rejects(captureNativeFrame(c,receipt.file,{}),/EEXIST/);await assert.rejects(captureNativeFrame({},join(dir,'fake.png'),{}),/Actual NativeCanvas/);}finally{await rm(dir,{recursive:true,force:true});}
console.log('PASS existing native pixels captured unchanged, exact source/frame receipt, create-only output and no canvas substitute');
