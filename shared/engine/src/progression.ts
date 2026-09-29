import {SALHEUN_TURNS,SALHEUN_RATIO,JUCHEON_DISCOUNT,JUCHEON_EFFECT,JUCHEON_THRESHOLD,COMBO_HITS,ORBIT_BLADES} from './warriorData';
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
 mage:[{name:'호리병술',color:'#b98a61',tag:'봉인과 해방'},{name:'파문술',color:'#bbc9cb',tag:'기하와 파면'},{name:'진법',color:'#a9b496',tag:'진목과 전장'},{name:'도법',color:'#dfcd9f',tag:'습득 시 자동 적용'}],
 archer:[{name:'절명',color:'#bfc8ae',tag:'수평거리'},{name:'곡사',color:'#bbc9cb',tag:'최고점과 낙차'},{name:'강궁',color:'#b9a28a',tag:'충돌 속력'},{name:'궁술 기예',color:'#dfcd9f',tag:'습득 시 자동 적용'}],
 knight:[{name:'검술',color:'#cbd2c6',tag:'근거리와 축세'},{name:'돌격',color:'#c1aa8d',tag:'도약과 돌파'},{name:'검기',color:'#a9c5c7',tag:'검압과 포격'},{name:'무예',color:'#dfcd9f',tag:'습득 시 자동 적용'}],
 occultist:[{name:'유령',color:'#b897e5',tag:'저중력과 투과'},{name:'저주',color:'#c369a7',tag:'쇠약과 원한'},{name:'소환귀',color:'#7fb3c8',tag:'자동 전투 소환'},{name:'영매술',color:'#d5c4a4',tag:'습득 시 자동 적용'}]
};
const layouts:Record<ClassId,string[][]>={
 mage:[['M06','M02','M04','M13','M05'],['M03','M11','M12','M14','M15'],['M07','M10','M08','M09','M99'],['MP01','MP02','MP04','MP03','MP05']],
 archer:[['A14','A02','A06','A10','A99'],['A11','A09','A13','A12','A15'],['A05','A04','A07','A03','A08'],['AP04','AP02','AP01','AP03','AP05']],
 knight:[['S03','S05','S07','S08','S02'],['S01','S06','S04','S15','S13'],['S09','S10','S11','S14','S12'],['SP01','SP02','SP03','SP04','SP05']],
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
export function volleyCount(rank:number){return 1+Math.min(5,Math.max(0,Math.floor(rank)));}
export function volleyDamage(rank:number,index=1){return (.42+.02*(clamp(rank,1,8)-1))*Math.pow(.66,Math.max(0,index-1));}
export function requiredRankLevel(n:Talent, rank:number){return Math.min(MAX_LEVEL,n.required+Math.floor(Math.max(0,rank-1)/2));}
export interface EffectRow {label:string; value:string;}
/** These values are shared by the detail panel and the actual formulas below/in Engine. */
export function skillEffectRows(id:string,rank:number):EffectRow[]{
 const s=SKILLS[id];if(!s)return [];const r=clamp(rank,0,8),p=rankPower(r),pct=(v:number)=>`${+(v*100).toFixed(1)}%`,num=(v:number)=>`${+v.toFixed(1)}`;
 const row=(label:string,value:string):EffectRow=>({label,value});
 if(!s.passive){
  const rr=s.basic?1:Math.max(1,r),dmg=Math.round(s.damage*skillBalanceFactor(s)*skillDamageFactor(rr)*10)/10,mp=Math.round(s.cost*skillManaFactor(rr)*MANA_COST_MULTIPLIER),rad=s.redesigned?({A07:70,M03:150,M15:220+(rr-1)*10,M07:95,M10:45,M08:260+(rr-1)*15,M09:45,M99:220} as Record<string,number>)[id]??Math.round(s.radius*skillRadiusFactor(rr)):Math.round(s.radius*skillRadiusFactor(rr));
  const mix=(a:number,b:number)=>a+(b-a)*(rr-1)/7;
  if(s.martial){
   const melee=s.branch==='sword',extra:Record<string,EffectRow[]>={
    S05:[row('공격 방향','전방 1회 · 후방 1회'),row('근접 중복','아주 가까운 적 최대 2회')],
    S07:[row('연속 베기',`${COMBO_HITS[rr-1]}회`),row('타격 대상','한 명 · 쓰러지면 가까운 적에게 이어짐')],
    S08:[row('받는 피해 감소',pct(mix(.20,.30))),row('반격','근접한 첫 적 1회'),row('반격 피해',num(52*mix(1.10,1.30)))],
    S02:[row('체력 비용','현재 체력 50% · 먼저 소모'),row('소모 체력당 추가 피해',String(+mix(.65,.90).toFixed(3))),row('방어 무시','35%'),row('치명타','캐릭터 치명 능력 적용')],
    S01:[row('착지','해당 위치에 남음 · 한 대상 중심 타격')],S06:[row('경로 명중','각 적 1회 · 관통')],
    S04:[row('급강하','비행 중 발사 버튼 · E · 1회'),row('급강하 위력','135~165% · 외곽으로 감소'),row('재입력 없음','일반 비행·착지 · 75% 피해')],
    S15:[row('지상 적','타격 후 진행 방향으로 밀침'),row('공중 적','타격만 · 통과')],
    S13:[row('착지 후','평참 또는 검술 한 번'),row('후속 행동','이동·돌격·검기 불가 · 검술 후 턴 종료')],
    S10:[row('적','검기 피해 · 끌기 · 근접 도달 시 베기'),row('아군','피해 없이 이동'),row('지형','벽·절벽 앞에서 멈춤')],
    S11:[row('관통','경로의 모든 적 · 대상당 1회')],
    S14:[row('투사체 피해 감소',pct(mix(.50,.70))),row('최대 반응',`${3+Math.floor(rr/2)}회`),row('저장 검세 상한',pct(mix(.35,.45))),row('다음 검기','피해·크기·속도 증가 · 1회 소모')],
    S12:[row('공전 검기',`${ORBIT_BLADES[rr-1]}개`),row('검기별 대상 명중','최대 2회'),row('예상 표시','중심 포물선 하나')]
   };
   return [row(s.id==='S02'?'기초 피해':s.id==='S07'?'한 번의 베기 피해':'기본 피해',num(dmg)),row('기력',num(mp)),...(melee&&!['S08','S02'].includes(s.id)?[row('속발 / 최대 축세 피해','88% / 135%'),row('최대 축세 사거리','123%'),row('속발 비용','75%'),row('속발 수세','최대 12% 피해 감소 · 다음 내 턴까지')]:[]),...(melee?[row('근접 사거리',num(s.radius)),row('기본 전체 각도',`${(s.mode==='meleeWide'?48:s.mode==='counterStance'?40:s.mode==='meleeCombo'?22:25)+(rr-1)*1.5}°`),row('조준','선택 각도를 중심으로 베기'),row('축세 각도 확대','최대 +10° · 검세 경지당 +0.5°')]:[]),...(extra[id]||[]),...(s.cooldown?[row('재사용 대기',`${s.cooldown}턴`)]:[])];
  }
  const extra:Record<string,EffectRow[]>={
   A14:[row('추가 치명 확률',pct(mix(.18,.39))+'p'),row('추가 치명 배율','+'+num(mix(.20,.55))),row('치명 기준','캐릭터의 치명 능력에 합산')],
   A02:[row('추가 관통',`${[1,1,2,2,3,3,4,5][rr-1]}회`),row('관통 후 피해','이전의 88%'),row('지형 관통','얇은 목재')],
   A06:[row('피해에 따른 체력 회수',pct(mix(.05,.12))),row('피해에 따른 기력 회수',pct(mix(.03,.07))),row('한 사격 회복 상한','최대 체력 15% · 기력 18%')],
   A10:[row('집중 유지','2턴 · 다음 절명 사격 1회'),row('거리 위력 가산',pct(mix(.08,.22))),row('치명 확률 가산',pct(mix(.06,.20))),row('방어 무시',pct(mix(.04,.15)))],
   A99:[row('처형 발동 거리','1,200 이상 · 치명타'),row('처형 잔여 체력',pct(mix(.12,.22))),row('추가 치명 확률',pct(mix(.25,.39))+'p'),row('추가 치명 배율','+'+num(mix(.50,.85))),row('보스 추가 피해','잃은 체력에 따라 최대 25%')],
   A11:[row('낙하 가속',num(mix(2.8,4.1))+'배')],
   A09:[row('방향 변경','비행 중 발사 · 클릭 · E · 1회'),row('선회 명중 추가 피해',pct(mix(.30,.65))),row('최대 선회각',num(mix(45,80))+'°'),row('선회 후 속력','92%')],
   A13:[row('추적','시야가 열린 적 · 벽에 차단')],
   A12:[row('관통','왕복 각 1회'),row('귀환 피해','70%'),row('같은 적 재명중','귀환 피해 +20%')],
   A15:[row('분열 화살','7발'),row('같은 적 명중 상한','4발'),row('연속 명중 피해','100 / 70 / 50 / 35%')],
   A05:[row('연쇄 충돌',`${Math.round(mix(2,5))}회`),row('첫 충돌 피해','실제 명중 피해의 18%'),row('다음 충돌의 힘·피해','이전의 70%')],
   A07:[row('주변 충격 피해',num(dmg*.55)),row('지형 피해','4.5배')],
   A03:[row('추가 도약',`${Math.round(mix(1,5))}회`),row('도약 거리','260'),row('도약 후 피해','이전의 72%')],
   A08:[row('분출 시간','1.5초'),row('파편',`${8+2*(rr-1)}개`),row('파편 비행','0.6초 · 초속 560'),row('파편 피해',num(dmg*.20)),row('대상별 파편 피해 상한','직격의 65%')],
   M06:[row('불꽃 파편',`${5+rr}개`),row('파편 피해',num(dmg*.18)),row('대상별 파편 명중','최대 2회')],
   M02:[row('폭발','비행 중 발사 버튼을 다시 누르면 즉시'),row('자동 폭발','3.2~6.4초 · 충전량에 따라 증가'),row('충돌','적과 지형에서 반동'),row('얼음 파편',`${5+rr}개`),row('파편 피해',num(dmg*.16)),row('감속',pct(mix(.20,.35))+' · 1턴'),row('대상별 파편 명중','최대 2회')],
   M04:[row('번개 거리',`${260+10*(rr-1)}`),row('번개 피해',num(dmg*.45)),row('번개 명중','범위 안의 적마다 1회')],
   M13:[row('후속 폭발',`${6+rr}회 · 약 1초`),row('속성·전개','불 · 첫 폭발 주변 공중에 무작위 연쇄'),row('후속 폭발 피해',num(dmg*14/48)),row('후속 폭발 반경','55 · 분포 반경 240'),row('대상별 후속 명중','최대 3회')],
   M05:[row('낙뢰 대기','착탄 후 0.35초'),row('낙뢰 차폐','상부 지형에 가로막힘')],
   M03:[row('발동','적·지형 접촉 시'),row('펼침 방향','충돌 지점에서 진행 방향의 양옆'),row('원호 각도',`${52+6*(rr-1)}°`),row('원호 두께',`${30+2*(rr-1)}`)],
   M11:[row('반사 횟수',`${Math.round(mix(2,7))}회`),row('반사 위력','매번 +8% · 최대 +48%')],
   M12:[row('삼각형 완성','발사점과 지형 반사점 2곳'),row('경계 두께',`${20+2*(rr-1)}`),row('내부 피해',num(dmg*16/38)),row('중복 명중','최대 2변')],
   M14:[row('원주 반경','충전에 따라 180~900'),row('원주 두께',num(mix(34,50))),row('원주 피해','반경 220까지 100% · 확대 시 감소'),row('최소 피해','28% · 원 안쪽 피해 없음')],
   M15:[row('외곽 경계','팔각형'),row('중심 추가 피해',num(dmg*62/34)),row('기선 두께',`${20+2*(rr-1)}`),row('중복 명중','최대 3선')],
   M07:[row('기동 거리','45 · 적이 접근하면 폭발')],
   M10:[row('체력 회복',pct(.06+.01*rr)),row('기력 회복',pct(.07+.01*rr)),row('이동력 회복',pct(.12+.03*rr)),row('사용 횟수','아군마다 매 턴 1회')],
   M08:[row('기동 거리','45 · 적이 접근하면 발동'),row('끌어당김','벽에 가로막힘')],
   M09:[row('첫 설치','발밑·착탄점에 한 쌍'),row('동시 설치','2개 · 초과 시 오래된 진목 교체'),row('이동','진목 위에서 E · 턴당 1회'),row('도착 기력 회복',rr<2?'없음':rr===2?'8%':'10%'),row('도착 체력 회복',rr<4?'없음':rr===4?'6%':'8%'),row('도착 이동력 회복',rr<6?'없음':rr===6?'16%':'24%'),row('도착 방호',rr===8?'적 행동 종료까지':'없음')],
   M99:[row('봉쇄 유지',`${stakeDuration(id,rr)}턴`),row('경계 피해',num(dmg*22/35)+' · 턴당 1회'),row('내부 감속','45%'),row('내부 이동력 감소','35%')],
  };
  const branchRows:EffectRow[]=s.cls==='archer'&&s.branch&&s.id!=='A10'?[row('계통 위력',s.branch==='distance'?`수평거리 1,800에서 최대 +${s.id==='A99'?60:40}%`:s.branch==='drop'?`낙차 900에서 최대 +${s.id==='A15'?55:s.id==='A13'?35:45}%`:`충돌 속력에 따라 최대 +${s.id==='A08'?35:45}%`)]:[];
  const multi=multishotProfile(s,rr);return [row(s.mode==='triple'?'화살당 피해':'기본 피해',`${Math.round(dmg*(s.mode==='triple'?(multi?.damageScale||1):1)*10)/10}`),...(multi?[row(s.mode==='triple'?'화살 수':multi.waves>1?'파생탄 최대 수':'파생 투사체 수',`${multi.count}`)]:[]),...(s.mode==='triple'&&multi?[row('전체 확산각',`${(2*multi.halfAngle).toFixed(1)}°`)]:[]),row('투사체 속도',`${s.speed.toFixed(2)}×`),...(s.radius>0?[row('효과 반경',`${rad}`)]:[]),row('MP',`${mp}`),...(s.redesigned?extra[id]||[]:[]),...branchRows,...(s.branch==='stake'?[row('진목 지속',`${stakeDuration(id,rr)}턴`),row('반복 발동',id==='M10'?'아군마다 턴당 1회':id==='M09'?'유닛마다 턴당 1회':id==='M99'?'지속 봉쇄 · 경계 피해 턴당 1회':'턴당 1회')]:[]),...(s.cooldown?[row('재사용 대기',`${s.cooldown}턴`)]:[])];
 }
 const rows:Record<string,EffectRow[]>={
 MP01:[row('호리병 2차 효과',pct(.03*r)),row('파문 두께·진목 효력',pct(.02*r))],MP02:[row('최대 기력',pct(.03*r)),row('턴 회복',num(.5*r))],MP03:[row('미스 환급',pct(.18+.04*Math.max(0,r-1)))],MP04:[row('예측 정보 단계',num(r))],MP05:[row('완성에 필요한 소비 기력',num(JUCHEON_THRESHOLD[Math.max(0,r-1)])),row('완성 후 비용 감소',pct(r?JUCHEON_DISCOUNT[r-1]:0)),row('도술 효과 강화',pct(r?JUCHEON_EFFECT[r-1]:0)),row('파문 범위 확대 상한','5%'),row('무료 도술','주천 충전 없음')],
 AP01:[row('추가 발사',`${Math.min(5,r)}발`),row('첫 후속타',pct(volleyDamage(r))),row('후속 감쇠','66%')],AP02:[row('추가 치명 확률',pct(.02*r)+'p'),row('추가 치명 배율','+'+num(.04*r))],AP03:[row('후퇴 이동력',pct(r?.08+.04*r:0))],AP04:[row('계통 계수',num(.025*r))],AP05:[row('기억하는 과거 내 턴',`${r?SALHEUN_TURNS[r-1]:0}턴`),row('직전 직접 피해 재현',pct(r?SALHEUN_RATIO[r-1]:0)),row('이전 턴마다 감쇠','55%'),row('발동 제한','한 행동 · 대상마다 1회'),row('후속/파편 화살','연속 시위·철화 자탄 제외')],
 SP01:[row('베기 각도 확대',num(.5*r)+'°'),row('최대 축세 추가 위력',pct(.012*r)),row('최대 축세 추가 사거리',pct(.006*r)),row('돌격 위력',pct(.025*r)),row('검기 속도·크기',pct(.012*r))],SP02:[row('최대 HP',pct(.05*p)),row('피해 감소',pct(.03*p)),row('밀치기 저항',pct(knockbackResistance(r)))],SP03:[row('이동 거리',pct(.10*p)),row('점프 높이 계수',pct((1+.02*r)**2-1)),row('돌격 속도',pct(.015*r)),row('점프 소비',num(Math.max(25,75-5*r)))],SP04:[row('합세 조건','서로 다른 세 계통 · 같은 계통 반복 시 유지'),row('합세 기력 회복',pct(.05+.00625*r)),row('다음 기예 비용','25% 감소'),row('다음 기예 피해','15% 증가'),row('합세 수세','10% 피해 감소 · 다음 내 턴까지')],SP05:[row('불굴 잔여 HP',pct(.08*p)),row('발동 횟수','전투당 1회'),row('회복 자세','18% 피해 감소 · 다음 내 턴까지')],
 OP01:[row('유령 피해',`+${pct(.055*p)}`),row('중력 영향',`-${pct(Math.min(.6,.08*p))}`)],OP02:[row('저주 지속',`+${Math.floor(p/1.5)}R`),row('저주 강도',`+${pct(.08*p)}`)],OP03:[row('소환귀 HP',`+${pct(.15*p)}`),row('소환귀 피해',`+${pct(.12*p)}`)],OP04:[row('처치 MP',num(6*p))],OP05:[row('저주 대상 추가 피해',`+${pct(.07*p)}`)]
 };return rows[id]||[];
}
export const activeSkills=(ids:string[])=>ids.filter(id=>SKILLS[id]&&!SKILLS[id].passive);
export function ultimateProgress(h:HeroProgress,cls:ClassId){const ids=layouts[cls].slice(0,3).flat();const learned=ids.filter(id=>(h.ranks[id]||0)>0).length;return {learned,total:ids.length};}
export function ultimateUnlocked(h:HeroProgress,cls:ClassId){if(cls!=='occultist')return false;const p=ultimateProgress(h,cls);return p.learned>=p.total;}
export function ultimateSkill(cls:ClassId){return ULTIMATES[cls];}
export const TALENT_MAP: Record<string, Talent> = Object.fromEntries(TALENTS.map(n => [n.id, n]));
export const baseSkill = (cls: ClassId) => cls === 'mage' ? 'M01' : cls === 'archer' ? 'A01' : cls === 'knight' ? 'S00' : 'O01';
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
export function freshHero(cls: ClassId): HeroProgress { const second=cls==='mage'?'M03':cls==='archer'?'A05':cls==='knight'?'S09':'O06'; return { xp: 0, ranks: cls!=='occultist'?{[baseSkill(cls)]:1}:{[baseSkill(cls)]:1,[second]:1}, kills: 0, damage: 0, skillRevision:1, martialRevision:1 }; }
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
export function knownSkills(h: HeroProgress, cls: ClassId) { const out=Object.values(SKILLS).filter(s => s.cls === cls && !s.enemyOnly && !s.ultimate && (s.basic || (h.ranks[s.id] || 0) > 0)).map(s => s.id); if(ultimateUnlocked(h,cls)&&SKILLS[ULTIMATES[cls]])out.push(ULTIMATES[cls]); return out; }
export function sanitizeLoadout(p: Profile, cls: ClassId) { const known = activeSkills(knownSkills(p.heroes[cls], cls)), base = baseSkill(cls); const list = [base, ...p.loadouts[cls].filter(s => s !== base && known.includes(s))]; for (const s of known)
    if (list.length < 4 && !list.includes(s))
        list.push(s); p.loadouts[cls] = [...new Set(list)].slice(0, 4); return p.loadouts[cls]; }
// Retained no-op for older callers; concrete learned-passive effects use passivePower.
export function passiveBonus(h:HeroProgress,cls:ClassId,kind:Talent['passive'],branch?:number,loadout:string[]=[]){return 0;}
export function criticalStats(cls:ClassId,level=1,ranks:Record<string,number>={}){
 const base={archer:[.08,1.75,.002,.015],mage:[.04,1.5,.001,.01],knight:[.05,1.6,.0012,.012],occultist:[.06,1.55,.0015,.012]}[cls],L=Math.max(0,level-1),pass=cls==='archer'?(ranks.AP02||0):0;
 return {critChance:Math.min(.65,base[0]+L*base[2]+pass*.02),critMultiplier:Math.min(3,base[1]+L*base[3]+pass*.04)};
}
export function stakeDuration(id:string,rank=1){return (id==='M09'?6:id==='M10'?4:2)+Math.max(0,rank-1);}
export function heroStats(h:HeroProgress,cls:ClassId,loadout:string[]=[]){const level=levelOf(h),i=CLASS_IDS.indexOf(cls),L=level-1;
 const rank=(id:string)=>TALENT_MAP[id]?.cls===cls?rankPower(h.ranks[id]||0):0,vitality=rank('SP02'),mobility=0,leap=rank('SP03'),defense=rank('SP02');
 const hpBase=[390,365,610,460][i], hpGain=[32,30,48,36][i], armorBase=[.06,.08,.22,.11][i];
 const hp=(hpBase+L*hpGain)*(1+vitality*.05), atkBase=[1.75,1.75,1.75,1.86][i], atkGain=[.18,.18,.18,.19][i];
 return {...criticalStats(cls,level,h.ranks),level,hp:Math.round(hp),mp:Math.round(([120,96,104,144][i]+L*[8,6,7,9.5][i])*(1+(cls==='mage'?(h.ranks.MP02||0)*.03:0))),attack:atkBase+L*atkGain,armor:Math.min(.62,armorBase+L*.008+defense*.03),move:Math.round(([1120,1100,1210,1150][i]+L*36)*(1+mobility*.08+leap*.10)),speed:Math.round(([282,305,300,296][i]+L*5)*(1+mobility*.04)),regen:[14,14,14,18][i]+Math.floor(L*.6)+(cls==='mage'?(h.ranks.MP02||0)*.5:0)};}
export function applyHero(u:Unit,h:HeroProgress,full=false){const s=heroStats(h,u.cls,u.loadout),dh=s.hp-u.maxHp,dm=s.mp-u.maxFocus,oldMove=u.maxMove;u.level=s.level;u.hp=u.dead?0:full?s.hp:clamp(u.hp+Math.max(0,dh),0,s.hp);u.maxHp=s.hp;u.focus=full?s.mp:clamp(u.focus+Math.max(0,dm),0,s.mp);u.maxFocus=s.mp;u.attack=s.attack;u.armor=s.armor;u.critChance=s.critChance;u.critMultiplier=s.critMultiplier;u.maxMove=s.move;u.walkSpeed=s.speed;u.regen=s.regen;u.moveLeft=full?s.move:Math.min(s.move,u.moveLeft+Math.max(0,s.move-oldMove));u.ranks={...h.ranks};}
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
