/** Two independent actual R4 saves, one fixed current-foe flank rule per actor. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createFinale} from './bootstrap.mjs';
import {evaluateLegalCast} from './legal-cast.mjs';
import {evaluateInputTolerance} from './input-tolerance.mjs';
const dir=process.argv[2],out='/tmp/stage40-coast-other-roles';await mkdir(out,{recursive:true});
const source=await readFile(new URL('diagnostic-finishing.mjs',import.meta.url),'utf8'),body=source.slice(source.indexOf('function plan('),source.indexOf('function healing()')),rows=[];
for(const [actor,turn] of [['archer','013'],['occultist','015']]){
 if(process.argv[3]&&process.argv[3]!==actor)continue;
 const profilePath=out+'/'+actor+'-input.json';await writeFile(profilePath,execFileSync('xz',['-dc',dir+'/browser/turn-profile-'+turn+'.json.xz']));
 const {C,e,b,ops,app,g}=await createFinale({profilePath,entryRound:4});ops.ready();ops.frame();for(let i=0;i<120&&g.HonroStory.turnPaused(app,ops.now);i++)ops.frame();assert(!g.HonroStory.turnPaused(app,ops.now));const u=e.active;assert.equal(u.id,actor);for(let i=0;i<240&&!e.grounded(u)&&e.active===u;i++)ops.frame();assert(e.grounded(u),'Normal landing bound');
 const surface=v=>e.contactSurface(v.x,v.y-4,v.y+5)?.t.id,pose=()=>({x:u.x,y:u.y,facing:u.facing,move:u.moveLeft,hp:u.hp,round:b.round,active:e.active.id,support:surface(u)}),start=pose();
 const foe=b.units.filter(v=>v.side===1&&!v.dead&&v.hp>0&&surface(v)===surface(u)&&v.x>=u.x).sort((a,z)=>a.x-z.x)[0];if(!foe){rows.push({actor,start,failure:'No forward foe on measured same support',foes:b.units.filter(v=>v.side===1&&!v.dead&&v.hp>0).map(v=>({id:v.id,x:v.x,y:v.y,support:surface(v),authoredSupport:v.honroEncounterSupport}))});await writeFile(out+(process.argv[3]?'/'+process.argv[3]:'')+'-result.json',JSON.stringify(rows,null,2));continue;}const goal=foe.x+280;
 for(let i=0;i<220&&e.active===u&&u.moveLeft>100&&u.x<goal-15;i++){ops.move(1,C.STEP);ops.frame();}ops.ready();
 const live=JSON.stringify(b),actions=[],choice=new Function('C','b','e','actions','evaluateLegalCast','evaluateInputTolerance','assert',body+';return plan(e.active.facing);')(C,b,e,actions,evaluateLegalCast,evaluateInputTolerance,assert);assert.equal(JSON.stringify(b),live);rows.push({actor,goal,target:foe.id,start,after:pose(),choice,rejected:actions});await writeFile(out+(process.argv[3]?'/'+process.argv[3]:'')+'-result.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows.at(-1)));
}
