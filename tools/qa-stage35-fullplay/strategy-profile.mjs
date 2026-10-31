/** Validate a declared-prior-clear alternative using official progression functions. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime} from '../../game/tests/helpers.mjs';
import assert from 'node:assert/strict';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,fixture=JSON.parse(await readFile('tools/qa-stage35-fullplay/stage30-base-fixture.json','utf8'));
const p=fixture.profile;for(let n=31;n<=34;n++)p.cleared[String(n)]={visits:1,rounds:15,stars:1,shots:0};p.lastStage=35;p.settings.sound=false;
for(const cls of C.CLASS_IDS)p.heroes[cls].xp=C.xpAtLevel(25);
const steps={mage:[['M07',3],['M10',3]],archer:[['A14',3],['A02',3]],knight:[['S01',3],['S06',3]],occultist:[['O03',1],['O04',5]]};
const history=[];
for(const [cls,rows] of Object.entries(steps))for(const [skill,count] of rows)for(let i=0;i<count;i++){const h=p.heroes[cls],reason=C.trainReason(h,skill);assert.equal(reason,'',`${cls}/${skill}: ${reason}`);assert(C.train(h,skill));history.push({cls,skill,rank:h.ranks[skill],spent:C.pointsSpent(h,cls),earned:C.pointsEarned(h)});}
p.loadouts.mage=['M01','M06','M03','M10'];p.loadouts.occultist=['O01','O02','O06','O04'];
const checked=C.validate(p),report={};
for(const cls of C.CLASS_IDS){assert.deepEqual(JSON.parse(JSON.stringify(checked.heroes[cls].ranks)),JSON.parse(JSON.stringify(p.heroes[cls].ranks)));assert.deepEqual(JSON.parse(JSON.stringify(checked.loadouts[cls])),JSON.parse(JSON.stringify(p.loadouts[cls])));assert.deepEqual(JSON.parse(JSON.stringify(checked.heroes[cls].equipmentIds)),JSON.parse(JSON.stringify(p.heroes[cls].equipmentIds)));assert.equal(C.pointsSpent(p.heroes[cls],cls),C.pointsEarned(p.heroes[cls]));report[cls]={level:C.levelOf(p.heroes[cls]),xp:p.heroes[cls].xp,earned:C.pointsEarned(p.heroes[cls]),spent:C.pointsSpent(p.heroes[cls],cls),training:C.statTrainingRank(p.heroes[cls]),ranks:p.heroes[cls].ranks,slots:p.loadouts[cls],equipment:p.heroes[cls].equipmentIds};}
const out={scope:'Declared prior clears 1–34; same level, XP, stat training, owned/equipped items and progression as earlier fixture. No claim of actual preceding clears.',sourceFixtureSha256:createHash('sha256').update(await readFile('tools/qa-stage35-fullplay/stage30-base-fixture.json')).digest('hex'),trainingHistory:history,report,profile:p};await mkdir('_local/reports/stage35-rc-fullplay/analysis',{recursive:true});await writeFile('_local/reports/stage35-rc-fullplay/analysis/strategy-profile.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(report,null,2));
