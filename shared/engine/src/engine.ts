import {newSkill,redesignImpact,redesignStep,redesignPrediction,splitSeven,initRedesignCast,redrawDamage,recordRedesignDamage,finishRedesign,tickRedesign,migrateEnemySkills,turnArrow,useGate,gateCandidate,specialty} from './skillMechanics';
import {terrainSurface,walkTerrain} from './locomotion';
import {SUMMON_TUNING} from './summons';
import {makePhysics,environmentAt,changePhysics,duePhysics,advanceLinear,dragFor,collisionDamage,validPhysicsPatch} from './physics';
import type {PhysicsPatch} from './physics';
import {multishotProfile,volleyAngles,waveCount} from './projectileGrowth';
import { ACTION_REVIEW_SECONDS, CHARGE_ACCELERATION, MAX_CHARGE_SECONDS, VOLLEY_INTERVAL, VOLLEY_SPREAD, DIFFICULTIES, MANA_COST_MULTIPLIER } from './balance';
import { skillBalanceFactor } from './balanceModel';
import { evaluateStageEnd } from './stageRules';
import type { Battle, Unit, Projectile, Skill, Side, Terrain, Vec, Zone, Event, Profile } from './types';
import { SKILLS, STAGES, ENEMIES, CLASSES } from './data';
import { planEnemyMove, advanceEnemyMove, targetFor, chooseEnemyShot, friendlyFireRisk, shotViable, shotImpactValue, flyingEnemy, FLY_MOVE_BUDGET } from './enemyAI';
import { G, STEP, WORLD_W, WORLD_H, clamp, rad, segRect, segmentTerrain, topAt, terrainSurfaces, terrainSlopeAt, terrainRectIntersects, dist, AIM_MIN, AIM_MAX } from './math';
import { createBattle, groundY, makeEnemy, makeUnit } from './world';
import { grantXP, applyHero, levelOf, TALENT_MAP, passiveBonus, recommendedLevel, equippedRank, passiveRank, skillDamageFactor, skillRadiusFactor, skillManaFactor, volleyCount, volleyDamage, knockbackResistance, ultimateUnlocked } from './progression';
const GHOST = new Set(['spiritBolt','phaseWraith','reverseGhost','spiritLance','wraithReturn','nightParade']);
const CURSES = new Set(['curseWeak','curseBetray','curseDot','curseBind','curseChain']);
const SUMMONS = new Set(['summonStalker','summonLantern','summonCharger','summonWarden','summonHost']);
const BODY = new Set(['leap', 'slam', 'spin', 'dash', 'quake', 'guard', 'lift', 'recall', 'charge', 'vault', 'cataclysmCharge']);
const ARROWS = new Set(['recoveryArrow','executeArrow','dropArrow','turnArrow','chainArrow','ironFlower','breakArrow','arrow', 'pierce', 'ricochet', 'triple', 'push', 'bind', 'break', 'sticky', 'pull', 'mark', 'rain', 'return', 'homing', 'windArrow', 'seekRain', 'seekChild', 'hunterBolt']);
// Authored pools follow their actual basin floor, so an elevated pool cannot shock actors below the cliff.
function waterFloor(w:Battle['waters'][number],x:number){
    if(!w.bottom?.length)return Infinity;
    const ps=w.bottom,nx=clamp(x,w.x,w.x+w.w);
    for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i];if(nx>=a.x&&nx<=b.x)return a.y+(b.y-a.y)*(nx-a.x)/(b.x-a.x||1);}
    return w.y+w.depth;
}
export interface Collision {
    x: number;
    y: number;
    t: number;
    n: Vec;
    terrain?: Terrain;
    unit?: Unit;
}
export interface Prediction {
    points: Vec[];
    x: number;
    y: number;
    unit?: string;
    terrain?: string;
    closest: number;
    apex?: Vec;
}
export class Engine {
    b: Battle;
    onEvent: (e: Event) => void;
    private counter = 0;
    private terrainBins = new Map<number, Terrain[]>();
    private terrainOrder = new Map<Terrain, number>();
    private indexedVersion = -1;
    private indexedCount = -1;
    constructor(b: Battle, onEvent: (e: Event) => void = () => { }, fresh = false) { b.fields ??= []; b.physics ??= makePhysics(STAGES[b.stageId-1]?.physics); b.reviewDamage ??= {}; b.reviewLeft ??= 0; this.b = b; for(const u of b.units)migrateEnemySkills(u); this.onEvent = onEvent; this.applyPhysicsCues(); if (fresh) {
        this.refreshActivation();
        this.refreshIntents();
    } }
    get active() { return this.b.units.find(u => u.id === this.b.active); }
    get stage() { return STAGES[this.b.stageId - 1]; }
    emit(type: Event['type'], e: Partial<Event> = {}) { this.onEvent({ type, ...e }); }
    fx(name: string, x: number, y: number, color: string, size = 50, text?: string) { this.emit('fx', { name, x, y, color, size, text }); }
    message(text: string) { this.b.events.push(text); this.b.events = this.b.events.slice(-30); this.emit('message', { text }); }
    random() { let a = this.b.rng += 0x6D2B79F5; a = Math.imul(a ^ a >>> 15, 1 | a); a ^= a + Math.imul(a ^ a >>> 7, 61 | a); return ((a ^ a >>> 14) >>> 0) / 4294967296; }
    alive(side: Side) { return this.b.units.filter(u => u.side === side && !u.dead && u.hp > 0); }
    heroesAlive() { return this.alive(0).filter(u => !u.summoned); }
    creditUnit(u?:Unit){ return u?.summoned && u.summonOwner ? (this.unit(u.summonOwner) || u) : u; }
    unit(id: string) { return this.b.units.find(u => u.id === id); }
    canAct() { return this.b.phase === 'aim' && this.b.side === 0 && !!this.active && !this.active.dead && !this.active.summoned && !this.active.acted && !this.active.airborne; }
    select(id: string) { const u = this.unit(id); if (this.b.phase !== 'aim' || this.active?.retreat || !u || u.side !== 0 || u.summoned || u.dead || u.acted)
        return false; this.b.active = id; this.emit('change'); return true; }
    manaCost(s: Skill, u: Unit) { const rank=s.ultimate||s.basic?1:(u.ranks[s.id] || 1); const scale=u.side===0?MANA_COST_MULTIPLIER:1; return Math.max(0, Math.round(s.cost * skillManaFactor(rank) * scale)); }
    cooldownLeft(u:Unit,skillId:string){const raw=Math.max(0,(u.cooldowns?.[skillId]||0)-this.b.round),cap=SKILLS[skillId]?.cooldown;return cap?Math.min(cap,raw):raw;}
    effective(s: Skill, u: Unit) {
        let speed = s.speed, damage = s.damage * skillBalanceFactor(s) * u.attack * (1-(u.curseAttack||0)), radius = s.radius;
        if (u.side === 0) {
            const rank = s.basic?1:u.ranks[s.id] || 1, node = TALENT_MAP[s.id], h = this.b.heroes[u.cls];
            damage *= skillDamageFactor(rank);
            if (node)
                damage *= 1;
            radius *= skillRadiusFactor(rank);
            if (u.cls === 'mage' && !s.redesigned) {
                // Mage owns reach and area rather than precision: ~15% more ballistic range, wider AoE and +10% damage.
                speed *= 1.073;
                damage *= 1.10 * (.96 + u.tune * .20);
                radius *= 1.15 * (1.40 - u.tune * .25) * (1 + equippedRank(u,'MP02')*.10);
            }
            if (u.cls === 'archer') {
                speed *= 1.26 - u.tune * .14;
                if(!s.redesigned)damage *= 1.12 + u.tune * .12;
            }
            if (u.cls === 'knight' && BODY.has(s.mode))
                damage *= .9 + u.tune * .2;
            if (u.cls === 'occultist') {
                if (GHOST.has(s.mode)) damage *= 1 + equippedRank(u,'OP01')*.055;
                if (CURSES.has(s.mode)) radius *= 1 + equippedRank(u,'OP02')*.035;
            }
        }
        if(s.redesigned&&s.capstone)damage*=1+.03*specialty(u,s);
        if (u.bound > 0 && BODY.has(s.mode))
            speed *= .72;
        return { speed, damage, radius };
    }
    award(u: Unit, amount: number) {
        if((this.b as any).honroGrowth){(globalThis as any).HonroProgression.awardCombat(this,u,amount);return;}
        if (this.b.mode !== 'campaign' || u.side !== 0 || amount <= 0)
            return;
        const h = this.b.heroes[u.cls], result = grantXP(h, amount);
        if (!result.actual)
            return;
        this.emit('xp', { cls: u.cls, value: result.actual });
        if (result.after > result.before) {
            applyHero(u, h);
            this.fx('rune', u.x, u.y - u.h * .5, '#eed49c', 110);
            this.fx('text', u.x, u.y - u.h - 35, '#f4d797', 22, `LEVEL ${result.after}`);
            this.emit('sound', { name: 'heal' });
            this.emit('level', { cls: u.cls, value: result.after });
        }
    }
    rewardKill(u: Unit, killer?: Unit) {
        if((this.b as any).honroGrowth){(globalThis as any).HonroProgression.defeat(this,u,killer);return;}
        if (u.killRewarded || u.side !== 1 || this.b.mode !== 'campaign')
            return;
        u.killRewarded = true;
        const entries = Object.entries(u.damageBy).filter(([id, d]) => d > 0 && this.unit(id)?.side === 0);
        if (!entries.length && killer?.side === 0)
            entries.push([killer.id, 1]);
        const bonus = 60 + u.level * 14 + (u.boss ? 260 + u.level * 25 : 0), total = entries.reduce((sum, [, d]) => sum + d, 0);
        for (const [id, d] of entries) {
            const p = this.unit(id)!;
            const share = killer?.side === 0 ? (p.id === killer.id ? .70 : 0) + .30 * d / total : d / total;
            this.award(p, bonus * share);
        }
        if (killer?.side === 0)
            this.b.heroes[killer.cls].kills++;
    }
    refreshActivation() {
        const allies = (this.b as any).honroStage?this.b.units.filter(v=>!v.dead&&(v.side===0||(v as any).honroAlly)):this.alive(0);
        const wake = new Set<number>();
        for (const e of this.alive(1))
            if (allies.some(p => Math.hypot(p.x - e.x, (p.y - e.y) * .72) < 1600) || e.aggroUntil >= this.b.round)
                wake.add(e.group);
        for (const e of this.alive(1))
            if (wake.has(e.group)) {
                e.awake = true;
            }
    }
    combatEnemies() { const allies = (this.b as any).honroStage?this.b.units.filter(v=>!v.dead&&(v.side===0||(v as any).honroAlly)):this.alive(0); return this.alive(1).filter(e => e.awake && (allies.some(p => Math.hypot(p.x - e.x, (p.y - e.y) * .7) < 2300) || e.aggroUntil >= this.b.round)); }
    setMoveTarget(x: number) { if (!this.canAct())
        return false; const u = this.active!; u.moveTarget = clamp(x, 30, this.b.width - 30); return true; }
    cancelMovement() { for (const u of this.b.units)
        delete u.moveTarget; }
    campCheck() {
        if (this.b.mode !== 'campaign')
            return;
        for (const d of this.b.decor) {
            if (d.kind !== 'torch' || d.variant < 100)
                continue;
            const g = d.variant - 100, id = `camp:${g}`;
            if (this.b.awardIds.includes(id) || this.alive(1).some(u => u.group === g) || !this.alive(0).some(u => Math.hypot(u.x-d.x,u.y-d.y) < 230))
                continue;
            this.b.awardIds.push(id);
            for (const u of this.heroesAlive()) {
                u.hp = Math.min(u.maxHp, u.hp + Math.round(u.maxHp * .30));
                u.focus = Math.min(u.maxFocus, u.focus + Math.round(u.maxFocus * .45));
                this.fx('ring', u.x, u.y - u.h * .5, '#a9d9ae', 70);
                this.award(u, 24 + recommendedLevel(this.b.stageId) * 3);
            }
            this.message('야영지 확보');
            this.emit('sound', { name: 'heal' });
            this.emit('save');
        }
    }
    /** Player hold time is wall time: 480 world units/s of launch speed per second.
     * Preserve authored full-power reach, with a 5-second ceiling for future skills.
     * NPC/AI powers retain their established ballistic calibration. */
    chargeDuration(u: Unit, s: Skill) { return Math.min(MAX_CHARGE_SECONDS, 805 * this.effective(s, u).speed / CHARGE_ACCELERATION); }
    chargePower(u: Unit, s: Skill, seconds: number) { return clamp(seconds / Math.max(.001, this.chargeDuration(u, s)), 0, 1); }
    velocity(u: Unit, s: Skill, angle: number, power: number) { const v = u.side===0&&!u.summoned ? CHARGE_ACCELERATION * this.chargeDuration(u,s) * clamp(power,0,1) : (270 + 535 * clamp(power,.08,1)) * this.effective(s,u).speed; return { vx: Math.cos(rad(angle)) * v, vy: -Math.sin(rad(angle)) * v }; }
    origin(u: Unit, angle: number, body = false) { const reach = body ? 6 : u.cls === 'mage' ? 44 : u.cls === 'archer' ? 42 : u.cls === 'occultist' ? 40 : 28; return { x: u.x + Math.cos(rad(angle)) * reach, y: u.y - u.h * .63 - Math.sin(rad(angle)) * (body ? 8 : reach) }; }
    /** Data-only environmental patch; renderer cache and all future substeps see it immediately. */
    setEnvironment(patch:PhysicsPatch){if(!validPhysicsPatch(patch))throw new Error('Invalid physics patch');this.b.physics??=makePhysics();changePhysics(this.b.physics,patch);this.emit('change');}
    triggerPhysicsEvent(event:string){this.applyPhysicsCues(event);}
    private applyPhysicsCues(event?:string){const env=this.b.physics??(this.b.physics=makePhysics());for(const c of duePhysics(env,this.b.round,event)){this.setEnvironment(c.patch);env.applied.push(c.id);this.message(`환경 변화 · ${c.id}`);}}
    private forceSample(p:{x:number;y:number;wind:number;gravityScale?:number;drag?:number;skill?:string;mode?:string}){
        const env=environmentAt(this.b.physics??(this.b.physics=makePhysics()),p.x,p.y),q=p.gravityScale??1;
        let gx=env.gravity.x*q+this.b.wind*p.wind*2.6,gy=env.gravity.y*q;
        for(const d of this.b.drafts)if(p.x>d.x&&p.x<d.x+d.w&&p.y>d.y&&p.y<d.y+d.h&&(!d.device||this.b.terrain.some(t=>t.id===d.device&&!t.broken)))gy-=d.force;
        for(const f of this.b.fields){if(f.kind==='storm')continue;const dx=f.x-p.x,dy=f.y-p.y,d=Math.hypot(dx,dy);if(d>=f.radius||d<1)continue;const a=(f.kind==='repulsor'?-1:1)*f.strength*Math.sin(Math.PI*d/f.radius);gx+=dx/d*a;gy+=dy/d*a;}
        const skill=p.skill?SKILLS[p.skill]:undefined,k=(p.drag??(skill?dragFor(skill,p.mode):0))*env.dragScale;
        // Linear drag acts relative to local air flow; wind acceleration keeps the established aiming convention.
        return {x:gx+k*env.flow.x,y:gy+k*env.flow.y,k};
    }
    acceleration(p:{x:number;y:number;wind:number;gravityScale?:number;vx?:number;vy?:number;drag?:number;skill?:string;mode?:string}){const a=this.forceSample(p);return{x:a.x-a.k*(p.vx||0),y:a.y-a.k*(p.vy||0)};}
    advanceProjectile(p:{x:number;y:number;wind:number;vx:number;vy:number;gravityScale?:number;drag?:number;skill?:string;mode?:string},dt:number){const a=this.forceSample(p);return advanceLinear(p.x,p.y,p.vx,p.vy,a.x,a.y,a.k,dt);}
    // Uniform broad phase: a large field need not scan every distant ground piece for each flight substep.
    collisionTerrain(a: Vec, c: Vec, r: number) {
        if (this.indexedVersion !== this.b.sceneVersion || this.indexedCount !== this.b.terrain.length) {
            this.terrainBins.clear();
            this.terrainOrder.clear();
            this.b.terrain.forEach((t, i) => { this.terrainOrder.set(t, i); if (t.broken)
                return; for (let k = Math.floor(t.x / 320); k <= Math.floor((t.x + t.w) / 320); k++) {
                const bin = this.terrainBins.get(k);
                if (bin)
                    bin.push(t);
                else
                    this.terrainBins.set(k, [t]);
            } });
            this.indexedVersion = this.b.sceneVersion;
            this.indexedCount = this.b.terrain.length;
        }
        const lo = Math.floor((Math.min(a.x, c.x) - r) / 320), hi = Math.floor((Math.max(a.x, c.x) + r) / 320);
        if (lo === hi)
            return this.terrainBins.get(lo) || [];
        const found = new Set<Terrain>();
        for (let k = lo; k <= hi; k++)
            for (const t of this.terrainBins.get(k) || [])
                found.add(t);
        return [...found].sort((a, b) => this.terrainOrder.get(a)! - this.terrainOrder.get(b)!);
    }
    collision(a: Vec, c: Vec, r: number, owner: string, hit: string[] = [], units = true, skip: string[] = [], terrain = true): Collision | null {
        let best: Collision | null = null;
        if(terrain) for (const t of this.collisionTerrain(a, c, r)) {
            if (t.broken || skip.includes(t.id) || t.x > Math.max(a.x, c.x) + r || t.x + t.w < Math.min(a.x, c.x) - r || Math.min(t.y, t.y + (t.slope || 0)) > Math.max(a.y, c.y) + r || t.y + t.h < Math.min(a.y, c.y) - r)
                continue;
            const h = segmentTerrain(a, c, t, r);
            if (h && (!best || h.t < best.t))
                best = { x: a.x + (c.x - a.x) * h.t, y: a.y + (c.y - a.y) * h.t, t: h.t, n: h.n, terrain: t };
        }
        if (units)
            for (const u of this.b.units) {
                if (u.dead || u.id === owner || hit.includes(u.id))
                    continue;
                const h = segRect(a, c, u.x - u.r, u.y - u.h, u.r * 2, u.h, r);
                if (h && (!best || h.t < best.t))
                    best = { x: a.x + (c.x - a.x) * h.t, y: a.y + (c.y - a.y) * h.t, t: h.t, n: h.n, unit: u };
            }
        return best;
    }
    predict(u: Unit, skill: Skill, angle: number, power: number, target?: Unit, collect = true, ignoreUnits = false): Prediction {
        const custom=redesignPrediction(this,u,skill,angle,power);if(custom)return custom;
        const body = BODY.has(skill.mode), origin = this.origin(u, angle, body), v = this.velocity(u, skill, angle, power);
        let x = origin.x, y = origin.y, vx = v.vx, vy = v.vy, apex = false, bounce = 0, pierce = 0, meteor = false, closest = 99999;
        const points: Vec[] = [], ignored: string[] = [], skips: string[] = [];
        let ap: Vec | undefined;
        const dt = collect ? STEP : 1 / 80, r = body ? u.r : ARROWS.has(skill.mode) ? 3 : 6;
        for (let i = 0; i < Math.ceil((skill.mode.startsWith('honro')?6:12.2) / dt); i++) {
            if(skill.mode==='homing'&&i*dt>.12){const v=this.steer(x,y,vx,vy,u,dt,ignored);vx=v.vx;vy=v.vy;}
            const ghostRank=u.cls==='occultist'?equippedRank(u,'OP01'):0;
            const gravity=(skill.gravity??1)*(GHOST.has(skill.mode)?Math.max(.12,1-ghostRank*.08):1);
            const motion = this.advanceProjectile({ x, y, vx,vy,wind: meteor ? 0 : skill.wind, gravityScale:gravity,drag:dragFor(skill,meteor?'meteor':skill.mode),skill:skill.id,mode:skill.mode },dt);
            const prev=vy;vx=motion.vx;vy=motion.vy;
            if (!apex && prev < 0 && vy >= 0) {
                apex = true;
                ap = { x, y };
                if (skill.mode === 'slam') {
                    vx = 0;
                    vy = 600;
                }
                if (skill.mode === 'return') {
                    vx = -vx * .32;
                    vy = 80;
                }
                if (skill.mode === 'cluster' || skill.mode === 'rain' || skill.mode==='seekRain') {
                    vx *= .22;
                    vy = 100;
                }
            }
            const nx = motion.x, ny = motion.y;
            if (target)
                closest = Math.min(closest, Math.hypot(nx - target.x, ny - (target.y - target.h * .5)));
            const phase=skill.phase;
            const h = phase==='all' ? null : this.collision({ x, y }, { x: nx, y: ny }, meteor ? 22 : r, u.id, ignored, !ignoreUnits&&skill.mode!=='charge'&&skill.mode!=='spin', skips, phase!=='terrain');
            const fuse=(skill.fuse??0)*(skill.mode==='phaseWraith'?(.55+power*1.05):1);
            if(fuse>0&&i*dt>=fuse){ if(collect)points.push({x:nx,y:ny}); return {points,x:nx,y:ny,closest,apex:ap}; }
            if(skill.mode==='reverseGhost'&&ny<-420){if(collect)points.push({x:nx,y:ny});return {points,x:nx,y:ny,closest,apex:ap};}
            if (h) {
                if ((skill.mode === 'bounce' || skill.mode === 'ricochet' || skill.mode === 'shieldthrow') && h.terrain && bounce === 0) {
                    const dot = vx * h.n.x + vy * h.n.y;
                    vx = (vx - 2 * dot * h.n.x) * .84;
                    vy = (vy - 2 * dot * h.n.y) * .84;
                    x = h.x + h.n.x * 3;
                    y = h.y + h.n.y * 3;
                    bounce++;
                    if (collect)
                        points.push({ x, y });
                    continue;
                }
                if (skill.mode === 'pierce' && pierce === 0 && (h.unit || h.terrain?.mat === 'wood')) {
                    pierce++;
                    if (h.unit)
                        ignored.push(h.unit.id);
                    if (h.terrain)
                        skips.push(h.terrain.id);
                    x = nx;
                    y = ny;
                    continue;
                }
                if (skill.mode === 'marker' && !meteor) {
                    meteor = true;
                    x = h.x;
                    y = Math.min(-170, h.y - 600);
                    vx = 0;
                    vy = 620;
                    if (collect)
                        points.push({ x: h.x, y: h.y });
                    continue;
                }
                if (collect)
                    points.push({ x: h.x, y: h.y });
                return { points, x: h.x, y: h.y, unit: h.unit?.id, terrain: h.terrain?.id, closest, apex: ap };
            }
            x = nx;
            y = ny;
            if (collect && i % 3 === 0)
                points.push({ x, y });
            if (y > this.b.height + 180 || x < -280 || x > this.b.width + 280 || y < -1700)
                break;
        }
        return { points, x, y, closest, apex: ap };
    }
    bestShot(u: Unit, s: Skill, target: Unit, allowAllyTarget=false): {
        angle: number;
        power: number;
        score: number;
    } {
        const right = target.x > u.x, blast = this.effective(s, u).radius;
        let best = { angle: right ? 45 : 135, power: .62, score: -1e9 };
        const score = (a: number, p: number) => {
            const hit = this.predict(u, s, a, p, target, false);
            const d = Math.hypot(hit.x - target.x, hit.y - (target.y - target.h * .52));
            let sc = -(Math.min(d, hit.closest + 140));
            if (hit.unit === target.id)
                sc = 200;
            if (blast > 0 && d < blast)
                sc = 160 + (1 - d / blast) * 70;
            const value=shotImpactValue(this,u,s,hit,allowAllyTarget?target.id:undefined);
            sc+=value.net*2;
            if(value.enemyDamage>0&&value.net>2)sc+=150;
            else if(value.friendlyDamage>0)sc-=250;
            if (BODY.has(s.mode) && hit.y > this.b.height + 20)
                sc -= 500;
            return sc;
        };
        for (let elev = target.y > u.y+90 ? -65 : 10; elev <= 86; elev += 8)
            for (let p = .20; p <= 1.001; p += .085) {
                const a = right ? elev : 180 - elev, sc = score(a, p);
                if (sc > best.score)
                    best = { angle: a, power: p, score: sc };
            }
        const initial = { ...best };
        for (let da = -6; da <= 6; da += 3)
            for (let dp = -.07; dp <= .07; dp += .035) {
                const a = clamp(initial.angle + da, AIM_MIN, AIM_MAX), p = clamp(initial.power + dp, .1, 1), sc = score(a, p);
                if (sc > best.score)
                    best = { angle: a, power: p, score: sc };
            }
        return best;
    }
    fire(skillId: string, angle: number, power: number, ai = false): boolean {
        const b = this.b, u = this.active, s = SKILLS[skillId];
        if (!u || u.dead || u.retreat || !s || s.enemyOnly&&u.side===0&&!ai || s.passive || (!ai && (!this.canAct() || !this.grounded(u))) || !u.loadout.includes(skillId) || (s.ultimate && u.side===0 && this.b.mode!=='practice' && !ultimateUnlocked(this.b.heroes[u.cls],u.cls)) || this.cooldownLeft(u,skillId)>0 || u.focus < this.manaCost(s, u))
            return false;
        delete u.moveTarget;
        u.moving = 0;
        const e = this.effective(s, u);
        u.focus -= this.manaCost(s, u);
        u.cooldowns ??= {}; if(s.cooldown)u.cooldowns[skillId]=b.round+s.cooldown+1;
        u.angle = clamp(angle, AIM_MIN, AIM_MAX);
        u.lastPower = clamp(power, u.side===0&&!u.summoned?0:.08, 1);
        u.facing = Math.cos(rad(angle)) >= 0 ? 1 : -1;
        u.anim = 1;
        b.phase = 'flight';
        b.turnAge = 0;
        b.resolveAge = 0;
        b.shot++;
        b.shotDamage = {}; b.reviewDamage={}; b.reviewFocus=undefined;
        b.shots += u.side === 0 ? 1 : 0;
        const origin = this.origin(u, u.angle, BODY.has(s.mode));
        const make = (a: number, damage = e.damage, child = false) => { const origin=this.origin(u,a,BODY.has(s.mode)),v = this.velocity(u, s, a, u.lastPower); const p: Projectile = { id: b.nextId++, skill: skillId, owner: u.id, side: u.side, x: origin.x, y: origin.y, vx: v.vx, vy: v.vy, prevVy: v.vy, age: 0, radius: BODY.has(s.mode) ? u.r : ARROWS.has(s.mode) ? 3 : s.mode === 'shieldthrow' ? 9 : 6, damage, blast: e.radius, wind: s.wind, mode: s.mode, color: s.color, bounces: 0, pierces: 0, apex: false, hit: [], phase: 0, body: BODY.has(s.mode), returnX: u.x, returnY: u.y, trail: [origin], child, rolled: 0, shot: b.shot, emissions: 0, fieldHits: [], amplification: 1, launchX:origin.x,launchY:origin.y, repeatIndex:0,carry:[], skillRank:s.ultimate?1:(u.ranks[s.id]||1),drag:dragFor(s), gravityScale:(s.gravity??1)*(GHOST.has(s.mode)?Math.max(.12,1-equippedRank(u,'OP01')*.08):1), phaseMode:s.phase, fuseAt:s.fuse? s.fuse*(s.mode==='phaseWraith'?(.55+u.lastPower*1.05):1):undefined }; b.projectiles.push(p); return p; };
        if (s.mode === 'triple') {
            const plan=multishotProfile(s,u.ranks[s.id]||1)!;
            for(const angle of volleyAngles(s,plan.rank,u.angle))make(angle,e.damage*plan.damageScale);
        }
        else if(s.mode==='twinCrescent'){const a=make(u.angle-4,e.damage,true),c=make(u.angle+4,e.damage,true);a.mode=c.mode='crescent';}
        else
            make(u.angle);
        initRedesignCast(this,s,u);
        const rank=passiveRank(u,'AP01');
        if(rank>0 && ARROWS.has(s.mode)){const roots=b.projectiles.filter(p=>p.owner===u.id&&p.shot===b.shot);b.volley={template:JSON.parse(JSON.stringify(roots[s.mode==='triple'?Math.floor(roots.length/2):0])),remaining:volleyCount(rank)-1,elapsed:0,interval:VOLLEY_INTERVAL,index:0,angle:u.angle,power:u.lastPower};}
        if(!s.redesigned&&equippedRank(u,'MP04')){u.shield+=Math.round(u.maxHp*.05*equippedRank(u,'MP04'));u.shieldUntil=b.teamEnds[1]+1;this.fx('ring',u.x,u.y-u.h*.5,'#9acce6',55);}
        if (BODY.has(s.mode)) {
            u.airborne = true;
            u.vx = u.vy = 0;
        }
        b.lastShots[u.id] = { angle: u.angle, power: u.lastPower, wind: b.wind, skill: skillId, path: [] };
        this.fx(s.redesigned?'spark':'rune', origin.x, origin.y, s.color, s.redesigned?10:30);
        this.emit('sound', { name: s.mode === 'marker' ? 'charge' : u.cls === 'archer' ? 'arrow' : u.cls === 'knight' ? 'sword' : u.cls === 'occultist' ? 'charge' : 'fire' });
        this.message(`${u.name} · ${s.name}`);
        this.emit('change');
        this.emit('save');
        return true;
    }
    /** Movement is a locomotion state; jumping is not a weapon flight. */
    grounded(u: Unit) { return !u.jumping && !u.airborne && Math.abs(u.vx) < 3 && Math.abs(u.vy) < 2 && !!this.surface(u.x, u.y - 4, u.y + 5); }
    jumpCost(u:Unit){return Math.max(15,75-equippedRank(u,'SP04')*15);}
    jump(u = this.active) { if (!u || u.dead || u.fixed || u.airborne || u.moveLeft < this.jumpCost(u) || !this.grounded(u))
        return false; delete u.moveTarget; u.jumping = true; u.vy = -660*(1+equippedRank(u,'SP04')*.035); u.moveLeft = Math.max(0, u.moveLeft - this.jumpCost(u)); u.landing = 0; this.fx('spark', u.x, u.y, '#d7d0b8', 20); this.emit('sound', { name: 'jump' }); return true; }
    walk(u:Unit,direction:number,dt:number){return walkTerrain(this,u,direction,dt*(1-(u.slowed?.factor||0)));}
    turnArrow(point?:Vec){return turnArrow(this,point);}
    useGate(){return useGate(this);}
    gateCandidate(){return gateCandidate(this);}
    move(direction: number, dt: number) { if (!this.canAct())
        return; const u = this.active!; delete u.moveTarget; this.walk(u, direction, dt); this.refreshActivation(); this.campCheck(); }
    kineticMultiplier(p: Pick<Projectile, 'vx' | 'vy' | 'body'>, u: Unit) { const speed = Math.hypot(p.vx, p.vy); if (u.cls === 'archer')
        return clamp((.70+.60*Math.pow(speed/780,1.35))*(1+.06*equippedRank(u,'AP04')),.70,1.90*(1+.06*equippedRank(u,'AP04'))); if (u.cls === 'knight' && p.body)
        return clamp(.76 + .62 * Math.pow(speed / 720, 1.25), .80, 1.95); return 1; }
    stun(u: Unit) { if (u.dead || u.side === 2)
        return; if (u.boss) {
        u.breaks = Math.max(u.breaks, 1);
        this.fx('text', u.x, u.y - u.h - 10, '#eedcba', 14, '강인함 · 방호 약화');
        return;
    } if ((u.stunUntil || 0) > this.b.round)
        return; u.stun = 1; u.stunUntil = this.b.round + 3; this.fx('rune', u.x, u.y - u.h - 6, '#f1d394', 25); }
    passFields(p: Projectile, a: Vec, b: Vec) { p.fieldHits ??= []; for (const f of this.b.fields) {
        if (f.kind !== 'storm' || p.fieldHits.includes(f.id))
            continue;
        const dx = b.x - a.x, dy = b.y - a.y, t = clamp(((f.x - a.x) * dx + (f.y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
        if (Math.hypot(a.x + dx * t - f.x, a.y + dy * t - f.y) > f.radius)
            continue;
        p.fieldHits.push(f.id);
        const old = p.amplification || 1, next = Math.min(1.9, old * 1.30);
        p.damage *= next / old;
        p.amplification = next;
        this.fx('rune', p.x, p.y, '#e2d1ff', 32);
        this.fx('text', p.x, p.y - 24, '#dacbff', 13, '증폭');
    } }
    emitSubProjectiles(p: Projectile) {
        if(p.child||!['emberOrb','frostOrb','stormOrb'].includes(p.mode))return;
        const skill=SKILLS[p.skill],rank=p.skillRank||this.unit(p.owner)?.ranks[p.skill]||1,profile=multishotProfile(skill,rank)!;
        const interval=p.mode==='frostOrb'?.34:.40,desired=Math.min(8,Math.floor((p.age-.18)/interval)+1);
        if(desired<1||(p.emissions||0)>=desired||this.b.projectiles.length>=220)return;
        const wave=p.emissions||0;p.emissions=wave+1;const count=waveCount(skill,rank,wave);
        const spawn=(vx:number,vy:number,mode:string,factor:number,blast:number)=>{
            const child:Projectile={...p,id:this.b.nextId++,mode,vx,vy,prevVy:vy,damage:p.damage*factor*profile.damageScale,blast,radius:mode==='stormBolt'?5:4,age:0,child:true,body:false,apex:true,emissions:99,fieldHits:[...(p.fieldHits||[])],hit:[],trail:[{x:p.x,y:p.y}],bounces:0,pierces:0,drag:dragFor(skill,mode),gravityScale:mode==='stormBolt'?0:1};this.b.projectiles.push(child);
        };
        if(p.mode==='emberOrb')for(let i=0;i<count;i++){const f=count<=1?0:(i/(count-1)-.5)*2;spawn(p.vx*.27+f*150*Math.sqrt(count/2),100+(i%2)*25,'blast',.36,45);}
        if(p.mode==='frostOrb')for(let i=0;i<count;i++){const a=wave*.64+i*2*Math.PI/count;spawn(Math.cos(a)*305+p.vx*.16,Math.sin(a)*305,'iceShard',.28,13);}
        if(p.mode==='stormOrb'){for(let i=0;i<count;i++){const x=(i-(count-1)/2)*150;spawn(x,1470,'stormBolt',.42,24);}this.fx('ring',p.x,p.y,'#d2c4ff',25);}
    }
    private splitRain(p:Projectile){
        if(newSkill(p)&&p.skill==='A15'){splitSeven(this,p);return;}
        const s=SKILLS[p.skill],plan=multishotProfile(s,p.skillRank||this.unit(p.owner)?.ranks[p.skill]||1);if(!plan)return;
        this.fx('burst',p.x,p.y,p.color,70);this.fx('ring',p.x,p.y,p.color,65);this.emit('sound',{name:'split'});
        for(let i=0;i<plan.count;i++){
            const f=plan.count<=1?0:2*i/(plan.count-1)-1,scale=Math.sqrt(plan.count/plan.base),seeking=p.mode==='seekRain',rain=p.mode==='rain',vx=(rain?69:seeking?155:195)*f*scale+p.vx*(rain?.18:.2),vy=seeking?250:rain?175:60+Math.abs(f)*60,mode=seeking?'seekChild':rain?'arrow':'blast';
            const c:Projectile={...p,id:this.b.nextId++,mode,vx,vy,prevVy:vy,damage:p.damage*plan.damageScale,radius:rain||seeking?3:5,blast:rain||seeking?0:p.blast,age:0,apex:true,body:false,child:true,hit:[],trail:[],phase:0,fieldHits:[...(p.fieldHits||[])],drag:dragFor(s,mode),gravityScale:1};this.b.projectiles.push(c);
        }
        this.remove(p);
    }
    /** One cast, several scheduled releases. No recursive passive triggering or extra MP cost. */
    stepVolley(dt:number){const b=this.b,v=b.volley;if(!v)return;const u=this.unit(v.template.owner);if(!u||u.dead){b.volley=undefined;return;}
      v.elapsed+=dt;
      while(v.remaining>0&&v.elapsed+1e-8>=v.interval){v.elapsed-=v.interval;v.remaining--;v.index++;
        const sk=SKILLS[v.template.skill],a=clamp(v.angle+(this.random()*2-1)*VOLLEY_SPREAD,AIM_MIN,AIM_MAX),angles=volleyAngles(sk,v.template.skillRank||u.ranks[sk.id]||1,a);
        for(const angle of angles){const o=this.origin(u,angle),vel=this.velocity(u,sk,angle,v.power);const p:Projectile={...JSON.parse(JSON.stringify(v.template)),id:b.nextId++,x:o.x,y:o.y,...vel,prevVy:vel.vy,age:0,apex:false,hit:[],trail:[o],phase:0,bounces:0,pierces:0,emissions:0,rolled:0,fieldHits:[],amplification:1,damage:v.template.damage*volleyDamage(passiveRank(u,'AP01'),v.index),followup:true,repeatIndex:v.index,launchX:o.x,launchY:o.y,carry:[]};b.projectiles.push(p);}
        u.anim=.6;this.fx('ring',u.x,u.y-u.h*.6,sk.color,20);this.emit('sound',{name:'arrow'});
      }
      if(v.remaining<=0)b.volley=undefined;
    }
    /** Bounded angular steering, with a solid-terrain sight check and no target teleportation. */
    steer(x:number,y:number,vx:number,vy:number,owner:Unit,dt:number,hit:string[]=[],child=false){
      const range=(child?360:300)+(owner.side===0?Math.max(0,(owner.ranks[child?'A15':'A13']||1)-1)*20:0);let target:Unit|undefined,best=range;
      for(const u of this.b.units){if(u.dead||u.side===owner.side||u.side===2||hit.includes(u.id))continue;
        const d=Math.hypot(u.x-x,u.y-u.h*.5-y);if(d>=best)continue;
        const blocked=this.collision({x,y},{x:u.x,y:u.y-u.h*.5},1,owner.id,[],false);if(blocked)continue;best=d;target=u;
      }
      if(!target)return {vx,vy};const turn=1.75+(owner.side===0?Math.max(0,(owner.ranks[child?'A15':'A13']||1)-1)*.05:0),a=Math.atan2(vy,vx),desired=Math.atan2(target.y-target.h*.5-y,target.x-x),delta=Math.atan2(Math.sin(desired-a),Math.cos(desired-a)),angle=a+clamp(delta,-turn*dt,turn*dt),speed=Math.hypot(vx,vy);return {vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed};
    }
    carrySweep(p:Projectile,a:Vec,end:Vec){const owner=this.unit(p.owner);if(!owner)return; p.carry??=[];
      for(const u of this.b.units){if(u.dead||u.side===owner.side||u.side===2||u.fixed||p.hit.includes(u.id)||u.carriedBy!==undefined)continue;
        const contact=segRect(a,end,u.x-u.r,u.y-u.h,u.r*2,u.h,p.radius+5);if(!contact)continue;
        p.hit.push(u.id);this.hurt(u,p.damage,p.owner,true,p,{x:u.x,y:u.y-u.h*.5});this.fx('slash',u.x,u.y-u.h*.5,p.color,70);
        if(!u.dead){u.carriedBy=p.id;u.vx=u.vy=0;u.jumping=false;delete u.moveTarget;p.carry.push(u.id);}
      }
    }
    moveCarried(p:Projectile){const speed=Math.max(1,Math.hypot(p.vx,p.vy)),dx=p.vx/speed,dy=p.vy/speed;
      for(const id of [...(p.carry||[])]){const u=this.unit(id);if(!u||u.dead){if(u)delete u.carriedBy;p.carry=p.carry!.filter(x=>x!==id);continue;}
        const ahead=24+u.r,tx=p.x+dx*ahead,ty=p.y+u.h*.5+dy*ahead;
        const h=this.collision({x:u.x,y:u.y-u.h*.5},{x:tx,y:ty-u.h*.5},Math.min(u.r,14),u.id,[],false);
        if(h){delete u.carriedBy;p.carry=p.carry!.filter(x=>x!==id);this.impulse(u,dx*120,-65);continue;}
        u.x=tx;u.y=ty;u.vx=u.vy=0;u.hurt=Math.max(u.hurt,.12);
      }
    }
    releaseCarried(p:Projectile){for(const id of p.carry||[]){const u=this.unit(id);if(!u)continue;delete u.carriedBy;if(!u.dead){u.jumping=false;this.impulse(u,clamp(p.vx*.28,-240,240),-90);}}p.carry=[];}
    surface(x:number,min=-1500,max=this.b.height+200){return terrainSurface(this.b.terrain,x,min,max);}
    item(kind: string) {
        if(this.active?.retreat)return false;
        if (!this.canAct() || !this.b.items[kind])
            return false;
        const u = this.active!;
        if (kind === 'heal' && u.hp === u.maxHp) {
            this.message('이미 체력이 가득하다.');
            return false;
        }
        if (kind === 'focus' && u.focus >= u.maxFocus) {
            this.message('이미 집중력이 가득하다.');
            return false;
        }
        this.b.items[kind]--;
        if (kind === 'heal')
            u.hp = Math.min(u.maxHp, u.hp + Math.round(u.maxHp * .45));
        if (kind === 'focus')
            u.focus = Math.min(u.maxFocus, u.focus + Math.round(u.maxFocus * .60));
        if (kind === 'cleanse') {
            u.bound = u.breaks = u.mark = 0;
            u.hp = Math.min(u.maxHp, u.hp + 22);
        }
        if (kind === 'ward') {
            u.shield += Math.round(u.maxHp * .2);
            u.shieldUntil = this.b.teamEnds[1 - u.side] + 1;
        }
        this.fx('ring', u.x, u.y - u.h * .5, '#a9e3c2', 65);
        this.emit('sound', { name: 'heal' });
        this.message(`${u.name} · ${kind === 'heal' ? '회복약' : kind === 'focus' ? '마나 물약' : kind === 'ward' ? '방호 부적' : '정화약'} 사용`);
        this.finishAction();
        return true;
    }
    wait() { if (!this.canAct())
        return; const u = this.active!; if(u.retreat){this.finishAction(true);return;} u.shield = Math.max(u.shield, Math.round(u.maxHp * .12)); u.shieldUntil = this.b.teamEnds[1] + 1; u.focus = Math.min(u.maxFocus, u.focus + u.regen); if (!this.combatEnemies().length)
        u.hp = Math.min(u.maxHp, u.hp + Math.round(u.maxHp * .12)); this.message(`${u.name} · 방어하며 대기`); this.finishAction(); }
    hurt(u: Unit, amount: number, owner: string, direct = false, p?: Projectile, source?: Vec) {
        if (u.dead || amount <= 0)
            return;
        const rawSrc = this.unit(owner), src = this.creditUnit(rawSrc);
        let dmg = amount;
        if(src?.side===0 && src.cls==='occultist' && (u.curseTurns||0)>0) dmg*=1+equippedRank(src,'OP05')*.07;
        if(src?.side===0 && direct && src.cls==='archer' && !p?.skill.startsWith('A'))dmg*=1+.04*equippedRank(src,'AP02');
        if(src?.side===0 && p?.child && src.cls==='mage' && !newSkill(p))dmg*=1+.12*equippedRank(src,'MP05');
        if (p && !newSkill(p) && src && src.side === 0 && direct && (src.cls === 'archer' || p.body && src.cls === 'knight'))
            dmg *= this.kineticMultiplier(p, src);
        if(src?.side===0 && src.cls==='knight' && direct){
            const originX=p?.launchX??src.x, originY=p?.launchY??src.y, travel=source?Math.hypot(source.x-originX,source.y-originY):9999;
            // Melee identity: close engagements reward the knight without turning long-range crescents into nukes.
            if(travel<280)dmg*=1.42; else if(travel<560)dmg*=1.18;
        }
        if (src?.side === 1 && src.combatBaseAttack===undefined)
            dmg *= this.b.difficulty === 'explorer' ? .48 : this.b.difficulty === 'story' ? .60 : this.b.difficulty === 'normal' ? .82 : this.b.difficulty === 'veteran' ? .98 : 1.08;
        if (src?.side === 1 && src.combatBaseAttack===undefined && this.b.mode === 'campaign' && this.b.stageId === 1)
            dmg *= .85;
        if(p&&src&&newSkill(p))dmg=redrawDamage(this,p,src,u,dmg,source||p,direct);
        if(u.arrivalGuard!==undefined)dmg*=.90;
        let armor = Math.max(0,u.armor-(u.curseArmor||0));
        if (u.role === 'guard' && source)
            armor = (source.x - u.x) * u.facing > 0 ? .40 : .05;
        if (u.boss && u.boss !== 5)
            armor = (this.b.round % 2 === 0 ? .06 : .29);
        if (u.side === 1 && this.b.terrain.some(t => !t.broken && t.device === 'ward'))
            armor = Math.max(armor, .32);
        if (u.breaks > 0) {
            armor *= .15;
            u.breaks--;
        }
        if (direct && u.mark > 0 && src && u.markSide === src.side) {
            dmg *= 1.5;
            u.mark = 0;
            this.fx('rune', u.x, u.y - u.h * .5, '#fff0b5', 55);
        }
        if (direct && source && u.boss && Math.abs(source.y - (u.y - u.h * .53)) < u.h * .17) {
            dmg *= 1.22;
            this.fx('text', u.x, u.y - u.h - 20, '#f4d39c', 15, '핵심 적중');
        }
        dmg *= 1 - clamp(armor, 0, .7);
        if (p?.child && !newSkill(p)) {
            const key = p.shot + ':' + (p.repeatIndex||0) + ':' + u.id;
            const legacyId=SKILLS[p.skill]?.legacyId||p.skill;
            const used = this.b.shotDamage[key] || 0, cap = (['M13', 'M14', 'M15'].includes(legacyId) ? 160 : legacyId === 'M06' ? 78 : legacyId === 'A11' ? 90 : 75) * (p.amplification || 1) * (src?.attack || 1) * (1 + Math.max(0, ((src?.ranks[p.skill] || 1) - 1)) * .16);
            dmg = Math.min(dmg, cap - used);
            this.b.shotDamage[key] = used + Math.max(0, dmg);
        }
        if (dmg <= 0)
            return;
        dmg = Math.max(1, Math.round(dmg));
        const absorbed = Math.min(u.shield, dmg);
        u.shield -= absorbed;
        dmg -= absorbed;
        if (absorbed)
            this.fx('ring', u.x, u.y - u.h * .5, '#b1daf4', 32);
        if(p&&newSkill(p)&&(dmg>0||absorbed>0)){
            const skill=SKILLS[p.skill],wave=skill.branch==='wave'||skill.id==='M01';
            this.emit('sound',{name:skill.cls==='archer'?'arrowhit':wave?'qiHit':'hit'});
            if(wave)this.emit('fx',{name:'inkImpact',x:u.x,y:u.y-u.h*.5,x2:p.vx,y2:p.vy,color:'#dde0d3',size:Math.min(52,24+Math.sqrt(dmg))});
        }
        if (dmg) {
            const actual = Math.min(u.hp, dmg);
            if(!p)this.emit('sound',{name:'hit'});
            u.hp = Math.max(0, u.hp - dmg);
            if(u.hp===0&&!u.lastStandUsed&&equippedRank(u,'SP05')){u.lastStandUsed=true;u.hp=Math.max(1,Math.round(u.maxHp*.08*equippedRank(u,'SP05')));this.fx('rune',u.x,u.y-u.h*.5,'#f1d09b',100);this.fx('text',u.x,u.y-u.h-25,'#f4d6a3',18,'불굴');}
            if(src && (src.side!==2||(src as any).honroAlly)){this.b.reviewDamage??={};this.b.reviewDamage[u.id]=(this.b.reviewDamage[u.id]||0)+actual;this.b.reviewFocus={x:u.x,y:u.y-u.h*.7};}
            u.hurt = .7;
            this.fx('text', u.x, u.y - u.h - 7, u.side === 0 ? '#ffaaa3' : '#fff0d2', 19, '−' + dmg);
            if (src?.side === 0 && u.side === 1) {
                this.b.hits++;
                u.damageBy[src.id] = (u.damageBy[src.id] || 0) + actual;
                recordRedesignDamage(this,p,src,u,actual);
                if(p&&!newSkill(p)&&equippedRank(src,'MP03')&&src.refundShot!==p.shot){src.refundShot=p.shot;src.focus=Math.min(src.maxFocus,src.focus+5*equippedRank(src,'MP03'));this.fx('rune',src.x,src.y-src.h*.5,'#98d9db',30);}
                u.aggroUntil = this.b.round + 3;
                u.awake = true;
                this.b.heroes[src.cls].damage += actual;
                const sum = Object.values(u.damageBy).reduce((a, b) => a + b, 0), budget = Math.floor(Math.min(1, sum / u.maxHp) * u.xpBudget), xp = budget - u.xpGranted;
                u.xpGranted = budget;
                this.award(src, xp);
                this.refreshActivation();
            }
        }
        if (u.hp <= 0) {
            u.dead = true;
            u.airborne = false;
            u.vx = u.vy = 0;
            this.fx('burst', u.x, u.y - u.h * .4, u.side === 1 ? '#aaa8b9' : '#a8c5cc', 60);
            this.emit('sound', { name: 'down' });
            if (u.side === 1) {
                this.b.kills++;
                this.rewardKill(u, src);
                if(src?.side===0&&src.cls==='occultist'&&(u.curseOwner===src.id||(u.curseTurns||0)>0)){const r=equippedRank(src,'OP04');if(r){src.focus=Math.min(src.maxFocus,src.focus+Math.round(6*r));this.fx('rune',src.x,src.y-src.h*.5,'#c5a1e8',34);}}
                this.message(`${u.name} 제압`);
            }
        }
    }
    impulse(u: Unit, vx: number, vy: number) { if (u.fixed || u.dead || u.summonFloating)
        return; delete u.moveTarget; const resist=1-knockbackResistance(passiveRank(u,'SP03'));  u.vx = clamp(u.vx + vx*resist, -480, 480); u.vy = Math.min(u.vy, vy*resist); if (vy < 0)
        u.jumping = false; }
    damageTerrain(t: Terrain, amount: number, depth = 0, owner = this.b.active) {
        if ((this.b as any).honroStage===5 && t.id==='cliff-cleat' && !(this.b as any).honroState?.ritual?.active)
            return;
        if (t.broken || t.indestructible || t.hp >= 9999 || depth > 8)
            return;
        t.hp -= amount;
        if (t.hp > 0) {
            this.fx('spark', t.x + t.w / 2, t.y + t.h / 2, t.mat === 'wood' ? '#a88159' : '#aab7ba', 18);
            return;
        }
        t.broken = true;
        this.b.sceneVersion++;
        this.fx('burst', t.x + t.w / 2, t.y + Math.min(t.h / 2, 35), t.mat === 'wood' || t.mat === 'support' ? '#b78e61' : t.mat === 'ice' ? '#a3dbe6' : '#acb6bd', Math.min(100, t.w));
        this.emit('sound', { name: 'break' });
        if (t.mat === 'barrel') {
            const src = this.unit(owner);
            this.blast(t.x + t.w / 2, t.y + t.h * .5, 118, 48, src?.id || '', false, undefined, depth + 1);
        }
        if (t.device === 'sluice') {
            for (const w of this.b.waters) {
                w.y += 55;
                w.frozen = 0;
            }
            for (const q of this.b.terrain)
                if (q.id.startsWith('frozen'))
                    q.broken = true;
            this.message('수문 개방 · 물길의 수위가 내려갔다.');
        }
        if (t.device && this.b.mode === 'campaign' && !this.b.awardIds.includes(t.id)) {
            this.b.awardIds.push(t.id);
            const u = this.unit(owner);
            if (u?.side === 0)
                this.award(u, 35 + recommendedLevel(this.b.stageId) * 5);
        }
        if (t.device === 'ward')
            this.message('결계 장치 파괴 · 적의 방호가 약해졌다.');
        for (const id of t.link || []) {
            const linked = this.b.terrain.find(p => p.id === id);
            if (!linked || linked.broken)
                continue;
            this.damageTerrain(linked, Math.max(1, linked.hp) + 1, depth + 1, owner);
            if (id.startsWith('falling'))
                for (const u of this.b.units)
                    if (!u.dead && u.x > linked.x - 15 && u.x < linked.x + linked.w + 15 && u.y > linked.y)
                        this.hurt(u, 70, this.b.active);
        }
    }
    blast(x: number, y: number, r: number, damage: number, owner: string, body = false, p?: Projectile, depth = 0) {
        if (depth > 8)
            return;
        const radius = Math.max(r, 1), s = p ? SKILLS[p.skill] : undefined;
        this.fx('burst', x, y, p?.color || '#edb16e', radius);
        this.fx('ring', x, y, p?.color || '#efc99b', radius);
        this.emit('sound', { name: radius > 105 ? 'boom' : 'hit', value: radius });
        for (const u of this.b.units) {
            if (u.dead || (body && u.id === owner) || ((p?.mode === 'spin'||p?.mode==='charge'||p?.mode==='cataclysmCharge') && p.hit.includes(u.id)))
                continue;
            const d = Math.hypot(u.x - x, (u.y - u.h * .45) - y);
            if (d < radius + u.r) {
                const factor = .42 + .58 * (1 - clamp(d / radius, 0, 1));
                this.hurt(u, damage * factor, owner, p?.directId === u.id, p, { x, y });
                if (!u.dead && damage > 15)
                    this.impulse(u, Math.sign(u.x - x || 1) * (1 - d / (radius + u.r)) * 95, -45);
            }
        }
        for (const t of [...this.b.terrain]) {
            if (t.broken || t.hp >= 9999)
                continue;
            const cx = clamp(x, t.x, t.x + t.w), cy = clamp(y, Math.min(t.y, t.y + (t.slope || 0)), t.y + t.h);
            const d = Math.hypot(x - cx, y - cy);
            if (d < radius)
                this.damageTerrain(t, damage * (s?.terrain || 1) * (.5 + .5 * (1 - d / radius)), depth, owner);
        }
        const caster=this.unit(owner), echo=caster?equippedRank(caster,'MP01'):0;
        if(p&&!newSkill(p)&&!p.child&&!p.echoUsed&&!body&&echo>0){p.echoUsed=true;const extra={...p,child:true,echoUsed:true,color:'#edd6ff'};this.blast(x,y,radius*.70,damage*.18*echo,owner,false,extra,depth+1);}
    }
    createZone(p: Projectile, kind: Zone['kind'], attached?: Unit) { const z: Zone = { id: this.b.nextId++, kind, x: p.x, y: p.y, radius: p.blast || 80, owner: p.owner, side: p.side, damage: kind === 'fire' ? p.damage * .36 : kind === 'frost' ? p.damage * .20 : p.mode === 'sticky' ? 58 * (this.unit(p.owner)?.attack || 1) : p.damage, expires: this.b.round + 2 }; if (kind === 'delay' || kind === 'bomb') {
        z.triggerSide = (1 - p.side) as Side;
        z.triggerCount = this.b.teamEnds[1 - p.side] + 1;
        z.expires = 999;
        if (attached)
            z.attached = attached.id;
    } this.b.zones.push(z); this.fx('rune', z.x, z.y, p.color, z.radius); }
    remove(p: Projectile) { const i = this.b.projectiles.indexOf(p); if (i >= 0)
        this.b.projectiles.splice(i, 1); if(p.carry?.length)this.releaseCarried(p); }
    bodyFinish(p: Projectile, hit?: Collision) {
        const u = this.unit(p.owner);
        if (!u)
            return;
        const s = SKILLS[p.skill];
        let x = clamp(p.x, 30, this.b.width - 30), y = p.y + u.h * .5;
        u.airborne = false;
        u.x = x;
        u.y = y;
        u.vx = u.vy = 0;
        if (hit?.terrain) {
            if (hit.n.y < -.3)
                u.y = topAt(hit.terrain, clamp(x, hit.terrain.x, hit.terrain.x + hit.terrain.w));
            else {
                u.x = clamp(x + hit.n.x * (u.r + 2), 25, this.b.width - 25);
                const surf = this.surface(u.x, p.y - u.h * .1, this.b.height + 180);
                if (surf && surf.y < p.y + u.h)
                    u.y = surf.y;
            }
        }
        if (hit?.unit) {
            u.x = clamp(hit.unit.x + Math.sign(p.x - hit.unit.x || -u.facing) * (hit.unit.r + u.r + 3), 25, this.b.width - 25);
            u.y = Math.min(u.y, hit.unit.y);
        }
        const impactY = hit ? hit.y : p.y;
        if(hit?.terrain&&p.mode!=='grappletravel')this.contactDamage(u,p.vx,p.vy,hit.n,hit.n.y<-.35?'fall':'wall',false,.30);
        this.blast(p.x, impactY, p.blast, p.damage, p.owner, true, p);
        this.fx('slash', p.x, impactY, p.color, p.blast);
        if(p.mode==='cataclysmCharge'){
            this.fx('ring',p.x,impactY,'#e7c5ff',p.blast*1.65);this.fx('rune',p.x,impactY,'#f1ddff',p.blast*1.3);
            this.blast(p.x,impactY,p.blast*1.38,p.damage*.52,p.owner,true,{...p,child:true,echoUsed:true},1);
            for(const e of this.alive(1))if(Math.hypot(e.x-p.x,e.y-e.h*.5-impactY)<p.blast*1.45)this.stun(e);
            this.emit('sound',{name:'boom'});
        }
        u.landing = .32;
        if (u.side === 0 && u.cls === 'knight') {
            for (const e of this.b.units)
                if (e.side === 1 && !e.dead && Math.hypot(e.x - p.x, e.y - e.h * .5 - impactY) < p.blast + e.r) {
                    if (['slam', 'quake', 'lift', 'vault'].includes(p.mode) || e.id === p.directId && Math.hypot(p.vx, p.vy) > 680)
                        this.stun(e);
                    this.impulse(e, Math.sign(e.x - p.x || u.facing) * (p.mode === 'quake' ? 340 : 150), -105);
                }
        }
        if(equippedRank(u,'SP01')){const rank=equippedRank(u,'SP01'),reach=p.blast+65+rank*25;for(const e of this.alive(1))if(Math.hypot(e.x-p.x,e.y-e.h*.5-impactY)<reach){this.impulse(e,Math.sign(p.x-e.x)*(100+rank*40),-90);}this.fx('ring',p.x,impactY,'#d6c4a6',reach);}
        if (p.mode === 'quake')
            for (const e of this.b.units)
                if (e.id !== u.id && !e.dead && dist({ x: e.x, y: e.y - e.h * .5 }, { x: p.x, y: impactY }) < p.blast + 20)
                    this.impulse(e, Math.sign(e.x - p.x || 1) * 260, -150);
        if (p.mode === 'lift')
            for (const e of this.b.units)
                if (e.side !== u.side && !e.dead && Math.abs(e.x - p.x) < p.blast)
                    this.impulse(e, Math.sign(e.x - p.x || 1) * 100, -330);
        if (p.mode === 'guard') {
            u.shield += Math.round(44 * u.attack);
            u.shieldUntil = this.b.teamEnds[1 - u.side] + 1;
            this.fx('ring', u.x, u.y - u.h * .5, '#accded', 70);
        }
        if (u.side === 0 && u.cls === 'knight' && u.tune < .5) {
            u.shield += Math.round((.5 - u.tune) * 32);
            u.shieldUntil = this.b.teamEnds[1] + 1;
        }
        if (p.mode === 'recall') {
            this.fx('line', u.x, u.y - u.h / 2, '#dacafa', 40);
            u.x = p.returnX;
            const sf = this.surface(u.x, p.returnY - 20, this.b.height + 100);
            u.y = sf ? sf.y : p.returnY;
            this.fx('rune', u.x, u.y, '#dacafa', 60);
        }
        if (u.y > this.b.height + 30)
            this.recover(u);
        this.remove(p);
    }
    private cursePower(owner:Unit){return owner.cls==='occultist'?1+equippedRank(owner,'OP02')*.08:1;}
    private curseDuration(owner:Unit,base:number){return base+(owner.cls==='occultist'?Math.floor(equippedRank(owner,'OP02')/1.5):0);}
    private applyCurse(target:Unit,owner:Unit,kind:'weak'|'betray'|'dot'|'bind'|'chain',damage=0){
        if(target.dead||target.side===owner.side||target.side===2)return;
        const q=this.cursePower(owner);target.curseOwner=owner.id;
        if(kind==='weak'){target.curseTurns=Math.max(target.curseTurns||0,this.curseDuration(owner,3));target.curseAttack=Math.max(target.curseAttack||0,.12*q);target.curseArmor=Math.max(target.curseArmor||0,.13*q);}
        if(kind==='betray'){target.curseTurns=Math.max(target.curseTurns||0,this.curseDuration(owner,2));target.betrayalUntil=Math.max(target.betrayalUntil||0,this.b.round+this.curseDuration(owner,2));}
        if(kind==='dot'||kind==='chain'){target.curseTurns=Math.max(target.curseTurns||0,this.curseDuration(owner,kind==='dot'?5:3));target.curseDamage=Math.max(target.curseDamage||0,Math.round(damage*q));}
        if(kind==='bind'){target.curseTurns=Math.max(target.curseTurns||0,this.curseDuration(owner,2));target.bound=Math.max(target.bound,2);target.curseAttack=Math.max(target.curseAttack||0,.18*q);}
        this.fx('rune',target.x,target.y-target.h*.55,kind==='betray'?'#df74b8':'#a67bd2',48);
    }
    private spawnSummon(owner:Unit,kind:'stalker'|'lantern'|'charger'|'warden'|'host',x:number,y:number,strong=1){
        const p=equippedRank(owner,'OP03'),hpScale=(1+p*.15)*strong,atkScale=(1+p*.12)*strong;
        const ground=this.surface(clamp(x,30,this.b.width-30),y-80,this.b.height+120);
        const floating=kind==='lantern';const sy=floating?clamp(y,90,this.b.height-170):(ground?.y??groundY(this.b.terrain,x));
        const base={stalker:{hp:175,atk:.84,h:58,r:17,dur:4},lantern:{hp:138,atk:.78,h:54,r:16,dur:4},charger:{hp:205,atk:1.00,h:66,r:19,dur:4},warden:{hp:255,atk:.46,h:72,r:21,dur:5},host:{hp:230,atk:1.06,h:70,r:21,dur:4}}[kind];
        const hp=Math.round(base.hp*hpScale*(.78+owner.level*.027));
        const summon=makeUnit('occultist',0,clamp(x,30,this.b.width-30),sy,{id:`summon-${this.b.nextId++}`,name:{stalker:'배회령',lantern:'등불귀',charger:'돌격귀',warden:'수호령',host:'문지기귀'}[kind],role:`summon-${kind}`,summoned:true,summonOwner:owner.id,summonKind:kind,summonExpires:this.b.round+base.dur,hp,maxHp:hp,r:base.r,h:base.h,attack:owner.attack*base.atk*atkScale,armor:kind==='warden'?.20:.07,focus:0,maxFocus:0,regen:0,loadout:[],fixed:floating,summonFloating:true,acted:true,moveLeft:0,maxMove:0,walkSpeed:0,ranks:{...owner.ranks},awake:true,xpBudget:0});
        summon.spawnX=summon.x;summon.spawnY=summon.y;this.b.units.push(summon);this.fx('rune',summon.x,summon.y-summon.h*.45,'#a98ad2',75);this.fx('burst',summon.x,summon.y-summon.h*.45,'#7fa9bd',45);return summon;
    }
    private summonAtProjectile(p:Projectile,kind:Unit['summonKind']){const owner=this.creditUnit(this.unit(p.owner));if(!owner||!kind)return;this.spawnSummon(owner,kind,p.x,p.y);this.remove(p);}
    /**
     * Summons act once after the four player heroes finish and before the enemy team.
     * Offensive ghosts may move and attack in the same summon turn; the old small
     * movement step often produced a visually silent "move only" turn.
     */
    /** A persisted phase, not an invisible loop or part of the enemy turn. */
    private runSummonTurn(){
        const b=this.b;
        for(const u of this.alive(0).filter(v=>v.summoned))if(u.summonExpires!==undefined&&b.round>u.summonExpires){u.dead=true;u.hp=0;}
        const queue=this.alive(0).filter(u=>u.summoned).map(u=>u.id);
        if(!queue.length||!this.alive(1).length)return 0;
        b.summonTurn={queue,index:0,stage:'approach',elapsed:0,hold:0,returnActive:b.active,practice:b.mode==='practice'};
        b.phase='summon';b.side=0;b.turnAge=0;b.reviewDamage={};b.volley=undefined;
        this.message(`소환귀 차례 · ${queue.length}`);this.emit('change');this.emit('save');return queue.length;
    }
    private launchSummonBolt(s:Unit,target:Unit){
        const x=s.x,y=s.y-s.h*.52,dx=target.x-x,dy=target.y-target.h*.5-y,n=Math.max(1,Math.hypot(dx,dy));
        const p:Projectile={id:this.b.nextId++,skill:'O12',owner:s.id,side:0,x,y,vx:dx/n*1250,vy:dy/n*1250,prevVy:dy/n*1250,age:0,radius:6,damage:s.attack*SUMMON_TUNING.lantern.damage,blast:0,wind:0,mode:'summonBolt',color:'#acdded',bounces:0,pierces:0,apex:true,hit:[],phase:0,body:false,returnX:s.x,returnY:s.y,trail:[{x,y}],child:true,rolled:0,shot:this.b.shot,emissions:99,fieldHits:[],amplification:1,launchX:x,launchY:y,gravityScale:0,drag:.006,phaseMode:'all',targetId:target.id,skillRank:1};
        this.b.projectiles.push(p);
    }
    private stepSummonBolt(p:Projectile,dt:number){
        const t=p.targetId?this.unit(p.targetId):undefined;
        if(!t||t.dead){this.remove(p);return;}
        const tx=t.x,ty=t.y-t.h*.5,dx=tx-p.x,dy=ty-p.y,n=Math.max(1,Math.hypot(dx,dy));
        p.vx=dx/n*1250;p.vy=dy/n*1250;
        const m=this.advanceProjectile(p,dt),h=segRect(p,m,t.x-t.r,t.y-t.h,t.r*2,t.h,p.radius);
        // Dedicated ethereal ray per target: no friendly collision or incidental tank intercept.
        if(h){p.x+= (m.x-p.x)*h.t;p.y+=(m.y-p.y)*h.t;this.hurt(t,p.damage,p.owner,true,p,p);this.fx('burst',p.x,p.y,p.color,35);this.emit('sound',{name:'arrowhit'});this.remove(p);return;}
        p.x=m.x;p.y=m.y;p.vx=m.vx;p.vy=m.vy;
        if(this.counter%2===0){p.trail.push({x:p.x,y:p.y});if(p.trail.length>28)p.trail.shift();}
        if(p.age>4.5)this.remove(p);
    }
    private stepSummonTurn(dt:number){
        const b=this.b,t=b.summonTurn;if(!t){this.completeTeamTransition();return;}
        if(this.checkEnd())return;
        if(t.index>=t.queue.length){b.active=t.returnActive;delete b.summonTurn;b.reviewFocus=undefined;
            if(t.practice){this.resetPractice();}else this.completeTeamTransition();return;}
        const u=this.unit(t.queue[t.index]);if(!u||u.dead){t.index++;t.stage='approach';t.elapsed=0;t.start=undefined;t.destination=undefined;return;}
        u.summonFloating=true;b.active=u.id;const kind=u.summonKind||'stalker',cfg=SUMMON_TUNING[kind];
        if(t.stage==='approach'){
            if(!t.start){
                const enemies=this.alive(1).sort((a,c)=>Math.hypot(a.x-u.x,a.y-a.h*.5-u.y+u.h*.5)-Math.hypot(c.x-u.x,c.y-c.h*.5-u.y+u.h*.5));
                let target=enemies[0];if(kind==='warden'){target=this.heroesAlive().sort((a,c)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y))[0]||target;}
                if(!target){t.index=t.queue.length;return;}
                t.targetId=target.id;t.start={x:u.x,y:u.y};const dx=target.x-u.x,dy=target.y-target.h*.5-(u.y-u.h*.5),distance=Math.hypot(dx,dy),stop=kind==='lantern'?cfg.reach*.58:cfg.reach*.62,travel=Math.min(cfg.move,Math.max(0,distance-stop));
                t.destination={x:clamp(u.x+dx/(distance||1)*travel,30,b.width-30),y:clamp(u.y+dy/(distance||1)*travel,60,b.height-30)};
                u.intent=kind==='warden'?'수호 위치로 이동':'영체 추적';u.anim=.4;this.emit('change');
            }
            t.elapsed+=dt;const a=t.start!,d=t.destination!,distance=Math.hypot(d.x-a.x,d.y-a.y),progress=distance>1?Math.min(1,t.elapsed*cfg.speed/distance):1;
            u.x=a.x+(d.x-a.x)*progress;u.y=a.y+(d.y-a.y)*progress;u.vx=u.vy=0;u.facing=d.x>=a.x?1:-1;
            b.reviewFocus={x:u.x,y:u.y-u.h*.5};
            if(progress<1){u.moving=.1;if(this.counter%12===0)this.fx('spark',u.x,u.y-u.h*.5,'#a995d6',16);return;}
            t.stage='attack';t.elapsed=0;
        }
        if(t.stage==='attack'){
            const center={x:u.x,y:u.y-u.h*.5};
            if(kind==='warden'){let n=0;for(const ally of this.alive(0)){if(Math.hypot(ally.x-center.x,ally.y-ally.h*.5-center.y)>cfg.reach)continue;ally.shield=Math.max(ally.shield,Math.round(22+u.attack*10));ally.shieldUntil=b.teamEnds[1]+1;n++;}this.fx('ring',center.x,center.y,'#9ccfd7',220);this.message(`${u.name} · ${n}명 방호`);}
            else if(kind==='lantern'){
                const targets=this.alive(1).filter(e=>Math.hypot(e.x-center.x,e.y-e.h*.5-center.y)<=cfg.reach+e.r);
                for(const target of targets)this.launchSummonBolt(u,target);
                this.fx('rune',center.x,center.y,'#c4e6ef',90);this.message(`${u.name} · ${targets.length}명 동시 추적탄`);if(targets.length)this.emit('sound',{name:'charge'});
            }else{
                const target=this.alive(1).sort((a,c)=>Math.hypot(a.x-center.x,a.y-a.h*.5-center.y)-Math.hypot(c.x-center.x,c.y-c.h*.5-center.y))[0];
                if(target&&Math.hypot(target.x-center.x,target.y-target.h*.5-center.y)<=cfg.reach+target.r){
                    this.hurt(target,u.attack*cfg.damage,u.id,true,undefined,center);
                    if(kind==='charger')this.impulse(target,Math.sign(target.x-u.x||u.facing)*350,-160);
                    this.emit('fx',{name:'line',x:center.x,y:center.y,x2:target.x,y2:target.y-target.h*.5,color:'#caa8e6',size:8});this.fx('slash',target.x,target.y-target.h*.5,'#caa8e6',82);this.emit('sound',{name:'sword'});this.message(`${u.name} · ${target.name} 공격`);
                }else this.message(`${u.name} · 추적 계속`);
            }
            u.anim=.75;t.stage='wait';t.elapsed=0;t.hold=ACTION_REVIEW_SECONDS;this.emit('change');this.emit('save');
        }
        if(t.stage==='wait'){
            if(b.projectiles.length)return;t.hold-=dt;if(t.hold>0)return;
            t.index++;t.stage='approach';t.elapsed=0;t.start=undefined;t.destination=undefined;t.targetId=undefined;b.reviewDamage={};b.reviewFocus=undefined;
        }
    }
    private completeTeamTransition(){const b=this.b;b.teamEnds[b.side]++;this.triggerDelays(b.side);b.phase='transition';b.turnAge=0;this.emit('save');}
    private tickCurses(){
        for(const u of this.b.units){if(u.dead||!(u.curseTurns||0))continue;const owner=u.curseOwner?this.unit(u.curseOwner):undefined;if((u.curseDamage||0)>0&&owner){this.hurt(u,u.curseDamage!,owner.id,false);this.fx('text',u.x,u.y-u.h-24,'#c388d2',13,'저주');}
            u.curseTurns!--;if((u.curseTurns||0)<=0){u.curseTurns=0;u.curseDamage=0;u.curseAttack=0;u.curseArmor=0;u.betrayalUntil=0;u.curseOwner=undefined;}
        }
    }
    private occultImpact(p:Projectile,h?:Collision){
        const owner=this.creditUnit(this.unit(p.owner));if(!owner)return false;
        if(['curseWeak','curseBetray','curseBind'].includes(p.mode)){
            if(h?.unit){this.hurt(h.unit,p.damage,p.owner,true,p,h);this.applyCurse(h.unit,owner,p.mode==='curseWeak'?'weak':p.mode==='curseBetray'?'betray':'bind',p.damage*.28);}this.remove(p);return true;
        }
        if(p.mode==='curseDot'||p.mode==='curseChain'){
            this.blast(p.x,p.y,p.blast,p.damage,p.owner,false,p);for(const t of this.b.units)if(!t.dead&&t.side!==owner.side&&t.side!==2&&Math.hypot(t.x-p.x,t.y-t.h*.5-p.y)<p.blast+t.r)this.applyCurse(t,owner,p.mode==='curseDot'?'dot':'chain',p.damage*(p.mode==='curseDot'?.40:.30));this.remove(p);return true;
        }
        const kind:Record<string,Unit['summonKind']>={summonStalker:'stalker',summonLantern:'lantern',summonCharger:'charger',summonWarden:'warden',summonHost:'host'};
        if(kind[p.mode]){if(h?.unit)this.hurt(h.unit,p.damage,p.owner,true,p,h);if(p.mode==='summonHost'){this.spawnSummon(owner,'stalker',p.x-35,p.y,1.12);this.spawnSummon(owner,'charger',p.x+35,p.y,1.12);this.remove(p);}else this.summonAtProjectile(p,kind[p.mode]);return true;}
        return false;
    }
    impact(p: Projectile, h: Collision) {
        p.x = h.x;
        p.y = h.y;
        p.directId = h.unit?.id;
        const u = this.unit(p.owner), s = SKILLS[p.skill];
        if (!u) {
            this.remove(p);
            return;
        }
        if(redesignImpact(this,p,h))return;
        if((CURSES.has(p.mode)||SUMMONS.has(p.mode))&&this.occultImpact(p,h))return;
        if(p.mode==='spiritLance'){
            if(h.unit)this.hurt(h.unit,p.damage,p.owner,true,p,h);this.fx('burst',p.x,p.y,p.color,36);this.remove(p);return;
        }
        if ((p.mode === 'bounce' || p.mode === 'ricochet' || p.mode === 'shieldthrow') && h.terrain && p.bounces === 0) {
            const dot = p.vx * h.n.x + p.vy * h.n.y;
            p.vx = (p.vx - 2 * dot * h.n.x) * .84;
            p.vy = (p.vy - 2 * dot * h.n.y) * .84;
            p.x += h.n.x * 3;
            p.y += h.n.y * 3;
            p.bounces++;
            this.fx('spark', p.x, p.y, p.color, 25);
            this.emit('sound', { name: 'ricochet' });
            return;
        }
        if (p.body) {
            if (p.mode === 'dash' && h.terrain && h.terrain.hp < 9999 && p.pierces === 0) {
                this.damageTerrain(h.terrain, 200 * u.attack, 0, p.owner);
                if (h.terrain.broken) {
                    p.pierces++;
                    p.x += Math.sign(p.vx) * 7;
                    return;
                }
            }
            this.bodyFinish(p, h);
            return;
        }
        if (p.mode === 'stormBolt') {
            const start = p.trail[0] || { x: p.x, y: p.y - 80 };
            this.emit('fx', { name: 'line', x: start.x, y: start.y, x2: h.x, y2: h.y, color: p.color, size: 3 });
        }
        if (p.mode === 'iceShard' && h.unit)
            h.unit.bound = Math.max(h.unit.bound, 1);
        if (p.mode === 'grapple') {
            if (h.terrain) {
                const targetX = clamp(h.x + h.n.x * (u.r + 5), 25, this.b.width - 25), targetY = h.n.y < -.3 ? topAt(h.terrain, h.x) - u.h * .5 : h.y;
                p.returnX = targetX;
                p.returnY = targetY;
                p.mode = 'grappletravel';
                p.x = u.x;
                p.y = u.y - u.h * .5;
                const d = Math.max(1, Math.hypot(targetX - p.x, targetY - p.y));
                p.vx = (targetX - p.x) / d * 610;
                p.vy = (targetY - p.y) / d * 610;
                p.body = true;
                p.radius = u.r;
                p.age = 0;
                u.airborne = true;
                this.fx('line', p.x, p.y, p.color, 20);
                return;
            }
            if (h.unit)
                this.hurt(h.unit, p.damage, p.owner, true, p, h);
            this.remove(p);
            return;
        }
        if (p.mode === 'marker') {
            this.fx('rune', p.x, p.y, '#ffd6a0', 90);
            this.fx('meteor', p.x, p.y, '#fbd2a3', 95);
            p.mode = 'meteor';p.drag=.025;p.gravityScale=1;
            p.y = Math.min(-170, h.y - 600);
            p.vx = 0;
            p.vy = 620;
            p.wind = 0;
            p.radius = 22;
            p.age = 0;
            p.trail = [];
            this.emit('sound', { name: 'meteor' });
            return;
        }
        if(p.mode==='seekRain'){this.splitRain(p);return;}
            if (p.mode === 'cluster' || p.mode === 'rain') {
            this.blast(p.x, p.y, 32, 12, p.owner, false, p);
            this.remove(p);
            return;
        }
        if (p.mode === 'delay' || p.mode === 'sticky') {
            if (p.mode === 'sticky' && h.unit)
                this.hurt(h.unit, p.damage, p.owner, true, p, h);
            this.createZone(p, p.mode === 'sticky' ? 'bomb' : 'delay', h.unit);
            this.remove(p);
            return;
        }
        if (p.mode === 'wall') {
            if (h.unit)
                this.hurt(h.unit, p.damage, p.owner, true, p, h);
            const x = clamp(p.x - 20, 15, this.b.width - 55), sf = this.surface(x + 20, p.y - 8, this.b.height + 100);
            const base = sf ? sf.y : clamp(p.y, 80, this.b.height - 80);
            const own = this.b.terrain.filter(t => !t.broken && t.owner === p.owner && t.mat === 'ice');
            if (own.length >= 2) {
                own[0].broken = true;
                this.b.sceneVersion++;
            }
            // Never entomb a unit inside a newly created wall.
            const crowded = this.b.units.some(a => !a.dead && Math.abs(a.x - (x + 20)) < a.r + 25 && a.y > base - 100 && a.y - a.h < base);
            const wx = crowded ? clamp(x + u.facing * 58, 15, this.b.width - 55) : x;
            this.b.terrain.push({ id: 'ice' + this.b.nextId++, x: wx, y: base - 105, w: 40, h: 105, mat: 'ice', hp: Math.round(65 * u.attack), maxHp: Math.round(65 * u.attack), expires: this.b.round + 3, owner: p.owner });
            this.b.sceneVersion++;
            this.fx('burst', wx + 20, base - 45, '#b1ecf3', 70);
            this.remove(p);
            return;
        }
        if (p.mode === 'frost') {
            this.blast(p.x, p.y, p.blast, p.damage, p.owner, false, p);
            this.createZone(p, 'frost');
            for (const w of this.b.waters)
                if (w.kind !== 'lava' && p.x > w.x - p.blast && p.x < w.x + w.w + p.blast && Math.abs(p.y - w.y) < p.blast) {
                    w.frozen = this.b.round + 2;
                    const ix = Math.max(w.x, p.x - p.blast), iw = Math.min(w.x + w.w, p.x + p.blast) - ix;
                    if (iw > 12) {
                        const iy = w.y - 3;
                        this.b.terrain.push({ id: 'frozen' + this.b.nextId++, x: ix, y: iy, w: iw, h: 7, mat: 'ice', hp: 42, maxHp: 42, expires: this.b.round + 3 });
                        for (const v of this.b.units)
                            if (!v.dead && !v.fixed && v.x > ix && v.x < ix + iw && v.y > iy && v.y - v.h < iy) {
                                v.y = iy;
                                v.vy = 0;
                            }
                        this.b.sceneVersion++;
                    }
                }
            for (const t of this.b.units)
                if (!t.dead && dist({ x: t.x, y: t.y - t.h * .5 }, p) < p.blast)
                    t.bound = Math.max(t.bound, 1);
            this.remove(p);
            return;
        }
        if (p.mode === 'lightning') {
            this.blast(p.x, p.y, p.blast, p.damage, p.owner, false, p);
            for (const w of this.b.waters)
                if (w.kind !== 'lava' && p.x > w.x - 45 && p.x < w.x + w.w + 45 && p.y > w.y - 55 && p.y <= waterFloor(w,p.x)+55) {
                    for (const t of this.b.units)
                        if (!t.dead && t.x > w.x && t.x < w.x + w.w && t.y >= w.y - 8 && t.y <= waterFloor(w,t.x)+8) {
                            this.hurt(t, 27 * u.attack, p.owner, false, p);
                            this.fx('line', t.x, t.y - t.h * .5, p.color, 40);
                        }
                }
            this.remove(p);
            return;
        }
        if (p.mode === 'gravity') {
            for (const t of this.b.units) {
                if (t.dead || t.id === u.id)
                    continue;
                const d = dist({ x: t.x, y: t.y - t.h * .5 }, p);
                if (d < p.blast) {
                    this.hurt(t, p.damage, p.owner, false, p);
                    this.impulse(t, (p.x - t.x) * 2.5, -Math.min(200, Math.abs(p.x - t.x)));
                }
            }
            this.fx('ring', p.x, p.y, p.color, p.blast);
            this.fx('rune', p.x, p.y, p.color, 85);
            this.remove(p);
            return;
        }
        if (p.mode === 'resonate') {
            const zone = this.b.zones.find(z => dist(z, p) < z.radius + 50);
            if (zone) {
                this.b.zones = this.b.zones.filter(z => z.id !== zone.id);
                this.blast(zone.x, zone.y, 155, 88 * u.attack, p.owner, false, p);
                this.message('공명 · 기존 마법 영역을 증폭했다.');
            }
            else
                this.blast(p.x, p.y, p.blast, p.damage, p.owner, false, p);
            this.remove(p);
            return;
        }
        if ((p.mode === 'firetrail' || p.mode === 'groundwave') && h.terrain && h.n.y < -.3) {
            p.phase = 2;
            p.y = h.y - 6;
            p.vx = Math.sign(p.vx || u.facing) * 300;
            p.vy = 0;
            p.rolled = 0;
            if (p.mode === 'firetrail')
                this.createZone(p, 'fire');
            return;
        }
        if (ARROWS.has(p.mode) || p.mode === 'shieldthrow') {
            if (h.unit) {
                const target = h.unit;
                if (p.mode === 'shieldthrow')
                    target.shield = Math.max(0, target.shield - 30);
                this.hurt(target, p.damage, p.owner, true, p, h);
                p.hit.push(target.id);
                if (p.mode === 'push' || p.mode === 'shieldthrow')
                    this.impulse(target, Math.sign(p.vx) * (p.mode === 'push' ? 280 : 140), -130);
                if (p.mode === 'pull')
                    this.impulse(target, Math.sign(u.x - target.x) * 250, -95);
                if (p.mode === 'bind')
                    target.bound = Math.max(target.bound, 1);
                if (p.mode === 'break') {
                    target.breaks = 2;
                    target.shield = 0;
                }
                if (p.mode === 'mark') {
                    target.mark = 1;
                    target.markSide = u.side;
                }
                if (p.mode === 'pierce' && p.pierces === 0) {
                    p.pierces++;
                    p.damage *= .72;
                    p.x += Math.sign(p.vx) * 5;
                    return;
                }
            }
            if (h.terrain) {
                this.damageTerrain(h.terrain, p.damage * s.terrain, 0, p.owner);
                if (p.mode === 'pierce' && p.pierces === 0 && h.terrain.mat === 'wood') {
                    p.pierces++;
                    p.damage *= .72;
                    p.x += Math.sign(p.vx) * (h.terrain.w + 8);
                    return;
                }
            }
            this.fx('spark', p.x, p.y, p.color, 28);
            this.emit('sound', { name: 'arrowhit' });
            this.remove(p);
            return;
        }
        this.blast(p.x, p.y, p.blast, p.damage, p.owner, false, p);
        this.remove(p);
    }

    private launchUltimateChildren(p:Projectile){
        const owner=this.unit(p.owner);if(!owner)return false;
        const enemies=this.alive((p.side===0?1:0) as Side).filter(v=>v.side!==2);
        if(p.mode==='arcaneJudgment'){
            const targets=enemies.map(v=>({v,d:Math.hypot(v.x-p.x,v.y-v.h*.5-p.y)})).filter(x=>x.d<1250).sort((a,b)=>a.d-b.d).slice(0,9);
            this.fx('burst',p.x,p.y,'#d89cff',150);this.fx('ring',p.x,p.y,'#b76cff',210);this.fx('rune',p.x,p.y,'#efe0ff',170);this.emit('sound',{name:'boom'});
            if(!targets.length){this.blast(p.x,p.y,p.blast*1.3,p.damage*.7,p.owner,false,p);this.remove(p);return true;}
            for(const {v} of targets){const dx=v.x-p.x,dy=v.y-v.h*.5-p.y,len=Math.max(1,Math.hypot(dx,dy)),speed=920;
                const c:Projectile={...p,id:this.b.nextId++,mode:'arcBolt',targetId:v.id,vx:dx/len*speed,vy:dy/len*speed,prevVy:dy/len*speed,wind:0,damage:p.damage*.72,blast:34,radius:5,age:0,apex:true,body:false,child:true,hit:[],trail:[{x:p.x,y:p.y}],fieldHits:[...(p.fieldHits||[])],emissions:99};this.b.projectiles.push(c);
                this.fx('line',p.x,p.y,'#d8a6ff',42,undefined);
            }
            this.remove(p);return true;
        }
        if(p.mode==='starHunt'){
            const targets=enemies.map(v=>({v,d:Math.hypot(v.x-p.x,v.y-v.h*.5-p.y)})).filter(x=>x.d<1550).sort((a,b)=>a.d-b.d).slice(0,7);
            this.fx('burst',p.x,p.y,'#f7df8c',115);this.fx('ring',p.x,p.y,'#fff2b2',170);this.emit('sound',{name:'split'});
            if(!targets.length){this.remove(p);return true;}
            for(const [i,{v}] of targets.entries()){const dx=v.x-p.x,dy=v.y-v.h*.5-p.y,len=Math.max(1,Math.hypot(dx,dy)),speed=1220;
                const c:Projectile={...p,id:this.b.nextId++,mode:'hunterBolt',targetId:v.id,vx:dx/len*speed+(i-(targets.length-1)/2)*18,vy:dy/len*speed-35,prevVy:dy/len*speed-35,wind:0,damage:p.damage*.70,blast:0,radius:3,age:0,apex:true,body:false,child:true,hit:[],trail:[{x:p.x,y:p.y}],fieldHits:[...(p.fieldHits||[])],emissions:99};this.b.projectiles.push(c);
            }
            this.remove(p);return true;
        }
        if(p.mode==='nightParade'){
            const caster=this.creditUnit(owner)!;const targets=enemies.map(v=>({v,d:Math.hypot(v.x-p.x,v.y-v.h*.5-p.y)})).filter(x=>x.d<1450).sort((a,b)=>a.d-b.d).slice(0,10);
            this.fx('burst',p.x,p.y,'#a264dd',180);this.fx('ring',p.x,p.y,'#d39aff',240);this.fx('rune',p.x,p.y,'#ead8ff',210);this.emit('sound',{name:'boom'});
            for(const {v} of targets){this.applyCurse(v,caster,'dot',p.damage*.22);const dx=v.x-p.x,dy=v.y-v.h*.5-p.y,len=Math.max(1,Math.hypot(dx,dy)),speed=940;const c:Projectile={...p,id:this.b.nextId++,mode:'nightBolt',targetId:v.id,vx:dx/len*speed,vy:dy/len*speed,prevVy:dy/len*speed,wind:0,gravityScale:0,phaseMode:'terrain',damage:p.damage*.62,blast:38,radius:6,age:0,apex:true,body:false,child:true,hit:[],trail:[{x:p.x,y:p.y}],fieldHits:[...(p.fieldHits||[])],emissions:99};this.b.projectiles.push(c);}
            this.spawnSummon(caster,'stalker',p.x-55,p.y,1.35);this.spawnSummon(caster,'charger',p.x+55,p.y,1.35);this.remove(p);return true;
        }
        return false;
    }
    private stepUltimateBolt(p:Projectile,dt:number){
        const target=p.targetId?this.unit(p.targetId):undefined;
        if(target&&!target.dead){const tx=target.x,ty=target.y-target.h*.52,desired=Math.atan2(ty-p.y,tx-p.x),cur=Math.atan2(p.vy,p.vx),delta=Math.atan2(Math.sin(desired-cur),Math.cos(desired-cur)),turn=p.mode==='arcBolt'?4.5:p.mode==='nightBolt'?4.0:3.1,ang=cur+clamp(delta,-turn*dt,turn*dt),speed=Math.max(220,Math.hypot(p.vx,p.vy));p.vx=Math.cos(ang)*speed;p.vy=Math.sin(ang)*speed;}
        const m=this.advanceProjectile({...p,gravityScale:0,drag:dragFor(SKILLS[p.skill],p.mode)},dt),nx=m.x,ny=m.y;p.vx=m.vx;p.vy=m.vy;this.passFields(p,p,{x:nx,y:ny});
        const h=p.phaseMode==='all'?null:this.collision(p,{x:nx,y:ny},p.radius,p.owner,p.hit,true,[],p.phaseMode!=='terrain');if(h){p.x=h.x;p.y=h.y;p.directId=h.unit?.id;this.impact(p,h);return;}
        p.x=nx;p.y=ny;if(this.counter%2===0){p.trail.push({x:p.x,y:p.y});if(p.trail.length>24)p.trail.shift();}
        if(p.age>2.6||p.x<-100||p.x>this.b.width+100||p.y<-900||p.y>this.b.height+100)this.remove(p);
    }

    private phaseSweepDamage(p:Projectile,a:Vec,c:Vec){
        if(p.phaseMode!=='all'||!['phaseWraith','wraithReturn'].includes(p.mode))return;
        const factor=p.mode==='phaseWraith'?.62:p.phase===0?.42:.78;
        for(const u of this.b.units){
            if(u.dead||u.id===p.owner||p.hit.includes(u.id))continue;
            const h=segRect(a,c,u.x-u.r,u.y-u.h,u.r*2,u.h,p.radius+2);if(!h)continue;
            const at={x:a.x+(c.x-a.x)*h.t,y:a.y+(c.y-a.y)*h.t};
            this.hurt(u,p.damage*factor,p.owner,true,p,at);p.hit.push(u.id);this.fx('burst',at.x,at.y,p.color,28);this.fx('text',u.x,u.y-u.h-10,'#d7b9ef',12,'투과');
        }
    }
    stepProjectile(p: Projectile, dt: number, paced=false) {
        // Enemy-exclusive attacks play two unchanged physics substeps per world step.
        // Preserve trajectories/swept collision precision while shortening empty flight time.
        if(!paced&&p.mode.startsWith('honro')){
            for(let i=0;i<2&&this.b.projectiles.includes(p);i++)this.stepProjectile(p,dt,true);
            return;
        }
        p.age += dt;
        if(newSkill(p)&&redesignStep(this,p,dt))return;
        if(p.mode==='summonBolt'){this.stepSummonBolt(p,dt);return;}
        if(p.mode==='arcBolt'||p.mode==='hunterBolt'||p.mode==='nightBolt'){this.stepUltimateBolt(p,dt);return;}
        const u = this.unit(p.owner);
        if (!u || (p.body&&u.dead)) {
            if(u)u.airborne=false;this.remove(p);
            return;
        }
        if(p.fuseAt!==undefined&&p.age>=p.fuseAt){
            if(p.mode==='phaseWraith'){this.blast(p.x,p.y,p.blast,p.damage,p.owner,false,p);this.remove(p);return;}
            if(p.mode==='summonLantern'){this.summonAtProjectile(p,'lantern');return;}
            if(p.mode==='wraithReturn'&&p.phase===0){p.phase=1;p.phaseMode='all';p.fuseAt=undefined;p.vx=-p.vx*.92;const owner=this.unit(p.owner),returnY=(owner?.y??p.returnY)-(owner?.h??70)*.62;p.vy=clamp((returnY-p.y)*2.2,-220,80);p.hit=[];this.fx('rune',p.x,p.y,p.color,58);}
        }
        // Low-gravity ultimate must open its gate inside the playable sky even when its ballistic apex would be far above the camera.
        if(p.mode==='nightParade'&&!p.ultimateBurst&&(p.age>1.35||p.y<-620)){p.ultimateBurst=true;if(this.launchUltimateChildren(p))return;}
        if(p.mode==='reverseGhost'&&(p.y<-420||p.age>2.55)){
            this.fx('burst',p.x,p.y,p.color,90);for(let i=-3;i<=3;i++){const c:Projectile={...p,id:this.b.nextId++,mode:'spiritRain',vx:i*70,vy:210+Math.abs(i)*22,prevVy:210,age:0,gravityScale:.55,phaseMode:undefined,fuseAt:undefined,damage:p.damage*.48,blast:p.blast*.62,radius:5,child:true,hit:[],trail:[],apex:true};this.b.projectiles.push(c);}this.remove(p);return;
        }
        if (p.phase === 2) {
            const nx = p.x + p.vx * dt, sf = this.surface(nx, p.y - 22, p.y + 42);
            if (!sf || sf.y > p.y + 32 || p.rolled > 255) {
                this.remove(p);
                return;
            }
            const wall = this.collision({ x: p.x, y: p.y - 6 }, { x: nx, y: sf.y - 8 }, 3, p.owner, p.hit, true);
            if (wall?.terrain && wall.n.x) {
                this.remove(p);
                return;
            }
            p.x = nx;
            p.y = sf.y - 6;
            p.rolled += Math.abs(p.vx * dt);
            for (const t of this.b.units)
                if (!t.dead && !p.hit.includes(t.id) && t.id !== p.owner && Math.abs(t.x - p.x) < t.r + 24 && Math.abs(t.y - p.y) < 65) {
                    this.hurt(t, p.damage, p.owner, true, p, p);
                    p.hit.push(t.id);
                    this.fx('slash', t.x, t.y - 25, p.color, 40);
                }
            if (p.mode === 'firetrail' && Math.floor(p.rolled / 70) > p.pierces) {
                p.pierces = Math.floor(p.rolled / 70);
                this.createZone(p, 'fire');
            }
            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > 20)
                p.trail.shift();
            return;
        }
        if (p.mode === 'grappletravel') {
            const before = { x: p.x, y: p.y };
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            const h = this.collision(before, p, u.r, p.owner, [], false);
            u.x = p.x;
            u.y = p.y + u.h * .5;
            if (h || Math.hypot(p.x - p.returnX, p.y - p.returnY) < 14 || p.age > 2.6) {
                if (h) {
                    p.x = h.x;
                    p.y = h.y;
                }
                this.bodyFinish(p, h || undefined);
            }
            return;
        }
        if((p.mode==='homing'||p.mode==='seekChild')&&p.age>.12){const v=this.steer(p.x,p.y,p.vx,p.vy,u,dt,p.targetId?this.b.units.filter(t=>t.id!==p.targetId).map(t=>t.id):p.hit,p.mode==='seekChild');p.vx=v.vx;p.vy=v.vy;}
        const motion = this.advanceProjectile(p,dt);
        p.prevVy = p.vy;
        p.vx=motion.vx;p.vy=motion.vy;
        if (!p.apex && p.prevVy < 0 && p.vy >= 0) {
            p.apex = true;
            if(newSkill(p)){p.apexY=Math.min(p.apexY??p.y,p.y);if(p.mode==='dropArrow')p.gravityScale=2.8+(p.skillRank!-1)*1.3/7;if(p.mode==='return'){p.returning=true;p.outboundHits=[...p.hit];p.hit=[];}}
            if((p.mode==='arcaneJudgment'||p.mode==='starHunt'||p.mode==='nightParade')&&this.launchUltimateChildren(p))return;
            if(['cluster','rain','seekRain'].includes(p.mode)){this.splitRain(p);return;}
            if (p.mode === 'return' && !newSkill(p)) {
                p.vx = -p.vx * .32;
                p.vy = 80;
                this.fx('ring', p.x, p.y, p.color, 25);
            }
            if (p.mode === 'slam') {
                p.vx = 0;
                p.vy = 650;
                this.fx('rune', p.x, p.y, p.color, 48);
                this.emit('sound', { name: 'sword' });
            }
        }
        const nx = motion.x, ny = motion.y;
        this.passFields(p, { x: p.x, y: p.y }, { x: nx, y: ny });
        this.phaseSweepDamage(p,{x:p.x,y:p.y},{x:nx,y:ny});
        this.emitSubProjectiles(p);
        if (p.mode === 'spin')
            for (const e of this.b.units)
                if (!e.dead && e.id !== p.owner && !p.hit.includes(e.id) && dist({ x: e.x, y: e.y - e.h * .5 }, { x: nx, y: ny }) < 64) {
                    p.hit.push(e.id);
                    this.hurt(e, p.damage, p.owner, true, p, p);
                    this.fx('slash', e.x, e.y - e.h * .5, p.color, 55);
                }
        let hit = p.phaseMode==='all' ? null : this.collision({x:p.x,y:p.y},{x:nx,y:ny},p.radius,p.owner,p.hit,p.mode!=='spin'&&p.mode!=='charge'&&p.mode!=='cataclysmCharge'&&p.mode!=='waveTriangle'&&!p.mode.startsWith('stake'),[],p.phaseMode!=='terrain');
        if(p.mode==='charge'||p.mode==='cataclysmCharge'){
          for(const f of this.b.units.filter(v=>v.side!==p.side&&v.side!==2&&v.fixed&&!v.dead)){const h=segRect({x:p.x,y:p.y},{x:nx,y:ny},f.x-f.r,f.y-f.h,f.r*2,f.h,p.radius);if(h&&(!hit||h.t<hit.t))hit={x:p.x+(nx-p.x)*h.t,y:p.y+(ny-p.y)*h.t,t:h.t,n:h.n,unit:f};}
          this.carrySweep(p,{x:p.x,y:p.y},hit||{x:nx,y:ny});
        }
        if(newSkill(p))p.apexY=Math.min(p.apexY??p.y,hit?hit.y:ny);
        if (hit)
            this.impact(p, hit);
        else {
            p.x = nx;
            p.y = ny;
        }
        if (p.body && this.b.projectiles.includes(p)) {
            u.x = p.x;
            u.y = p.y + u.h * .5;
            u.facing = p.vx >= 0 ? 1 : -1; if(p.mode==='charge'||p.mode==='cataclysmCharge')this.moveCarried(p);
        }
        if (this.b.projectiles.includes(p)) {
            if (this.counter % 3 === 0) {
                p.trail.push({ x: p.x, y: p.y });
                if (p.trail.length > 32)
                    p.trail.shift();
            }
            if (p.y > this.b.height + 110 || p.x < -170 || p.x > this.b.width + 170 || p.y < -1700 || p.age > (p.mode.startsWith('honro')?6:12)) {
                if (p.body) {
                    u.airborne = false;
                    this.recover(u);
                    if (p.mode === 'recall') {
                        u.x = p.returnX;
                        u.y = p.returnY;
                    }
                }
                else
                    this.message('탄이 전장 밖으로 벗어났다.');
                this.remove(p);
            }
        }
    }
    recover(u: Unit) {
        if (u.dead)
            return;
        const fall = Math.ceil(u.maxHp * .2);
        u.hp = Math.max(0, u.hp - fall);
        u.hurt = .7;
        this.fx('text', u.x, Math.min(this.b.height, u.y - u.h), '#efa797', 18, '−' + fall);
        if (u.hp === 0) {
            u.dead = true;
            u.airborne = false;
            u.vx = u.vy = 0;
            if (u.side === 1) {
                this.b.kills++;
                const contributor = Object.entries(u.damageBy).sort((a, b) => b[1] - a[1])[0];
                this.rewardKill(u, contributor ? this.unit(contributor[0]) : undefined);
            }
            return;
        }
        let best: {
            x: number;
            y: number;
            d: number;
        } | null = null;
        for (const t of this.b.terrain) {
            if (t.broken || t.w < u.r * 2 + 4 || ['barrel', 'device', 'support'].includes(t.mat) || t.id.startsWith('roof'))
                continue;
            const x = clamp(u.x, t.x + u.r + 5, t.x + t.w - u.r - 5);
            for(const face of terrainSurfaces(t,x)){if(Math.abs(face.slope)>1.35)continue;const y=face.y;if(this.b.terrain.some(o=>o!==t&&!o.broken&&!o.oneWay&&terrainRectIntersects(o,x-u.r*.6,y-u.h+5,u.r*1.2,Math.max(4,u.h-10),.15)))continue;const d=Math.abs(x-u.x)+Math.abs(y-u.y)*.18;if(!best||d<best.d)best={x,y,d};}
        }
        u.x = best?.x ?? u.spawnX;
        u.y = best?.y ?? u.spawnY;
        u.vx = u.vy = 0;
        u.airborne = false;
        u.jumping = false;
        u.moving = 0;
        this.fx('rune', u.x, u.y, '#c8bfac', 65);
        this.message(`${u.name} · 추락 피해 후 발판으로 복귀`);
    }
    /** Contact friction is evaluated on the supporting surface EVERY step, including downhill.
     *  We do not project gravity into a fresh tangential impulse. That caused endless slope drift.
     *  Slopes change stopping distance; static friction always wins once an impulse is spent. */
    groundFriction(u: Unit, t: Terrain, dt: number) {
        const slope = terrainSlopeAt(t,u.x,u.y), downhill = Math.sign(u.vx) * slope;
        const grip = clamp(1 - downhill * .60, .52, 1.70), ice = t.mat === 'ice';
        const v = Math.abs(u.vx) * Math.exp(-(ice ? 1.45 : 6.5) * grip * dt) - (ice ? 12 : 90) * grip * dt;
        u.vx = v < 3 ? 0 : Math.sign(u.vx) * v;
    }
    private contactDamage(u:Unit,vx:number,vy:number,n:Vec,kind:'fall'|'wall',silent=false,scale=1){
        if(silent||u.dead||u.summoned||(u.impactCooldown||0)>0)return;
        const normalSpeed=Math.max(0,-vx*n.x-vy*n.y),damage=Math.round(collisionDamage(u.maxHp,normalSpeed,kind)*scale);
        if(damage<=0)return;u.impactCooldown=.30;
        this.hurt(u,damage,'',false);this.fx('text',u.x,u.y-u.h-25,'#edb699',13,kind==='fall'?'낙하 충격':'충돌 충격');
    }
    landUnit(u: Unit,silent=false) { if (u.jumping || u.vy > 95) {
        u.landing = .26;
        if(!silent)this.fx('spark', u.x, u.y, '#c9c3b1', 18);
    } u.jumping = false; u.vy = 0; }
    stepUnits(dt: number) {
        for (const u of this.b.units) {
            u.hurt = Math.max(0, u.hurt - dt);
            u.anim = Math.max(0, u.anim - dt);
            u.moving = Math.max(0, (u.moving || 0) - dt);
            u.landing = Math.max(0, (u.landing || 0) - dt);
            if(u.summonFloating){u.vx=u.vy=0;}
            if(flyingEnemy(u)&&!u.dead&&u.aiMove&&this.b.phase==='enemy'&&this.b.active===u.id&&!u.acted){advanceEnemyMove(this,u,dt);continue;}
            if (u.dead || u.airborne || u.fixed || u.summonFloating || u.carriedBy!==undefined)
                continue;
            if(u.aiMove && this.b.phase==='enemy' && this.b.active===u.id && !u.acted){advanceEnemyMove(this,u,dt);}
            else if (u.moveTarget !== undefined && (this.b.phase === 'aim' || this.b.phase === 'enemy') && u.id === this.b.active && !u.acted) {
                const target = u.moveTarget;
                if (Math.abs(target - u.x) < 9 || u.moveLeft <= 0) {
                    delete u.moveTarget;
                    if (this.b.side === 1)
                        this.b.turnAge = 0;
                }
                else if (!this.walk(u, Math.sign(target - u.x), dt)) {
                    if (this.jump(u))
                        u.moveTarget = target;
                    else if (!u.jumping) {
                        delete u.moveTarget;
                        if (this.b.side === 1)
                            this.b.turnAge = 0;
                    }
                }
                this.refreshActivation();
                if (this.counter % 12 === 0)
                    this.campCheck();
            }
            this.integrateBody(u,dt);

        }
    }
    /** Shared contact integration for live units and read-only AI traversal probes. */
    integrateBody(u:Unit,dt:number,silent=false):boolean{
            if(!silent)u.impactCooldown=Math.max(0,(u.impactCooldown||0)-dt);
            const env=environmentAt(this.b.physics??(this.b.physics=makePhysics()),u.x,u.y-u.h*.5);
            // A nearby surface supports a resting body, not one still arriving at impact speed.
            // Otherwise the 4-unit contact tolerance can erase a fall before contactDamage runs.
            const ox = u.x, oy = u.y, support = this.surface(ox, oy - 3, oy + 4), supported = !!support && env.gravity.y>=0 && u.vy >= 0 && u.vy <= 3 && !u.jumping;
            if (supported && Math.abs(u.vx) < 3) {
                u.x = ox;
                u.y = support!.y;
                u.vx = u.vy = 0;
                return true;
            }
            if (!supported){
                const gravityScale=u.jumping?1000/G:1,k=.015*env.dragScale;
                u.vx+=(env.gravity.x*gravityScale-k*(u.vx-env.flow.x))*dt;
                u.vy+=(env.gravity.y*gravityScale-k*(u.vy-env.flow.y))*dt;
            }else u.vy = 0;
            let nx = clamp(ox + u.vx * dt, -100, this.b.width + 100), ny = oy + u.vy * dt;
            // The lowest old wall probe was five units ABOVE the feet. A foot
            // arriving just below a ledge could enter it while every probe passed
            // overhead, then land on a buried overlapping ground segment.
            const footWall=this.collision({x:ox,y:oy-.05},{x:nx,y:ny},0,u.id,[],false,this.b.terrain.filter(t=>t.oneWay||supported&&t===support?.t).map(t=>t.id));
            if(footWall?.terrain&&Math.abs(footWall.n.x)>.99&&Math.abs(footWall.n.y)<.01){
                this.contactDamage(u,u.vx,u.vy,footWall.n,'wall',silent);
                nx=footWall.x+footWall.n.x*(Math.min(6,Math.max(2,u.r-2))+.1);u.vx=0;
            }
            // Ignore only upward-facing ramp contacts as walls, not actual vertical faces.
            for (const offset of [u.h * .52, u.h - 7, 5]) {
                const h = this.collision({ x: ox, y: oy - offset }, { x: nx, y: oy - offset }, offset === 5 ? 2 : Math.min(6, u.r - 2), u.id, [], false, [...(supported&&support?[support.t.id]:[]),...this.b.terrain.filter(t=>t.oneWay).map(t=>t.id)]);
                if (h && Math.abs(h.n.x) > .65 && h.n.y > -.35) {
                    this.contactDamage(u,u.vx,u.vy,h.n,'wall',silent);
                    nx = h.x+h.n.x*6;
                    u.vx = 0;
                    break;
                }
            }
            u.x = nx;
            if (supported) {
                // Following the support at the NEW x prevents tiny airborne gaps on downhill slopes.
                const maxStep = Math.abs(nx - ox) * 1.7 + 5;
                const next = this.surface(nx, oy - maxStep, oy + maxStep);
                if (next) {
                    u.y = next.y;
                    u.vy = 0;
                    this.groundFriction(u, next.t, dt);
                    return true;
                }
            }
            if (u.vy < 0) {
                const head = this.collision({ x: nx, y: oy - u.h + 4 }, { x: nx, y: ny - u.h + 4 }, 3, u.id, [], false, this.b.terrain.filter(t=>t.oneWay).map(t=>t.id));
                if (head && head.n.y > .30) {
                    this.contactDamage(u,u.vx,u.vy,head.n,'wall',silent);
                    ny = head.y + u.h;
                    u.vy = 0;
                }
            }
            // Swept feet contact: crossing a sloping top is a landing, regardless of world-space vy.
            let ground: Collision | null = null;
            for (const t of this.collisionTerrain({ x: ox, y: oy }, { x: nx, y: ny }, 1)) {
                if (t.broken)
                    continue;
                const h = segmentTerrain({ x: ox, y: oy - 0.05 }, { x: nx, y: ny }, t, 0);
                const hx=h?ox+(nx-ox)*h.t:0,hy=h?oy+(ny-oy)*h.t:0;
                const exposed=h&&!this.b.terrain.some(o=>o!==t&&!o.broken&&!o.oneWay&&terrainRectIntersects(o,hx-.15,hy+.25,.3,3,.01));
                if (h && exposed && h.n.y < -.01 && (ny - oy) - (nx - ox) * terrainSlopeAt(t,hx,hy) >= -.001 && (!ground || h.t < ground.t))
                    ground = { x: ox + (nx - ox) * h.t, y: oy + (ny - oy) * h.t, t: h.t, n: h.n, terrain: t };
            }
            const below = u.vy >= 0 ? this.surface(nx, oy - 2, ny + 2) : null;
            if (ground || below && ny >= below.y) {
                const t = ground?.terrain || below!.t;
                u.x = clamp(nx, t.x + .01, t.x + t.w - .01);
                u.y = topAt(t, u.x,ground?.y??below?.y);
                const slope=terrainSlopeAt(t,u.x,u.y),norm=Math.hypot(slope,1),normal=ground?.n??{x:slope/norm,y:-1/norm};
                this.contactDamage(u,u.vx,u.vy,normal,'fall',silent);
                this.landUnit(u,silent);
                this.groundFriction(u, t, dt);
            }
            else
                u.y = ny;
            if(u.dead)return true;
            if (supported && Math.abs(u.vx) < 1)
                u.vx = 0;
            if (u.y > this.b.height + 70 || u.x < -40 || u.x > this.b.width + 40)
                {if(silent)return false;this.recover(u);}
            return true;
    }
    settleBusy() { return this.b.units.some(u => !u.dead && !u.fixed && (u.airborne || u.jumping || Math.abs(u.vx) > 3 || Math.abs(u.vy) > 3)); }
    applyZones(u: Unit) { for (const w of this.b.waters)
        if (w.kind === 'lava' && u.x > w.x && u.x < w.x + w.w && u.y >= w.y - 9 && u.y < w.y + w.depth + 20)
            this.hurt(u, Math.round(u.maxHp * .10), ''); for (const z of this.b.zones) {
        if (z.kind !== 'fire' && z.kind !== 'frost')
            continue;
        if (Math.hypot(u.x - z.x, u.y - z.y) < z.radius + 15) {
            this.hurt(u, z.damage, z.owner);
            if (z.kind === 'frost')
                u.bound = Math.max(u.bound, 1);
        }
    } }
    private pruneExpiredSummons(){
        const b=this.b;if(b.summonTurn)return;
        const removed=b.units.filter(u=>u.summoned&&u.dead&&u.id!==b.active&&!b.projectiles.some(p=>p.owner===u.id||p.targetId===u.id)&&!b.units.some(v=>v.aiMove?.targetId===u.id));
        if(!removed.length)return;
        for(const s of removed){for(const u of b.units){if(u.damageBy[s.id]!==undefined){const owner=s.summonOwner;if(owner&&this.unit(owner))u.damageBy[owner]=(u.damageBy[owner]||0)+u.damageBy[s.id];delete u.damageBy[s.id];}}if(b.reviewDamage)delete b.reviewDamage[s.id];delete b.lastShots[s.id];}
        const ids=new Set(removed.map(u=>u.id));b.units=b.units.filter(u=>!ids.has(u.id));
    }
    private resetPractice(){const b=this.b;
            for (const p of b.units) {
                if (p.side === 0 && !p.summoned) {
                    p.hp = p.maxHp;
                    p.dead = false;
                    p.focus = p.maxFocus;
                    p.acted = false;
                    p.moveLeft = p.maxMove;
                    p.cooldowns = {};
                    delete p.retreat;
                }
                else if (p.role === 'dummy') {
                    p.hp = p.maxHp;
                    p.dead = false;
                    p.x = p.spawnX;
                    p.y = p.spawnY;
                    p.shield = p.bound = p.mark = p.breaks = 0;
                }
            }
            // Practice still advances opponent-end clocks so delayed skills visibly resolve.
            b.teamEnds[1]++;
            this.triggerDelays(1);
            for (const p of b.units.filter(v=>!v.summoned)) {
                p.dead = false;
                if (p.hp <= 0)
                    p.hp = p.maxHp;
            }
            b.cast=undefined;
            b.round++;this.applyPhysicsCues();
            for(const u of b.units)if(u.summoned&&u.summonExpires!==undefined&&b.round>u.summonExpires){u.dead=true;u.hp=0;}
            this.pruneExpiredSummons();
            b.zones = b.zones.filter(z => z.expires >= b.round);
            b.terrain.forEach(t => { if (t.expires && t.expires < b.round)
                t.broken = true; });
            b.side = 0;
            b.phase = 'aim';
            b.turnAge = 0;
            this.emit('change');
            return;
    }
    finishAction(reviewed=false) {
        const b = this.b, u = this.active;
        if(finishRedesign(this,reviewed))return;
        if(b.mode!=='practice'&&!reviewed){b.phase='review';b.reviewLeft=ACTION_REVIEW_SECONDS;b.reviewFocus??=u?{x:u.x,y:u.y-u.h}:undefined;this.emit('change');this.emit('save');return;}
        if (u) {
            delete u.moveTarget;
            delete u.aiMove;
            u.acted = true;
            if (u.bound > 0)
                u.bound--;
            this.applyZones(u);
        }
        b.projectiles = []; b.volley=undefined;
        b.resolveAge = 0;
        if (b.mode === 'practice') {if(this.runSummonTurn()>0)return;this.resetPractice();return;}
        if (this.checkEnd())
            return;
        const pending = this.alive(b.side).filter(a => (b.side!==0||!a.summoned) && !a.acted && (b.side !== 1 || b.queue.includes(a.id)));
        if (pending.length) {
            b.active = pending[0].id; b.reviewDamage={}; b.reviewFocus=undefined;
                b.phase = b.side === 0 ? 'aim' : 'enemy';
            b.turnAge = 0;
        }
        else {
            this.endTeam();
        }
        this.emit('change');
        this.emit('save');
    }
    triggerDelays(side: Side) { const b = this.b; const due = b.zones.filter(z => z.triggerSide === side && z.triggerCount! <= b.teamEnds[side]); b.zones = b.zones.filter(z => !due.includes(z)); for (const z of due) {
        const at = z.attached ? this.unit(z.attached) : undefined;
        this.blast(at?.x ?? z.x, at ? at.y - at.h * .5 : z.y, z.radius, z.damage, z.owner);
        this.message('지연 표식이 폭발했다.');
    } for (const u of b.units)
        if (u.side !== side && u.shieldUntil !== undefined && u.shieldUntil <= b.teamEnds[side]) {
            u.shield = 0;
            delete u.shieldUntil;
        } }
    endTeam(){if(this.b.phase==='summon')return;if(this.b.side===0&&this.runSummonTurn()>0)return;this.completeTeamTransition();}
    switchTeam() {
        const b = this.b;
        if (this.checkEnd())
            return;
        if (b.side === 0) {
            b.side = 1;
            this.refreshActivation();
            const skipped = new Set<string>();
            for (const v of this.alive(1))
                if ((v.stun || 0) > 0) {
                    v.stun!--;
                    v.stunnedRound=b.round;
                    skipped.add(v.id);
                    this.fx('text', v.x, v.y - v.h - 15, '#ecd09a', 15, '기절');
                }
            const allies = this.alive(0), enemies = this.combatEnemies().filter(v => !skipped.has(v.id)).sort((a, c) => a.lastAct - c.lastAct || Math.min(...allies.map(p => Math.abs(p.x - a.x))) - Math.min(...allies.map(p => Math.abs(p.x - c.x)))).slice(0, b.enemyLimit);
            b.queue = enemies.map(u => u.id);
            for (const u of this.alive(1))
                u.acted = !b.queue.includes(u.id);
            if (!enemies.length) {
                this.endTeam();
                return;
            }
            b.active = enemies[0].id;
            b.phase = 'enemy';
            b.turnAge = 0;
        }
        else
            this.newRound();
        this.emit('change');
    }
    newRound() {
        const b = this.b;
        b.round++; b.reviewDamage={};b.reviewFocus=undefined;this.applyPhysicsCues();this.tickCurses();
        b.side = 0;
        b.wind = b.mode === 'practice' ? b.practiceWind || 0 : b.mode === 'skirmish' && b.practiceWind !== undefined ? b.practiceWind : this.stage.wind[(b.round - 1) % this.stage.wind.length];
        for (const u of b.units) {
            if (u.dead)
                continue;
            u.acted = !!u.summoned;
            if(u.summoned&&u.summonExpires!==undefined&&b.round>u.summonExpires){u.dead=true;u.hp=0;continue;}
            if (u.side === 0 && !u.summoned && (u.stun || 0) > 0) {
                u.stun!--;
                u.stunnedRound=b.round;
                u.acted = true;
                this.fx('text', u.x, u.y - u.h - 18, '#eed59b', 15, '기절 · 행동 불가');
            }
            delete u.moveTarget;delete u.aiMove;
            u.moveLeft = u.bound > 0 ? u.maxMove * .45 : u.maxMove;
            if (u.side !== 2)
                u.focus = clamp(u.focus + u.regen, 0, u.maxFocus);
        }
        b.zones = b.zones.filter(z => z.expires >= b.round);
        for (const t of b.terrain) {
            if (t.expires && t.expires <= b.round && !t.broken) {
                t.broken = true;
                b.sceneVersion++;
            }
            if (!t.broken && t.moving) {
                const m = t.moving, nx = m.x + (b.round % 2 === 0 ? m.dx : 0), ny = m.y + (b.round % 2 === 0 ? m.dy : 0);
                for (const u of b.units)
                    if (!u.dead && u.x >= t.x && u.x <= t.x + t.w && Math.abs(u.y - topAt(t, u.x)) < 5) {
                        u.x += nx - t.x;
                        u.y += ny - t.y;
                    }
                t.x = nx;
                t.y = ny;
                b.sceneVersion++;
            }
        }
        if (b.mode === 'campaign' && this.stage.objective === 'escort' && !(b as any).honroStage) {
            const car = this.unit('objective'), ally = this.heroesAlive()[0];
            if (car && !car.dead && ally) {
                const target = Math.max(car.spawnX, Math.min(...this.heroesAlive().map(u => u.x)) - 120);
                car.x += clamp(target - car.x, -250, 380);
                car.y = groundY(b.terrain, car.x);
            }
        }
        const boss = this.unit('boss');
        if (boss && !boss.dead && boss.boss === 4 && boss.awake) {
            boss.x = boss.spawnX + (b.round % 2 === 0 ? -120 : 0);
            boss.y = b.vertical ? boss.spawnY : groundY(b.terrain, boss.x);
            this.fx('rune', boss.x, boss.y, '#bab8e5', 65);
        }
        this.pruneExpiredSummons();
        this.refreshActivation();
        this.refreshIntents();
        this.campCheck();
        if (this.checkEnd())
            return;
        const allies = this.heroesAlive();
        if(!allies.length){this.checkEnd();return;}
        b.active = (allies.find(u => !u.acted) || allies[0]).id;
        b.phase = 'aim';
        if (allies.every(u => u.acted))
            this.endTeam();
        b.turnAge = 0;
        this.emit('save');
    }
    refreshIntents() { for (const u of this.alive(1)) {
        if (u.boss) {
            u.intent = u.boss === 5 ? (this.b.round % 2 ? '도약 준비' : '방어 태세') : u.boss === 6 ? '낙성 인장' : this.b.round % 2 ? '장갑 · 포격' : '노출 · 공격';
        }
        else
            u.intent = ENEMIES[u.role]?.intent || '대기';
    } }
    enemyAction(){
        const b=this.b,u=this.active;
        if(!u||u.dead){this.finishAction();return;}
        if(u.aiMove||u.moveTarget!==undefined)return;
        if(!this.heroesAlive().length){this.checkEnd();return;}
        let target=targetFor(this,u);
        if(!target){this.finishAction();return;}
        if(u.lastAct!==b.round){
            u.lastAct=b.round;
            if(flyingEnemy(u))u.moveLeft=Math.min(u.moveLeft,FLY_MOVE_BUDGET);
            if(flyingEnemy(u)||!u.fixed&&this.grounded(u)){
                const plan=planEnemyMove(this,u,target);
                if(plan){u.aiMove=plan;u.intent=plan.intent;this.emit('change');return;}
            }
        }
        // All decisions below use the position reached by walking/jumping, not a planned position.
        target=targetFor(this,u)||target;
        if(u.role==='healer'){
            const hurt=this.alive(1).filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<720&&v.hp<v.maxHp-40).sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp)[0];
            if(hurt){const n=Math.min(hurt.maxHp-hurt.hp,Math.round(hurt.maxHp*.22));hurt.hp+=n;this.fx('ring',hurt.x,hurt.y-hurt.h*.5,'#9ae0b7',60);this.fx('text',hurt.x,hurt.y-hurt.h-10,'#acefc3',18,'+'+n);this.message(`${u.name} · 아군 회복`);this.emit('sound',{name:'heal'});this.finishAction();return;}
        }
        if(u.role==='ward'&&b.round%3===1){
            for(const e of this.alive(1).filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<700)){e.shield=Math.max(e.shield,Math.round(e.maxHp*.16));e.shieldUntil=b.teamEnds[0]+1;}
            this.fx('ring',u.x,u.y-u.h*.5,'#beccea',75);this.message(`${u.name} · 방호 부여`);this.finishAction();return;
        }
        const available=u.loadout.map(id=>SKILLS[id]).filter(sk=>sk&&!sk.passive&&this.manaCost(sk,u)<=u.focus);
        if(!available.length){u.shield=Math.max(u.shield,18);u.shieldUntil=b.teamEnds[0]+1;this.finishAction();return;}
        const betrayal=target.side===u.side&&target.id!==u.id&&(target.betrayalUntil||0)>=b.round;
        const choice=betrayal?(()=>{const skill=available.find(v=>v.radius<70)||available[0];return {skill,aim:this.bestShot(u,skill,target,true)}})():chooseEnemyShot(this,u,target,available);
        let sk=choice.skill,aim=choice.aim;
        const error=DIFFICULTIES[b.difficulty].aim;
        const safeAngle=aim.angle,safePower=aim.power;
        aim.angle=clamp(aim.angle+(this.random()-.5)*error*2,AIM_MIN,AIM_MAX);
        aim.power=clamp(aim.power+(this.random()-.5)*error*.012,.08,1);
        // Accuracy noise may not turn a safe decision into a suicidal shot through allies or a solid wall.
        let viable=shotViable(this,u,sk,target,aim.angle,aim.power,betrayal?target.id:undefined);
        if(!viable.ok){aim.angle=safeAngle;aim.power=safePower;viable=shotViable(this,u,sk,target,aim.angle,aim.power,betrayal?target.id:undefined);}
        if(!viable.ok&&!betrayal){
            const alternatives=this.b.units.filter(v=>!v.dead&&v.id!==target!.id&&(v.side===0||v.side===2&&((v as any).honroAlly||v.id==='objective')))
                .sort((a,c)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y)).slice(0,2);
            for(const candidate of alternatives){const shot=chooseEnemyShot(this,u,candidate,available),test=shotViable(this,u,shot.skill,candidate,shot.aim.angle,shot.aim.power);
                if(test.ok){target=candidate;sk=shot.skill;aim=shot.aim;viable=test;break;}}
        }
        if(!viable.ok){
            // One bounded second reposition attempt is allowed after discovering a bad firing lane.
            if((flyingEnemy(u)||!u.fixed&&this.grounded(u))&&u.moveLeft>90&&(u as any).honroRepositionRound!==b.round){
                (u as any).honroRepositionRound=b.round;
                const retry=planEnemyMove(this,u,target);
                if(retry){u.aiMove=retry;u.intent=viable.reason==='blocked'?'사선 변경':'사거리 확보';this.emit('change');return;}
            }
            u.shield=Math.max(u.shield,Math.round(u.maxHp*.08));u.shieldUntil=b.teamEnds[0]+1;u.intent=viable.reason==='blocked'?'사선 없음 · 방어':'공격 보류 · 방어';this.finishAction();return;
        }
        u.angle=aim.angle;u.lastPower=aim.power;u.facing=target.x>=u.x?1:-1;
        if(!this.fire(sk.id,aim.angle,aim.power,true))this.finishAction();
    }
    checkEnd() {
        const b = this.b;
        if (b.mode === 'practice')
            return false;
        if (b.phase === 'won' || b.phase === 'lost')
            return true;
        const obj = this.unit('objective'), boss = this.unit('boss');
        const result=evaluateStageEnd(this.stage,b,this.heroesAlive(),this.alive(1),obj,boss);
        const {win,lose,reason}=result;
        if (win || lose) {
            b.phase = win ? 'won' : 'lost';delete b.summonTurn;
            b.winnerReason = reason;
            for(const p of b.projectiles)this.releaseCarried(p);b.projectiles = [];b.volley=undefined;
            this.cancelMovement();
            b.units.forEach(u => u.airborne = false);
            if (win && !b.rewardGranted && b.mode === 'campaign') {
                b.rewardGranted = true;
                const bonus = 105 + recommendedLevel(b.stageId) * 32 + (this.stage.boss ? 120 : 0);
                for (const cls of ['mage', 'archer', 'knight', 'occultist'] as const) {
                    const p = b.units.find(u => u.side === 0 && u.cls === cls);
                    if (p)
                        this.award(p, bonus);
                    else
                        grantXP(b.heroes[cls], bonus * .3);
                }
            }
            this.emit('result');
            this.emit('save');
            return true;
        }
        return false;
    }
    tick(dt = STEP) {
        const b = this.b;
        if (b.phase === 'won' || b.phase === 'lost')
            return;
        if(b.phase==='review'){b.reviewLeft=Math.max(0,(b.reviewLeft||0)-dt);if(b.reviewLeft<=1e-8)this.finishAction(true);return;}
        this.counter++;
        b.turnAge += dt;
        this.stepUnits(dt);
        tickRedesign(this,dt);
        for (const z of b.zones) {
            if (z.attached) {
                const u = this.unit(z.attached);
                if (u) {
                    z.x = u.x;
                    z.y = u.y - u.h * .5;
                }
            }
        }
        if(b.phase==='summon'){
            for(const p of [...b.projectiles])if(b.projectiles.includes(p))this.stepProjectile(p,dt);
            if(b.phase==='summon')this.stepSummonTurn(dt);return;
        }
        if (b.phase === 'flight') {
            this.stepVolley(dt);
            for (const p of [...b.projectiles])
                if (b.projectiles.includes(p))
                    this.stepProjectile(p, dt);
            if (!b.projectiles.length && !b.volley && !this.settleBusy())
                b.resolveAge += dt;
            else
                b.resolveAge = 0;
            if (b.resolveAge > .12)
                this.finishAction();
        }
        else if (b.phase === 'enemy' && b.turnAge > .18 && !this.settleBusy())
            this.enemyAction();
        else if (b.phase === 'transition' && b.turnAge > .16 && !this.settleBusy())
            this.switchTeam();
        else if (b.phase === 'aim' && this.counter % 30 === 0)
            this.checkEnd();
    }
}
