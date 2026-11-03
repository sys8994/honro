/** Geometry fixture from actual visible R19 positions, NOT live gameplay acceptance. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createFinale} from './bootstrap.mjs';
import {warningEscapeGoal} from './warning-route.mjs';
const dir=process.argv[2];assert(dir);
const result=JSON.parse(await readFile(dir+'/basic/result.json','utf8')),event=result.events.find(x=>x.label==='new-visible-warning'),last=result.events.at(-1).state;
const {C,g}=await createFinale();const saved=JSON.parse(execFileSync('xz',['-dc','tools/stage40-qa/records/41634770553-r15-profile.json.xz'],{maxBuffer:128e6}));
const b=structuredClone(saved.honroBattle),current=new Map([...last.health,...last.foes,...last.residents].map(u=>[u.id,u]));
b.units=b.units.filter(u=>current.has(u.id)).map(u=>({...u,...current.get(u.id)}));b.round=last.round;
const source=b.units.find(u=>u.id===event.extra.id);source.honroPilotCombat=structuredClone(event.extra.pattern);const u=b.units.find(u=>u.id==='occultist');u.moveLeft=last.move;
const e=new C.Engine(b,()=>{},true),surface=u=>e.contactSurface(u.x,u.y-4,u.y+5)?.t.id,live=JSON.stringify(b);
const checks=[];for(const dx of [-720,-630,-540,-450,-360,-270,-190,190,270,360,450,540,630,720]){const f=e.contactSurface(u.x+dx,u.y-320,u.y+320);checks.push({dx,x:u.x+dx,support:f?.t.id,y:f?.y,separated:f&&g.HonroTerrain.separated(b,u,u.x+dx,f.y,12)});}
const goal=warningEscapeGoal(e,u,{surface,separated:g.HonroTerrain.separated});assert.equal(JSON.stringify(b),live);
assert(goal&&Math.abs(goal.x-u.x)>450,'Wider same-support empty position must be found');
assert.equal(goal.support,'approved40-dock');
const full=u.moveLeft;u.moveLeft=480;assert.equal(warningEscapeGoal(e,u,{surface,separated:g.HonroTerrain.separated}),null);u.moveLeft=full;
source.honroPilotCombat.target.seen=false;assert.equal(warningEscapeGoal(e,u,{surface,separated:g.HonroTerrain.separated}),null);source.honroPilotCombat.target.seen=true;
await writeFile(dir+'/warning-space.json',JSON.stringify({scope:'Reconstructed observed geometry fixture only; not normal save/gameplay',goal,checks},null,2));console.log(JSON.stringify({goal,checks},null,2));
