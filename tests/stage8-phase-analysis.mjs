/** Summarize a stage8-bier-fullplay output directory by phase.
 * Reads per-round saves and trace; classifies hero actions. Analysis only. */
import {readFile,readdir} from 'node:fs/promises';
const dir=process.argv[2];if(!dir)throw Error('usage: node tests/stage8-phase-analysis.mjs <outdir>');
const files=(await readdir(dir)).filter(f=>/^round-\d+\.json$/.test(f)).sort((a,z)=>parseInt(a.slice(6))-parseInt(z.slice(6)));
const rows=[];
for(const f of files){const d=JSON.parse(await readFile(`${dir}/${f}`,'utf8')),b=d.profile.honroBattle,m=b.honroState?.stage8Bier||{},boss=b.units.find(u=>u.id==='boss');
 const seals=(b.terrain||[]).filter(t=>t.honroSeal||/^bier-knot/.test(t.id)).map(t=>({id:t.id,broken:!!t.broken}));
 rows.push({round:b.round,status:m.status,blockers:(m.blockers||[]).map(v=>v.kind+':'+v.id),boss:boss&&{x:Math.round(boss.x),y:Math.round(boss.y),hp:Math.round(boss.hp),dead:!!boss.dead},seals:seals.filter(s=>s.broken).map(s=>s.id),wardens:b.units.filter(u=>['s8-15','s8-30'].includes(u.id)).map(u=>({id:u.id,x:Math.round(u.x),y:Math.round(u.y),hp:Math.round(u.hp),dead:!!u.dead}))});}
const trace=JSON.parse(await readFile(`${dir}/trace.json`,'utf8')),result=JSON.parse(await readFile(`${dir}/result.json`,'utf8'));
const sealRounds=new Map(trace.rounds.map(r=>[r.round,(r.seals||[]).filter(s=>s.broken).map(s=>s.id)]));for(const r of rows)if(sealRounds.has(r.round))r.seals=sealRounds.get(r.round);
const first=(pred)=>rows.find(pred)?.round??null;
const phase={firstSeal:first(r=>r.seals.length>=1),bothSeals:first(r=>r.seals.length>=2),announced:first(r=>['announced','blocked','moving','settled'].includes(r.status)),firstBlocked:first(r=>r.status==='blocked'),settled:first(r=>r.status==='settled'),bossDead:result.boss?.dead?result.round:null,end:result.round,phase:result.phase};
const blockedRounds=rows.filter(r=>r.status==='blocked'),blockerCount={};for(const r of blockedRounds)for(const k of r.blockers)blockerCount[k]=(blockerCount[k]||0)+1;
const acts=trace.actions,ops={};for(const a of acts)ops[a.op]=(ops[a.op]||0)+1;
const byWindow=(lo,hi)=>{const o={};for(const a of acts.filter(a=>a.round>=lo&&(hi==null||a.round<hi)))o[a.op]=(o[a.op]||0)+1;return o;};
const damageToBoss=trace.damage.filter(d=>d.target==='boss').reduce((n,d)=>n+d.amount,0);
const bossHits=trace.damage.filter(d=>d.target==='boss').map(d=>({round:d.round,amount:Math.round(d.amount),skill:d.skill}));
const wardenDamage={};for(const d of trace.damage.filter(d=>d.side===0&&['s8-15','s8-30'].includes(d.owner)))wardenDamage[d.owner]=(wardenDamage[d.owner]||0)+d.amount;
const wardenActions={};for(const a of trace.enemyActions.filter(a=>['s8-15','s8-30'].includes(a.id)))wardenActions[a.id]=(wardenActions[a.id]||0)+1;
const fires=acts.filter(a=>a.op==='fire'),targetCount={};for(const f of fires)targetCount[f.target]=(targetCount[f.target]||0)+1;
const out={dir,provenance:{placeSpec:result.placeSpec,yieldMode:result.yieldMode,policy:result.policy,stopReason:result.stopReason},phase,allThreeSurvived:result.allThreeSurvived,damageTaken:Math.round(result.damageTaken),blockedRoundCount:blockedRounds.length,blockerCount,ops,phases:{toSeals:byWindow(1,phase.bothSeals),sealsToSettle:byWindow(phase.bothSeals??1e9,phase.settled??phase.end+1),afterSettle:byWindow(phase.settled??1e9,null)},damageToBoss:Math.round(damageToBoss),bossHitsByRound:bossHits,topTargets:Object.entries(targetCount).sort((a,z)=>z[1]-a[1]).slice(0,8),wardenDamageToHeroes:wardenDamage,wardenActions,wardensFinal:rows.at(-1)?.wardens,bierTimeline:rows.map(r=>[r.round,r.status,r.boss&&`${r.boss.x},${r.boss.y} hp${r.boss.hp}`,r.blockers.join('|')].join(' '))};
console.log(JSON.stringify(out,null,1));
