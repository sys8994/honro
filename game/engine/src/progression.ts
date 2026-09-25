import {multishotProfile} from './projectileGrowth';
import { STAGE_PLACES } from './atlasLayout';
import type { ClassId, HeroProgress, Roster, Profile, Unit } from './types';
import { SKILLS, CLASSES } from './data';
import { clamp } from './math';
import { MANA_COST_MULTIPLIER } from './balance';
import { skillBalanceFactor } from './balanceModel';
export const CLASS_IDS: ClassId[] = ['mage', 'archer', 'knight', 'occultist'];
export const MAX_LEVEL = 25;
export const ULTIMATES:Record<ClassId,string>={mage:'M99',archer:'A99',knight:'S99',occultist:'O99'};
export interface Talent {id:string;cls:ClassId;branch:number;row:number;name:string;skill?:string;passive?:'power'|'vitality'|'mana'|'mobility'|'defense'|'regen'|'special';required:number;prereq?:string;maxRank:number;icon:string;desc:string;}
export const BRANCHES:Record<ClassId,{name:string;color:string;tag:string}[]>={
 mage:[{name:'화염',color:'#f2a06b',tag:'폭발과 유성'},{name:'빙결',color:'#8dd5e7',tag:'냉기와 지형'},{name:'비전·뇌전',color:'#c1b0f7',tag:'영역과 방전'},{name:'마력 각인',color:'#dfcd9f',tag:'습득 시 자동 적용'}],
 archer:[{name:'정밀',color:'#a9d6a4',tag:'장거리와 직격'},{name:'사냥',color:'#e0b17e',tag:'추적과 제어'},{name:'곡사',color:'#91c9e9',tag:'분열과 반사'},{name:'궁술 기예',color:'#dfcd9f',tag:'습득 시 자동 적용'}],
 knight:[{name:'강습',color:'#e4a281',tag:'돌격과 강타'},{name:'수호',color:'#93c7e2',tag:'방호와 진입'},{name:'검기',color:'#bbade5',tag:'원거리와 귀환'},{name:'전투 본능',color:'#dfcd9f',tag:'습득 시 자동 적용'}],
 occultist:[{name:'유령',color:'#b897e5',tag:'저중력과 투과'},{name:'저주',color:'#c369a7',tag:'쇠약과 원한'},{name:'소환귀',color:'#7fb3c8',tag:'자동 전투 소환'},{name:'영매술',color:'#d5c4a4',tag:'습득 시 자동 적용'}]
};
const layouts:Record<ClassId,string[][]>={
 mage:[['M01','M02','M06','M13','M05'],['M03','M09','M08','M14','M11'],['M04','M07','M10','M15','M12'],['MP01','MP02','MP03','MP04','MP05']],
 archer:[['A01','A02','A07','A14','A10'],['A05','A06','A09','A13','A08'],['A03','A04','A11','A12','A15'],['AP01','AP02','AP03','AP04','AP05']],
 knight:[['S01','S03','S04','S13','S02'],['S06','S05','S07','S08','S15'],['S09','S10','S11','S14','S12'],['SP01','SP02','SP03','SP04','SP05']],
 occultist:[['O01','O02','O03','O04','O05'],['O06','O07','O08','O09','O10'],['O11','O12','O13','O14','O15'],['OP01','OP02','OP03','OP04','OP05']]
};
export const TALENTS:Talent[]=CLASS_IDS.flatMap(cls=>layouts[cls].flatMap((ids,branch)=>ids.map((id,row)=>({id,cls,branch,row,name:SKILLS[id].name,skill:id,passive:branch===3?'special' as const:undefined,required:(branch===3?[1,3,6,9,12]:[1,3,6,9,12])[row],prereq:branch!==3&&row>0?ids[row-1]:undefined,maxRank:8,icon:SKILLS[id].icon,desc:SKILLS[id].desc}))));
/** Passive ranks depend on training, never on an active-skill slot. */
export function passiveRank(u:Pick<Unit,'side'|'ranks'>,id:string){return u.side===0&&SKILLS[id]?.passive?clamp(Math.floor(u.ranks[id]||0),0,8):0;}
/** Keep the first three ranks' bonuses. Later ranks have gentler, but nonzero, gains. */
export function rankPower(rank:number){const r=clamp(rank,0,8);return Math.min(3,r)+Math.max(0,r-3)*.25;}
export function passivePower(u:Pick<Unit,'side'|'ranks'>,id:string){return rankPower(passiveRank(u,id));}
// Compatibility for existing effect integrations; now explicitly a learned-passive strength.
export const equippedRank = passivePower;
export function skillDamageFactor(rank:number){const n=clamp(rank-1,0,7);return 1+Math.min(2,n)*.16+Math.max(0,n-2)*.08;}
export function skillRadiusFactor(rank:number){const n=clamp(rank-1,0,7);return 1+Math.min(2,n)*.05+Math.max(0,n-2)*.02;}
export function skillManaFactor(rank:number){const n=clamp(rank-1,0,7);return 1-Math.min(2,n)*.08-Math.max(0,n-2)*.035;}
export function knockbackResistance(rank:number){const r=clamp(rank,0,8);return Math.min(.80,Math.min(3,r)*.22+Math.max(0,r-3)*.028);}
export function volleyCount(rank:number){return 1+Math.min(4,Math.max(0,Math.floor(rank)));}
export function volleyDamage(rank:number){return .32+Math.max(0,clamp(rank,0,8)-4)*.03;}
export function requiredRankLevel(n:Talent, rank:number){return Math.min(MAX_LEVEL,n.required+Math.floor(Math.max(0,rank-1)/2));}
export interface EffectRow {label:string; value:string;}
/** These values are shared by the detail panel and the actual formulas below/in Engine. */
export function skillEffectRows(id:string,rank:number):EffectRow[]{
 const s=SKILLS[id];if(!s)return [];const r=clamp(rank,0,8),p=rankPower(r),pct=(v:number)=>`${+(v*100).toFixed(1)}%`,num=(v:number)=>`${+v.toFixed(1)}`;
 const row=(label:string,value:string):EffectRow=>({label,value});
 if(!s.passive){
  const rr=Math.max(1,r),dmg=Math.round(s.damage*skillBalanceFactor(s)*skillDamageFactor(rr)*10)/10,mp=Math.round(s.cost*skillManaFactor(rr)*MANA_COST_MULTIPLIER),rad=Math.round(s.radius*skillRadiusFactor(rr));
  const multi=multishotProfile(s,rr);return [row(s.mode==='triple'?'화살당 피해':'기본 피해',`${Math.round(dmg*(s.mode==='triple'?(multi?.damageScale||1):1)*10)/10}`),...(multi?[row(s.mode==='triple'?'화살 수':multi.waves>1?'파생탄 최대 수':'파생 투사체 수',`${multi.count}`)]:[]),...(s.mode==='triple'&&multi?[row('전체 확산각',`${(2*multi.halfAngle).toFixed(1)}°`)]:[]),row('투사체 속도',`${s.speed.toFixed(2)}×`),...(s.radius>0?[row('효과 반경',`${rad}`)]:[]),row('MP',`${mp}`)];
 }
 const rows:Record<string,EffectRow[]>={
 MP01:[row('잔향 폭발',pct(.18*p))],MP02:[row('폭발 반경',`+${pct(.10*p)}`)],MP03:[row('첫 적중 MP',num(5*p))],MP04:[row('시전 방호',`최대 HP ${pct(.05*p)}`)],MP05:[row('보조탄 피해',`+${pct(.12*p)}`)],
 AP01:[row('연속 발사',`${volleyCount(r)}발`),row('후속탄 위력',r?`${pct(volleyDamage(r))}`:'—')],AP02:[row('탐지 범위',`+${num(65*p)}`),row('직격 피해',`+${pct(.04*p)}`)],AP03:[row('이동 거리',`+${pct(.08*p)}`),row('이동 속도',`+${pct(.04*p)}`)],AP04:[row('속력 피해 배율',`+${pct(.06*p)}`)],AP05:[row('정지 사격 피해',`+${pct(.08*p)}`)],
 SP01:[row('추가 흡인 범위',r?num(65+p*25):'0'),row('흡인력',r?num(100+p*40):'0')],SP02:[row('최대 HP',`+${pct(.05*p)}`),row('피해 감소',`+${num(.03*p*100)}%p`)],SP03:[row('밀치기 저항',pct(knockbackResistance(r)))],SP04:[row('이동 거리',`+${pct(.10*p)}`),row('점프 소비',`${Math.max(15,75-p*15).toFixed(1).replace(/\.0$/,'')}`),row('도약 속력',`+${pct(.035*p)}`)],SP05:[row('불굴 잔여 HP',pct(.08*p))],
 OP01:[row('유령 피해',`+${pct(.055*p)}`),row('중력 영향',`-${pct(Math.min(.6,.08*p))}`)],OP02:[row('저주 지속',`+${Math.floor(p/1.5)}R`),row('저주 강도',`+${pct(.08*p)}`)],OP03:[row('소환귀 HP',`+${pct(.15*p)}`),row('소환귀 피해',`+${pct(.12*p)}`)],OP04:[row('처치 MP',num(6*p))],OP05:[row('저주 대상 추가 피해',`+${pct(.07*p)}`)]
 };return rows[id]||[];
}
export const activeSkills=(ids:string[])=>ids.filter(id=>SKILLS[id]&&!SKILLS[id].passive);
export function ultimateProgress(h:HeroProgress,cls:ClassId){const ids=layouts[cls].slice(0,3).flat();const learned=ids.filter(id=>(h.ranks[id]||0)>0).length;return {learned,total:ids.length};}
export function ultimateUnlocked(h:HeroProgress,cls:ClassId){const p=ultimateProgress(h,cls);return p.learned>=p.total;}
export function ultimateSkill(cls:ClassId){return ULTIMATES[cls];}
export const TALENT_MAP: Record<string, Talent> = Object.fromEntries(TALENTS.map(n => [n.id, n]));
export const baseSkill = (cls: ClassId) => cls === 'mage' ? 'M01' : cls === 'archer' ? 'A01' : cls === 'knight' ? 'S01' : 'O01';
/**
 * 9.1 progression curve.  The previous quadratic curve grew, but its per-level
 * increase was too uniform in play.  This power curve is deliberately convex:
 * early levels remain quick while late levels demand progressively larger gains.
 */
