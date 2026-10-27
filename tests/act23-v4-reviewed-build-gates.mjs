/** Inspect actual build data entries without writing generated public files. */
import assert from 'node:assert/strict';
import {runtimeEntries} from '../shared/build.mjs';
const keys=['HONRO_ACT23_V4_PHASE_A','HONRO_ACT23_V4_PHASE_B_CH11','HONRO_ACT23_V4_PHASE_B_STAGES','HONRO_ACT23_V4_PHASE_B_COMMON'];
const saved=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
try{
 for(const [name,flags,expected]of [
  ['normal',{},[false,0,false]],
  ['review flags without Phase A',{HONRO_ACT23_V4_PHASE_B_CH11:'1',HONRO_ACT23_V4_PHASE_B_STAGES:'12,16,20',HONRO_ACT23_V4_PHASE_B_COMMON:'1'},[false,0,false]],
  ['Phase A alone',{HONRO_ACT23_V4_PHASE_A:'1'},[false,0,false]],
  ['reviewed act2 plus common',{HONRO_ACT23_V4_PHASE_A:'1',HONRO_ACT23_V4_PHASE_B_CH11:'1',HONRO_ACT23_V4_PHASE_B_STAGES:'12,13,14,15,16,17,18,19,20',HONRO_ACT23_V4_PHASE_B_COMMON:'1'},[true,9,true]]
 ]){
  for(const k of keys)delete process.env[k];Object.assign(process.env,flags);
  const entries=await runtimeEntries({vector:false,render:false}),get=n=>entries.find(x=>x.global===n)?.data;
  assert.equal(!!get('HONRO_ACT23_V4_REVIEWED'),expected[0],name);
  assert.equal(Object.keys(get('HONRO_ACT23_V4_REVIEWED_CHAPTERS')).length,expected[1],name);
  assert.equal(!!get('HONRO_ACT23_V4_REVIEWED_COMMON'),expected[2],name);
  if(expected[1])assert.equal(get('HONRO_ACT23_V4_REVIEWED').rows.length+Object.values(get('HONRO_ACT23_V4_REVIEWED_CHAPTERS')).reduce((sum,d)=>sum+d.rows.length,0),344);
  console.log('PASS actual build payload gate:',name);
 }
}finally{for(const k of keys)if(saved[k]===undefined)delete process.env[k];else process.env[k]=saved[k];}
