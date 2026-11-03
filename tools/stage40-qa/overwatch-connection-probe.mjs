import {evaluateLegalCast} from './legal-cast.mjs';
import {evaluateInputTolerance} from './input-tolerance.mjs';
/** Two bounded normal movement arms from the exact actual R20 save. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createFinale} from './bootstrap.mjs';
const dir=process.argv[2],profilePath=dir+'/r20-overwatch-profile.json';
await writeFile(profilePath,execFileSync('xz',['-dc',dir+'/browser/turn-profile-077.json.xz']));
const source=await readFile(new URL('diagnostic-finishing.mjs',import.meta.url),'utf8'),body=source.slice(source.indexOf('function plan('),source.indexOf('function healing()'));
const rows=[];
for(const kind of ['drop','jump-left']){
 const {C,e,b,ops}=await createFinale({profilePath,entryRound:20});ops.ready();const u=e.active;assert.equal(u.id,'archer');
 const state=()=>({x:u.x,y:u.y,hp:u.hp,move:u.moveLeft,grounded:e.grounded(u),canDrop:e.canDrop(),support:e.contactSurface(u.x,u.y-4,u.y+5)?.t.id,round:b.round,active:e.active.id});
 const start=state();for(let i=0;i<120&&u===e.active&&u.moveLeft>100&&u.x>1800;i++){ops.move(-1,C.STEP);ops.frame();}ops.ready();const edge=state();
 const accepted=kind==='drop'?ops.drop():ops.jump();
 for(let i=0;i<160&&e.active===u;i++){if(i<60&&u.moveLeft>100)ops.move(-1,C.STEP);ops.frame();}ops.ready();const actions=[],live=JSON.stringify(b),choice=new Function('C','b','e','actions','evaluateLegalCast','evaluateInputTolerance','assert',body+';return plan();')(C,b,e,actions,evaluateLegalCast,evaluateInputTolerance,assert);assert.equal(JSON.stringify(b),live);rows.push({kind,start,edge,accepted,after:state(),choice,rejected:actions});
}
await writeFile(dir+'/overwatch-connection-probe.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows,null,2));
