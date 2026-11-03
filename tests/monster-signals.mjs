// Small production-UI contract tests. Browser composition is a separate gate.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const g={};vm.runInNewContext(await readFile('shared/runtime/combat-status.js','utf8'),g);
const S=g.HonroCombatStatus,hero={id:'hero',name:'설오',hp:100,side:0,x:200,y:300,h:100,r:20};
const owner={id:'shade',name:'수의귀',hp:100,side:1,x:500,y:300,enemyEffectCast:{version:1,serial:3,skill:'HSH02',target:'hero',impact:{x:200,y:250},radius:74,direction:-1}};
const b={round:1,honroMonsterEffectsRevision:1,units:[hero,owner]},before=JSON.stringify(b);
assert.match(S.effects(b,hero).join(' '),/매듭실 예고/);
assert.match(S.effects(b,owner).join(' '),/대상의 행동 후/);
assert.equal(JSON.stringify(b),before,'status queries are read-only');
const legacy={...b,honroMonsterEffectsRevision:undefined};assert.equal(S.casts(legacy).length,0);assert.equal(S.entries(legacy,hero).length,0);
hero.enemySoftBind={sourceId:'shade',factor:.55,remainingActions:1};
assert.match(S.effects(b,hero)[0],/55%.*다음 유효 행동 후 해제/);
assert.equal(S.entries(legacy,hero).length,0,'legacy does not reinterpret missing-version fields');
hero.bound=2;assert.equal(S.entries(b,hero).filter(s=>s.key==='bind').length,3,'legacy bind and new bind remain distinct');delete hero.bound;
hero.enemySoftBind.remainingActions=0;assert(!S.effects(b,hero).some(t=>t.includes('이동 예산')));
const calls=[],c=new Proxy({measureText:t=>({width:t.length*7})},{get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a]),set:(o,k,v)=>(o[k]=v,true)});
let observed=0;const e={b,observeEnemyEffectWarning:(id,serial)=>{assert.equal(id,'shade');assert.equal(serial,3);observed++;}},scene={x:300,y:250,scale:1};
S.drawTelegraphs(c,e,scene,600,500);assert.equal(observed,1);assert(calls.some(a=>a[0]==='arc'&&a[1]===200&&a[2]===250&&a[3]===74));
hero.x=450;calls.length=0;S.drawTelegraphs(c,e,scene,600,500,false);assert.equal(observed,1,'paused rendering cannot acknowledge response opportunity');assert(calls.some(a=>a[0]==='arc'&&a[1]===200),'target movement never moves the locked marker');
scene.x=2000;calls.length=0;S.drawTelegraphs(c,e,scene,600,500);assert(calls.some(a=>a[0]==='fillText'&&a[1].includes('화면 밖')),'offscreen warning is explicit');
owner.enemyEffectCast.skill='HWD02';calls.length=0;scene.x=300;S.drawTelegraphs(c,e,scene,600,500);assert(calls.some(a=>a[0]==='fillText'&&a[1].includes('터줏바람')));assert(!calls.some(a=>a[0]==='ellipse'),'push uses directional chevrons, not knot glyph');
owner.dead=true;assert.equal(S.casts(b).length,0);owner.dead=false;owner.side=0;assert.equal(S.casts(b).length,0);owner.side=1;owner.eaterCapturedBy='eater';assert.equal(S.casts(b).length,0);
const css=await readFile('game/src/skill-presentation.css','utf8');assert.match(css,/data-monster-signal=true\] \.status-trigger>\.status-glyph\{display:flex\}/);assert.match(css,/data-monster-signal=true\] \.combat-passives\{display:none\}/);
console.log('PASS monster signal UI: version boundary, precise expiry, immutable locked marker, paused/offscreen signs, distinct shapes, compact HUD priority');
// Fresh builder contract with map-provider doubles; A0 separately probes actual authored maps.
let built;
g.HONRO_CORE={SKILLS:{},attackForSkill:()=>({})};g.HONRO_CONTENT={};g.HonroSplitCampaign={legacy:()=>false};g.HONRO_PROJECT={stages:[{metadata:{stageId:5}},{metadata:{stageId:8}},{metadata:{stageId:6}}]};g.HonroMaps={createBattle:()=>built};
vm.runInNewContext(await readFile('shared/runtime/world.js','utf8'),g);
for(const [stage,id,skill] of [[5,'s5-cave-shade','HSH02'],[8,'s8-15','HWD02']]){
 built={units:[{id,side:1,loadout:[skill]},{id:'other',side:1,loadout:[skill]}]};g.HonroWorld.build({id:stage},{});assert.equal(built.honroMonsterEffectsRevision,1);assert.equal(built.units[0].honroMonsterEffectSkill,skill);assert.equal(built.units[1].honroMonsterEffectSkill,undefined);
 for(const invalid of [{id:'other',side:1,loadout:[skill]},{id,side:0,loadout:[skill]},{id,side:1,loadout:['HSH01']}]){built={units:[invalid]};g.HonroWorld.build({id:stage},{});assert.equal(built.honroMonsterEffectsRevision,undefined);}
}
built={units:[{id:'s5-cave-shade',side:1,loadout:['HSH02']}]};g.HonroWorld.build({id:6},{});assert.equal(built.honroMonsterEffectsRevision,undefined);
console.log('PASS exact fresh-world allowlist: stage, ID, side and skill checked; no other actor opted in');
