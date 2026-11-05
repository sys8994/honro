/** Read-only diagnosis of a recorded real battle snapshot in an isolated engine.
 * Shot predictions/plans are not actual input, damage or a full-play pass. */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime} from '../../game/tests/helpers.mjs';
const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('Usage: stage2-air-pressure.mjs recorded-battle.json local-report.json');
const bytes=await readFile(input),saved=JSON.parse(bytes),b=saved.profile?.honroBattle||saved,g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,e=new C.Engine(structuredClone(b),()=>{},true);
const rows=[],hero=e.unit('p-archer'),car=e.unit('objective');
for(const u of e.alive(1).filter(C.flyingEnemy)){
 const target=C.targetFor(e,u),skills=u.loadout.map(id=>C.SKILLS[id]).filter(s=>s&&!s.passive&&e.manaCost(s,u)<=u.focus);
 const choice=target&&skills.length?C.chooseEnemyShot(e,u,target,skills):null;
 const viable=choice?C.shotViable(e,u,choice.skill,target,choice.aim.angle,choice.aim.power):null;
 const movement=target?C.planEnemyMove(e,u,target):null;
 let archerShot=null;
 if(hero){const skill=C.SKILLS.A01;for(const aim of e.shotSeeds(hero,skill,u)){const hit=e.predict(hero,skill,aim.angle,aim.power,u,false),safe=C.shotViable(e,hero,skill,u,aim.angle,aim.power);if(hit.unit===u.id&&safe.risk<1&&safe.friendlyDamage===0){archerShot=aim;break;}}}
 rows.push({id:u.id,x:u.x,y:u.y,hp:u.hp,focus:u.focus,intent:u.intent,lastAct:u.lastAct,
  carriageThreat:!!car&&Math.abs(u.x-car.x)<1150&&Math.abs(u.y-car.y)<650,
  target:target?{id:target.id,x:target.x,y:target.y,hp:target.hp}:null,
  enemyShot:choice?{skill:choice.skill.id,aim:choice.aim,viable}:null,movement,archerShot});
}
const result={method:'Isolated snapshot predictions only; no live state mutation or shot execution',inputSha256:createHash('sha256').update(bytes).digest('hex'),round:b.round,rows};
await writeFile(output,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
