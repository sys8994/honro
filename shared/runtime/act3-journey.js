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
 ['평범한 집들이었잖아. 보고에는 왜 그런 이름을 붙였을까.','기록도 서로 맞춰 보아야 하는 것이네.','사술 혐의라는 한 줄로 삶을 지웠군.','장부 속 이름은 제가 대신 읽을 수 없어요. 함께 봐 주세요.'],
 ['짐꾼도 살아서 나왔고 기록도 챙겼어. 이제 그 문장을 따라가자.','죽은 몸에는 지키던 일의 사념만 남았더군. 옛 기록의 목적지부터 짚어 보세.','문장이 낯익소. 안에서 확인하겠소.','저 하역장의 육신은 되돌릴 수 없었어요. 피신한 사람들은 살아 있기를 바라요.'],
 ['휘겸의 집안도 저문골과 이어져 있었구나.','모른 채 살아온 일도 뒤늦게 길을 바꾸는군.','몰락한 이유를 찾는 일이 저 사람들의 일을 밝히는 것이 됐소.','저 안에 남은 것은 누군가가 지키고 싶었던 것이겠죠.'],
 ['지하 길은 우리가 살필게. 지상 기록도 무사히 찾아 줘.','각자 본 것을 가지고 돌아와 맞춰 보세.','선조의 기록이 묘역 아래 남아 있소. 무엇을 보았는지 읽어야겠소.','휘겸 씨와 함께 기록실과 공방을 살필게요.'],
 ['가족마다 짐을 따로 묶었어. 이름도 함께 적어 두자.','이곳은 거둔 것을 쌓아 둔 집하장이네. 주조한 장소와 혼동하지 말세.','지상에서 찾은 기록을 가져가겠소.','살아 있는 분은 안전한 길로 보냈어요.'],
 ['지하 명세를 가져왔어. 지상 이름과 맞춰 볼 수 있겠지.','모두 모인 뒤에 서로 본 것을 확인하세.','청원서와 그 뒤에 내린 결정도 가져가겠소.','두 분이 올라올 길에 불이 번지지 않게 해야 해요.'],
 ['제압을 승인한 일, 학살한 일, 알고도 숨긴 일… 따로 짚어야겠어.','대도사의 글보다 그 곁에 있던 이의 기록을 보세.','그때 결정을 내린 사람들의 책임은, 지금 남은 악귀들로 가려지지 않소.','혼이 들어서 그랬다는 말로 모두 풀리지는 않겠네요.'],
 ['현묵의 글 끝에도 무명사구나. 그 이름으로 다시 돌아오네.','현재 그가 어디 있는지는 이 글만으로 알 수 없네.','운송과 봉쇄 기록을 한 장에 맞춰 보겠소.','저편이 울었다는 말을 자꾸 되짚게 돼요. 아직 뜻은 모르겠어요.']
];
const exchanges={
 21:{archer:[['설오','성문에서 피신하는 사람들 짐에 같은 붉은 끈이 묶여 있었어요.'],['휘겸','관아에서 한꺼번에 나눠 준 표식일 거요. 어느 집에서 왔는지도 적혀 있겠지.'],['설오','그 기록이 있으면 가족이 흩어진 사람을 다시 찾을 수 있겠네요. 먼저 성문 안쪽을 살펴요.']]},
 24:{knight:[['휘겸','이 담장 문양을 어릴 적 집에서 봤소. 그저 오래된 문장인 줄 알았는데.'],['설오','그 안에 무엇이 있든 혼자 짊어지진 마세요.'],['휘겸','내 집안이 낸 청원이라면 내 눈으로 읽겠소. 지워진 사람들의 이름도 함께.']]},
 25:{mage:[['담허','저 석대에 박힌 못자국이 보이나. 짐을 묶던 운반길이었을 걸세.'],['설오','지금은 물만 남았군요. 진목이 닿을 단단한 곳부터 찾겠습니다.']]},
 26:{knight:[['휘겸','선조가 무엇을 보고 청원했는지, 기록부터 읽겠소.'],['소단','적힌 이름들을 빠뜨리지 않을게요.']]},
 27:{mage:[['담허','한 번에 멀리 가려 하지 말게. 다음 석대에 둘이 모인 뒤 다시 잇세.'],['설오','한 사람이 남는 일은 없게 하겠습니다.']]},
 28:{knight:[['휘겸','각자 가져온 것을 맞춰 봅시다. 한쪽만 보고 내린 결론은 다시 살펴야 하오.'],['소단','먼저 모두 안전하게 모여요.']]},
 30:{
  archer:[['설오','이제 기록 세 장이 같은 길을 가리켜요. 고향 쪽으로 돌아가는 길이기도 해요.'],['소단','두려우면 잠시 쉬어도 돼요.'],['설오','쉬었다 갈게요. 그래도 이번엔 길을 놓치지 않겠어요.']],
  knight:[['휘겸','선조의 청원과 그 뒤에 붙은 죄명이 나란히 있소. 한쪽만 들고 가면 또 다른 이름이 지워질 거요.'],['담허','그러니 모두 챙긴 것이네. 누구의 잘못인지도 글마다 다시 가려 보세.']],
  occultist:[['소단','저편이 울었다는 글을 읽을 때, 종 안의 소리와는 달랐어요.'],['설오','무엇을 알 수 있죠?'],['소단','아직은 잘 모르겠어요. 먼저 그곳에 닿은 사람들의 말을 들어 볼래요.']]
 }
};
for(const [i,row] of rows.entries()){const id=21+i,st=H.stages[id-1],[restName,variant,restDescription,map]=row;J.places.push({stageId:id,region:'강변 읍성',place:st.place,event:st.name,layer:'city',variant,restName,restDescription,map});J.interludeSources[id]=[...st.narration];}
const interlude=id=>{
 if(!(id>=21&&id<=30))return old.interlude(id);
 const meta={storyId:`rest-interlude-v1-${id}`,storyTitle:H.stages[id-1].name,optional:false};
 const lines=H.stages[id-1].narration.map(text=>['서술',text,{...meta,kind:'narration',presentation:'inline'}]);
 // Chapter 24 is the last existing rest before the uninterrupted split route.
 // Append after its original page so saved scene IDs and page indices survive.
 if(id===24)lines.push(['담허','짐꾼 말대로라면 윗길로 돌아가야겠군. 수로에 내려가기 전에 축지진목을 챙겨 두세.',{...meta}]);
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
