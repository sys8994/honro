(function(G){'use strict';
const H=G.HONRO_CONTENT,C=G.HONRO_CORE;
const step=(id,label,kind='interact',extra={})=>({id,label,kind,...extra});
const hold=(id,label,rounds,kind,count,radius=500,extra={})=>step(id,label,'hold',{rounds,wave:{kind,count},radius,contestRadius:230,...extra});
const destroy=(id,label,opens,requiredClass)=>step(id,label,'destroy',{...(opens?{opens}:{}),...(requiredClass?{requiredClass}:{})});
const exit=(id,label='다음 길에 도착')=>step(id,label,'reach');
const scene=(id,title,lines)=>lines.map(([who,text,meta={}])=>[who,text,{storyId:id,storyTitle:title,...meta}]);
const chapters=[
 {name:'성문 아래',place:'성문과 장터',theme:'gate',narration:'성문 앞 수레가 혼자 돌아섰다. 장터는 대부분 비었고, 뒤늦게 피신하던 주민이 처마 아래에 갇혔다.',
 goal:'수레의 결박을 끊고 주민을 구해 성문 안으로 진입',
 story:[['설오','수레 밑에 사람이 있습니다. 저 고리부터 끊겠습니다.',{focus:'seal'}],['휘겸','문서고는 관아 동편이오. 먼저 이 사람들이 지나갈 길을 냅시다.']],
 steps:[destroy('wagon-lock','들린 수레의 결박 끊기',null,'archer'),step('gate-resident','수레 아래 주민 구하기','rescue',{target:'act3-resident'}),hold('refuge-hold','주민이 물러날 동안 길목 지키기',2,'hound',2,520),exit('city-exit','읍성 안으로 진입')],
 beats:{'gate-resident':[['주민','무명사 쪽 나루에서 먼저 그랬대요. 여기에도 들림이 번지자 사람들은 강 건너로 피했어요.']],'refuge-hold':[['휘겸','관아의 옛 장부부터 찾겠소. 이송 날짜와 봉인 표식이 맞으면 길이 이어질 것이오.']]},
 outro:[['설오','관청의 길을 잘 아십니다.'],['휘겸','어릴 때 배운 것이오. 지금도 남아 있을 줄은 몰랐소.']],summary:'성문 주민을 구했다. 인근 나루에서 읍성까지 들림이 번져 주민들이 피신했다. 저문골과 무명사의 옛 장부를 찾는다.',
 guide:'설오로 수레 고리를 끊고 주민 곁에서 E로 구조하세요. 표시 범위에서 두 번의 적 턴을 버틴 뒤 성문 안으로 이동하세요. 처마와 성벽은 실제 포탄을 막습니다.'},
 {name:'옛 장부',place:'관아 문서고',theme:'temple',narration:'사람들이 떠난 문서고에 세 층의 서가가 남았다. 낮은 들보 아래에서 원혼이 맴돌고 묵은 종이가 흔들린다.',
 goal:'봉인된 서가를 열고 서로 어긋나는 두 장부 대조',
 story:[['휘겸','호적과 사건 보고는 따로 두었을 것이오. 같은 해의 것을 맞춰 봅시다.'],['설오','위층 걸쇠는 여기서 보입니다. 사선이 열리는 곳으로 옮기겠습니다.',{focus:'seal'}]],
 steps:[step('archive-seal','서고 봉인 열기','interact',{requiredClass:'knight',opens:'archive-door'}),step('ledger-case','저문골 사건 보고 확보'),destroy('upper-latch','위층 서고 걸쇠 끊기','upper-door','archer'),hold('compare-ledgers','서가를 지키며 호적과 보고 대조',2,'lantern',2,460),exit('archive-exit','옛 관창으로 나가기')],
 beats:{'ledger-case':[['휘겸','왕실 위해 사술 혐의. 주민 제압 중 다수 사망, 지역 폐쇄… 이게 공식 보고요.']],'compare-ledgers':[['설오','호적엔 아이와 노인, 농사짓는 집들뿐입니다. 병력 장부는 없습니다.'],['휘겸','저문골은 반란군 마을이 아니었소. 평범한 사람들을 다른 이름으로 적었군.']]},
 outro:[['담허','폐쇄 뒤 사람들과 짐을 어디로 옮겼는지 보세.'],['휘겸','그 장부는 수로 옆 관창에 있을 것이오.']],summary:'공식 보고와 호적을 맞췄다. 저문골은 반란군 마을이 아니라 평범한 주민들의 마을이었다.',
 guide:'휘겸으로 봉인을 열고 아래층 보고를 확보하세요. 설오로 위층 걸쇠를 끊은 뒤 대조 지점을 두 적 턴 동안 지키세요. 다른 층의 표식에는 같은 층으로 올라가야 상호작용할 수 있습니다.'},
 {name:'사라진 짐',place:'수로 관창',theme:'river',narration:'수로 하역장에 쓰러졌던 병사의 몸들이 다시 문을 막는다. 살아 있는 짐꾼은 마지막 장부 상자를 품에 안고 물러선다.',
 goal:'악귀가 막은 하역길을 열고 짐꾼과 운송 기록을 지켜 통과',
 story:[['수비병 악귀','지켜라… 문을… 아무도…'],['소단','숨은 이미 끊겼어요. 악귀가 남은 육신을 움직여요. 저 몸은 사람으로 되돌릴 수 없어요.'],['설오','저 너머 짐꾼은 살아 있습니다. 악귀를 처치하고 나올 길을 열겠습니다.',{focus:'seal'}]],
 steps:[destroy('cargo-lock','하역문 고정구 끊기','cargo-gate'),step('dispatch-bundle','무명사 운송 묶음 확보'),step('carrier-start','짐꾼과 출발','interact',{target:'act3-carrier',startsEscort:true}),step('dock-mid','짐꾼을 석교까지 호송','escort',{target:'act3-carrier'}),step('dock-exit','짐꾼과 하역장 벗어나기','escort',{target:'act3-carrier'})],
 beats:{'dispatch-bundle':[['휘겸','시신뿐이 아니오. 놋그릇, 농기구, 장신구, 문고리까지 무명사로 보냈소.'],['설오','죽은 마을의 밥그릇까지 왜 가져갔습니까?']],'carrier-start':[['짐꾼','다들 피했어요. 저 병사들은 죽은 뒤에도 지키던 문에서 떠나지 않았어요.'],['휘겸','당신은 우리와 나갑시다. 상자를 놓치지 마시오.']]},
 outro:[['휘겸','운송 문서에 토지 장부 번호가 남았소. 그 끝의 문장이 낯익군.']],summary:'저문골의 시신과 생활 금속이 함께 무명사로 옮겨졌음을 확인했다. 죽은 육신에 남은 수호의 사념을 돌파해 짐꾼과 운송 묶음을 지켰다.',
 guide:'하역문을 열고 기록을 챙긴 뒤 짐꾼 곁에서 출발시키세요. 짐꾼 앞의 실제 보행길을 확보하고 가까이 동행하세요. 길을 막는 수비병 악귀를 처치하며 살아 있는 짐꾼을 보호하세요.'},
 {name:'휘겸의 문장',place:'폐쇄된 저택과 사당',theme:'temple',narration:'담장 안의 빈 저택에 같은 문장이 남아 있다. 휘겸이 무너진 문간에서 걸음을 멈춘다.',
 goal:'옛 문장을 따라 잠긴 사당과 토지 장부 확인',
 story:[['휘겸','우리 집안의 문장이오. 저문골 토지 장부에 왜 이것이 찍혀 있소?'],['담허','안쪽 봉인부터 살펴보세. 아직 남은 것이 있네.']],
 steps:[destroy('courtyard-latch','안뜰 빗장 끊기','courtyard-door'),step('family-crest','휘겸의 문장 확인','interact',{requiredClass:'knight'}),step('shrine-seal','사당 봉인 풀기','interact',{requiredClass:'mage',opens:'shrine-door'}),step('land-register','보호지 토지문서 확보'),exit('garden-exit','숨은 기록실로 이동')],
 beats:{'family-crest':[['휘겸','내 선조가 왕실 방계였다는 것은 알았소. 이 마을과의 관계는 듣지 못했소.']],'land-register':[['설오','저문골이 오래 보호받던 마을이라고 적혀 있습니다.'],['휘겸','우리 집안은 그곳에서 무엇을 보았던 것이오. 몰락한 까닭도 여기에 있겠군.']]},
 outro:[['휘겸','빈 사당 뒤에 기록실이 있소. 지워지기 전에 남겨 둔 것을 보겠소.']],summary:'저문골은 휘겸 선조인 왕실 방계와 관계가 깊었다. 휘겸은 가문의 몰락과 저문골을 함께 추적한다.',
 guide:'빗장을 끊고 휘겸으로 문장을 확인하세요. 담허로 사당 봉인을 풀어 토지문서에 접근하세요. 지붕과 담장 사이에서 사선을 바꾸며 이동하세요.'},
 {name:'폐가의 기록',place:'숨겨진 기록실',theme:'temple',narration:'가려진 기록실이 열리자 바깥에서 끌리는 발소리가 들린다. 악귀들이 문서에 손을 뻗으며 같은 말을 중얼거린다.',
 goal:'기록함을 여는 동안 거점을 지키고 조사문서 확보',
 story:[['휘겸','선조의 조사 기록이오. 잠금이 녹아 붙었군. 여기서 열겠소.'],['궁수 악귀','숨겨라… 지워라… 남기지 마라…'],['담허','기록을 지우려는 집착만 남았군. 악귀를 막고 문서를 지켜야 하네.']],
 steps:[step('hidden-latch','숨은 기록실 열기','interact',{requiredClass:'knight',opens:'hidden-door'}),hold('archive-hold','조사 기록함을 지키기',3,'possessedGuard',3,460),step('investigation-record','선조의 조사 기록 확보'),destroy('rear-latch','뒷문 걸쇠 끊기','rear-door'),exit('back-exit','기록을 가지고 뒷길로 이탈')],
 beats:{'investigation-record':[['휘겸','조직적인 저항은 없었다. 대도사가 현장에서 주민 전원을 죽였다고… 선조가 증언을 모았소.'],['설오','그 뒤 무명사에서 대종을 주조하고 있었다는 기록도 있습니다.'],['소단','저문골에서 가져간 것들과, 그 종이 이어져 있었네요.']]},
 outro:[['담허','만든 곳은 알았네. 무엇을 어떻게 썼는지는 아직 성급히 단정하지 말세.']],summary:'대도사의 현장 학살과 무명사의 대종 주조 기록을 찾았다. 묵종은 저문골 참사 뒤 무명사에서 만들어졌다. 제작 방식과 목적은 미상이다.',
 guide:'휘겸으로 기록실을 열고 표시 범위를 세 적 턴 동안 지키세요. 기록을 챙긴 뒤 뒷문을 끊어 빠져나가세요. 기록을 확보하면 남은 악귀를 피해 퇴로로 나갈 수 있습니다.'},
 {name:'종을 만든 사람들',place:'불탄 공방 지구',theme:'gate',narration:'오래된 공방에서 젖은 장부 조각을 꺼낸 사람이 쓰러져 있다. 재 묻은 종이가 바람에 흩어진다.',
 goal:'주민을 구하고 작업기록을 보존해 주조 수량 대조',
 story:[['설오','기둥을 받치면 안으로 들어갈 수 있습니다. 사람부터 데려오겠습니다.'],['담허','종이는 넓게 펴 두게. 마르는 동안 들린 도구를 막겠네.']],
 steps:[step('workshop-brace','공방 입구 받치기','interact',{opens:'workshop-door'}),step('artisan-resident','작업기록을 지킨 주민 구조','rescue',{target:'act3-resident'}),hold('ledger-drying','젖은 작업 장부 지키기',2,'picks',2,500),step('casting-tally','수거량과 주조량 대조'),exit('workshop-exit','관아 쪽 골목으로 이동')],
 beats:{'artisan-resident':[['주민','집안에 남은 작업기록이에요. 또 없어질까 봐 꺼내 왔어요.']],'casting-tally':[['휘겸','주조에 쓴 금속량이 저문골 수거량과 거의 같소. 유골과 재도 통상 장례처럼 처리하지 않았군.'],['소단','종 곁에 오래된 혼들이 겹쳐 있었어요. 사람의 흔적까지 쓴 걸까요?'],['담허','의심은 무겁네. 하지만 이 조각만으로 공정을 다 안다고 할 수는 없어.']]},
 outro:[['설오','관아 쪽에서 연기가 납니다. 남은 기록을 태우고 있습니다.']],summary:'생활 금속 수거량과 대종 주조량이 거의 일치한다. 유골·재의 비정상 처리 흔적도 있으나 정확한 주조법은 아직 확인하지 못했다.',
 guide:'입구를 받치고 주민을 구한 뒤 장부를 두 적 턴 동안 지키세요. 젖은 장부의 대조가 끝나면 출구로 이동하세요. 보호 대상의 현재 위치를 따라 구조하세요.'},
 {name:'지워진 집안',place:'불붙은 문서고 뜰',theme:'gate',narration:'악귀들이 봉인 문서 뭉치를 화로에 밀어 넣는다. 사람 없는 서가로 불씨가 옮겨붙는다.',
 goal:'기록 소각을 막고 조사 청원서를 호송',
 story:[['휘겸','이름을 지운 장부들까지 태우는군. 물길을 열어 주시오. 이쪽 불길은 내가 막겠소.'],['설오','지붕 위에서 수문 고정구를 쏘겠습니다.',{focus:'seal'}]],
 steps:[destroy('water-release','수문 고정구 끊어 서쪽 불길 막기','water-gate','archer'),step('fire-screen','동쪽 불길 차단하기','interact',{requiredClass:'knight',opens:'fire-door'}),step('petition-record','지워진 조사 청원서 확보'),step('carrier-start','기록 운반을 시작하기','interact',{target:'act3-carrier',startsEscort:true}),step('roof-exit','기록과 함께 문서고 벗어나기','escort',{target:'act3-carrier'})],
 beats:{'petition-record':[['휘겸','선조가 정식 조사를 청원한 뒤 반역과 불경 혐의가 붙었소. 작위 박탈, 추방… 이름을 지운 날짜도 같군.'],['설오','일을 몰라서 덮은 게 아닙니다. 알게 된 뒤에도 숨겼습니다.']]},
 outro:[['휘겸','누가 처음 폐쇄를 승인했는지, 그 결정까지 가져가겠소.']],summary:'휘겸 선조의 조사 청원 뒤에 가문 탄압과 기록 삭제가 이어졌다. 왕실 고위층이 진상을 알고도 은폐했음을 확인했다.',
 guide:'12번의 적 턴 안에 두 불길을 막으세요. 대화 중에는 소각이 진행되지 않습니다. 설오로 수문을 쏘고 휘겸으로 차단막을 세운 뒤 기록을 호송하세요.'},
 {name:'왕실의 선택',place:'관아 외곽 회랑',theme:'temple',narration:'관아 외곽 회랑의 악귀들이 끊어진 명령을 중얼거린다. 회의 기록과 현장 보고를 갈라 놓은 문들은 굳게 잠겼다.',
 goal:'봉쇄를 뚫고 폐쇄 승인과 사후 은폐 기록 대조',
 story:[['수비병 악귀','문을… 지켜라… 열지 마라…'],['휘겸','지킬 사람이 사라진 뒤에도 길만 막고 있군. 안의 기록을 가져갑시다.']],
 steps:[destroy('outer-chain','외곽 봉쇄 사슬 끊기','outer-door'),step('closure-order','당시 폐쇄 승인문 확보'),step('suppression-order','사후 은폐 기록 대조'),hold('passage-hold','퇴로 회랑 지키기',2,'possessedArcher',2,520),exit('office-exit','관아 봉쇄 벗어나기')],
 beats:{'closure-order':[['휘겸','대도사의 보고를 믿고 폐쇄와 제압을 승인했소. 불안한 후계, 강한 방계, 되풀이해 맞은 예언… 경고를 믿을 이유와 이득이 함께 있었군.']],'suppression-order':[['설오','승인문에 주민 전원을 죽이라는 명령은 없습니다.'],['휘겸','학살은 대도사가 저질렀소. 고위층은 사후 진상을 알고도 결과가 유리하다는 이유로 덮었고. 죄가 같지는 않지만, 없지도 않소.']]},
 outro:[['담허','숨겨 둔 문서에 도사의 글이 더 있네. 봉인한 획이 낯익어.']],summary:'왕의 직접 학살 명령으로 단순화할 수 없다. 당시 고위층은 폐쇄·제압을 승인했고 대도사의 학살을 사후 은폐했다.',
 guide:'사슬을 끊고 분리된 두 문서를 대조하세요. 회랑에서 두 적 턴 동안 퇴로를 지킨 뒤 이탈하세요. 낮은 처마 아래에서는 위치를 바꾸어 사선을 확보하세요.'},
 {name:'현묵의 글',place:'밤의 수문과 봉인 창고',theme:'river',narration:'수문 뒤 봉인 창고에 오래된 글 한 묶음이 남았다. 담허가 같은 뿌리의 획을 짚는다.',
 goal:'옛 봉인을 풀고 현묵의 글을 지켜 수문 통과',
 story:[['담허','산길을 돌리던 획과 같은 뿌리네. 순서대로 풀겠어.'],['휘겸','문을 막던 악귀들이 따라왔소. 안쪽 길을 여는 동안 지키겠소.']],
 steps:[hold('old-seal','담허의 옛 봉인 해체 지키기',2,'ghost',2,460,{requiredClass:'mage',opens:'old-door'}),step('hyeonmuk-letter','현묵이 남긴 글 확보'),destroy('sluice-chain','수문길 사슬 끊기','sluice-door'),hold('flight-hold','수문 퇴로 지키기',2,'possessedGuard',2,520),exit('sluice-exit','나루 쪽으로 이탈')],
 beats:{'hyeonmuk-letter':[['담허','현묵… 대도사의 제자 계통에서 남긴 글이네. “스승께 들린 혼은 없었다.”'],['휘겸','“묻는 것마다 저편이 울었다. 우리는 그것을 답이라 여겼다.”'],['담허','“종을 울린 뒤에는 저쪽의 것만 온 것이 아니다. 무명사 안의 이치가 어그러졌다.”'],['소단','누군가 들어 있던 게 아니었군요. 그 안에서 무슨 일이 있었던 걸까요?']]},
 outro:[['담허','이 글은 그 뒤 현묵이 어떻게 됐는지 말하지 않네. 남은 운송로와 맞춰 보세.']],summary:'현묵의 글은 대도사가 일반적인 빙의 상태가 아니었으며 무명사의 이치가 어그러졌다고 전한다. 현묵의 현재 상태는 미상이다.',
 guide:'담허를 표시 범위에 두고 두 적 턴 동안 봉인을 푸세요. 글을 챙겨 사슬을 끊은 뒤 수문 퇴로를 지키세요. 퇴로가 열리면 남은 악귀를 피해 나루로 이동하세요.'},
 {name:'남겨진 길',place:'강변 나루',theme:'river',narration:'읍성을 벗어나는 나루에서 세 묶음의 기록을 한 지도 위에 펼친다. 지도 위에서 끊긴 길의 흔적이 이어진다.',
 goal:'세 운송 기록을 잇고 일행과 옛길 입구에 도착',
 story:[['휘겸','저문골에서 무명사로 간 시신과 금속, 무명사에서 잠운사로 옮긴 묵종, 그 뒤 길을 감춘 봉쇄 기록이오.'],['설오','셋을 겹치면 지나온 길이 보이겠습니다.']],
 steps:[step('transport-map','세 기록으로 옛 운송로 확인'),destroy('route-pin','나루 출구 고정구 끊기','route-door','archer'),hold('ferry-hold','일행이 빠져나갈 나루 지키기',3,'hound',3,540),step('old-road','생존한 동행과 옛길 입구에 모이기','reach',{allHeroes:true,radius:440})],
 beats:{'transport-map':[['설오','이 길이 제 고향 곁을 지납니다. 따로 시작된 일이 아니었군요.'],['담허','오래된 사건의 흐름이 다시 움직이며 그곳에도 닿은 것이겠지. 왜 다시 시작됐는지는 더 가 보아야 하네.'],['휘겸','우리 집안을 지운 까닭도 알겠소. 되찾을 것은 이름보다 이 사람들이 겪은 진실이오.']]},
 outro:[['설오','끝에 남은 곳은 무명사입니다. 그런데 옛길은 끊겨 있습니다.'],['담허','강과 장례길을 따라 이어 보세. 안에서 무엇이 기다리는지는 아직 모르네.'],['소단','이번에는 돌아올 길도 함께 남겨요.']],summary:'저문골·무명사·잠운사를 잇는 운송·봉쇄 기록을 확보했다. 길은 설오의 고향 곁을 지난다. 끊긴 옛길을 따라 무명사로 향한다.',
 guide:'세 기록을 맞춘 뒤 나루 고정구를 끊으세요. 퇴로를 세 적 턴 동안 지키고 살아 있는 모든 동행을 출구 범위로 모으세요. 이후 4막은 준비 중입니다.'}
];
const roster=['archer','mage','knight','occultist'];
for(const [i,d] of chapters.entries()){
 const id=21+i,p=G.HONRO_BALANCE.stages[id-1],st={...d,id,act:3,actStage:i+1,level:Math.floor(p.entryLevel),template:1,objective:'act3',requires:[id-1],active:3,enemies:p.initialEnemies,w:9000,h:4200,playableRoster:roster,map:[7000+i*260,300+(i%3)*260],narration:[d.narration],narrationArt:'road',storySummary:d.summary};
 st.story=scene('act3-entry-'+id,`3-${i+1} · ${d.name}`,d.story);st.outro=scene('act3-outro-'+id,d.name,d.outro);
 st.failure=[['휘겸','길을 다시 잡읍시다. 가져온 단서까지 잃어서는 안 되오.']];H.stages.push(st);
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
})(globalThis);
