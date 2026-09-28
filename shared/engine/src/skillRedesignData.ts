import type {Skill} from './types';
import {MANA_COST_MULTIPLIER} from './balance';
import {SKILL_LORE} from './skillLore';

/** Install after the historical definitions: NPC copies retain their exact tuning and modes. */
export function installSkillRedesign(skills:Record<string,Skill>){
 for(const s of Object.values(skills))if(/^[AM](\d\d)$/.test(s.id))skills['L'+s.id]={...s,id:'L'+s.id,legacyId:s.id,enemyOnly:true};
 const rows:[string,string,number,number,number,string,number,string,number?][]=[
  ['A01','평사',43,0,0,'arrow',1.23,'',.55],
  ['A14','급소시',46,30,0,'windArrow',1.52,'distance',.06],['A02','관통시',50,36,0,'pierce',1.28,'distance'],
  ['A06','회기시',40,34,0,'recoveryArrow',1.15,'distance'],['A10','정심',0,0,0,'prepare',1,'distance'],['A99','절명시',96,62,0,'executeArrow',1.55,'distance'],
  ['A11','급락시',48,32,0,'dropArrow',1.06,'drop'],['A09','전로시',42,34,0,'turnArrow',1.13,'drop'],
  ['A13','추혼시',45,38,0,'homing',1.17,'drop'],['A12','귀환시',62,44,0,'return',1.17,'drop'],['A15','칠성추혼',26,60,0,'seekRain',1.10,'drop'],
  ['A05','격퇴시',36,30,0,'push',1,'speed',.42],['A04','산개사',22,38,0,'triple',1.16,'speed',.65],
  ['A07','쇄암시',58,42,70,'breakArrow',1.30,'speed'],['A03','연환시',48,40,0,'chainArrow',1.18,'speed'],['A08','철화',70,64,0,'ironFlower',1.08,'speed'],
  ['M01','기파',34,0,68,'qiPulse',1.05,''],
  ['M06','화호',42,32,88,'gourdFire',.89,'gourd'],['M02','빙호',38,34,96,'gourdIce',1.06,'gourd'],['M04','뇌호',34,38,82,'gourdThunder',1.08,'gourd'],
  ['M13','연폭호',48,46,140,'gourdBurst',.80,'gourd'],['M05','천뢰호',88,68,190,'gourdSky',.91,'gourd'],
  ['M03','원호파',44,32,150,'waveArc',.92,'wave'],['M11','반탄파',46,34,0,'waveBounce',1.02,'wave'],['M12','삼재파',38,42,0,'waveTriangle',1.04,'wave'],
  ['M14','동심파',72,46,0,'waveRing',.74,'wave'],['M15','팔괘파',34,66,220,'waveBagua',.82,'wave'],
  ['M07','파진목',56,30,95,'stakeBlast',.96,'stake'],['M10','회생진목',0,34,45,'stakeHeal',.84,'stake'],['M08','유인진목',30,38,260,'stakePull',.86,'stake'],
  ['M09','축지진목',0,44,45,'stakeGate',.82,'stake'],['M99','오방봉진',35,62,220,'stakeSeal',.88,'stake']
 ];
 const descriptions:Record<string,string>={
 A01:'빠르고 곧게 살을 날린다. SP를 쓰지 않는 기본 공격.',A14:'수평거리만큼 강해지는 정밀 사격. 치명 확률 18~39%, 배율 1.70~2.05배.',
 A02:'1~5명의 적을 더 관통한다. 다음 적마다 88% 피해. 얇은 목재를 관통하고 암반에 멈춘다.',A06:'실제 적 피해의 5~12%를 체력, 3~7%를 기력으로 회수. 한 사격의 회복은 최대 체력 15%, 기력 18%.',
 A10:'이번 행동을 써서 호흡을 고른다. 2턴 안에 다음 절명 사격 한 번의 거리·치명·방어 무시를 강화한다.',A99:'1200 이상 거리에서 치명타로 약해진 적을 처형한다. 보스는 잃은 체력에 따른 추가 피해. 2R 재사용.',
 A11:'최고점 이후 중력이 2.8~4.1배가 된다. 최고점에서 명중점까지의 낙차로 피해 증가.',A09:'비행 중 전장을 한 번 클릭·터치하거나 E로 조준 방향에 선회. 최대 45~80도, 속력 92% 유지.',
 A13:'시야가 열린 적을 완만하게 추적한다. 벽을 통과하지 않으며 낙차에 따라 피해 증가.',A12:'큰 곡선을 그리며 귀환한다. 왕복 각 1회 관통, 귀환 피해 70%, 같은 적 재적중은 추가 20%.',
 A15:'정점에서 일곱 추적 화살로 분열한다. 적을 분산 지정하며 같은 적 최대 4발, 100/70/50/35% 피해. 2R 재사용.',
 A05:'적을 밀어 뒤의 적과 충돌시킨다. 후속 충돌 18% 피해, 힘 70%, 최대 2~5회.',A04:'기존 확산각으로 3~10발을 동시에 발사한다. 연속 시위와 함께 각 사격 묶음이 이어진다.',
 A07:'무거운 살의 직격과 반경 70의 55% 충격. 파괴 가능한 지형에 4.5배 피해.',A03:'첫 적 이후 260 안의 다른 적에게 1~5회 도약한다. 매 도약 피해 72%.',A08:'직격 후 1.5초 동안 8~22개의 짧은 화살을 분출. 각 20%, 한 적의 자탄 피해 총합 65% 상한. 2R 재사용.',
 M01:'지팡이에서 회백색 기파를 보내 작은 압력파를 만든다. SP를 쓰지 않는 기본 공격.',M06:'도자기 호리병이 터지고 6~13개의 짧은 불꽃 파편을 흩뿌린다. 한 적 최대 2파편.',
 M02:'적과 지형에서 튀며 충전에 따라 3.2~6.4초 뒤 터진다. 얼음조각 6~13개, 맞은 적 1턴 20~35% 감속.',M04:'폭발점에서 260~330 안의 모든 적에게 각각 45% 번개. 다른 유닛과 벽을 무시하며 대상당 1회.',
 M13:'큰 폭발 후 1초 동안 반경 240에 작은 폭발 7~14회. 한 적은 최대 3회.',M05:'착탄점을 표시하고 0.35초 뒤 수직 천뢰가 내려온다. 상부 지형에 차폐될 수 있다. 2R 재사용.',
 M03:'적·지형에 닿으면 반경 150, 각도 52~94도의 원호가 충돌점에서 진행 방향에 수직으로 펼쳐진다.',M11:'지형에 2~7회 반사한다. 반사마다 피해 +8%, 최대 +48%. 적에게 닿으면 타격.',
 M12:'발사점과 두 지형 반사점의 삼각형. 경계 38(최대 2변), 내부 16 피해. 작은 삼각형은 내부 피해 없음.',M14:'충전으로 180~900 반지름을 정한다. 내부는 피해 없이 원주만 타격. 피해는 220/r, 최소 28%.',
 M15:'목표에 팔방 기선과 팔각형 외곽 기문을 펼친다. 중심 62, 선 34, 같은 적 최대 3선. 2R 재사용.',M07:'바닥에 고정된 진목. 적이 반경 45에 들어오면 반경 95의 기파를 내고 소멸.',
 M10:'아군이 밟으면 체력 7~14%, 기력 8~15%, 이동력 15~36% 회복 후 소멸.',M08:'적이 밟으면 피해를 주고 260~365 범위 적을 끌어당긴다. 벽은 통과하지 않는다.',
 M09:'첫 설치는 발밑과 착탄점에 진목 한 쌍을 세운다. 최대 두 진목을 유지. 세 번째는 가장 오래된 것을 교체한다. 위에서 E·상호작용으로 건너가며 유닛당 턴에 한 번. 성장하면 도착 회복·방호.',
 M99:'적이 밟으면 오방 진목으로 2R 봉쇄. 내부 감속·이동 예산 감소, 경계를 넘으면 턴당 1회 피해와 안쪽 밀침. 2R 재사용.'};
 for(const [id,name,damage,cost,radius,mode,speed,branch,wind] of rows){
  const old=skills[id],capstone=['A99','A15','A08','M05','M15','M99'].includes(id);
  skills[id]={...old,id,name,damage,cost:cost/MANA_COST_MULTIPLIER,radius,mode,speed,wind:wind??.65,terrain:id==='A07'?4.5:old.terrain,
   redesigned:true,basic:id==='A01'||id==='M01',branch,capstone,ultimate:false,cooldown:capstone?2:undefined,phase:undefined,gravity:1,fuse:id==='M02'?3.2:undefined,
   color:id[0]==='A'?'#ccd0c5':id==='M06'?'#b98a61':'#b9cccf',tag:({distance:'절명',drop:'곡사',speed:'강궁',gourd:'호리병술',wave:'파문술',stake:'진법'} as Record<string,string>)[branch]||'기본 공격',desc:descriptions[id]};
 }
 const passives:Record<string,[string,string]>={
 AP01:['연속 시위','0.5초 간격·±2도로 추가 1~5발. 첫 후속타 42~56%, 이후 66%씩 감쇠.'],AP02:['급소 간파','랭크당 치명 확률 +2%p, 배율 +0.04. 총 확률 65%, 배율 3배 상한.'],
 AP03:['이탈보','사격 해소 뒤 최대 이동력의 12~40%로 후퇴한다. 이동·점프만 가능.'],AP04:['궁세','랭크마다 거리·낙차·속력 계수 +0.025.'],AP05:['일념','가장 많은 SP를 투자한 계통의 계수 +0.025/Lv, 비기 효과 +3%/Lv. 동률은 보류.'],
 MP01:['법맥','호리병 2차 효과 +3%/Lv, 파문 두께·진목 범위와 비피해 효과 +2%/Lv.'],MP02:['기해','최대 기력 +3%/Lv, 턴 회복 +0.5/Lv.'],MP03:['회기','공격 도술 전체가 적에게 피해를 주지 못하면 사용 기력 18~46% 반환. 진목 설치 제외.'],
 MP04:['천기감응','조준에 2차 범위, fuse·반사, 판정 두께, 진목 범위, 대상·분포, 예상 피해를 순서대로 표시.'],MP05:['입도','가장 많은 SP를 투자한 주법 효과 +2.5%/Lv, 주법 비기 효과 +3%/Lv. 동률은 보류.']};
 for(const [id,[name,desc]] of Object.entries(passives))Object.assign(skills[id],{name,desc,redesigned:true,color:'#bfc5b5'});
 for(const [id,desc] of Object.entries(SKILL_LORE))if(skills[id])skills[id].desc=desc;
}