export function xpToNext(level: number) {
 const l=clamp(Math.floor(level),1,MAX_LEVEL);
 return l>=MAX_LEVEL?0:Math.round(180+90*Math.pow(l-1,1.65));
}
export function xpAtLevel(level: number) { let sum = 0; for (let i = 1; i < clamp(level, 1, MAX_LEVEL); i++) sum += xpToNext(i); return sum; }
export const XP_CAP = xpAtLevel(MAX_LEVEL);
/** Exact 9.0 curve, retained only for save migration. */
export function legacyXpToNext9(level:number){const l=clamp(Math.floor(level),1,MAX_LEVEL);return l>=MAX_LEVEL?0:120+80*l+12*l*l;}
export function legacyXpAtLevel9(level:number){let sum=0;for(let i=1;i<clamp(level,1,MAX_LEVEL);i++)sum+=legacyXpToNext9(i);return sum;}
export const LEGACY_XP_CAP_9=legacyXpAtLevel9(MAX_LEVEL);
/** Preserve exact level and within-level progress when importing <=9.0 saves. */
export function migrateLegacyXp9(xp:number){
 const raw=clamp(Math.floor(xp),0,LEGACY_XP_CAP_9);let level=1;
 while(level<MAX_LEVEL&&raw>=legacyXpAtLevel9(level+1))level++;
 if(level>=MAX_LEVEL)return XP_CAP;
 const start=legacyXpAtLevel9(level),need=legacyXpToNext9(level),frac=need?clamp((raw-start)/need,0,1):0;
 return Math.floor(xpAtLevel(level)+frac*xpToNext(level));
}
export function levelOf(hero: HeroProgress | number) { const xp = typeof hero === 'number' ? hero : hero.xp; let l = 1; while (l < MAX_LEVEL && xp >= xpAtLevel(l + 1))
    l++; return l; }
