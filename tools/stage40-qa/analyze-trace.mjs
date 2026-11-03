/** Read-only analysis. Damage between actions includes enemy/summon responses;
 * it is not exclusive shot attribution or a human success-rate estimate. */
import {readFile,writeFile} from 'node:fs/promises';
const out=process.argv[2];if(!out)throw Error('Output directory required');
const rows=(await readFile(out+'/turns.jsonl','utf8')).trim().split('\n').filter(Boolean).map(s=>JSON.parse(s)),rounds={},skills={},engaged=new Set(),stalls=[],warnings=[];
for(const t of rows){const a=t.initial,z=t.final,actor=a.actor,r=rounds[a.round]??={round:a.round,actions:0,foesStart:a.foes.length,foesEnd:0,heroDamage:0,enemyDamage:0,skills:[]};r.actions++;r.foesEnd=z.foes.length;skills[t.choice?.id||'defend']=(skills[t.choice?.id||'defend']||0)+1;r.skills.push(t.choice?.id||'defend');
 const after=new Map(z.foes.map(v=>[v.id,v]));for(const foe of a.foes){const loss=Math.max(0,foe.hp-(after.get(foe.id)?.hp||0));r.enemyDamage+=loss;if(loss)engaged.add(foe.id);}
 const ah=new Map(z.heroes.map(v=>[v.id,v]));for(const u of a.heroes)r.heroDamage+=Math.max(0,u.hp-(ah.get(u.id)?.hp||0));
 const u=a.heroes.find(v=>v.id===actor),v=ah.get(actor);if(u&&v&&Math.hypot(u.x-v.x,u.y-v.y)<15&&!t.accepted)stalls.push({round:a.round,actor,support:u.support,moveBefore:u.move,moveAfter:v.move,foes:a.foes.length});
 for(const h of z.boss?.history||[])if(!warnings.some(x=>x.event===h.event&&x.round===h.round))warnings.push(h);
}
const summary={scope:'Read-only action-boundary observations; not exclusive per-shot damage attribution, full objective proof, human fun or success rate',turns:rows.length,firstRound:rows[0]?.initial.round,lastRound:rows.at(-1)?.final.round,remainingEnemies:rows.at(-1)?.final.foes.length,uniqueEnemiesDamagedOrRemoved:[...engaged],uniqueCount:engaged.size,skills,rounds:Object.values(rounds),stationaryNonCastActions:stalls,bossHistory:warnings,final:rows.at(-1)?.final};
await writeFile(out+'/analysis.json',JSON.stringify(summary,null,2));console.log(JSON.stringify({turns:summary.turns,round:summary.lastRound,remaining:summary.remainingEnemies,unique:summary.uniqueCount,skills,stalls:stalls.length,bossHistory:warnings.map(x=>[x.event,x.round])},null,2));
