import assert from 'node:assert/strict';
import {appHarness} from './app-regression-helpers.mjs';
import {selectCombatSkill} from '../tools/quantitative-playtest/skill-input.mjs';
const h=await appHarness({productionStory:true,preserveCancelInput:true}),{C}=h;
let now=0;h.g.performance={now:()=>now};
function ready(app){for(let i=0;i<2400&&!app.canInput()&&app.engine.b.phase!=='lost';i++){now+=C.STEP*1000;h.g.HonroStory.tick(app,now);if(!h.g.HonroStory.turnPaused(app,now))app.engine.tick(C.STEP);}assert(app.canInput(),'production input-ready boundary');}
const p=h.profileThrough(10);p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];p.settings.debugMode=false;p.settings.minimapVisible=false;
const wanted={archer:'A02',mage:'M03',knight:'S06',occultist:'O06'};
const trainingOrder={archer:['A14','A02','A05'],mage:['M06','M02','M03'],knight:['S01','S06','S04'],occultist:['O02','O03','O06']};
for(const cls of p.recruited){const hero=p.heroes[cls];hero.xp=C.xpAtLevel(22);for(let i=0;i<6;i++)C.investStat(hero,cls);for(const id of trainingOrder[cls])for(let i=0;i<3;i++)C.train(hero,id);assert(hero.ranks[wanted[cls]]>0,cls+' requested skill legally trained');p.loadouts[cls]=[C.baseSkill(cls),wanted[cls]];}
const fired=[];
for(const cls of p.recruited){
 // Independent fresh entries in one shared runtime: no live actor/action refill.
 const app=h.load(p);app.launch(11);h.finish(app);app.close();ready(app);
 app.updateHUD=h.productionMethods.updateHUD;app.minimapVisible=false;
 const original=app.engine.fire.bind(app.engine);app.engine.fire=(...args)=>{const accepted=original(...args);fired.push({hero:cls,skill:args[0],accepted});return accepted;};
 const actor=app.engine.b.units.find(u=>u.side===0&&u.cls===cls);assert(actor,cls+' fixture actor');app.selectHero(actor.id);assert.equal(app.engine.active.id,actor.id);const id=wanted[cls];
 assert.throws(()=>selectCombatSkill(app,h.click,'NOT_EQUIPPED'),/equipped/);
 selectCombatSkill(app,h.click,id);app.updateHUD(true);assert.equal(app.selected,id);assert.equal(app.selectedByUnit[actor.id],id);
 assert.equal(h.nodes.get('combat-skills').children.find(n=>n.dataset.skillKey===id).getAttribute('aria-pressed'),'true');
 assert(app.beginCharge());app.updateHUD(true);assert.equal(app.selected,id);app.releaseCharge();
 assert.equal(fired.at(-1).skill,id);assert.equal(fired.at(-1).accepted,true);
}
console.log('PASS official combat-skill click, actual HUD persistence/pressed state, and actual accepted nonbasic shots for all four heroes');
