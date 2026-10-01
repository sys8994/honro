import type {ExistenceVector,Projectile,Skill,Unit} from './types';

/** Attack values are proportions (normally sum to 1), not extra attack power. */
const mix=(form:number,qi:number,soul:number):ExistenceVector=>({form,qi,soul});
export const NEUTRAL_EXISTENCE=mix(1,1,1);

// Explicitly grouped by what each implemented attack does, including the HONRO monster skills.
const attackRows:[string,ExistenceVector][]=[
 ['A01 A02 A04 A05 A06 A07 A08 A09 A11 A12 A13 A14 A15 A99',mix(.96,.04,0)],
 ['A03',mix(.82,.18,0)],
 ['M01 M03 M04 M05 M07 M08 M11 M12 M14 M15 M99',mix(.08,.92,0)],
 ['M02 M06 M13',mix(.25,.75,0)],
 ['S00 S02 S03 S05 S07 S08',mix(.94,.06,0)],
 ['S01 S04 S06 S13 S15',mix(.82,.18,0)],
 ['S09 S10 S11 S12',mix(.55,.45,0)],
 ['O01 O02 O03 O04 O05 O16',mix(0,.16,.84)],
 ['O06 O07 O08 O10',mix(0,.28,.72)],
 ['O11 O12 O13 O14 O15',mix(0,.18,.82)],
 ['HBR01 HBR02 HWD01 HMO02',mix(.82,.18,0)],
 ['HWD02 HBT01 HBT02',mix(.25,.75,0)],
 ['HCW01 HCW02',mix(.85,.15,0)],
 ['HGS01 HGS02 HLN01 HLN02 HSH01 HSH02 HMO01',mix(.04,.20,.76)]
];
export const ATTACK_EXISTENCE:Record<string,ExistenceVector>={};
for(const [ids,value] of attackRows)for(const id of ids.split(' '))ATTACK_EXISTENCE[id]={...value};

// Historical NPC and in-flight save skills keep their old modes and use these explicit families.
const legacyRows:[string,ExistenceVector][]=[
 ['LA01 LA02 LA03 LA04 LA05 LA06 LA07 LA08 LA09 LA10 LA11 LA12 LA13 LA14 LA15 LA99',mix(.94,.06,0)],
 ['LM01 LM02 LM03 LM04 LM05 LM06 LM07 LM08 LM09 LM10 LM11 LM12 LM13 LM14 LM15 LM99',mix(.12,.88,0)],
 ['LS01 LS02 LS03 LS04 LS05 LS06 LS07 LS08 LS11 LS13 LS15 LS99 S99',mix(.84,.16,0)],
 ['LS09 LS10 LS12 LS14',mix(.58,.42,0)],
 ['LO08 LO09 LO10 LO13 LO14 LO15 LO99 O99',mix(0,.22,.78)]
];
for(const [ids,value] of legacyRows)for(const id of ids.split(' '))ATTACK_EXISTENCE[id]={...value};

export function attackForSkill(skill:Pick<Skill,'id'|'cls'>):ExistenceVector{
 return ATTACK_EXISTENCE[skill.id]||({archer:mix(.95,.05,0),mage:mix(.12,.88,0),knight:mix(.85,.15,0),occultist:mix(0,.2,.8)} as const)[skill.cls];
}

/** Neutral 1 preserves old damage. Values below/above 1 reduce/amplify that part of a hit. */
export const MONSTER_EXISTENCE:Record<string,ExistenceVector>={
 bow:mix(1,1,.78),crossbow:mix(1,1,.78),slinger:mix(1,1,.78),guard:mix(1,1,.78),leaper:mix(1,1,.78),
 fire:mix(1,1,.78),frost:mix(1,1,.78),storm:mix(1,1,.78),bomber:mix(1,1,.78),healer:mix(1,1,.78),ward:mix(1,1,.78),ballista:mix(.92,1,.55),
 human:mix(1,1,.88),hound:mix(.94,1.03,1.08),boar:mix(.96,1.03,1.08),stag:mix(.94,1.04,1.08),
 bat:mix(.90,1.06,1.10),crow:mix(.92,1.04,1.08),ghost:mix(.20,1.05,1.32),shade:mix(.24,1.05,1.28),lantern:mix(.18,1.10,1.34),
 warden:mix(.82,1.08,1.20),mourner:mix(.78,1.05,1.25),golem:mix(.83,1.06,1.23),medium:mix(1,1.08,1.16),
 dummy:NEUTRAL_EXISTENCE,boss:mix(.94,1.03,1.08),
 'boss:1':mix(.80,1.05,1.15),'boss:2':mix(1,1,.80),'boss:3':mix(.72,1.15,.90),
 'boss:4':mix(.80,1.12,1.15),'boss:5':mix(1,1,.82),'boss:6':mix(.92,1.10,1),
 bier:mix(1,.80,.35),gate:mix(1,.82,.30),civilian:mix(1,1,.88),
 'summon-stalker':mix(.65,1.03,1.18),'summon-charger':mix(.75,1.02,1.14),'summon-host':mix(.70,1.04,1.17),
 'summon-lantern':mix(.25,1.07,1.27),'summon-warden':mix(.60,1.04,1.16),'summon-eater':mix(.28,1.07,1.25),
 'summon-echo':mix(.22,1.08,1.26),'summon-earthbound':mix(.64,1.03,1.18)
};

