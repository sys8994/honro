(function(G){'use strict';
const H=G.HONRO_CONTENT,J=G.HonroJourneyContent,old={required:J.required,optional:J.optional,interlude:J.interlude};
const rows=[
 ['성문 앞 나루','river','강을 따라 읍성에 닿았다. 옛 이송 기록을 찾기 전에 성문을 지나야 한다.',[200,790]],
 ['문서고 앞마당','temple','성문 사람들이 안전한 곳으로 물러났다. 관아 동편의 서가로 간다.',[430,560]],
 ['수로 창고 입구','river','호적과 공식 보고가 맞지 않는다. 폐쇄 뒤의 운송 장부를 찾아 물가로 내려간다.',[610,830]],
 ['폐가 담장 밖','temple','운송 묶음의 문장을 따라 빈 저택 앞에 섰다. 휘겸이 문간을 오래 바라본다.',[750,420]],
 ['숨은 기록실 문턱','temple','사당의 토지문서가 저문골과 휘겸의 선조를 잇는다. 안쪽 기록실을 연다.',[940,290]],
 ['공방 골목','forest','무명사에서 대종을 만들었다는 기록을 챙겼다. 당시 작업량을 적은 장부를 찾는다.',[1140,630]],
 ['연기 오르는 처마','temple','관아 쪽의 연기가 짙어진다. 아직 남은 종이를 지켜야 한다.',[1090,420]],
 ['관아 외곽 길목','temple','소각을 막고 청원서를 지켰다. 폐쇄 승인과 사후 결정이 남은 회랑으로 간다.',[1340,270]],
 ['밤의 수문 앞','river','읍성의 문이 하나씩 닫힌다. 오래된 봉인 뒤에 마지막 글이 남아 있다.',[1450,550]],
 ['읍성 밖 나루','river','세 기록을 품에 넣고 강가에 모였다. 끊긴 옛길의 방향을 맞출 차례다.',[1570,820]]
];
const restNotes=[
 ['고향 사람들의 흔적도 이 길에 남아 있으면 좋겠다.','종을 옮긴 기록이라면 날과 길을 먼저 살피세.','옛 관청의 문서 분류는 배운 적이 있소.','사람이 많아도 혼이 섞인 자리는 느껴져요.'],
 ['주민은 무명사 쪽 소문을 말했지. 장부와 함께 보자.','소문만으로 길을 정할 수는 없네.','봉인에 찍힌 날짜부터 맞춰 보겠소.','다친 분은 이제 자기 목소리로 말했어요.'],
 ['평범한 집들이었다. 보고에 적힌 이름과 달랐다.','기록도 서로 맞춰 보아야 하는 것이네.','사술 혐의라는 한 줄로 삶을 지웠군.','장부 속 이름은 제가 대신 읽을 수 없어요. 함께 봐 주세요.'],
 ['밥그릇과 문고리까지 가져간 까닭이 남아 있다.','같은 목적지라는 점부터 놓치지 말세.','문장이 낯익소. 안에서 확인하겠소.','혼의 흔적과 사람의 기록을 섞어 단정하고 싶지는 않아요.'],
 ['휘겸의 집안과 저문골이 이어져 있었다.','모른 채 살아온 일도 뒤늦게 길을 바꾸는군.','몰락한 이유를 찾는 일이 저 사람들의 일을 밝히는 것이 됐소.','저 안에 남은 것은 누군가가 지키고 싶었던 것이겠죠.'],
 ['무명사에서 대종을 만들었다. 이제는 같은 종을 따라가고 있다.','제작한 곳과 방법은 다른 질문이네.','선조는 증언을 모았소. 그 뒤에 붙은 죄명도 살펴야겠소.','사람들이 사라진 뒤에 종이 만들어졌어요. 그 사이가 두려워요.'],
 ['기록 조각을 말리던 손이 떨렸다. 다시 빼앗기게 두지 말자.','금속량은 맞지만 공정은 아직 빈칸이 많네.','장부를 태우면 남은 질문도 없어진다고 여기는 모양이오.','일단 지금 불길 앞에 있는 사람부터 지켜요.'],
 ['청원서에 이름을 지운 자국이 남았다.','처음 믿은 경고보다 그 뒤에 한 일이 더 분명하네.','우리 집안이 청원을 낸 뒤 기록에서 사라졌소.','오늘 지킨 종이는 누군가의 목소리가 될 수 있겠죠.'],
 ['제압 승인과 학살, 그리고 은폐가 한 가지 일은 아니었다.','대도사의 글보다 그 곁에 있던 이의 기록을 보세.','당시 결정한 사람과 지금 회수하는 사람을 같은 뜻으로 묶진 않겠소.','혼이 들어서 그랬다는 말로 모두 풀리지는 않겠네요.'],
 ['현묵의 글 끝에도 무명사가 남았다.','현재 그가 어디 있는지는 이 글만으로 알 수 없네.','운송과 봉쇄 기록을 한 장에 맞춰 보겠소.','저편이 울었다는 말을 자꾸 되짚게 돼요. 아직 뜻은 모르겠어요.']
];
for(const [i,row] of rows.entries()){const id=21+i,st=H.stages[id-1],[restName,variant,restDescription,map]=row;J.places.push({stageId:id,region:'강변 읍성',place:st.place,event:st.name,layer:'city',variant,restName,restDescription,map});J.interludeSources[id]=[...st.narration];}
const interlude=id=>id>=21&&id<=30?H.stages[id-1].narration.map(text=>['설오',text,{storyId:`rest-interlude-v1-${id}`,storyTitle:H.stages[id-1].name,optional:false}]):old.interlude(id);
J.interlude=interlude;
J.ending={stageId:30,region:'읍성 밖',place:'끊긴 옛길 입구',event:'남겨진 길',layer:'city',variant:'river',restName:'강변 쉼터',restDescription:'가져온 기록을 다시 묶었다. 강 건너 옛 운송로와 장례길은 오래전에 끊겼다. 다음 길을 살피며 잠시 머무른다.',map:[1650,930],actEnd:'셋째 막 끝',endingTitle:'기록을 품고, 옛길 앞에',nextText:'넷째 막 · 옛길과 장례길은 준비 중입니다.'};
J.required=function(profile,id){if(id>=21&&id<=30)return H.stages[id-1].requires.every(n=>profile?.cleared?.[n])?interlude(id):[];if(id==null&&profile?.cleared?.[30])return[['설오','기록은 챙겼다. 끊긴 옛길을 이어 무명사로 가자. 오늘은 강가에서 잠시 쉬자.',{storyId:'rest-interlude-v1-end-30',storyTitle:J.ending.restName,optional:false}]];return old.required(profile,id);};
J.optional=function(profile,id,cls){if(id>=21&&id<=30&&profile?.recruited?.includes(cls)){const index=G.HonroAct3Content.roster.indexOf(cls),text=restNotes[id-21][index];return text?[[H.hero[cls].name,text,{storyId:`rest-optional-v1-${id}-${cls}`,storyTitle:J.at(id).restName,optional:true}]]:[];}if(id==null&&profile?.cleared?.[30]&&profile.recruited.includes(cls)){const text=['고향 곁을 지나던 길이었다. 이제 그 끝을 찾아가자.','옛길의 봉쇄를 하나씩 살피겠네.','이 기록을 지워진 이름들 곁으로 돌려놓겠소.','돌아올 길도 함께 기억해요.'][G.HonroAct3Content.roster.indexOf(cls)];return[[H.hero[cls].name,text,{storyId:`rest-optional-v1-end-30-${cls}`,storyTitle:J.ending.restName,optional:true}]];}return old.optional(profile,id,cls);};
// A separate city atlas prevents new locations from covering the established
// surface/underground maps. These shapes are orientation art, never collision.
function atlas(){let buildings='';for(const [i,p] of J.places.filter(p=>p.layer==='city').entries()){const [x,y]=p.map;buildings+=`<g transform="translate(${x-90} ${y-70})"><rect x="18" y="0" width="140" height="68" fill="#716d55"/><path d="M0 4 L45 -28 H130 L178 4 L168 16 H12Z" fill="#414e4d"/><path d="M37 12V66 M75 12V66 M113 12V66 M149 12V66" stroke="#af9a76" stroke-width="9"/></g>`;}return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 1050" class="journey-atlas" aria-hidden="true"><rect width="1800" height="1050" fill="#ded5b7"/><path d="M0 875Q400 770 660 965T1800 890" fill="none" stroke="#879f9c" stroke-width="155"/><path d="M120 685L160 150 1480 100 1660 745" fill="none" stroke="#a29b81" stroke-width="32"/><path d="M240 750Q700 710 980 570T1570 800" fill="none" stroke="#b8af91" stroke-width="42"/>${buildings}<g font-family="serif" fill="#526361"><text x="130" y="90" font-size="35">강변 읍성 · 지워진 기록</text><text x="900" y="990" font-size="27">강과 옛 나루</text></g></svg>`;}
G.HonroAct3Journey={atlas};
})(globalThis);
