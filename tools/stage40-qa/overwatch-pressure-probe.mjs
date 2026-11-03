/** Two independent normal R11 saves, same defensive action, different actual position.
 * No future outcome enters the route choice. Native fixture, not browser acceptance. */
import assert from 'node:assert/strict';import {readFile,writeFile,mkdir} from 'node:fs/promises';import {execFileSync} from 'node:child_process';import {createFinale} from './bootstrap.mjs';import {evaluateLegalCast} from './legal-cast.mjs';import {evaluateInputTolerance} from './input-tolerance.mjs';
const input=process.argv[2],out='/tmp/stage40-overwatch-pressure';await mkdir(out,{recursive:true});const rows=[],source=await readFile(new URL('diagnostic-finishing.mjs',import.meta.url),'utf8'),body=source.slice(source.indexOf('function plan('),source.indexOf('function healing()'));
for(const variant of ['upper-defend','dock-defend']){
 const profilePath=out+'/'+variant+'-input.json';await writeFile(profilePath,execFileSync('xz',['-dc',input+'/browser/turn-profile-041.json.xz']));const{C,e,b,ops,app,g}=await createFinale({profilePath,entryRound:11});
 function ready(){ops.ready();ops.frame();for(let i=0;i<360&&(g.HonroStory.turnPaused(app,ops.now)||!e.grounded(e.active));i++)ops.frame();assert(!g.HonroStory.turnPaused(app,ops.now)&&e.grounded(e.active));}
 ready();assert.equal(e.active.id,'archer');const u=e.active,surface=v=>e.contactSurface(v.x,v.y-4,v.y+5)?.t.id,party=()=>b.units.filter(v=>v.side===0&&!v.summoned&&!v.honroAct4Resident).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,shield:v.shield,dead:v.dead,move:v.moveLeft,support:surface(v)})),initial=party();assert.equal(surface(u),'approved40-dock-stair');
 if(variant==='dock-defend'){
  for(let i=0;i<240&&e.active===u&&u.moveLeft>100&&Math.abs(u.x-1900)>15;i++){ops.move(Math.sign(1900-u.x),C.STEP);ops.frame();}ready();assert(ops.drop());for(let i=0;i<240&&(u.platformDrop||!e.grounded(u));i++)ops.frame();ready();assert.equal(surface(u),'approved40-dock');
 }
 const positioned=party(),live=JSON.stringify(b),actions=[],choice=new Function('C','b','e','actions','evaluateLegalCast','evaluateInputTolerance','assert',body+';return plan(e.active.facing);')(C,b,e,actions,evaluateLegalCast,evaluateInputTolerance,assert);assert.equal(JSON.stringify(b),live);
 let defenses=0;while(b.round===11&&defenses<8){ready();assert(ops.defend());defenses++;for(let i=0;i<30000&&(!app.canInput()||b.side!==0);i++)ops.frame();ready();}
 assert.equal(b.round,12);rows.push({variant,initial,positioned,currentFacingChoice:choice,defenses,after:party(),report:structuredClone(b.honroReport),enemyEvents:[...b.events]});await writeFile(out+'/result.json',JSON.stringify({scope:'Native clock/DOM two-position defensive comparison, not actual browser or whole-stage acceptance',rows},null,2));console.log(JSON.stringify({variant,initial,positioned,choice:choice?.id,after:party()}));
}
