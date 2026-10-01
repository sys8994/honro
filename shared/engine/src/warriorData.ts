import type {Skill} from './types';
import {MANA_COST_MULTIPLIER} from './balance';

export const WARRIOR_REVISION=1;
export const MELEE_REACH_SCALE=.8;
const WARRIOR_ICONS:Record<string,string>={S00:'sword',S03:'wave',S05:'spin',S07:'triple',S08:'shield',S02:'crack',S01:'lift',S06:'wind',S04:'quake',S15:'push',S13:'trail',S09:'crescent',S10:'pull',S11:'pierce',S14:'wall',S12:'vortex'};
export const COMBO_HITS=[3,3,4,4,5,5,6,7];
export const ORBIT_BLADES=[5,5,6,6,7,8,8,9];
export const SALHEUN_TURNS=[1,1,2,2,3,3,3,4];
export const SALHEUN_RATIO=[.12,.15,.15,.18,.18,.21,.24,.24];
export const JUCHEON_DISCOUNT=[.50,.55,.60,.65,.75,.85,.95,1];
export const JUCHEON_EFFECT=[.04,.05,.06,.08,.10,.12,.14,.15];
// Rank-scaled spell costs have a median of 38 at rank 1 and 25 at rank 8.
// Three typical paid casts complete circulation; free casts contribute nothing.
export const JUCHEON_THRESHOLD=[108,104,100,96,92,88,84,78];

export function installWarriorSkills(skills:Record<string,Skill>){
 for(const s of Object.values(skills))if(/^S\d\d$/.test(s.id))skills['L'+s.id]={...s,id:'L'+s.id,legacyId:s.id,enemyOnly:true};
 const rows:[string,string,string,string,number,number,number,string][]=[
  ['S00','평참','sword','melee',52,8,180,'전방을 검으로 벤다. 빠르게 베면 수세를 취하고, 오래 힘을 모으면 사거리와 위력이 증가한다.'],
  ['S03','횡참','sword','meleeWide',65,22,225,'크게 검을 휘둘러 넓은 전방을 벤다. 힘을 모을수록 사거리와 위력이 증가한다.'],
  ['S05','회신참','sword','meleeTurn',41,27,180,'앞을 벤 뒤 몸을 돌려 뒤까지 베어낸다. 포위된 상황에서 특히 강하다.'],
  ['S07','연참','sword','meleeCombo',26,32,165,'가까운 적을 빠르게 연이어 벤다. 적이 쓰러지면 남은 베기를 다음 적에게 이어간다.'],
  ['S08','응수세','sword','counterStance',62,24,185,'호흡을 가다듬으며 몸을 조금 회복하고 검을 세운다. 공격을 견딘 뒤 가까이 들어온 첫 적을 베어낸다.'],
  ['S02','사생참','sword','lifeSlash',116,42,180,'남은 생명의 삼분의 일을 칼날에 싣는다. 자신의 기운을 깎는 대신 깊은 일격을 남긴다.'],
  ['S01','도약참','rush','warriorLeap',62,24,82,'몸을 날려 목표 지점으로 뛰어들며 적을 벤다.'],
  ['S06','회풍참','rush','warriorSweep',48,30,78,'날아가는 길목의 적들을 차례로 베어내며 통과한다.'],
  ['S04','파산격','rush','warriorDive',65,34,175,'날아가는 도중 다시 명령하면 즉시 아래로 내리꽂는다. 높은 곳에서 떨어질수록 충격이 강해진다.'],
  ['S15','쇄진돌격','rush','warriorDrive',58,36,70,'적진을 가르며 전진한다. 지상의 적은 함께 밀어내고 공중의 적은 베고 지나간다.'],
  ['S13','파진연격','rush','warriorFollow',82,62,85,'적진을 베며 돌파한 뒤 곧바로 검술을 이어간다. 착지 후 한 번의 근접 공격을 추가로 사용할 수 있다.'],
  ['S09','월영참','blade','bladeMoon',48,22,0,'검을 휘둘러 날카로운 검기를 멀리 날린다.'],
  ['S10','견인참','blade','bladePull',43,32,0,'검기에 닿은 자를 자신 앞으로 끌어온다. 적은 끌어온 뒤 다시 한 번 베어낸다.'],
  ['S11','관통참','blade','bladePierce',47,34,0,'검기가 적을 꿰뚫으며 계속 날아간다. 지나친 모든 적에게 피해를 준다.'],
  ['S14','검막','blade','bladeScreen',0,28,175,'검압을 남겨 날아오는 공격을 받아낸다. 막아낸 힘은 다음 검기에 실린다.'],
  ['S12','회륜검기','blade','bladeOrbit',36,70,0,'여러 검기를 하나의 궤도에 실어 날린다. 서로 다른 궤도로 공전하는 검기들이 적을 연이어 꿰뚫는다.']
 ];
 for(const [id,name,branch,mode,damage,cost,radius,desc] of rows){const old=skills[id]||skills.S01,capstone=['S02','S13','S12'].includes(id);
  skills[id]={...old,id,name,cls:'knight',branch,mode,damage,cost:cost/MANA_COST_MULTIPLIER,radius:branch==='sword'?radius*MELEE_REACH_SCALE:radius,desc,tag:({sword:'검술',rush:'돌격',blade:'검기'} as Record<string,string>)[branch],color:'#c6d3d2',icon:WARRIOR_ICONS[id],speed:branch==='rush'?(id==='S15'?1.12:.98):1.1,wind:.55,gravity:1,terrain:.3,redesigned:true,martial:true,basic:id==='S00',capstone,ultimate:false,cooldown:undefined,phase:undefined,fuse:undefined};
 }
 skills.S99={...skills.LS99,id:'S99',enemyOnly:true,ultimate:false};
 const passives:Record<string,[string,string]>={
  SP01:['검세','검을 다루는 세 가지 방식이 더욱 날카로워진다.'],
  SP02:['단련','오랜 수련으로 몸과 중심을 단단히 한다. 체력과 방어, 밀림 저항이 증가한다.'],
  SP03:['경신','몸놀림이 가벼워진다. 이동과 도약, 돌격의 거리가 증가한다.'],
  SP04:['연세','서로 다른 검술을 이어 쓸수록 기세가 연결된다. 세 계통을 모두 잇으면 강한 보너스를 얻는다.'],
  SP05:['불굴','전투 중 한 번, 쓰러질 피해를 버텨낸다. 잠시 몸을 추스를 힘을 얻는다.']
 };
 for(const [id,[name,desc]] of Object.entries(passives))Object.assign(skills[id],{name,desc,redesigned:true,martial:true});
 Object.assign(skills.AP05,{name:'살흔',desc:'이전에 맞힌 살이 상처를 남긴다. 같은 적을 다시 맞히면 지난 몇 턴의 화살 피해 일부를 추가로 입힌다.'});
 Object.assign(skills.MP05,{name:'주천',desc:'쓴 기를 몸 안에서 다시 돌린다. 주천이 완성되면 다음 도술을 거의 힘들이지 않고 펼칠 수 있다.'});
}
