(function(G){'use strict';
// Adopted 2026-10-14 canon. This layer changes new-entry prose only; older
// serialized payloads and the frozen objective/split revisions stay authoritative.
const H=G.HONRO_CONTENT,clone=v=>JSON.parse(JSON.stringify(v)),prior=H.stages.map(clone);
const stage=id=>H.stages[id-1];
function text(id,section,find,replacement){
 const rows=section.startsWith('beats.')?stage(id).beats[section.slice(6)]:stage(id)[section];
 const row=rows.find(r=>r[1].includes(find));
 if(!row)throw Error('Story canon source drift: '+id+'/'+section+'/'+find);
 row[1]=replacement;
}
function append(id,section,rows){const st=stage(id);if(section.startsWith('beats.'))(st.beats[section.slice(6)]??=[]).push(...rows);else st[section].push(...rows.map(([who,text,meta])=>[who,text,{...st[section][0]?.[2],...meta}]));}
text(11,'beats.trace','옛 지도에도 길이 없네','주민들도 북쪽 깊은 산의 절이나 동굴은 모른다더군. 옛 지도에도 길이 없네. 종소리를 들었다는 쪽과 혼이 내려오는 쪽이 같네. 까닭은 가서 살펴야겠어.');
text(12,'beats.sign','돌림진이네','돌림진이네. 사람이 길을 틀어놓은 진이지. 이 획은 내가 배운 것과 같은 뿌리야.');
append(13,'story', [['휘겸','바깥 마을 어디서도 이런 공동 이야기는 못 들었소. 위쪽 하늘빛이 닿는 데까지만 보이는군.']]);
// Keep the resident's limited observation beside the established bell taboo.
for(const rows of Object.values(stage(14).beats||{})){
 const at=rows.findIndex(r=>r[1].includes('절보다 종이 먼저'));
 if(at>=0)rows.splice(at+1,0,[rows[at][0],'요새는 늘 밟던 돌에서도 발을 헛디뎌요. 등잔을 가까이 대면 돌은 제자리에 있는데.']);
}
append(17,'beats.repair', [['설오','종 쪽 벽은 가까이 갈수록 뒤로 물러나는 듯합니다. 그래도 이 축으로 사람을 끌어올릴 수 있었던 건 분명합니다.']]);
append(18,'story', [['담허','종 서쪽의 재가 옆으로 흐르네. 낮은 발판에서 빈 돌면에 평사 한 발을 보내 보게. 고정구를 겨누기 전에 거리를 보세.']]);
append(20,'outro', [['담허','종 곁에서 화살이 사라진 순간도 적어 두었네. 옛 기록과 맞춰 보세. 지금은 까닭을 모르겠어.',{requiresBellWitness:true}]]);
text(23,'beats.dispatch-bundle','운송 끈 아래','운송 끈 아래 놋그릇과 농기구가 함께 묶여 있었다. 표찰에는 짐을 내릴 석대와 검수대의 번호도 적혀 있었다.');
text(24,'outro','설오는 나와','설오는 나와 약도의 지하 물길에서 운송 표찰의 원본을 찾세. 휘겸과 소단은 지상 기록을 찾고, 관아 뒤뜰에서 만나자고.');
append(25,'beats.stake-arrival-3', [['설오','저 물방울은 아래로 떨어지다가 옆으로 흐릅니다.'],['담허','눈이 속는 것일 수도 있네. 발 디딜 돌부터 확인하고, 표찰을 챙기세.']]);
text(27,'story','한 번에 끝까지','앞 석대와 뒤 기둥의 자리가 맞지 않는군. 진목이 선 돌은 밟을 수 있네. 둘이 닿은 곳을 확인하며 길을 잇세.');
text(27,'beats.depot-route-ledger','위의 적재대','위는 적재대, 아래는 검수대였군. 운반로 번호는 이어지는데 눈앞의 길은 맞지 않아. 끝 창고의 명세부터 놓치지 말게.');
stage(27).guide='네 도착점에 두 동행이 함께 닿은 기록을 남기세요. 진목 사격과 걷기·도약이 가능한 길은 자유롭게 선택할 수 있습니다. 심부에서 발판을 살피고 가족 명세를 확보한 뒤 합류할 출구로 이동하세요.';
append(28,'outro', [['설오','아래에서 겪은 일은 아직 설명할 수 없습니다. 가져온 이름과 번호는 이 기록으로 확인할 수 있습니다.',{requiresVoidWitness:true}]]);
const letter=stage(29).beats['hyeonmuk-letter'];
letter.splice(letter.length-1,0,
 ['설오','무명사의 이치가 어그러졌다고요. 집하장에서 아래가 없던 순간도 그런 일이었을까요?',{requiresVoidWitness:true}],
 ['담허','비슷한 일인지는 아직 모르네. 이 글과 자네가 겪은 일을 같은 원인이라 단정할 수는 없어.',{requiresVoidWitness:true}]);
// No reveal beyond the evidence: neither casting process nor the missing
// villagers' fate follows from the physical transport records.
text(30,'outro','사람들의 시신과 금속','시신과 생활 금속을 보낸 곳, 종을 옮겨 온 곳이 모두 무명사입니다. 고향 사람들이 향한 곳도 그 옛길에서 더 찾아야겠습니다.');

const active=b=>!b?.honroCustom&&b?.honroStoryCanonRevision===1;
function freshBespoke(id,initialState){
 // These chapters deliberately keep their own authored payloads. Revise only
 // the two adopted observations at new-map authoring; never migrate Continue.
 if(id===12&&initialState.honroQuarryContent){
  const payload=clone(initialState.honroQuarryContent),row=payload.beats.sign.find(r=>r[1].includes('돌림진이네'));
  if(!row)throw Error('Story canon quarry snapshot drift');
  row[1]=stage(12).beats.sign.find(r=>r[1].includes('돌림진이네'))[1];initialState.honroQuarryContent=payload;
 }
 if(id===14&&initialState.honroVerticalStage14Content){
  const payload=clone(initialState.honroVerticalStage14Content),rows=payload.beats['family-mid'],line=stage(14).beats['family-mid'].find(r=>r[1].includes('요새는 늘 밟던 돌'));
  if(!rows||!line)throw Error('Story canon village snapshot drift');
  if(!rows.some(r=>r[1]===line[1])){const at=rows.findIndex(r=>r[1].includes('절보다 종이 먼저'));if(at<0)throw Error('Story canon village observation drift');rows.splice(at+1,0,clone(line));}
  initialState.honroVerticalStage14Content=payload;
 }
 return initialState;
}
function author(project){return {...project,stages:project.stages.map(st=>{
 const id=st.metadata?.stageId;if(!st.metadata?.campaign||id<11||id>30)return st;
 return {...st,initialState:freshBespoke(id,{...st.initialState,honroStoryCanonRevision:1})};
})};}
function witnessedContent(b,content){
 const allow=row=>(!row[2]?.requiresVoidWitness||b?.honroVoidWitness)&&(!row[2]?.requiresBellWitness||b?.honroBellWitness);
 const all=[...(content.story||[]),...(content.outro||[]),...Object.values(content.beats||{}).flat()];
 if(all.every(allow))return content;
 return {...content,story:content.story?.filter(allow),outro:content.outro?.filter(allow),beats:Object.fromEntries(Object.entries(content.beats||{}).map(([key,rows])=>[key,rows.filter(allow)]))};
}
const contentFor=G.HonroObjectiveRevision.contentFor;
G.HonroObjectiveRevision.contentFor=function(b,st){
 const result=contentFor(b,st);
 if(!b||b.honroCustom)return result;
 // Never replace existing full narrative snapshots (including old speech queues).
 if(!active(b)&&!b.honroNarrativeContent&&(result===st||result===H.stages[b.honroStage-1]))return prior[b.honroStage-1]||result;
 return active(b)?witnessedContent(b,result):result;
};
G.HonroStoryCanonV1={version:1,active,author,witnessedContent,prior};
})(globalThis);

