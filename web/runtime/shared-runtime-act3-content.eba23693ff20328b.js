(function(G){'use strict';
const H=G.HONRO_CONTENT,C=G.HONRO_CORE;
const step=(id,label,kind='interact',extra={})=>({id,label,kind,...extra});
const hold=(id,label,rounds,kind,count,radius=500,extra={})=>step(id,label,'hold',{rounds,wave:{kind,count},radius,contestRadius:230,...extra});
const destroy=(id,label,opens,requiredClass)=>step(id,label,'destroy',{...(opens?{opens}:{}),...(requiredClass?{requiredClass}:{})});
const exit=(id,label='다음 길에 도착')=>step(id,label,'reach');
const scene=(id,title,lines)=>lines.map(([who,text,meta={}])=>[who,text,{storyId:id,storyTitle:title,...meta}]);
const chapters=[
 {
  "name": "성문 아래",
  "place": "성문과 장터",
  "theme": "gate",
  "narration": "성문 앞 수레가 혼자 돌아섰다. 장터는 대부분 비었고, 뒤늦게 피신하던 주민이 처마 아래에 갇혔다.",
  "goal": "수레의 결박을 끊고 주민을 구해 성문 안으로 진입",
  "story": [
   [
    "설오",
    "들린 수레 밑에 사람이 갇혔습니다. 수레를 묶은 저 고리부터 끊어 길을 내겠습니다.",
    {
     "focus": "seal"
    }
   ],
   [
    "휘겸",
    "문서고는 관아 동편이오. 먼저 이 사람들이 지나갈 길을 냅시다."
   ]
  ],
  "steps": [
   {
    "id": "wagon-lock",
    "label": "들린 수레의 결박 끊기",
    "kind": "destroy",
    "requiredClass": "archer"
   },
   {
    "id": "gate-resident",
    "label": "수레 아래 주민 구하기",
    "kind": "rescue",
    "target": "act3-resident"
   },
   {
    "id": "refuge-hold",
    "label": "주민이 물러날 동안 길목 지키기",
    "kind": "hold",
    "rounds": 2,
    "wave": {
     "kind": "hound",
     "count": 2
    },
    "radius": 520,
    "contestRadius": 230
   },
   {
    "id": "city-exit",
    "label": "읍성 안으로 진입",
    "kind": "reach"
   }
  ],
  "beats": {
   "gate-resident": [
    [
     "서술",
     "주민이 기침하며 숨을 들이켰다. 길 건너에서는 쓰러졌던 병사의 몸이 다시 일어섰다."
    ],
    [
     "소단",
     "저 병사들은 이미 죽었어요. 악귀가 몸만 움직여요. 살아 있는 분은 이쪽이에요."
    ],
    [
     "설오",
     "이분이 나갈 길부터 열겠습니다."
    ],
    [
     "주민",
     "들림은 무명사 쪽 나루에서 먼저 번졌대요. 여기까지 오자 사람들은 강 건너로 피했어요."
    ]
   ],
   "refuge-hold": [
    [
     "휘겸",
     "관아의 옛 장부부터 찾겠소. 잠운사에서 베낀 종의 이송 날짜와 봉인 표식을 대조하면 어디서 옮겨 왔는지 찾을 수 있을 것이오."
    ]
   ]
  },
  "outro": [
   [
    "설오",
    "관청의 길을 잘 아십니다."
   ],
   [
    "휘겸",
    "어릴 때 관청에서 문서를 나누어 두는 법을 배웠소. 그때 알던 배치가 아직 남아 있군."
   ]
  ],
  "summary": "성문 주민을 구했다. 인근 나루에서 읍성까지 들림이 번져 주민들이 피신했다. 저문골과 무명사의 옛 장부를 찾는다.",
  "guide": "설오로 수레 고리를 끊고 주민 곁에서 구조하세요. 표시 범위에서 두 번의 적 턴을 버틴 뒤 성문 안으로 이동하세요. 처마와 성벽은 실제 포탄을 막습니다."
 },
 {
  "name": "옛 장부",
  "place": "관아 문서고",
  "theme": "temple",
  "narration": "사람들이 떠난 문서고에 세 층의 서가가 남았다. 낮은 들보 아래에서 원혼이 맴돌고 묵은 종이가 흔들린다.",
  "goal": "봉인된 서가를 열고 서로 어긋나는 두 장부 대조",
  "story": [
   [
    "휘겸",
    "저문골 주민을 적은 호적과 사건 보고는 따로 두었을 것이오. 같은 해의 기록을 맞춰 봅시다."
   ],
   [
    "설오",
    "위층 걸쇠는 여기서 보입니다. 사선이 열리는 곳으로 옮기겠습니다.",
    {
     "focus": "seal"
    }
   ]
  ],
  "steps": [
   {
    "id": "archive-seal",
    "label": "서고 봉인 열기",
    "kind": "interact",
    "requiredClass": "knight",
    "opens": "archive-door"
   },
   {
    "id": "ledger-case",
    "label": "저문골 사건 보고 확보",
    "kind": "interact"
   },
   {
    "id": "upper-latch",
    "label": "위층 서고 걸쇠 끊기",
    "kind": "destroy",
    "opens": "upper-door",
    "requiredClass": "archer"
   },
   {
    "id": "compare-ledgers",
    "label": "서가를 지키며 호적과 보고 대조",
    "kind": "hold",
    "rounds": 2,
    "wave": {
     "kind": "lantern",
     "count": 2
    },
    "radius": 460,
    "contestRadius": 230
   },
   {
    "id": "archive-exit",
    "label": "옛 관창으로 나가기",
    "kind": "reach"
   }
  ],
  "beats": {
   "ledger-case": [
    [
     "기록",
     "사술 혐의\n제압 중 다수 사망",
     {
      "kind": "document",
      "documentTitle": "사건 보고",
      "documentId": "city-incident"
     }
    ]
   ],
   "compare-ledgers": [
    [
     "기록",
     "농가 · 아이 · 노인",
     {
      "kind": "document",
      "documentTitle": "같은 해의 호적",
      "documentId": "city-register"
     }
    ],
    [
     "설오",
     "호적에는 농가와 아이, 노인이 적혀 있는데… 이 주민들을 사술 혐의로 제압했다고요?"
    ],
    [
     "휘겸",
     "보고만 믿을 수 없겠군. 현장 증언을 찾아봅시다."
    ]
   ]
  },
  "outro": [
   [
    "담허",
    "저문골을 폐쇄한 뒤 사람들과 짐을 어디로 옮겼는지 보세."
   ],
   [
    "휘겸",
    "그 장부는 수로 옆 관창에 있을 것이오."
   ]
  ],
  "summary": "사건 보고와 같은 해의 호적이 어긋난다. 주민들의 삶과 사술 혐의를 대조할 현장 증언을 찾는다.",
  "guide": "휘겸으로 봉인을 열고 아래층 보고를 확보하세요. 설오로 위층 걸쇠를 끊은 뒤 대조 지점을 두 적 턴 동안 지키세요. 다른 층의 표식에는 같은 층으로 올라가야 상호작용할 수 있습니다."
 },
 {
  "name": "사라진 짐",
  "hiddenWaterworks": true,
  "place": "지상 관창 하역장",
  "theme": "river",
  "narration": "하늘이 열린 관창 하역장에 쓰러졌던 병사의 몸들이 다시 문을 막는다. 살아 있는 짐꾼은 마지막 장부 상자를 품에 안고 물러선다.",
  "goal": "악귀가 막은 하역길을 열고 짐꾼과 운송 기록을 지켜 통과",
  "story": [
   [
    "수비병 악귀",
    "지켜라… 문을… 아무도…"
   ],
   [
    "소단",
    "문을 막은 병사들도 성문에서처럼 악귀가 움직이는 시신이에요. 저 너머 짐꾼은 살아 있어요."
   ],
   [
    "설오",
    "짐꾼이 장부 상자를 안고 있습니다. 악귀를 처치하고 저분이 나올 길을 열겠습니다.",
    {
     "focus": "seal"
    }
   ]
  ],
  "steps": [
   {
    "id": "dispatch-bundle",
    "label": "무명사 운송 묶음 확보",
    "kind": "interact"
   },
   {
    "id": "carrier-start",
    "label": "짐꾼과 출발",
    "kind": "interact",
    "target": "act3-carrier",
    "startsEscort": true
   },
   {
    "id": "dock-mid",
    "label": "짐꾼을 석교까지 호송",
    "kind": "escort",
    "target": "act3-carrier"
   },
   {
    "id": "dock-exit",
    "label": "짐꾼과 지상 하역장 벗어나기",
    "kind": "escort",
    "target": "act3-carrier"
   }
  ],
  "beats": {
   "dispatch-bundle": [
    [
     "서술",
     "운송 끈 아래 놋그릇과 농기구가 함께 묶여 있었다."
    ],
    [
     "기록",
     "저문골 → 무명사\n시신 · 생활 금속",
     {
      "kind": "document",
      "documentTitle": "운송 표찰",
      "documentId": "dispatch-tag"
     }
    ],
    [
     "설오",
     "사람들이 쓰던 밥그릇까지 가져갔군요."
    ]
   ],
   "carrier-start": [
    [
     "짐꾼",
     "다들 피했어요. 저 병사들은 죽은 뒤에도 지키던 문에서 떠나지 않았어요."
    ],
    [
     "휘겸",
     "당신은 우리와 나갑시다. 상자를 놓치지 마시오."
    ]
   ]
  },
  "outro": [
   [
    "서술",
    "휘겸이 운송 표찰 끝의 먼지를 문질렀다. 가문의 표식으로 쓰는 문장이 드러났다."
   ],
   [
    "짐꾼",
    "아래 수로는 물이 차서 발판이 끊겼어요. 수리하러 다니던 위쪽 통로만 남았을 거예요."
   ]
  ],
  "summary": "저문골의 시신과 생활 금속이 함께 무명사로 옮겨졌음을 확인했다. 죽은 육신에 남은 수호의 사념을 돌파해 짐꾼과 운송 묶음을 지켰다.",
  "guide": "기록을 챙긴 뒤 짐꾼 곁에서 출발시키세요. 짐꾼 앞의 실제 보행길을 확보하고 가까이 동행하세요. 길을 막는 수비병 악귀를 처치하며 살아 있는 짐꾼을 보호하세요."
 },
 {
  "name": "휘겸의 문장",
  "hiddenWaterworks": true,
  "place": "폐쇄된 저택과 사당",
  "theme": "temple",
  "narration": "담장 안의 빈 저택에 같은 문장이 남아 있다. 휘겸이 무너진 문간에서 걸음을 멈춘다.",
  "goal": "옛 문장을 따라 잠긴 사당과 토지 장부 확인",
  "story": [
   [
    "휘겸",
    "운송 표찰 끝과 같은 문장이오. 우리 집안의 문장인데, 왜 이곳에 남았지?"
   ],
   [
    "담허",
    "사당 안쪽 봉인이 남아 있네. 문서를 지키던 봉인인지 살펴보세."
   ]
  ],
  "steps": [
   {
    "id": "family-crest",
    "label": "휘겸의 문장 확인",
    "kind": "interact",
    "requiredClass": "knight"
   },
   {
    "id": "shrine-seal",
    "label": "사당 봉인 풀기",
    "kind": "interact",
    "requiredClass": "mage",
    "opens": "shrine-door"
   },
   {
    "id": "land-register",
    "label": "보호지 토지문서 확보",
    "kind": "interact"
   },
   {
    "id": "garden-exit",
    "label": "지상과 지하 두 조사길로 출발",
    "kind": "reach"
   }
  ],
  "beats": {
   "family-crest": [
    [
     "휘겸",
     "내 선조가 왕실 방계였다는 것은 알았소. 저문골과의 관계는 듣지 못했소."
    ]
   ],
   "land-register": [
    [
     "기록",
     "저문골 보호지\n묘역 기록실 · 공방\n아래 물길 → 관아 뒤뜰",
     {
      "kind": "document",
      "documentTitle": "접힌 토지 약도",
      "documentId": "land-plan"
     }
    ],
    [
     "휘겸",
     "선조의 기록실은 묘역 아래군. 소단, 묘역 쪽 기록실과 공방은 우리가 살핍시다."
    ]
   ]
  },
  "outro": [
   [
    "담허",
    "설오는 나와 약도에 적힌 지하 물길을 보세. 휘겸과 소단은 지상 기록을 찾고, 관아 뒤뜰에서 만나자고."
   ],
   [
    "설오",
    "찾은 기록은 가져가서 함께 맞춰 보겠습니다."
   ]
  ],
  "summary": "저문골은 휘겸 선조인 왕실 방계와 관계가 깊었다. 휘겸은 가문의 몰락과 저문골을 함께 추적한다.",
  "guide": "휘겸으로 문장을 확인하세요. 담허로 사당 봉인을 풀어 토지문서에 접근하세요. 지붕과 담장 사이에서 사선을 바꾸며 이동하세요. 두 팀으로 나뉜 뒤 28장 합류를 마칠 때까지 장 사이 자동 회복이 없으니 동행 상태를 살피세요."
 },
 {
  "name": "물 아래 묶인 이름",
  "place": "지하 수로의 은폐 집하장",
  "theme": "river",
  "hiddenWaterworks": true,
  "narration": "설오와 담허가 지하 수로로 내려갔다. 물 건너 석대에는 사람 없는 집에서 거둔 짐들이 묶여 있다. 운반길은 중간에서 끊겼다.",
  "goal": "축지진목으로 물길을 건너 생활물품의 번호 확인",
  "story": [
   [
    "설오",
    "발밑이 보이지 않습니다. 뛰어서 건널 수는 없겠습니다."
   ],
   [
    "담허",
    "건너편 단단한 돌에 축지진목을 박겠네. 그 진목으로 자리를 옮겨 건너세. 둘 다 닿으면 다음 길을 찾자고."
   ]
  ],
  "steps": [
   {
    "id": "depot-entry-seal",
    "label": "담허와 수로 봉인 살피기",
    "kind": "interact",
    "requiredClass": "mage"
   },
   {
    "id": "stake-arrival-1",
    "label": "두 동행이 동쪽 정비실에 모이기",
    "kind": "reach",
    "allHeroes": true,
    "radius": 150
   },
   {
    "id": "stake-arrival-2",
    "label": "두 동행이 중앙 점검창에 모이기",
    "kind": "reach",
    "allHeroes": true,
    "radius": 150
   },
   {
    "id": "stake-arrival-3",
    "label": "두 동행이 상층 물받이에 모이기",
    "kind": "reach",
    "allHeroes": true,
    "radius": 150
   },
   {
    "id": "stake-arrival-4",
    "label": "두 동행이 맞은편 검문실에 모이기",
    "kind": "reach",
    "allHeroes": true,
    "radius": 150
   },
   {
    "id": "stake-arrival-5",
    "label": "두 동행이 상층 봉인회랑에 모이기",
    "kind": "reach",
    "allHeroes": true,
    "radius": 150
   },
   {
    "id": "household-tally",
    "label": "생활물품의 가족 번호 확인",
    "kind": "interact"
   },
   {
    "id": "waterworks-exit",
    "label": "안쪽 집하장 입구로 이동",
    "kind": "reach"
   }
  ],
  "beats": {
   "depot-entry-seal": [
    [
     "담허",
     "돌이 단단하군. 저쪽 석대에 진목을 박으면 길을 이을 수 있네."
    ],
    [
     "설오",
     "제가 먼저 건너가 자리를 살피겠습니다. 어른도 곧 따라오세요."
    ]
   ],
   "household-tally": [
    [
     "서술",
     "같은 끈에 묶인 이름표와 숟가락, 농기구의 표찰에 같은 번호가 남아 있었다."
    ],
    [
     "설오",
     "이름표와 살림에 같은 번호가 붙었습니다."
    ],
    [
     "담허",
     "이름과 가족 번호가 적힌 표찰을 가져가세. 휘겸과 소단이 찾을 지상 기록과 맞춰 보자고."
    ]
   ]
  },
  "outro": [
   [
    "담허",
    "안쪽은 더 넓군. 물에 잠긴 운반로가 어디로 이어졌는지 살펴보세."
   ]
  ],
  "summary": "설오와 담허가 축지진목으로 끊긴 수로를 건넜다. 생활물품과 이름표를 가족 번호로 묶어 보관한 지하 은폐 집하장을 발견했다. 이곳이 종 주조소라는 근거는 없다.",
  "guide": "담허로 봉인을 살피고 축지진목을 건너편 석대에 직접 박으세요. 설오와 담허를 각각 골라 설치한 진목을 눌러 옮기세요. 낮은 천장 아래에서는 전망을 살피고, 열린 점검창으로 돌아와 위쪽 길을 이으세요. 상층에서 가족 번호를 확인하세요."
 },
 {
  "name": "지상에 남은 증언",
  "place": "묘역 기록실과 불탄 공방",
  "theme": "temple",
  "hiddenWaterworks": true,
  "narration": "휘겸과 소단은 지상에 남았다. 묘역 아래 숨긴 조사문서와 공방에 남은 작업기록을 맞춰 볼 차례다.",
  "goal": "선조의 조사문서와 공방 작업기록 확보",
  "story": [
   [
    "휘겸",
    "약도에 적힌 기록실이오. 문서를 찾고 공방으로 가겠소."
   ],
   [
    "소단",
    "저쪽에 살아 있는 주민이 있어요. 문서를 찾는 동안 저분도 구해야 해요."
   ]
  ],
  "steps": [
   {
    "id": "hidden-latch",
    "label": "휘겸으로 기록실 열기",
    "kind": "interact",
    "requiredClass": "knight",
    "opens": "hidden-door"
   },
   {
    "id": "investigation-record",
    "label": "선조의 조사 기록 확보",
    "kind": "interact"
   },
   {
    "id": "artisan-resident",
    "label": "작업기록을 지킨 주민 구조",
    "kind": "rescue",
    "target": "act3-resident"
   },
   {
    "id": "casting-tally",
    "label": "수거량과 주조량 대조",
    "kind": "interact"
   },
   {
    "id": "workshop-exit",
    "label": "관아 뒤뜰로 돌아가기",
    "kind": "reach"
   }
  ],
  "beats": {
   "investigation-record": [
    [
     "기록",
     "조직적 저항 없음\n대도사가 현장에서 주민 전원을 살해",
     {
      "kind": "document",
      "documentTitle": "선조의 현장 조사",
      "documentId": "ancestor-investigation"
     }
    ],
    [
     "휘겸",
     "대도사… 왕실에 저문골 보고를 올린 도사요. 선조는 그 보고가 거짓임을 조사했소."
    ],
    [
     "서술",
     "소단이 사건 보고 조각을 그 옆에 놓았다."
    ]
   ],
   "artisan-resident": [
    [
     "주민",
     "우리 집안에 남은 무명사 작업기록이에요. 없어질까 봐 꺼내 왔어요."
    ]
   ],
   "casting-tally": [
    [
     "기록",
     "저문골 수거량 ≈ 무명사 주조량\n유골·재: 통상 장례와 다른 처리",
     {
      "kind": "document",
      "documentTitle": "수거·주조 기록 대조",
      "documentId": "casting-comparison"
     }
    ],
    [
     "소단",
     "금속량은 맞지만, 유골과 재를 어떻게 처리했는지는 적혀 있지 않아요."
    ]
   ]
  },
  "outro": [
   [
    "소단",
    "관아 쪽에서 연기가 나요. 설오 씨와 담허 어른이 지하에서 올라올 길도 그쪽인데…"
   ],
   [
    "휘겸",
    "뒤뜰에서 만나기로 했소. 기록을 챙기고 서둘러 갑시다."
   ]
  ],
  "summary": "휘겸과 소단이 선조의 조사문서와 공방 기록을 확보했다. 저항하지 않은 주민들을 대도사가 현장에서 학살했고, 이후 무명사에서 대종을 주조했다. 생활 금속량은 수거량과 거의 일치하며 유골·재 처리도 비정상적이다. 정확한 공정과 목적은 미상이다.",
  "guide": "휘겸으로 기록실을 열어 문서를 챙기세요. 공방에서 살아 있는 주민을 구하고 작업기록을 대조한 뒤 뒤뜰로 이동하세요."
 },
 {
  "name": "검은 집하장",
  "place": "지하 심부의 봉인 창고",
  "theme": "river",
  "hiddenWaterworks": true,
  "narration": "수로 너머로 거대한 인공 집하장이 드러났다. 높은 적재대와 낮은 검수대 사이의 운반길은 물속으로 꺼졌다. 저문골 사람들의 살림만 층층이 남았다.",
  "goal": "석대들을 축지진목으로 이어 가족 번호 대조",
  "story": [
   [
    "설오",
    "집하장 하나에 마을의 살림이 다 들어와 있습니다. 돌길은 여기서도 끊겼군요."
   ],
   [
    "담허",
    "한 번에 끝까지 갈 수는 없네. 앞 석대에 진목을 박고, 둘이 모이면 그다음을 잇세."
   ]
  ],
  "steps": [
   {
    "id": "depot-route-ledger",
    "label": "끊긴 운반로의 순서 확인",
    "kind": "interact"
   },
   {
    "id": "stake-arrival-1",
    "label": "두 동행이 수몰 하역대에 모이기",
    "kind": "reach",
    "allHeroes": true,
    "radius": 150
   },
   {
    "id": "stake-arrival-2",
    "label": "두 동행이 맞은편 봉인통로에 모이기",
    "kind": "reach",
    "allHeroes": true,
    "radius": 150
   },
   {
    "id": "stake-arrival-3",
    "label": "두 동행이 회수 점검창에 모이기",
    "kind": "reach",
    "allHeroes": true,
    "radius": 150
   },
   {
    "id": "stake-arrival-4",
    "label": "두 동행이 윗층 대조대에 모이기",
    "kind": "reach",
    "allHeroes": true,
    "radius": 150
   },
   {
    "id": "family-manifest",
    "label": "가족별 적재 명세 챙기기",
    "kind": "interact"
   },
   {
    "id": "deep-depot-exit",
    "label": "합류할 출구로 이동",
    "kind": "reach"
   }
  ],
  "beats": {
   "depot-route-ledger": [
    [
     "담허",
     "위의 적재대, 아래 검수대… 끝에 봉인한 창고가 있군. 한 곳씩 살펴보세."
    ]
   ],
   "family-manifest": [
    [
     "기록",
     "이름 / 가족 번호 / 물품",
     {
      "kind": "document",
      "documentTitle": "가족별 적재 명세",
      "documentId": "family-manifest"
     }
    ],
    [
     "설오",
     "수로 입구에서 본 살림 표찰과 같은 가족 번호입니다. 이 명세에는 이름도 함께 있군요."
    ],
    [
     "담허",
     "이 적재 명세를 챙기세. 휘겸과 소단이 찾은 기록과 맞춰 봐야지."
    ]
   ]
  },
  "outro": [
   [
    "설오",
    "저 문틈으로 연기가 들어옵니다. 약속한 뒤뜰이 가까운가 봅니다."
   ],
   [
    "담허",
    "진목을 함부로 거두지 말게. 돌아갈 길을 확인하고 올라가세."
   ]
  ],
  "summary": "거대한 인공 지하 집하장을 축지진목으로 건넜다. 가족별 이름표와 숟가락·농기구를 같은 번호로 다룬 적재 명세를 확보했다. 지상 희생자 명단과의 대조를 위해 두 기록을 합류 지점으로 가져간다.",
  "guide": "현재 목표 석대에 진목을 직접 박고 두 동행을 차례로 옮기세요. 둘 다 도착해야 다음 연결이 열립니다. 수몰 하역대로 내려갔다가 맞은편 회랑을 올라 가족 명세를 챙기세요."
 },
 {
  "name": "지운 이름과 남은 명령",
  "place": "불붙은 관아 뒤뜰과 기록각",
  "theme": "temple",
  "hiddenWaterworks": true,
  "narration": "지하에서 올라온 설오와 담허, 공방을 돌아온 휘겸과 소단이 불붙은 관아 뒤뜰의 양쪽에 닿았다. 살아 있는 사람은 물러났지만 악귀들은 남은 문서를 태우고 있다.",
  "goal": "불길을 막고 합류해 청원서와 은폐 기록 확보",
  "story": [
   [
    "휘겸",
    "서쪽 불길은 우리가 막겠소. 설오, 동쪽 수문을 열어 주시오.",
    {
     "focus": "fire-screen"
    }
   ],
   [
    "설오",
    "두 분 모두 무사하시군요. 물길을 열고 가운데로 가겠습니다.",
    {
     "focus": "water-release"
    }
   ]
  ],
  "steps": [
   {
    "id": "fire-screen",
    "label": "휘겸으로 서쪽 불길 막기",
    "kind": "interact",
    "requiredClass": "knight",
    "opens": "fire-door",
    "parallelGroup": "fire-control"
   },
   {
    "id": "water-release",
    "label": "설오로 동쪽 수문 열기",
    "kind": "interact",
    "requiredClass": "archer",
    "opens": "water-gate",
    "parallelGroup": "fire-control"
   },
   {
    "id": "party-reunion",
    "label": "네 동행이 뒤뜰에 모이기",
    "kind": "reach",
    "allHeroes": true,
    "radius": 440
   },
   {
    "id": "petition-record",
    "label": "지워진 조사 청원서 확보",
    "kind": "interact"
   },
   {
    "id": "closure-order",
    "label": "당시 폐쇄 승인문 확보",
    "kind": "interact"
   },
   {
    "id": "suppression-order",
    "label": "사후 은폐 기록 대조",
    "kind": "interact"
   },
   {
    "id": "office-exit",
    "label": "기록을 가지고 봉쇄 벗어나기",
    "kind": "reach"
   }
  ],
  "beats": {
   "party-reunion": [
    [
     "서술",
     "네 사람이 이름표와 희생자 명단을 나란히 놓았다. 같은 가족 번호와 이름이 맞았다."
    ],
    [
     "휘겸",
     "지하 살림의 이름표와 선조가 남긴 희생자 명단이 같소. 대도사에게 저항도 없이 죽은 저문골 사람들이오."
    ],
    [
     "소단",
     "저문골에서 거둔 생활 금속량과 무명사에서 종을 만들 때 쓴 양이 거의 같아요. 유골을 어떻게 처리했는지는 아직 몰라요."
    ],
    [
     "서술",
     "담허가 두 팀의 기록을 받아 함께 묶었다."
    ]
   ],
   "petition-record": [
    [
     "기록",
     "조사 청원\n작위 박탈 · 추방",
     {
      "kind": "document",
      "documentTitle": "지워진 청원서",
      "documentId": "erased-petition"
     }
    ],
    [
     "휘겸",
     "우리 가문의 문장을 긁어 지웠군. 조사를 청원한 뒤 내린 처분이오."
    ]
   ],
   "closure-order": [
    [
     "기록",
     "폐쇄·제압 승인\n왕실 고위 관리 결재",
     {
      "kind": "document",
      "documentTitle": "당시 승인문",
      "documentId": "closure-approval"
     }
    ]
   ],
   "suppression-order": [
    [
     "기록",
     "학살 보고 뒤 조사 차단",
     {
      "kind": "document",
      "documentTitle": "사후 기록",
      "documentId": "later-suppression"
     }
    ],
    [
     "설오",
     "이 승인문에는 주민을 죽이라는 명령은 없습니다. 하지만 학살을 보고받은 뒤에도 조사를 막았군요."
    ],
    [
     "휘겸",
     "승인한 자, 죽인 자, 감춘 자. 각각의 이름을 남기겠소."
    ]
   ]
  },
  "outro": [
   [
    "담허",
    "수문 뒤에 봉인된 문서가 더 있네. 도사의 글인 듯한데, 봉인한 획이 낯익어."
   ]
  ],
  "summary": "두 팀이 합류해 지하 가족 번호와 지상 희생자 명단을 대조했다. 휘겸 선조의 조사 청원 뒤 가문 탄압이 이어졌다. 왕실 특정 고위 관리의 폐쇄·제압 승인, 대도사의 현장 학살, 사후 은폐의 책임은 구별된다. 왕의 직접 학살 명령이나 왕실 전체의 공모로 단순화하지 않는다.",
  "guide": "12번째 적 턴이 끝나기 전에 양쪽 불길 제어점을 여세요. 순서는 자유이며 대화 중에는 소각이 멈춥니다. 네 동행이 가운데 모인 뒤 청원서, 폐쇄 승인문, 사후 은폐 기록을 순서대로 챙겨 이탈하세요."
 },
 {
  "name": "현묵의 글",
  "place": "밤의 수문과 봉인 창고",
  "theme": "river",
  "narration": "수문 뒤 봉인 창고에 오래된 글 한 묶음이 남았다. 담허가 같은 뿌리의 획을 짚는다.",
  "goal": "봉인을 풀어 글을 확보하고 높은 수문길 또는 아래 점검다리로 이탈",
  "story": [
   [
    "담허",
    "창고 봉인이 북쪽 산길의 돌림진과 같은 법을 썼네. 획을 순서대로 풀겠어."
   ],
   [
    "휘겸",
    "문을 막던 악귀들이 따라왔소. 안쪽 길을 여는 동안 지키겠소."
   ]
  ],
  "steps": [
   {
    "id": "old-seal",
    "label": "담허의 옛 봉인 해체 지키기",
    "kind": "hold",
    "rounds": 2,
    "wave": {
     "kind": "ghost",
     "count": 2
    },
    "radius": 460,
    "contestRadius": 230,
    "requiredClass": "mage",
    "opens": "old-door"
   },
   {
    "id": "hyeonmuk-letter",
    "label": "현묵이 남긴 글 확보",
    "kind": "interact"
   },
   {
    "id": "route-exit",
    "kind": "route",
    "label": "높은 수문길 또는 아래 점검다리로 이탈"
   }
  ],
  "beats": {
   "hyeonmuk-letter": [
    [
     "서술",
     "글의 끝에 현묵이라는 서명과 문하 표식이 남아 있었다."
    ],
    [
     "기록",
     "스승께 들린 혼은 없었다\n저편의 울림을 답이라 여겼다\n종을 울린 뒤 무명사의 이치가 어그러졌다",
     {
      "kind": "document",
      "documentTitle": "현묵의 글",
      "documentId": "hyeonmuk-letter"
     }
    ],
    [
     "담허",
     "현묵은 대도사의 제자였군. 여기서 스승이라 부르는 이가 대도사네."
    ],
    [
     "소단",
     "이 글대로라면, 대도사가 혼에 들려 저문골 사람들을 죽인 건 아니었군요."
    ],
    [
     "휘겸",
     "위 수문길과 아래 점검다리가 이어져 있소. 기록을 가지고 빠져나갑시다."
    ]
   ]
  },
  "outro": [
   [
    "담허",
    "이 글은 그 뒤 현묵이 어떻게 됐는지 말하지 않네. 남은 운송로와 맞춰 보세."
   ]
  ],
  "summary": "현묵의 글은 스승께 들린 혼이 없었고, 종을 울린 뒤 무명사의 이치가 어그러졌다고 전한다. 증언자의 현재 상태와 저편의 뜻은 미상이다.",
  "guide": "담허의 봉인 해체를 두 적 턴 동안 지키고 현묵의 글을 확보하세요. 높은 수문길이나 기둥 아래 점검다리의 출구 중 한 곳에 동행 한 명이 도착하면 됩니다. 별도의 퇴로 방어는 없습니다."
 },
 {
  "name": "남겨진 길",
  "place": "강변 나루",
  "theme": "river",
  "narration": "읍성을 벗어나는 나루에서 세 묶음의 기록을 한 지도 위에 펼친다. 지도 위에서 끊긴 길의 흔적이 이어진다.",
  "goal": "세 운송 기록을 잇고 일행과 옛길 입구에 도착",
  "story": [
   [
    "휘겸",
    "저문골의 짐을 옮긴 기록, 종의 이송 기록, 옛길을 막은 기록을 가져왔소. 지도 위에서 운송로를 맞춰 봅시다."
   ],
   [
    "설오",
    "기록에 적힌 운송로가 같은 강을 지나는지부터 보겠습니다."
   ]
  ],
  "steps": [
   {
    "id": "transport-map",
    "label": "세 기록으로 옛 운송로 확인",
    "kind": "interact"
   },
   {
    "id": "route-pin",
    "label": "나루 출구 고정구 끊기",
    "kind": "destroy",
    "opens": "route-door",
    "requiredClass": "archer"
   },
   {
    "id": "ferry-hold",
    "label": "일행이 빠져나갈 나루 지키기",
    "kind": "hold",
    "rounds": 3,
    "wave": {
     "kind": "hound",
     "count": 3
    },
    "radius": 540,
    "contestRadius": 230
   },
   {
    "id": "old-road",
    "label": "생존한 동행과 옛길 입구에 모이기",
    "kind": "reach",
    "allHeroes": true,
    "radius": 440
   }
  ],
  "beats": {
   "transport-map": [
    [
     "기록",
     "저문골 → 무명사: 시신·금속\n무명사 → 잠운사: 묵종\n옛길 봉쇄",
     {
      "kind": "document",
      "documentTitle": "지도 위의 운송로",
      "documentId": "old-route-map"
     }
    ],
    [
     "설오",
     "고향 곁을 지나는 길입니다. 사람들이 탄 배도 이쪽으로 갔는지 찾아보겠습니다."
    ],
    [
     "담허",
     "종이 최근 다시 울린 까닭도 남았네. 무명사로 가세."
    ]
   ]
  },
  "outro": [
   [
    "설오",
    "사람들의 시신과 금속이 모였고 종이 만들어진 곳, 무명사로 가야겠습니다. 그런데 그쪽 옛길은 끊겨 있습니다."
   ],
   [
    "담허",
    "강과 장례길을 따라 이어 보세. 안에서 무엇이 기다리는지는 아직 모르네."
   ],
   [
    "소단",
    "이번에는 돌아올 길도 함께 남겨요."
   ]
  ],
  "summary": "저문골·무명사·잠운사를 잇는 운송·봉쇄 기록을 확보했다. 길은 설오의 고향 곁을 지난다. 끊긴 옛길을 따라 무명사로 향한다.",
  "guide": "세 기록을 맞춘 뒤 나루 고정구를 끊으세요. 퇴로를 세 적 턴 동안 지키고 살아 있는 모든 동행을 출구 범위로 모으세요. 이후 4막은 준비 중입니다."
 }
];
const roster=['archer','mage','knight','occultist'];
for(const [i,d] of chapters.entries()){
 const id=21+i,p=G.HONRO_BALANCE.stages[id-1],st={...d,id,act:3,actStage:i+1,level:Math.floor(p.entryLevel),template:1,objective:'act3',requires:[id-1],active:p.activeEnemies||3,enemies:p.initialEnemies,w:9000,h:4200,playableRoster:roster,map:[7000+i*260,300+(i%3)*260],narration:[d.narration],narrationArt:'road',storySummary:d.summary};
 st.story=scene('act3-entry-'+id,`3-${i+1} · ${d.name}`,d.story);st.outro=scene('act3-outro-'+id,d.name,d.outro);
 st.failure=d.hiddenWaterworks&&[25,27].includes(id)?[['담허','길을 다시 잡세. 가져온 단서까지 잃어서는 안 되네.']]:[['휘겸','길을 다시 잡읍시다. 가져온 단서까지 잃어서는 안 되오.']];H.stages.push(st);
}
H.acts.push({id:3,name:'지워진 기록',first:21,last:30});
H.nextAct={id:4,name:'끊긴 옛길',place:'옛 운송로와 장례길',requires:[30],available:false};
H.version='1.2.0-act3-production';
// These are irreversibly possessed, dead human bodies, not living officials.
// Keep bodily collision, martial attacks and the existing human form/qi response.
Object.assign(G.HonroWorld.archetypes,{
 possessedGuard:{name:'수비병 악귀',look:'human',cls:'knight',skills:['S09'],role:'leaper',h:98,r:25,intent:'악귀가 움직이는 죽은 육신 · 지키던 문을 막는 사념이 남아 있다',act3Fiend:true},
 possessedArcher:{name:'궁수 악귀',look:'human',cls:'archer',skills:['A01'],role:'bow',h:96,r:24,intent:'악귀가 움직이는 죽은 육신 · 성벽과 기록을 지키던 사념으로 활을 든다',act3Fiend:true}
});
G.HonroAct3Content={chapters,roster,scene,revision:1};
// These aliases have their own silhouettes and workplace identities. Combat
// uses the existing, tested martial/projectile roles and ordinary growth budgets.
Object.assign(G.HonroWorld.archetypes,{
 gateMaster:{...G.HonroWorld.archetypes.possessedGuard,name:'수문장 악귀',variant:'gateMaster'},
 archerMaster:{...G.HonroWorld.archetypes.possessedArcher,name:'별초 궁귀',variant:'archerMaster'},
 archiveFiend:{name:'장부귀',look:'human',variant:'archiveFiend',cls:'mage',skills:['M01'],role:'bow',h:98,r:24,act3Fiend:true,intent:'기록을 지우라는 사념에 묶인 죽은 서리 · 흩어진 장부를 움켜쥔다'},
 kilnFiend:{name:'주조귀',look:'human',variant:'kilnFiend',cls:'knight',skills:['S09'],role:'leaper',h:102,r:26,act3Fiend:true,intent:'종틀을 짊어진 죽은 주조공 · 굳은 쇳물과 그을린 망치가 몸에 붙었다'}
});
})(globalThis);

