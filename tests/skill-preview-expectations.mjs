/** Checks consume observed engine snapshots; none writes to a battle or renderer. */
export function auditPreview(s){
 const m=s.metrics,c=s.control?.metrics,t=s.targets,hit=t.filter(v=>v.hp<v.maxHp).length,events=m.events||[],has=x=>events.includes(x),checks=[];
 const add=(name,ok)=>checks.push({name,ok:!!ok});
 add('selected scenario fired a real skill',s.fired);
 add('finite actor/target state',[s.hero,...t].every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.x)&&Number.isFinite(u.y)));
 if(c){
  const b=s.control,metric=s.kind;
  const specific={
   'passive-volley':()=>m.followups.length>c.followups.length,
   'passive-critical':()=>s.hero.critChance>b.hero.critChance&&s.hero.critMultiplier>b.hero.critMultiplier&&m.damage>c.damage,
   'passive-retreat':()=>m.retreat>c.retreat,
   'passive-trajectory':()=>m.damage>c.damage,
   'passive-history':()=>m.casts.length>=2&&m.damage>c.damage,
   'passive-secondary':()=>m.secondary.length>0&&m.damage>c.damage,
   'passive-mana':()=>s.hero.maxFocus>b.hero.maxFocus&&s.hero.focus>b.hero.focus,
   'passive-refund':()=>m.damage===0&&s.hero.focus>b.hero.focus,
   'passive-ward':()=>m.shield>c.shield,
   'passive-circulation':()=>m.jucheonReady&&m.effectBoost>0&&m.casts.length>=4,
   'passive-sword':()=>m.damage>c.damage,
   'passive-durability':()=>s.hero.maxHp>b.hero.maxHp&&m.hits.some(v=>v.target===s.initial.hero.id||v.target==='p0')&&s.hero.hp>b.hero.hp,
   'passive-mobility':()=>m.jump>c.jump&&s.jumpCost<b.jumpCost,
   'passive-harmony':()=>m.harmony&&m.casts.length>=4&&m.damage>c.damage,
   'passive-last-stand':()=>m.lastStand&&!s.hero.dead&&b.hero.dead,
   'passive-trap':()=>m.traps>0&&m.curse>0&&m.damage>c.damage,
   'passive-mark-priority':()=>m.summons>0&&m.curse>0&&m.damage>c.damage,
   'passive-share':()=>m.sharedDamage>0&&s.hero.hp>b.hero.hp,
   'passive-expiry':()=>m.summons>0&&m.expiry>0&&!c.expiry,
   'passive-remnants':()=>m.remnants===3&&m.soulBoost&&m.damage>c.damage
  };
  add('real passive trigger and unlearned comparison: '+metric,specific[metric]?.());return checks;
 }
 const rules={
 A01:()=>m.damage>0,M01:()=>m.damage>0,S00:()=>hit>=1,O01:()=>m.damage>0,
 A14:()=>m.damage>0&&t[0].x-s.initial.hero.x>=1000,
 A02:()=>hit>=2,A06:()=>m.heroHpMax>s.initial.hero.hp&&s.hero.focus>s.initial.hero.focus-m.casts[0].cost,A10:()=>m.prepared&&s.follow&&m.damage>0,A99:()=>t.some(v=>v.dead),
 A11:()=>m.apex&&m.damage>0,A09:()=>s.turns===1&&s.follow&&m.damage>0,A13:()=>m.damage>0&&t[0].y<s.initial.hero.y,
 A12:()=>m.returning&&m.hits.length>=2,A15:()=>m.modes.includes('seekChild')&&hit>=2,A05:()=>hit>=2&&t.some((v,i)=>Math.abs(v.x-s.initial.targets[i].x)>5),
 A04:()=>m.maxProjectiles>=3&&hit>=2,A07:()=>m.damage>0&&s.initial.terrain.some(t=>t.mat==='wood'&&(!s.terrain.some(v=>v.id===t.id)||s.terrain.some(v=>v.id===t.id&&(v.broken||v.hp<=0)))),A03:()=>hit>=2,A08:()=>m.secondary.length>0&&m.damage>0,
 M06:()=>m.secondary.length>0&&m.damage>0,M02:()=>m.bounces>=1&&s.follow&&m.secondary.length>0,M04:()=>has('lightningBolt')&&hit>=2,M13:()=>m.secondary.length>0&&hit>=2,M05:()=>has('lightningBolt')&&m.damage>0,
 M03:()=>m.geometry.includes('arc')&&m.damage>0,M11:()=>m.bounces>=1&&(s.rank<3||m.projectiles.length>=2)&&m.damage>0,M12:()=>m.geometryDetails.some(g=>g.kind==='triangle'&&Math.max(...g.points.map(p=>p.y))-Math.min(...g.points.map(p=>p.y))>200)&&m.damage>0,M14:()=>m.geometry.includes('ring')&&hit===2&&t[2].hp===t[2].maxHp,M15:()=>m.geometry.includes('bagua')&&hit>=2,
 M07:()=>m.stakes>0&&m.damage>0,M10:()=>m.stakes>0&&s.ally?.hp>300&&s.ally?.focus>20&&s.ally?.move>100,M08:()=>m.stakes>0&&t[0].x<s.initial.targets[0].x-10,M09:()=>m.stakes===2&&s.follow&&s.hero.x>s.initial.hero.x+100,M99:()=>m.stakes>0&&m.prisonCross&&m.damage>0,
 S03:()=>hit>=2,S05:()=>hit>=2,S07:()=>t.filter(v=>v.dead).length>=2,S08:()=>m.guard&&m.counter&&m.heroHpMax>s.initial.hero.hp&&m.damage>0,S02:()=>m.heroHpMin<s.initial.hero.hp&&m.damage>0,
 S01:()=>s.hero.x>s.initial.hero.x&&m.damage>0,S06:()=>hit>=2,S04:()=>s.follow&&m.damage>0,S15:()=>hit>=2&&t.some(v=>v.flying)&&t.some((v,i)=>!v.flying&&Math.abs(v.x-s.initial.targets[i].x)>10),S13:()=>s.follow&&m.casts.length>=2&&m.damage>0,
 S09:()=>m.damage>0,S10:()=>t[0].x<s.initial.targets[0].x-100&&m.damage>0,S11:()=>hit>=2,S14:()=>hit>=2&&has('inkLine'),S12:()=>m.orbiters>=5&&m.hits.length>=4,
 O02:()=>m.damage>0,O03:()=>m.modes.includes('spiritRain')&&hit>=2,O04:()=>m.damage>0,O05:()=>m.wraithReturn&&hit>=2,O16:()=>m.modes.includes('convergeSpirit')&&hit>=2,
 O06:()=>m.curse>0&&t.some(v=>v.armor>0),O07:()=>m.curse>0&&m.hits.some(v=>v.target.startsWith('preview-target')&&String(v.source).startsWith('preview-target')),O08:()=>m.manifest&&m.damage>0,O09:()=>m.enthrall&&m.damage>0,O10:()=>m.earthbind&&m.summons>0,
 O11:()=>m.summons>0&&m.damage>0,O12:()=>m.summons>0&&m.modes.includes('summonBolt')&&m.damage>0,O13:()=>m.summons>0&&m.shield>0&&s.ally?.hp>300&&s.ally?.focus>20,O14:()=>m.captured&&s.follow&&m.damage>0,O15:()=>m.summons>0&&s.follow&&m.maxProjectiles>=2&&m.damage>0
 };
 add('observed unique effect for '+s.id,rules[s.id]?.());return checks;
}
