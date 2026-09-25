import type {PhysicsEnvironment,PhysicsPatch,PhysicsCue} from './physics';
export type ClassId = 'mage' | 'archer' | 'knight' | 'occultist';
export type Side = 0 | 1 | 2;
export type Material = 'rock' | 'stone' | 'wood' | 'metal' | 'ice' | 'barrel' | 'device' | 'support' | 'crystal';
export type Vec = {
    x: number;
    y: number;
};
export interface Skill {
    passive?: boolean;
    ultimate?: boolean;
    cooldown?: number;
    id: string;
    cls: ClassId;
    name: string;
    tag: string;
    desc: string;
    cost: number;
    damage: number;
    radius: number;
    speed: number;
    wind: number;
    mode: string;
    color: string;
    icon: string;
    terrain: number;
    gravity?: number;
    phase?: 'terrain' | 'all';
    fuse?: number;
    drag?: number;
}
export interface Terrain {
    /** Optional clockwise world-space solid polygon (screen coordinates, y downward). */
    vertices?: Vec[];
    surfaceKind?: string;
    indestructible?: boolean;
    oneWay?: boolean;
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    mat: Material;
    hp: number;
    maxHp: number;
    slope?: number;
    link?: string[];
    expires?: number;
    owner?: string;
    moving?: {
        x: number;
        y: number;
        dx: number;
        dy: number;
    };
    device?: 'wind' | 'sluice' | 'ward';
    broken?: boolean;
    route?: boolean;
}
export interface Water {
    x: number;
    y: number;
    w: number;
    depth: number;
    frozen: number;
    kind?: 'water' | 'lava';
}
export interface Updraft {
    x: number;
    y: number;
    w: number;
    h: number;
    force: number;
    device?: string;
}
export interface Decoration {
    kind: 'tree' | 'pine' | 'ruin' | 'waterfall' | 'house' | 'spire' | 'banner' | 'crystal' | 'torch' | 'arch';
    x: number;
    y: number;
    size: number;
    variant: number;
}
export interface HeroProgress {
    xp: number;
    ranks: Record<string, number>;
    kills: number;
    damage: number;
}
export type Roster = Record<ClassId, HeroProgress>;
export interface ForceField {
    id: string;
    kind: 'gravity' | 'storm' | 'repulsor';
    x: number;
    y: number;
    radius: number;
    strength: number;
}
export interface AIMovePlan {
    round:number;
    targetId:string;
    path:{x:number;y:number;jump:boolean;jumpX?:number}[];
    index:number;
    elapsed:number;
    stalled:number;
    lastX:number;
    lastY:number;
    jumping:boolean;
    intent:string;
}
export interface Unit {
    elite?: boolean;
    summoned?: boolean;
    summonOwner?: string;
    summonKind?: 'stalker' | 'lantern' | 'charger' | 'warden' | 'host';
    summonExpires?: number;
    summonFloating?: boolean;
    impactCooldown?: number;
    impactSource?: string;
    curseOwner?: string;
    curseTurns?: number;
    curseDamage?: number;
    curseAttack?: number;
    curseArmor?: number;
    betrayalUntil?: number;
    combatBaseHp?: number;
    combatBaseAttack?: number;
    aiMove?:AIMovePlan;
    carriedBy?: number;
    lastStandUsed?: boolean;
    refundShot?: number;
    jumping?: boolean;
    moving?: number;
    walkPhase?: number;
    landing?: number;
    stun?: number;
    stunUntil?: number;
    stunnedRound?: number;
    id: string;
    name: string;
    cls: ClassId;
    role: string;
    side: Side;
    x: number;
    y: number;
    vx: number;
    vy: number;
    hp: number;
    maxHp: number;
    r: number;
    h: number;
    focus: number;
    maxFocus: number;
    regen: number;
    level: number;
    attack: number;
    armor: number;
    shield: number;
    shieldUntil?: number;
    bound: number;
    mark: number;
    markSide?: Side;
    breaks: number;
    acted: boolean;
    moveLeft: number;
    maxMove: number;
    walkSpeed: number;
    moveTarget?: number;
    angle: number;
    lastPower: number;
    loadout: string[];
    tune: number;
    facing: number;
    hurt: number;
    anim: number;
    airborne: boolean;
    fixed: boolean;
    boss?: number;
    spawnX: number;
    spawnY: number;
    intent: string;
    dead: boolean;
    healUsed?: number;
    ranks: Record<string, number>;
    group: number;
    awake: boolean;
    lastAct: number;
    aggroUntil: number;
    xpBudget: number;
    xpGranted: number;
    killRewarded: boolean;
    damageBy: Record<string, number>;
    cooldowns?: Record<string, number>;
}
export interface Projectile {
    followup?: boolean;
    gravityScale?: number;
    phaseMode?: 'terrain' | 'all';
    fuseAt?: number;
    skyReturn?: boolean;
    drag?: number;
    skillRank?: number;
    echoUsed?: boolean;
    carry?: string[];
    launchX?: number;
    launchY?: number;
    repeatIndex?: number;
    chain?: number;
    emissions?: number;
    fieldHits?: string[];
    amplification?: number;
    id: number;
    skill: string;
    owner: string;
    side: Side;
    x: number;
    y: number;
    vx: number;
    vy: number;
    prevVy: number;
    age: number;
    radius: number;
    damage: number;
    blast: number;
    wind: number;
    mode: string;
    color: string;
    bounces: number;
    pierces: number;
    apex: boolean;
    hit: string[];
    phase: number;
    body: boolean;
    returnX: number;
    returnY: number;
    trail: Vec[];
    child: boolean;
    rolled: number;
    shot: number;
    directId?: string;
    targetId?: string;
    ultimateBurst?: boolean;
}
export interface Zone {
    id: number;
    kind: 'fire' | 'frost' | 'delay' | 'bomb';
    x: number;
    y: number;
    radius: number;
    owner: string;
    side: Side;
    damage: number;
    expires: number;
    triggerSide?: Side;
    triggerCount?: number;
    attached?: string;
}
export interface EnemySpec {
    y?: number;
    role: string;
    x: number;
    hp?: number;
    boss?: number;
}
export interface Stage {
    physics?:PhysicsPatch & {timeline?:PhysicsCue[]};
    id: number;
    victoryRule?: {kind:'clear'|'boss'|'escort'|'survive'|'capture'|'scripted';target?:string;rounds?:number};
    eventScript?: {id:string;when:'start'|'round'|'unit-dead'|'position'|'objective';round?:number;once?:boolean;action?:string}[];
    region: number;
    local: number;
    name: string;
    subtitle: string;
    brief: string;
    outro: string;
    tip: string;
    objective: 'clear' | 'escort' | 'rescue' | 'defend' | 'wards';
    layout: number;
    wind: number[];
    enemies: EnemySpec[];
    solo?: ClassId;
    boss?: number;
    par: number;
}
export interface Battle {
    physics?:PhysicsEnvironment;
    summonTurn?:{queue:string[];index:number;stage:'approach'|'attack'|'wait';elapsed:number;hold:number;start?:Vec;destination?:Vec;targetId?:string;returnActive:string;practice:boolean};
    vertical?: boolean;
    routePoints?: Vec[];
    volley?: {template: Projectile; remaining: number; elapsed: number; interval: number; index: number; angle: number; power: number};
    reviewLeft?: number;
    reviewFocus?: Vec;
    reviewDamage?: Record<string, number>;
    version: 2;
    revision?: number;
    controlMode?: 'move' | 'aim';
    fields: ForceField[];
    stageId: number;
    mode: 'campaign' | 'practice' | 'skirmish';
    difficulty: 'explorer' | 'story' | 'normal' | 'veteran' | 'nightmare';
    round: number;
    side: Side;
    phase: 'aim' | 'flight' | 'enemy' | 'transition' | 'review' | 'summon' | 'won' | 'lost';
    active: string;
    units: Unit[];
    terrain: Terrain[];
    waters: Water[];
    drafts: Updraft[];
    decor: Decoration[];
    width: number;
    height: number;
    projectiles: Projectile[];
    zones: Zone[];
    wind: number;
    teamEnds: number[];
    queue: string[];
    turnAge: number;
    resolveAge: number;
    nextId: number;
    shot: number;
    shotDamage: Record<string, number>;
    shots: number;
    hits: number;
    kills: number;
    items: Record<string, number>;
    events: string[];
    seed: number;
    rng: number;
    reinforced: number;
    sceneVersion: number;
    winnerReason: string;
    practiceWind?: number;
    practiceDistance?: number;
    startSide?: string;
    lastShots: Record<string, {
        angle: number;
        power: number;
        wind: number;
        skill: string;
        path: Vec[];
    }>;
    heroes: Roster;
    startXP: Record<ClassId, number>;
    rewardGranted: boolean;
    awardIds: string[];
    enemyLimit: number;
    encounter: number;
    session: string;
}
export interface FX {
    kind: 'burst' | 'ring' | 'text' | 'line' | 'meteor' | 'slash' | 'spark' | 'rune';
    x: number;
    y: number;
    vx: number;
    vy: number;
    age: number;
    life: number;
    color: string;
    size: number;
    text?: string;
    x2?: number;
    y2?: number;
}
export interface Settings {
    sound: boolean;
    music: boolean;
    volume: number;
    assist: boolean;
    shake: boolean;
    quality: 'high' | 'low';
    difficulty: 'explorer' | 'story' | 'normal' | 'veteran' | 'nightmare';
    speed: number;
    playerSpeed: number;
    orientation: 'auto' | 'landscape' | 'portrait';
}
export interface Profile {
    version: 2;
    revision?: number;
    cleared: Record<string, {
        stars: number;
        rounds: number;
        shots: number;
        visits?: number;
    }>;
    party: ClassId[];
    loadouts: Record<ClassId, string[]>;
    tuning: Record<ClassId, number>;
    settings: Settings;
    saved: Battle | null;
    lastStage: number;
    mapNode: number;
    tutorial: boolean;
    heroes: Roster;
    migrated?: boolean;
}
export interface Event {
    type: 'fx' | 'sound' | 'change' | 'save' | 'result' | 'message' | 'xp' | 'level';
    name?: string;
    text?: string;
    x?: number;
    y?: number;
    size?: number;
    color?: string;
    value?: number;
    cls?: ClassId;
    x2?: number;
    y2?: number;
}
