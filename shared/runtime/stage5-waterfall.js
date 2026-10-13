(function(G){'use strict';
const active=b=>b?.honroStage===5&&b.honroStage5WaterfallRevision===1&&!b.honroCustom;
const guide='담허로 물길진 안에 서서 물길 비틀기를 시작하세요. 담허가 진에 머무는 동안만 낙수가 옆 암벽으로 흐릅니다. 설오는 오른쪽 돌턱에서 열린 동굴의 주박목을 쏘세요. 이동과 기본 도약으로 사격턱에 오를 수 있습니다. 주박목 파괴 뒤 한 턴 동안 물길을 가라앉히면 완료됩니다.';
function freshContent(st){return{...st,goal:'물길을 비틀어 폭포 뒤 동굴의 주박목 파괴',narration:['춘례가 가리킨 붉은 실은 폭포 뒤 작은 동굴로 이어졌다. 깊은 소 위로 쏟아지는 물살이 그 안을 가리고 있다.'],story:[
 ['설오','동굴 안에 붉은 실을 감은 나무패가 있습니다. 저 낙수에 화살이 꺾이겠군요.',{focus:'seal'}],
 ['담허','주박목이네. 저기 감긴 실이 집 쪽 매듭을 당기고 있어. 줄 전체를 끊지 말고 목심을 깨야겠네.',{focus:'seal'}],
 ['설오','물살을 뚫을 수 있겠습니까?'],
 ['담허','이 바위에 물길을 돌리던 진이 남아 있네. 여기에 서서 도술을 보태면 낙수를 조금 비틀 수 있어.',{focus:'interact'}],
 ['담허','내가 진을 벗어나면 다시 쏟아질 걸세. 열린 동안 목심만 겨누게. 다른 줄까지 풀리는 건 아니야.'],
 ['설오','돌턱에 올라 사선을 잡겠습니다. 어른 곁으로 오는 것부터 막죠.',{focus:'seal'}]],storyFollowups:[],storySummary:'담허가 물길진에서 낙수를 비튼 사이 설오가 동굴의 주박목을 부쉈다. 다른 줄은 여전히 당겨진다. 휘겸이 찾으러 간 운반대를 돕기 위해 다리로 향한다.',guide};}
const contentFor=G.HonroObjectiveRevision.contentFor;
G.HonroObjectiveRevision.contentFor=function(b,st){const v=contentFor(b,st);return active(b)?b.honroNarrativeContent?.honroWaterfallStory===1?b.honroNarrativeContent:{...freshContent(v),honroWaterfallStory:1}:v;};
const prepare=G.HonroNarrativeRevision.prepareFresh;
G.HonroNarrativeRevision.prepareFresh=function(b){prepare(b);if(active(b))b.honroNarrativeContent={...freshContent(b.honroNarrativeContent||G.HONRO_CONTENT.stages[4]),honroWaterfallStory:1};};
const interaction=G.HonroStoryContent.interaction;
G.HonroStoryContent.interaction=function(app,m){if(active(app.engine?.b)&&m.action==='ritual')return G.HonroStoryContent.scene('ritual-5','낙수 사이의 한 틈',[['담허','(바위의 홈에 손을 짚는다) 물길이 돌아간다. 이 진을 벗어나지 않고 붙들겠네.'],['설오','틈이 열렸습니다. 동굴 안 주박목을 겨누겠습니다.']],{delivery:'dialogue'});return interaction(app,m);};
const eventLines=G.HonroStoryContent.eventLines;
G.HonroStoryContent.eventLines=function(app,ev){if(active(app.engine?.b)&&ev.id==='lower-beasts')return G.HonroStoryContent.scene('event-5-lower-beasts','물길진 곁의 기척',[['설오','사슴들이 바위길로 올라옵니다. 물길진에 붙지 못하게 막겠습니다.',{focus:'interact'}]]);return eventLines(app,ev);};
function text(v){return typeof v==='string'?v.replaceAll('절벽 고리쇠','동굴의 주박목').replaceAll('고리쇠','주박목').replaceAll('담허의 받이진','담허의 물길진').replaceAll('받이진','물길진').replaceAll('의식 시작','물길 비틀기').replaceAll('의식 유지 중','물길 비트는 중'):v;}
const enhance=G.HonroObjectiveGuide.enhance;
G.HonroObjectiveGuide.enhance=function(b,st,r){const v=enhance(b,st,r);if(!active(b))return v;const mapRows=rows=>rows?.map(q=>({...q,label:text(q.label),text:text(q.text)}));return{...v,summary:text(v.summary),currentInstruction:text(v.currentInstruction),completionText:'주박목 파괴 뒤 물길을 1라운드 안정시키면 완료',failureText:text(v.failureText),targets:mapRows(v.targets),allTargets:mapRows(v.allTargets),checklist:mapRows(v.checklist),visibleChecklist:mapRows(v.visibleChecklist)};};
G.HonroStage5Waterfall={active,freshContent,guide,text};
})(globalThis);
