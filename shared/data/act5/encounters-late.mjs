const names = {
  shade:'매듭진 수의귀', ghost:'떠도는 혼', lantern:'혼을 삼킨 등불', mourner:'들린 상두꾼',
  bat:'들린 산박쥐', crow:'들린 까마귀', human:'들린 궁수', warden:'들린 장승',
  hound:'들린 산개', stag:'들린 숫사슴',
};
const fight=(key,text)=>['fight',key,text];
const use=(key,text,character)=>['use',key,text,character];
const reach=(key,text)=>['reach',key,text];
const foe=(kind,x,y,extra={})=>({kind,x,y,label:names[kind],...extra});
const flyer=(kind,x,y,lift)=>foe(kind,x,y,{lift});
const boss=(x,y,label,pattern)=>foe('warden',x,y,{label,pattern,special:'elite'});
const pack=(key,keys,distance,height,members,wave,after)=>({key,members,wake:{keys,distance,height,after},wave});
const wave=(key,when,text,entry,fallback)=>({key,when,text,entry,fallback});

// Coordinates refer to the 1024-wide terrain drawing. Y chooses a particular
// support surface, and lift is the distance above it for a flying enemy.
export const lateEncounters = {
  46: {
    rounds:[15,18], active:6, hits:2.08, incoming:.105, eliteHits:4.5,
    required:{rimGuard:[169,218,241],stakeTwo:[581,669],eastGuard:[841,876,921,909]},
    sites:{rimGuard:[219,387],eastGuard:[896,487]},
    contest:{stakeOne:{group:'stakeOne',radius:37},stakeTwo:{group:'stakeTwo',radius:37}},
    flow:[
      fight('rimGuard','기억진목 앞 돌턱의 제기귀와 제등 제압'),
      use('memory','담허로 기억진목 작동','mage'),
      use('stakeOne','담허로 서쪽 부유 석단에 첫 진목 설치','mage'),
      fight('stakeTwo','중앙 석단의 전위와 제등 제압'),
      use('stakeTwo','담허로 중앙 석단에 둘째 진목을 설치해 동작 재현','mage'),
      fight('eastGuard','동쪽 하강로의 제등과 수비조 제압'),
    ],
    packs:[
      pack('rimGuard',['rimGuard','memory'],185,135,[
        foe('shade',169,387,{label:'제기귀'}), flyer('lantern',196,387,54),
        foe('mourner',218,387,{label:'기억진목 수비혼'}), flyer('lantern',241,387,37),
      ]),
      pack('rimOverlook',['memory','stakeOne'],133,146,[
        flyer('bat',247,387,93), flyer('lantern',280,483,54),
      ]),
      pack('stakeOne',['stakeOne'],116,98,[
        foe('ghost',305,483), flyer('lantern',329,483,48),
      ]),
      pack('crownCrossfire',['stakeOne','stakeTwo'],162,165,[
        flyer('lantern',477,553,76), foe('ghost',515,553), flyer('bat',552,497,92),
      ]),
      pack('stakeTwo',['stakeTwo'],163,125,[
        foe('shade',581,497,{label:'부유 석단 제기귀'}), foe('ghost',614,497),
        flyer('lantern',669,497,63), foe('mourner',694,497,{label:'중앙 석단 수비혼'}),
      ]),
      pack('eastApproach',['eastGuard'],129,133,[
        flyer('lantern',722,497,42), flyer('bat',817,487,97),
      ]),
      pack('eastGuard',['eastGuard'],155,151,[
        flyer('lantern',841,487,46), foe('shade',876,487,{label:'동쪽 제기귀'}),
        foe('ghost',921,487),
      ]),
      pack('eastGuard',['eastGuard'],120,138,[
        flyer('lantern',909,782,65), foe('ghost',954,782),
      ]),
    ],
  },
  47: {
    rounds:[15,18], active:6, hits:2.15, incoming:.113, eliteHits:4.5,
    required:{reverseGuard:[712,828,858],exitGuard:[881,910]},
    sites:{westGuard:[253,721],eastGuard:[563,718],reverseGuard:[754,585]},
    contest:{stakeOne:{group:'westGuard',radius:41},stakeTwo:{group:'eastGuard',radius:43}},
    flow:[
      use('stakeOne','담허로 서쪽 시험 진목 설치','mage'), use('stakeTwo','담허로 동쪽 시험 진목 설치','mage'),
      ['hold','center','중앙 석단을 지켜 짧게 진을 안정화'],
      use('center','역류가 시작됐다 · 담허로 진 거두기','mage'),
      fight('reverseGuard','동쪽 계단의 역류 선발조 제압'),
      fight('exitGuard','상층 비상 통로를 막는 수비혼과 제등 제압'),
    ],
    packs:[
      pack('entry',['stakeOne'],154,145,[
        foe('shade',178,721,{label:'들린 제기'}), flyer('lantern',212,721,52), foe('ghost',229,721),
      ]),
      pack('westGuard',['stakeOne','stakeTwo'],146,119,[
        foe('mourner',258,721,{label:'서쪽 진목 주박귀'}), foe('shade',302,721,{label:'들린 제기'}),
        flyer('bat',335,721,85),
      ]),
      pack('bridgeGuard',['stakeTwo','center'],160,169,[
        foe('ghost',389,721), flyer('lantern',428,721,75), flyer('bat',444,940,111),
        foe('shade',472,721,{label:'제의터 잔혼'}),
      ]),
      pack('eastGuard',['stakeTwo','center'],156,143,[
        flyer('lantern',512,721,53), foe('ghost',548,721), foe('mourner',601,721,{label:'동쪽 진목 주박귀'}),
      ]),
      pack('rampWatch',['center','reverseGuard'],156,160,[
        foe('shade',650,677,{label:'계단 길목 제기귀'}), flyer('lantern',696,636,46),
      ]),
      pack('exitGuard',['reverseGuard','exitGuard'],130,105,[
        foe('ghost',881,403,{label:'상층 비상로 수비혼'}), flyer('lantern',910,392,49),
        foe('shade',960,390,{label:'벽감 제기귀'}), flyer('lantern',938,391,87),
      ]),
      pack('reverseGuard',['reverseGuard'],170,165,[
        foe('mourner',712,621,{label:'역류로 밀려온 주박귀'}), flyer('lantern',746,589,55),
      ],wave('center','reverse','동쪽 굽이에서 역류가 올라옵니다. 제기귀가 계단으로 들어옵니다.',[729,605],[751,584])),
      pack('reverseGuard',['reverseGuard','exitGuard'],153,133,[
        foe('shade',828,585,{label:'역류한 제기귀'}), foe('ghost',858,585), flyer('lantern',865,585,69),
      ],wave('center','reverse','계단 안쪽 바위턱에서도 혼불이 올라옵니다.',[844,585],[817,585])),
    ],
  },
  48: {
    rounds:[16,19], active:6, hits:2.18, incoming:.113, eliteHits:4.7,
    required:{eastGuard:[505,565],reflection:[778,811]},
    sites:{westGuard:[306,407],eastGuard:[539,410],reflection:[778,312]},
    contest:{stakeOne:{group:'westGuard',radius:42},stakeTwo:{group:'eastGuard',radius:45}},
    flow:[
      use('stakeOne','담허로 서쪽 진목 설치','mage'), fight('eastGuard','동쪽 진목을 막는 주박귀와 수비혼 제압'),
      use('stakeTwo','담허로 동쪽 진목 설치','mage'),
      use('center','소단으로 혼의 흐름을 확인해 제한된 진 가동','occultist'),
      fight('reflection','도구 회수로의 수면흉과 앞쪽 제등 제압'), use('tools','오른쪽 석단에서 시험 도구 회수'),
    ],
    packs:[
      pack('descent',['stakeOne'],158,145,[
        flyer('lantern',177,310,40), foe('shade',200,319,{label:'낙하로 제기귀'}), foe('ghost',232,347),
      ]),
      pack('leftLanding',['stakeOne'],116,118,[
        flyer('lantern',257,362,75), foe('mourner',276,403,{label:'하강로 주박귀'}),
        flyer('bat',306,409,58),
      ]),
      pack('westGuard',['stakeOne','eastGuard'],169,137,[
        foe('shade',345,411,{label:'서쪽 진목 제기귀'}), flyer('lantern',369,411,53),
        foe('ghost',402,413),
      ]),
      pack('eastGuard',['eastGuard','stakeTwo','center'],178,166,[
        flyer('lantern',476,415,78), foe('mourner',505,413,{label:'동쪽 진목 주박귀'}),
        foe('ghost',565,408,{label:'진목 수비혼'}), foe('shade',584,395,{label:'갈라진 석단 제기귀'}),
      ]),
      pack('recoveryAscent',['stakeTwo','reflection','tools'],155,155,[
        flyer('lantern',598,382,39), foe('ghost',630,356), foe('shade',670,354,{label:'회수로 제기귀'}),
      ]),
      pack('upper',['reflection','tools'],181,135,[
        flyer('lantern',845,232,43), foe('ghost',885,196), foe('shade',931,182,{label:'상층 석물귀'}),
      ]),
      pack('reflection',['reflection'],178,138,[
        boss(778,312,'수면흉','resonance'), flyer('lantern',811,310,45), foe('ghost',827,301),
      ],wave('center','stable','오른쪽 석단 끝 물그림자에서 수면흉이 올라옵니다.',[800,311],[834,294])),
      pack('reflection',['reflection','tools'],154,135,[
        flyer('lantern',849,279,85), foe('shade',875,202,{label:'반사에 붙은 제기귀'}),
      ],wave('center','stable','암반 여울 위에 맺힌 반사에서 제등과 석물이 나타납니다.',[860,260],[886,241])),
    ],
  },
  49: {
    rounds:[18,20], active:7, hits:2.2, incoming:.119, eliteHits:5.1,
    required:{lowerGuard:[373,427,515,613],midGuard:[820,871,927],high:[808,853,902,961]},
    sites:{lowerGuard:[515,1304],midGuard:[873,1000]},
    flow:[
      reach('down','왼쪽 폭포의 낮은 석단으로 하강'),
      fight('lowerGuard','하층 징검길의 돌짐승과 폭포 아래쪽 사격조 제압'),
      reach('up','협곡 아래를 건너 오른쪽 중층에 도달'),
      fight('midGuard','오른쪽 중층 돌계단의 사격조 제압'),
      fight('high','상층 길목의 역행귀와 엄호조 제압'),
    ],
    packs:[
      pack('left',['down','lowerGuard'],140,145,[
        flyer('lantern',104,998,41), foe('shade',130,1024,{label:'폭포턱 돌짐승'}),
        flyer('bat',156,1235,81),
      ]),
      pack('lowWest',['lowerGuard'],177,140,[
        foe('stag',230,1390,{label:'들린 돌사슴'}), flyer('lantern',287,1390,93),
        foe('shade',309,1390,{label:'저류에 붙은 돌짐승'}),
      ]),
      pack('lowerGuard',['lowerGuard'],168,137,[
        foe('human',373,1366,{label:'징검길 사수'}), foe('shade',427,1324,{label:'징검길 돌짐승'}),
        flyer('lantern',455,1304,57), foe('ghost',515,1304),
        foe('human',613,1304,{label:'맞은편 물길 사수'}),
      ]),
      pack('waterCrossfire',['lowerGuard','up'],160,196,[
        flyer('lantern',530,1066,48), foe('human',591,1066,{label:'중층 서단 곡사수'}),
        flyer('bat',664,1066,93),
      ]),
      pack('rightBank',['up','midGuard'],169,146,[
        foe('ghost',674,1304), foe('shade',752,1249,{label:'역류 둔덕 돌짐승'}),
        flyer('lantern',819,1220,67), foe('human',871,1220,{label:'하층 끝 아래 사수'}),
      ]),
      pack('midGuard',['up','midGuard','high'],156,155,[
        foe('human',820,1026,{label:'중층 서쪽 사수'}), flyer('lantern',845,1026,53),
        foe('shade',871,1010,{label:'돌계단 수호혼'}), foe('human',927,960,{label:'중층 높은 턱 사수'}),
        foe('ghost',983,960),
      ]),
      pack('high',['midGuard','high'],179,179,[
        foe('shade',808,749,{label:'상층 벽감 돌짐승'}), boss(853,742,'역행귀','marksman'),
        flyer('lantern',902,733,56),
      ],wave('up','reach','상층 암벽의 안쪽에서 역행귀가 사선을 겨눕니다.',[855,742],[819,750])),
      pack('high',['high'],145,122,[
        foe('human',961,685,{label:'상층 벼랑길 사수'}), flyer('lantern',992,685,82),
      ],wave('up','reach','위쪽 석단 끝에서 역류를 타고 사수와 혼불이 들어옵니다.',[973,685],[949,691])),
      pack('rim',[],144,121,[
        flyer('lantern',897,438,62), foe('ghost',944,395),
      ]),
    ],
  },
  50: {
    rounds:[18,20], active:7, hits:2.22, incoming:.111, eliteHits:5.1,
    required:{firstGuard:[203,259,310,366],path:[699,861,909],gateGuard:[854,888,907]},
    sites:{firstGuard:[337,330],saddle:[593,410],gateGuard:[891,144]},
    flow:[
      fight('firstGuard','첫 조망터로 오르는 능선의 악귀 제압'),
      reach('view','첫 능선에서 무명사 조망'),
      reach('saddle','낮은 석교를 지나 산문 쪽 능선으로 이동'),
      fight('path','석교 끝 사격조와 산문 아래 문턱귀 제압'),
      fight('gateGuard','산문 앞 회랑의 수비조 제압'),
    ],
    packs:[
      pack('westRise',['firstGuard'],190,147,[
        foe('hound',136,384), foe('stag',177,350,{label:'들린 바위사슴'}),
        flyer('lantern',191,340,50),
      ]),
      pack('firstGuard',['firstGuard','view'],190,141,[
        foe('shade',203,335,{label:'능선의 악귀'}), flyer('lantern',259,335,39),
        foe('mourner',310,335,{label:'조망턱 수호혼'}), foe('human',366,301,{label:'조망 바위 위 사수'}),
      ]),
      pack('upperShoulder',['view','saddle'],145,142,[
        foe('ghost',406,298), flyer('crow',434,298,66),
      ]),
      pack('saddleWatch',['saddle','path'],176,145,[
        foe('hound',461,410), foe('shade',514,410,{label:'석교 길목 악귀'}),
        flyer('lantern',548,410,44), foe('ghost',575,410),
      ],undefined,'view'),
      pack('path',['saddle','path'],192,150,[
        foe('human',659,367,{label:'석교 건너 벽감 사수'}),
        foe('human',699,367,{label:'석교 끝 경계 사수'}),
        foe('mourner',742,367,{label:'종터의 들린 갑주'}), flyer('lantern',756,367,72),
      ]),
      pack('path',['path'],171,137,[
        boss(861,304,'사찰 문턱귀','vanguard'), foe('shade',887,304,{label:'산문 아래 악귀'}),
        foe('mourner',909,304,{label:'산문 아래 들린 갑주'}), flyer('lantern',944,304,47),
      ]),
      pack('templeSteps',['path','gateGuard'],146,124,[
        flyer('lantern',816,222,69), foe('human',864,222,{label:'산문 아래 계단 사수'}),
        foe('ghost',959,206),
      ],undefined,'path'),
      pack('gateGuard',['gateGuard'],158,133,[
        foe('human',854,144,{label:'산문 왼쪽 사수'}), foe('shade',888,144,{label:'산문 제기귀'}),
        flyer('lantern',929,144,44), foe('ghost',907,144,{label:'산문 회랑 수비혼'}),
      ]),
      pack('saddleFlow',['saddle','path'],166,135,[
        foe('shade',625,385,{label:'역류한 악귀'}), flyer('lantern',683,367,66),
      ],wave('saddle','reach','낮은 석교 오른편으로 악귀가 밀려옵니다.',[654,367],[688,367])),
      pack('saddleFlow',['saddle','path'],158,143,[
        foe('ghost',774,363), foe('shade',803,329,{label:'무너진 턱에서 돌아온 악귀'}),
      ],wave('saddle','reach','동쪽 무너진 턱을 따라 혼 둘이 석교 쪽으로 내려옵니다.',[787,349],[763,367])),
    ],
  },
};
