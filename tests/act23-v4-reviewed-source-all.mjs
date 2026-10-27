/** Canonical source/delivery/alias audit, not gameplay or reachability proof. */
import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';import{runtimeEntries}from'../shared/build.mjs';
const root='game/docs/story/v4-reviewed/',ids=new Set();let total=0;
for(const suffix of [...Array.from({length:20},(_,i)=>'CH'+(i+11)),'COMMON']){
 const source=JSON.parse(await readFile(root+'HONRO-'+suffix+'-reviewed-final.json')),data=JSON.parse(await readFile('shared/data/reviewed/act23-v4-'+(suffix==='COMMON'?'common':'ch'+suffix.slice(2))+'.json'));
 for(const row of source.rows){assert(!ids.has(row.id),row.id);ids.add(row.id);const actual=data.rows.find(r=>r.id===row.id);assert(actual,row.id);for(const [key,value]of Object.entries(row))assert.deepEqual(actual[key],value,row.id+' '+key);total++;}
 assert.equal(data.rows.length,source.rows.length,suffix);for(const [key,value]of Object.entries(source))if(!['rows','status'].includes(key))assert.deepEqual(data[key],value,suffix+' '+key);if(data.status!==source.status)assert.equal(data.adopted_status_verbatim,source.status,suffix+' verbatim status');
}
assert.equal(total,676);console.log('PASS all676 canonical IDs/body/condition/delivery and every original row field; all alias/retire contracts retained');
const stages=Array.from({length:10},(_,i)=>i+21),keys=['HONRO_ACT23_V4_PHASE_A',...stages.map(n=>'HONRO_ACT23_V4_PHASE_B_CH'+n)],saved=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
try{
 for(const scenario of ['default','flags-without-phase','private-all','private30-alias']){
  for(const k of keys)delete process.env[k];if(scenario==='flags-without-phase'||scenario==='private-all')for(const n of stages)process.env['HONRO_ACT23_V4_PHASE_B_CH'+n]='1';if(scenario.startsWith('private'))process.env.HONRO_ACT23_V4_PHASE_A='1';if(scenario==='private30-alias')process.env.HONRO_ACT23_V4_PHASE_B_CH30='1';
  const entries=await runtimeEntries({vector:false,render:false}),get=k=>entries.find(e=>e.global===k)?.data;
  for(const n of stages){assert.equal(get('HONRO_ACT23_V4_PHASE_B_CH'+n),scenario==='private-all'||scenario==='private30-alias'&&n===30);assert.equal(!!get('HONRO_ACT23_V4_REVIEWED_CH'+n),scenario==='private-all'||scenario==='private30-alias'&&[21,30].includes(n));}
  console.log('PASS production/private Act3 payload gate: '+scenario);
 }
}finally{for(const k of keys)if(saved[k]===undefined)delete process.env[k];else process.env[k]=saved[k];}
