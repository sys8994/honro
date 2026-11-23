const names = {
  human:'들린 궁수', hound:'들린 산개', boar:'들린 멧돼지', stag:'들린 숫사슴',
  shade:'매듭진 수의귀', ghost:'떠도는 혼', crow:'들린 까마귀', lantern:'혼을 삼킨 등불',
  warden:'들린 장승', mourner:'들린 상두꾼',
};

// The two-dimensional coordinates match the 1024-wide review sheet.
// A lift places a flyer above the named support rather than on a second copy of the same lane.
function pack(key, lane, members, options = {}) {
  return {
    key, ...options,
    members: members.map(([kind, x, dy = 0, special, label, pattern, lift]) => ({
      kind, x, y:lane+dy, special, label:label||names[kind], pattern, lift,
    })),
  };
}
const cue = (key, when, text, entry, fallback) => ({key, when, text, entry, fallback});

export const earlyEncounters = {
  41:{
    encounterVersion:6, rounds:[15,18], active:6, hits:1.58, incoming:.104, eliteHits:4.4,
    sites:{campGuard:[323,276], shelter:[305,276], guide:[754,254], approach:[889,233]},
    required:{campGuard:[237,289,334,365,431,509], watch:[849,876,924]},
    flow:[
      ['reach','camp','검은 군영의 천막으로 접근'],
      ['fight','campGuard','천막을 차단한 창보초·봉쇄귀와 이어 오는 적 제압'],
      ['fight','watch','옹벽 위 보초막의 수문귀와 사격조 제압'],
      ['escort','guide','도식을 보초막 앞 옹벽 굽이까지 호송'],
    ],
    packs:[
      // A lone scout breaks the first slope. The central tent seam stays clear for Dosik.
      pack('westScout',300,[['hound',162]]),
      pack('campGuard',276,[
        ['mourner',237,0,undefined,'죽은 창보초'],
        ['human',262], ['hound',289],
        ['warden',334,0,'elite','천막 봉쇄귀','vanguard'], ['human',365],
      ]),
      pack('lowerCamp',326,[
        ['human',205], ['crow',258,17,undefined,undefined,undefined,52],
      ],{wake:{distance:205,height:90}}),
      pack('tentRear',276,[['human',472],['shade',542]]),
      pack('campGuard',276,[['mourner',509,0,undefined,'옹벽 앞의 상두꾼']]),
      pack('lowerPass',378,[['human',598],['lantern',764,-28,undefined,undefined,undefined,68]]),
      pack('ridge',254,[['mourner',640],['human',665],['shade',701]]),
      // A polearm guard can intercept the escort on the ridge. It has no long-range shot into the shelter.
      pack('guideCrossing',254,[['mourner',758]],{
        wake:{distance:164,height:53,after:'watch'},
      }),
      pack('watch',233,[
        ['warden',849,0,'elite','보초막 수문귀','marksman'],
        ['human',876], ['human',924], ['shade',960],
      ]),
      pack('watchFlank',280,[['human',863],['lantern',907,0,undefined,undefined,undefined,49]]),
      pack('campGuard',276,[['human',393],['mourner',431],['shade',464]],{
        wave:cue('camp','reach','천막 뒤의 둔덕에서 묻혀 있던 보초가 일어납니다.',[431,276],[600,254]),
      }),
      pack('approach',232,[['mourner',950],['hound',983],['shade',1003]],{
        wave:cue('guide','reach','산성 북이 울립니다. 옹벽 너머로 수비대가 올라옵니다.',[983,232],[810,253]),
      }),
    ],
  },
  42:{
    encounterVersion:6, rounds:[15,18], active:6, hits:1.55, incoming:.108, eliteHits:4.7,
    sites:{approach:[244,327], rescue:[465,327], palisade:[685,206], corridor:[555,327]},
    required:{approach:[163,219,247,289], corridor:[544,580,620], captain:[880,788,953]},
    flow:[
      ['fight','approach','짐길을 막는 수졸과 사수 제압'],
      ['reach','rescue','아래 짐길의 곽진에게 접근'],
      ['escort','refuge','곽진과 생존병 둘의 대피 엄호','corridor'],
      ['fight','captain','관문의 군령받이와 두 호위 제압'],
    ],
    packs:[
      pack('approach',327,[
        ['mourner',163], ['hound',186], ['human',219], ['shade',247], ['human',289],
      ]),
      // A lone ghost crosses the bend before the survivors. The withdrawal lane remains open.
      pack('rescueScreen',327,[['ghost',394]],{
        wake:{keys:['rescue'],distance:174,height:53,after:'approach'},
      }),
      pack('palisadeWest',225,[['human',302,35], ['human',365], ['lantern',418,0,undefined,undefined,undefined,56]]),
      pack('palisade',204,[
        ['human',506,21], ['shade',581,16], ['mourner',632,6], ['crow',665,0,undefined,undefined,undefined,33],
      ],{wake:{keys:['refuge'],distance:207,height:137,after:'rescue'}}),
      // The evacuation floor is open around the NPCs. Hostiles enter from ahead.
      pack('corridor',327,[['shade',544],['human',580],['mourner',620]],{
        wake:{keys:['refuge'],distance:203,height:74,after:'rescue'},
      }),
      pack('drumOverlook',199,[['human',690]],{
        wake:{distance:165,height:65,after:'rescue'},
      }),
      pack('outerRamp',249,[['human',705,4],['shade',758]],{
        wake:{keys:['captain'],distance:191,height:94,after:'refuge'},
      }),
      pack('captain',151,[
        ['warden',880,0,'elite','군령받이','vanguard'], ['human',788,29], ['mourner',953], ['human',989],
      ]),
      pack('drumSupport',190,[['human',765,-5],['mourner',793,-14],['shade',835,-25]],{
        wave:cue('refuge','drum','들린 군북에 응해 수졸들이 성책 안쪽의 경사로로 올라옵니다.',[793,177],[683,199]),
      }),
    ],
  },
  43:{
    encounterVersion:6, rounds:[18,20], active:7, hits:1.61, incoming:.110, eliteHits:5.0, bossHits:13,
    exit:[973,169],
    sites:{banner:[666,218], gateGuard:[389,218], armorWave:[935,169], sealGuard:[625,218]},
    required:{gateGuard:[181,272,359,407,450,498], armorWave:[922,948,967,997]},
    contest:{commander:{group:'commanderApproach',radius:47,text:'장무율 곁의 수의귀를 밀어내거나 제압하세요'}},
    flow:[
      ['fight','gateGuard','암문 아래와 돌계단 위의 선봉조 제압'],
      ['fight','banner','성벽의 군패 파괴'],
      ['subdue','commander','장무율을 비살상으로 제압','armorWave'],
      ['use','commander','소단으로 붙은 혼 분리','occultist'],
    ],
    packs:[
      pack('gateGuard',321,[['mourner',181],['human',228],['shade',272],['mourner',312]]),
      pack('wallLine',188,[['human',150],['crow',195,-2,undefined,undefined,undefined,42],['human',223,-26]],{
        wake:{distance:195,height:98},
      }),
      pack('gateGuard',218,[['human',359],['mourner',407],['shade',434],['ghost',450,0,undefined,'돌계단의 파수혼'],['human',498]]),
      pack('archFoot',311,[['shade',566,-9],['mourner',638,-9]],{
        wake:{distance:152,height:47,after:'gateGuard'},
      }),
      pack('mortar',218,[['shade',543],['human',576],['mourner',597]]),
      // The inner palisade is the support for the banner, not a separate extermination goal.
      pack('sealGuard',218,[
        ['warden',625,0,'elite','군패 수문귀','device'], ['human',694], ['shade',669], ['hound',722],
        ['crow',752,-28,undefined,undefined,undefined,42],
      ]),
      pack('courtFlank',218,[['hound',801,0,undefined,'지휘소 아래 들린 산개'],['mourner',839]],{wake:{distance:178,height:36,after:'banner'}}),
      pack('court',169,[['human',804],['lantern',832,0,undefined,undefined,undefined,46],['human',983]]),
      pack('commanderApproach',169,[['shade',838]],{
        wake:{distance:157,height:42,after:'banner'},
      }),
      pack('commander',169,[['human',873,0,'commander','장무율','marksman']]),
      // The same four marked suits enter across the high court and lower stair road.
      // Put the fallback on the existing upper landing so its shared offset keeps both tiers.
      pack('armorWave',169,[
        ['mourner',922,49,undefined,'아래 회랑의 군령 갑주'],
        ['human',948,0,undefined,'지휘소 갑주 사수'],
        ['shade',967,49,undefined,'아래 회랑의 결박 갑주'],
        ['ghost',997,0,undefined,'성벽 끝 빈 갑주의 혼'],
      ],{
        wave:cue('commander','commander','깨진 군패가 떨립니다. 위 지휘소와 아래 회랑에서 빈 갑주가 움직입니다.',[948,169],[790,169]),
      }),
    ],
  },
  44:{
    encounterVersion:6,
    rounds:[14,17], active:6, hits:1.49, incoming:.104, eliteHits:4.5,
    sites:{rootFloor:[415,304], boughShelf:[679,214], gullyTurn:[550,303], gullyBend:[717,302], pass:[808,228]},
    passages:{roots:[
      {id:'rootsUpper',label:'위 뿌리 능선',sites:['root','boughShelf']},
      {id:'rootsLower',label:'아래 골',sites:['rootFloor','gullyTurn','gullyBend']},
    ]},
    contest:{
      root:{group:'rootsUpper',radius:101,height:34,label:'수목귀 앞 · 옆 발판에서 예고를 피하기'},
      boughShelf:{group:'nearCrest',radius:93,height:33,label:'뿌리 능선 끝 · 높은 턱의 사선 끊기'},
      rootFloor:{group:'rootsLower',radius:97,height:25,label:'아래 골 어귀 · 멧돼지 돌진을 피하기'},
      gullyTurn:{group:'gullyTurn',radius:65,height:25,label:'골 안턱 · 돌진을 유도하거나 끊기'},
      gullyBend:{group:'gullyMerge',radius:105,height:26,label:'아래 골 굽이 · 측면 사격 끊기'},
      pass:{group:'mergeGuard',radius:92,height:44,text:'합류턱의 수비를 밀어내거나 제압하세요'},
    },
    reachAlternates:{root:['rootFloor']},
    required:{rootsUpper:[368,426,473], rootsLower:[384,422], summit:[869,908,952]},
    flow:[
      ['reach','root','거목의 위 뿌리 능선 또는 아래 골에 접근'],
      ['pass','roots','위 뿌리 능선 또는 아래 골에서 한쪽 길 확보'],
      ['secure','pass','두 길이 만나는 위쪽 바위턱 확보'],
      ['fight','summit','합류 고갯길을 차단한 산짐승 제압'],
    ],
    packs:[
      pack('approach',301,[['hound',155],['boar',181],['stag',227],['shade',252]]),
      pack('firstBough',249,[['crow',284,-3,undefined,undefined,undefined,54]]),
      pack('rootsUpper',223,[
        ['warden',368,0,'elite','거목 수목귀','naruWarden'],
        ['shade',396], ['lantern',426,0,undefined,undefined,undefined,47],
        ['ghost',473,-20], ['shade',513,-29],
      ],{wake:{distance:205,height:60}}),
      pack('rootsLower',304,[
        ['hound',350], ['boar',384], ['stag',422],
      ],{wake:{distance:205,height:52}}),
      pack('nearCrest',212,[
        ['shade',602,-7,undefined,'뿌리턱 수의귀'], ['crow',654,0,undefined,undefined,undefined,52],
        ['hound',697,8], ['human',756,14,undefined,'뿌리턱 끝 사수'],
      ],{wake:{keys:['roots'],distance:142,height:38,after:'root'}}),
      pack('gullyTurn',303,[
        ['boar',530,0,undefined,'골 안턱의 멧돼지'], ['shade',583,0,undefined,'굽이 뒤 수의귀'],
      ],{wake:{keys:['roots'],distance:112,height:29,after:'root'}}),
      pack('gullyMerge',302,[
        ['stag',659,0,undefined,'굽이 아래 숫사슴'], ['hound',707], ['human',767,0,undefined,'굽이 측면 사수'],
      ],{wake:{keys:['roots'],distance:170,height:32,after:'root'}}),
      pack('mergeGuard',226,[
        ['shade',792,0,undefined,'합류턱 아래의 수의귀'],
      ],{wake:{keys:['pass'],distance:134,height:57,after:'roots'}}),
      pack('summit',164,[
        ['boar',869,15,undefined,'합류턱의 멧돼지'], ['hound',908], ['stag',952,0,undefined,'고개 위 숫사슴'],
        ['crow',979,0,undefined,undefined,undefined,44],
      ],{wake:{keys:['pass','summit'],distance:164,height:55,after:'roots'}}),
      pack('crestPursuit',164,[['hound',902],['boar',938],['shade',979]],{
        wave:cue('summit','summit','고갯마루 쪽 돌턱에서 달려오는 산짐승 소리가 들립니다.',[936,164],[912,164]),
      }),
    ],
  },
  45:{
    rounds:[16,19], active:7, hits:1.54, incoming:.098, eliteHits:4.5,
    sites:{screen:[359,302], bierApproach:[464,280], farGuard:[849,325]},
    required:{screen:[252,314,351,391], bier:[624], farGuard:[810,852,889]},
    flow:[
      ['fight','screen','신목 길목을 막는 돌장승과 혼 제압'],
      ['reach','bierApproach','빈 상여가 엉킨 고갯마루로 접근'],
      ['fight','tether','상여를 붙드는 결박 두 곳 파괴'],
      ['fight','bier','풀려난 줄상여귀 제압'],
      ['fight','farGuard','동쪽 석축을 막는 장승과 수비조 제압'],
    ],
    packs:[
      pack('west',297,[['hound',140],['shade',179,-5],['stag',202,-9],['crow',221,-11,undefined,undefined,undefined,62]]),
      pack('screen',280,[
        ['human',252], ['warden',314,0,undefined,'신목 앞 돌장승'],
        ['shade',351,16], ['ghost',374,22], ['mourner',391,22], ['lantern',423,8,undefined,undefined,undefined,30],
      ]),
      pack('saddle',280,[['shade',469],['human',527],['ghost',546]],{
        wake:{keys:['bierApproach','tether'],distance:198,height:94,after:'bierApproach'},
      }),
      pack('bier',280,[
        ['warden',624,0,'elite','줄상여귀','device'],
        ['mourner',655,3], ['lantern',676,21,undefined,undefined,undefined,29],
        ['ghost',713,22], ['shade',738,22],
      ],{
        wave:cue('bierApproach','reach','고갯마루 동편에서 빈 상여의 줄이 당겨집니다.',[655,283],[804,307]),
      }),
      pack('bierSupport',280,[['mourner',581],['ghost',603],['shade',758,22]]),
      pack('farGuard',325,[
        ['warden',810,-15,'elite','석축 돌장승','vanguard'],
        ['mourner',852], ['human',889], ['shade',924,17],
      ]),
      pack('slope',347,[['ghost',954,3],['hound',981,6]]),
    ],
  },
};