export function xpFraction(h: HeroProgress) { const l = levelOf(h); return l === MAX_LEVEL ? 1 : (h.xp - xpAtLevel(l)) / xpToNext(l); }
export function freshHero(cls: ClassId): HeroProgress { const second=cls==='mage'?'M03':cls==='archer'?'A05':cls==='knight'?'S09':'O06'; return { xp: 0, ranks: { [baseSkill(cls)]: 1, [second]: 1 }, kills: 0, damage: 0 }; }
export function freshRoster(): Roster { return { mage: freshHero('mage'), archer: freshHero('archer'), knight: freshHero('knight'), occultist: freshHero('occultist') }; }
export function pointsEarned(h: HeroProgress) { return 3 + (levelOf(h) - 1) * 2; }
export function pointsSpent(h: HeroProgress, cls: ClassId) { return Object.entries(h.ranks).reduce((s, [id, r]) => s + (TALENT_MAP[id]?.cls === cls ? r - (id === baseSkill(cls) ? 1 : 0) : 0), 0); }
export function pointsLeft(h: HeroProgress, cls: ClassId) { return Math.max(0, pointsEarned(h) - pointsSpent(h, cls)); }
export function trainReason(h: HeroProgress, id: string) { const n = TALENT_MAP[id]; if (!n)
    return '알 수 없는 기술'; if (!h.ranks[baseSkill(n.cls)])
    return '다른 직업의 기술'; const rank = h.ranks[id] || 0; if (rank >= n.maxRank)
    return '최대 랭크'; if (levelOf(h) < requiredRankLevel(n,rank+1))
    return `용병 Lv.${requiredRankLevel(n,rank+1)} 필요`; if (n.prereq && !(h.ranks[n.prereq] > 0))
    return `${TALENT_MAP[n.prereq].name} Lv.1 필요`; if (pointsLeft(h, n.cls) < 1)
    return '스킬 포인트 부족'; return ''; }
