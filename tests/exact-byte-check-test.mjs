import assert from 'node:assert/strict';
import {assertExactBytes} from './exact-byte-check.mjs';
assert.doesNotThrow(()=>assertExactBytes(Buffer.from([0,1,255]),Buffer.from([0,1,255]),'equal'));
assert.throws(()=>assertExactBytes(Buffer.from([0,1]),Buffer.from([0]),'length'),/byte length differs/);
assert.throws(()=>assertExactBytes(Buffer.from([0,1,255]),Buffer.from([0,2,254]),'difference'),/2\/3 bytes differ; first index 1 \(actual 1, expected 2\), max delta 1/);
assert.throws(()=>assertExactBytes(Buffer.from([0,1,2]),Buffer.from([0,1,3]),'last-byte'),/first index 2/);
const large=Buffer.alloc(6293008),changed=Buffer.from(large);changed[changed.length-1]=1;assert.throws(()=>assertExactBytes(changed,large,'large'),/1\/6293008 bytes differ; first index 6293007/);
console.log('PASS exact byte equality, length and first/last byte mismatch reporting, including 6.3MB');
