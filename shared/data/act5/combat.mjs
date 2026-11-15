import {earlyEncounters} from './encounters-early.mjs';
import {lateEncounters} from './encounters-late.mjs';

const reach=(key,text)=>['reach',key,text];
const fight=(key,text)=>['fight',key,text];
const use=(key,text,cls)=>['use',key,text,cls];
const escort=(key,text)=>['escort',key,text];
const hold=(key,text)=>['hold',key,text];

const names={
 human:'들린 궁수',hound:'들린 산개',boar:'들린 멧돼지',stag:'들린 숫사슴',
 shade:'매듭진 수의귀',ghost:'떠도는 혼',bat:'들린 산박쥐',crow:'들린 까마귀',
 lantern:'혼을 삼킨 등불',warden:'들린 장승',mourner:'들린 상두꾼'
};

// Coordinates are on the 1024-wide terrain review. Each pack owns its wake
// group, independent of the other floors at the same horizontal position.
function pack(key,lane,members,wave){
 return {key,wave,members:members.map(([kind,x,dy=0,special,label])=>({kind,x,y:lane+dy,special,label:label||names[kind]}))};
}
const cue=(key,text,when='objective')=>({key,text,when});
const device=(key,x,y,label,hp)=>({key,x,y,label,hp});

const previousCombat=[
 {rounds:[10,16],active:5,hits:2.55,incoming:.112,eliteHits:4.5,
  required:{campGuard:[252,303,331],watch:[850,877]},
  sites:{campGuard:[291,276],shelter:[305,276],approach:[889,233]},
  flow:[reach('camp','군영 초입에 접근'),fight('campGuard','천막 길목의 창보초·궁수·수의귀 제압'),
   fight('watch','보초막의 수문귀와 궁수 제압'),escort('guide','도식을 보초막까지 호송')],
  packs:[
   pack('campGuard',276,[['mourner',252,0,0,'죽은 창보초'],['human',267],['hound',280],['human',303],['shade',331],['human',347]]),
   pack('lower',378,[['human',363],['hound',389],['shade',460],['mourner',492],['human',509]]),
   pack('ridge',254,[['human',614],['mourner',631],['shade',659],['human',670],['hound',689]]),
   pack('watch',232,[['warden',850,0,'elite','보초막 수문귀'],['human',877],['shade',907],['human',939],['mourner',949]]),
   pack('watch',279,[['human',864],['hound',891]]),
   pack('campGuard',276,[['human',435],['mourner',453],['shade',478]],cue('camp','천막 뒤에서 죽은 보초 셋이 일어납니다.','reach')),
   pack('approach',232,[['mourner',901],['human',930],['shade',953]],cue('guide','산성 쪽 북이 울리고 진입로에 수비대가 나타납니다.','reach'))
  ]},
 {rounds:[10,16],active:5,hits:2.6,incoming:.115,eliteHits:4.5,
  required:{approach:[179,223,247],corridor:[510,534],captain:[888,921,940]},
  sites:{approach:[223,327],palisade:[685,206],corridor:[568,327]},
  devices:[device('drum',733,192,'들린 군북',455)],
  flow:[fight('approach','짐길의 들린 수졸 세 기 제압'),reach('rescue','아래 짐길의 곽진에게 접근'),
   escort('refuge','곽진과 생존병 둘의 대피 엄호','corridor'),
   fight('captain','관문의 군령받이와 호위 둘 제압')],
  packs:[
   pack('approach',327,[['mourner',179],['hound',198],['human',223],['shade',247],['human',278]]),
   pack('outer',225,[['human',339],['human',365],['lantern',395],['shade',413],['human',540],['mourner',559]]),
   pack('palisade',207,[['human',592],['shade',614],['mourner',637],['human',662],['lantern',684]]),
   pack('corridor',327,[['shade',510],['mourner',534],['human',559],['mourner',586]]),
   pack('captain',151,[['warden',888,0,'elite','군령받이'],['human',921],['mourner',940],['shade',964],['human',981]]),
   pack('drumSupport',200,[['human',756],['mourner',784],['shade',807]],cue('refuge','군북에 응해 성책 안쪽에서 수졸 셋이 올라옵니다.','drum'))
  ]},
 {rounds:[15,21],active:6,hits:2.65,incoming:.118,eliteHits:5.1,bossHits:13,
  required:{gateGuard:[199,273,356,404],armorWave:[821,852,891,919]},
  exit:[973,169],sites:{banner:[666,218],gateGuard:[375,218],armorWave:[847,218],sealGuard:[694,218]},
  devices:[device('banner',666,218,'혼이 깃든 군패',395)],
  flow:[fight('gateGuard','암문으로 오르는 길의 선봉조 제압'),fight('banner','성벽의 군패 파괴'),['subdue','commander','장무율을 비살상으로 제압','armorWave'],
   use('commander','소단으로 붙은 혼 분리','occultist')],
  packs:[
   pack('gateGuard',321,[['mourner',199],['human',228],['shade',273],['mourner',391]]),
   pack('gateGuard',218,[['human',356],['human',384],['mourner',404],['shade',427]]),
   pack('high',188,[['human',148],['human',171],['crow',200],['shade',221]]),
   pack('mortar',218,[['shade',472],['human',505],['mourner',524],['human',560],['shade',579]]),
   pack('sealGuard',218,[['warden',642,0,'elite','군패 수문귀'],['human',663],['shade',683],['human',713],['mourner',728]]),
   pack('court',169,[['human',821],['lantern',901],['human',940],['shade',974],['mourner',991]]),
   pack('commander',169,[['human',873,0,'commander','장무율']]),
   pack('armorWave',218,[['mourner',821,-49,0,'군령 갑주'],['human',852,-49,0,'갑주 사수'],['mourner',891,-49,0,'군령 갑주'],['human',919,-49,0,'갑주 사수'],['shade',950]],
    cue('commander','장무율의 군령에 암문 아래 갑주 다섯이 일어납니다.','commander'))
  ]},
 {rounds:[10,16],active:5,hits:2.55,incoming:.114,eliteHits:4.5,
  required:{rootsUpper:[368,448],rootsLower:[399,433],summit:[902,921]},
  sites:{pass:[808,228]},
  flow:[reach('root','거목 아래로 이동'),['pass','roots','위쪽 수목귀·등불 또는 아래 골의 멧돼지·사슴 제압'],
   fight('summit','고갯길을 막는 멧돼지와 산개 제압')],
  packs:[
   pack('approach',301,[['hound',155],['boar',184],['stag',204],['crow',222],['shade',249]]),
   pack('rootsUpper',223,[['warden',368,0,'elite','거목 수목귀'],['crow',396],['shade',419],['lantern',448],['ghost',488],['shade',527]]),
   pack('rootsLower',301,[['hound',369],['boar',399],['stag',433],['shade',451],['hound',478],['ghost',517]]),
   pack('flank',227,[['shade',655],['crow',683],['hound',717],['stag',746],['ghost',762]]),
   pack('summit',164,[['boar',902],['hound',921],['stag',946],['shade',970],['crow',986]]),
   pack('summit',226,[['hound',784],['boar',810],['shade',830]],cue('summit','바위턱 아래에서 짐승 셋이 고갯길로 달려옵니다.','summit'))
  ]},
 {rounds:[10,16],active:5,hits:2.6,incoming:.12,eliteHits:4.5,
  required:{screen:[314,331,378],bier:[624],farGuard:[829,850]},
  sites:{screen:[339,287],bierApproach:[464,280],farGuard:[859,324]},
  devices:[device('tether',494,279,'왼쪽 상여 결박',365),device('tether',561,280,'오른쪽 상여 결박',365)],
  flow:[fight('screen','신목 길목의 돌장승과 혼 둘 제압'),
   reach('bierApproach','빈 상여가 엉킨 고갯마루로 접근'),
   fight('tether','상여를 붙드는 결박 두 곳 파괴'),fight('bier','풀려난 줄상여귀 제압'),
   fight('farGuard','동쪽 석축 길목의 장승과 수의귀 제압')],
  packs:[
   pack('west',286,[['hound',144],['shade',169],['stag',203],['crow',227],['ghost',246]]),
   pack('screen',288,[['warden',314,0,0,'신목 앞 돌장승'],['shade',331],['ghost',352],['mourner',378],['lantern',403],['shade',426]]),
   pack('bier',280,[['warden',624,0,'elite','줄상여귀'],['mourner',645],['lantern',660],['ghost',679],['shade',704]],
    cue('bierApproach','역류한 혼이 상여에 엉겨 붙어 줄상여귀가 일어납니다.','reach')),
   pack('bier',280,[['mourner',579],['ghost',595],['shade',732],['lantern',749]]),
   pack('farGuard',324,[['warden',829,0,'elite','석축 돌장승'],['shade',850],['shade',879],['human',902],['ghost',927]]),
   pack('slope',344,[['shade',955],['hound',971]])
  ]},
 {rounds:[10,16],active:5,hits:2.55,incoming:.111,eliteHits:4.5,
  required:{rimGuard:[188,243,253],stakeTwo:[601,629],eastGuard:[827,854,891,922]},
  sites:{rimGuard:[232,387],eastGuard:[867,487]},
  flow:[fight('rimGuard','기억진목을 막는 상두꾼과 등불 제압'),use('memory','담허로 기억진목 작동','mage'),
   use('stakeOne','담허로 서쪽 석단에 첫 진목 설치','mage'),
   fight('stakeTwo','중앙 진목에 접근하는 수의귀·등불·상두꾼 제압'),
   use('stakeTwo','담허로 중앙 석단에 둘째 진목을 설치해 동작 재현','mage'),
   fight('eastGuard','하강 밧줄을 지키는 동쪽 절벽 수비조 제압')],
  packs:[
   pack('rimGuard',387,[['shade',188],['ghost',227],['lantern',253],['mourner',243]]),
   pack('stakeOne',483,[['shade',297],['ghost',318],['lantern',342]]),
   pack('lower',553,[['shade',475],['bat',516],['lantern',391,42],['ghost',410,42]]),
   pack('stakeTwo',497,[['shade',571],['lantern',601],['mourner',629],['ghost',657],['lantern',682]]),
   pack('eastGuard',487,[['lantern',827],['ghost',854],['shade',891],['ghost',922],['lantern',961]]),
   pack('basin',1083,[['shade',443],['bat',575,-35]])
  ]},
 {rounds:[10,16],active:5,hits:2.6,incoming:.116,eliteHits:4.5,
  required:{reverseGuard:[779,809,838],exitGuard:[898,948]},
  sites:{westGuard:[258,721],eastGuard:[563,718],reverseGuard:[754,585]},
  flow:[use('stakeOne','담허로 서쪽 시험 진목 설치','mage'),use('stakeTwo','담허로 동쪽 시험 진목 설치','mage'),
   hold('center','중앙 석단을 지켜 짧게 진을 안정화'),use('center','역류가 시작됐다 · 담허로 진 거두기','mage'),
   fight('reverseGuard','계단을 막는 역류한 혼 셋 제압'),
   fight('exitGuard','비상 통로를 막는 혼과 등불 제압')],
  packs:[
   pack('westGuard',721,[['shade',193],['ghost',225],['lantern',250],['mourner',279],['shade',304]]),
   pack('eastGuard',721,[['shade',384],['ghost',429],['lantern',467],['mourner',518],['ghost',547],['shade',579]]),
   pack('shaft',940,[['lantern',297],['bat',369],['shade',422],['lantern',478]]),
   pack('exitGuard',391,[['ghost',898],['shade',922],['lantern',948],['ghost',962]]),
   pack('reverseGuard',587,[['lantern',755],['mourner',779],['shade',809],['ghost',838],['lantern',864]],
    cue('center','역류가 오른쪽 계단으로 혼 다섯을 밀어 올립니다.','reverse'))
  ]},
 {rounds:[10,16],active:5,hits:2.65,incoming:.118,eliteHits:4.5,
  required:{eastGuard:[519,547],reflection:[780,759]},
  sites:{westGuard:[306,407],eastGuard:[539,410]},
  flow:[use('stakeOne','담허로 서쪽 진목 설치','mage'),fight('eastGuard','동쪽 진목을 막는 상두꾼과 혼 제압'),
   use('stakeTwo','담허로 동쪽 진목 설치','mage'),
   use('center','소단으로 혼의 흐름을 확인해 제한된 진 가동','occultist'),
   fight('reflection','도구 회수로의 수면흉과 등불 제압'),
   use('tools','오른쪽 석단에서 시험 도구 회수')],
  packs:[
   pack('descent',311,[['lantern',175],['shade',201],['ghost',226],['lantern',254]]),
   pack('westGuard',410,[['shade',284],['lantern',306],['mourner',326],['ghost',353],['shade',375]]),
   pack('eastGuard',413,[['shade',424],['ghost',450],['lantern',472],['mourner',519],['ghost',547],['shade',571]]),
   pack('upper',225,[['lantern',888],['shade',917],['ghost',941],['lantern',967]]),
   pack('reflection',313,[['warden',780,0,'elite','수면흉'],['ghost',740],['lantern',759],['shade',817],['ghost',836]],
    cue('center','수면 아래 비치던 망령 다섯이 오른쪽 회수로에 모습을 드러냅니다.','stable'))
  ]},
 {rounds:[15,21],active:6,hits:2.7,incoming:.123,eliteHits:6,
  required:{lowerGuard:[524,565,592,644],midGuard:[825,855,886],high:[813,865,897,932]},
  sites:{lowerGuard:[592,1304],midGuard:[879,1000]},
  flow:[reach('down','왼쪽 폭포의 낮은 석단으로 하강'),fight('lowerGuard','징검길의 혼과 양쪽 사격조 제압'),
   reach('up','협곡 아래를 건너 오른쪽 중층으로 이동'),
   fight('midGuard','역류를 건너 중층 돌계단의 사격조 제압'),
   fight('high','상층 길목의 역행귀와 엄호조 제압')],
  packs:[
   pack('left',1028,[['lantern',98],['shade',119],['ghost',145],['bat',157]]),
   pack('lowerGuard',1304,[['stag',464],['shade',484],['human',524],['ghost',565],['lantern',592],['human',644],['shade',662]]),
   pack('middleWest',1066,[['lantern',426],['human',479],['shade',505],['human',563],['ghost',584],['lantern',661]]),
   pack('midGuard',1005,[['human',805],['shade',825],['lantern',855],['human',886],['ghost',927],['shade',948]]),
   pack('high',742,[['warden',865,0,'elite','역행귀'],['shade',813],['lantern',897],['human',932],['ghost',970]],
    cue('up','오른쪽 중층에 닿자 상층의 역행귀와 수비조가 모습을 드러냅니다.','reach')),
   pack('rim',380,[['lantern',926],['ghost',953]])
  ]},
 {rounds:[15,21],active:6,hits:2.7,incoming:.125,eliteHits:6,
  required:{firstGuard:[243,257,284,319],path:[855,874,902],gateGuard:[854,879,910]},
  sites:{firstGuard:[337,330],saddle:[593,410],gateGuard:[891,144]},
  flow:[fight('firstGuard','첫 조망터의 능선을 막는 악귀 제압'),reach('view','첫 능선에서 무명사 조망'),
   reach('saddle','낮은 석교를 지나 산문 쪽 능선으로 이동'),
   fight('path','역류가 밀려오는 석교 끝과 산문 아래의 문턱귀 제압'),
   fight('gateGuard','산문 바로 앞의 사격조 제압')],
  packs:[
   pack('firstGuard',335,[['hound',181],['stag',216],['shade',243],['lantern',257],['mourner',284],['ghost',319],['shade',358]]),
   pack('slope',410,[['hound',464],['shade',493],['mourner',513],['ghost',561],['lantern',577],['shade',596]]),
   pack('path',367,[['human',670],['mourner',696],['shade',718],['human',747],['lantern',774],['ghost',795]]),
   pack('path',304,[['warden',855,0,'elite','사찰 문턱귀'],['shade',874],['mourner',902],['lantern',928],['ghost',948]]),
   pack('gateGuard',144,[['shade',828],['ghost',854],['mourner',879],['lantern',910],['shade',986]]),
   pack('path',367,[['mourner',633],['shade',648],['ghost',662],['lantern',681]],
    cue('saddle','석교 건너에서 산 아래로 밀려온 악귀 넷이 합류합니다.','reach'))
  ]}
];

const encounters={...earlyEncounters,...lateEncounters};
export const combat=previousCombat.map((spec,index)=>{
 const next=encounters[41+index];
 return next?{...spec,...next,encounterVersion:next.encounterVersion??5}:spec;
});
