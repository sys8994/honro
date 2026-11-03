/** Read-only plan comparison and one bounded exposed movement from actual failure save. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createFinale} from './bootstrap.mjs';
import {evaluateLegalCast} from './legal-cast.mjs';
import {evaluateInputTolerance} from './input-tolerance.mjs';
const dir=process.argv[2],profilePath=dir+'/coast-final-profile.json';await writeFile(profilePath,execFileSync('xz',['-dc',dir+'/coast/final-storage.json.xz']));
const {C,e,b,ops,app,g}=await createFinale({profilePath,entryRound:4});ops.ready();ops.frame();for(let i=0;i<120&&g.HonroStory.turnPaused(app,ops.now);i++)ops.frame();assert(!g.HonroStory.turnPaused(app,ops.now),'Turn notice wait bound');const u=e.active;assert.equal(u.id,'mage');
const source=await readFile(new URL('diagnostic-finishing.mjs',import.meta.url),'utf8'),body=source.slice(source.indexOf('function plan('),source.indexOf('function healing()'));
const rows=[];const inspect=label=>{const before=JSON.stringify(b),actions=[],run=(facing)=>new Function('C','b','e','actions','evaluateLegalCast','evaluateInputTolerance','assert',body+';return plan('+facing+');')(C,b,e,actions,evaluateLegalCast,evaluateInputTolerance,assert),any=run('null'),faced=run('e.active.facing');assert.equal(JSON.stringify(b),before);rows.push({label,pose:{x:u.x,y:u.y,facing:u.facing,move:u.moveLeft,hp:u.hp,round:b.round},any,faced,rejected:actions});};
inspect('actual failed pose');for(let i=0;i<8&&e.active===u;i++){ops.move(1,C.STEP);ops.frame();}ops.ready();inspect('one normal right-facing movement');
await writeFile(dir+'/coast-facing-probe.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));
