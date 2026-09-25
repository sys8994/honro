/** Authored geography, not procedural stages. IDs and campaign prerequisites never change. */
export const ATLAS_WIDTH=4400, ATLAS_HEIGHT=3000;
export interface Place {x:number;y:number;place:string;terrain:string;}
export const STAGE_PLACES:Place[]=[
 [790,2160,'서부 변경 · 옛 관도','폐관문'],[940,1910,'서부 변경 · 서벽 유적','석축과 사선'],[1045,2365,'에른 강 · 남쪽 도하점','부서진 도개교'],[1235,1865,'회색 숲 · 북쪽 갈림길','목책과 언덕'],[1370,2300,'에른 강 · 대상로','마차 호위'],[1505,2100,'동부 관문 · 골렘의 보루','성채 입구'],
 [1540,1785,'칼데르 산맥 · 순례자 길','산비탈과 맞바람'],[1690,1450,'칼데르 산맥 · 풍혈','폭포와 수직 절벽'],[1840,1825,'종소리 분지 · 쌍탑','종탑과 교량'],[1930,1285,'칼데르 협곡 · 북쪽 잔도','현수교와 상승기류'],[2195,1585,'폭풍 능선 · 관측소','고지와 수직 발판'],[2215,1180,'바람맞이 수도원 · 대종루','종루와 지붕'],
 [2510,1700,'에른 강 하류 · 수몰 시장','물길과 옥상'],[2685,1500,'연금 지구 · 상부 수로','냉각 운하'],[2690,1915,'연금 지구 · 증류 공방','폭발 용기와 엄폐'],[2930,1600,'에른 운하 · 운송 부두','운송선과 수면'],[2975,2000,'동쪽 제방 · 방수문','수직 수문'],[3195,1800,'침수된 구도심 · 수원 기관','연결된 수로'],
 [3395,2170,'흑요 분지 · 서쪽 갱구','낮은 천장'],[3660,2050,'흑요 분지 · 결정 동굴','반사 광석'],[3430,2460,'검은 채석장 · 남부 화랑','지지대와 낙석'],[3830,2225,'용암 분지 · 승강갱','수직 갱도'],[3660,2680,'검은 채석장 · 구금 갱실','포로 보호'],[3980,2530,'흑요 균열 · 심부 광장','용암과 외피'],
 [3530,1120,'철왕의 도시 · 남쪽 외성','이중 관문'],[3240,970,'서쪽 성곽 · 사수 회랑','다층 사격로'],[3760,870,'왕성 동편 · 깃발 광장','깃발 방어'],[3230,720,'내성 서편 · 결계 탑','방호 장치'],[3720,610,'내성 동편 · 옛 배수로','우회로'],[3490,400,'왕성 중앙 · 흑철 궁정','기사단 결전'],
 [3000,570,'천공 산릉 · 하부 계단','수직 오르막'],[2740,460,'천공 첨탑 · 서쪽 회랑','부유 발판'],[2760,750,'천공 첨탑 · 동쪽 승강로','수직 이동'],[2460,350,'폭풍 나선 · 상부 능선','기류와 반사'],[2470,680,'정상의 세 관문 · 남쪽 단','연속 교전'],[2240,470,'천공 첨탑 · 관측의 정상','최종 결전']
].map(([x,y,place,terrain])=>({x:x as number,y:y as number,place:place as string,terrain:terrain as string}));
export const ATLAS_REGIONS=[
 {name:'회색 변경',en:'THE GREY MARCH',x:1070,y:2665,cx:1150,cy:2140,color:'#b8c2a1'},
 {name:'칼데르 산맥',en:'WINDWARD HEIGHTS',x:1790,y:1040,cx:1850,cy:1570,color:'#aabfcc'},
 {name:'범람한 연금 지구',en:'THE DROWNED QUARTER',x:2820,y:1370,cx:2870,cy:1770,color:'#92b9bd'},
 {name:'흑요 분지',en:'THE OBSIDIAN DEPTHS',x:3530,y:2850,cx:3680,cy:2390,color:'#cfaa8c'},
 {name:'흑철 왕성',en:'THE IRON CITADEL',x:3700,y:1370,cx:3490,cy:820,color:'#c3b89b'},
 {name:'천공 첨탑',en:'THE SKYWARD SPIRE',x:2570,y:160,cx:2600,cy:520,color:'#bcb7da'}
];
export const HUBS=[
 {id:'camp',name:'잿불 주둔지',sub:'용병 · 스킬',action:'camp',button:'용병 관리',icon:'sword',x:495,y:2240,color:'#dec698',desc:'원정대의 거점'},
 {id:'training',name:'바람의 사격장',sub:'훈련',action:'practice',button:'훈련 시작',icon:'target',x:460,y:1910,color:'#9fccc4',desc:'모든 기술을 자유롭게 시험'},
 {id:'arena',name:'폐원형 투기장',sub:'자유 전투',action:'freeplay',button:'전투 선택',icon:'shield',x:810,y:2580,color:'#d7a69c',desc:'전장과 대전을 자유롭게 선택'}
] as const;
export type HubId=typeof HUBS[number]['id'];
