(function(G){'use strict';
const active=b=>b?.honroStage===5&&b.honroStage5WaterfallRevision===1&&!b.honroCustom;
const guide='담허로 안쪽 물길진까지 이동해 물길 비틀기 버튼을 누르세요. 낙수에 들어간 화살은 빠르게 기세를 잃고 물살과 함께 떨어집니다. 담허가 진에 머무는 동안만 물살이 옆으로 비켜 사격할 틈이 열립니다. 이동·도약으로 진을 벗어나면 낙수가 다시 화살을 쓸어 내립니다. 설오는 암반길과 노송의 나무 발판을 올라 맞은편 높은 주박목을 겨냥하세요. 이동과 기본 도약으로 높은 잔교에 오를 수 있습니다. 주박목 파괴 뒤 적 행동을 두 번 버티며 물길을 가라앉히면 완료됩니다.';
function freshContent(st){return G.HonroNarrativeCatalogue.stage(st,5);}
function text(v){return typeof v==='string'?v.replaceAll('절벽 고리쇠','동굴의 주박목').replaceAll('고리쇠','주박목').replaceAll('주박목를','주박목을').replaceAll('주박목가','주박목이').replaceAll('담허의 받이진','담허의 물길진').replaceAll('받이진','물길진').replaceAll('담허의 의식','물길 비틀기').replaceAll('의식 시작','물길 비틀기').replaceAll('의식 유지 중','물길 비트는 중'):v;}
const enhance=G.HonroObjectiveGuide.enhance;
G.HonroObjectiveGuide.enhance=function(b,st,r){const v=enhance(b,st,r);if(!active(b))return v;const mapRows=rows=>rows?.map(q=>({...q,label:text(q.label),text:text(q.text)}));return{...v,summary:text(v.summary),currentInstruction:text(v.currentInstruction),completionText:'주박목 파괴 뒤 적 행동을 두 번 버티면 완료',failureText:text(v.failureText),targets:mapRows(v.targets),allTargets:mapRows(v.allTargets),checklist:mapRows(v.checklist),visibleChecklist:mapRows(v.visibleChecklist)};};
G.HonroStage5Waterfall={active,freshContent,guide,text,textFor:(b,value)=>active(b)?text(value):value};
})(globalThis);
