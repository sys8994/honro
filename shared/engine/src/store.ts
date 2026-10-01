import {migrateSkills,SKILL_REVISION} from './skillMechanics';
import {validPhysics} from './physics';
import type { Profile, Battle, ClassId, HeroProgress, Roster } from './types';
import { SKILLS } from './data';
import { upgradeBattle } from './world';
import { CLASS_IDS, freshRoster, baseSkill, XP_CAP, LEGACY_XP_CAP_9, migrateLegacyXp9, TALENT_MAP, levelOf, xpAtLevel, autoTrain, sanitizeLoadout, pointsSpent, pointsEarned, isOpen, requiredRankLevel } from './progression';
const KEY = 'falling-star-company.rpg.v2', BACK = KEY + '.backup', OLD = 'falling-star-company.v1';
const copy = <T>(o: T): T => JSON.parse(JSON.stringify(o));
export function defaults(): Profile { return { version: 2, revision: 12, cleared: {}, party: ['mage', 'archer', 'knight', 'occultist'], loadouts: { mage: ['M01'], archer: ['A01'], knight: ['S00'], occultist: ['O01','O06','O11'] }, tuning: { mage: .5, archer: .5, knight: .5, occultist: .5 }, settings: { sound: true, music: false, volume: .35, assist: false, shake: true, quality: 'high', difficulty: 'normal', speed: 2, playerSpeed: 1, orientation: 'landscape' }, saved: null, lastStage: 1, mapNode: 1, tutorial: false, heroes: freshRoster() }; }
function playback(n: number) { return [1, 1.5, 2, 3, 4].reduce((a, b) => Math.abs(b - n) < Math.abs(a - n) ? b : a, 1); }
function finite(n: unknown) { return typeof n === 'number' && Number.isFinite(n); }
function object(v: unknown): v is Record<string, any> { return !!v && typeof v === 'object' && !Array.isArray(v); }
function fail(): never { throw new Error('세이브 형식이 올바르지 않습니다. 기존 기록은 유지됩니다.'); }
function validHero(raw: unknown, cls: ClassId, legacyXp=false): HeroProgress {
    const maxXp=legacyXp?LEGACY_XP_CAP_9:XP_CAP;
    if (!object(raw) || !finite(raw.xp) || raw.xp < 0 || raw.xp > maxXp || !object(raw.ranks)) return fail();
    const converted=legacyXp?migrateLegacyXp9(raw.xp):Math.floor(raw.xp);
    const h: HeroProgress = { xp: converted, ranks: {}, kills: 0, damage: 0, skillRevision:raw.skillRevision,martialRevision:raw.martialRevision,occultRevision:raw.occultRevision };
    if(raw.skillRevision!==undefined&&raw.skillRevision!==SKILL_REVISION)return fail();
    if(raw.martialRevision!==undefined&&raw.martialRevision!==1)return fail();
    if(raw.occultRevision!==undefined&&raw.occultRevision!==1)return fail();
    for (const [id, rank] of Object.entries(raw.ranks)) {
        if(id===baseSkill(cls)&&SKILLS[id].basic){if(rank!==1)return fail();h.ranks[id]=1;continue;}
        const n = TALENT_MAP[id];
        if (!n || n.cls !== cls || !finite(rank) || !Number.isInteger(rank) || rank < 0 || rank > n.maxRank)
            return fail();
        if (rank > 0)
            h.ranks[id] = rank;
    }
    if (!h.ranks[baseSkill(cls)])
        h.ranks[baseSkill(cls)] = 1;
    for (const [id, rank] of Object.entries(h.ranks)) {
        const n = TALENT_MAP[id];if(SKILLS[id]?.basic)continue;
        if (levelOf(h) < requiredRankLevel(n,rank) || n.prereq && !(h.ranks[n.prereq] > 0))
            return fail();
    }
    if (pointsSpent(h, cls) > pointsEarned(h))
        return fail();
    for (const k of ['kills', 'damage'] as const) {
        if (raw[k] !== undefined && (!finite(raw[k]) || raw[k] < 0 || raw[k] > 1e12))
            return fail();
        h[k] = Math.floor(raw[k] || 0);
    }
    return h;
}
function validRoster(v: unknown,legacyXp=false): Roster { if (!object(v)) return fail(); return { mage: validHero(v.mage, 'mage',legacyXp), archer: validHero(v.archer, 'archer',legacyXp), knight: validHero(v.knight, 'knight',legacyXp), occultist: v.occultist === undefined ? freshRoster().occultist : validHero(v.occultist, 'occultist',legacyXp) }; }
function validBattle(raw: unknown,legacyXp=false): Battle {
    if (!object(raw) || raw.version !== 2)
        return fail();
    const b = copy(raw) as Battle;
    b.fields ??= [];
    b.controlMode ??= 'move';
    if (b.revision !== undefined && ![4,5,6,7,8,9,10,11].includes(b.revision))
        return fail();
    if (!['move', 'aim'].includes(b.controlMode))
        return fail();
    if (!Number.isInteger(b.stageId) || b.stageId < 1 || b.stageId > 36 || !finite(b.width) || b.width < 1400 || b.width > 12000 || !finite(b.height) || b.height < 680 || b.height > 6500)
        return fail();
    for (const [key, limit] of [['units', 80], ['terrain', 512], ['waters', 80], ['drafts', 60], ['decor', 250], ['projectiles', 512], ['zones', 160], ['events', 60], ['queue', 80], ['awardIds', 600], ['fields', 30]] as const)
        if (!Array.isArray(b[key]) || b[key].length > limit)
            return fail();
    if (!['aim', 'flight', 'enemy', 'review', 'transition', 'summon', 'won', 'lost'].includes(b.phase) || !['campaign', 'practice', 'skirmish'].includes(b.mode) || ![0, 1].includes(b.side) || !['explorer','story','normal','veteran','nightmare'].includes(b.difficulty))
        return fail();
    const nums = (v: unknown, keys: string[], max = 1e14) => object(v) && keys.every(k => finite(v[k]) && Math.abs(v[k]) <= max), ids = new Set<string>(), safe = (s: unknown, max = 100) => typeof s === 'string' && s.length <= max && !['__proto__', 'prototype', 'constructor'].includes(s);
    const existenceVector=(v:unknown,partial=false)=>object(v)&&['form','qi','soul'].every(k=>partial&&v[k]===undefined||finite(v[k])&&v[k]>= (partial?-2:0)&&v[k]<=2);
    if (!nums(b, ['round', 'wind', 'turnAge', 'resolveAge', 'nextId', 'shot', 'shots', 'hits', 'kills', 'seed', 'rng', 'reinforced', 'sceneVersion', 'enemyLimit', 'encounter']) || b.round < 1 || b.enemyLimit < 1 || b.enemyLimit > 12)
        return fail();
    for (const u of b.units) {
        if (!safe(u.id) || ids.has(u.id) || !safe(u.name) || !safe(u.role) || !CLASS_IDS.includes(u.cls) || ![0, 1, 2].includes(u.side) || !nums(u, ['x', 'y', 'vx', 'vy', 'hp', 'maxHp', 'r', 'h', 'focus', 'maxFocus', 'regen', 'level', 'attack', 'armor', 'shield', 'bound', 'mark', 'breaks', 'moveLeft', 'maxMove', 'walkSpeed', 'angle', 'lastPower', 'tune', 'facing', 'hurt', 'anim', 'spawnX', 'spawnY', 'group', 'lastAct', 'aggroUntil', 'xpBudget', 'xpGranted']) || u.hp < 0 || u.hp > u.maxHp || u.maxHp <= 0 || u.maxHp > 100000 || u.focus < 0 || u.focus > u.maxFocus || u.maxFocus > 10000 || u.r <= 0 || u.r > 160 || u.h <= 0 || u.h > 300 || !Array.isArray(u.loadout) || u.loadout.some(id => !Object.prototype.hasOwnProperty.call(SKILLS, id)) || !object(u.damageBy) || !object(u.ranks))
            return fail();
        for (const f of ['dead', 'airborne', 'acted', 'fixed', 'awake', 'killRewarded'] as const)
            if (typeof u[f] !== 'boolean')
                return fail();
        if(u.aiMove){const a=u.aiMove;
            if(!nums(a,['round','index','elapsed','stalled','lastX','lastY'])||a.round!==b.round||a.elapsed<0||a.elapsed>8||a.stalled<0||a.stalled>1||!Number.isInteger(a.index)||a.index<0||!safe(a.targetId)||!safe(a.intent)||typeof a.jumping!=='boolean'||!Array.isArray(a.path)||a.path.length<1||a.path.length>4||a.index>=a.path.length||a.path.some(v=>!nums(v,['x','y'])||typeof v.jump!=='boolean'||v.jumpX!==undefined&&(!finite(v.jumpX)||v.jumpX<0||v.jumpX>b.width)||v.x<0||v.x>b.width||v.y< -1000||v.y>b.height+100))return fail();
        }
        if (u.moveTarget !== undefined && !finite(u.moveTarget))
            return fail();
        if(u.existenceDefense!==undefined&&!existenceVector(u.existenceDefense)||u.existenceShift!==undefined&&!existenceVector(u.existenceShift,true))return fail();
        for (const [id, r] of Object.entries(u.ranks)) {
            const n=TALENT_MAP[id],sk=SKILLS[id];
            if(sk?.basic||sk?.enemyOnly){if(!finite(r)||!Number.isInteger(r)||r<0||r>8)return fail();continue;}
            if(sk?.ultimate&&sk.cls===u.cls){if(!finite(r)||!Number.isInteger(r)||r<0||r>1)return fail();continue;}
            if (!n || n.cls !== u.cls || !finite(r) || !Number.isInteger(r) || r < 0 || r > n.maxRank) return fail();
        }
        if (u.armor < 0 || u.armor > 1 || u.level < 1 || u.level > 25 || u.attack < 0 || u.attack > 100 || u.maxMove < 0 || u.maxMove > 100000 || u.walkSpeed < 0 || u.walkSpeed > 3000)
            return fail();
        if(u.elite!==undefined&&typeof u.elite!=='boolean')return fail();
        if(u.cooldowns!==undefined&&(!object(u.cooldowns)||Object.entries(u.cooldowns).some(([id,v])=>!SKILLS[id]||!finite(v)||v<0||v>100000)))return fail();
        if(u.combatBaseHp!==undefined&&(!finite(u.combatBaseHp)||u.combatBaseHp<=0||u.combatBaseHp>100000))return fail();
        if(u.combatBaseAttack!==undefined&&(!finite(u.combatBaseAttack)||u.combatBaseAttack<=0||u.combatBaseAttack>100))return fail();
        if((u.combatBaseHp===undefined)!==(u.combatBaseAttack===undefined))return fail();
        ids.add(u.id);
    }
    if (!ids.has(b.active) || b.phase === 'aim' && b.side !== 0 || b.phase === 'enemy' && b.side !== 1 || b.phase==='review' && (![0,1].includes(b.side) || !finite(b.reviewLeft)))
        return fail();
    for (const u of b.units)
        for (const [id, d] of Object.entries(u.damageBy))
            if (!ids.has(id) || !finite(d) || d < 0)
                return fail();
    if(b.physics!==undefined&&!validPhysics(b.physics))return fail();
    if((b.phase==='summon')!==!!b.summonTurn)return fail();
    if(b.summonTurn){const t=b.summonTurn;
        if(b.side!==0||!Array.isArray(t.queue)||t.queue.length>64||new Set(t.queue).size!==t.queue.length||t.queue.some(id=>!ids.has(id)||!b.units.find(u=>u.id===id&&(u.summoned||u.enthrall)))||!Number.isInteger(t.index)||t.index<0||t.index>t.queue.length||!['approach','attack','wait'].includes(t.stage)||!nums(t,['elapsed','hold'])||t.elapsed<0||t.elapsed>30||Math.abs(t.hold)>2||!ids.has(t.returnActive)||typeof t.practice!=='boolean'||t.afterActor!==undefined&&typeof t.afterActor!=='boolean')return fail();
        if(t.start&&!nums(t.start,['x','y'])||t.destination&&!nums(t.destination,['x','y'])||t.targetId!==undefined&&!ids.has(t.targetId))return fail();
    }
    for(const u of b.units){
        if(u.summonFloating!==undefined&&typeof u.summonFloating!=='boolean'||u.summoned!==undefined&&typeof u.summoned!=='boolean')return fail();
        if(u.summoned&&(!['stalker','lantern','charger','warden','host','eater','echo','earthbound'].includes(u.summonKind||'')||!ids.has(u.summonOwner||'')||!finite(u.summonExpires)||u.side!==0))return fail();
        if(u.enthrall&&(!ids.has(u.enthrall.owner)||u.side!==0||!nums(u.enthrall,['actions','captureRatio','originalMaxHp','originalAttack','originalArmor','power'])||u.enthrall.actions<0||u.enthrall.actions>7||u.enthrall.captureRatio<0||u.enthrall.captureRatio>1))return fail();
        if(u.spiritSight!==undefined&&typeof u.spiritSight!=='boolean'||u.spiritHidden!==undefined&&typeof u.spiritHidden!=='boolean'||u.manifested!==undefined&&typeof u.manifested!=='boolean'||u.revealSpiritToParty!==undefined&&typeof u.revealSpiritToParty!=='boolean')return fail();
        for(const key of ['summonRank','summonActionRound','summonAbsorbed','manifestedUntil','formDamageTakenBonus','soulAffinityBonus','soulDefenseBonus','soulBonusUntil','nextSummonDiscount','soulRemnants'] as const)if(u[key]!==undefined&&!finite(u[key]))return fail();
        if(u.earthbind&&(!ids.has(u.earthbind.owner)||!nums(u.earthbind,['until','damage'])))return fail();
        if(u.impactCooldown!==undefined&&(!finite(u.impactCooldown)||u.impactCooldown<0||u.impactCooldown>1))return fail();
    }
    const tids = new Set<string>();
    for (const t of b.terrain) {
        if (!safe(t.id) || tids.has(t.id) || !nums(t, ['x', 'y', 'w', 'h', 'hp', 'maxHp']) || t.w <= 0 || t.h <= 0 || t.w > 15000 || t.h > 6000 || !['rock', 'stone', 'wood', 'metal', 'ice', 'barrel', 'device', 'support', 'crystal'].includes(t.mat) || t.slope !== undefined && !finite(t.slope))
            return fail();
        tids.add(t.id);
        if (t.moving && !nums(t.moving, ['x', 'y', 'dx', 'dy']))
            return fail();
    }
    for (const u of b.units)
        if (u.x < -500 || u.x > b.width + 500 || u.y < -2400 || u.y > b.height + 600)
            return fail();
    for (const w of b.waters)
        if (!nums(w, ['x', 'y', 'w', 'depth', 'frozen']) || w.w < 0 || w.w > 15000 || w.kind && !['water', 'lava'].includes(w.kind))
            return fail();
    for (const d of b.drafts)
        if (!nums(d, ['x', 'y', 'w', 'h', 'force']))
            return fail();
    for (const d of b.decor)
        if (!nums(d, ['x', 'y', 'size', 'variant']) || !['tree', 'pine', 'ruin', 'waterfall', 'house', 'spire', 'banner', 'crystal', 'torch', 'arch'].includes(d.kind))
            return fail();
    for (const f of b.fields)
        if (!safe(f.id) || !['gravity', 'storm', 'repulsor'].includes(f.kind) || !nums(f, ['x', 'y', 'radius', 'strength']) || f.radius < 10 || f.radius > 3000 || f.strength < 0 || f.strength > 5000)
            return fail();
    for (const u of b.units) {
        for (const k of ['moving', 'walkPhase', 'landing', 'stun', 'stunUntil'] as const)
            if (u[k] !== undefined && (!finite(u[k]) || u[k]! < 0 || u[k]! > 1e12))
                return fail();
        if (u.jumping !== undefined && typeof u.jumping !== 'boolean')
            return fail();
    }
    if(b.skillRevision!==undefined&&b.skillRevision!==SKILL_REVISION)return fail();
    if(b.martialRevision!==undefined&&b.martialRevision!==1)return fail();
    if(b.occultRevision!==undefined&&b.occultRevision!==1)return fail();
    const optionalNumber=(v:unknown,min=0,max=1e12)=>v===undefined||finite(v)&&(v as number)>=min&&(v as number)<=max;
    for(const u of b.units){
        if(!optionalNumber(u.arrowTurn)||u.arrowTurnToken!==undefined&&!safe(u.arrowTurnToken)||!optionalNumber(u.salheunFlash,0,1)||!optionalNumber(u.jucheon,0,108)||!optionalNumber(u.bladeStored,0,.450001))return fail();
        for(const key of ['jucheonReady','harmony'] as const)if(u[key]!==undefined&&typeof u[key]!=='boolean')return fail();
        if(u.swordChain&&(!Array.isArray(u.swordChain)||u.swordChain.length>2||new Set(u.swordChain).size!==u.swordChain.length||u.swordChain.some(v=>!['sword','rush','blade'].includes(v))))return fail();
        if(u.meleeFollow!==undefined&&!['landing','ready','spent'].includes(u.meleeFollow))return fail();
        if(u.martialGuard&&(!nums(u.martialGuard,['round','reduction'])||u.martialGuard.reduction<0||u.martialGuard.reduction>.300001||u.martialGuard.counter!==undefined&&typeof u.martialGuard.counter!=='boolean'||!optionalNumber(u.martialGuard.rank,1,8)))return fail();
        if(u.bladeScreen&&(!nums(u.bladeScreen,['round','rank','hits','facing'])||u.bladeScreen.rank<1||u.bladeScreen.rank>8||u.bladeScreen.hits<0||u.bladeScreen.hits>7||![-1,1].includes(u.bladeScreen.facing)))return fail();
        if(u.meleeAction){const a=u.meleeAction;if(!SKILLS[a.skill]?.martial||!nums(a,['elapsed','index','damage','range','power','shot'])||a.elapsed<0||a.elapsed>5||a.index<0||a.index>8||a.damage<0||a.range<0||a.power<0||a.power>1||a.target!==undefined&&!ids.has(a.target)||!optionalNumber(a.lifeCost,0,50000))return fail();}
        if(u.salheun){if(!object(u.salheun))return fail();for(const [owner,h] of Object.entries(u.salheun)){if(!ids.has(owner)||!nums(h,['action','recorded','cap'])||h.recorded<0||h.cap<0||h.recorded>h.cap+.01||!Array.isArray(h.entries)||h.entries.length>5||h.entries.some(v=>!nums(v,['turn','damage'])||v.turn<0||v.damage<0)||!Array.isArray(h.projectiles)||h.projectiles.length>64||h.projectiles.some(v=>!finite(v)))return fail();}}
    }
    if(b.cast&&(!ids.has(b.cast.owner)||!SKILLS[b.cast.skill]||!nums(b.cast,['shot','cost','enemyDamage'])||b.cast.cost<0||b.cast.enemyDamage<0||b.cast.refunded!==undefined&&typeof b.cast.refunded!=='boolean'))return fail();
    for(const u of b.units){
        if(u.retreat!==undefined&&typeof u.retreat!=='boolean'||u.gateTurn!==undefined&&!safe(u.gateTurn))return fail();
        if(u.prepared&&(!nums(u.prepared,['rank','expires'])||!Number.isInteger(u.prepared.rank)||u.prepared.rank<1||u.prepared.rank>8))return fail();
        if(u.slowed&&(!nums(u.slowed,['factor','expires'])||u.slowed.factor<0||u.slowed.factor>1))return fail();
        if(u.arrivalGuard!==undefined&&!finite(u.arrivalGuard))return fail();
        if(u.shove&&(!ids.has(u.shove.owner)||!nums(u.shove,['damage','remaining','life'])||!Array.isArray(u.shove.hit)||u.shove.hit.some(id=>!ids.has(id))))return fail();
    }
    if(b.stakes){
        if(!Array.isArray(b.stakes)||b.stakes.length>512)return fail();
        const seen=new Set<number>();for(const z of b.stakes){
            if(!nums(z,['id','x','y','rank','damage','shot'])||!ids.has(z.owner)||SKILLS[z.skill]?.branch!=='stake'||![0,1,2].includes(z.side)||seen.has(z.id)||!Number.isInteger(z.rank)||z.rank<1||z.rank>8)return fail();seen.add(z.id);
            if(z.active!==undefined&&typeof z.active!=='boolean'||z.expires!==undefined&&!finite(z.expires)||z.inside&&(!Array.isArray(z.inside)||z.inside.some(id=>!ids.has(id))))return fail();
            if(!optionalNumber(z.effectBoost,0,.15))return fail();
            for(const m of [z.crossed,z.budgetTurns])if(m&&(!object(m)||Object.entries(m).some(([id,turn])=>!ids.has(id)||!safe(turn))))return fail();
        }
    }
    const modes = new Set([...Object.values(SKILLS).map(s => s.mode), 'meteor', 'grappletravel', 'iceShard', 'stormBolt', 'seekChild', 'arcBolt', 'hunterBolt', 'nightBolt', 'spiritRain','summonBolt','convergeSpirit','ironChip','fireChip','frostChip','ironEmitter','microEmitter','microWait','skyWait']);
    for (const q of [...b.projectiles, ...(b.volley ? [b.volley.template] : [])]) {
        if (!nums(q, ['id', 'x', 'y', 'vx', 'vy', 'prevVy', 'age', 'radius', 'damage', 'blast', 'wind', 'bounces', 'pierces', 'phase', 'returnX', 'returnY', 'rolled', 'shot']) || !ids.has(q.owner) || !SKILLS[q.skill] || !modes.has(q.mode) || !Array.isArray(q.hit) || q.hit.length > 100 || !Array.isArray(q.trail) || q.trail.length > 400 || q.trail.some(v => !nums(v, ['x', 'y'])) || typeof q.body !== 'boolean' || typeof q.child !== 'boolean')
            return fail();
        if (q.fieldHits !== undefined && (!Array.isArray(q.fieldHits) || q.fieldHits.length > 30 || q.fieldHits.some(id => !safe(id))))
            return fail();
        if (q.amplification !== undefined && (!finite(q.amplification) || q.amplification < 1 || q.amplification > 2))
            return fail();
        if (q.emissions !== undefined && (!finite(q.emissions) || q.emissions < 0 || q.emissions > 100))
            return fail();
        if(q.targetId!==undefined&&(!safe(q.targetId)||!ids.has(q.targetId)))return fail();
        if(q.drag!==undefined&&(!finite(q.drag)||q.drag<0||q.drag>5)||q.gravityScale!==undefined&&(!finite(q.gravityScale)||Math.abs(q.gravityScale)>10)||q.skillRank!==undefined&&(!Number.isInteger(q.skillRank)||q.skillRank<1||q.skillRank>8))return fail();
        if(q.echoDelay!==undefined&&(!finite(q.echoDelay)||q.echoDelay<0||q.echoDelay>.3)||q.echoSource!==undefined&&!ids.has(q.echoSource)||q.soulBoost!==undefined&&typeof q.soulBoost!=='boolean')return fail();
        if(q.curve&&(!nums(q.curve.start,['x','y'])||!nums(q.curve.spread,['x','y'])||!nums(q.curve.control,['x','y'])||!nums(q.curve.goal,['x','y'])||!finite(q.curve.duration)||q.curve.duration<=0||q.curve.duration>3))return fail();

        if(q.ultimateBurst!==undefined&&typeof q.ultimateBurst!=='boolean')return fail();
        if(!optionalNumber(q.effectBoost,0,.15)||!optionalNumber(q.sizeBoost,0,2)||q.dived!==undefined&&typeof q.dived!=='boolean')return fail();
        if(q.orbit){const o=q.orbit;if(!finite(o.seed)||!Array.isArray(o.blades)||o.blades.length<5||o.blades.length>9)return fail();for(const blade of o.blades){if(!nums(blade,['radius','omega','phase','mod'])||blade.radius<1||blade.radius>150||Math.abs(blade.omega)>5||!object(blade.hits)||!object(blade.lastHits)||Object.entries(blade.hits).some(([id,n])=>!ids.has(id)||!Number.isInteger(n)||n<0||n>2)||Object.entries(blade.lastHits).some(([id,n])=>!ids.has(id)||!finite(n)||n<0))return fail();}}
        for(const key of ['apexY','launchX','launchY','rootDamage','plannedTime','maxAge','returnAge','preparedRank'] as const)if(q[key]!==undefined&&!finite(q[key]))return fail();
        for(const key of ['turned','returning','secondary'] as const)if(q[key]!==undefined&&typeof q[key]!=='boolean')return fail();
        if(q.targetPoint&&!nums(q.targetPoint,['x','y'])||q.contacts&&(!Array.isArray(q.contacts)||q.contacts.length>100||q.contacts.some(v=>!nums(v,['x','y'])))||q.outboundHits&&(!Array.isArray(q.outboundHits)||q.outboundHits.some(id=>!ids.has(id))))return fail();
    }
    if(b.vertical!==undefined&&typeof b.vertical!=='boolean')return fail();
    if(b.routePoints!==undefined&&(!Array.isArray(b.routePoints)||b.routePoints.length>80||b.routePoints.some(v=>!nums(v,['x','y']))))return fail();
    if(b.reviewLeft!==undefined&&(!finite(b.reviewLeft)||b.reviewLeft<0||b.reviewLeft>2))return fail();
    if(b.reviewFocus!==undefined&&!nums(b.reviewFocus,['x','y']))return fail();
    if(b.reviewDamage!==undefined&&(!object(b.reviewDamage)||Object.entries(b.reviewDamage).some(([id,d])=>!ids.has(id)||!finite(d)||d<0||d>1e8)))return fail();
    if(b.volley){const v=b.volley,p=v.template;if(!nums(v,['remaining','elapsed','interval','index','angle','power'])||v.remaining<0||v.remaining>5||!Number.isInteger(v.remaining)||![.5,1].includes(v.interval)||v.index<0||v.index>6||v.elapsed<0||v.elapsed>2||v.power<0||v.power>1||!object(p)||!nums(p,['x','y','vx','vy','damage','blast','radius','shot'])||!ids.has(p.owner)||!SKILLS[p.skill]||SKILLS[p.skill].cls!=='archer'||SKILLS[p.skill].passive||!modes.has(p.mode))return fail();}
    for(const u of b.units){if(u.carriedBy!==undefined&&(!finite(u.carriedBy)||!b.projectiles.some(p=>p.id===u.carriedBy&&(p.mode==='charge'||p.mode==='cataclysmCharge'))))return fail();if(u.lastStandUsed!==undefined&&typeof u.lastStandUsed!=='boolean')return fail();}
    for(const p of b.projectiles){if(p.carry!==undefined&&(!Array.isArray(p.carry)||p.carry.length>60||p.carry.some(id=>!ids.has(id))))return fail();if(p.repeatIndex!==undefined&&(!finite(p.repeatIndex)||p.repeatIndex<0||p.repeatIndex>5))return fail();if(p.existenceAttack!==undefined&&!existenceVector(p.existenceAttack))return fail();}
    for (const z of b.zones)
        if (!nums(z, ['id', 'x', 'y', 'radius', 'damage', 'expires']) || !['fire', 'frost', 'delay', 'bomb'].includes(z.kind) || !ids.has(z.owner))
            return fail();
    if(b.occultTraps&&(!Array.isArray(b.occultTraps)||b.occultTraps.length>64||b.occultTraps.some(t=>!nums(t,['id','x','y','rank','damage','expires'])||!ids.has(t.owner)||!['O06','O07','O08'].includes(t.skill))))return fail();
    if (!nums(b.items, ['heal', 'focus', 'cleanse', 'ward']) || b.events.some(t => !safe(t, 600)) || !object(b.lastShots) || !object(b.shotDamage) || !Array.isArray(b.teamEnds) || b.teamEnds.length !== 3 || b.teamEnds.some(n => !finite(n) || n < 0) || typeof b.rewardGranted !== 'boolean' || !safe(b.session, 120))
        return fail();
    for (const s of Object.values(b.lastShots))
        if (!nums(s, ['angle', 'power', 'wind']) || !SKILLS[s.skill] || !Array.isArray(s.path) || s.path.length > 400 || s.path.some(v => !nums(v, ['x', 'y'])))
            return fail();
    b.heroes = validRoster(b.heroes,legacyXp);
    if(object(b.startXP)&&legacyXp)for(const cls of CLASS_IDS)if(finite(b.startXP[cls]))b.startXP[cls]=migrateLegacyXp9(b.startXP[cls]);
    if(object(b.startXP)&&b.startXP.occultist===undefined)b.startXP.occultist=b.heroes.occultist.xp;
    if (!nums(b.startXP, CLASS_IDS))
        return fail();
    return b;
}
export function validate(input: unknown): Profile {
    const raw=copy(input);
    if (!object(raw) || ![1, 2].includes(raw.version))
        throw new Error('지원하지 않는 세이브 버전입니다.');
    if(raw.revision !== undefined && (!finite(raw.revision)||raw.revision>12))throw new Error('더 새로운 게임에서 저장한 기록입니다. 해당 버전으로 열어주세요.');
    if(object(raw.heroes)&&object(raw.loadouts)&&['archer','mage'].every(c=>object(raw.heroes[c])&&Array.isArray(raw.loadouts[c])))migrateSkills(raw as Profile);
    const p = defaults(), legacy = raw.version === 1;
    if (raw.cleared !== undefined) {
        if (!object(raw.cleared))
            return fail();
        for (const [id, v] of Object.entries(raw.cleared)) {
            if (!/^([1-9]|[12][0-9]|3[0-6])$/.test(id) || !object(v) || !finite(v.stars) || !finite(v.rounds) || !finite(v.shots))
                return fail();
            p.cleared[id] = { stars: clampInt(v.stars, 1, 3), rounds: clampInt(v.rounds, 1, 99999), shots: clampInt(v.shots, 0, 999999), visits: finite(v.visits) ? clampInt(v.visits, 1, 999999) : 1 };
        }
    }
    p.party = [...CLASS_IDS];
    if (legacy) {
        const level = Math.min(25, 1 + Math.floor(Object.keys(p.cleared).length / 1.45));
        for (const cls of CLASS_IDS) {
            p.heroes[cls].xp = xpAtLevel(level);
            autoTrain(p.heroes[cls], cls);
        }
        p.migrated = true;
        p.tutorial = false;
    }
    else {
        if([4,5,6,7,8,9,10,11,12].includes(raw.revision)){const legacyXp=raw.revision<=10;p.heroes=validRoster(raw.heroes,legacyXp);p.migrated=!!raw.migrated;}
        else {
            // Tree topology changed: retain earned progression and refund ALL old allocations.
            // Also retain XP already committed inside an unfinished legacy campaign battle.
            const old=raw.saved?.mode==='campaign'&&object(raw.saved?.heroes)?raw.saved.heroes:raw.heroes;
            if(!object(old))return fail();
            for(const cls of CLASS_IDS){const h=old[cls];
                if(cls==='occultist'&&!object(h)){p.heroes[cls]=freshRoster().occultist;continue;}
                if(!object(h)||!finite(h.xp)||h.xp<0||h.xp>LEGACY_XP_CAP_9)return fail();
                for(const k of ['kills','damage'])if(h[k]!==undefined&&(!finite(h[k])||h[k]<0||h[k]>1e12))return fail();
                p.heroes[cls]={xp:migrateLegacyXp9(h.xp),ranks:{[baseSkill(cls)]:1},kills:Math.floor(h.kills||0),damage:Math.floor(h.damage||0)};
            }
            p.migrated=true;
        }
        p.tutorial = [4,5,6,7,8,9,10,11,12].includes(raw.revision) && !!raw.tutorial;
    }
    for (const cls of CLASS_IDS) {
        if (Array.isArray(raw.loadouts?.[cls]))
            p.loadouts[cls] = raw.loadouts[cls].filter((id: unknown) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(SKILLS, id) && SKILLS[id].cls === cls).slice(0, 4);
        if (finite(raw.tuning?.[cls]))
            p.tuning[cls] = Math.max(0, Math.min(1, raw.tuning[cls]));
        sanitizeLoadout(p, cls);
    }
    if (object(raw.settings)) {
        const s = raw.settings;
        for (const k of ['sound', 'assist', 'shake'] as const)
            if (typeof s[k] === 'boolean')
                p.settings[k] = s[k];
        if (finite(s.volume))
            p.settings.volume = Math.max(0, Math.min(1, s.volume));
        if (['high', 'low'].includes(s.quality))
            p.settings.quality = s.quality;
        if (['explorer','story','normal','veteran','nightmare'].includes(s.difficulty))
            p.settings.difficulty = s.difficulty;
        if (['auto','landscape','portrait'].includes(s.orientation))
            p.settings.orientation = s.orientation;
        if (finite(s.speed))
            p.settings.speed = playback(s.speed);
        if (finite(s.playerSpeed))
            p.settings.playerSpeed = playback(s.playerSpeed);
    }
    p.settings.music = false;
    if (finite(raw.lastStage))
        p.lastStage = clampInt(raw.lastStage, 1, 36);
    p.mapNode = legacy ? p.lastStage : finite(raw.mapNode) ? clampInt(raw.mapNode, 1, 36) : 1;
    if (!isOpen(p, p.mapNode))
        p.mapNode = 1;
    if (!legacy && [4,5,6,7,8,9,10,11,12].includes(raw.revision) && raw.saved) {
        p.saved = validBattle(raw.saved,raw.revision<=10);
        if (p.saved.mode === 'campaign')
            p.heroes = copy(p.saved.heroes);
        for (const cls of CLASS_IDS)
            sanitizeLoadout(p, cls);
        p.saved = upgradeBattle(p.saved, p);
    }
    return p;
}
function clampInt(n: number, a: number, b: number) { return Math.max(a, Math.min(b, Math.floor(n))); }
export class Storage {
    private db: IDBDatabase | null = null;
    warning = '';
    private chain = Promise.resolve();
    private revision = Date.now();
    async open() { try {
        this.db = await new Promise<IDBDatabase>((resolve, reject) => { const req = indexedDB.open('falling-star-company', 1); const timer = setTimeout(() => reject(new Error('timeout')), 1800); req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains('saves'))
            req.result.createObjectStore('saves'); }; req.onsuccess = () => { clearTimeout(timer); resolve(req.result); }; req.onerror = () => { clearTimeout(timer); reject(req.error); }; req.onblocked = () => { clearTimeout(timer); reject(new Error('blocked')); }; });
    }
    catch {
        this.db = null;
    } }
    async load(): Promise<Profile> {
        await this.open();
        const candidates: {
            stamp: number;
            profile: unknown;
            legacy?: boolean;
        }[] = [];
        for (const key of [KEY, BACK, OLD, OLD + '.backup'])
            try {
                const str = localStorage.getItem(key);
                if (str) {
                    const v = JSON.parse(str);
                    candidates.push({ ...v, legacy: key.startsWith(OLD) });
                }
            }
            catch { }
        if (this.db)
            for (const key of ['current-rpg', 'current'])
                try {
                    const obj = await new Promise<any>((resolve, reject) => { const r = this.db!.transaction('saves').objectStore('saves').get(key); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
                    if (obj)
                        candidates.push({ ...obj, legacy: key === 'current' });
                }
                catch { }
        candidates.sort((a, b) => Number(a.legacy) - Number(b.legacy) || (b.stamp || 0) - (a.stamp || 0));
        for (const c of candidates)
            try {
                const p = validate(c.profile);
                this.revision = Math.max(Date.now(), c.stamp || 0);
                return p;
            }
            catch {
                this.warning = '저장 기록의 정상 백업을 확인했습니다.';
            }
        if (candidates.length)
            this.warning = '저장 기록을 읽지 못했습니다. 백업 파일을 가져와 주세요.';
        return defaults();
    }
    save(profile: Profile) {
        const envelope = { stamp: Math.max(Date.now(), ++this.revision), profile: copy(profile) };
        this.revision = envelope.stamp;
        let localOK = false;
        try {
            const old = localStorage.getItem(KEY);
            if (old) {
                try {
                    validate(JSON.parse(old).profile);
                    localStorage.setItem(BACK, old);
                }
                catch { }
            }
            localStorage.setItem(KEY, JSON.stringify(envelope));
            localOK = true;
        }
        catch { }
        const db = this.db;
        this.chain = this.chain.catch(() => { }).then(async () => { if (db)
            try {
                await new Promise<void>((resolve, reject) => { const tx = db.transaction('saves', 'readwrite'); tx.objectStore('saves').put(envelope, 'current-rpg'); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); });
                return;
            }
            catch { } if (!localOK)
            this.warning = '자동 저장을 사용할 수 없습니다. 설정에서 세이브를 내보내세요.'; });
        return this.chain;
    }
    export(profile: Profile) { const blob = new Blob([JSON.stringify({ format: 'falling-star-company', edition: 'arcfall-9.2', exportedAt: new Date().toISOString(), profile }, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'ARCFALL_save_' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000); }
    async import(file: File) { if (file.size > 8000000)
        throw new Error('세이브 파일이 너무 큽니다.'); let raw; try {
        raw = JSON.parse(await file.text());
    }
    catch {
        throw new Error('JSON 세이브 파일을 선택해 주세요.');
    } return validate(raw.profile || raw); }
}