export function train(h: HeroProgress, id: string) { if (trainReason(h, id))
    return false; h.ranks[id] = (h.ranks[id] || 0) + 1; return true; }
export function untrainReason(h: HeroProgress, id: string) {
 const n=TALENT_MAP[id]; if(!n)return '알 수 없는 기술';
 const rank=h.ranks[id]||0; if(rank<=0)return '미습득 기술';
 if(id===baseSkill(n.cls)&&rank<=1)return '기본기는 Lv.1 아래로 내릴 수 없습니다';
 // A rank above 1 can always be refunded because prerequisites only require Lv.1.
 if(rank>1)return '';
 const dependent=TALENTS.find(t=>t.cls===n.cls&&t.prereq===id&&(h.ranks[t.id]||0)>0);
 if(dependent)return `${dependent.name}의 선행 기술입니다`;
 return '';
}
export function untrain(h: HeroProgress, id: string) {
 if(untrainReason(h,id))return false;
 const next=(h.ranks[id]||0)-1; if(next>0)h.ranks[id]=next; else delete h.ranks[id];
 return true;
}
export function resetTalents(h: HeroProgress, cls: ClassId) { h.ranks = { [baseSkill(cls)]: 1 }; }
export function autoTrain(h:HeroProgress,cls:ClassId){
 const owned=()=>TALENTS.filter(n=>n.cls===cls&&n.branch<3&&(h.ranks[n.id]||0)>0);
 let guard=100;
 while(pointsLeft(h,cls)>0&&guard-->0){
  const candidates=TALENTS.filter(n=>n.cls===cls&&!trainReason(h,n.id));
  if(!candidates.length)break;
  candidates.sort((a,b)=>{
   const value=(n:Talent)=>{const r=h.ranks[n.id]||0;return n.branch===3? (r===0?9:5-r*.7) : (r===0?(owned().length<5?8:2)-n.row*.15:7-r*.45+(n.id===baseSkill(cls)?.7:0));};
   return value(b)-value(a)||a.branch-b.branch||a.row-b.row;
  });train(h,candidates[0].id);
 }
}
export function knownSkills(h: HeroProgress, cls: ClassId) { const out=Object.values(SKILLS).filter(s => s.cls === cls && !s.ultimate && (h.ranks[s.id] || 0) > 0).map(s => s.id); if(ultimateUnlocked(h,cls)&&SKILLS[ULTIMATES[cls]])out.push(ULTIMATES[cls]); return out; }
export function sanitizeLoadout(p: Profile, cls: ClassId) { const known = activeSkills(knownSkills(p.heroes[cls], cls)), base = baseSkill(cls); const list = [base, ...p.loadouts[cls].filter(s => s !== base && known.includes(s))]; for (const s of known)
    if (list.length < 4 && !list.includes(s))
        list.push(s); p.loadouts[cls] = [...new Set(list)].slice(0, 4); return p.loadouts[cls]; }
