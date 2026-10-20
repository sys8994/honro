import {yieldIfNeeded} from "./load-data.fb768c8f80789aa0.js";
// shared/runtime/act3-content.js
(()=>{
'use strict';
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
    "kind": "reach",
    "allHeroes": true
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
    "kind": "reach",
    "allHeroes": true
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
    "kind": "reach",
    "allHeroes": true
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
    "돌아갈 길을 확인할 때까지 진목은 내가 남겨 두겠네. 위쪽 길부터 살피세."
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

})();
await yieldIfNeeded();
// shared/runtime/act3-encounters.js
(()=>{
'use strict';
(function(G){'use strict';
const populationCap=G.HonroEncounters.populationCap;
G.HonroEncounters.populationCap=function(b){const cap=b.honroAct3EncounterPopulationCap;return !b.honroCustom&&b.honroAct3EncounterBudget?.version===1&&Number.isInteger(cap)&&cap>0?cap:populationCap(b);};
// Only the fresh authored revision opts in. Never retune or repopulate a live save.
function initialize(b){
 if(b.honroCustom||b.honroStage<21||b.honroStage>30||b.honroAct3EncounterRevision!==1)return;
 const st=G.HONRO_CONTENT.stages[b.honroStage-1];
 for(const u of b.units)tune(b,u,st);
 preserveInitialBudget(b,st);
}
function preserveInitialBudget(b,st){
 const spec=b.honroAct3EncounterBudget;
 if(spec?.version!==1||b.honroAct3EncounterBudgetApplied)return;
 const units=b.units.filter(u=>u.side===1&&u.honroAct3Encounter===1&&!u.honroObjectiveTarget),rows=Object.entries(spec.roster||{});
 if(!units.length||!rows.length||rows.some(([key,n])=>!Number.isInteger(n)||n<1||!G.HonroWorld.archetypes[key.replace(/\*$/,'')]))return;
 let targetHp=0,targetAttack=0,targetWeight=0;
 // Run the same archetype/skill migration, explicit elite and difficulty tuning
 // as the old roster. These temporary references never enter the battlefield.
 for(const[key,n]of rows){const elite=key.endsWith('*'),kind=key.replace(/\*$/,''),u=G.HonroWorld.createEnemy(b,st,0,kind,0,0,true);Object.assign(u,{side:1,honroAct3Encounter:1,honroAct3Elite:elite});tune(b,u,st);targetHp+=u.maxHp*n;targetAttack+=u.attack*n;targetWeight+=u.honroXpWeight*n;}
 const hpTotal=units.reduce((n,u)=>n+u.combatBaseHp,0),attackTotal=units.reduce((n,u)=>n+u.attack,0),weightTotal=units.reduce((n,u)=>n+u.honroXpWeight,0),d=G.HONRO_CORE.DIFFICULTIES[b.difficulty]||G.HONRO_CORE.DIFFICULTIES.normal;
 if(!(hpTotal>0&&attackTotal>0&&weightTotal>0))return;
 // Largest remainders preserve the exact integer HP sum at every difficulty.
 const allocations=units.map((u,i)=>{const exact=targetHp*u.combatBaseHp/hpTotal;return{u,i,hp:Math.floor(exact),fraction:exact-Math.floor(exact)};}),remaining=targetHp-allocations.reduce((n,a)=>n+a.hp,0);
 for(const a of [...allocations].sort((a,z)=>z.fraction-a.fraction||a.i-z.i).slice(0,remaining))a.hp++;
 for(const{u,hp}of allocations){u.hp=u.maxHp=hp;u.combatBaseHp=hp/d.hp;u.combatBaseAttack*=targetAttack/attackTotal;u.attack=u.combatBaseAttack*d.damage;u.honroXpWeight*=targetWeight/weightTotal;}
 b.honroAct3EncounterBudgetApplied={version:1,hp:targetHp,attack:targetAttack,xpWeight:targetWeight,initial:units.length};
}
function tune(b,u,st=G.HONRO_CONTENT.stages[b.honroStage-1]){if(u.side!==1||u.honroAct3Encounter!==1||u.honroAct3EncounterTuned)return;
  // Legacy index%11 promotion is not the authored roster. Resolve the explicit
  // guard/archer role first, then apply one difficulty-independent elite scale.
  u.elite=false;u.armor=.04;G.HonroProgression.tuneEnemy(st,u,u.honroVariant||u.honroType);
  if(u.honroAct3Elite){u.elite=true;u.name='정예 '+u.name;u.combatBaseHp*=1.55;u.combatBaseAttack*=1.15;u.honroXpWeight*=1.6;u.armor=.12;}
  const d=G.HONRO_CORE.DIFFICULTIES[b.difficulty]||G.HONRO_CORE.DIFFICULTIES.normal;
  u.hp=u.maxHp=Math.round(u.combatBaseHp*d.hp);u.attack=u.combatBaseAttack*d.damage;u.honroAct3EncounterTuned=true;
}
G.HonroAct3Encounters={initialize,tune};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/act3-objectives.js
(()=>{
'use strict';
(function(G){'use strict';
const C=G.HONRO_CORE,H=G.HONRO_CONTENT;
const active=b=>!!b&&!b.honroCustom&&b.honroStage>=21&&b.honroStage<=30;
const marker=(b,id)=>b.honroMarkers?.find(m=>m.id===id||m.id==='marker-'+id);
const steps=b=>(b.honroAct3Steps||G.HonroObjectiveRevision?.storedSteps(b,3)||H.stages[b.honroStage-1]?.steps||[]).filter(s=>!s.splitOnly||[1,2].includes(b.honroSplit?.version));
const alive=u=>!!u&&!u.dead&&u.hp>0;
const heroes=b=>b.units.filter(u=>u.side===0&&!u.summoned&&!u.enthrall&&alive(u));
function memory(b){b.honroState??={flags:{},collected:[]};const a=b.honroState.act3??={version:1};a.done??={};a.holds??={};a.events??={};a.checkpoints??=[];a.escorts??={};return a;}
const sameFloor=(u,p,r=260)=>!!p&&Math.abs(u.y-p.y)<=150&&Math.hypot(u.x-p.x,(u.y-p.y)*.75)<=r;
function initialize(b){if(!active(b))return;G.HonroObjectiveRevision?.registerScenes();memory(b);b.honroAct3Steps??=structuredClone(G.HonroObjectiveRevision?.storedSteps(b,3)||H.stages[b.honroStage-1].steps);
 for(const u of b.units)if(u.honroProtected)u.honroCivilian=true;
}
function sourceIssue(b){const routeIssue=G.HonroRouteBranches?.sourceIssue(b);if(routeIssue)return routeIssue;const list=steps(b);if(!list.length)return'이 장의 목표 자료가 준비되지 않았습니다.';
 for(const s of list){if(!marker(b,s.id))return'목표 위치가 준비되지 않았습니다: '+s.id;if(s.kind==='destroy'&&!G.HonroQuestTargets.records(b).some(t=>t.id===s.id))return'파괴 장치가 준비되지 않았습니다: '+s.id;if(s.target&&!b.units.some(u=>u.id===s.target))return'동행 대상이 준비되지 않았습니다: '+s.target;if(s.opens&&!G.HonroQuestTargets.records(b).some(t=>t.id===s.opens))return'통로가 준비되지 않았습니다: '+s.opens;if(s.wave&&!marker(b,'wave-'+s.id))return'방어 경로가 준비되지 않았습니다: '+s.id;}return null;
}
function satisfied(b,s){const a=memory(b);if(a.done[s.id])return true;const evidence=G.HonroEvidenceQuests?.satisfied(b,s);if(evidence!==null&&evidence!==undefined)return evidence;
 if(s.kind==='route')return !!b.honroRouteChoice?.selectedRoute;
 if(s.kind==='destroy')return !!G.HonroQuestTargets.records(b).find(t=>t.id===s.id)?.broken;
 if(s.kind==='hold'){const h=a.holds[s.id];return !!h&&h.progress>=s.rounds&&h.spawned>=(s.wave?.count||0);}
 return false;
}
const current=b=>steps(b).find(s=>!s.optional&&!memory(b).done[s.id]);
const readySteps=b=>{const s=current(b);return !s?[]:s.parallelGroup?steps(b).filter(q=>q.parallelGroup===s.parallelGroup&&!memory(b).done[q.id]):[s];};
const reunionStage=b=>b.honroSplit?.version===2?28:27;
const fireScenario=b=>b.honroStage===reunionStage(b)&&steps(b).some(s=>s.id==='water-release')&&steps(b).some(s=>s.id==='fire-screen');
const firesStopped=b=>!!memory(b).done['water-release']&&!!memory(b).done['fire-screen'];
function target(b,s){const m=marker(b,s.id),t=s.kind==='destroy'&&G.HonroQuestTargets.records(b).find(t=>t.id===s.id),u=s.target&&b.units.find(u=>u.id===s.target),liveUnit=['rescue','interact'].includes(s.kind)&&u;
 return{id:s.id,kind:t?'seal':['reach','escort'].includes(s.kind)?'exit':'interact',x:liveUnit?u.x:t?t.x+t.w/2:m?.x,y:liveUnit?u.y-u.h:t?t.y:m?.y,label:s.label,...(t?{box:t}:{}),...(liveUnit?{unitId:u.id}:{})};
}
function state(b){const list=steps(b),s=current(b),a=memory(b),issue=sourceIssue(b),all=list.map(q=>({...target(b,q),done:!!a.done[q.id]}));let detail='';
 if(s?.kind==='hold'){const h=a.holds[s.id];detail=` · ${h?.progress||0}/${s.rounds}턴${h?.contested?' · 가까운 적을 밀어내세요':h?.guarded?' · 지키는 중':' · 같은 층의 표시 범위에서 유지'}`;}
 if(s?.id==='compare-ledgers'&&G.HonroEvidenceQuests?.pairReady(b)===false)detail+=' · 두 기록함을 든 동행이 같은 층에서 서로 가까이 모이세요';
 if(fireScenario(b)&&!firesStopped(b))detail+=` · 소각까지 ${Math.max(0,12-(a.fireTurns||0))} 적 턴`;
 const targets=G.HonroEvidenceQuests?.targets(b,s)||G.HonroRouteBranches?.targets(b,s)||readySteps(b).map(q=>target(b,q));
 if(s?.kind==='escort'){const u=b.units.find(u=>u.id===s.target);if(alive(u))targets.push({id:u.id,kind:'objective',x:u.x,y:u.y-u.h,unitId:u.id,label:'기록 운반자 · 가까이 동행'});}
 const complete=!issue&&!s;return{complete,objectiveReady:complete,minimumRound:1,settleRounds:0,summary:issue||`${list.filter(q=>a.done[q.id]).length}/${list.length} · ${s?.parallelGroup==='fire-control'?'불길 진압 '+list.filter(q=>q.parallelGroup==='fire-control'&&a.done[q.id]).length+'/2 · 설오 수문 / 휘겸 차단막'+detail:s?s.label+detail:'모든 목표 완료'}`,targets:targets.filter(t=>Number.isFinite(t.x)&&Number.isFinite(t.y)),allTargets:all};
}
function interactionTarget(b,m){if(!active(b)||m?.action!=='act3'||!m.target)return m;const s=steps(b).find(s=>s.id===m.id);if(!s||!['rescue','interact'].includes(s.kind))return m;const u=b.units.find(u=>u.id===m.target);return alive(u)&&!m.collected?u:null;}
function eligibility(app,m){const b=app.engine?.b,u=app.engine?.active,next=b&&current(b),s=b&&readySteps(b).find(q=>q.id===m.id);if(!active(b)||!alive(u)||u.side!==0||u.summoned||u.enthrall||m.collected)return{ok:false,reason:'상호작용할 수 없음'};
 if(!s)return{ok:false,reason:next?'먼저 '+next.label:'목표 완료'};
 if(!['interact','rescue'].includes(s.kind))return{ok:false,reason:s.label};
 if(s.requiredClass&&u.cls!==s.requiredClass)return{ok:false,reason:H.hero[s.requiredClass].name+' 필요'};
 const point=interactionTarget(b,m);if(!point)return{ok:false,reason:'보호할 주민을 찾을 수 없음'};
 if(!sameFloor(u,point))return{ok:false,reason:Math.abs(u.y-point.y)>150?'같은 층으로 이동':'더 가까이 이동'};
 if(app.canInput&&!app.canInput())return{ok:false,reason:'현재 행동이 끝난 뒤'};
 // Only the immediate working space must be clear. Distant fiends and other
 // storeys never turn a retrieval objective into an extermination objective.
 if(b.units.some(v=>v.side===1&&!v.honroObjectiveTarget&&v.summonKind!=='eater'&&!v.eaterCapturedBy&&alive(v)&&sameFloor(v,point,220)))return{ok:false,reason:'작업 지점 가까운 악귀부터 처치'};
 return{ok:true,reason:s.label};
}
function openGate(b,id){if(!id)return;const t=G.HonroQuestTargets.records(b).find(t=>t.id===id);if(t&&!t.broken){t.hp=0;t.broken=true;b.sceneVersion++;}}
function completeStep(app,s,actor){const b=app.engine.b,a=memory(b);if(a.done[s.id])return true;if(G.HonroEvidenceQuests?.prepareComplete(app,s,actor)===false)return false;a.done[s.id]=true;a.checkpoints.push({id:s.id,round:b.round,enemyEnd:b.teamEnds?.[1]||0});const m=marker(b,s.id);if(m)m.collected=true;openGate(b,s.opens);
 const lines=(G.HonroObjectiveRevision?.contentFor(b,app.stage)||app.stage).beats?.[s.id];if(lines?.length&&!G.HonroObjectiveRevision?.stageScene(app,s))app.sayLines(G.HonroAct3Content.scene(`act3-${b.honroStage}-${s.id}`,app.stage.name,lines.map(([who,text,meta={}])=>[who,text,{...meta,evidenceGoal:s.id}])));if(!lines?.length)app.event(s.label+' · 완료',{kind:'narration',source:'objective:'+s.id});app.dirty=true;return true;
}
function use(app,m){if(!eligibility(app,m).ok)return false;const e=app.engine,b=e.b,s=readySteps(b).find(q=>q.id===m.id),a=memory(b),u=s.target&&e.unit(s.target);
 if(G.HonroEvidenceQuests?.prepareComplete(app,s,e.active)===false)return false;
 if(s.kind==='rescue'){G.HonroObjectiveContributions?.approach(b,s.id,heroes(b),u,220);u.honroResolved=true;u.shield=Math.max(u.shield||0,Math.round(u.maxHp*.3));}
 if(s.startsEscort){a.escorts[s.target]={started:true};u.fixed=false;u.maxMove=u.moveLeft=900;u.walkSpeed=Math.min(u.walkSpeed||280,320);}
 G.HonroObjectiveContributions?.interact(b,s.id,e.active,{rescue:s.kind==='rescue',progress:steps(b).some(q=>['hold','destroy','escort','reach'].includes(q.kind)&&a.done[q.id])});
 completeStep(app,s,e.active);if(!app.checkMission(e))e.finishAction();app.dirty=true;return true;
}
function attach(app,e){if(!active(e.b))return;initialize(e.b);G.HonroEvidenceQuests?.repairMissing(app);if(e.honroAct3Attached)return;e.honroAct3Attached=true;
 const hurt=e.hurt.bind(e);e.hurt=function(u,amount,...args){const source=e.unit(args[0]);if(u.honroProtected&&source?.side===0&&!e.projectileDamage(args[2]))return;return hurt(u,amount,...args);};
 const damage=e.damageTerrain.bind(e);e.damageTerrain=function(t,amount,depth=0,owner=e.b.active){const s=steps(e.b).find(q=>q.id===t.id),actor=e.unit(owner);
  if(s?.kind==='destroy'&&s.requiredClass&&(!actor||actor.side!==0||actor.summoned||actor.enthrall||actor.cls!==s.requiredClass)){e.message(H.hero[s.requiredClass].name+'의 사격이 필요하다.');return;}
  // Closed passages only open as the ordered objective is committed; direct
  // splash damage cannot skip a sealed archive or create an inconsistent save.
  if(steps(e.b).some(q=>q.opens===t.id)&&!t.broken)return;
  return damage(t,amount,depth,owner);
 };
}
function spawnHold(app,s,h){if(!s.wave||h.spawned>=s.wave.count)return true;const e=app.engine,b=e.b,m=marker(b,'wave-'+s.id);if(!m)return false;
 const before=new Set(b.units.map(u=>u.id)),key='act3-'+s.id,n=s.wave.count-h.spawned;
 // Fresh city defence reuses the density gate; old battle snapshots stay unchanged.
 if(b.honroStage===21&&G.HonroEncounterDensity?.active(b)){const mem=G.HonroEncounterDensity.memory(b);mem.existingWarnings??={};if(!mem.existingWarnings[key]){mem.existingWarnings[key]={serial:b.honroState.actorTurnSerial||0,round:b.round,offered:{}};app.event('성문 동쪽에서 산개 둘이 다가옵니다. 다음 행동 동안 주민 곁 방어 위치를 살피세요.');app.dirty=true;} }
 if(G.HonroAllies.execute(app,{type:'spawn',kind:s.wave.kind,n,x:m.x,y:m.y,spacing:145,maxDistance:580,source:key})===false)return false;
 for(const u of b.units)if(!before.has(u.id)&&u.side===1)u.honroCohort='reinforcement';
 h.spawned+=n;memory(b).events[key]=true;app.event('길목에 '+n+'명의 위협이 다가온다.');app.dirty=true;return true;
}
function holdTick(app,s,m){const b=app.engine.b,a=memory(b),end=b.teamEnds?.[1]||0,h=a.holds[s.id]??={progress:0,spawned:0,lastEnemyEnd:end,continuous:false};
 const guards=heroes(b).filter(u=>(!s.requiredClass||u.cls===s.requiredClass)&&sameFloor(u,m,s.radius)),guarded=guards.length>0&&(s.id!=='compare-ledgers'||G.HonroEvidenceQuests?.pairReady(b)!==false),priorProgress=h.progress,intervalEnded=end>h.lastEnemyEnd,contested=b.units.some(u=>u.side===1&&!u.honroObjectiveTarget&&u.summonKind!=='eater'&&!u.eaterCapturedBy&&alive(u)&&sameFloor(u,m,s.contestRadius||230));
 if(!guarded||contested)h.continuous=false;
 else if(end===h.lastEnemyEnd&&b.side!==1)h.continuous=true;
 if(end>h.lastEnemyEnd){if(h.continuous&&guarded&&!contested)h.progress++;h.lastEnemyEnd=end;h.continuous=guarded&&!contested;app.dirty=true;}
 if(h.guarded===undefined)h.continuous=guarded&&!contested;
 G.HonroObjectiveContributions?.maintain(b,s.id,h,guards,h.progress>priorProgress,s.rounds,h.continuous,intervalEnded);
 h.guarded=guarded;h.contested=contested;
 if(app.actorBoundary&&guarded)spawnHold(app,s,h);
}
function escortTick(app,s,m,dt){const e=app.engine,b=e.b,a=memory(b),npc=e.unit(s.target),escort=a.escorts[s.target];if(!escort?.started||!alive(npc))return;
 const route=(b.honroMarkers||[]).filter(q=>q.id.startsWith('route:'+s.id+':')).sort((a,b)=>Number(a.id.split(':').at(-1))-Number(b.id.split(':').at(-1)));
 escort.waypoints??={};let index=escort.waypoints[s.id]||0;while(route[index]&&sameFloor(npc,route[index],90))index++;escort.waypoints[s.id]=index;
 const goal=route[index]||m,dir=Math.sign(goal.x-npc.x),leaders=heroes(b).filter(u=>sameFloor(u,npc,950)&&(u.x-npc.x)*dir>65),lead=leaders.length>0;
 if(dt>0&&dir&&lead&&!app.dialogue){const before={x:npc.x,y:npc.y};npc.fixed=false;npc.moveLeft=900;e.walk(npc,dir,Math.min(dt,.05));G.HonroObjectiveContributions?.escort(b,s.id,npc,m,[leaders.slice().sort((u,v)=>Math.hypot(u.x-before.x,u.y-before.y)-Math.hypot(v.x-before.x,v.y-before.y))[0]],before);}
 if(sameFloor(npc,m,170)&&heroes(b).some(u=>sameFloor(u,npc,540))){G.HonroObjectiveContributions?.finishEscort(b,s.id);completeStep(app,s);}
}
function failure(b){if(!active(b))return null;const a=memory(b);if(b.honroStage===reunionStage(b)&&[1,2].includes(b.honroSplit?.version)&&!a.done['party-reunion']&&G.HonroSplitCampaign?.allPresent(b)===false)return'합류하기 전에 동행을 잃어 두 조사팀이 모일 수 없다. 이 장을 다시 시작하자.';if(b.units.some(u=>u.honroProtected&&!alive(u)))return'지켜야 할 주민을 잃었다. 이 장을 다시 시작할 수 있다.';
 for(const s of steps(b))if(!satisfied(b,s)&&s.requiredClass&&!heroes(b).some(u=>u.cls===s.requiredClass))return H.hero[s.requiredClass].name+'이 쓰러져 남은 목표를 이어갈 수 없다. 이 장을 다시 시작하자.';
 if(fireScenario(b)&&!firesStopped(b)&&(a.fireTurns||0)>=12)return'불길이 핵심 기록에 닿았다. 수문과 차단막부터 다시 확보하자.';return null;
}
function tick(app,dt){const e=app.engine,b=e.b;if(!active(b)||app.dialogue||app.modal?.classList.contains('open')||['won','lost'].includes(b.phase))return;initialize(b);const a=memory(b);
 if(sourceIssue(b))return;G.HonroEvidenceQuests?.observe(app); // Missing authoring is never a completed stage.
 if(fireScenario(b)&&!firesStopped(b)){const end=b.teamEnds?.[1]||0;a.fireStartEnd??=end;a.fireTurns=Math.max(0,end-a.fireStartEnd);}
 let s=current(b);while(s&&satisfied(b,s)){if(completeStep(app,s)===false)break;s=current(b);}
 // Commit the reunion at the same actor boundary that opens its Story lock.
 // A dash crossing the circle earlier in the action is not a completed meeting.
 if(s){const m=marker(b,s.id);if(s.kind==='route')G.HonroRouteBranches?.commit(app,s);else if(s.kind==='hold')holdTick(app,s,m);else if(s.kind==='reach'){const group=heroes(b),r=s.radius||180;const reunion=s.id==='party-reunion'&&[1,2].includes(b.honroSplit?.version),pairedExit=['waterworks-exit','workshop-exit','deep-depot-exit'].includes(s.id),present=!(reunion||pairedExit&&[1,2].includes(b.honroSplit?.version))||G.HonroSplitCampaign?.allPresent(b)===true,safeBoundary=!reunion||!!app.actorBoundary&&!app.modal?.classList.contains('open')&&!app.done;const crossing=G.HonroStakeCrossing?.active(b)&&G.HonroStakeCrossing.crossings(b).some(c=>c.markerId===s.id);const fieldArrival=crossing&&b.honroStage===25&&G.HonroEvidenceQuests?.fieldActive(b);if(G.HonroStakeCrossing?.allowsStep(b,s.id)!==false&&(!fieldArrival||group.every(u=>sameFloor(u,m,210)))&&safeBoundary&&present&&group.length&&(crossing||(s.allHeroes||pairedExit?group.every(u=>sameFloor(u,m,r)):group.some(u=>sameFloor(u,m,r))))){if(!crossing){const arrived=group.filter(u=>sameFloor(u,m,r));G.HonroObjectiveContributions?.arrive(b,s.id,s.allHeroes?arrived:[arrived.find(u=>u.id===b.active)||arrived[0]],p=>sameFloor(p,m,r));}completeStep(app,s);}}else if(s.kind==='escort')escortTick(app,s,m,dt);}
 s=current(b);while(s&&satisfied(b,s)){if(completeStep(app,s)===false)break;s=current(b);}
 const group=heroes(b);
 for(const step of readySteps(b))if(step.kind==='rescue'){const point=b.units.find(u=>u.id===step.target)||marker(b,step.id);G.HonroObjectiveContributions?.approach(b,step.id,group,point,220,!b.units.some(v=>v.side===1&&!v.honroObjectiveTarget&&v.summonKind!=='eater'&&!v.eaterCapturedBy&&alive(v)&&sameFloor(v,point,220)));}
 G.HonroObjectiveContributions?.observe(b,group);
 G.HonroEncounters.update(app,dt,{progress:Math.max(0,...group.map(u=>u.x)),height:Math.min(b.height,...group.map(u=>u.y)),broken:G.HonroQuestTargets.records(b).filter(t=>t.broken).length,collected:b.honroMarkers.filter(m=>m.collected).length});
 app.checkMission(e);
}
function entry(app,options={}){return [...(options.interlude===false?[]:app.stage.narration).map(text=>['서술',text,{kind:'narration',presentation:'inline'}]),...G.HonroRouteBranches?.entryLines(app.engine?.b)||[],...app.stage.story,['안내',app.stage.guide,{kind:'guide',storyId:'act3-guide-'+app.stage.id,storyTitle:app.stage.name,focus:state(app.engine?.b||{honroStage:app.stage.id,honroState:{},honroMarkers:[],terrain:[],units:[]}).targets[0]?.kind||'interact'}]];}
G.HonroAct3={active,initialize,marker,steps,memory,current,state,sourceIssue,interactionTarget,eligibility,use,attach,tick,failure,entry,satisfied,heroes,sameFloor,readySteps,fireScenario,firesStopped};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/objective-revision.js
(()=>{
'use strict';
(function(G){'use strict';
// Approved objective revision. Canonical authoring and fresh battles share this
// idempotent projection. Existing serialized battles retain their own terrain,
// markers, ordered steps, progress and reward ledger.
const H=G.HONRO_CONTENT,clone=x=>JSON.parse(JSON.stringify(x)),REVISION=2;
const legacy=H.stages.map(clone);
const removed={12:['rock-pin','clear-approach','hold-road','clear-quarry','exit'],13:['door-pin','clear-entry','hold-gate','clear-depth'],15:['shaft-pin','clear-water','hold-sluice','clear-gallery','exit'],16:['clear-court','hold-hall','clear-temple'],19:['hold-first','hold-second','hold-last','clear-souls'],17:['collapse-pin'],20:['exit-pin'],21:['wagon-lock'],23:['cargo-lock'],24:['courtyard-latch'],25:['rear-latch'],28:['outer-chain'],29:['sluice-chain','flight-hold','sluice-exit'],30:['route-pin']};
const gates={20:['gate-exit'],23:['cargo-gate'],24:['courtyard-door'],25:['rear-door'],28:['outer-door'],29:['sluice-door'],30:['route-door']};
const guides={
12:'길표의 진을 조사하세요. 높은 작업굴의 수레막이를 제압하고 이동하거나 열린 내리막으로 이탈하세요. 선택한 출구에 동행 한 명이 닿으면 됩니다.',
13:'석공에게 붙은 혼을 약화시켜 구조하고 빗장을 여세요. 가까운 위협을 막으며 마을 입구로 이동하세요. 전맵 소탕과 대기 방어는 필요 없습니다.',
15:'마른 관찰점에서 옛 고정 자리와 새 작업 흔적을 확인하세요. 수문을 열어 낮은 길로 가거나 수문을 건드리지 않고 고지로 통과하세요.',
17:'작업장을 제압하고 안전 버팀목을 세우세요. 들린 인양틀을 제압해 축을 복원하고 5라운드 지킵니다. 남은 적을 제압한 뒤 종지기의 작업 기록을 확인하세요.',
20:'출구 매복조를 제압하고 생존자 곁에서 출발시키세요. 실제 행렬을 중간 쉼터로 이끈 뒤 4라운드 방어합니다. 마지막 매복을 제압하고 행렬이 바깥 산길에 도착해야 완료됩니다.',
21:'살아 있는 주민 곁에서 구조하세요. 같은 층의 표시 범위에서 길목을 적 턴 2회 지킨 뒤 성문 안 출구로 이동하세요. 남은 적 전부를 처치할 필요는 없습니다.',
22:'휘겸으로 하층 봉인을 여세요. 중층에서 사건 보고를, 상층에서 호적을 각각 확보하세요. 상층 대조 범위에서 적 턴 2회를 지킨 뒤 오른쪽 관창 출구로 이동하면 완료됩니다.',
23:'운송 묶음을 확보하고 살아 있는 짐꾼 곁에서 출발시키세요. 같은 층에서 짐꾼보다 조금 앞서 길을 이끌고, 석교를 지나 짐꾼과 하역장 출구에 도착하세요.',
24:'휘겸으로 가문의 문장을 확인하고 담허로 사당 봉인을 푸세요. 토지문서를 확보한 뒤 출구로 이동하세요. 이곳 조사 뒤 두 팀으로 나뉩니다. 이어지는 조사와 문서고 전투가 끝날 때까지 쉼터나 장 사이 자동 회복이 없으니 지금 동행 상태를 살피세요.',
25:'휘겸으로 숨은 기록실을 열고 표시 범위에서 기록함을 적 턴 3회 지키세요. 선조의 조사 기록을 확보한 뒤 뒷길 출구로 이탈하면 완료됩니다.',
26:'공방 입구를 받치고 살아 있는 주민을 구조하세요. 표시 범위에서 장부를 적 턴 2회 지킨 뒤 수량 대조를 마치고 출구로 이동하세요.',
27:'12번째 적 턴 종료 전에 설오로 수문을, 휘겸으로 차단막을 조작하세요. 순서는 자유입니다. 두 불길을 막은 뒤 네 사람 모두 중앙 합류 범위에 모여 행동을 마치세요. 기록을 확보하고 운반자와 출구까지 동행하세요. 대화 중에는 소각이 진행되지 않습니다.',
28:'폐쇄 승인문과 사후 은폐 기록을 각각 확인하세요. 같은 층의 표시 범위에서 퇴로를 적 턴 2회 지킨 뒤 관아 바깥 출구로 이동하세요.',
29:'담허의 봉인 해체를 두 적 턴 지키고 현묵의 글을 확보하세요. 높은 수문길 또는 기둥 아래 점검다리 출구에 동행 한 명이 도착하면 됩니다.',
30:'세 기록을 대조한 뒤 나루의 표시 범위를 적 턴 3회 지키세요. 마지막으로 살아 있는 모든 동행을 같은 층의 옛길 입구에 모으면 완료됩니다.'
};
const goals={12:'길표의 진을 풀고 높은 작업굴 또는 열린 내리막으로 이탈',13:'석공을 구조하고 석문 빗장을 열어 마을 입구에 도착',15:'옛 흔적을 확인하고 배수한 낮은 길 또는 고지로 통과',17:'인양틀을 복구하고 방어해 종지기의 작업 기록 확보',20:'생존자 행렬을 중간 쉼터와 바깥 산길까지 호송',21:'주민 구조와 길목 방어 후 성문 안 출구에 도착',22:'사건 보고와 호적을 확보·대조하고 관창 출구에 도착',23:'운송 기록을 확보하고 살아 있는 짐꾼과 하역장 통과',24:'문장과 토지문서를 조사하고 기록실로 이어지는 출구에 도착',25:'조사 기록함을 지키고 문서를 확보해 뒷길로 이탈',26:'주민과 작업 장부를 지키고 수량 대조 후 출구에 도착',27:'두 불길을 막고 조사 청원서와 운반자를 지켜 탈출',28:'승인문과 은폐 기록을 대조하고 퇴로 방어 후 이탈',29:'현묵의 글을 확보하고 높은 수문길 또는 점검다리로 이탈',30:'세 기록을 대조하고 나루 방어 후 동행 전원 집결'};
function replaceLine(lines,find,text){for(const row of lines||[])if(row[1].includes(find))row[1]=text;}
for(const st of H.stages){
 if(st.hiddenWaterworks)continue;
 if(st.steps)st.steps=st.steps.filter(s=>!(removed[st.id]||[]).includes(s.id));
 if(goals[st.id])st.goal=goals[st.id];if(guides[st.id])st.guide=guides[st.id];
 if(st.id===22){const at=st.steps.findIndex(s=>s.id==='upper-latch');st.steps[at]={id:'upper-register',label:'상층 저문골 호적 확보',kind:'interact'};st.steps.find(s=>s.id==='ledger-case').label='중층 저문골 사건 보고 확보';st.steps.find(s=>s.id==='ledger-case').opens='upper-door';st.steps.find(s=>s.id==='archive-seal').label='하층 서고 봉인 열기';st.steps.find(s=>s.id==='compare-ledgers').label='상층에서 사건 보고와 호적 대조';}
 if(st.id===27){const water=st.steps.find(s=>s.id==='water-release');Object.assign(water,{kind:'interact',label:'수문을 열어 불길 막기',parallelGroup:'fire-control'});Object.assign(st.steps.find(s=>s.id==='fire-screen'),{parallelGroup:'fire-control',label:'차단막을 세워 불길 막기'});st.steps.splice(2,0,{id:'party-reunion',label:'두 조사팀이 중앙 뜰에 모이기',kind:'reach',allHeroes:true,radius:440,splitOnly:true});}
 if(st.act2Plan&&removed[st.id])st.act2Plan.sequence=st.act2Plan.sequence.filter(s=>!removed[st.id].includes(typeof s==='string'?s:s.id));
}
replaceLine(H.stages[11].story,'저 바위를 받친','낙석이 아래 홈을 메웠소. 길표에 다가가려면 먼저 작업장을 비워야 하오.');
replaceLine(H.stages[14].story,'활로 끊을','천장 아래 오래된 인양구가 보입니다. 마른 관찰점에서 남은 흔적을 살펴보겠습니다.');
replaceLine(H.stages[16].beats?.brace,'끊으시오','버팀목이 천장을 받쳤소. 돌의 무게가 이쪽으로 쏠리지 않게 지키며 안쪽 인양틀의 축을 복원합시다.');
replaceLine(H.stages[19].story,'출구까지 돌이','무너진 출구를 주민들이 치우고 있소. 매복부터 걷어 내고 사람들을 부릅시다.');
replaceLine(H.stages[20].story,'저 고리부터','수레 밑에 사람이 있습니다. 곁의 위협부터 치우고 꺼내겠습니다.');
replaceLine(H.stages[21].story,'위층 걸쇠','위층 서가에도 장부가 남아 있습니다. 같은 해의 호적을 찾아오겠습니다.');
replaceLine(H.stages[26].story,'수문 고정구','수문 쪽으로 가겠습니다. 물길을 열면 저쪽 불길을 막을 수 있습니다.');
// The split party must hear every established fact from people actually there.
// These are readings of existing records, not new expertise or later revelations.
if(!H.stages[23].hiddenWaterworks){
H.stages[23].outro=G.HonroAct3Content.scene('act3-r2-outro-24',H.stages[23].name,[
 ['휘겸','사당 뒤 기록실은 담허 도사와 살피겠소. 가문의 문장이 있으면 내가 열 수 있을 것이오.'],
 ['설오','소단과 성 밖 공방의 기록을 찾겠습니다. 관아 바깥 길에서 다시 만나겠습니다.'],
 ['소단','운송 묶음의 수량과 날짜는 적어 둘게요. 서로 찾은 걸 나중에 맞춰 봐요.']
]);
H.stages[24].beats['investigation-record']=[
 ['휘겸','조직적인 저항은 없었다. 대도사가 현장에서 주민 전원을 죽였다고… 선조가 증언을 모았소.'],
 ['담허','그 뒤 무명사에서 대종을 주조하고 있었다는 기록도 있네.'],
 ['휘겸','저문골에서 가져간 것들과 그 종이 이어져 있었소.']
];
H.stages[25].story[1]=['소단','종이는 넓게 펴 주세요. 마르는 동안 이쪽을 지킬게요.',{storyId:'act3-r2-entry-26',storyTitle:H.stages[25].name}];
H.stages[25].beats['casting-tally']=[
 ['설오','운송 묶음의 금속량과 이 장부의 주조량이 거의 같습니다. 유골과 재도 장례 때와는 다르게 처리했다고 적혀 있습니다.'],
 ['소단','종 곁에 오래된 혼들이 겹쳐 있었어요. 사람의 흔적까지 쓴 걸까요?'],
 ['소단','어떻게 썼는지는 이 조각에 없네요. 남은 기록을 더 찾아야겠어요.']
];
H.stages[26].beats['party-reunion']=[
 ['휘겸','대도사가 저문골 주민 전원을 죽였다는 선조의 조사 기록을 찾았소. 참사 뒤 무명사에서 대종을 만든 기록도 있소.'],
 ['설오','공방의 주조량이 저문골에서 거둔 금속량과 거의 맞았습니다. 유골과 재도 장례 때와는 다르게 처리했다고 합니다.'],
 ['담허','어떤 공정으로 썼는지는 아직 모르네. 이제 함께 움직이며 남은 기록부터 지키세.']
];
}
let registeredStaging=null;
function registerScenes(){const staging=G.HonroStoryStaging;if(!staging||registeredStaging===staging)return;for(const version of [1,2]){const stage=version===1?27:28,content=version===1?G.HONRO_SPLIT_V1?.content.find(s=>s.id===27):H.stages[27];staging.register({id:'act3-party-reunion-v'+version,stage,title:'다시 모인 기록',steps:[{type:'look',at:{marker:'party-reunion'},duration:450,caption:'두 조사팀이 서로 가져온 기록을 펼친다.'},{type:'dialogue',lines:content?.beats?.['party-reunion']||[]}]});}registeredStaging=staging;}
function stageScene(app,s){if(s.id!=='party-reunion'||!G.HonroStoryStaging)return false;registerScenes();const id='act3-party-reunion-v'+(app.engine.b.honroSplit?.version===1?1:2);if(app.engine.b.honroStaging?.once?.[id])return true;return G.HonroStoryStaging.request(app,id);}
// Stale focus cues must never point at a deleted device.
for(const id of [12,15,20,21,22,23,27])for(const row of H.stages[id-1].story||[])if(row[2]?.focus==='seal')row[2].focus='interact';
if(!H.stages[26].hiddenWaterworks)for(const row of H.stages[26].story){if(row[0]==='휘겸')row[2]={...row[2],focus:'fire-screen'};if(row[0]==='설오')row[2]={...row[2],focus:'water-release'};}
function active(b){return !b?.honroCustom&&b?.honroObjectiveRevision>=REVISION;}
const historicalWaterworks=b=>[25,27].includes(b?.honroStage)&&b.honroWaterworksRevision>0&&b.honroWaterworksRevision<3?G.HONRO_WATERWORKS_V2?.content.find(q=>q.id===b.honroStage):null;
function contentFor(b,st){if(b?.honroSplit?.version===1||b&&!b.honroWaterworksRevision){const old=G.HONRO_SPLIT_V1?.content.find(q=>q.id===b.honroStage);if(old)return old;}const waterworks=historicalWaterworks(b);if(waterworks)return waterworks;return active(b)?st:legacy[(b?.honroStage||st.id)-1]||st;}
function storedSteps(b,act){return contentFor(b,H.stages[b.honroStage-1]).steps||[];}
function author(project,options={}){
 const p={...project,stages:project.stages.map(original=>{
  const id=original.metadata?.stageId;if(!original.metadata?.campaign||id<Math.max(11,options.minStage||11)||id>(options.maxStage||30)||!H.stages[id-1])return original;
  if(!options.force&&original.initialState?.honroObjectiveRevision>=REVISION)return original;
  const map=clone(original),waterworks=!!original.initialState?.honroWaterworksRevision,st=!waterworks&&H.stages[id-1].hiddenWaterworks?(G.HONRO_SPLIT_V1?.content.find(s=>s.id===id)||H.stages[id-1]):H.stages[id-1];
  // Saved horizontal waterworks own their ordered goals and authored labels.
  // A force-author pass must not mix current vertical goals into old geometry.
  const historic=historicalWaterworks({honroStage:id,honroWaterworksRevision:original.initialState?.honroWaterworksRevision});
  if(historic){map.initialState.honroObjectiveRevision=REVISION;map.initialState.honroAct3Steps??=clone(historic.steps);return map;}
  // Current waterworks maps own their topology and controls; do not replay
  // older device removals or chapter-27 marker ordering.
  if(waterworks){
   map.initialState.honroObjectiveRevision=REVISION;map.initialState.honroAct3Steps=clone(st.steps);
   for(const s of st.steps||[]){const m=map.markers.find(m=>m.id===s.id||m.id==='marker-'+s.id);if(!m)continue;m.label=s.label;if(['interact','rescue'].includes(s.kind))m.action='act3';if(s.requiredClass)m.requiredClass=s.requiredClass;else delete m.requiredClass;}
   for(const o of map.objectives||[])if(o.type==='campaign')o.label=st.goal;
   return map;
  }
  const drops=[...(removed[id]||[]),...(id===22?['upper-latch']:[]),...(id===27&&!st.hiddenWaterworks?['water-release']:[])];
  map.initialState??={};map.initialState.honroObjectiveRevision=REVISION;
  if(id>=11&&id<=20)map.initialState.honroAct2Steps=clone(st.steps);
  if(id>=21)map.initialState.honroAct3Steps=clone(st.steps);
  // Spatial contracts name the same deleted objective/door IDs. Remove only
  // these obsolete dependencies and sites; keep all unrelated route guards.
  const retired=new Set([...drops,...(gates[id]||[])]),space=map.design?.space;
  if(space){for(const record of [...(space.connections||[]),...(space.routes||[])])if(record.requires)record.requires=record.requires.filter(q=>!retired.has(q.objectiveId)&&!retired.has(q.terrainId));for(const [key,site] of Object.entries(space.sites||{}))if(retired.has(key)||retired.has(site.objectiveId)||retired.has(site.target?.terrainId))delete space.sites[key];}
  map.terrains=map.terrains.filter(t=>!drops.includes(t.id)&&!(gates[id]||[]).includes(t.id));
  map.markers=map.markers.filter(m=>!drops.some(key=>m.id===key||m.id==='marker-'+key));
  if(id===12){const floor=map.terrains.find(t=>t.id==='act2-floor'),restored=floor?.properties?.honroRestoredVertices;if(restored){const surface=new Map(restored.slice(0,-2).map(v=>[v.x,v.y]));for(const v of floor.points)if(surface.has(v.x)&&v.y<map.height)v.y=surface.get(v.x);delete floor.properties.honroRestoredVertices;}}
  if(id===15){map.initialState.honroCaveHangingClue??=clone(map.initialState.honroCaveHangingTarget||{});delete map.initialState.honroCaveHangingTarget;}
  if(id===17){map.markers=map.markers.filter(m=>m.id!=='rebuild-brace');map.terrains=map.terrains.filter(t=>t.id!=='gate-debris');}
  if(id===22&&!map.markers.some(m=>m.id==='upper-register')){const base=map.markers.find(m=>m.id==='compare-ledgers');map.markers.push({id:'upper-register',type:'act3',action:'act3',x:base.x-260,y:base.y,label:'상층 저문골 호적 확보'});}
  if(id===27&&!st.hiddenWaterworks){const old=original.markers.find(m=>m.id==='water-release'||m.id==='marker-water-release');map.markers.push({...clone(old),id:'water-release',type:'act3',action:'act3',requiredClass:'archer',label:'수문을 열어 불길 막기'});delete map.markers.at(-1).target;if(!map.markers.some(m=>m.id==='party-reunion')){const base=map.markers.find(m=>m.id==='petition-record');map.markers.push({id:'party-reunion',type:'act3',x:base.x,y:base.y,label:'두 조사팀이 중앙 뜰에 모이기'});}}
  if(id===27)map.markers.sort((a,b)=>a.id.localeCompare(b.id));
  for(const s of st.steps||[]){const m=map.markers.find(m=>m.id===s.id||m.id==='marker-'+s.id);if(m){m.label=s.label;if(['interact','rescue'].includes(s.kind))m.action=id>=21?'act3':'act2';if(s.requiredClass)m.requiredClass=s.requiredClass;else delete m.requiredClass;}}
  for(const o of map.objectives||[])if(o.type==='campaign')o.label=st.goal;
  return map;
 })};return p;
}
G.HonroObjectiveRevision={version:REVISION,active,contentFor,storedSteps,author,removed,gates,legacy,registerScenes,stageScene};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/stage18-bell.js
(()=>{
'use strict';
(function(G){'use strict';
// Fresh bell expeditions opt in explicitly. Never upgrade an old Continue.
const A=G.HonroAct2,W=G.HonroAllies,E=G.HonroEncounters,C=G.HONRO_CORE,H=G.HONRO_CONTENT;
const clone=x=>JSON.parse(JSON.stringify(x));
const legacy=clone(H.stages[17]),active=b=>b?.honroStage===18&&!b.honroCustom&&b.honroBellRevision===1;
const steps=legacy.steps.filter(s=>s.id!=='lower-chain').map(s=>s.id==='clear-wards'?{...s,label:'억제진 진입 수비대 제압'}:s.id==='upper-chain'?{...s,label:'장력 고정구 해제',requiredClass:undefined,parallelGroup:'bell-stabilize'}:s.id==='hold-silence'?{...s,parallelGroup:'bell-stabilize'}:s);
steps.splice(steps.findIndex(s=>s.id==='leak'),0,{id:'bell-descent',label:'빈 쓸림면을 확인하고 대종 내려앉히기',kind:'bell-descent'});
// Map authoring copies these steps; the battle snapshot remains the authority.
Object.assign(H.stages[17],{steps:clone(steps),goal:'억제진과 장력 고정구를 함께 안정시켜 대종을 내리고, 누출혼과 종지기 제압',guide:'입구와 암정 앞줄의 진입 수비대를 제압하세요. 상층과 혼 지원은 남아 반격합니다. 담허로 억제를 시작한 뒤 4라운드 유지와 장력 고정구 해제를 함께 진행하세요. 고정구는 서쪽 먼 사격턱의 기본 화살이나 가까운 정비턱의 기본 공격으로 풀 수 있습니다. 두 조건 뒤 종의 쓸림면을 비우면 한 번 내려앉습니다. 아래 영구바닥과 양쪽 귀환길은 남습니다. 소단의 누출혼 분리, 종지기 비살상 제압, 잔여 들림 제압으로 마칩니다.',beats:{...legacy.beats,
 'clear-wards':[['서술','암정 앞줄이 물러섰다. 위쪽 석등과 들림은 돌턱 뒤에서 아직 움직였다.'],['담허','억제진까지 가는 길은 열렸네. 위쪽 석등귀와 들린 것들은 내가 자리를 바꿔 가며 막겠네.']],
 'hold-silence':[['서술','담허의 옷자락이 떨림을 멈췄다. 종소리 아래에서 서로 다른 숨소리가 들렸다.'],['담허','울림은 잡혔네. 무게가 받침으로 옮겨갈 때까지 이 자리를 지키겠네.']],
 'upper-chain':[['서술','장력 고정구가 빠졌다. 긴 사슬이 느슨해졌지만, 종은 아직 위에 머물렀다.'],['휘겸','받침이 버티고 있소. 종 아래 가장자리에 남은 이가 없는지 확인합시다.']],
 'bell-descent':[['서술','거대한 청동 입술이 천천히 내려와 받침돌에 멎었다. 종은 깨지지 않았다. 그 아래에는 사람이 돌아 나올 길이 남았다.'],['소단','이제 종 아래 열린 틈으로 새는 혼을 붙잡을 수 있어요. 안에 엉킨 혼부터 나눌게요.']]
}});
const contentFor=G.HonroObjectiveRevision.contentFor;
G.HonroObjectiveRevision.contentFor=function(b,st){return b?.honroStage===18&&!b.honroBellRevision?legacy:contentFor(b,st);};
const memory=b=>(b.honroState.bellDescent??={version:1,status:'suspended',offset:0,count:0,warnings:{},entries:{},opportunities:{}});
const done=(b,id)=>!!A.memory(b).done[id];
function satisfied(b,s){return active(b)&&s.kind==='bell-descent'?memory(b).status==='settled':null;}
const alive=u=>!u.dead&&u.hp>0;
const intersects=(a,z)=>a.x+a.w>z.x&&a.x<z.x+z.w&&a.y+a.h>z.y&&a.y<z.y+z.h;
const sweepCache=new WeakMap();
function sweepGeometry(b){const spec=b.honroBellDescent;if(!spec)return[];if(sweepCache.has(spec))return sweepCache.get(spec);let polygons=spec.sweepPolygons;
 if(!polygons?.length){polygons=[];for(const id of spec.terrainIds||[]){const t=G.HonroQuestTargets.records(b).find(t=>t.id===id);if(!t)continue;const ps=C.poly(t).map(p=>({x:p.x,y:p.y-(memory(b).offset||0)})),drop=spec.distance||200,moved=ps.map(p=>({x:p.x,y:p.y+drop}));polygons.push(ps,moved);for(let i=0;i<ps.length;i++){const j=(i+1)%ps.length;if(Math.abs(ps[i].x-ps[j].x)<.001)continue;polygons.push([ps[i],ps[j],moved[j],moved[i]]);}}}
 const shapes=(polygons||[]).map(ps=>{const vertices=(ps.points||ps).map(p=>Array.isArray(p)?{x:p[0],y:p[1]}:{x:p.x,y:p.y}),xs=vertices.map(p=>p.x),ys=vertices.map(p=>p.y);return{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys),vertices,broken:false,oneWay:false};});sweepCache.set(spec,shapes);return shapes;
}
function swept(b,box){const shapes=sweepGeometry(b);return shapes.length?shapes.some(t=>intersects(box,t)&&C.terrainRectIntersects(t,box.x,box.y,box.w,box.h,.01)):(b.honroBellDescent?.sweep||[]).some(z=>intersects(box,z));}
function occupants(b){const out=[];
 for(const u of b.units)if(alive(u)&&swept(b,{x:u.x-u.r-8,y:u.y-u.h-8,w:u.r*2+16,h:u.h+16}))out.push({kind:u.summoned?'summon':u.side===0?'hero':u.honroProtected?'resident':'enemy',id:u.id,label:u.name||u.id,x:u.x,y:u.y});
 for(const s of b.stakes||[])if(s.active!==false&&(!Number.isFinite(s.expires)||s.expires>b.round)&&swept(b,{x:s.x-24,y:s.y-74,w:48,h:80}))out.push({kind:'stake',id:s.id,label:'진목',x:s.x,y:s.y});
 for(const p of b.projectiles||[])if(swept(b,{x:p.x-(p.radius||6),y:p.y-(p.radius||6),w:(p.radius||6)*2,h:(p.radius||6)*2}))out.push({kind:'projectile',id:p.id,label:'날아가는 탄',x:p.x,y:p.y});
 return out;
}
function safeBoundary(app){const e=app.engine,b=e.b;return !!app.actorBoundary&&!app.dialogue&&!['flight','review','summon','won','lost'].includes(b.phase)&&!b.projectiles.length&&!b.volley&&!b.summonTurn&&!b.units.some(u=>u.meleeAction||u.meleeFollow==='ready')&&!e.settleBusy();}
function shift(b,offset){const m=memory(b),delta=offset-(m.offset||0);if(Math.abs(delta)<1e-9)return;const spec=b.honroBellDescent||{},ids=new Set(spec.terrainIds||[]);
 for(const list of [b.terrain,b.honroWorldTerrain])for(const t of list||[])if(ids.has(t.id)){t.y+=delta;t.vertices=t.vertices?.map(p=>({...p,y:p.y+delta}));}
 const elements=new Set(spec.elementIds||[]);
 for(const list of [b.honroEnvironment?.placements,b.honroLandmarks,b.honroElements])for(const p of list||[])if(elements.has(p.id)){p.y+=delta;if(p.stage18Bell&&Number.isFinite(p.stage18Bell.lipY))p.stage18Bell.lipY=p.y;}
 m.offset=offset;if(m.status!=='lowering')b.sceneVersion=(b.sceneVersion||0)+1;
}
function settle(app){const b=app.engine.b,m=memory(b),spec=b.honroBellDescent;
 shift(b,spec.distance);m.status='settled';m.count=1;m.completedSerial=b.honroState.actorTurnSerial||0;m.completedRound=b.round;m.blockers=[];m.reason='';
 for(const id of spec.openTerrainIds||[]){for(const list of [b.terrain,b.honroWorldTerrain]){const t=list?.find(t=>t.id===id);if(t)t.broken=true;}}
 // These named fixed links are authored in both maps; no actor is carried.
 b.sceneVersion++;app.dirty=true;app.event('대종이 받침에 멎었다. 아래 귀환길과 동쪽 측면길이 열려 있다.',{kind:'narration',source:'bell-settled'});
 if(m.camera&&app.scene?.storyRelease)app.scene.storyRelease(m.camera,350);
 app.engine.emit?.('save');
}
function transition(app){const e=app.engine,b=e.b,m=memory(b);if(!b.honroBellDescent||m.status==='settled'||m.status==='lowering')return;
 const hold=A.steps(b).find(s=>s.id==='hold-silence'),anchor=G.HonroQuestTargets.records(b).find(t=>t.id==='upper-chain');
 if(!done(b,'silence')||!hold||!A.satisfied(b,hold)||!anchor?.broken)return;
 const serial=b.honroState.actorTurnSerial||0;
 if(m.status==='suspended'){
  m.status='warning';m.warnedSerial=serial;m.warnedRound=b.round;m.opportunities={};m.warnedHeroes=e.heroesAlive().filter(u=>!u.summoned&&!u.enthrall).map(u=>u.id);
  m.reason='각 동행이 경고 뒤 한 번 움직이거나 행동을 마치면 안전을 확인합니다.';
  app.event('사슬의 장력이 풀린다. 종 가장자리의 황토빛 쓸림면을 비우세요. 아래 푸른 바닥과 양쪽 귀환길은 안전합니다. 각 동행에게 이동 기회가 남습니다.');app.dirty=true;return;
 }
 if(app.actorBoundary&&serial>m.warnedSerial&&m.warnedHeroes.includes(app.actorBoundary))m.opportunities[app.actorBoundary]=serial;
 const waiting=m.warnedHeroes.filter(id=>{const u=e.unit(id);return u&&alive(u)&&!m.opportunities[id];});
 const blocks=occupants(b);m.blockers=blocks;
 const reason=waiting.length?'이동 기회 대기 · '+waiting.map(id=>e.unit(id)?.name||id).join('·'):blocks.length?'하강 대기 · '+[...new Set(blocks.map(v=>v.label))].join('·')+' · 아래 바닥이나 양쪽 귀환길로 이동하세요':'쓸림면이 비었습니다. 다음 안전한 행동 종료에 내려앉습니다.';
 if(m.reason!==reason){m.reason=reason;app.dirty=true;}
 m.status=waiting.length?'warning':'waiting';
 if(waiting.length||blocks.length||!safeBoundary(app))return;
 m.status='lowering';b.sceneVersion=(b.sceneVersion||0)+1;m.elapsed=0;m.duration=.9;m.startOffset=m.offset||0;m.reason='대종이 받침에 내려앉는 중';app.dirty=true;
 if(app.scene?.storyFocusPoint){m.camera={x:app.scene.x,y:app.scene.y,scale:app.scene.scale,manual:app.scene.manual};const at=b.honroBellDescent.resting||{};app.scene.storyFocusPoint(at.x||7200,(at.y||7000)-400,180,.32);}
 app.event('청동 입술이 받침돌을 향해 천천히 내려온다.');e.emit?.('save');
}
function entryFor(b,source){const spec=b.honroBellDescent?.entries||{},index=source==='keeper-retaliation'?0:Math.floor(Number(source.split('-').at(-1))/3);const list=source==='keeper-retaliation'?spec.keeper:spec.hold;return list?.[index%(list?.length||1)];}
function warnWave(app,source){const b=app.engine.b,m=memory(b);if(m.warnings[source]||!entryFor(b,source))return;m.warnings[source]={serial:b.honroState.actorTurnSerial||0,round:b.round};
 app.event(source==='keeper-retaliation'?'동쪽 정비문에서 곡괭이 넷이 들린다. 다음 행동 뒤 들어올 마지막 보복조다.':entryFor(b,source).side==='west'?'서쪽 암틈에서 종울림이 모인다. 다음 행동 뒤 억제진으로 들어온다.':'종입술 바깥에서 잔울림이 엉긴다. 다음 행동 뒤 들어올 틈을 살피세요.');app.dirty=true;
}
function prepareWaves(app){const b=app.engine.b,a=A.memory(b),hold=A.steps(b).find(s=>s.id==='hold-silence'),h=a.holds?.['hold-silence'];
 if(done(b,'silence')&&!done(b,'hold-silence')&&(h?.spawned||0)<(hold?.wave?.count||0)&&h?.waveRound!==b.round)warnWave(app,'hold-silence-'+(h?.spawned||0));
 const boss=app.engine.unit('act2-keeper');if(boss&&boss.hp<=boss.maxHp*.6&&!a.events['keeper-retaliation'])warnWave(app,'keeper-retaliation');
}
const execute=W.execute;
W.execute=function(app,action){const b=app.engine?.b,source=action?.source;
 if(!active(b)||action?.type!=='spawn'||!(source==='keeper-retaliation'||/^hold-silence-(0|3|6)$/.test(source||'')))return execute(app,action);
 const mem=memory(b),warning=mem.warnings[source],entry=entryFor(b,source);if(!entry||!warning||(b.honroState.actorTurnSerial||0)<=warning.serial)return false;
 const n=action.n||1,choices=[entry,...(entry.alternates||[]).map(p=>({...p,side:entry.side}))],flying=!!G.HonroWorld.archetypes[action.kind]?.flying;
 const at=choices.find(p=>!b.units.some(u=>alive(u)&&u.side!==1&&Array.from({length:n},(_,i)=>p.x+(i-(n-1)/2)*110).some(x=>Math.abs(u.x-x)<u.r+220)&&Math.abs(u.y-(p.y-(flying?255:0)))<330));if(!at)return false;
 const previous=new Set(b.units.map(u=>u.id)),result=execute(app,{...action,x:at.x,y:at.y,support:at.surfaceId||at.support,spacing:110,maxDistance:260});if(result===false)return false;
 for(const u of b.units)if(u.side===1&&!previous.has(u.id)){
  if(u.elite){u.combatBaseHp/=1.25;u.hp=u.maxHp=Math.round(u.combatBaseHp*C.DIFFICULTIES[b.difficulty].hp);u.honroXpWeight/=1.25;}u.elite=false;u.armor=.04;u.honroBellEntry=at.side;
 }
 mem.entries[source]={side:at.side,x:at.x,y:at.y,round:b.round,serial:b.honroState.actorTurnSerial||0};return result;
};
const cap=E.populationCap;E.populationCap=function(b){return active(b)?Math.max(cap(b),b.honroBellPopulationCap||53):cap(b);};
const attach=A.attach;A.attach=function(app,e){const out=attach(app,e),b=e.b;if(!active(b)||e.honroBellAttached)return out;e.honroBellAttached=true;memory(b);
 const recover=e.recover.bind(e);e.recover=function(u){const out=recover(u);A.subdue(e,u);return out;};
 const can=e.canAct.bind(e);e.canAct=function(){return memory(e.b).status!=='lowering'&&can();};
 const tick=e.tick.bind(e);e.tick=function(dt){const m=memory(e.b);if(m.status!=='lowering')return tick(dt);
  m.elapsed=Math.min(m.duration||.9,(m.elapsed||0)+Math.max(0,dt));const t=m.elapsed/(m.duration||.9),ease=t*t*(3-2*t);shift(e.b,(m.startOffset||0)+(e.b.honroBellDescent.distance-(m.startOffset||0))*ease);app.dirty=true;
  if(t>=1)settle(app);
 };
 const refresh=e.refreshActivation.bind(e);e.refreshActivation=function(){refresh();const heroes=e.heroesAlive(),mem=memory(b);mem.alert??={};for(const [cell,radius]of Object.entries(b.honroBellActivation||{})){const units=e.alive(1).filter(u=>u.honroBellCell===cell);if(!units.length)continue;const alert=mem.alert[cell]||units.some(u=>u.aggroUntil>=b.round||heroes.some(h=>Math.hypot(h.x-u.x,(h.y-u.y)*.8)<radius));if(alert)mem.alert[cell]=true;else for(const u of units)u.awake=false;}};e.refreshActivation();return out;
};
const tick=A.tick;A.tick=function(app,dt){const b=app.engine?.b;if(!active(b))return tick(app,dt);if(memory(b).status==='lowering')return;
 app.engine.refreshActivation();prepareWaves(app);transition(app);if(memory(b).status==='lowering')return;const out=tick(app,dt);transition(app);return out;
};
const state=A.state;A.state=function(b){const out=state(b);if(!active(b))return out;const a=A.memory(b),m=memory(b),hold=A.steps(b).find(s=>s.id==='hold-silence'),anchor=G.HonroQuestTargets.records(b).find(t=>t.id==='upper-chain');
 if(done(b,'silence')&&(!A.satisfied(b,hold)||!anchor?.broken)){
  const h=a.holds?.['hold-silence'],site=b.honroMarkers.find(s=>s.id==='hold-silence');out.summary=`${A.steps(b).filter(s=>A.satisfied(b,s)).length}/8 · 병렬 안정화 · 억제 ${h?.progress||0}/4라운드${h?.contested?' (적 점유)':''} · 고정구 ${anchor?.broken?'해제':'남음'}`;
  out.targets=[...(!A.satisfied(b,hold)&&site?[{id:'hold-silence',kind:'interact',x:site.x,y:site.y,label:'담허 · 억제진 4라운드'}]:[]),...(!anchor?.broken&&anchor?[{id:'upper-chain',kind:'seal',x:anchor.x+anchor.w/2,y:anchor.y,label:'장력 고정구 · 기본 공격',box:anchor}]:[])];
 }
 if(['warning','waiting','lowering'].includes(m.status)){out.summary='4/8 · '+m.reason;out.targets=[{id:'bell-descent',kind:'interact',x:b.honroBellDescent.resting?.x||7200,y:b.honroBellDescent.resting?.y||7100,label:m.reason}];}
 return out;
};
G.HonroStage18Bell={active,memory,steps,legacy,satisfied,sweepGeometry,swept,occupants,safeBoundary,transition,shift,entryFor,prepareWaves};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/stage30-ferry.js
(()=>{
'use strict';
(function(G){'use strict';
// A battle snapshot opts in; Continue never replaces an old map or roster.
const A=G.HonroAct3,W=G.HonroAllies,E=G.HonroEncounters,C=G.HONRO_CORE;
const active=b=>b?.honroStage===30&&!b.honroCustom&&b.honroFerryRevision===1;
// Version2 reserves the existing upper-bank guard for the actual high route.
// Contact with one of its authored connected supports is required: a low-quay
// jump, summon or floating body merely passing above y5150 is not that choice.
const upperBankSupports=new Set(['sf-granite-cape','sf-cape-east-descent','sf-cape-bank-link','sf-bank-inner','sf-high-response-ledge','sf-east-outer-grade','sf-old-road-west-rise','sf-old-road-west-bridge','sf-old-road-gather','sf-old-road-return-flight','sf-old-road-upper-flight']);
function pressureEnemies(e,candidates){const b=e.b;if(!active(b)||b.honroFerrySpec?.pressureVersion!==2)return candidates;
 const rear=e.alive(1).filter(u=>u.honroFerryCell==='bank-rearguard');if(!rear.length)return candidates;
 const engaged=rear.some(u=>u.aggroUntil>0&&u.aggroUntil>=b.round)||b.units.some(u=>hero(u)&&u.y<5150&&!u.airborne&&!u.jumping&&upperBankSupports.has(e.contactSurface(u.x,u.y-4,u.y+5)?.t.id)&&rear.some(v=>Math.hypot(u.x-v.x,u.y-v.y)<1800));
 // Only remove unavailable E members. The shared awake/aggro eligibility,
 // fairness sort, three-actor cap, target choice and attack checks remain final.
 return engaged?candidates:candidates.filter(u=>u.honroFerryCell!=='bank-rearguard');
}
const sources=['act3-response-30-0','act3-response-30-1','act3-ferry-hold','act3-response-30-2'];
const alive=u=>!!u&&!u.dead&&u.hp>0,hero=u=>alive(u)&&u.side===0&&!u.summoned&&!u.enthrall;
function memory(b){b.honroState??={flags:{},collected:[]};return b.honroState.ferry??={version:1,status:'moored',elapsed:0,duration:.8,commitCount:0,warnings:{},entries:{},offered:{},blockers:[]};}
const serial=b=>b.honroState.actorTurnSerial||0;
const boundary=app=>[serial(app.engine.b),app.engine.b.round,...app.engine.b.teamEnds,app.actorBoundary].join(':');
const ended=app=>app.done||['won','lost'].includes(app.engine.b.phase);
const paused=app=>!!app.dialogue||!!app.modal?.classList.contains('open')||!!app.charging||!!G.HonroStory?.turnPaused?.(app);
function safeMotion(app){const e=app.engine,b=e.b;return !ended(app)&&!paused(app)&&!['flight','review','summon','ally'].includes(b.phase)&&!(b.projectiles||[]).length&&!b.volley&&!b.summonTurn&&!b.units.some(u=>alive(u)&&(u.meleeAction||u.meleeFollow==='ready'))&&!e.settleBusy();}
const safeBoundary=app=>!!app.actorBoundary&&safeMotion(app);
const overlaps=(a,z)=>a.x+a.w>z.x&&a.x<z.x+z.w&&a.y+a.h>z.y&&a.y<z.y+z.h;
function polygons(b){const spec=b.honroFerrySpec||{},out=[];
 for(const z of spec.sweepPolygons||[]){const ps=(z.points||z).map(p=>Array.isArray(p)?{x:p[0],y:p[1]}:{x:p.x,y:p.y}),xs=ps.map(p=>p.x),ys=ps.map(p=>p.y);if(ps.length>=3)out.push({x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys),vertices:ps,broken:false,oneWay:false});}
 if(!out.length)for(const z of spec.sweep||[])out.push({...z,vertices:[{x:z.x,y:z.y},{x:z.x+z.w,y:z.y},{x:z.x+z.w,y:z.y+z.h},{x:z.x,y:z.y+z.h}],broken:false,oneWay:false});
 // Include both the final solid and disappearing support. An actor's feet
 // count as occupancy, so deleting a support can never start an unseen fall.
 for(const id of [...(spec.enableTerrainIds||[]),...(spec.disableTerrainIds||[])]){const t=b.terrain.find(t=>t.id===id);if(t)out.push({...t,broken:false,oneWay:false});}
 return out;
}
function swept(b,box){return polygons(b).some(t=>overlaps(box,t)&&C.terrainRectIntersects(t,box.x,box.y,box.w,box.h,.01));}
function circleTouches(t,x,y,r){const ps=C.poly(t);let inside=false;
 for(let i=0,j=ps.length-1;i<ps.length;j=i++){
  const a=ps[j],p=ps[i];if((a.y>y)!==(p.y>y)&&x<(p.x-a.x)*(y-a.y)/(p.y-a.y)+a.x)inside=!inside;
  const dx=p.x-a.x,dy=p.y-a.y,den=dx*dx+dy*dy,v=den?Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/den)):0;if(Math.hypot(x-a.x-v*dx,y-a.y-v*dy)<=r)return true;
 }return inside;
}
function occupants(b){const out=[],shapes=polygons(b),rect=box=>shapes.some(t=>overlaps(box,t)&&C.terrainRectIntersects(t,box.x,box.y,box.w,box.h,.01));
 for(const u of b.units)if(alive(u)&&rect({x:u.x-u.r-6,y:u.y-u.h-6,w:u.r*2+12,h:u.h+12}))out.push({kind:u.summoned?'summon':u.side===0?'hero':u.honroProtected?'resident':'enemy',id:u.id,label:u.name||'동행',x:u.x,y:u.y});
 for(const s of b.stakes||[])if(s.active!==false&&(!Number.isFinite(s.expires)||s.expires>=b.round)&&rect({x:s.x-24,y:s.y-74,w:48,h:80}))out.push({kind:'stake',id:s.id,label:'진목',x:s.x,y:s.y});
 for(const p of b.projectiles||[])if(shapes.some(t=>circleTouches(t,p.x,p.y,p.radius||6)))out.push({kind:'projectile',id:p.id,label:'날아가는 탄',x:p.x,y:p.y});
 for(const [kind,list]of [['field',b.fields],['zone',b.zones]])for(const f of list||[]){if(f.active===false||Number.isFinite(f.expires)&&f.expires<b.round)continue;const u=f.attached&&b.units.find(u=>u.id===f.attached),x=u?.x??f.x,y=u?u.y-u.h*.5:f.y;if(shapes.some(t=>circleTouches(t,x,y,f.radius||1)))out.push({kind,id:f.id,label:kind==='field'?'기운의 장':'남아 있는 기예',x,y});}
 return out;
}
function releaseCamera(app,m){if(m.camera&&app.scene?.storyRelease)app.scene.storyRelease(m.camera,250);delete m.camera;}
function cleanup(app){if(!active(app.engine?.b)||!ended(app))return false;const b=app.engine.b,m=memory(b);if(m.ended)return true;m.ended=true;if(m.status==='settling')b.sceneVersion=(b.sceneVersion||0)+1;if(m.status!=='settled')m.status='cancelled';m.reason='';m.blockers=[];b.honroState.pendingEvents=(b.honroState.pendingEvents||[]).filter(id=>!sources.includes(id));releaseCamera(app,m);app.dirty=true;return true;}
function authored(b){const s=b.honroFerrySpec;if(!s||!s.enableTerrainIds?.length||!s.disableTerrainIds?.length)return false;const ids=[...s.enableTerrainIds,...s.disableTerrainIds];return new Set(ids).size===ids.length&&[b.terrain,b.honroWorldTerrain].every(list=>Array.isArray(list)&&ids.every(id=>list.filter(t=>t.id===id).length===1));}
function commit(app){const b=app.engine.b,m=memory(b);if(m.commitCount||m.status!=='settling'||!authored(b)||!safeMotion(app)||occupants(b).length)return false;
 // This synchronous write is the sole collision change. Rendering and saves
 // can observe only the complete moored or complete settled geography.
 const spec=b.honroFerrySpec;for(const list of [b.terrain,b.honroWorldTerrain])for(const t of list){if(spec.enableTerrainIds.includes(t.id))t.broken=false;else if(spec.disableTerrainIds.includes(t.id))t.broken=true;}
 Object.assign(m,{status:'settled',elapsed:m.duration,commitCount:1,committedRound:b.round,committedSerial:serial(b),finalShapeVersion:1,blockers:[],reason:'배가 여울에 멎었다. 낮은 퇴로로도 돌아갈 수 있다.'});b.sceneVersion=(b.sceneVersion||0)+1;releaseCamera(app,m);app.event(m.reason,{kind:'narration',source:'ferry-settled'});app.dirty=true;app.engine.emit?.('save');return true;
}
function offer(app){const e=app.engine,b=e.b,m=memory(b);if(!['warned','waiting'].includes(m.status)||paused(app)||ended(app)||b.phase!=='aim'||b.side!==0)return;const u=e.active;if(hero(u)&&!u.acted&&!u.airborne)m.offered[u.id]={round:b.round,serial:serial(b)};}
function transition(app){const b=app.engine?.b;if(!active(b)||cleanup(app))return;const m=memory(b);if(['settled','settling'].includes(m.status))return;
 const hold=A.memory(b).holds['ferry-hold'];if(!A.memory(b).done['transport-map']||!(hold?.progress>=1))return;
 if(m.status==='moored'){
  if(paused(app))return;
  Object.assign(m,{status:'warned',warningEnemyEnd:b.teamEnds?.[1]||0,warningActorSerial:serial(b),warningRound:b.round,offered:{},playerOpportunity:null,reason:'줄이 느슨해졌다. 다음 행동에서 배와 바깥 둔덕을 비워 주세요.'});
  app.event('배를 매단 줄이 느슨해진다. 배와 바깥 둔덕을 비우세요. 원래 고지 길은 그대로 남습니다.');app.dirty=true;offer(app);return;
 }
 const action=app.engine.honroFerryAction,u=action&&app.engine.unit(action.id);
 if(action?.eligible&&app.actorBoundary===action.id&&u?.acted&&hero(u)&&serial(b)>m.warningActorSerial)m.playerOpportunity={id:u.id,round:b.round,serial:serial(b)};
 offer(app);m.blockers=occupants(b);
 const reason=!m.playerOpportunity?'동행이 다음 행동을 마치면 배의 주변을 확인합니다.':m.blockers.length?'배가 기다립니다. 쓸림면의 '+[...new Set(m.blockers.map(v=>v.label))].slice(0,2).join('·')+'부터 확인하세요.':hold.progress<2?'여울을 지키는 동안 배가 멎을 자리를 살핍니다.':!authored(b)?'배가 멎을 자리를 확인 중입니다. 원래 고지 길을 이용할 수 있습니다.':'주변이 비었습니다. 다음 안전한 행동 끝에 배가 내려앉습니다.';
 if(m.reason!==reason){m.reason=reason;app.dirty=true;}m.status=m.playerOpportunity?'waiting':'warned';
 if(!m.playerOpportunity||hold.progress<2||m.blockers.length||!authored(b)||!safeBoundary(app))return;
 m.status='settling';b.sceneVersion=(b.sceneVersion||0)+1;m.elapsed=0;m.duration=.8;m.reason='배가 여울에 천천히 내려앉습니다.';app.dirty=true;
 if(app.scene?.storyFocusPoint){m.camera={x:app.scene.x,y:app.scene.y,scale:app.scene.scale,manual:app.scene.manual};const t=b.terrain.find(t=>t.id===b.honroFerrySpec.enableTerrainIds[0]);app.scene.storyFocusPoint(t.x+t.w/2,t.y,150,.32);}
 app.event(m.reason);app.engine.emit?.('save');
}
function skip(app){const b=app.engine?.b;if(!active(b))return false;const m=memory(b);if(m.status!=='settling'||!safeMotion(app)||occupants(b).length)return false;m.elapsed=m.duration;return commit(app);}
const entryFor=(b,source)=>b.honroFerrySpec?.entries?.[source];
function warnWave(app,source){const b=app.engine.b,m=memory(b),at=entryFor(b,source);if(m.warnings[source]||m.entries[source]||!at||ended(app))return;
 m.warnings[source]={serial:serial(b),round:b.round,side:at.side};
 // Authored responses already publish their saved warning via Encounters.
 if(source==='act3-ferry-hold')app.event(at.warning||'여울 쪽에서 산개 세 마리의 발소리가 들린다. 다음 행동 뒤 진입로를 살피세요.');app.dirty=true;
}
function prepareWaves(app){const b=app.engine.b;if(ended(app)||paused(app))return;const a=A.memory(b),group=A.heroes(b),state={progress:Math.max(0,...group.map(u=>u.x)),height:Math.min(b.height,...group.map(u=>u.y)),broken:b.terrain.filter(t=>t.broken).length,collected:b.honroMarkers.filter(m=>m.collected).length,objectives:a.done,heroes:group,enemies:app.engine.alive(1).length,round:b.round,flags:b.honroState.flags,terrain:b.terrain,hold:b.honroState.hold,rescued:b.honroState.rescued};
 for(const ev of b.honroEvents||[])if(sources.includes(ev.id)&&!b.honroState.flags['event:'+ev.id]&&E.matches(ev.when,state))warnWave(app,ev.id);
 const step=A.current(b),h=a.holds['ferry-hold'],marker=A.marker(b,'ferry-hold');if(step?.id==='ferry-hold'&&(h?.spawned||0)<(step.wave?.count||0)&&group.some(u=>A.sameFloor(u,marker,step.radius)))warnWave(app,'act3-ferry-hold');
}
const execute=W.execute;
W.execute=function(app,action){const b=app.engine?.b,source=action?.source;if(!active(b)||action?.type!=='spawn'||!sources.includes(source))return execute(app,action);
 const m=memory(b);if(ended(app)||m.ended)return false;if(m.entries[source])return true;const warning=m.warnings[source],entry=entryFor(b,source);if(!entry||!warning||serial(b)<=warning.serial||m.status==='settling'||!safeBoundary(app))return false;
 const key=boundary(app),n=action.n||1;if(b.honroState.lastCombatEventBoundary===key||app.engine.alive(1).length+n>E.populationCap(b))return false;
 const choices=[entry,...(entry.alternates||[]).filter(p=>!p.side||!entry.side||p.side===entry.side).map(p=>({...p,side:entry.side}))];
 for(const at of choices){if(G.HonroEncounterDensity?.active(b)&&at.members){if(!G.HonroEncounterDensity.spawnMembers(app,action,at))continue;const list=b.units.slice(-at.members.length);for(const u of list)u.honroFerryEntry=at.side||source;m.entries[source]={x:at.x,y:at.y,support:at.support,side:at.side,round:b.round,serial:serial(b),count:list.length,ids:list.map(u=>u.id)};b.honroState.lastCombatEventBoundary=key;app.dirty=true;return true;}const spacing=at.spacing??action.spacing??145,support=at.support||at.surfaceId;if(!support||!Number.isFinite(at.x)||!Number.isFinite(at.y))continue;
  // MaxDistance zero means the common placement code must reserve every exact
  // authored slot. It cannot silently search another ledge or opposite bank.
  if(!Array.from({length:n},(_,i)=>at.x+(i-(n-1)/2)*spacing).every(x=>G.HonroMapEngine.surfaceY(b.terrain,x,at.y,support)))continue;
  const before=new Set(b.units.map(u=>u.id)),result=execute(app,{...action,x:at.x,y:at.y,support,spacing,maxDistance:0});if(result===false)continue;
  for(const u of b.units)if(!before.has(u.id))u.honroFerryEntry=at.side||source;
  m.entries[source]={x:at.x,y:at.y,support,side:at.side,round:b.round,serial:serial(b),count:n};b.honroState.lastCombatEventBoundary=key;app.dirty=true;return result;
 }return false;
};
const cap=E.populationCap;E.populationCap=function(b){return active(b)&&[30,36].includes(b.honroFerryPopulationCap)?b.honroFerryPopulationCap:cap(b);};
const attach=A.attach;A.attach=function(app,e){const out=attach(app,e);if(!active(e.b)||e.honroFerryAttached)return out;e.honroFerryAttached=true;memory(e.b);
 const combat=e.combatEnemies.bind(e);e.combatEnemies=function(){return pressureEnemies(e,combat());};
 const can=e.canAct.bind(e);e.canAct=function(){if(memory(e.b).status==='settling')return false;const ok=can();if(ok)offer(app);return ok;};
 const finish=e.finishAction.bind(e);e.finishAction=function(...args){const u=e.active,m=memory(e.b),previous=e.honroFerryAction;e.honroFerryAction=hero(u)&&!u.acted?{id:u.id,eligible:!!m.offered[u.id]}:null;try{return finish(...args);}finally{e.honroFerryAction=previous;}};
 const tick=e.tick.bind(e);e.tick=function(dt){if(cleanup(app))return tick(dt);const m=memory(e.b);if(m.status!=='settling')return tick(dt);
  if(paused(app))return;if(!safeMotion(app)||occupants(e.b).length){m.status='waiting';e.b.sceneVersion=(e.b.sceneVersion||0)+1;m.elapsed=0;m.reason='주변이 다시 움직입니다. 다음 안전한 행동 끝까지 기다립니다.';releaseCamera(app,m);app.dirty=true;return;}
  m.elapsed=Math.min(m.duration,(m.elapsed||0)+Math.max(0,dt));app.dirty=true;if(m.elapsed>=m.duration)commit(app);
 };return out;
};
const tick=A.tick;A.tick=function(app,dt){if(!active(app.engine?.b))return tick(app,dt);if(cleanup(app))return tick(app,dt);prepareWaves(app);offer(app);const out=tick(app,dt);transition(app);return out;};
const state=A.state;A.state=function(b){const out=state(b);if(!active(b))return out;const m=b.honroState?.ferry;if(m?.reason&&!['moored','cancelled'].includes(m.status))out.summary+=' · '+m.reason;return out;};
G.HonroStage30Ferry={active,memory,sources,entryFor,safeBoundary,safeMotion,swept,occupants,transition,prepareWaves,commit,skip,cleanup};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/stage12-quarry.js
(()=>{
'use strict';
(function(G){'use strict';
// Only newly authored quarry snapshots opt in. Saved old battles retain their
// own geography, actors, steps, story payload and combat numbers.
const A=G.HonroAct2,W=G.HonroAllies,E=G.HonroEncounters,C=G.HONRO_CORE;
const clone=v=>JSON.parse(JSON.stringify(v)),active=b=>b?.honroStage===12&&!b.honroCustom&&b.honroQuarryRevision===1;
const alive=u=>!!u&&!u.dead&&u.hp>0,hero=u=>alive(u)&&u.side===0&&!u.summoned&&!u.enthrall;
const sources=['hold-road-0','hold-road-3','hold-road-6'];
const memory=b=>(b.honroState.quarry??={version:1,gate:'closed',openCount:0,warnings:{},entries:{}});
const serial=b=>b.honroState.actorTurnSerial||0;
const paused=app=>!!app.dialogue||!!app.modal?.classList.contains('open')||!!app.charging||!!G.HonroStory?.turnPaused?.(app);
const ended=app=>app.done||['won','lost'].includes(app.engine.b.phase);
const safe=app=>!ended(app)&&!paused(app)&&!['flight','review','summon','ally'].includes(app.engine.b.phase)&&!(app.engine.b.projectiles||[]).length&&!app.engine.b.volley&&!app.engine.b.summonTurn&&!app.engine.b.units.some(u=>alive(u)&&(u.meleeAction||u.meleeFollow==='ready'))&&!app.engine.settleBusy();
const factory=G.HonroWorld.createEnemy;
G.HonroWorld.createEnemy=function(b,st,...args){const u=factory(b,st,...args);if(!active(b))return u;
 // World factory's index%11 elite is historical, not an authored quarry role.
 // Re-run its base tuning with elite=false, rather than leave invisible HP/XP.
 u.elite=false;u.armor=.04;G.HonroProgression.tuneEnemy(st,u,args[1]);G.HonroProgression.enemyXP(b,u);u.honroQuarryBase=true;return u;
};
const initialize=G.HonroProgression.initialize;
G.HonroProgression.initialize=function(b,profile){if(!active(b)||b.honroGrowth)return initialize(b,profile);
 // Fresh creation only. Final authored elite weights and all eight finite
 // minecarts share the unchanged chapter combat ceiling. App mount does call
 // initialize again; existing growth exits above before any retuning/rebudget.
 for(const u of b.units)if(u.side===1)A.tuneEncounter(u,12);
 const out=initialize(b,profile);if(b.honroGrowth){const reserve=8+2*.6;b.honroGrowth.weight+=reserve;b.honroGrowth.quarryWaveWeight=reserve;b.honroGrowth.quarryRevision=1;for(const u of b.units)if(u.side===1)G.HonroProgression.enemyXP(b,u);}return out;
};
const contentFor=G.HonroObjectiveRevision.contentFor;
G.HonroObjectiveRevision.contentFor=function(b,st){if(!active(b)||!b.honroQuarryContent)return contentFor(b,st);const out=clone(b.honroQuarryContent),m=b.honroState?.quarry;if(m?.signLines)out.beats.sign=clone(m.signLines);return out;};
const entry=A.entry;A.entry=function(app,options={}){if(!active(app.engine?.b))return entry(app,options);const stage=G.HonroObjectiveRevision.contentFor(app.engine.b,app.stage);return entry({...app,stage},options);};
const near=(u,p,r=300)=>hero(u)&&!!p&&Math.hypot(u.x-p.x,u.y-p.y)<r&&Math.abs(u.y-p.y)<150;
const use=A.use;A.use=function(app,marker){const b=app.engine?.b;if(!active(b)||marker?.id!=='sign'||!A.eligibility(app,marker).ok)return use(app,marker);
 const m=memory(b),u=app.engine.active,mage=b.units.find(v=>v.side===0&&v.cls==='mage');
 if(!m.signInteractorId){m.signInteractorId=u?.id;m.signRequestSerial=serial(b);m.signMageNear=near(mage,marker);m.signLines=clone(b.honroQuarryContent.beats.sign);if(!m.signMageNear)for(const line of m.signLines)if(line[0]==='서술')line[1]=line[1].replace('담허가 겹친 획 하나를 풀었다.','담허의 설명을 따라 겹친 획 하나를 풀었다.');}
 m.shoePlaced=true;const out=use(app,marker);if(out&&A.memory(b).done.sign){if(m.gate==='closed')m.gate='waiting';}return out;
};
function gateOccupants(b){const t=b.terrain.find(t=>t.id===b.honroQuarrySpec?.gateTerrainId);if(!t||t.broken)return[];return b.units.filter(u=>alive(u)&&C.terrainRectIntersects(t,u.x-u.r-4,u.y-u.h-4,u.r*2+8,u.h+10,.01));}
function signSceneDone(b){const m=b.honroState?.quarry,hs=b.honroState;if(!m?.signStoryId||b.honroStaging?.once?.[m.signStoryId]!=='done')return false;const sign=line=>line?.[2]?.storyId?.endsWith('act2-12-sign');return !(hs.storyQueue||[]).some(sign)&&!(hs.deferredStory||[]).some(q=>(q.lines||[]).some(sign))&&!(b.honroStory?.lines||[]).some(sign);}
function openGate(app){const b=app.engine.b,m=memory(b);if(m.openCount||!A.memory(b).done.sign||!signSceneDone(b)||serial(b)<=(m.signRequestSerial??-1)||!safe(app)||gateOccupants(b).length)return false;
 const id=b.honroQuarrySpec?.gateTerrainId,lists=[b.terrain,b.honroWorldTerrain];if(!id||lists.some(ts=>!Array.isArray(ts)||ts.filter(t=>t.id===id).length!==1))return false;
 for(const ts of lists)ts.find(t=>t.id===id).broken=true;Object.assign(m,{gate:'open',openCount:1,openedRound:b.round,openedSerial:serial(b)});b.sceneVersion=(b.sceneVersion||0)+1;app.event('길표 뒤의 내리막이 이어졌다. 동굴까지 돌아 나올 수 있다.',{kind:'narration',source:'quarry-gate-open'});app.engine.emit?.('save');app.dirty=true;return true;
}
function prepareWaves(app){const b=app.engine.b;if(!active(b)||ended(app)||paused(app))return;if(G.HonroRouteBranches?.active(b)){prepareRoutePressure(app);return;}const step=A.current(b),h=A.memory(b).holds?.['hold-road'];if(step?.id!=='hold-road'||(h?.spawned||0)>=8)return;const point=b.honroMarkers.find(p=>p.id==='hold-road');if(!point||!app.engine.heroesAlive().some(u=>Math.hypot(u.x-point.x,u.y-point.y)<step.radius))return;
 const source='hold-road-'+(h?.spawned||0),m=memory(b),at=b.honroQuarrySpec?.entries?.[source];if(!at||m.warnings[source]||m.entries[source])return;m.warnings[source]={serial:serial(b),round:b.round,side:at.side};app.event(at.warning||'바위길에서 수레바퀴가 울린다. 다음 행동 뒤 진입로를 살피세요.');app.dirty=true;
}

function prepareRoutePressure(app){const b=app.engine.b,m=memory(b),source=sources.find(id=>!m.entries[id]),at=b.honroQuarrySpec?.entries?.[source];
 if(!source||!at||!A.memory(b).done.sign||!signSceneDone(b)||Object.values(m.entries).some(v=>v.round===b.round))return;
 if(!m.warnings[source]){m.warnings[source]={serial:serial(b),round:b.round,side:at.side,offered:{}};app.event(at.warning||'바위길에서 수레바퀴가 울린다. 다음 행동 뒤 길목을 살피세요.');app.dirty=true;}
 const warning=m.warnings[source],u=app.engine.active;warning.offered??={};
 if(b.phase==='aim'&&b.side===0&&hero(u)&&!u.acted)warning.offered[u.id]=true;
 const actor=app.actorBoundary&&app.engine.unit(app.actorBoundary);
 if(hero(actor)&&actor.acted&&warning.offered[actor.id]&&serial(b)>warning.serial)warning.opportunity??={id:actor.id,serial:serial(b),round:b.round};
 if(!warning.opportunity||!app.actorBoundary||!safe(app))return;
 // The existing finite 3/3/2 minecart population stays available. Neither
 // reaching an exit nor completing this chapter waits for all eight to spawn.
 W.execute(app,{type:'spawn',kind:'minecart',n:source==='hold-road-6'?2:3,x:at.x,y:at.y,source});
}

const execute=W.execute;W.execute=function(app,action){const b=app.engine?.b,source=action?.source;if(!active(b)||action?.type!=='spawn'||!sources.includes(source))return execute(app,action);
 const m=memory(b),at=b.honroQuarrySpec?.entries?.[source],warning=m.warnings[source];if(m.entries[source])return true;if(!at||!warning||serial(b)<=warning.serial||!app.actorBoundary||!safe(app))return false;
 const key=[serial(b),b.round,...b.teamEnds,app.actorBoundary].join(':'),n=action.n||1;if(b.honroState.lastCombatEventBoundary===key||app.engine.alive(1).length+n>E.populationCap(b))return false;
 for(const p of [at,...(at.alternates||[]).filter(q=>!q.side||q.side===at.side).map(q=>({...q,side:at.side}))]){const spacing=p.spacing??130,support=p.support||p.surfaceId;if(!support||!Array.from({length:n},(_,i)=>p.x+(i-(n-1)/2)*spacing).every(x=>G.HonroMapEngine.surfaceY(b.terrain,x,p.y,support)))continue;
  const before=new Set(b.units.map(u=>u.id)),result=execute(app,{...action,x:p.x,y:p.y,support,spacing,maxDistance:0});if(result===false)continue;let index=0;for(const u of b.units)if(!before.has(u.id)){u.honroQuarryEntry=at.side;u.honroAct2Elite=++index===n&&n>=3;u.honroCohort='reinforcement';u.honroAct2Revision=2;A.tuneEncounter(u,12);G.HonroProgression.enemyXP(b,u);}m.entries[source]={side:at.side,x:p.x,y:p.y,support,count:n,round:b.round,serial:serial(b)};b.honroState.lastCombatEventBoundary=key;app.dirty=true;return result;
 }return false;
};
const cap=E.populationCap;E.populationCap=function(b){return active(b)&&[28,34,40].includes(b.honroQuarryPopulationCap)?b.honroQuarryPopulationCap:cap(b);};
let directionInstalled=false;
function installDirection(){if(directionInstalled||!G.HonroStoryDirection)return;directionInstalled=true;const build=G.HonroStoryDirection.build;
 G.HonroStoryDirection.build=function(app,lines,options){const out=build(app,lines,options),b=app.engine?.b;if(!active(b)||!lines.some(l=>/(?:^|:)act2-12-(sign|clear-approach)$/.test(l[2]?.storyId||'')))return out;
  const m=memory(b),result=out||{id:'direction-v2:'+lines[0]?.[2]?.storyId,context:{},head:[],cues:lines.map(()=>[])};
  if(lines.some(l=>l[2]?.storyId?.endsWith('act2-12-sign')))m.signStoryId=result.id;
  for(const [i,[who,text,meta]]of lines.entries()){
   if(meta?.storyId?.endsWith('act2-12-sign')&&who==='서술'){result.cues[i]=[];const marker=b.honroMarkers.find(p=>p.id==='sign'),actor=b.units.find(u=>u.id===(text.includes('담허가 겹친')?b.units.find(u=>u.side===0&&u.cls==='mage')?.id:m.signInteractorId));if(near(actor,marker))result.cues[i].push({type:'look',actor:actor.id,at:{marker:'sign'},pose:'inspect',duration:560});result.cues[i].push({type:'look',at:{marker:'sign'},duration:550});}
   if(meta?.storyId?.endsWith('act2-12-clear-approach')&&who==='서술'&&text.includes('짚신')){const marker=b.honroMarkers.find(p=>p.id==='clear-approach'),actor=b.units.find(u=>u.side===0&&u.cls==='archer');result.cues[i]=[{type:'look',at:{marker:'clear-approach'},duration:450},...(near(actor,marker)?[{type:'look',actor:actor.id,pose:'inspect',duration:500}]:[])];}
  }return result;
 };
}
function cellApproached(e,units,spec,heroes){return heroes.some(h=>{
 const support=e.contactSurface(h.x,h.y-30,h.y+80)?.t.id;
 const access=spec.supports.includes(support)||(spec.extra||[]).some(a=>a.support===support&&h.x>=(a.minX??-Infinity)&&h.x<=(a.maxX??Infinity));
 return access&&units.some(u=>Math.abs(h.y-u.y)<(spec.maxHeight??650)&&Math.hypot(h.x-u.x,h.y-u.y)<spec.radius);
});}
function installActivation(e){const b=e.b;if(!b.honroQuarryActivation||e.honroQuarryActivationAttached)return;e.honroQuarryActivationAttached=true;
 const refresh=e.refreshActivation.bind(e),combat=e.combatEnemies.bind(e);
 const update=write=>{const m=memory(b),alert=m.alert||{};if(write)m.alert=alert;const heroes=e.heroesAlive(),eligible=new Set();
  for(const [cell,spec]of Object.entries(b.honroQuarryActivation)){const units=e.alive(1).filter(u=>u.honroQuarryActivationCell===cell);if(!units.length)continue;
   const hit=units.some(u=>u.aggroUntil>=b.round),approached=cellApproached(e,units,spec,heroes);
   if(write){if(hit||approached)alert[cell]=true;for(const u of units)u.awake=!!alert[cell];}
   // Keep the saved alert after a retreat, while freeing the four action slots
   // when only an occluded different level is nearby. Actual player damage
   // retains the engine's three-round response, including a remote phase shot.
   if(hit||approached)eligible.add(cell);
  }e.honroQuarryEligibleCells=eligible;
 };
 e.refreshActivation=function(){refresh();update(true);};
 e.combatEnemies=function(){return combat().filter(u=>!u.honroQuarryActivationCell||!b.honroQuarryActivation[u.honroQuarryActivationCell]||e.honroQuarryEligibleCells?.has(u.honroQuarryActivationCell));};
 // Continue owns the saved awake flags, alert memory and admitted queue.
 // Rebuild only the transient access cache; normal movement/turns refresh later.
 if(Object.hasOwn(memory(b),'alert'))update(false);else e.refreshActivation();
}
function installRouteGuard(e){if(!G.HonroRouteBranches?.active(e.b)||e.honroRouteGuardAttached)return;e.honroRouteGuardAttached=true;const walk=e.walk.bind(e);
 e.walk=function(u,dir,dt,supported){const guard=u.honroRouteGuard;if(guard&&u.side===1&&!u.enthrall){const old=Math.hypot(u.x-guard.x,u.y-guard.y),next=Math.hypot(u.x+dir*(u.walkSpeed||260)*dt-guard.x,u.y-guard.y);if(next>guard.radius&&next>=old)return false;}return walk(u,dir,dt,supported);};
}
const attach=A.attach;A.attach=function(app,e){const out=attach(app,e);if(!active(e.b)||e.honroQuarryAttached)return out;e.honroQuarryAttached=true;memory(e.b);installDirection();installActivation(e);installRouteGuard(e);return out;};
const tick=A.tick;A.tick=function(app,dt){if(!active(app.engine?.b))return tick(app,dt);prepareWaves(app);const out=tick(app,dt);if(!ended(app))openGate(app);return out;};
const state=A.state;A.state=function(b){const out=state(b);if(!active(b))return out;const m=b.honroState?.quarry;if(m?.gate==='waiting')out.summary+=' · 길표 뒤 통로가 비워지면 이어집니다';return out;};
G.HonroStage12Quarry={active,memory,sources,safe,near,prepareWaves,gateOccupants,signSceneDone,openGate,prepareRoutePressure,installDirection,cellApproached,installActivation,installRouteGuard};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/stage23-escort.js
(()=>{
'use strict';
(function(G){'use strict';
// A battle snapshot opts in; Continue never replaces an old map or roster.
const A=G.HonroAct3,W=G.HonroAllies,E=G.HonroEncounters,C=G.HONRO_CORE;
const active=b=>b?.honroStage===23&&!b.honroCustom&&b.honroEscortYardRevision===1;
// Repeat mounting must retain the crit values earned by an actual level-up.
// The shared legacy initializer recalculates these two fields without ordinary
// stat training even when it reuses a saved growth ledger. Preserve only finite
// saved fields in opted-in battles; fresh initialization and missing old fields
// still take the unchanged legacy path. No XP or stat calculation is replaced.
const initializeGrowth=G.HonroProgression.initialize;
G.HonroProgression.initialize=function(b,profile){
 const saved=active(b)&&b.honroGrowth?.ledger?b.units.filter(u=>u.side===0&&!u.summoned||u.honroAlly).map(u=>({u,fields:Object.fromEntries(['critChance','critMultiplier'].filter(k=>Number.isFinite(u[k])).map(k=>[k,u[k]]))})):[];
 const out=initializeGrowth(b,profile);for(const {u,fields}of saved)Object.assign(u,fields);return out;
};
const sources=['act3-response-23-0','act3-response-23-1','act3-response-23-2'];
const SCENE='stage23-cargo-slide-v1';
const cargo=b=>b.honroEscortYardSpec?.cargo||{};
const alive=u=>!!u&&!u.dead&&u.hp>0,hero=u=>alive(u)&&u.side===0&&!u.summoned&&!u.enthrall;
function memory(b){b.honroState??={flags:{},collected:[]};return b.honroState.escortYard??={version:1,status:'stored',elapsed:0,duration:1.2,commitCount:0,warnings:{},entries:{},offered:{},blockers:[]};}
const serial=b=>b.honroState.actorTurnSerial||0;
const boundary=app=>[serial(app.engine.b),app.engine.b.round,...app.engine.b.teamEnds,app.actorBoundary].join(':');
const ended=app=>app.done||['won','lost'].includes(app.engine.b.phase);
const ownedScene=app=>app.dialogue?.staging?.id===SCENE;
const paused=app=>!!app.dialogue||!!app.modal?.classList.contains('open')||!!app.charging||!!G.HonroStory?.turnPaused?.(app);
const cargoPaused=app=>!!app.modal?.classList.contains('open')||!!app.charging||!!app.storyHistoryOpen||!!G.document?.hidden||!!app.dialogue&&!ownedScene(app);
function safeMotion(app,{scene=false}={}){const e=app.engine,b=e.b;return !ended(app)&&!(scene?cargoPaused(app):paused(app))&&!['flight','review','summon','ally'].includes(b.phase)&&!(b.projectiles||[]).length&&!b.volley&&!b.summonTurn&&!b.units.some(u=>alive(u)&&(u.meleeAction||u.meleeFollow==='ready'))&&!e.settleBusy();}
const safeBoundary=app=>!!app.actorBoundary&&safeMotion(app);
const overlaps=(a,z)=>a.x+a.w>z.x&&a.x<z.x+z.w&&a.y+a.h>z.y&&a.y<z.y+z.h;
function polygons(b){const spec=cargo(b),out=[];
 for(const z of spec.sweepPolygons||[]){const ps=(z.points||z).map(p=>Array.isArray(p)?{x:p[0],y:p[1]}:{x:p.x,y:p.y}),xs=ps.map(p=>p.x),ys=ps.map(p=>p.y);if(ps.length>=3)out.push({x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys),vertices:ps,broken:false,oneWay:false});}
 if(!out.length)for(const z of spec.sweep||[])out.push({...z,vertices:[{x:z.x,y:z.y},{x:z.x+z.w,y:z.y},{x:z.x+z.w,y:z.y+z.h},{x:z.x,y:z.y+z.h}],broken:false,oneWay:false});
 // Include both the final solid and disappearing support. An actor's feet
 // count as occupancy, so deleting a support can never start an unseen fall.
 for(const id of [...(spec.enableTerrainIds||[]),...(spec.disableTerrainIds||[])]){const t=b.terrain.find(t=>t.id===id);if(t)out.push({...t,broken:false,oneWay:false});}
 return out;
}
function swept(b,box){return polygons(b).some(t=>overlaps(box,t)&&C.terrainRectIntersects(t,box.x,box.y,box.w,box.h,.01));}
function circleTouches(t,x,y,r){const ps=C.poly(t);let inside=false;
 for(let i=0,j=ps.length-1;i<ps.length;j=i++){
  const a=ps[j],p=ps[i];if((a.y>y)!==(p.y>y)&&x<(p.x-a.x)*(y-a.y)/(p.y-a.y)+a.x)inside=!inside;
  const dx=p.x-a.x,dy=p.y-a.y,den=dx*dx+dy*dy,v=den?Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/den)):0;if(Math.hypot(x-a.x-v*dx,y-a.y-v*dy)<=r)return true;
 }return inside;
}
function occupants(b){const out=[],shapes=polygons(b),rect=box=>shapes.some(t=>overlaps(box,t)&&C.terrainRectIntersects(t,box.x,box.y,box.w,box.h,.01));
 for(const u of b.units)if(alive(u)&&rect({x:u.x-u.r-6,y:u.y-u.h-6,w:u.r*2+12,h:u.h+12}))out.push({kind:u.summoned?'summon':u.side===0?'hero':u.honroProtected?'resident':'enemy',id:u.id,label:u.name||'동행',x:u.x,y:u.y});
 for(const s of b.stakes||[])if(s.active!==false&&(!Number.isFinite(s.expires)||s.expires>=b.round)&&rect({x:s.x-24,y:s.y-74,w:48,h:80}))out.push({kind:'stake',id:s.id,label:'진목',x:s.x,y:s.y});
 for(const p of b.projectiles||[])if(shapes.some(t=>circleTouches(t,p.x,p.y,p.radius||6)))out.push({kind:'projectile',id:p.id,label:'날아가는 탄',x:p.x,y:p.y});
 for(const [kind,list]of [['field',b.fields],['zone',b.zones]])for(const f of list||[]){if(f.active===false||Number.isFinite(f.expires)&&f.expires<b.round)continue;const u=f.attached&&b.units.find(u=>u.id===f.attached),x=u?.x??f.x,y=u?u.y-u.h*.5:f.y;if(shapes.some(t=>circleTouches(t,x,y,f.radius||1)))out.push({kind,id:f.id,label:kind==='field'?'기운의 장':'남아 있는 기예',x,y});}
 return out;
}
function releaseCamera(app,m){if(m.camera&&app.scene?.storyRelease)app.scene.storyRelease(m.camera,250);delete m.camera;}
function cleanup(app){if(!active(app.engine?.b)||!ended(app))return false;const b=app.engine.b,m=memory(b);if(m.ended)return true;m.ended=true;if(m.status==='sliding')b.sceneVersion=(b.sceneVersion||0)+1;if(m.status!=='settled')m.status='cancelled';m.reason='';m.blockers=[];b.honroState.pendingEvents=(b.honroState.pendingEvents||[]).filter(id=>!sources.includes(id));b.honroState.storyQueue=(b.honroState.storyQueue||[]).filter(line=>line[2]?.stagingRequest?.id!==SCENE);if(ownedScene(app))G.HonroStory?.finish(app);releaseCamera(app,m);app.dirty=true;return true;}
function authored(b){const s=cargo(b);if(!s||!s.enableTerrainIds?.length||!s.disableTerrainIds?.length)return false;const ids=[...s.enableTerrainIds,...s.disableTerrainIds];return new Set(ids).size===ids.length&&[b.terrain,b.honroWorldTerrain].every(list=>Array.isArray(list)&&ids.every(id=>list.filter(t=>t.id===id).length===1));}
function commit(app){const b=app.engine.b,m=memory(b);if(m.commitCount||m.status!=='sliding'||!authored(b)||!safeMotion(app,{scene:true})||occupants(b).length)return false;
 // This synchronous write is the sole collision change. Rendering and saves
 // can observe only the complete stored or complete settled geography.
 const spec=cargo(b);for(const list of [b.terrain,b.honroWorldTerrain])for(const t of list){if(spec.enableTerrainIds.includes(t.id))t.broken=false;else if(spec.disableTerrainIds.includes(t.id))t.broken=true;}
 Object.assign(m,{status:'settled',elapsed:m.duration,commitCount:1,committedRound:b.round,committedSerial:serial(b),finalShapeVersion:1,blockers:[],reason:'큰 화물묶음이 낮은 턱에 멎었다. 위 창고의 사선과 아래 엄폐가 바뀌었다.'});b.sceneVersion=(b.sceneVersion||0)+1;releaseCamera(app,m);app.event(m.reason,{kind:'narration',source:'cargo-settled'});app.dirty=true;app.engine.emit?.('save');return true;
}
// Offers are recorded only before an actual living player's new action. An
// enemy boundary, a summon, a late review completion, or a serial increment is
// never a substitute for the promised chance to reposition.
function offer(app){const e=app.engine,b=e.b,m=memory(b);if(paused(app)||ended(app)||b.phase!=='aim'||b.side!==0)return;const u=e.active;if(!hero(u)||u.acted||u.airborne)return;
 if(['warned','waiting'].includes(m.status))m.offered[u.id]={round:b.round,serial:serial(b)};
 for(const [source,w]of Object.entries(m.warnings))if(!m.entries[source]&&!w.opportunity)(w.offered??={})[u.id]={round:b.round,serial:serial(b)};
}
function acceptOpportunity(app){const e=app.engine,b=e.b,m=memory(b),action=e.honroEscortYardAction,u=action&&e.unit(action.id);if(!action||app.actorBoundary!==action.id||!u?.acted||!hero(u))return;
 if(action.cargo&&serial(b)>m.warningActorSerial)m.playerOpportunity={id:u.id,round:b.round,serial:serial(b)};
 for(const source of action.waves||[]){const w=m.warnings[source];if(w&&(!G.HonroEncounterDensity?.active(b)||!w.opportunity)&&serial(b)>w.serial)w.opportunity={id:u.id,round:b.round,serial:serial(b)};}
}
function carrierInTrigger(b){const npc=b.units.find(u=>u.id==='act3-carrier'),r=cargo(b).triggerRegion;return alive(npc)&&!!r&&npc.x>=r.minX&&npc.x<=r.maxX&&Math.abs(npc.y-r.y)<=(r.tolerance??40);}
function transition(app){const b=app.engine?.b;if(!active(b)||cleanup(app))return;const m=memory(b);acceptOpportunity(app);if(['settled','sliding'].includes(m.status))return;
 if(m.status==='stored'){
  if(paused(app)||!A.memory(b).done['carrier-start']||!carrierInTrigger(b))return;
  Object.assign(m,{status:'warned',warningActorSerial:serial(b),warningRound:b.round,offered:{},playerOpportunity:null,reason:'위 창고의 화물묶음이 기운다. 다음 행동에서 빈 하역경사와 받침턱을 살피세요.'});app.event(m.reason);app.dirty=true;offer(app);return;
 }
 offer(app);m.blockers=occupants(b);const reason=!m.playerOpportunity?'동행이 다음 행동을 마친 뒤 하역경사를 확인합니다.':m.blockers.length?'화물이 기다립니다. 경사에 있는 '+[...new Set(m.blockers.map(v=>v.label))].slice(0,2).join('·')+'부터 확인하세요.':!authored(b)?'하역경사의 받침을 확인 중입니다. 짐꾼의 길은 그대로 이어집니다.':'빈 하역경사로 화물이 미끄러질 준비가 되었습니다.';
 if(m.reason!==reason){m.reason=reason;app.dirty=true;}m.status=m.playerOpportunity?'waiting':'warned';
 if(!m.playerOpportunity||m.blockers.length||!authored(b)||!safeBoundary(app)||!installScene())return;
 // Story owns the only presentation clock, Skip path and serialized cursor.
 // No actor is carried, moved, damaged or given a new movement allowance.
 m.status='sliding';m.elapsed=0;m.duration=1.2;m.reason='사람 없는 하역경사로 큰 화물묶음이 미끄러집니다.';b.sceneVersion=(b.sceneVersion||0)+1;
 if(!G.HonroStoryStaging.request(app,SCENE)){m.status='waiting';b.sceneVersion++;return;}app.dirty=true;app.engine.emit?.('save');
}
function cancelSlide(app){const b=app.engine.b,m=memory(b);if(m.status!=='sliding')return;m.status='waiting';m.elapsed=0;m.reason='경사가 다시 움직입니다. 안전한 다음 행동 끝까지 기다립니다.';b.sceneVersion=(b.sceneVersion||0)+1;app.dirty=true;if(ownedScene(app)){G.HonroStory.finish(app);delete b.honroStaging.once[SCENE];G.HonroStory.save(app);}}
function syncScene(app){const b=app.engine?.b;if(!active(b)||!ownedScene(app))return;const m=memory(b),s=app.dialogue.staging;if(m.status!=='sliding')return;
 if(!safeMotion(app,{scene:true})||occupants(b).length){if(!cargoPaused(app))cancelSlide(app);return;}
 m.elapsed=s.complete?m.duration:Math.min(m.duration,(s.elapsed||0)/1000);if(s.complete)commit(app);
}
function skip(app){if(!active(app.engine?.b)||!ownedScene(app)||memory(app.engine.b).status!=='sliding'||!safeMotion(app,{scene:true})||occupants(app.engine.b).length)return false;return G.HonroStoryStaging.skipMotion(app);}
let sceneInstalled=false;
function installScene(){const S=G.HonroStoryStaging;if(!S||!G.HonroStory)return false;if(sceneInstalled)return true;sceneInstalled=true;
 S.register({id:SCENE,stage:23,title:'하역경사의 큰 짐',steps:[{type:'look',at:{x:4230,y:4290},duration:1200,caption:'큰 화물묶음이 빈 하역경사를 한 번 미끄러져 낮은 받침에 멎는다.'},{type:'dialogue',lines:[['서술','화물묶음이 낮은 턱에 멎었다. 위 창고의 사선이 트이고, 아래길 옆에는 낮은 엄폐가 생겼다.']]}]});
 const tick=S.tick,skipMotion=S.skipMotion,finish=S.finish;
 S.tick=function(app,now){if(active(app.engine?.b)&&ownedScene(app)&&memory(app.engine.b).status==='sliding'&&!cargoPaused(app)&&(!safeMotion(app,{scene:true})||occupants(app.engine.b).length)){cancelSlide(app);return;}const out=tick(app,now);syncScene(app);return out;};
 S.skipMotion=function(app){if(!active(app.engine?.b)||!ownedScene(app))return skipMotion(app);if(memory(app.engine.b).status==='sliding'&&(!safeMotion(app,{scene:true})||occupants(app.engine.b).length))return false;const out=skipMotion(app);syncScene(app);return out;};
 S.finish=function(app,natural=false){if(!active(app.engine?.b)||!ownedScene(app))return finish(app,natural);if(memory(app.engine.b).status==='sliding'&&(!safeMotion(app,{scene:true})||occupants(app.engine.b).length))return true;const out=finish(app,natural);syncScene(app);return out;};return true;
}
const entryFor=(b,source)=>b.honroEscortYardSpec?.entries?.[source];
function warnWave(app,source){const b=app.engine.b,m=memory(b),at=entryFor(b,source);if(m.warnings[source]||m.entries[source]||!at||ended(app))return;m.warnings[source]={serial:serial(b),round:b.round,side:at.side,offered:{}};app.dirty=true;offer(app);}
function prepareWaves(app){const b=app.engine.b;if(ended(app)||paused(app))return;const a=A.memory(b),group=A.heroes(b),state={progress:Math.max(0,...group.map(u=>u.x)),height:Math.min(b.height,...group.map(u=>u.y)),broken:b.terrain.filter(t=>t.broken).length,collected:b.honroMarkers.filter(m=>m.collected).length,objectives:a.done,heroes:group,enemies:app.engine.alive(1).length,round:b.round,flags:b.honroState.flags,terrain:b.terrain,hold:b.honroState.hold,rescued:b.honroState.rescued};
 for(const ev of b.honroEvents||[])if(sources.includes(ev.id)&&!b.honroState.flags['event:'+ev.id]&&E.matches(ev.when,state))warnWave(app,ev.id);
}
const execute=W.execute;
W.execute=function(app,action){const b=app.engine?.b,source=action?.source;if(!active(b)||action?.type!=='spawn'||!sources.includes(source))return execute(app,action);
 const m=memory(b);acceptOpportunity(app);if(ended(app)||m.ended)return false;if(m.entries[source])return true;const warning=m.warnings[source],entry=entryFor(b,source);if(!entry||!warning||!warning.opportunity||serial(b)<=warning.serial||m.status==='sliding'||!safeBoundary(app))return false;
 const key=boundary(app),n=action.n||1;if(b.honroState.lastCombatEventBoundary===key||app.engine.alive(1).length+n>E.populationCap(b))return false;
 const choices=[entry,...(entry.alternates||[]).filter(p=>!p.side||!entry.side||p.side===entry.side).map(p=>({...p,side:entry.side}))];
 for(const at of choices){if(G.HonroEncounterDensity?.active(b)&&at.members){if(!G.HonroEncounterDensity.spawnMembers(app,action,at))continue;const list=b.units.slice(-at.members.length);for(const u of list)u.honroEscortYardEntry=at.side||source;m.entries[source]={x:at.x,y:at.y,support:at.support,side:at.side,round:b.round,serial:serial(b),count:list.length,ids:list.map(u=>u.id)};b.honroState.lastCombatEventBoundary=key;app.dirty=true;return true;}const spacing=at.spacing??action.spacing??145,support=at.support||at.surfaceId;if(!support||!Number.isFinite(at.x)||!Number.isFinite(at.y))continue;
  // MaxDistance zero means the common placement code must reserve every exact
  // authored slot. It cannot silently search another ledge or opposite bank.
  if(!Array.from({length:n},(_,i)=>at.x+(i-(n-1)/2)*spacing).every(x=>G.HonroMapEngine.surfaceY(b.terrain,x,at.y,support)))continue;
  const before=new Set(b.units.map(u=>u.id)),result=execute(app,{...action,x:at.x,y:at.y,support,spacing,maxDistance:0});if(result===false)continue;
  for(const u of b.units)if(!before.has(u.id)){u.honroEscortYardEntry=at.side||source;u.honroEscortYardCell=entry.cell||source;u.honroEscortYardActivationCell=entry.activationCell||null;}
  m.entries[source]={x:at.x,y:at.y,support,side:at.side,round:b.round,serial:serial(b),count:n};b.honroState.lastCombatEventBoundary=key;app.dirty=true;return result;
 }return false;
};
const cap=E.populationCap;E.populationCap=function(b){const n=b?.honroEscortYardPopulationCap;return active(b)&&Number.isInteger(n)&&n>=30&&n<=36?n:cap(b);};
function cellApproached(e,units,spec,heroes){return heroes.some(h=>{
 if(h.airborne||h.jumping)return false;const support=e.contactSurface(h.x,h.y-4,h.y+5)?.t.id;
 const access=(spec.supports||[]).includes(support)||(spec.extra||[]).some(a=>a.support===support&&h.x>=(a.minX??-Infinity)&&h.x<=(a.maxX??Infinity));
 return access&&units.some(u=>Math.abs(h.y-u.y)<(spec.maxHeight??650)&&Math.hypot(h.x-u.x,h.y-u.y)<spec.radius);
});}
function installActivation(e){const b=e.b;if(!b.honroEscortYardActivation||e.honroEscortYardActivationAttached)return;e.honroEscortYardActivationAttached=true;const refresh=e.refreshActivation.bind(e),combat=e.combatEnemies.bind(e);
 const update=write=>{const m=memory(b),alert=m.alert||{};if(write)m.alert=alert;const heroes=e.heroesAlive().filter(hero),eligible=new Set();
  for(const [cell,spec]of Object.entries(b.honroEscortYardActivation)){const units=e.alive(1).filter(u=>u.honroEscortYardActivationCell===cell);if(!units.length)continue;const hit=units.some(u=>u.aggroUntil>0&&u.aggroUntil>=b.round),approached=cellApproached(e,units,spec,heroes);if(write){if(hit||approached)alert[cell]=true;for(const u of units)u.awake=!!alert[cell];}if(hit||approached)eligible.add(cell);}e.honroEscortYardEligibleCells=eligible;
 };
 e.refreshActivation=function(){refresh();update(true);};e.combatEnemies=function(){update(false);return combat().filter(u=>!u.honroEscortYardActivationCell||!b.honroEscortYardActivation[u.honroEscortYardActivationCell]||e.honroEscortYardEligibleCells?.has(u.honroEscortYardActivationCell));};
 if(Object.hasOwn(memory(b),'alert'))update(false);else e.refreshActivation();
}
const attach=A.attach;A.attach=function(app,e){const out=attach(app,e);if(!active(e.b)||e.honroEscortYardAttached)return out;e.honroEscortYardAttached=true;memory(e.b);installScene();installActivation(e);
 const can=e.canAct.bind(e);e.canAct=function(){if(memory(e.b).status==='sliding')return false;const ok=can();if(ok)offer(app);return ok;};
 const finish=e.finishAction.bind(e);e.finishAction=function(...args){const u=e.active,m=memory(e.b),previous=e.honroEscortYardAction;e.honroEscortYardAction=hero(u)&&!u.acted?{id:u.id,cargo:!!m.offered[u.id],waves:Object.entries(m.warnings).filter(([,w])=>w.offered?.[u.id]).map(([source])=>source)}:null;try{return finish(...args);}finally{e.honroEscortYardAction=previous;}};return out;
};
const tick=A.tick;A.tick=function(app,dt){if(!active(app.engine?.b))return tick(app,dt);if(cleanup(app))return tick(app,dt);installScene();prepareWaves(app);offer(app);acceptOpportunity(app);const out=tick(app,dt);transition(app);return out;};
const state=A.state;A.state=function(b){const out=state(b);if(!active(b))return out;const m=b.honroState?.escortYard;if(m?.reason&&!['stored','cancelled'].includes(m.status))out.summary+=' · '+m.reason;return out;};
G.HonroStage23Escort={active,memory,sources,entryFor,safeBoundary,safeMotion,swept,occupants,transition,prepareWaves,commit,skip,cleanup,installScene,syncScene,carrierInTrigger,cellApproached,installActivation,SCENE};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/objective-guidance.js
(()=>{
'use strict';
(function(G){'use strict';
// Read-only presentation derived from the exact battle snapshot, including old
// ordered objectives. It never changes progress, gates, rewards or turn counters.
const alive=u=>!!u&&!u.dead&&u.hp>0;
const heroName=cls=>G.HONRO_CONTENT.hero[cls]?.name||'동행';
const heroes=b=>b.units.filter(u=>u.side===0&&!u.summoned&&!u.enthrall&&alive(u));
const action=s=>s.id==='party-reunion'?'네 사람 집결 후 행동 종료':s.kind==='destroy'?'공격으로 파괴':s.kind==='rescue'?'구조':s.kind==='interact'?'상호작용':s.kind==='hold'?`${s.rounds}회 유지`:s.kind==='clear'?'대상 적을 모두 제압':s.kind==='route'?'동행 1명 출구 도착':s.kind==='escort'?'호송 대상 도착':s.kind==='reach'?s.allHeroes?'생존 동행 전원 도착':'동행 1명 도착':'대상 제압';
const stepText=(s,id)=>`${s.label}${s.requiredClass&&!s.label.includes(heroName(s.requiredClass))?' · '+heroName(s.requiredClass):''} · ${s.kind==='hold'?(id>=21?'적 턴 ':'라운드 ')+s.rounds+'회 완료':action(s)}`;
const endings={
 1:'동행 1명이 고개 끝 도착 지점에 닿으면 완료',
 2:'상여가 도착 지점에 닿으면 완료',
 3:'장부 확보 뒤 일행을 1라운드 보호하면 완료',
 4:'피난문을 살려 8라운드를 버티면 완료',
 5:'고리쇠 파괴 뒤 물길을 1라운드 안정시키면 완료',
 6:'교각귀를 제압하고 운반대가 북문 쉼터에 닿으면 완료',
 7:'주민 셋 구조 뒤 2라운드 동안 모두 보호하면 완료',
 8:'결박 둘과 빈 상여를 제압한 뒤 1라운드 수습하면 완료',
 9:'받이진 둘 설치 뒤 일행을 2라운드 보호하면 완료',
 10:'협력이 시작된 소단을 적 턴 6회 동안 보호하면 완료'
};
function ending(b,st,list){if(b.honroNarrativeRevision===1&&st.id===8)return '결박 둘과 빈 상여를 제압하면 완료';if(b.honroNarrativeRevision===1&&st.id===9)return '받이진 둘이 연결되면 완료';if(endings[st.id])return endings[st.id];const s=list.at(-1);return s?stepText(s,st.id)+'하면 완료':st.goal;}
function failure(b,st,list,result){const parts=['동행 전원 전투불능'];const protectedUnits=b.units.filter(u=>u.honroProtected||u.id==='objective'||st.id===7&&(b.honroMarkers||[]).some(m=>m.action==='rescue'&&m.target===u.id));
 if(protectedUnits.length)parts.push([...new Set(protectedUnits.map(u=>u.name))].join('·')+' 상실');
 const required=[...new Set(list.filter(s=>!s.optional&&s.requiredClass&&!(st.act===3?G.HonroAct3.satisfied(b,s):result.allTargets?.find(t=>t.id===s.id)?.done)).map(s=>heroName(s.requiredClass)))];
 if(required.length)parts.push('필수 행동 전 '+required.join('·')+' 전투불능');
 if(st.id===5&&G.HonroQuestTargets.records(b).some(t=>t.id==='cliff-cleat'&&!t.broken))parts.push('고리쇠 파괴 전 담허 전투불능');
 if(st.id===10)parts.push('협력 시작 후 소단 전투불능');
 if(st.id===27&&b.honroSplit?.version===1&&!b.honroState?.act3?.done?.['party-reunion'])parts.push('중앙 합류 전 조사팀 동행 전투불능');
 if(G.HonroAct3?.fireScenario(b)&&!(b.honroState?.act3?.done?.['water-release']&&b.honroState?.act3?.done?.['fire-screen']))parts.push('불길 진압 전 12번째 적 턴 종료');
 return parts.join(' / ');
}
function interactReason(b,st,s,m){const u=b.units.find(u=>u.id===b.active),point=s.target?b.units.find(v=>v.id===s.target):m;if(!point||!alive(u)||u.side!==0)return'';
 if(s.requiredClass&&u.cls!==s.requiredClass)return heroName(s.requiredClass)+'로 전환';
 if(Math.abs(u.y-point.y)>150)return'같은 층으로 이동';
 if(Math.hypot(u.x-point.x,(u.y-point.y)*.75)>260)return'표시 지점 가까이 이동';
 const threats=b.units.filter(v=>v.side===1&&v.summonKind!=='eater'&&!v.eaterCapturedBy&&alive(v)&&v.id!==m?.spiritId&&!v.honroSubdued);
 if(st.act===3&&threats.some(v=>G.HonroAct3.sameFloor(v,point,220)))return'작업 지점 가까운 악귀부터 처치';
 if(st.act===2&&b.honroAct2Revision>=2&&threats.some(v=>!v.honroAct2Boss&&Math.hypot(v.x-point.x,v.y-point.y)<360))return'작업 지점의 들림부터 제압';
 if(st.act===2&&s.kind==='rescue'){const spirit=b.units.find(v=>v.id===m?.spiritId);if(alive(spirit)&&spirit.hp>spirit.maxHp*.4)return'붙은 혼을 체력 40% 이하로 약화';if(alive(spirit)&&u.cls!=='occultist')return'소단으로 전환하거나 붙은 혼을 제압';}
 return s.label;
}
function enhance(b,st,result){if(b.honroCustom)return result;
 const A=st.act===3?G.HonroAct3:st.act===2?G.HonroAct2:null,list=A?.steps(b)||[],s=A?.current(b),checklist=list.map(q=>({id:q.id,text:stepText(q,st.id),done:!!result.allTargets?.find(t=>t.id===q.id)?.done}));
 let summary=result.summary,blockReason='';
 if(list.length){summary=summary.replace(/^(\d+\/\d+) · /,'완료 $1 · ');if(s){const m=A.marker?A.marker(b,s.id):(b.honroMarkers||[]).find(m=>m.id===s.id);
   if(['interact','rescue'].includes(s.kind)&&!s.parallelGroup){blockReason=interactReason(b,st,s,m);if(blockReason)summary+=' · '+blockReason;}
   if(s.kind==='destroy'){const t=G.HonroQuestTargets.records(b).find(t=>t.id===s.id);if(t)summary+=' · 내구도 '+Math.max(0,Math.ceil(t.hp))+'/'+Math.ceil(t.maxHp||t.hp);if(s.requiredClass)summary+=' · '+heroName(s.requiredClass)+'의 공격';}
   if(s.kind==='hold')summary=summary.replace(/(\d+\/\d+)턴/,st.act===3?'$1 적 턴':'$1라운드');
   if(s.kind==='escort')summary+=' · 운반자 앞 같은 층에서 가까이 동행';
   if(s.parallelGroup)summary+=s.parallelGroup==='bell-stabilize'?' · 유지와 기본 공격은 동시에 진행':s.parallelGroup==='farewell'?' · 세 만남은 자유 순서 · 혼을 가른 뒤 작별하세요':' · 두 지점 모두 조작하세요';
   if(s.kind==='reach'&&s.allHeroes){const group=heroes(b),inside=group.filter(u=>G.HonroAct3.sameFloor(u,m,s.radius||440)).length;summary+=' · 집결 '+inside+'/'+group.length;if(s.id==='party-reunion')summary+=' · 집결 후 행동 종료';}
  }}
 const presentation=progressive(b,st,result,list,s);
 return{...result,summary,blockReason,completionText:ending(b,st,list),failureText:failure(b,st,list,result),checklist,...presentation};
}
function legacySteps(b,st,r){const h=b.honroState||{},out=[],add=(id,text,done=false)=>out.push({id,text,done}),marks=b.honroMarkers||[],boss=b.units.find(u=>u.id==='boss'),seals=G.HonroQuestTargets.records(b).filter(t=>t.honroSeal);
 const hold=(text)=>add('settle',text,r.complete);
 switch(st.id){
 case 1:add('exit','표시된 도착 지점으로 이동하세요',r.complete);break;
 case 2:add('escort','상여가 도착할 때까지 지켜 주세요',r.complete);break;
 case 3:add('ledger','움막의 장부를 확인하세요',!!h.ledger);hold('일행을 1턴 보호하세요');break;
 case 4:add('protect','피난문을 지키세요 · '+Math.max(0,8-(b.round-1))+'턴 남음',r.complete);break;
 case 5:add('ritual','담허로 받이진 앞에서 의식을 시작하세요',!!h.ritual?.active||!seals.some(t=>!t.broken));add('cleat','설오로 표시된 고리쇠를 쏘세요',!seals.some(t=>!t.broken));hold('물길을 1턴 지키세요');break;
 case 6:add('midboss','교각귀를 쓰러뜨리세요',!b.units.some(u=>u.honroMidboss&&!u.dead));add('rescue','운반대 가까이 이동하세요',!!h.rescued);add('escort','운반대 앞에서 길을 열어 주세요',r.complete);break;
 case 7:marks.filter(m=>m.action==='rescue').forEach((m,i)=>add(m.id,'주민 '+(i+1)+' 곁에서 구조하세요',!!m.collected));hold('구조한 주민들을 2턴 보호하세요');break;
 case 8:seals.forEach((t,i)=>add(t.id,'상여 결박 '+(i+1)+'을 공격하세요',!!t.broken));add('boss','빈 상여를 쓰러뜨리세요',!!boss?.dead);if(b.honroNarrativeRevision!==1)hold('주변을 1턴 지키세요');break;
 case 9:marks.filter(m=>m.action==='receiver').forEach((m,i)=>add(m.id,'받이진 '+(i+1)+'을 활성화하세요',!!m.collected));if(b.honroNarrativeRevision!==1)hold('일행을 2턴 보호하세요');break;
 case 10:if(b.honroNarrativeRevision===1){add('binding','바깥 붉은 주박을 공격하세요',!!G.HonroQuestTargets.records(b).find(t=>t.id==='sodan-binding')?.broken);add('accept','소단이 힘을 맡기도록 곁을 지키세요',!!h.sodanCoop);add('protect','소단을 지켜 주세요 · '+Math.max(0,6-(h.coopHold||0))+'턴 남음',r.complete);break;}add('weaken','소단의 주박을 약화하세요',!!h.sodanCoop||!!boss&&boss.hp<=boss.maxHp*.42);marks.filter(m=>m.action==='receiver').forEach((m,i)=>add(m.id,'받이진 '+(i+1)+'을 활성화하세요',!!m.collected));add('protect','소단을 지켜 주세요 · '+Math.max(0,6-(h.coopHold||0))+'턴 남음',r.complete);break;
 default:add('current',r.summary,r.complete);
 }return out;
}
function progressive(b,st,result,list,current){
 let chosen=current,rows,instruction;
 if(list.length){
  if(current?.parallelGroup){const active=b.units.find(u=>u.id===b.active),cls=active?.cls,A=st.act===2?G.HonroAct2:G.HonroAct3,ready=A.readySteps?.(b)||list.filter(q=>!result.allTargets?.find(t=>t.id===q.id)?.done),peers=ready.filter(q=>q.parallelGroup===current.parallelGroup),suitable=peers.filter(q=>!q.requiredClass||q.requiredClass===cls||current.parallelGroup==='bell-stabilize'&&cls!=='mage'&&q.kind==='destroy');
   if(current.parallelGroup==='farewell'){const distance=q=>{const p=(b.honroMarkers||[]).find(m=>m.id===q.id);return p&&active?Math.hypot(p.x-active.x,p.y-active.y):Infinity;};chosen=(suitable.length?suitable:peers).slice().sort((a,c)=>distance(a)-distance(c))[0]||current;}else chosen=suitable[0]||current;}
  rows=list.map(q=>({id:q.id,text:stepText(q,st.id),done:!!result.allTargets?.find(t=>t.id===q.id)?.done}));
  if(chosen){const name=chosen.requiredClass&&!chosen.label.includes(heroName(chosen.requiredClass))?heroName(chosen.requiredClass)+' · ':'';
   instruction=name+chosen.label;
   if(chosen.kind==='rescue')instruction+=' · 구조';
   else if(chosen.kind==='destroy')instruction+=' · 공격';
   else if(chosen.kind==='hold'){const a=st.act===3?b.honroState?.act3:b.honroState?.act2,h=a?.holds?.[chosen.id];instruction=h?.contested?'표시된 원 안의 적을 처치하세요':h?.guarded?'그 자리에서 '+Math.max(0,chosen.rounds-(h.progress||0))+'턴 더 버티세요':'표시된 원 안에서 '+chosen.rounds+'턴 버티세요';}
   else if(chosen.kind==='escort')instruction='운반자 앞에서 출구까지 길을 열어 주세요';
   else if(chosen.kind==='route')instruction=chosen.label;
   else if(chosen.kind==='reach')instruction=chosen.allHeroes?chosen.id==='party-reunion'?'중앙에 네 사람을 모은 뒤 행동을 끝내세요':'살아 있는 동행을 도착 지점에 모으세요':'표시된 도착 지점으로 이동하세요';
   if(G.HonroAct3?.fireScenario(b)&&['water-release','fire-screen'].includes(chosen.id))instruction+=' · '+Math.max(0,12-(b.honroState?.act3?.fireTurns||0))+'턴 남음';
  }
 }else{rows=legacySteps(b,st,result);chosen=rows.find(q=>!q.done);instruction=chosen?.text;}
 instruction=G.HonroStage11RavineEncounters?.holdInstruction(b,chosen)||G.HonroStage11RavineEncounters?.knotInstruction(b,chosen)||G.HonroStage11RavineEncounters?.rescueInstruction(b,chosen)||instruction;
 if(G.HonroStage18Bell?.active(b)&&chosen?.kind==='bell-descent')instruction=G.HonroStage18Bell.memory(b).reason||chosen.label;
 const parallelIds=new Set(chosen?.parallelGroup==='bell-stabilize'?list.filter(q=>q.parallelGroup===chosen.parallelGroup).map(q=>q.id):chosen?.parallelGroup==='farewell'?(G.HonroAct2.readySteps(b)||[]).filter(q=>q.parallelGroup==='farewell').map(q=>q.id):[]);
 const visibleChecklist=rows.filter(q=>q.done||q.id===chosen?.id||parallelIds.has(q.id)).map(q=>({...q,current:(q.id===chosen?.id||parallelIds.has(q.id))&&!q.done}));
 return{currentInstruction:result.complete?'목표 완료':instruction||result.summary,currentObjectiveId:chosen?.id,visibleChecklist};
}
G.HonroObjectiveGuide={enhance,stepText,ending,progressive};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/journey-content.js
(()=>{
'use strict';
(function(G){'use strict';
// Geography describes the approach to an existing event, not a new quest or
// settlement. Event names remain owned by campaign content; atlas anchors are presentation only.
// Load after act2-content / act2-drama. Adding a chapter means adding its place
// and source narration/adaptation below; progression uses the chapter's existing requires contract.
const H=G.HONRO_CONTENT,version=1;
const sources={
 geography:['shared/runtime/content.js','shared/runtime/story-content.js','shared/runtime/act2-content.js','shared/runtime/act2-drama.js','game/docs/ACT2_SPATIAL_IMPLEMENTATION.md'],
 firstAct:'story-content.js introductions/outros: 연목 나루, 북문, 폭포, 나무다리, 주거지, 창고, 두 마당',
 secondAct:'act2-drama.js chapters 11–20: 연목 외문 → 북쪽 돌산 → 석문 → 동굴마을 → 잠운사 → 묵종 공동 → 동굴 출구',
 interludes:'Full H.stages narration retained as authored speech or inline narration; audited against interludeSources for stages 1–20.',
 conversations:'New optional observations use only scenery or facts established before the next chapter. Existing battlefield dialogue is unchanged.'
};
// region, place, layer, visual variant, local rest name, scene description.
// These are ordinary descriptive stops, not additional named places in lore.
const geography=[
 ['연목','고갯길','surface','forest','고개 아래 주막','주막 앞에서 고갯길이 시작된다. 설오는 접힌 쪽지를 꺼내 행선지를 다시 살핀다.'],
 ['연목','나루로 내려가는 분지','surface','cliff','능선 바위턱','바위턱 아래로 장례 행렬이 보인다. 길목에서 오래 머물 수는 없다.'],
 ['연목','연목 나루','surface','river','나루로 내려가는 길','물가로 이어진 길에서 잠시 숨을 고른다. 설오는 홍만의 딸이 알려 준 움막 쪽을 바라본다.'],
 ['연목','북문','surface','forest','북문 바깥 길목','나루를 벗어난 길이 마을 문으로 이어진다. 설오는 품에 넣은 장부가 젖지 않았는지 살핀다.'],
 ['연목','폭포 절벽','surface','river','폭포 아래 바위턱','폭포 소리가 가까워진다. 붉은 실이 이어진 방향을 바위턱에서 살필 수 있다.'],
 ['연목','나무다리','surface','cliff','나무다리 위 길목','끊어진 다리 쪽으로 길이 굽는다. 일행은 뒤처진 운반대를 데리러 내려갈 채비를 한다.'],
 ['연목','북문 안 주거지','surface','forest','북문 쉼터','운반대가 닿은 쉼터에서 주거지로 길이 이어진다. 안쪽에는 아직 사람 목소리가 남아 있다.'],
 ['연목','상여를 둔 창고','surface','forest','창고 앞 길목','주민들이 빠져나간 길 너머에 창고가 있다. 설오는 빈 상여를 보았다는 말을 되짚는다.'],
 ['연목','아랫마당','surface','temple','아랫마당 길목','위쪽 마당으로 가는 길이 보인다. 일행은 주민이 지나갈 자리를 살피며 걸음을 고른다.'],
 ['연목','윗마당','surface','temple','윗마당 아래 계단','두 받이진을 뒤로하고 계단 앞에 선다. 소단이 붙든 줄은 아직 팽팽하다.'],
 ['연목','동쪽 외문','surface','dawn','동쪽 외문 곁','긴 밤이 지난 외문 곁에 산길이 이어진다. 아직 거두지 못한 매듭이 남아 있다.'],
 ['북쪽 돌산','채석장','surface','cliff','채석장 앞 산길','북쪽 산길에서 같은 바위와 마른 소나무를 거듭 지난다. 지도에 없는 길을 찾아 잠시 걸음을 멈춘다.'],
 ['북쪽 돌산','함몰지의 석문','underground','cave','함몰지 돌계단','돌림진의 한 축을 풀자 함몰지로 내려가는 계단이 드러났다. 처음 보는 돌문 쪽에서 울림이 올라온다.'],
 ['동굴마을','암반 위 주거지','underground','cave','석문 안쪽 길목','열린 석문 안쪽으로 마을 길이 이어진다. 일행은 뒤에서 오는 사람이 지날 자리를 남겨 둔다.'],
 ['동굴마을','수문 아래 작업굴','underground','river','피난 다리 곁','고정된 피난 다리 뒤로 가족들이 모여 있다. 아래 물길은 잠운사로 이어지는 우회로다.'],
 ['잠운사','법당','underground','temple','법당 아래 계단','물이 빠진 작업굴을 지나 계단 앞에 선다. 암벽에 붙은 법당 쪽으로 길이 올라간다.'],
 ['잠운사','뒤편 작업굴','underground','cave','잠운사 뒤편 길목','법당 뒤로 작업굴이 이어진다. 설오는 가져온 기록을 다시 접어 품에 넣는다.'],
 ['잠운사','묵종 공동','underground','cave','인양로 끝','복원한 인양로 끝에서 공동으로 길이 열린다. 일행은 다시 돌아가는 인양축을 지나 공동 쪽으로 발걸음을 맞춘다.'],
 ['잠운사','묵종 공동','underground','cave','묵종 곁','종지기는 제압됐지만 종 안에는 아직 혼이 남아 있다. 같은 자리에서 그들을 보내는 일이 이어진다.'],
 ['북쪽 돌산','동굴 출구','underground','cave','동굴 출구 안쪽','종의 울림이 멎은 길을 따라 사람들이 모인다. 바깥으로 나가기 전, 서로의 걸음을 기다린다.']
];
// Two 1800 × 1050 atlas layers. Nearby events remain in local clusters.
// The bell's two events share one chamber but get separate selectable pins.
const mapAnchors=[[180,710],[330,820],[520,800],[760,670],[570,440],[890,590],[990,460],[1190,490],[1120,300],[1310,240],[1450,390],[1510,590],[230,200],[580,400],[670,740],[1080,300],[1320,490],[1240,730],[1350,800],[270,890]];
const places=geography.map(([region,place,layer,variant,restName,restDescription],i)=>{
 const stageId=i+1,st=H.stages.find(s=>s.id===stageId);
 return {stageId,region,place,event:st.name,layer,variant,restName,restDescription,map:[...mapAnchors[i]]};
});
// Chapter 20 spans the cave exit and outdoor escort. Its pre-event rest is
// underground; this post-event scene is the actual return to the open sky.
const ending={stageId:20,region:'북쪽 돌산',place:'바깥 산길',event:'다시 하늘 아래',layer:'surface',variant:'dawn',restName:'새벽 산길',restDescription:'생존자들과 함께 동굴 밖에 닿았다. 사람들은 산길 곁에서 쉬고, 일행에게도 잠시 말없이 앉을 틈이 생겼다.',map:[1560,780]};
function at(stageId){const id=Number(stageId);return Number.isInteger(id)?places.find(p=>p.stageId===id)||null:null;}
function open(profile,stageId){const st=H.stages.find(s=>s.id===stageId);return !!st&&(st.requires||[]).every(id=>!!profile?.cleared?.[id]);}
function next(profile){return places.find(p=>!profile?.cleared?.[p.stageId]&&open(profile,p.stageId))||null;}
// Direct links follow authored urgency, not the presence of a boss:
// 1 outro sees the funeral already under attack; 9 outro leaves Sodan holding
// a failing knot; 18/19 share one physical bell chamber and an unfinished rite.
const directAfter=[1,9,18];
function transitionAfter(stageId){return directAfter.includes(Number(stageId))?'direct':'rest';}
function context(profile,nextStageId){
 if(nextStageId==null)return profile?.cleared?.[20]&&!next(profile)?ending:null;
 const p=at(nextStageId);return p&&open(profile,p.stageId)?p:null;
}
// Full authored pre-stage narration, separated into speech and actual narration.
// Each source paragraph is retained here for a source-to-adaptation audit.
// Acts 1 and 2 respectively use story-content.js introductions and the active
// act2-drama.js narration (not the superseded act2-content.js narration).
// Replays and urgent transitions call interlude() directly; the caller owns
// delivery and seen flags. Inline narration reuses the existing record panel;
// no additional illustrated screen or scene timing is introduced.
const interludeSources={
 "1": [
  "설오는 사라진 고향 사람들의 행방을 찾아 연목으로 왔다. 몇 해 전 그들을 배에 태웠다는 뱃사공, 홍만을 만나러 가는 길이다."
 ],
 "2": [
  "연목 나루로 내려가는 분지에서 장례 행렬이 멈췄다. 관을 메고 가는 운반틀인 상여 곁으로, 정체 모를 혼에 몸을 빼앗긴 짐승들이 내려오고 있다. 설오는 높은 바위턱에서 활을 든다."
 ],
 "3": [
  "홍만은 이미 세상을 떠났다. 설오는 그의 딸 연실이 알려 준 장부를 찾아 담허와 나루로 내려왔다. 빈 움막 앞에서 낯선 검객 하나가 두 사람을 향해 손을 들었다."
 ],
 "4": [
  "장부에 따르면 설오의 고향 사람들은 연목 주막에 묵은 뒤 북문으로 이동했다. 마을 입구에서는 피란민들이 좁은 문을 빠져나오고 있었다."
 ],
 "5": [
  "춘례가 가리킨 붉은 실을 따라 폭포에 닿았다. 물소리 사이로 실이 팽팽하게 튕긴다."
 ],
 "6": [
  "부상자들을 쉼터에 맡긴 휘겸이 나무다리 길목에서 두 사람과 다시 만났다. 늦게 출발한 운반대가 다리 아래에 갇혀 있었다. 휘겸은 혼자 길을 열려다 물러났고, 이제 세 사람이 함께 내려간다."
 ],
 "7": [
  "북문 안 주거지에서 인기척이 났다. 주민 셋의 몸에 붉은 실이 감겨 있었다. 그중 한 사람이 다가오는 일행에게 멈추라며 소리쳤다."
 ],
 "8": [
  "홍만을 장사 지낸 뒤 창고에 놓아둔 빈 상여가 움직였다. 관은 비어 있는데 결박은 안쪽에서 잡아당긴 듯 팽팽했다."
 ],
 "9": [
  "구조한 주민들은 자신들을 지킨 사람을 소단이라 불렀다. 일행이 아랫마당에 닿자, 위쪽 담장 너머에서 방울 소리가 이어졌다. 사당 문간은 붉은 실에 가려 안쪽이 보이지 않았다."
 ],
 "10": [
  "거대한 나무 아래에서 소단이 줄을 붙들고 있었다. 다가서는 일행 앞을 붉은 주박이 후려쳤다."
 ],
 "11": [
  "날이 밝아도 연목의 집들은 문을 열지 않았다. 소단이 줄 하나를 거둘 때마다 안쪽에서 손목을 살피는 소리가 났다. 동쪽 고개를 넘은 길은 북쪽 돌산으로 꺾였고, 풀어 놓은 줄 끝이 바람을 거슬러 그쪽을 향했다."
 ],
 "12": [
  "갈라진 바위와 마른 소나무가 세 번째 나타났다. 돌탑 곁에 둔 수레도 그대로였다. 발자국은 앞을 향했는데 일행은 자꾸 같은 자리로 돌아왔다."
 ],
 "13": [
  "돌림진 너머 석문 아래로 하늘빛이 들어왔다. 누구도 산 안에 이런 공간이 있으리라 생각하지 못했다. 중간에서 멎은 승강기에 한 노인이 피 묻은 밧줄을 감고 버텼고, 발밑에서 곡괭이들이 벽을 기어올랐다."
 ],
 "14": [
  "집들은 벼랑을 벽 삼아 층층이 붙어 있었다. 저녁상을 차린 채 닫힌 집, 문고리에 아이의 옷을 묶어 둔 집, 등잔 기름만 갈며 누군가를 기다린 집이 이어졌다. 아래층에서 같은 이름을 부르는 목소리가 들렸다."
 ],
 "15": [
  "수면에 떠 있던 나뭇조각들이 모두 한 방향으로 밀렸다가 돌아왔다. 숨을 쉬듯 반복되는 역류였다. 물속의 발판마다 손잡이가 달렸지만, 위에서 당길 밧줄은 모두 끊어져 있었다."
 ],
 "16": [
  "법당의 향은 오래전에 꺼졌지만 재를 고르는 손길은 남아 있었다. 노승은 쓰러진 제자의 손바닥에 이름 세 글자를 쓰고 지우기를 반복했다. 제자는 글자가 지워질 때마다 다른 사람의 이름을 말했다."
 ],
 "17": [
  "막힌 작업굴 너머로 인양틀이 보였다. 승려는 종지기가 그 축을 빼냈다고 말했다. 일행은 남은 장치를 확인하러 들어갔다."
 ],
 "18": [
  "청동의 둥근 벽은 가까이 갈수록 집이 아니라 산처럼 보였다. 밑동에는 바깥으로 향한 손자국이 겹쳐 있었다. 사슬을 쥔 종지기는 그 자국 쪽을 한 번도 내려다보지 않았다."
 ],
 "19": [
  "휘겸의 소식을 들은 가족들이 열린 통로로 들어왔다. 한 남자는 동생의 망치를, 한 여인은 언니의 밥그릇을 종 앞의 같은 자리에 내려놓았다."
 ],
 "20": [
  "종소리가 사라진 길에서는 옷 스치는 소리와 절뚝이는 발소리가 크게 들렸다. 행렬은 가장 느린 사람보다 빨리 걷지 않았다. 앞쪽 틈으로 들어온 바람이 처음으로 젖은 소매를 말렸다."
 ]
};
// Each tuple keeps its authored role. Seolo can notice, ask or think aloud;
// a character's actions and the narrator's wider knowledge are not their speech.
const interludeLines={
 1:[
  ['설오','사라진 고향 사람들… 연목까지 왔으니 이번에는 흔적을 찾을 수 있을까.'],
  ['설오','몇 해 전 그들을 배에 태웠다는 뱃사공이 홍만이라고 했지. 우선 그분을 만나 보자.']
 ],
 2:[
  ['설오','저 아래, 연목 나루로 내려가는 분지에 장례 행렬이 멈췄네.'],
  ['서술','관을 메고 가는 운반틀인 상여 곁으로, 정체 모를 혼에 몸을 빼앗긴 짐승들이 내려오고 있다.'],
  ['서술','설오는 높은 바위턱에서 활을 들었다.']
 ],
 3:[
  ['설오','홍만 어르신이 돌아가셨다니… 끝내 뵙지 못했구나.'],
  ['서술','설오는 홍만의 딸 연실이 알려 준 장부를 찾아 담허와 나루로 내려왔다.'],
  ['설오','빈 움막 앞의 저 검객은 처음 보는 사람인데. 우리 쪽으로 손을 드네. 무슨 일이지?']
 ],
 4:[
  ['설오','저기가 북문입니다. 피란민들이 빠져나오고 있군요.']
 ],
 5:[
  ['설오','물소리가 가까워졌습니다. 춘례 씨가 가리킨 쪽이 여기군요.']
 ],
 6:[
  ['휘겸','여기서 다시 만나는군. 피란민들은 쉼터에 맡겼소. 늦게 출발한 부상자 운반대가 나무다리 아래에 남았기에 돌아왔소.'],
  ['설오','저희도 그쪽으로 가던 길입니다. 혼자서 내려가실 셈이었습니까?'],
  ['설오','우리 셋이 함께 데리러 내려갑시다. 이야기는 걸으면서 듣겠습니다.']
 ],
 7:[
  ['설오','북문 안쪽 주거지에 누가 있습니다. 인기척이 납니다.'],
  ['설오','세 분 모두 몸에 붉은 실이 감겨 있군요. 가까이 가서 상태부터 살피겠습니다.'],
  ['서술','일행이 다가가자 주민 한 사람이 멈추라며 소리쳤다.']
 ],
 8:[
  ['설오','덕수 씨는 창고의 빈 상여가 움직였다고 했습니다. 돌아가는 길이 그 옆이고요.'],
  ['휘겸','주민들이 다시 지나갈 길이오. 먼저 창고 앞을 살펴봅시다.']
 ],
 9:[
  ['설오','덕수 씨가 자신들을 지킨 사람을 소단이라 불렀지. 이 아랫마당 위쪽으로 갔다고 했고.'],
  ['서술','일행이 아랫마당에 닿자 위쪽 담장 너머에서 방울 소리가 이어졌다.'],
  ['설오','사당 문간이 붉은 실에 가렸군요. 안쪽은 보이지 않습니다.']
 ],
 10:[
  ['서술','소단을 따라 윗마당에 오른 일행이 거대한 나무 앞에 멈췄다. 소단은 원혼을 붙잡은 가운데 줄을 움켜쥐고 있다.']
 ],
 11:[
  ['서술','날이 밝아도 연목의 집들은 문을 열지 않았다. 소단이 줄 하나를 거둘 때마다 안쪽에서 손목을 살피는 소리가 났다.'],
  ['설오','동쪽 고개를 넘으니 길이 북쪽 돌산으로 꺾이는군요.'],
  ['설오','풀어 놓은 줄 끝도 그쪽을 향합니다. 바람은 반대로 부는데….']
 ],
 12:[
  ['설오','저 갈라진 바위와 마른 소나무… 벌써 세 번째잖아.'],
  ['설오','돌탑 곁에 둔 수레까지 그대로네.'],
  ['설오','발자국은 줄곧 앞을 향했는데, 우리는 왜 같은 자리로 돌아오는 거지?']
 ],
 13:[
  ['서술','돌림진 너머 석문 아래로 하늘빛이 들어왔다. 누구도 산 안에 이런 공간이 있으리라 생각하지 못했다.'],
  ['설오','승강기가 중간에서 멎었습니다! 저 어르신이 피 묻은 밧줄을 손에 감고 버티고 계십니다.'],
  ['설오','그 발밑을 보십시오. 곡괭이들이 벽을 기어오릅니다.']
 ],
 14:[
  ['설오','벼랑을 벽 삼아 집을 층층이 지었군요.'],
  ['서술','저녁상을 차린 채 닫힌 집, 문고리에 아이의 옷을 묶어 둔 집이 이어졌다.'],
  ['서술','등잔 기름만 갈며 누군가를 기다린 집도 있었다.'],
  ['설오','아래층에서 자꾸 같은 이름을 부르는데… 들리십니까?']
 ],
 15:[
  ['설오','저 나뭇조각들을 보십시오. 수면에서 한쪽으로 밀려갔다가 다시 돌아옵니다.'],
  ['담허','물이 숨을 쉬는 듯하군. 역류가 되풀이되고 있어.'],
  ['설오','물속 발판마다 손잡이는 있는데, 위에서 당길 밧줄은 전부 끊어졌습니다.']
 ],
 16:[
  ['서술','법당의 향은 오래전에 꺼졌지만 재를 고르는 손길은 남아 있었다.'],
  ['서술','노승은 쓰러진 제자의 손바닥에 이름 세 글자를 쓰고 지우기를 반복했다.'],
  ['설오','이름을 지울 때마다 제자가 다른 사람의 이름을 말하는군요.']
 ],
 17:[
  ['서술','막힌 작업굴 너머로 인양틀이 보였다. 승려는 종지기가 그 축을 빼냈다고 말했다.'],
  ['설오','남은 장치를 직접 확인해 봅시다.']
 ],
 18:[
  ['설오','저게 묵종이군요. 둥근 청동 벽이… 가까이서 보니 집이 아니라 산을 마주한 것 같습니다.'],
  ['설오','밑동에 겹친 손자국을 보십시오. 전부 바깥으로 향해 있습니다.'],
  ['서술','사슬을 쥔 종지기는 그 자국 쪽을 한 번도 내려다보지 않았다.']
 ],
 19:[
  ['서술','휘겸의 소식을 들은 가족들이 열린 통로로 들어왔다.'],
  ['서술','한 남자는 동생의 망치를, 한 여인은 언니의 밥그릇을 종 앞의 같은 자리에 내려놓았다.']
 ],
 20:[
  ['설오','종소리가 멎으니 옷 스치는 소리까지 들리는군요. 절뚝이는 발소리도요.'],
  ['서술','행렬은 가장 느린 사람보다 빨리 걷지 않았다.'],
  ['설오','앞쪽 틈으로 바람이 들어옵니다. 이제야 젖은 소매가 마르네요.']
 ]
};
function interlude(stageId){
 const p=at(stageId),lines=p&&interludeLines[p.stageId];if(!lines)return [];
 return lines.map(([who,text])=>[who,text,{storyId:`rest-interlude-v1-${p.stageId}`,storyTitle:p.event,optional:false,...(who==='서술'?{kind:'narration',presentation:'inline'}:{})}]);
}
function required(profile,nextStageId){
 const p=context(profile,nextStageId);if(!p)return [];
 if(nextStageId!=null)return interlude(p.stageId);
 return [['설오','사람들과 함께 하늘 아래로 돌아왔구나. 오늘은 이 길 곁에서 잠시 숨을 고르자.',{storyId:'rest-interlude-v1-end',storyTitle:p.restName,optional:false}]];
}
// Each row is an optional, single-speaker observation: Seolo, Damheo, Hwigyeom,
// Sodan. Empty cells deliberately preserve the order of recruitment/revelation.
// No rewards, upgrades, quests or service roles are attached to these lines.
const observations={
 1:['쪽지의 접힌 자리에 홍만의 이름이 있네. 연목 나루… 잊을 리 없는데 벌써 몇 번을 읽었지.'],
 2:['아래 사람들은 아직 나를 못 봤나 보네. 목소리가 닿을 만큼만 더 가까이 가자.'],
 3:['홍만 어르신이 살아 계실 때 왔어야 했는데. 지금은 남겨 두신 장부를 찾는 수밖에 없겠지.','아버지가 남긴 장부를 기억하고 있었구먼. 연실이 해 준 말을 잘 짚어 보세.'],
 4:['장부에 사람 수라도 남아 있어서 다행이야. 이제는 누구를 찾는지 제대로 말할 수 있겠지.','주막을 지나 북문으로 간 발자취가 이어졌네. 문밖으로 나온 사람들에게 길을 물어보세.'],
 5:['가까워질수록 물소리가 커지는군. 서로 하는 말을 놓치지 않게 해야겠네.','실이 당겨지는 쪽은 보여도, 저 너머 사정까지 안다고 할 수는 없지.'],
 6:['휘겸이 부상자들을 맡기고 돌아왔구나. 이번에는 셋이서 남은 분들을 데려올 수 있겠지.','폭포의 줄이 느슨해져도 다른 줄은 여전히 당겨졌네. 물가에서 본 그 움직임을 기억해 두세.','쉼터에 닿은 사람들도 뒤처진 이들을 기다리고 있을 것이오. 나도 그 얼굴들이 마음에 남소.'],
 7:['쉼터에서 사람들 말소리가 들리네. 운반대를 끌던 소리가 멎으니 이제야 알겠네.','다친 몸과 그 안에 든 혼은 다른 것이네. 오늘 만난 사람들을 보며 더 잊지 말아야겠어.','운반대를 끝까지 함께 끌고 오니 어깨가 묵직하오. 기다리던 사람들 얼굴은 좀 펴졌소.'],
 8:['손을 자기 뜻대로 움직일 수 있다던 말이 자꾸 생각나네. 당연한 일이 아니었구나.','붉은 실이 혼을 붙든 건 알았지만, 주민들을 어떻게 지켰는지는 몰랐네. 직접 들으니 소단을 만나야겠어.','덕수는 자기 이름부터 말했소. 몸을 빼앗겨도 그 이름만은 놓지 않으려 했던 것이겠지.'],
 9:['빈 상여에 든 것이 홍만 어르신은 아니었지. 연실에게도 그 말은 분명히 전하고 싶네.','폭포의 주박목을 부수면 그쪽은 끝날 줄 알았네. 다른 줄에 붙잡힌 혼까지 살폈어야 했는데.','상여가 멈춘 뒤에도 주위를 돌아보게 되오. 빈자리라 해서 아무것도 없는 건 아니었소.'],
 10:['활끝을 낮추자. 저 사람 눈에는 아직 우리가 줄을 끊으러 온 사람들일 테니.','두려워하는 데에는 까닭이 있네. 그걸 못 본 척하면 내 말도 닿지 않겠지.','계단 위 소단을 보시오. 아직도 줄을 놓지 못하고 있소.'],
 11:['외문 너머에도 길이 이어지는구나. 장부의 빈 장이 끝이라는 뜻은 아니겠지.','밤새 손에 힘이 들어갔구먼. 아침이 와도 몸은 금방 풀리지 않는 법이지.','해가 떠도 문을 바로 열지는 못하는군. 지난밤이 길었소.','손을 펴도 아직 줄이 감겨 있는 것 같아요. 조금씩은 펴져요.'],
 12:['같은 바위를 또 지났는데 발자국 방향은 그대로네. 어디서 되돌아온 건지 짚어 봐야겠어.','산 안쪽 소리는 돌아서 들리네. 들은 방향만 믿고 단정하지는 말세.','흙길이 끝나고 돌이 많아졌소. 밑창에 묻은 흙부터 털어야겠군.','매듭 없이 걸으니 손이 자꾸 빈 곳을 찾네요. 그래도 다시 쥐지는 않을래요.'],
 13:['위에서 볼 때보다 절벽이 깊구나. 계단을 내려갈수록 하늘이 좁아지네.','바깥 바람이 이 계단까지 들어오는군. 내려가며 얼마나 달라지는지 느껴 보세.','지도에는 없던 돌계단이오. 여기서부터는 직접 본 길을 남겨야겠소.','채석장에서 종소리가 나자 혼이 수레로 들어갔어요. 그 순간은 잊지 않을 것 같아요.'],
 14:['줄을 놓고도 석공 어르신 손이 굽어 있었지. 아들을 만나면 좀 펴실 수 있을까.','석공 어르신은 아들을 기다린다는 말부터 하더군. 자기 손이 아프다는 말보다도.','노인은 평생 쓰던 손을 놓지 못했소. 아들을 기다리는 손이기도 했겠지.','문이 열렸는데도 안쪽은 어두워요. 저기 켜 둔 등잔이 눈에 먼저 들어와요.'],
 15:['서로 손목의 줄을 풀어 주던 사람들이 자꾸 떠오르네. 돌아갈 때는 함께 밖으로 걸어 나가자.','이름을 부르니 돌아보는 사람이 있었네. 줄보다 오래 남는 것도 있는 것이지.','다리 뒤에 모인 사람들은 서로 손을 놓지 않더군. 이제 묶인 손은 아니었소.','혼을 떼어 낸 뒤에 가족 목소리부터 찾았어요. 이번에는 살아 있는 사람이 부르는 소리였어요.'],
 16:['작업굴의 마른 바위에 새로 쪼아 낸 정 자국이 있었지. 누가 길을 막았는지 절의 기록에도 남아 있을까.','흐르는 물과 되밀리는 물은 소리부터 달랐네. 관찰한 자리를 기억해 두세.','녹슨 인양 자리와 새 정 자국이 달랐소. 오래전에 옮긴 일과 지금 가둔 일을 따로 봐야겠소.','마른 발판에서도 붙들린 손이 보였어요. 너무 늦게 본 것 같아서 마음에 남아요.'],
 17:['제자가 이름을 말하니 스님이 손의 먹부터 닦아 주셨지. 그 모습은 잊지 말아야겠어.','산길과 장부의 진법 표식이 닮았네. 내가 배운 법이 그곳에도 남은 까닭은 더 살펴야겠어.','승려의 증언을 남겨 두길 잘했소. 갇힌 사람들이 물을 달라는데도 돌아섰다는 말까지, 빼놓지 않고.','그분이 자기 손이 아프다고 했을 때 스님 얼굴이 달라졌어요. 그 한마디를 기다리셨나 봐요.'],
 18:['인양틀의 축이 돌아가는데 말이 안 나오더군. 종 안에 사람들이 살아 있을 때도 열 수 있었잖아, 이 길은.','굴 안이 조용해지니 우리가 걷는 소리만 남는군. 조금 전 기록을 읽던 소리도 아직 귀에 있어.','축은 부러지지 않았소. 손으로 빼냈고 다시 끼울 수 있었소. 그 사실은 달라지지 않소.','종을 올리려던 혼이 있었어요. 끝까지 그 일을 하고 있었어요.'],
 19:['청동에 저 손자국이 있었지. 이제는 안에서 나는 작은 소리까지 들리네.','울림이 낮아지니 서로 다른 소리가 들리는군. 처음부터 하나의 소리가 아니었던 것이지.','우리는 종을 깨지 않고 종지기를 제압했소. 이제 안에 남은 혼을 보내야 하오.','종 안에 남은 분들도 알았으면 좋겠어요. 이제 밖에서 문을 닫고 막을 사람은 없다고.'],
 20:['이름을 불러 주던 사람들도 이제 밖으로 돌아가야지. 같은 길을 함께 걸어가자.','오래된 혼은 아직 종 곁에 남았네. 서둘러 뜻을 붙이기보다 왜 길을 못 찾는지 알아보아야겠어.','무명사에서 옮겼다는 표식과 왕실 봉인을 함께 챙겼소. 저문골이라는 이름도 빠뜨리지 않겠소.','우리가 보내 드린 혼들이 서로를 부르며 멀어졌어요. 이제 저를 붙잡아 달라고 하지는 않아요.'],
 end:['하늘이 이렇게 넓었구나. 동굴을 나왔는데도 자꾸 위를 보게 되네.','한동안 종소리가 귀에 남을 줄 알았는데, 지금은 바람이 먼저 들리네.','길찬이 아버지 짐을 들었소. 노인도 이번에는 손을 펴고 걷더군.','아무것도 붙잡지 않고 앉아 있어도 되네요. 지금은 이대로 조금만 있을래요.']
};
const classes=['archer','mage','knight','occultist'],firstRest={archer:1,mage:3,knight:6,occultist:11};
// Optional conversations carry discoveries forward; short observations remain
// for quieter stops. Each tuple is a spoken turn, not narrator exposition.
const conversations={
 6:{knight:[['휘겸','쉼터로 먼저 간 사람들도 다리 아래 운반대를 기다리고 있을 것이오.'],['설오','늦게 출발한 분들이라 했지요. 내려가서 다친 분들 상태부터 살피죠.'],['휘겸','그러겠소. 돌아올 때는 맨 뒤까지 보고 걷겠소.']]},
 11:{occultist:[['소단','어젯밤에 손을 놓을 때, 그 혼들이 저를 따라올까 두려웠어요.'],['설오','그래도 사람들 곁에 남기로 했군요.'],['소단','제가 볼 수 있는 것을 그냥 지나치고 싶지는 않았어요. 이번엔 함께 묻고 풀어 볼래요.']]},
 13:{
  mage:[['설오','석문 안으로 들어가면 하늘이 완전히 가려지겠죠.'],['담허','그렇지. 굴 안에서는 천뢰호를 쓰지 못하네. 호리병이 자리를 찍어도 하늘에서 내려오는 천뢰가 암벽에 막혀 버리거든.'],['휘겸','그럼 안에서는 무엇으로 길을 열겠소?'],['담허','천장 아래에서는 큰 번개 대신 불씨와 얼음으로 길을 열겠네.']],
  archer:[['설오','돌계단 끝이 보이지 않네요. 연목에서 본 옛 지도에도 없는 길이에요.'],['휘겸','그렇기에 우리가 본 것을 남겨야 하오. 돌아올 때도 누군가 이 길을 찾을 수 있게.']],
  occultist:[['소단','문 안쪽에서 혼이 여러 갈래로 겹쳐 들려요. 누군가 부르는 소리와 피하려는 소리가 달라요.'],['담허','하나의 울림으로 단정하지 말자는 거구나. 안에서 들은 방향을 함께 맞춰 보자.']]
 },
 14:{knight:[['휘겸','이 집 문턱은 안에서 닳았소. 밖으로 나가던 발보다 안에서 기다리던 발이 더 많았던 모양이오.'],['설오','석공 어르신은 아직 아들을 기다리고 있어요. 길찬을 찾을 때까지 이 문을 닫지 말죠.']]},
 16:{mage:[['담허','작업굴에 오래된 고정 자리와 새로 끊긴 손잡이가 있었네. 같은 때의 일은 아니지.'],['휘겸','끊긴 자리와 오래된 홈을 구분해 봐야겠소.'],['담허','그렇지. 먼저 다친 이들의 말을 듣고, 손댄 자리를 직접 확인하세.']]},
 18:{knight:[['휘겸','축을 뺀 흔적이 손 높이에 있었소. 무너져서 막힌 길이 아니었소.'],['소단','그 안에서 두드린 분들이 있었어요. 왜 못 들은 척했을까요?'],['휘겸','그 까닭은 종지기에게 직접 묻겠소. 축을 빼서 구조를 막았다는 사실도 짚겠소.']]},
 19:{occultist:[['소단','울림이 낮아지니 서로 다른 소리가 들려요. 이름을 아는 분들을 기다리고 있어요.'],['설오','누구의 이름부터 불러야 하나요?'],['소단','가족이 알아볼 수 있는 이름부터 불러 주세요. 아무도 기억하지 못하는 혼도 남았는지 제가 살필게요.']]},
 20:{archer:[['설오','사람들이 밖으로 나갈 준비를 하는데도 종 안에는 오래된 혼이 남았네요.'],['담허','서두른다고 떠날 수 있는 혼은 아니네. 먼저 왜 여기에 붙들렸는지 알아야 해.'],['설오','밖으로 나가는 분들께 길을 물어볼게요. 남은 혼이 찾는 곳을 아는 분이 있을지도 몰라요.']]}
};
function optional(profile,nextStageId,cls){
 const p=context(profile,nextStageId),index=classes.indexOf(cls);
 if(!p||index<0||!profile?.recruited?.includes(cls))return [];
 const key=nextStageId==null?'end':p.stageId;
 if(key!=='end'&&p.stageId<firstRest[cls])return [];
 const text=observations[key]?.[index],lines=conversations[key]?.[cls]|| (text?[[H.hero[cls].name,text]]:[]);if(!lines.length)return [];
 return lines.map(([who,line])=>[who,line,{storyId:`rest-optional-v1-${key}-${cls}`,storyTitle:p.restName+' · '+H.hero[cls].name,optional:true}]);
}
G.HonroJourneyContent={version,sources,places,ending,at,next,transitionAfter,interludeSources,interlude,required,optional};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/act3-journey.js
(()=>{
'use strict';
(function(G){'use strict';
const H=G.HONRO_CONTENT,J=G.HonroJourneyContent,old={required:J.required,optional:J.optional,interlude:J.interlude};
const rows=[
 ['성문 앞 나루','river','강을 따라 읍성에 닿았다. 성문에서는 주민들이 짐을 내려놓고 피신하고 있다.',[200,790]],
 ['문서고 앞마당','temple','성문 사람들이 안전한 곳으로 물러났다. 관아 동편의 서가로 간다.',[430,560]],
 ['지상 하역장 입구','river','호적과 공식 보고가 맞지 않는다. 하늘이 열린 관창 하역장에서 폐쇄 뒤의 운송 장부를 찾는다.',[610,830]],
 ['폐가 담장 밖','temple','운송 묶음의 문장을 따라 빈 저택 앞에 섰다. 휘겸이 문간을 오래 바라본다.',[750,420]],
 ['수로 아래 첫 석대','river','설오와 담허는 지하 수로를 살핀다. 끊긴 운반길은 축지진목으로 이어야 한다.',[940,290]],
 ['묘역 옆 지상길','forest','휘겸과 소단은 선조의 기록실을 열고 지상 공방의 작업기록을 찾는다.',[1140,630]],
 ['검은 집하장 입구','river','설오와 담허 앞에 거대한 인공 집하장이 나타났다. 단절된 석대마다 진목으로 길을 잇는다.',[1090,420]],
 ['불붙은 뒤뜰 양쪽','temple','지상과 지하의 두 팀이 돌아왔다. 불길을 막고 네 동행이 모여 가져온 기록을 맞춘다.',[1340,270]],
 ['밤의 수문 앞','river','읍성의 문이 하나씩 닫힌다. 오래된 봉인 뒤에 마지막 글이 남아 있다.',[1450,550]],
 ['읍성 밖 나루','river','세 기록을 품에 넣고 강가에 모였다. 끊긴 옛길의 방향을 맞출 차례다.',[1570,820]]
];
const restNotes=[
 ['고향 사람들의 흔적도 이 길에 남아 있으면 좋겠다.','종을 옮긴 기록이라면 날과 길을 먼저 살피세.','옛 관청의 문서 분류는 배운 적이 있소.','피신하는 사람들 사이로 혼이 흘러들어요. 살아 있는 분들부터 안전하게 보내요.'],
 ['주민은 무명사 쪽 소문을 말했지. 장부와 함께 보자.','이 인근까지 번진 들림을 보았네. 어디까지 이어졌는지는 아직 모르겠어.','봉인에 찍힌 날짜부터 맞춰 보겠소.','다친 분은 이제 자기 목소리로 말했어요.'],
 ['호적에는 농가와 아이, 노인이 적혀 있었지. 사건 보고에는 왜 사술 혐의라고만 썼을까.','기록도 서로 맞춰 보아야 하는 것이네.','사술 혐의라는 한 줄로 삶을 지웠군.','혼의 목소리만 듣고 장부 속 이름을 단정할 수는 없어요. 다른 기록도 함께 봐 주세요.'],
 ['짐꾼도 살아서 나왔고 운송 기록도 챙겼어. 표찰에 찍힌 가문의 문장을 따라가자.','죽은 몸에는 지키던 일의 사념만 남았더군. 옛 기록의 목적지부터 짚어 보세.','문장이 낯익소. 안에서 확인하겠소.','저 하역장의 육신은 되돌릴 수 없었어요. 피신한 사람들은 살아 있기를 바라요.'],
 ['휘겸의 집안도 저문골과 이어져 있었구나.','모른 채 살아온 일도 뒤늦게 길을 바꾸는군.','몰락한 이유를 찾는 일이 저 사람들의 일을 밝히는 것이 됐소.','사당에 남은 토지문서에는 저문골이 보호지라고 적혀 있었어요. 그 마을을 지키려던 사람이 있었겠죠.'],
 ['지하 길은 우리가 살필게. 지상 기록도 무사히 찾아 줘.','각자 본 것을 가지고 돌아와 맞춰 보세.','선조의 기록이 묘역 아래 남아 있소. 무엇을 보았는지 읽어야겠소.','휘겸 씨와 함께 기록실과 공방을 살필게요.'],
 ['가족마다 짐을 따로 묶었어. 이름도 함께 적어 두자.','물품과 이름표가 같은 번호로 묶였네. 지상의 이름과 맞춰 보세.','지상에서 찾은 기록을 가져가겠소.','살아 있는 분은 안전한 길로 보냈어요.'],
 ['지하 명세를 가져왔어. 지상 이름과 맞춰 볼 수 있겠지.','모두 모인 뒤에 서로 본 것을 확인하세.','우리가 찾은 조사와 작업 기록을 함께 보여 주겠소.','두 분이 올라올 길에 불이 번지지 않게 해야 해요.'],
 ['제압을 승인한 일, 학살한 일, 알고도 숨긴 일… 따로 짚어야겠어.','수문 뒤에 봉인된 글을 보세. 누가 어떤 일을 기록했는지 직접 확인해야겠네.','그때 결정을 내린 사람들의 책임은, 지금 남은 악귀들로 가려지지 않소.','혼이 들어서 그랬다는 말로 모두 풀리지는 않겠네요.'],
 ['현묵도 종을 울린 뒤 무명사가 달라졌다고 썼지. 흩어진 기록이 자꾸 그 절로 돌아오네.','현재 그가 어디 있는지는 이 글만으로 알 수 없네.','운송과 봉쇄 기록을 한 장에 맞춰 보겠소.','저편이 울었다는 말을 자꾸 되짚게 돼요. 아직 뜻은 모르겠어요.']
];
const exchanges={
 21:{archer:[['설오','종을 옮긴 왕실 기록을 찾으러 왔는데, 성문 주민들부터 피신하고 있군요.'],['휘겸','길이 막히면 주민도 빠져나오지 못하오. 문서고에 가기 전에 성문 안부터 살펴봅시다.'],['설오','좋습니다. 살아 있는 사람이 남았는지 먼저 확인하겠습니다.']]},
 24:{knight:[['휘겸','이 담장 문양을 어릴 적 집에서 봤소. 그저 오래된 문장인 줄 알았는데.'],['설오','그 안에 무엇이 있든 혼자 짊어지진 마세요.'],['휘겸','왜 이 문장이 찍혔는지 직접 보겠소.']]},
 25:{mage:[['담허','저 석대에 박힌 못자국이 보이나. 짐을 묶던 운반길이었을 걸세.'],['설오','지금은 물만 남았군요. 진목이 닿을 단단한 곳부터 찾겠습니다.']]},
 26:{knight:[['휘겸','선조가 저문골에서 무엇을 조사했는지, 기록부터 읽겠소.'],['소단','적힌 이름들을 빠뜨리지 않을게요.']]},
 27:{mage:[['담허','한 번에 멀리 가려 하지 말게. 다음 석대에 둘이 모이면 내가 다음 길을 잇겠네.'],['설오','한 사람이 남는 일은 없게 하겠습니다.']]},
 28:{knight:[['휘겸','지상에서 찾은 조사문서와 지하의 적재 명세를 맞춰 봅시다. 같은 사람들의 기록인지 확인해야 하오.'],['소단','먼저 모두 안전하게 모여요.']]},
 30:{
  archer:[['설오','이 기록이 고향 사람들을 태운 배의 행방도 알려 줄까요?'],['소단','두려우면 잠시 쉬어도 돼요.'],['설오','쉬었다 갈게요. 그래도 이번엔 길을 놓치지 않겠어요.']],
  knight:[['휘겸','선조의 청원과 그 뒤에 붙은 죄명이 나란히 있소. 한쪽만 들고 가면 또 다른 이름이 지워질 거요.'],['담허','그러니 모두 챙긴 것이네. 누구의 잘못인지도 글마다 다시 가려 보세.']],
  occultist:[['소단','현묵의 글에 적힌 ‘저편의 울림’이 마음에 걸려요. 종에 갇힌 혼들의 목소리를 말하는 걸까요?'],['설오','현묵은 그 울림을 어디서 들었을까요?'],['소단','글만으로는 모르겠어요. 무명사에서 무슨 일이 있었는지 더 알아보고 싶어요.']]
 }
};
for(const [i,row] of rows.entries()){const id=21+i,st=H.stages[id-1],[restName,variant,restDescription,map]=row;J.places.push({stageId:id,region:'강변 읍성',place:st.place,event:st.name,layer:'city',variant,restName,restDescription,map});J.interludeSources[id]=[...st.narration];}
const interlude=id=>{
 if(!(id>=21&&id<=30))return old.interlude(id);
 const meta={storyId:`rest-interlude-v1-${id}`,storyTitle:H.stages[id-1].name,optional:false};
 const lines=H.stages[id-1].narration.map(text=>['서술',text,{...meta,kind:'narration',presentation:'inline'}]);
 // Chapter 24 is the last existing rest before the uninterrupted split route.
 // Append after its original page so saved scene IDs and page indices survive.
 if(id===24)lines.push(['담허','짐꾼 말대로라면 윗길로 돌아가야겠군. 수로에 내려가기 전에 축지진목을 쓸 채비를 해야겠네.',{...meta}]);
 return lines;
};
J.interlude=interlude;
J.ending={stageId:30,region:'읍성 밖',place:'끊긴 옛길 입구',event:'남겨진 길',layer:'city',variant:'river',restName:'강변 쉼터',restDescription:'가져온 기록을 다시 묶었다. 강 건너 옛 운송로와 장례길은 오래전에 끊겼다. 다음 길을 살피며 잠시 머무른다.',map:[1650,930],actEnd:'셋째 막 끝',endingTitle:'기록을 품고, 옛길 앞에',nextText:'넷째 막 · 옛길과 장례길은 준비 중입니다.'};
J.required=function(profile,id){if(id>=21&&id<=30)return H.stages[id-1].requires.every(n=>profile?.cleared?.[n])?interlude(id):[];if(id==null&&profile?.cleared?.[30])return[['설오','기록은 다 챙겼지. 끊긴 옛길을 이어 무명사로 가자. 오늘은 강가에서 잠시 쉬자.',{storyId:'rest-interlude-v1-end-30',storyTitle:J.ending.restName,optional:false}]];return old.required(profile,id);};
J.optional=function(profile,id,cls){if(id>=21&&id<=30&&profile?.recruited?.includes(cls)&&H.stages[id-1].requires.every(n=>profile?.cleared?.[n])){const index=G.HonroAct3Content.roster.indexOf(cls),text=restNotes[id-21][index],lines=exchanges[id]?.[cls]||(text?[[H.hero[cls].name,text]]:[]);return lines.map(([who,line])=>[who,line,{storyId:`rest-optional-v1-${id}-${cls}`,storyTitle:J.at(id).restName,optional:true}]);}if(id==null&&profile?.cleared?.[30]&&profile.recruited.includes(cls)){const text=['고향 곁을 지나던 길이었구나. 이제 그 끝을 찾아가자.','옛길의 봉쇄를 하나씩 살피겠네.','이 기록을 지워진 이름들 곁으로 돌려놓겠소.','돌아올 길도 함께 기억해요.'][G.HonroAct3Content.roster.indexOf(cls)];return[[H.hero[cls].name,text,{storyId:`rest-optional-v1-end-30-${cls}`,storyTitle:J.ending.restName,optional:true}]];}return old.optional(profile,id,cls);};
// A separate city atlas prevents new locations from covering the established
// surface/underground maps. These shapes are orientation art, never collision.
function atlas(){
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 1050" class="journey-atlas" role="img" aria-label="강변 읍성의 성벽, 수로, 관아, 공방과 나루를 그린 여정 지도">
 <defs>
  <linearGradient id="city-paper" x2=".2" y2="1"><stop stop-color="#d9d5bc"/><stop offset=".65" stop-color="#c5c3aa"/><stop offset="1" stop-color="#adbaa9"/></linearGradient>
  <linearGradient id="city-river" x2="0" y2="1"><stop stop-color="#8baca5"/><stop offset=".53" stop-color="#648b8b"/><stop offset="1" stop-color="#3d666f"/></linearGradient>
  <linearGradient id="city-roof" x2=".4" y2="1"><stop stop-color="#66716a"/><stop offset=".45" stop-color="#354949"/><stop offset="1" stop-color="#233b3d"/></linearGradient>
  <linearGradient id="city-stone" x2=".3" y2="1"><stop stop-color="#a7a48b"/><stop offset="1" stop-color="#737b70"/></linearGradient>
  <radialGradient id="city-wash"><stop stop-color="#f1e7c5" stop-opacity=".55"/><stop offset="1" stop-color="#f1e7c5" stop-opacity="0"/></radialGradient>
 </defs>
 <g id="paper-and-distant-ridges"><path fill="url(#city-paper)" d="M0 0h1800v1050H0z"/><ellipse cx="540" cy="100" rx="680" ry="340" fill="url(#city-wash)"/><path d="M0 270l126-84 92 31 114-104 96 55 109-87 83 42 112-70 96 51 97-91 102 78 116-76 100 41 86-29 106 62 124-38 121 89v303H0z" fill="#7f978d" opacity=".27"/><path d="M0 326q274-102 438-54t375-45q311-78 553-15 251 67 434 19v244H0z" fill="#7a8f85" opacity=".19"/></g>
 <g id="river-and-banks"><path d="M-30 796q231-68 419-33 160 54 306 105 155 32 295-6 257-114 474-66 158 24 366-17v300H-30z" fill="#768d82"/><path d="M-30 813q235-72 421-28 170 59 309 99 151 36 299-7 248-114 460-67 170 25 371-11v251H-30z" fill="url(#city-river)"/><path d="M-25 800q227-74 414-32 173 51 313 95 159 33 290-10 266-113 478-62 162 22 357-12" fill="none" stroke="#e3d8b4" stroke-width="10" opacity=".59"/><path d="M66 859q184-25 294-9m91 45q120 3 195 26m324 29q189-29 267-69m183-12q161 1 286-27M156 947q94-3 181 9m704-14q89-16 165-32" fill="none" stroke="#c6d5c5" stroke-width="5" stroke-linecap="round" opacity=".35"/><path d="M0 1043q199-88 419-30 159 48 340 47m414-4q294-97 637-42" fill="none" stroke="#213f49" stroke-width="28" opacity=".28"/></g>
 <g id="stone-city-wall"><path d="M143 675L123 228Q126 172 188 147L565 100 1019 88 1517 139Q1592 154 1602 211L1638 653 1607 734 1489 750 1445 691 1452 242 1370 217 1080 206 824 186 559 201 287 237 274 685 216 731z" fill="#526760" opacity=".3"/><path d="M158 681L148 224Q148 187 197 174L560 128 1021 117 1510 166Q1560 174 1572 217L1605 645" fill="none" stroke="#6f7970" stroke-width="34" stroke-linejoin="round"/><path d="M155 679L148 224Q148 187 197 174L560 128 1021 117 1510 166Q1560 174 1572 217L1605 645" fill="none" stroke="#b4ab8e" stroke-width="10" opacity=".76"/><path d="M220 747l67-67 5-442 276-39 271-11 258 19 266 9 86 27-2 446 45 57" fill="none" stroke="#a7a18a" stroke-width="11" opacity=".52"/><path d="M158 394l77-6v56l-77 5zm737-280h85v60h-85zm520 77h83v56h-83zm110 315 72-8 5 66-75 7z" fill="url(#city-stone)" stroke="#52645c" stroke-width="6"/><path d="M181 396h33v38h-33zm747-278h36v43h-36zm514 77h34v40h-34zm103 319h35v39h-35z" fill="#344844"/><path d="M133 674q64-22 144-3m1178 1q88-32 172-22" fill="none" stroke="#c7b992" stroke-width="18"/></g>
 <g id="canal-and-paths"><path d="M818 186q43 184 1 284-28 106 24 174 71 111 227 144" fill="none" stroke="#648581" stroke-width="64" opacity=".66"/><path d="M819 185q43 182 0 286-27 103 24 173 69 108 225 141" fill="none" stroke="#c1c7aa" stroke-width="4" opacity=".57"/><path d="M241 687q286-62 499-96 158-20 322-103 224-115 449-238M217 337q337 67 553 99 378 46 745 79M449 197q31 135 48 255 22 121 50 280M1166 207q17 199-43 317-38 101-30 214" fill="none" stroke="#938f73" stroke-width="38" stroke-linecap="round" opacity=".69"/><path d="M242 685q285-61 498-95 160-20 323-102 226-116 447-239M220 337q334 67 547 98 383 48 751 80" fill="none" stroke="#d6c8a5" stroke-width="9" opacity=".72"/><path d="M778 415l104-4m-68 183 98-16m-113 81 88-36" stroke="#a79a78" stroke-width="30"/><path d="M781 411l100-4m-65 182 93-15m-110 81 84-33" stroke="#e1d2ac" stroke-width="6"/></g>
 <g id="gate-and-watchtower" transform="translate(195 543)"><path d="M-33 141h198l25 23H-49z" fill="#52635d"/><path d="M-14 47h160v102H-14z" fill="#9a987f"/><path d="M50 85h40v64H50z" fill="#354849"/><path d="M-54 46q50 1 75-23L65-14l42 33q30 28 80 28l-8 17-180-6-53 5z" fill="url(#city-roof)"/><path d="M-32 48q50-5 97-62 54 52 104 63" fill="none" stroke="#a3a68e" stroke-width="7"/><path d="M7 65v73m127-72v72" stroke="#5d6455" stroke-width="14"/></g>
 <g id="government-halls"><path d="M1078 304h288v217h-288z" fill="#9d9a7f"/><path d="M1112 335h220v156h-220z" fill="#d2c9aa"/><path d="M1067 330l123-81 132 7 71 71-36 14-89-59-102-2-72 64z" fill="url(#city-roof)"/><path d="M1111 350h20v122h-20zm88 0h20v122h-20zm89 0h20v122h-20z" fill="#706b54"/><path d="M1130 344h177M1130 410h177" stroke="#a59673" stroke-width="8"/><path d="M1196 253l-6-27h104l19 30" fill="#4a5b54"/><path d="M1080 507q118 39 278-6" fill="none" stroke="#707761" stroke-width="15" opacity=".45"/></g>
 <g id="archive-and-inner-courts"><path d="M526 280h199v163H526z" fill="#b6ae90"/><path d="M501 286q48 5 73-22l56-39 59 36 66 24-7 18-117-35-114 33z" fill="#3e5553"/><path d="M541 308h18v117h-18zm145 0h17v117h-17z" fill="#687262"/><path d="M570 339h95v77h-95z" fill="#d7cbab"/><path d="M602 339v77m31-77v77" stroke="#8a785c" stroke-width="6"/><path d="M452 506h232v151H452z" fill="#9f9a7d"/><path d="M435 503q39 7 64-21l63-34 61 32 76 22-11 20-127-42-111 39z" fill="url(#city-roof)"/><path d="M471 534h20v104h-20zm178 0h19v104h-19z" fill="#596458"/><path d="M509 549h105v79H509z" fill="#c9bd9d"/></g>
 <g id="market-and-workshops"><path d="M945 607l65-51 70 50 66 8-16 17-102-19-67 19z" fill="#465d59"/><path d="M954 623h172v82H954z" fill="#9b9b80"/><path d="M964 643h155" stroke="#6c7766" stroke-width="14"/><path d="M1021 573l34-21 32 17" fill="none" stroke="#baad8d" stroke-width="7"/><path d="M1292 605h99l26 101h-151z" fill="#a7a087"/><path d="M1248 599q47 8 79-44l78 4 58 46-28 11-72-27-77 22z" fill="#394f4e"/><path d="M1284 637h125M1298 662h120" stroke="#6d796c" stroke-width="12"/><path d="M1335 673q13-29 40-7 13 22-15 31-33 0-25-24z" fill="#854d3c" opacity=".67"/></g>
 <g id="shrine-and-pines"><path d="M791 238l81-55 85 55-12 16-70-43-72 44z" fill="#374f4b"/><path d="M815 254h115v66H815z" fill="#aea88b"/><path d="M828 259h13v62h-13zm73 0h13v62h-13z" fill="#59665b"/><path d="M700 273q-20-61 7-101 10-26 3-49l13-3q20 47-1 88-9 32 4 74z" fill="#3e5149"/><path d="M622 178q16-37 59-36 23-24 62-17 39 8 51 43-70 12-102 5-43 18-70 5z" fill="#506d5d"/><path d="M1499 425q-22-64 3-107l15 2q-19 54 9 111z" fill="#3f574f"/><path d="M1450 322q47-57 116-35 26 16 35 49-60 3-89-7-38 13-62-7z" fill="#526f60"/></g>
 <g id="ferry-wharves"><path d="M82 774l248-28 64 24-241 32zM1448 773l266-44 84 22-279 55z" fill="#534e3e"/><path d="M92 768l245-28 54 23-239 31zM1457 769l260-45 78 21-276 51z" fill="#a49974"/><path d="M116 785v75m51-79v78m130-91v75m1201-61v84m116-103v88m105-100v79" stroke="#4f5a52" stroke-width="17"/><path d="M248 887q83-19 161 8-83 13-161-8zM1532 884q99-18 187 11-94 9-187-11z" fill="#314f55"/></g>
 <g fill="#384b4b" font-family="Batang, 'Noto Serif KR', serif"><text x="94" y="69" font-size="37" letter-spacing="8">강변 읍성</text><text x="101" y="101" font-size="16" letter-spacing="3" opacity=".72">지워진 이름을 따라</text><text x="1290" y="981" font-size="26" letter-spacing="4" opacity=".68">옛 나루</text></g>
 <g id="map-compass" transform="translate(1670 120)" fill="none" stroke="#576c63" opacity=".75"><circle r="51" stroke-width="3"/><path d="M0-64V64M-64 0H64M0-41l12 41L0 42-12 0z" stroke-width="3" fill="#7a8a75"/><circle r="5" fill="#38524e"/></g>
 </svg>`;
}
G.HonroAct3Journey={atlas};
})(globalThis);

})();
await yieldIfNeeded();
