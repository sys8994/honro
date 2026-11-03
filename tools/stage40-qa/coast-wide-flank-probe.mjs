/** Registered three-distance normal flank arms; no search-until-success. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createFinale} from './bootstrap.mjs';
import {evaluateLegalCast} from './legal-cast.mjs';
import {evaluateInputTolerance} from './input-tolerance.mjs';
const dir=process.argv[2],profilePath=dir+'/coast-final-profile.json';await writeFile(profilePath,execFileSync('xz',['-dc',dir+'/coast/final-storage.json.xz']));
const source=await readFile(new URL('diagnostic-finishing.mjs',import.meta.url),'utf8'),body=source.slice(source.indexOf('function plan('),source.indexOf('function healing()')),rows=[];
for(const distance of [240,400,560]){
 const {C,e,b,ops,app,g}=await createFinale({profilePath,entryRound:4});ops.ready();ops.frame();for(let i=0;i<120&&g.HonroStory.turnPaused(app,ops.now);i++)ops.frame();assert(!g.HonroStory.turnPaused(app,ops.now));const u=e.active;assert.equal(u.id,'mage');
 const pose=()=>({x:u.x,y:u.y,facing:u.facing,move:u.moveLeft,hp:u.hp,round:b.round,active:e.active.id,support:e.contactSurface(u.x,u.y-4,u.y+5)?.t.id}),start=pose();
 for(let i=0;i<220&&e.active===u&&u.moveLeft>100&&u.x<start.x+distance;i++){ops.move(1,C.STEP);ops.frame();}ops.ready();
 const inspect=()=>{const live=JSON.stringify(b),actions=[],choice=new Function('C','b','e','actions','evaluateLegalCast','evaluateInputTolerance','assert',body+';return plan(e.active.facing);')(C,b,e,actions,evaluateLegalCast,evaluateInputTolerance,assert);assert.equal(JSON.stringify(b),live);return{pose:pose(),choice,rejected:actions};};
 const right=inspect();for(let i=0;i<8&&e.active===u;i++){ops.move(-1,C.STEP);ops.frame();}ops.ready();const left=inspect();rows.push({distance,start,right,left});await writeFile(dir+'/coast-wide-flank-probe.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows.at(-1)));
}
