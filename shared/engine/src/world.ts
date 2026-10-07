import {makePhysics,reinforceFields} from './physics';
import { stageStrength, setDifficulty, enlargedGroup, makeElite, DIFFICULTIES, campaignEnemyCount, campaignEliteShare, ENEMY_GLOBAL_STAT } from './balance';
import type { Battle, Stage, Terrain, ClassId, Unit, Profile, Material, EnemySpec, Decoration } from './types';
import { topAt, clamp, rng, lerp } from './math';
import { CLASSES, ENEMIES, STAGES } from './data';
import { recommendedLevel, applyHero, baseSkill, heroStats, XP_CAP, activeSkills, knownSkills } from './progression';
export const isVerticalStage=(stage:Stage)=>stage.region===5||[8,11,17,22].includes(stage.id);
export const worldSize=(stage:Stage)=>isVerticalStage(stage)?{width:2400+stage.local*80,height:stage.region===5?3650+stage.local*135:2850+stage.local*75}:{width:4800+stage.region*300+stage.local*110,height:1520};
const profiles = [
    [0, -40, -170, -80, 90, 60, -110, -230, -80, 0, 80],
    [0, 100, 210, 170, -10, -200, -300, -140, 20, -140, 0],
    [0, -160, -210, -100, 180, 240, 160, -30, -270, -210, -40],
    [0, 0, -180, -240, -80, 200, 220, -90, -210, -30, 0],
    [0, -120, -260, 60, 160, -40, -260, -340, -80, 100, 0],
    [0, 50, -180, -180, 100, 160, -100, -180, -320, -320, -250]
];
export function routeHeight(stage: Stage, x: number) {
    const { width } = worldSize(stage), t = clamp((x - 470) / (width - 700), 0, 1), arr = profiles[stage.local], i = Math.min(9, Math.floor(t * 10)), fraction = t * 10 - i;
    const base = [970, 990, 930, 1060, 950, 1010][stage.region], scale = [.7, 1.25, .65, .83, 1.0, 1.08][stage.region];
    return clamp(base + lerp(arr[i], arr[i + 1], fraction) * scale, 410, 1310);
}
export function createWorld(stage: Stage): Pick<Battle,'terrain'|'waters'|'drafts'|'decor'|'width'|'height'|'vertical'|'routePoints'> {
    if(isVerticalStage(stage))return createVerticalWorld(stage);
    const terrain: Terrain[] = [], waters: Battle['waters'] = [], drafts: Battle['drafts'] = [], decor: Decoration[] = [];
    const { width, height } = worldSize(stage), R = rng(stage.id * 4817);
    let n = 0;
    const add = (x: number, y: number, w: number, h: number, mat: Material = 'rock', hp = 99999, id = '', slope = 0, route = false) => { const t: Terrain = { id: id || `r${stage.id}t${++n}`, x, y, w, h, mat, hp, maxHp: hp }; if (slope)
        t.slope = slope; if (route)
        t.route = true; terrain.push(t); return t; };
    // Connected walkable profile, discretised into sloped convex pieces. No scaling of a tiny arena.
    for (let x = 0; x < width; x += 160) {
        const w = Math.min(160, width - x), y = routeHeight(stage, x), end = routeHeight(stage, x + w);
        add(x, y, w, height + 200 - y, 'rock', 99999, `ground_${x}`, end - y, true);
    }
    const platform = (x: number, w: number, lift: number, mat: Material = 'stone') => { const y = routeHeight(stage, x) - lift; const t = add(x, y, w, 22, mat, mat === 'wood' ? 140 : 180, `platform_${++n}`); t.oneWay = true; return t; };
    const ramp = (x: number, w: number, start: number, end: number) => add(x, start, w, Math.max(26, end - start + 26), stage.region <= 1 ? 'wood' : stage.region === 2 || stage.region === 4 ? 'stone' : 'metal', 220, `ramp_${++n}`, end - start, true);
    const barrel = (x: number) => add(x, routeHeight(stage, x) - 45, 34, 45, 'barrel', 28, `barrel_${++n}`);
    const crystal = (x: number) => { const t = add(x, routeHeight(stage, x) - 85, 36, 85, 'device', 100, `ward_${++n}`); t.device = 'ward'; return t; };
    // Environmental props and alternate high ground follow each region's architectural language.
    for (let j = 0; j < 4 + stage.region; j++) {
        const x = 700 + j * (width - 1200) / (3 + stage.region), y = routeHeight(stage, x), v = (stage.local + j) % 4;
        if (stage.region === 0) {
            if (j % 2 === 0) {
                const p = platform(x, 260 + v * 22, 120 + v * 12, 'wood');
                ramp(x - 180, 180, routeHeight(stage, x - 180), p.y);
                ramp(x + p.w, 190, p.y, routeHeight(stage, x + p.w + 190));
                decor.push({ kind: 'ruin', x: x + 125, y: p.y, size: 1.15, variant: v });
            }
            else
                add(x, y - 58 - v * 9, 38, 58 + v * 9, 'wood', 115);
            if (j % 3 === 1)
                barrel(x + 95);
        }
        else if (stage.region === 1) {
            const p = platform(x, 310, 145 + v * 20, 'wood');
            ramp(x - 170, 170, routeHeight(stage, x - 170), p.y);
            ramp(x + 310, 180, p.y, routeHeight(stage, x + 490));
            const sup = add(x + 140, p.y + 22, 24, 150, 'support', 70, `support_${j}`);
            sup.link = [p.id];
            drafts.push({ x: x + 190, y: p.y - 430, w: 180, h: 590, force: 145 + v * 14 });
            decor.push({ kind: 'waterfall', x: x + 65, y: p.y + 28, size: 1.8 + v * .2, variant: j });
            decor.push({ kind: 'spire', x: x + 250, y: routeHeight(stage, x + 250), size: 1.4, variant: j });
        }
        else if (stage.region === 2) {
            const p = platform(x, 245, 115 + v * 15, 'stone');
            ramp(x - 190, 190, routeHeight(stage, x - 190), p.y);
            ramp(x + 245, 170, p.y, routeHeight(stage, x + 415));
            decor.push({ kind: 'house', x: x + 40, y: routeHeight(stage, x + 40), size: 1.4, variant: j });
            const wy = routeHeight(stage, x + 370) - 8;
            waters.push({ x: x + 310, y: wy, w: 185, depth: 45, frozen: stage.local === 1 ? 999 : 0 });
            if (j % 2)
                barrel(x + 440);
            if (stage.local === 3 && j === 2) {
                const m = platform(x + 520, 180, 85, 'wood');
                m.moving = { x: m.x, y: m.y, dx: 80, dy: 0 };
            }
        }
        else if (stage.region === 3) {
            const p = platform(x + 120, 265, 90 + v * 25, 'metal');
            ramp(x - 30, 150, routeHeight(stage, x - 30), p.y);
            ramp(x + 385, 160, p.y, routeHeight(stage, x + 545));
            if (j % 2 === 0) {
                add(x + 55, y - 390, 370, 48, 'rock', 99999, `roof_cave_${j}`);
                decor.push({ kind: 'crystal', x: x + 350, y: routeHeight(stage, x + 350), size: 1.1 + v * .2, variant: j });
            }
            const lx = x + 55;
            waters.push({ x: lx, y: routeHeight(stage, lx) + 13, w: 240, depth: 100, frozen: 0, kind: 'lava' });
            decor.push({ kind: 'torch', x: x + 400, y: routeHeight(stage, x + 400), size: 1.2, variant: j });
        }
        else if (stage.region === 4) {
            const p = platform(x, 270, 180 + v * 15, 'stone');
            ramp(x - 240, 240, routeHeight(stage, x - 240), p.y);
            ramp(x + 270, 220, p.y, routeHeight(stage, x + 490));
            add(x + 115, p.y - 95, 28, 95, 'stone', 160);
            if (j % 2 === 0)
                add(x - 15, p.y - 215, 310, 24, 'stone', 190, `roof_castle_${j}`);
            decor.push({ kind: 'arch', x: x + 125, y: routeHeight(stage, x + 125), size: 1.8, variant: j });
            decor.push({ kind: 'banner', x: x + 235, y: p.y, size: 1.35, variant: j });
        }
        else {
            const p = platform(x, 210, 120 + v * 40, 'metal');
            ramp(x - 190, 190, routeHeight(stage, x - 190), p.y);
            ramp(x + 210, 170, p.y, routeHeight(stage, x + 380));
            if (j % 3 === 1)
                drafts.push({ x: x + 390, y: y - 480, w: 140, h: 490, force: 180 });
            if (j % 2 === 0) {
                const mirror = add(x + 355, routeHeight(stage, x + 355) - 70, 85, 120, 'metal', 240, `mirror_${j}`, -90);
            }
            decor.push({ kind: 'spire', x: x + 100, y: routeHeight(stage, x + 100), size: 1.9, variant: j });
        }
    }
    // A destroyed walkway takes its approach ramps with it, preserving the lower route.
    for (const p of terrain.filter(t => t.id.startsWith('platform_'))) {
        const attached = terrain.filter(t => t.id.startsWith('ramp_') && (Math.abs(t.x + t.w - p.x) < 2 || Math.abs(t.x - p.x - p.w) < 2));
        p.link = attached.map(t => t.id);
    }
    // Foreground silhouettes are decorative only; collision belongs to the explicit terrain.
    const count = stage.region === 0 ? 70 : stage.region === 1 ? 36 : 20;
    for (let i = 0; i < count; i++) {
        const x = 90 + R() * (width - 160), y = routeHeight(stage, x);
        decor.push({ kind: stage.region === 0 ? 'tree' : stage.region === 1 ? 'pine' : stage.region === 3 ? 'crystal' : stage.region === 2 ? 'house' : 'ruin', x, y, size: .55 + R() * .8, variant: Math.floor(R() * 6) });
    }
    if (stage.objective === 'wards')
        for (const x of [width * .39, width * .64, width - .12 * width])
            crystal(x);
    if (stage.boss === 3)
        for (const x of [width - 950, width - 360])
            crystal(x);
    // Campfires are positioned just after encounter groups. They heal once after that group is defeated.
    const groups = 3 + Math.floor(stage.region / 2) + (stage.local % 2);
    for (let g = 0; g < groups; g++) {
        const x = 1150 + g * (width - 2150) / Math.max(1, groups - 1) + 420;
        decor.push({ kind: 'torch', x: Math.min(width - 150, x), y: groundY(terrain, Math.min(width - 150, x)), size: 1, variant: 100 + g });
    }
    return { terrain, waters, drafts, decor, width, height };
}
/** Authored climbing grammar, not a random-level mode. Every link is within the base jump envelope. */
export function createVerticalWorld(stage:Stage):Pick<Battle,'terrain'|'waters'|'drafts'|'decor'|'width'|'height'|'vertical'|'routePoints'>{
 const {width,height}=worldSize(stage),floor=height-180,terrain:Terrain[]=[],waters:Battle['waters']=[],drafts:Battle['drafts']=[],decor:Decoration[]=[],routePoints:{x:number;y:number}[]=[{x:340,y:floor}];
 terrain.push({id:'tower-floor',x:0,y:floor,w:width,h:200,mat:'rock',hp:99999,maxHp:99999,route:true});
 const rise=145,steps=Math.floor((floor-360)/rise),pitch=Math.min(195,(width-720)/8);
 for(let k=1;k<=steps;k++){
  const t=k%16,tri=t<=8?t:16-t,x=340+tri*pitch,y=floor-k*rise,w=k===steps?560:(k%4===0?400:300);
  const center=Math.max(w/2+25,Math.min(width-w/2-25,x));routePoints.push({x:center,y});
  terrain.push({id:'tower-step-'+k,x:center-w/2,y,w,h:24,mat:stage.region===3?'metal':stage.region===1?'wood':'stone',hp:99999,maxHp:99999,oneWay:true,route:true});
  // Optional flank ledges; main climbing chain is indestructible so no class can become locked out.
  if(k%4===2){const xx=center<width/2?width-410:90;terrain.push({id:'tower-side-'+k,x:xx,y:y-55,w:300,h:20,mat:'wood',hp:165,maxHp:165,oneWay:true});decor.push({kind:'banner',x:xx+250,y:y-55,size:1.1,variant:k});}
  if(k%3===0)decor.push({kind:stage.region===1?'spire':stage.region===3?'crystal':'arch',x:center,y,size:k%6===0?1.8:1.2,variant:k});
  if(k%6===3)drafts.push({x:center<width/2?width-250:20,y:y-340,w:180,h:640,force:130});
  if(stage.region===1&&k%5===1)decor.push({kind:'waterfall',x:center+w/2-15,y:y+24,size:1.8,variant:k});
  if(k%4===0&&k<steps)terrain.push({id:'tower-barrel-'+k,x:center+70,y:y-43,w:33,h:43,mat:'barrel',hp:32,maxHp:32});
 }
 if(stage.region===3)waters.push({x:width*.68,y:floor+4,w:width*.24,depth:120,frozen:0,kind:'lava'});
 const groups=Math.ceil((routePoints.length-2)/3);
 for(let g=0;g<groups;g++){const at=routePoints[Math.min(routePoints.length-1,4+g*3)];decor.push({kind:'torch',x:at.x+60,y:at.y,size:1,variant:100+g});}
 return {terrain,waters,drafts,decor,width,height,vertical:true,routePoints};
}
export function groundY(terrain: Terrain[], x: number, prefer = 1800): number {
    const ys = terrain.filter(t => !t.broken && x >= t.x && x <= t.x + t.w && !t.id.startsWith('roof') && !['barrel', 'device', 'support'].includes(t.mat)).map(t => topAt(t, x)).filter(y => y <= prefer);
    return ys.length ? Math.min(...ys) : 970;
}
let unitSequence = 0;
export function makeUnit(cls: ClassId, side: 0 | 1 | 2, x: number, y: number, options: Partial<Unit> = {}): Unit {
    const c = CLASSES[cls];
    return { id: 'u' + (++unitSequence), name: c.person, role: cls, cls, side, x, y, vx: 0, vy: 0, hp: 390, maxHp: 390, r: 21, h: 72, focus: 100, maxFocus: 100, regen: 14, level: 1, attack: 1.75, armor: cls === 'knight' ? .15 : .06, shield: 0, bound: 0, mark: 0, breaks: 0, acted: false, moveLeft: 900, maxMove: 900, walkSpeed: 260, angle: side === 1 ? 136 : 44, lastPower: .55, loadout: [side!==0&&cls==='knight'?'S01':baseSkill(cls)], tune: .5, facing: side === 1 ? -1 : 1, hurt: 0, anim: 0, airborne: false, fixed: false, spawnX: x, spawnY: y, intent: '', dead: false, ...(side===0&&cls==='occultist'?{spiritSight:true}:{}), ranks: {}, group: 0, awake: side !== 1, lastAct: 0, aggroUntil: 0, xpBudget: 0, xpGranted: 0, killRewarded: false, damageBy: {}, ...options };
}
export function makeEnemy(spec: EnemySpec, terrain: Terrain[], stage: Stage, index: number): Unit {
    const e = ENEMIES[spec.role] || ENEMIES.bow, level = recommendedLevel(stage.id), hp = Math.round((spec.hp || e.hp * (1.30 + level * .09)) * stageStrength(stage.id).hp * ENEMY_GLOBAL_STAT);
    return makeUnit(e.cls, 1, spec.x, spec.y ?? groundY(terrain, spec.x), { id: 'e' + index, name: e.name, role: spec.role, hp, maxHp: hp, level, loadout: [...e.skills, ...(e.skills.some(id => id === 'M01' || id === 'A01' || id === 'S01' || id === 'S09') ? [] : [e.cls==='knight'?'S01':baseSkill(e.cls)])], armor: e.armor, attack: (1.05 + level * .08) * stageStrength(stage.id).damage * ENEMY_GLOBAL_STAT, maxFocus: 110 + level * 4, focus: 110 + level * 4, regen: 22, fixed: spec.role === 'ballista', intent: e.intent, xpBudget: 32 + level * 5, moveLeft: 550, maxMove: 550, walkSpeed: 290 });
}
export function createBattle(stageId: number, profile: Profile, mode: Battle['mode'] = 'campaign', opts: {
    party?: ClassId[];
    wind?: number;
    distance?: number;
    startSide?: string;
    solo?: boolean;
} = {}): Battle {
    unitSequence = 0;
    const stage = STAGES[clamp(stageId, 1, 36) - 1], world = createWorld(stage);
    let party: ClassId[] = mode === 'practice' ? (opts.party || ['mage']).slice(0, 1) : ['mage', 'archer', 'knight', 'occultist'];
    const heroes = JSON.parse(JSON.stringify(profile.heroes)) as Profile['heroes'];
    // Deployment is authored from class role instead of placing three identical silhouettes in a row.
    // Some horizontal stages receive a rear firing perch; vertical stages start on staggered route levels.
    const deploy:Record<ClassId,{x:number;y:number}>={} as any;
    if(mode==='practice'){
        for(const [i,cls] of party.entries()){const x=270+i*125;deploy[cls]={x,y:world.vertical?world.height-180:groundY(world.terrain,x)};}
    }else if(world.vertical&&world.routePoints?.length){
        const pts=world.routePoints;
        const at=(i:number)=>pts[Math.min(i,pts.length-1)];
        const k=at(Math.min(2,pts.length-1)),m=at(1),o=at(Math.min(2,pts.length-1)),a=at(stage.id%2?3:2);
        deploy.knight={x:k.x,y:k.y};deploy.mage={x:m.x,y:m.y};deploy.occultist={x:o.x-70,y:o.y};deploy.archer={x:a.x,y:a.y};
    }else{
        const front=520+(stage.local%3)*70,mid=330+(stage.region%2)*45,rear=150+(stage.local%2)*45;
        deploy.knight={x:front,y:groundY(world.terrain,front)};deploy.mage={x:mid,y:groundY(world.terrain,mid)};const spirit=Math.max(rear+105,mid-85);deploy.occultist={x:spirit,y:groundY(world.terrain,spirit)};
        const base=groundY(world.terrain,rear),high=stage.id%3!==0;
        if(high){const py=Math.max(430,base-(150+(stage.id%4)*28));const perch={id:`deploy-perch-${stage.id}`,x:Math.max(35,rear-95),y:py,w:250,h:22,mat:'stone' as const,hp:99999,maxHp:99999,oneWay:true,route:true};world.terrain.push(perch);deploy.archer={x:rear,y:py};}
        else deploy.archer={x:rear,y:base};
    }
    const units = party.map((cls, i) => { const d=deploy[cls]||{x:270+i*125,y:groundY(world.terrain,270+i*125)}; const u = makeUnit(cls, 0, d.x, d.y, { id: 'p' + i, loadout: [...profile.loadouts[cls]], tune: profile.tuning[cls] }); applyHero(u, heroes[cls], true); return u; });
    const roles = [['slinger', 'bow', 'guard', 'fire'], ['bow', 'frost', 'guard', 'healer'], ['storm', 'bomber', 'ward', 'bow'], ['crossbow', 'slinger', 'guard', 'bomber'], ['leaper', 'crossbow', 'healer', 'ward'], ['fire', 'crossbow', 'leaper', 'storm']][stage.region];
    if (mode === 'practice') {
        world.width = 4000;world.height=1520;world.vertical=false;world.routePoints=[];
        world.terrain = [{ id: 'training-ground', x: 0, y: 970, w: 4000, h: 800, mat: 'rock', hp: 99999, maxHp: 99999, route: true }];
        world.waters = [];
        world.drafts = [];
        world.decor = [];
        for (const u of units) {
            u.y = u.spawnY = 970;
            u.focus = u.maxFocus = 999;
            u.moveLeft = u.maxMove = 3000;
            u.loadout = Object.values(CLASS_SKILLS(u.cls)).map(s => s.id).slice(0, 4);
        }
        const tx = clamp(units[0].x + (opts.distance ?? 900), 650, 3650);
        units.push(makeUnit('knight', 1, tx, 970, { id: 'dummy', name: '연습 표적', role: 'dummy', hp: 3000, maxHp: 3000, fixed: true, armor: 0, h: 92, r: 30, loadout: ['S09'], awake: true }));
    }
    else if (mode === 'skirmish') {
        const count = enlargedGroup(8);
        for (let i = 0; i < count; i++){const u=makeEnemy({ role: roles[i % roles.length], x: 1180 + i * 115 }, world.terrain, stage, i);if(i%6===5)makeElite(u);units.push(u);}
        if(world.vertical){world.vertical=false;world.routePoints=[];world.height=1520;world.terrain=[{id:'skirmish-floor',x:0,y:970,w:2900,h:650,mat:'rock',hp:99999,maxHp:99999,route:true}];world.decor=[];world.drafts=[];world.waters=[];for(const u of units){u.y=u.spawnY=970;}} world.width = 2900;
        world.terrain = world.terrain.filter(t => t.x < 2900);
        world.decor = world.decor.filter(d => d.x < 2900);
    }
    else {
        const groups=world.vertical?Math.ceil((world.routePoints!.length-2)/3):3+Math.floor(stage.region/2)+(stage.local%2);
        // campaignEnemyCount is the total encounter population. Boss stages reserve one slot for the boss,
        // so late-game encounters still cap at roughly thirty combatants instead of silently exceeding it.
        const targetTotal=campaignEnemyCount(stage.id), total=Math.max(1,targetTotal-(stage.boss?1:0)), eliteCount=Math.round(total*campaignEliteShare(stage.id));
        let idx=0, remaining=total;
        for(let g=0;g<groups;g++){
          const groupsLeft=groups-g, count=Math.max(1,Math.round(remaining/groupsLeft));remaining-=count;
          const at=world.vertical?world.routePoints![Math.min(world.routePoints!.length-2,2+g*3)]:null;
          const x=at?.x??(1050+g*(world.width-1980)/Math.max(1,groups-1));
          for(let i=0;i<count;i++){
            const spacing=world.vertical?48:Math.max(48,Math.min(76,(world.width/groups-280)/Math.max(1,count)));
            const spec={role:roles[(g+i+stage.local)%roles.length],x:clamp(x+(i-(count-1)/2)*spacing,55,world.width-80),y:at?.y};
            const u=makeEnemy(spec,world.terrain,stage,idx);u.group=g;
            // Evenly distribute a deterministic elite quota; late stages increase quality instead of population.
            if(eliteCount>0 && Math.floor((idx+1)*eliteCount/total)>Math.floor(idx*eliteCount/total))makeElite(u);
            units.push(u);idx++;
          }
        }
        if (stage.boss) {
            const idx = stage.boss, names = ['보루 골렘', '종루의 대포주교', '수로의 심장', '균열의 파수꾼', '흑철 기사단장', '관측성의 주인'], cls: ClassId = idx === 5 ? 'knight' : idx === 2 ? 'archer' : 'mage', x = world.vertical ? world.routePoints!.at(-1)!.x : world.width - 410, level = recommendedLevel(stage.id), hp = Math.round((630 + level * 64) * stageStrength(stage.id).hp * ENEMY_GLOBAL_STAT);
            const u = makeUnit(cls, 1, x, world.vertical?world.routePoints!.at(-1)!.y:groundY(world.terrain, x), { id: 'boss', name: names[idx - 1], role: 'boss', boss: idx, hp, maxHp: hp, r: idx === 5 ? 33 : idx === 6 ? 53 : 68, h: idx === 5 ? 112 : idx === 6 ? 196 : 182, armor: .22, loadout: [['M01', 'M02'], ['A04', 'M07'], ['M04', 'M03'], ['M02', 'M11'], ['S01', 'S06', 'S02'], ['M07', 'M06', 'M05']][idx - 1], fixed: idx !== 5, focus: 180, maxFocus: 180, regen: 36, attack: (1.18 + level * .09) * stageStrength(stage.id).damage * ENEMY_GLOBAL_STAT, level, group: groups, moveLeft: 600, maxMove: 600, intent: '중량 공격', xpBudget: 150 + level * 15 });
            units.push(u);
            world.decor.push({ kind: 'arch', x, y: u.y, size: 2.4, variant: idx });
        }
    }
    if (mode === 'campaign' && ['escort', 'defend', 'rescue'].includes(stage.objective)) {
        const x = stage.objective === 'rescue' ? world.width - 550 : 540, name = stage.objective === 'escort' ? '구호 마차' : stage.objective === 'defend' ? '용병단의 깃발' : '갱도의 포로', hp = stage.objective === 'rescue' ? 700 : 1100;
        units.push(makeUnit('knight', 2, x, groundY(world.terrain, x), { id: 'objective', name, role: stage.objective, hp, maxHp: hp, fixed: true, r: stage.objective === 'escort' ? 45 : 22, h: stage.objective === 'escort' ? 62 : 75, armor: .1, focus: 0, loadout: [] }));
    }
    const fields = mode === 'practice' ? [] : world.vertical ? world.routePoints!.filter((_,i)=>i>2&&i%6===0).map((at,i)=>({id:'tower-field-'+i,kind:(i%2?'storm':'gravity') as 'storm'|'gravity',x:clamp(at.x+(i%2?150:-150),140,world.width-140),y:at.y-150,radius:135,strength:170})) : createFields(stage, world.width, world.terrain);
    reinforceFields(fields);
    const battle: Battle = { version: 2, skillRevision:1, martialRevision:1, revision: 11, physics:makePhysics(stage.physics), controlMode: 'move', fields, reviewDamage:{}, reviewLeft:0, stageId, mode, difficulty: profile.settings.difficulty, round: 1, side: 0, phase: 'aim', active: units[0].id, units, ...world, projectiles: [], zones: [], wind: opts.wind ?? stage.wind[0], teamEnds: [0, 0, 0], queue: [], turnAge: 0, resolveAge: 0, nextId: 1, shot: 0, shotDamage: {}, shots: 0, hits: 0, kills: 0, items: { heal: 3, focus: 3, cleanse: 2, ward: 2 }, events: [], seed: stageId * 19381 + 7, rng: stageId * 19381 + 7, reinforced: 0, sceneVersion: 1, winnerReason: '', practiceWind: opts.wind, practiceDistance: opts.distance, startSide: opts.startSide, lastShots: {}, heroes, startXP: { mage: heroes.mage.xp, archer: heroes.archer.xp, knight: heroes.knight.xp, occultist: heroes.occultist.xp }, rewardGranted: false, awardIds: [], enemyLimit: 10, encounter: 0, session: `${Date.now().toString(36)}-${stageId}` };
    for(const u of battle.units)if(u.side===1&&u.role!=='dummy'){u.combatBaseHp=u.maxHp;u.combatBaseAttack=u.attack;}
    setDifficulty(battle,profile.settings.difficulty);
    return battle;
}
// Late import is safe: definitions are read only when a battle is created.
import { SKILLS } from './data';
function CLASS_SKILLS(cls: ClassId) { return Object.values(SKILLS).filter(s => s.cls === cls); }
/** Physical fields are world objects, not random per-frame effects. Both teams use them. */
export function createFields(stage: Stage, width: number, terrain: Terrain[]): import('./types').ForceField[] {
    if (stage.id === 1)
        return [];
    const result: import('./types').ForceField[] = [];
    const kinds: ('gravity' | 'storm' | 'repulsor')[] = [['gravity', 'repulsor'], ['gravity', 'storm'], ['storm', 'gravity'], ['repulsor', 'gravity'], ['storm', 'repulsor'], ['gravity', 'storm', 'repulsor']][stage.region] as any;
    const count = stage.region >= 3 ? 3 : 2;
    for (let i = 0; i < count; i++) {
        const x = width * (.31 + i * .22), y = groundY(terrain, x) - 210 - (i % 2) * 65;
        result.push({ id: `field-${stage.id}-${i}`, kind: kinds[i % kinds.length], x, y, radius: 165 + (i % 2) * 25, strength: 230 });
    }
    return result;
}
/** v2 save migration is additive: existing allies, XP and in-flight shots are retained. */
export function upgradeBattle(b: Battle, profile: Profile): Battle {
    const old = (b.revision || 0) < 3;
    b.fields ??= [];
    b.controlMode ??= 'move';
    if (old) {
        if (b.mode !== 'practice' && !b.projectiles.length)
            b.fields = createFields(STAGES[b.stageId - 1], b.width, b.terrain);
        if (b.mode !== 'practice' && b.phase !== 'lost')
            for (const cls of ['mage', 'archer', 'knight', 'occultist'] as ClassId[]) {
                if (b.units.some(u => u.side === 0 && u.cls === cls))
                    continue;
                const anchor = b.units.find(u => u.side === 0 && !u.dead) || b.units.find(u => u.side === 0), x = clamp((anchor?.x || 400) - 100, 50, b.width - 50);
                const y = groundY(b.terrain, x, (anchor?.y || 970) + 200), u = makeUnit(cls, 0, x, y, { id: 'reinforcement-' + cls, loadout: [...profile.loadouts[cls]], tune: profile.tuning[cls], acted: b.side !== 0 });
                applyHero(u, b.heroes[cls], true);
                b.units.push(u);
            }
        b.revision = 4;
    }
    if((b.revision||0)<5){
        // Same maps and tree IDs: retain a running battle, including in-flight shots.
        // Passives leave slots, not the roster. New derived maxima do not refill HP/MP.
        for(const u of b.units.filter(v=>v.side===0)){
            const h=b.mode==='campaign'?b.heroes[u.cls]:{...b.heroes[u.cls],ranks:{...u.ranks}};
            const known=activeSkills(knownSkills(h,u.cls)),base=baseSkill(u.cls);
            const ids=[base,...u.loadout.filter(id=>id!==base&&known.includes(id))];
            for(const id of known)if(ids.length<4&&!ids.includes(id))ids.push(id);
            u.loadout=[...new Set(ids)].slice(0,4);
            const hp=u.hp,mp=u.focus,movement=u.moveLeft;
            applyHero(u,h,false);u.hp=u.dead?0:Math.min(hp,u.maxHp);u.focus=Math.min(mp,u.maxFocus);u.moveLeft=Math.min(movement,u.maxMove);
        }
        b.revision=5;
    }
    if((b.revision||0)<6){
        // Preserve existing enemy population, HP and attack until a fresh stage is entered.
        // Hero progression stays untouched; only locomotion maxima are updated.
        for(const u of b.units.filter(v=>v.side===0)){
            const s=heroStats({...b.heroes[u.cls],ranks:{...u.ranks}},u.cls);
            const extra=Math.max(0,s.move-u.maxMove);u.maxMove=s.move;u.moveLeft=Math.min(s.move,u.moveLeft+extra);u.walkSpeed=s.speed;
        }
        b.enemyLimit=DIFFICULTIES[profile.settings.difficulty].active;
        if(b.phase==='review')b.reviewLeft=Math.min(.65,b.reviewLeft||0);
        if(b.volley){b.volley.interval=.5;b.volley.elapsed=Math.min(b.volley.elapsed,.49);}
        b.revision=6;
    }
    if((b.revision||0)<7){
        // v6 and older live battles can now react immediately to the new 5-step difficulty.
        // If the old save predates combatBase*, reconstruct the unscaled value from v6's
        // published difficulty multipliers while preserving the current HP fraction.
        const legacy:any={story:{hp:1.20,damage:1.00},normal:{hp:1.65,damage:1.50},veteran:{hp:2.15,damage:1.95}};
        const prior=legacy[b.difficulty]||legacy.normal;
        for(const u of b.units.filter(v=>v.side===1&&v.role!=='dummy')){
            if(u.combatBaseHp===undefined)u.combatBaseHp=Math.max(1,u.maxHp/prior.hp);
            if(u.combatBaseAttack===undefined)u.combatBaseAttack=Math.max(.01,u.attack/prior.damage);
        }
        if(b.phase==='review')b.reviewLeft=Math.min(.65,b.reviewLeft||0);
        setDifficulty(b,profile.settings.difficulty);
        b.revision=7;
    }

    if((b.revision||0)<8){
        // v8 unifies movement/aim controls and adds per-skill cooldown state.
        // Existing combat state is retained; only missing derived fields are initialized.
        for(const u of b.units){u.cooldowns??={};}
        b.controlMode='move'; // compatibility only; v8 input no longer reads this flag.
        b.revision=8;
    }
    if((b.revision||0)<9){
        // ARCFALL 9 adds the fourth hero without invalidating an in-progress legacy encounter.
        if(b.mode!=='practice'&&!b.units.some(u=>u.side===0&&u.cls==='occultist')){
            const anchor=b.units.find(u=>u.side===0&&!u.summoned&&!u.dead)||b.units.find(u=>u.side===0&&!u.summoned);
            const x=clamp((anchor?.x||360)-75,45,b.width-45),y=groundY(b.terrain,x,(anchor?.y||970)+220);
            const u=makeUnit('occultist',0,x,y,{id:'reinforcement-occultist',loadout:[...profile.loadouts.occultist],tune:profile.tuning.occultist,acted:b.side!==0});applyHero(u,b.heroes.occultist,true);b.units.push(u);
        }
        b.startXP.occultist ??= b.heroes.occultist.xp;
        b.revision=9;
    }
    if((b.revision||0)<10){
        // 9.1 keeps the same hero level/fraction while applying the stronger nonlinear XP
        // migration and Occultist chassis tuning to a live battle. Preserve combat deficits.
        for(const u of b.units.filter(v=>v.side===0&&!v.summoned)){
            const hpFrac=u.maxHp?u.hp/u.maxHp:0,mpFrac=u.maxFocus?u.focus/u.maxFocus:0,moveFrac=u.maxMove?u.moveLeft/u.maxMove:0;
            const wasDead=u.dead;applyHero(u,b.heroes[u.cls],false);u.hp=wasDead?0:Math.max(1,Math.floor(u.maxHp*hpFrac));u.focus=Math.floor(u.maxFocus*mpFrac);u.moveLeft=u.maxMove*moveFrac;u.dead=wasDead;
        }
        b.revision=10;
    }
    if((b.revision||0)<11){
        b.physics=makePhysics(STAGES[b.stageId-1]?.physics);reinforceFields(b.fields);
        for(const u of b.units){if(u.summoned)u.summonFloating=true;u.impactCooldown=0;}
        b.revision=11;
    }
    return b;
}
