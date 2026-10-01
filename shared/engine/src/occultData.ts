import type {Skill} from './types';

export const ENTHRALL_ACTIONS=[2,3,3,4,4,5,5,6];
export const ENTHRALL_POWER=[.70,.70,.85,.85,1,1,1.15,1.15];
export const ECHO_TURNS=[4,5,5,6,6,7,7,8];
export const ECHO_POWER=[.60,.65,.70,.70,.75,.80,.80,.85];
export const ECHO_LIMIT=[1,1,1,2,2,2,3,3];
export const SPIRIT_TURNS=[4,4,5,5,6,6,7,8];
export const MANIFEST_TURNS=[3,3,4,4,5,5,6,7];
export const WEAK_TURNS=[3,3,4,4,5,5,6,7];
export const BETRAY_TURNS=[2,2,3,3,4,4,5,6];

export function installOccultRedesign(skills:Record<string,Skill>){
 // Keep already flying casts from old saves and old NPC loadouts executable.
 for(const id of ['O08','O09','O10','O13','O14','O15','O99'])skills['L'+id]={...skills[id],id:'L'+id,enemyOnly:true,ultimate:false,legacyId:id};
 const update=(id:string,patch:Partial<Skill>)=>{skills[id]={...skills[id],...patch};};
 update('O01',{name:'혼령탄',tag:'기본 · 혼행',desc:'혼의 기운을 응축해 날린다. 중력과 바람의 영향을 적게 받는다.',damage:31,radius:50,speed:.95,wind:.08,gravity:.18,basic:true,color:'#b7c5bd'});
 update('O06',{tag:'주박 · 쇠약',desc:'부적에 맞은 적의 기세와 방어를 약하게 한다. 경지에 따라 3~7턴 유지된다.',color:'#bdab8d'});
 update('O07',{tag:'주박 · 증오',desc:'부적에 맞은 적이 같은 편에게도 적의 대상으로 보인다. 경지에 따라 2~6턴 유지된다.',color:'#bb9b94'});
 update('O08',{name:'현형부',tag:'주박 · 현형',desc:'부적이 닿은 자리의 혼령형 적을 드러낸다. 주변 적도 함께 현형되어 동료의 눈에 보인다.',cost:30,damage:9,radius:88,mode:'curseManifest',icon:'target',color:'#c6b39a',wind:.48});
 update('O09',{name:'섭혼부',tag:'주박 · 섭혼',desc:'보스가 아닌 적의 혼을 잠시 붙잡아 같은 편으로 싸우게 한다. 적이 행동한 횟수만큼 효력이 소모된다.',cost:44,damage:0,radius:0,mode:'curseEnthrall',icon:'bind',color:'#c1a98e',wind:.48});
 update('O10',{name:'지박부',tag:'주박 비기 · 지박',desc:'넓은 곳에 지박주를 남긴다. 저주받은 적이 쓰러지면 그 자리에 지박령이 머문다.',cost:68,damage:22,radius:150,mode:'curseEarth',icon:'rune',color:'#b6a788',wind:.42,capstone:true});
 update('O11',{name:'배회령',tag:'초혼 · 추적',desc:'혼매듭이 지형에 닿으면 배회령을 부른다. 적은 통과하며, 소단의 행동이 끝나면 가까운 적을 쫓아 공격한다.',damage:0,radius:0,fuse:undefined,color:'#a9bab4'});
 update('O12',{name:'등불귀',tag:'초혼 · 원거리',desc:'허공의 혼매듭에서 등불귀를 부른다. 소단의 행동 뒤 먼 적에게 혼령탄을 보낸다.',damage:0,radius:0,color:'#b6c8b2'});
 update('O13',{name:'호혼령',tag:'초혼 · 수호',desc:'혼매듭에서 동료를 지키는 호혼령을 부른다. 가까운 아군에게 방호를 준다.',cost:36,damage:0,radius:0,mode:'summonWarden',icon:'shield',color:'#9eafa6',fuse:1.45});
update('O14',{name:'먹귀',tag:'초혼 · 투사체 포식',desc:'허공에 먹귀를 묶어 적의 탄을 삼키게 한다. 공격을 받을수록 몸집이 불어나고, 힘이 차면 가까운 적에게 혼을 터뜨린다.',cost:43,damage:0,radius:0,mode:'summonEater',icon:'vortex',color:'#aaa79d',gravity:.12,fuse:1.45});
 update('O15',{name:'반향령',tag:'초혼 비기 · 반향',desc:'소단의 혼행을 되비추는 영체를 묶어둔다. 소단이 혼을 쏘면 반향령들도 각자의 자리에서 같은 목표를 향해 혼행을 펼친다.',cost:78,damage:0,radius:0,mode:'summonEcho',icon:'resonance',color:'#bec3b2',gravity:.18,capstone:true,fuse:1.45});
 skills.O16={id:'O16',cls:'occultist',name:'만혼귀결',tag:'혼행 비기 · 귀결',desc:'흩어진 수많은 혼을 한 점으로 이끈다. 혼령들은 세상의 벽을 넘어 귀결점을 향해 모여든다.',cost:74,damage:76,radius:0,speed:1.55,wind:.10,mode:'spiritConverge',color:'#c4c8b6',icon:'resonance',terrain:.2,gravity:.20,capstone:true,fuse:2.25};
 for(const [id,name,desc,icon,color] of [
  ['OP01','잔부','빗나간 부적이 잠시 남아 닿은 적에게 약한 주박을 건다.','rune','#c7b597'],
  ['OP02','혼맥','주박한 적을 소환령이 우선 찾아 공격한다.','target','#bdada0'],
  ['OP03','분혼','큰 피해의 일부를 가까운 소환령과 나누어 받는다.','shield','#aebdb1'],
  ['OP04','매듭보전','수명이 다한 소환령이 기력을 돌려주고 다음 초혼을 가볍게 한다.','return','#b7b7a5'],
  ['OP05','잔혼','소단의 영향 아래 적이 쓰러지면 잔혼을 모아 다음 기예를 강화한다.','vortex','#c9bda7']
 ])update(id,{name,desc,icon,color});
 // O99 remains as an inaccessible historical definition for saved projectiles only.
 skills.O99.enemyOnly=true;skills.O99.ultimate=false;
}
