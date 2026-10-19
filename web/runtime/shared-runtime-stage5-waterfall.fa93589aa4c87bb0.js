(function(G){'use strict';
const active=b=>b?.honroStage===5&&b.honroStage5WaterfallRevision===1&&!b.honroCustom;
const guide='담허로 물길진 안에 서서 물길 비틀기 버튼을 누르세요. 낙수에 들어간 화살은 빠르게 기세를 잃고 물살과 함께 떨어집니다. 담허가 진에 머무는 동안만 물살이 옆으로 비켜 사격할 틈이 열립니다. 이동·도약으로 진을 벗어나면 낙수가 다시 화살을 쓸어 내립니다. 설오는 오른쪽 돌턱에서 열린 동굴의 주박목을 쏘세요. 이동과 기본 도약으로 사격턱에 오를 수 있습니다. 주박목 파괴 뒤 한 턴 동안 물길을 가라앉히면 완료됩니다.';
function freshContent(st){return{...st,goal:'물길을 비틀어 폭포 뒤 동굴의 주박목 파괴',narration:['춘례가 가리킨 붉은 실은 폭포 뒤 작은 동굴로 이어졌다. 깊은 소 위로 쏟아지는 물살이 그 안을 가리고 있다.'],story:[
 ['설오','폭포 뒤에 동굴이 있습니다. 붉은 실을 감은 저 나무가 줄을 당기는 겁니까?',{focus:'seal'}],
 ['담허','주박목이네. 실을 감아 당기는 주술물이야. 집 쪽 매듭이 벌어지기 전에 저 나무부터 깨야겠네.',{focus:'seal'}],
 ['설오','저 물살에 들어가면 화살이 기세를 잃고 떨어집니다. 저대로는 닿지 않겠습니다.'],
 ['담허','이 바위의 진을 쓰면 물길을 조금 비틀 수 있겠네. 내가 여기서 낙수를 옆으로 돌려 보겠어.',{focus:'interact'}],
 ['담허','내가 진을 벗어나면 물살이 돌아올 걸세. 틈이 열린 동안 주박목만 겨누게. 다른 줄은 아직 건드리지 말고.'],
 ['설오','돌턱에 올라 사선을 잡겠습니다. 어른 곁으로 오는 것부터 막죠.',{focus:'seal'}]],storyFollowups:[],storySummary:'담허가 물길진에서 낙수를 비튼 사이 설오가 동굴의 주박목을 부쉈다. 다른 줄은 여전히 당겨진다. 휘겸이 찾으러 간 운반대를 돕기 위해 다리로 향한다.',guide};}
const contentFor=G.HonroObjectiveRevision.contentFor;
G.HonroObjectiveRevision.contentFor=function(b,st){const v=contentFor(b,st);return active(b)?b.honroNarrativeContent?.honroWaterfallStory===1?b.honroNarrativeContent:{...freshContent(v),honroWaterfallStory:1}:v;};
const prepare=G.HonroNarrativeRevision.prepareFresh;
G.HonroNarrativeRevision.prepareFresh=function(b){prepare(b);if(active(b))b.honroNarrativeContent={...freshContent(b.honroNarrativeContent||G.HONRO_CONTENT.stages[4]),honroWaterfallStory:1};};
const interaction=G.HonroStoryContent.interaction;
G.HonroStoryContent.interaction=function(app,m){if(active(app.engine?.b)&&m.action==='ritual')return G.HonroStoryContent.scene('ritual-5','낙수 사이의 한 틈',[['담허','(바위의 홈에 손을 짚는다) 물길이 돌아간다. 이 진을 벗어나지 않고 붙들겠네.'],['설오','틈이 열렸습니다. 동굴 안 주박목을 겨누겠습니다.']],{delivery:'dialogue'});return interaction(app,m);};
const eventLines=G.HonroStoryContent.eventLines;
G.HonroStoryContent.eventLines=function(app,ev){
 const b=app.engine?.b;if(!active(b))return eventLines(app,ev);
 if(ev.id==='bell')return G.HonroStoryContent.scene('event-5-bell','동굴 너머의 방울 소리',[['설오','방울 소리… 가까운 줄은 풀렸는데, 옆 줄은 더 당겨집니다.',{focus:'seal'}]],{delivery:'dialogue'});
 if(ev.id!=='lower-beasts')return eventLines(app,ev);
 const intact=G.HonroQuestTargets.records(b).some(t=>t.id==='cliff-cleat'&&!t.broken),holding=b.honroState?.ritual?.active;
 const line=!intact?'주박목은 부쉈지만 사슴들이 아직 남았습니다. 물길 밖으로 몰아내겠습니다.':holding?'사슴들이 물길진 쪽으로 옵니다. 어른이 물살을 붙드는 동안 제가 막겠습니다.':'사슴들이 바위길로 올라옵니다. 진에 다가가기 전에 길부터 열겠습니다.';
 return G.HonroStoryContent.scene('event-5-lower-beasts','물길진 곁의 기척',[['설오',line,{focus:intact?'interact':'seal'}]],{delivery:'dialogue'});
};
function text(v){return typeof v==='string'?v.replaceAll('절벽 고리쇠','동굴의 주박목').replaceAll('고리쇠','주박목').replaceAll('주박목를','주박목을').replaceAll('주박목가','주박목이').replaceAll('담허의 받이진','담허의 물길진').replaceAll('받이진','물길진').replaceAll('담허의 의식','물길 비틀기').replaceAll('의식 시작','물길 비틀기').replaceAll('의식 유지 중','물길 비트는 중'):v;}
const enhance=G.HonroObjectiveGuide.enhance;
G.HonroObjectiveGuide.enhance=function(b,st,r){const v=enhance(b,st,r);if(!active(b))return v;const mapRows=rows=>rows?.map(q=>({...q,label:text(q.label),text:text(q.text)}));return{...v,summary:text(v.summary),currentInstruction:text(v.currentInstruction),completionText:'주박목 파괴 뒤 물길을 1라운드 안정시키면 완료',failureText:text(v.failureText),targets:mapRows(v.targets),allTargets:mapRows(v.allTargets),checklist:mapRows(v.checklist),visibleChecklist:mapRows(v.visibleChecklist)};};
G.HonroStage5Waterfall={active,freshContent,guide,text,textFor:(b,value)=>active(b)?text(value):value};
})(globalThis);

