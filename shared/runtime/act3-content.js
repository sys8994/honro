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
 {name:'사라진 짐',hiddenWaterworks:true,place:'지상 관창 하역장',theme:'river',narration:'하늘이 열린 관창 하역장에 쓰러졌던 병사의 몸들이 다시 문을 막는다. 살아 있는 짐꾼은 마지막 장부 상자를 품에 안고 물러선다.',
 goal:'악귀가 막은 하역길을 열고 짐꾼과 운송 기록을 지켜 통과',
 story:[['수비병 악귀','지켜라… 문을… 아무도…'],['소단','숨은 이미 끊겼어요. 악귀가 남은 육신을 움직여요. 저 몸은 사람으로 되돌릴 수 없어요.'],['설오','저 너머 짐꾼은 살아 있습니다. 악귀를 처치하고 나올 길을 열겠습니다.',{focus:'seal'}]],
 steps:[step('dispatch-bundle','무명사 운송 묶음 확보'),step('carrier-start','짐꾼과 출발','interact',{target:'act3-carrier',startsEscort:true}),step('dock-mid','짐꾼을 석교까지 호송','escort',{target:'act3-carrier'}),step('dock-exit','짐꾼과 하역장 벗어나기','escort',{target:'act3-carrier'})],
 beats:{'dispatch-bundle':[['휘겸','시신뿐이 아니오. 놋그릇, 농기구, 장신구, 문고리까지 무명사로 보냈소.'],['설오','죽은 마을의 밥그릇까지 왜 가져갔습니까?']],'carrier-start':[['짐꾼','다들 피했어요. 저 병사들은 죽은 뒤에도 지키던 문에서 떠나지 않았어요.'],['휘겸','당신은 우리와 나갑시다. 상자를 놓치지 마시오.']]},
 outro:[['휘겸','운송 문서에 토지 장부 번호가 남았소. 그 끝의 문장이 낯익군.']],summary:'저문골의 시신과 생활 금속이 함께 무명사로 옮겨졌음을 확인했다. 죽은 육신에 남은 수호의 사념을 돌파해 짐꾼과 운송 묶음을 지켰다.',
 guide:'기록을 챙긴 뒤 짐꾼 곁에서 출발시키세요. 짐꾼 앞의 실제 보행길을 확보하고 가까이 동행하세요. 길을 막는 수비병 악귀를 처치하며 살아 있는 짐꾼을 보호하세요.'},
 {name:'휘겸의 문장',hiddenWaterworks:true,place:'폐쇄된 저택과 사당',theme:'temple',narration:'담장 안의 빈 저택에 같은 문장이 남아 있다. 휘겸이 무너진 문간에서 걸음을 멈춘다.',
 goal:'옛 문장을 따라 잠긴 사당과 토지 장부 확인',
 story:[['휘겸','우리 집안의 문장이오. 저문골 토지 장부에 왜 이것이 찍혀 있소?'],['담허','안쪽 봉인부터 살펴보세. 아직 남은 것이 있네.']],
 steps:[step('family-crest','휘겸의 문장 확인','interact',{requiredClass:'knight'}),step('shrine-seal','사당 봉인 풀기','interact',{requiredClass:'mage',opens:'shrine-door'}),step('land-register','보호지 토지문서 확보'),exit('garden-exit','지상과 지하 두 조사길로 출발')],
 beats:{'family-crest':[['휘겸','내 선조가 왕실 방계였다는 것은 알았소. 이 마을과의 관계는 듣지 못했소.']],'land-register':[['설오','저문골이 오래 보호받던 마을이라고 적혀 있습니다.'],['휘겸','우리 집안은 그곳에서 무엇을 보았던 것이오. 몰락한 까닭도 여기에 있겠군.']]},
 outro:[['휘겸','소단과 나는 묘역의 기록실을 열고 지상 공방을 살피겠소.'],['담허','설오와 나는 끊긴 수로 아래를 보겠네. 건너갈 곳에 진목을 직접 박으면 길을 이을 수 있네.'],['설오','조사를 마치면 관아 뒤뜰에서 만나겠습니다.']],summary:'저문골은 휘겸 선조인 왕실 방계와 관계가 깊었다. 휘겸은 가문의 몰락과 저문골을 함께 추적한다.',
 guide:'휘겸으로 문장을 확인하세요. 담허로 사당 봉인을 풀어 토지문서에 접근하세요. 지붕과 담장 사이에서 사선을 바꾸며 이동하세요.'},
 {name:'물 아래 묶인 이름',place:'지하 수로의 은폐 집하장',theme:'river',hiddenWaterworks:true,narration:'설오와 담허가 지하 수로로 내려갔다. 물 건너 석대에는 사람 없는 집에서 거둔 짐들이 묶여 있다. 운반길은 중간에서 끊겼다.',
 goal:'축지진목으로 물길을 건너 생활물품의 번호 확인',
 story:[['설오','발밑이 보이지 않습니다. 뛰어서 건널 수는 없겠습니다.'],['담허','건너편 단단한 돌에 진목을 박겠네. 둘 다 건넌 뒤 다음 길을 찾세.']],
 steps:[step('depot-entry-seal','담허와 수로 봉인 살피기','interact',{requiredClass:'mage'}),step('stake-arrival-1','축지진목으로 두 동행 건너기','reach',{allHeroes:true,radius:150}),step('household-tally','생활물품의 가족 번호 확인'),exit('waterworks-exit','안쪽 집하장 입구로 이동')],
 beats:{'depot-entry-seal':[['담허','이 구간에서는 수련하지 않은 축지진목도 쓸 수 있네. 단단한 석대에 직접 박고, 옮길 사람을 골라 진목을 누르게.'],['설오','먼저 길을 잇겠습니다. 두 사람 모두 건너갈 수 있는 자리로요.']],'household-tally':[['설오','숟가락과 농기구, 이름표까지 같은 번호로 묶었습니다. 집 한 채의 살림이 통째로…'],['담허','무명사로 보내기 전에 숨겨 둔 집하장인 듯하네. 만든 곳과 거둔 것을 쌓아 둔 곳은 구별해야 하네.'],['설오','가족 번호를 적어 두겠습니다. 지상에 남은 이름들과 맞춰 봐야겠습니다.']]},
 outro:[['담허','안쪽은 더 넓군. 물에 잠긴 운반로가 어디로 이어졌는지 살펴보세.']],summary:'설오와 담허가 축지진목으로 끊긴 수로를 건넜다. 생활물품과 이름표를 가족 번호로 묶어 보관한 지하 은폐 집하장을 발견했다. 이곳이 종 주조소라는 근거는 없다.',
 guide:'담허로 봉인을 살피고 축지진목을 건너편 석대에 직접 박으세요. 설오와 담허를 각각 골라 설치한 진목을 눌러 옮기세요. 두 사람이 모두 건넌 뒤 가족 번호를 확인하세요.'},
 {name:'지상에 남은 증언',place:'묘역 기록실과 불탄 공방',theme:'temple',hiddenWaterworks:true,narration:'휘겸과 소단은 지상에 남았다. 묘역 아래 숨긴 조사문서와 공방에 남은 작업기록을 맞춰 볼 차례다.',
 goal:'선조의 조사문서와 공방 작업기록 확보',
 story:[['휘겸','선조가 묻어 둔 기록실이오. 조사문서부터 찾고 공방으로 가겠소.'],['소단','살아 있는 분이 저쪽에서 움직였어요. 기록과 함께 구해요.']],
 steps:[step('hidden-latch','휘겸으로 기록실 열기','interact',{requiredClass:'knight',opens:'hidden-door'}),step('investigation-record','선조의 조사 기록 확보'),step('artisan-resident','작업기록을 지킨 주민 구조','rescue',{target:'act3-resident'}),step('casting-tally','수거량과 주조량 대조'),exit('workshop-exit','관아 뒤뜰로 돌아가기')],
 beats:{'investigation-record':[['휘겸','조직적인 저항은 없었다. 대도사가 현장에서 주민 전원을 죽였다고… 선조가 증언을 모았소.'],['소단','그 뒤 무명사에서 대종을 만들었다고 적혀 있어요. 저문골에서 가져간 짐의 기록도 함께 있어요.'],['휘겸','희생자 이름이 가족별로 남았소. 다른 장부와도 맞춰 봐야겠소.']],'artisan-resident':[['주민','집안에 남은 작업기록이에요. 또 없어질까 봐 꺼내 왔어요.']],'casting-tally':[['휘겸','무명사에서 종을 만들 때 쓴 금속량이 저문골 수거량과 거의 같소. 유골과 재도 통상 장례처럼 처리하지 않았군.'],['소단','종 곁에는 오래된 혼들이 겹쳐 있었어요. 하지만 이 장부만으로 사람의 흔적을 어떻게 썼는지 알 수는 없어요.'],['휘겸','확인한 것과 아직 모르는 것을 나누어 적겠소.']]},
 outro:[['소단','관아 쪽에서 연기가 나요. 두 분이 올라올 길도 그쪽인데…'],['휘겸','뒤뜰에서 만나기로 했소. 기록을 챙기고 서둘러 갑시다.']],summary:'휘겸과 소단이 선조의 조사문서와 공방 기록을 확보했다. 저항하지 않은 주민들을 대도사가 현장에서 학살했고, 이후 무명사에서 대종을 주조했다. 생활 금속량은 수거량과 거의 일치하며 유골·재 처리도 비정상적이다. 정확한 공정과 목적은 미상이다.',
 guide:'휘겸으로 기록실을 열어 문서를 챙기세요. 공방에서 살아 있는 주민을 구하고 작업기록을 대조한 뒤 뒤뜰로 이동하세요.'},
 {name:'검은 집하장',place:'지하 심부의 봉인 창고',theme:'river',hiddenWaterworks:true,narration:'수로 너머로 거대한 인공 집하장이 드러났다. 높은 적재대와 낮은 검수대 사이의 운반길은 물속으로 꺼졌다. 저문골 사람들의 살림만 층층이 남았다.',
 goal:'석대들을 축지진목으로 이어 가족 번호 대조',
 story:[['설오','집하장 하나에 마을의 살림이 다 들어와 있습니다. 돌길은 여기서도 끊겼군요.'],['담허','한 번에 끝까지 갈 수는 없네. 앞 석대에 진목을 박고, 둘이 모이면 그다음을 잇세.']],
 steps:[step('depot-route-ledger','끊긴 운반로의 순서 확인'),step('stake-arrival-1','두 동행이 위쪽 석대로 건너기','reach',{allHeroes:true,radius:150}),step('stake-arrival-2','두 동행이 아래 하역대로 건너기','reach',{allHeroes:true,radius:150}),step('stake-arrival-3','두 동행이 봉인 창고로 건너기','reach',{allHeroes:true,radius:150}),step('family-manifest','가족 번호와 지상 명단 맞추기'),exit('deep-depot-exit','합류할 출구로 이동')],
 beats:{'depot-route-ledger':[['담허','위쪽 적재대, 아래 검수대, 끝의 봉인 창고 순이네. 건너간 석대에서 다음 진목을 박세.']],'family-manifest':[['설오','열일곱 묶음. 이름표 옆에 숟가락 둘, 농기구 하나… 입구에서 본 가족 번호입니다.'],['담허','지상 장부와 맞춰 볼 수 있도록 이름과 번호를 함께 가져가세.'],['설오','사람들이 살았다는 흔적을 전부 짐의 수량으로만 적었습니다. 이 이름들은 남기겠습니다.']]},
 outro:[['설오','저 문틈으로 연기가 들어옵니다. 약속한 뒤뜰이 가까운가 봅니다.'],['담허','진목을 함부로 거두지 말게. 돌아갈 길을 확인하고 올라가세.']],summary:'거대한 인공 지하 집하장을 축지진목으로 건넜다. 가족별 이름표와 숟가락·농기구를 같은 번호로 다룬 적재 명세를 확보했다. 지상 희생자 명단과의 대조를 위해 두 기록을 합류 지점으로 가져간다.',
 guide:'현재 목표 석대에 진목을 직접 박고 두 동행을 차례로 옮기세요. 둘 다 도착해야 다음 연결이 열립니다. 같은 방식으로 세 석대를 이은 뒤 가족 명세를 챙기세요.'},
 {name:'지운 이름과 남은 명령',place:'불붙은 관아 뒤뜰과 기록각',theme:'temple',hiddenWaterworks:true,narration:'지하에서 올라온 설오와 담허, 공방을 돌아온 휘겸과 소단이 불붙은 관아 뒤뜰의 양쪽에 닿았다. 살아 있는 사람은 물러났지만 악귀들은 남은 문서를 태우고 있다.',
 goal:'불길을 막고 합류해 청원서와 은폐 기록 확보',
 story:[['휘겸','서쪽 불길은 우리가 막겠소. 설오, 동쪽 수문을 열어 주시오.'],['설오','두 분 모두 무사하시군요. 물길을 열고 가운데로 가겠습니다.']],
 steps:[step('fire-screen','휘겸으로 서쪽 불길 막기','interact',{requiredClass:'knight',opens:'fire-door',parallelGroup:'fire-control'}),step('water-release','설오로 동쪽 수문 열기','interact',{requiredClass:'archer',opens:'water-gate',parallelGroup:'fire-control'}),step('party-reunion','네 동행이 뒤뜰에 모이기','reach',{allHeroes:true,radius:440}),step('petition-record','지워진 조사 청원서 확보'),step('closure-order','당시 폐쇄 승인문 확보'),step('suppression-order','사후 은폐 기록 대조'),exit('office-exit','기록을 가지고 봉쇄 벗어나기')],
 beats:{'party-reunion':[['설오','지하의 짐에 가족 번호가 붙어 있었습니다. 숟가락과 농기구까지 한 집씩 묶었더군요.'],['휘겸','희생자 명단의 열일곱 집… 같은 이름이오. 사람을 죽인 뒤 그 삶마저 짐으로 거둔 것이오.'],['소단','이제 이름과 살림을 함께 돌려놓을 수 있겠어요.']],'petition-record':[['휘겸','선조가 정식 조사를 청원한 뒤 반역과 불경 혐의가 붙었소. 작위 박탈, 추방… 이름을 지운 날짜도 같군.'],['설오','몰라서 덮은 게 아닙니다. 알게 된 뒤에도 숨겼습니다.']],'closure-order':[['휘겸','당시 왕실에서 결재한 고위 관리들이 대도사의 보고를 믿고 폐쇄와 제압을 승인했소. 불안한 후계와 강한 방계, 되풀이해 맞은 예언… 경고를 믿을 이유와 이득이 함께 있었군.']],'suppression-order':[['설오','승인문에 주민 전원을 죽이라는 명령은 없습니다.'],['휘겸','현장 학살은 대도사가 저질렀소. 사후 보고를 받은 고위 관리들은 결과가 유리하다는 이유로 진상을 덮었고. 폐쇄를 승인한 일, 학살한 일, 알고도 숨긴 일의 책임을 구별해야 하오.'],['담허','왕실 모두의 뜻이었다거나 지금 눈앞의 들림 탓이었다고 넘겨서는 안 되네. 문서에 남은 결정과 담당자를 짚어야 하네.']]},
 outro:[['담허','숨겨 둔 문서에 도사의 글이 더 있네. 봉인한 획이 낯익어.']],summary:'두 팀이 합류해 지하 가족 번호와 지상 희생자 명단을 대조했다. 휘겸 선조의 조사 청원 뒤 가문 탄압이 이어졌다. 왕실 특정 고위 관리의 폐쇄·제압 승인, 대도사의 현장 학살, 사후 은폐의 책임은 구별된다. 왕의 직접 학살 명령이나 왕실 전체의 공모로 단순화하지 않는다.',
 guide:'12번째 적 턴이 끝나기 전에 양쪽 불길 제어점을 여세요. 순서는 자유이며 대화 중에는 소각이 멈춥니다. 네 동행이 가운데 모인 뒤 청원서, 폐쇄 승인문, 사후 은폐 기록을 순서대로 챙겨 이탈하세요.'},
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
 const id=21+i,p=G.HONRO_BALANCE.stages[id-1],st={...d,id,act:3,actStage:i+1,level:Math.floor(p.entryLevel),template:1,objective:'act3',requires:[id-1],active:p.activeEnemies||3,enemies:p.initialEnemies,w:9000,h:4200,playableRoster:roster,map:[7000+i*260,300+(i%3)*260],narration:[d.narration],narrationArt:'road',storySummary:d.summary};
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
// These aliases have their own silhouettes and workplace identities. Combat
// uses the existing, tested martial/projectile roles and ordinary growth budgets.
Object.assign(G.HonroWorld.archetypes,{
 gateMaster:{...G.HonroWorld.archetypes.possessedGuard,name:'수문장 악귀',variant:'gateMaster'},
 archerMaster:{...G.HonroWorld.archetypes.possessedArcher,name:'별초 궁귀',variant:'archerMaster'},
 archiveFiend:{name:'장부귀',look:'human',variant:'archiveFiend',cls:'mage',skills:['M01'],role:'bow',h:98,r:24,act3Fiend:true,intent:'기록을 지우라는 사념에 묶인 죽은 서리 · 흩어진 장부를 움켜쥔다'},
 kilnFiend:{name:'주조귀',look:'human',variant:'kilnFiend',cls:'knight',skills:['S09'],role:'leaper',h:102,r:26,act3Fiend:true,intent:'종틀을 짊어진 죽은 주조공 · 굳은 쇳물과 그을린 망치가 몸에 붙었다'}
});
})(globalThis);