// Retained no-op for older callers; concrete learned-passive effects use passivePower.
export function passiveBonus(h:HeroProgress,cls:ClassId,kind:Talent['passive'],branch?:number,loadout:string[]=[]){return 0;}
export function heroStats(h:HeroProgress,cls:ClassId,loadout:string[]=[]){const level=levelOf(h),i=CLASS_IDS.indexOf(cls),L=level-1;
 const rank=(id:string)=>TALENT_MAP[id]?.cls===cls?rankPower(h.ranks[id]||0):0,vitality=rank('SP02'),mobility=rank('AP03'),leap=rank('SP04'),defense=rank('SP02');
 const hpBase=[390,365,610,460][i], hpGain=[32,30,48,36][i], armorBase=[.06,.08,.22,.11][i];
 const hp=(hpBase+L*hpGain)*(1+vitality*.05), atkBase=[1.75,1.75,1.75,1.86][i], atkGain=[.18,.18,.18,.19][i];
 return {level,hp:Math.round(hp),mp:Math.round([120,96,104,144][i]+L*[8,6,7,9.5][i]),attack:atkBase+L*atkGain,armor:Math.min(.62,armorBase+L*.008+defense*.03),move:Math.round(([1120,1100,1210,1150][i]+L*36)*(1+mobility*.08+leap*.10)),speed:Math.round(([282,305,300,296][i]+L*5)*(1+mobility*.04)),regen:[14,14,14,18][i]+Math.floor(L*.6)};}
export function applyHero(u:Unit,h:HeroProgress,full=false){const s=heroStats(h,u.cls,u.loadout),dh=s.hp-u.maxHp,dm=s.mp-u.maxFocus,oldMove=u.maxMove;u.level=s.level;u.hp=u.dead?0:full?s.hp:clamp(u.hp+Math.max(0,dh),0,s.hp);u.maxHp=s.hp;u.focus=full?s.mp:clamp(u.focus+Math.max(0,dm),0,s.mp);u.maxFocus=s.mp;u.attack=s.attack;u.armor=s.armor;u.maxMove=s.move;u.walkSpeed=s.speed;u.regen=s.regen;u.moveLeft=full?s.move:Math.min(s.move,u.moveLeft+Math.max(0,s.move-oldMove));u.ranks={...h.ranks};}
export function grantXP(h: HeroProgress, amount: number) { const before = levelOf(h); const actual = Math.max(0, Math.min(XP_CAP - h.xp, Math.round(amount))); h.xp += actual; return { actual, before, after: levelOf(h) }; }
export function recommendedLevel(stage: number) { return [1,1,2,2,3,4,4,5,5,6,7,8,8,9,10,10,11,12,12,13,14,15,16,17,17,18,19,20,21,22,22,23,23,24,24,25][clamp(Math.floor(stage),1,36)-1]; }
export interface MapNode {
    id: number;
    x: number;
    y: number;
    links: number[];
    previous: number[];
    level: number;
}
const nodes: MapNode[] = [];
for (let r = 0; r < 6; r++) {
    const col = r < 3 ? r : 5 - r, row = r < 3 ? 0 : 1;
    const x = 130 + col * 680, y = 150 + row * 590;
    const offset = [[0, 185], [170, 50], [180, 320], [355, 70], [360, 310], [535, 185]];
    for (let l = 0; l < 6; l++) {
        const id = r * 6 + l + 1;
        const edges = [[1, 2], [3], [4], [5], [5], r < 5 ? [6] : []][l].map(a => r * 6 + 1 + a);
        nodes.push({ id, x: STAGE_PLACES[id-1].x, y: STAGE_PLACES[id-1].y, links: edges, previous: [], level: recommendedLevel(id) });
    }
}
for (const n of nodes)
    for (const to of n.links) {
        const node = nodes.find(a => a.id === to);
        if (node)
            node.previous.push(n.id);
    }
export const MAP_NODES = nodes.sort((a, b) => a.id - b.id);
export function isOpen(p: Profile, id: number) { const n = MAP_NODES[id - 1]; return !!n && (id === 1 || !!p.cleared[String(id)] || n.previous.some(v => !!p.cleared[String(v)])); }
export function mapPath(p: Profile, from: number, to: number) { if (!isOpen(p, to))
    return []; const q = [[from]], seen = new Set([from]); while (q.length) {
    const path = q.shift()!, id = path[path.length - 1];
    if (id === to)
        return path;
    const n = MAP_NODES[id - 1];
    if (!n)
        continue;
    for (const next of [...n.previous, ...n.links])
        if (!seen.has(next) && isOpen(p, next) && (p.cleared[String(id)] || p.cleared[String(next)])) {
            seen.add(next);
            q.push([...path, next]);
        }
} return []; }
export function nextStage(p: Profile) { const last = MAP_NODES[p.mapNode - 1]; return last?.links.find(id => isOpen(p, id) && !p.cleared[String(id)]) || MAP_NODES.find(n => isOpen(p, n.id) && !p.cleared[String(n.id)])?.id || p.mapNode || 1; }