export function defenseForUnit(u:Pick<Unit,'side'|'role'|'honroVariant'|'honroType'|'boss'|'summonKind'|'existenceDefense'>):ExistenceVector{
 if(u.existenceDefense)return u.existenceDefense;
 if(u.summonKind)return MONSTER_EXISTENCE['summon-'+u.summonKind]||NEUTRAL_EXISTENCE;
 if(u.side===0)return MONSTER_EXISTENCE.human;
 if(u.side===2)return MONSTER_EXISTENCE[u.honroType||'']||MONSTER_EXISTENCE.human;
 if(u.role==='boss'&&u.boss)return MONSTER_EXISTENCE['boss:'+u.boss]||MONSTER_EXISTENCE.boss;
 if(u.role==='medium'||u.role==='golem')return MONSTER_EXISTENCE[u.role];
 return MONSTER_EXISTENCE[u.honroVariant||'']||MONSTER_EXISTENCE[u.honroType||'']||MONSTER_EXISTENCE[u.role]||MONSTER_EXISTENCE[u.boss?'boss':'human'];
}

function finiteNonnegative(value:number,defaultValue=0){return Number.isFinite(value)?Math.max(0,value):defaultValue;}
export function normalizedAttack(attack:ExistenceVector):ExistenceVector{
 const form=finiteNonnegative(attack.form),qi=finiteNonnegative(attack.qi),soul=finiteNonnegative(attack.soul),sum=form+qi+soul;
 return sum>0?mix(form/sum,qi/sum,soul/sum):mix(1,0,0);
}
export function existenceMultiplier(attack:ExistenceVector,target:Unit,attacker?:Unit):number{
 const a=normalizedAttack(attack),base=defenseForUnit(target),delta=target.existenceShift;
 const form=finiteNonnegative(base.form+(delta?.form||0)+(target.manifested?target.formDamageTakenBonus||0:0),1);
 const qi=finiteNonnegative(base.qi+(delta?.qi||0),1);
 const soul=finiteNonnegative(base.soul+(delta?.soul||0)-(target.soulDefenseBonus||0),1);
 const response=a.form*form+a.qi*qi+a.soul*soul;
 return Math.max(.1,Math.min(1.5,response*(1+a.soul*(attacker?.soulAffinityBonus||0))));
}
export function attackForHit(p:Projectile|undefined,rawSource:Unit|undefined,source:Unit|undefined,skills:Record<string,Skill>):ExistenceVector|undefined{
 if(p)return p.existenceAttack||skills[p.skill]?.existenceAttack||attackForSkill(skills[p.skill]||{id:p.skill,cls:source?.cls||'knight'});
 if(rawSource?.summonKind)return ({stalker:mix(.35,.10,.55),charger:mix(.48,.10,.42),host:mix(.35,.15,.50),lantern:mix(0,.14,.86),warden:mix(.25,.25,.50),eater:mix(0,.12,.88),echo:mix(0,.14,.86),earthbound:mix(.32,.18,.50)} as const)[rawSource.summonKind];
 if(!source)return undefined; // Falls, terrain and scripted environmental damage remain unchanged.
 return attackForSkill({id:'',cls:source.cls});
}

export interface DamageLayers{skillDamage:number;conditionBonuses:readonly number[];criticalMultiplier:number;existenceMultiplier:number;defenseMultiplier:number;}
export function calculateDamage(layers:DamageLayers){
 const skillDamage=finiteNonnegative(layers.skillDamage),conditionMultiplier=Math.max(0,1+layers.conditionBonuses.reduce((sum,b)=>sum+(Number.isFinite(b)?b:0),0));
 const criticalMultiplier=finiteNonnegative(layers.criticalMultiplier,1),existenceMultiplier=finiteNonnegative(layers.existenceMultiplier,1),defenseMultiplier=finiteNonnegative(layers.defenseMultiplier,1);
 return {skillDamage,conditionMultiplier,criticalMultiplier,existenceMultiplier,defenseMultiplier,finalDamage:skillDamage*conditionMultiplier*criticalMultiplier*existenceMultiplier*defenseMultiplier};
}
