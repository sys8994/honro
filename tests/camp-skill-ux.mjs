/** Focused production App paths with DOM/canvas doubles, plus real view/formula/save checks. */
import assert from 'node:assert/strict';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,C,click}=h,p=h.profileThrough(4);
p.heroes.archer.ranks={A14:2,A05:1,A02:1};p.loadouts.archer=['A01','A14','A05','A02'];
g.HonroUI={...g.HonroUI,camp:(p,c,header,b)=>C.campView(p,c,{},header,b),talent:(p,id)=>C.talentView(p,id,'').replace('id="skill-preview"','id="previewcanvas"'),slotLibrary:(p,c,i,id)=>C.slotLibrary(p,c,i,'',id),equipChoice:(p,c,id,i)=>C.equipChoiceView(p,c,id,'',i)};
g.HonroSkillPreview={setup:(app,id,hero)=>({id,h:plain(hero)})};
const app=h.load(p),dialog={scrollTop:0},canvas=g.document.getElementById('previewcanvas');canvas.replaceWith=()=>{};
app.modal.querySelector=selector=>selector==='.dialog'||selector==='.skill-modal-body'?dialog:selector.includes('talent-dialog')?(/talent-dialog|ultimate-dialog/.test(app.modal.innerHTML)?dialog:null):{focus(){}};
app.showCamp('archer');g.document.getElementById('armory').scrollTop=135;app.branch=1;
const before=plain(app.profile.loadouts.archer);
click('slot',{slot:'1'});assert.match(app.modal.innerHTML,/현재 장착/);assert.match(app.modal.innerHTML,/기력/);
click('equip-select-skill',{slot:'1',skill:'A05'});assert.deepEqual(plain(app.profile.loadouts.archer),before,'candidate selection never equips');assert.match(app.modal.innerHTML,/선택한 기예/);assert.match(app.modal.innerHTML,/자리를 바꿉니다/);
click('equip-apply',{slot:'1',skill:'A05'});assert.deepEqual(plain(app.profile.loadouts.archer),['A01','A05','A14','A02']);assert.equal(g.document.getElementById('armory').scrollTop,135);assert.equal(app.branch,1);
app.talent('A14');dialog.scrollTop=211;const preview=app.preview;
click('equip',{skill:'A14'});click('equip-select-slot',{slot:'3',skill:'A14'});assert.deepEqual(plain(app.profile.loadouts.archer),['A01','A05','A14','A02']);assert.match(app.modal.innerHTML,/장착할 기예/);
click('equip-apply',{slot:'3',skill:'A14'});assert.deepEqual(plain(app.profile.loadouts.archer),['A01','A05','A02','A14']);assert.equal(app.detailSkill,'A14');assert.equal(dialog.scrollTop,211);assert.equal(app.preview,preview);
const rank=app.profile.heroes.archer.ranks.A14;click('rank-minus-detail',{skill:'A14'});assert.equal(app.profile.heroes.archer.ranks.A14,rank-1);assert.equal(app.detailSkill,'A14');assert.equal(dialog.scrollTop,211);assert.equal(app.branch,1);
click('unequip-skill',{skill:'A14'});assert.deepEqual(plain(app.profile.loadouts.archer),['A01','A05','A02','']);assert.equal(app.profile.heroes.archer.ranks.A14,rank-1,'unequip does not refund');assert.equal(dialog.scrollTop,211);
C.sanitizeLoadout(app.profile,'archer');assert.equal(app.profile.loadouts.archer[3],'','explicit vacancy survives sanitize');
const unit=C.makeUnit('archer',0,0,0,{loadout:app.profile.loadouts.archer});assert.deepEqual(plain(unit.loadout),['A01','A05','A02'],'vacancy never enters combat skill list');
const raw=C.defaults();raw.heroes.archer=plain(app.profile.heroes.archer);raw.loadouts.archer=plain(app.profile.loadouts.archer);const loaded=C.validate(raw);assert.equal(loaded.loadouts.archer[3],'','save validation retains slot position');
for(const [skill,slot] of [['A01',1],['M02',1],['A99',1],['A14',0],['A14',4],['AP01',1]]){const old=JSON.stringify(app.profile.loadouts.archer);app.equipIncoming=skill;app.equipConfirm(slot);assert.equal(JSON.stringify(app.profile.loadouts.archer),old,skill+' slot '+slot+' guarded');}
app.unequip(0);assert.equal(app.profile.loadouts.archer[0],'A01');click('slot',{slot:'0'});assert.equal(app.detailSkill,'A01');assert.doesNotMatch(app.modal.innerHTML,/data-action="(?:train|equip-prompt|unequip-skill)"/);
const detail=C.talentView(app.profile,'A14','');assert(detail.indexOf('skill-detail-controls')<detail.indexOf('skill-modal-grid'));assert.match(detail,/−1 SP 회수/);assert.match(detail,/장착/);assert.match(detail,/\+1 SP/);
assert(!detail.includes(C.SKILLS.A14.desc),'detail omits flavor when mechanics are present');
const ult=C.ultimateView(app.profile,'archer','');assert(!ult.includes(C.SKILLS.A99.desc),'ultimate omits flavor when mechanics are present');assert(ult.indexOf('skill-detail-controls')<ult.indexOf('skill-modal-grid'));assert.doesNotMatch(ult,/data-action="equip-prompt"/,'locked ultimate is not equipable');
for(const n of C.TALENTS.filter(n=>n.cls==='archer'&&!n.passive))app.profile.heroes.archer.ranks[n.id]=1;
const unlocked=C.ultimateView(app.profile,'archer','');assert(unlocked.indexOf('data-action="equip-prompt"')<unlocked.indexOf('skill-modal-grid'));app.equipIncoming='A99';app.equipConfirm(3);assert.equal(app.profile.loadouts.archer[3],'A99');
const camp=C.campView(app.profile,'archer',{},'');assert(camp.indexOf('hero-summary')<camp.indexOf('equipped-panel'));assert.doesNotMatch(camp,/camp-training|node-effect|node-cost/);assert.match(camp,/rank-track/);assert.equal(C.skillBrief(app.profile,'archer','A14').cost,'기력 '+C.skillEffectRows('A14',1).find(x=>x.label==='MP'||x.label==='기력').value);
for(const id of ['A14','A02','M02','O14']){const cls=C.SKILLS[id].cls,hero=app.profile.heroes[cls];hero.ranks[id]=3;const brief=C.skillBrief(app.profile,cls,id),rows=C.skillEffectRows(id,3);assert(!brief.effect.includes(C.SKILLS[id].desc),'flavor description stays out of decisions');assert(brief.effect.includes(C.skillPlayNotes(id).split(/(?<=[.!?。])\s+/)[0]));assert(brief.effect.length<260,'summary stays compact');const metric=rows.find(row=>({A14:'추가 치명 확률',A02:'추가 관통',M02:'얼음 파편',O14:'포획 유지'})[id]===row.label);assert(brief.effect.includes(metric.label+' '+metric.value),'actual rank-three effect');assert(C.loadoutCompareCard(app.profile,cls,id,'선택').includes(brief.effect),'comparison shares ranked mechanics');}
app.unequip(1);const saved=plain(app.profile.loadouts.archer),reloaded=h.reload();assert.deepEqual(plain(reloaded.profile.loadouts.archer),saved,'production profile reload preserves the vacancy and other slot indexes');
console.log('PASS camp skill UX: confirmed slot and skill paths, duplicate swap, refund/preview/scroll context, explicit unequip/save/combat, basic and ultimate guards, real ranked row costs');
