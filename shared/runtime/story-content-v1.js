(function(G){'use strict';
const version=7;
const rescueMethod='그래. 줄은 자르지 말고 손을 잡아 몸부터 가누게 해 주게. 가까이서 붙은 혼을 떼어내야 하네.';
const frozen=G.HONRO_NARRATIVE_COMPAT.story,intro=frozen.introductions,outros=frozen.outros,summaries=frozen.summaries;
function scene(id,title,lines,options={}){return lines.map(([who,text,meta={}])=>[who,text,{...meta,storyId:'act1-v6:'+id,storyTitle:title,...options}]);}
const mapScenes=frozen.mapScenes,events=frozen.events,ledgerPages=frozen.ledgerPages;
function interaction(app,m){
 const hs=app.engine.b.honroState,id=app.stage.id;if(id===5&&app.engine.b.honroStage5WaterfallRevision===1&&m.action==='ritual')return structuredClone(G.HONRO_NARRATIVE_COMPAT.extras['interaction.ritual.currentWaterfall']);
 if(m.action==='ledger')return scene('ledger','홍만의 장부',[
  ...ledgerPages.map(([title,text])=>['기록',text,{kind:'document',documentId:'hongman-ledger',documentTitle:title,page:1,pages:1}]),
  ['설오','맞습니다. 우리 마을 사람들이에요.']],{delivery:'dialogue'});
 if(m.action==='ritual')return scene('ritual-5','물틈을 여는 동안', [['담허','진과 물살은 내가 붙들겠네. 열린 틈으로 고리를 쏘게.'],['설오','쇠고리만 노리겠습니다.']],{delivery:'dialogue'});
 if(m.action==='receiver'&&id===9&&app.engine.b.honroStaging?.entrance&&hs.receivers===1)return [];
 if(m.action==='receiver')return scene('receiver-'+id+'-'+m.id,m.label,hs.receivers===1?
  [['담허','한쪽 받이진이 원혼을 받기 시작했네. 내가 반대편 진도 잇겠네. 그동안 소단의 줄은 건드리지 말게.']]:
  [['담허','두 받이진이 이어졌네. 소단의 망에 붙잡힌 원혼을 한꺼번에 풀지 않고 나누어 받을 수 있겠어.'],[id===10?'소단':'휘겸',id===10?'붙잡은 원혼이 진 쪽으로 조금씩 옮겨 가요. 하지만 가운데 줄은 아직 제가 붙들어야 해요.':'바깥길을 지키겠소. 준비가 됐다고 무작정 줄부터 끊지는 맙시다.']],{delivery:'dialogue'});
 if(m.action==='rescue'){
  const testimony={덕수:'내 손이 집사람한테 갔소. 소단이가 떼어놓고 나를 묶었지.',월이:'제 아이부터 밖으로 내보냈어요. 정신이 돌아올 때까지 곁에 있어 줬고요.',칠복:'죽여야 한다는 사람들도 말렸소. 자기가 붙잡겠다고 했지.'};
  const first=!hs.flags['story:sodan-known'];hs.flags['story:sodan-known']=true;
  const active=app.engine.active?.name||'설오';
  return scene('rescue-'+m.target,m.label+'의 증언',[
   [active,'몸을 가누실 때까지만 붙들겠습니다.'],
   [m.label,testimony[m.label]||'방울 든 소단이가 나를 지켜줬어요.'],
   ...(first?[[m.label,'방울 든 소단이가 이 줄을 맸어요. 우리를 살려 두려고요.'],['설오','그분에게 무사하시다고 전하겠습니다.']]:[])],{delivery:'dialogue'});
 }

 return null;
}
const eventTitles={cart:'수레 뒤의 기척',more:'고개에 모인 새들',witness:'나무꾼의 증언',ridge:'멈춰 선 행렬','procession-seen':'상여 엄호','road-pressure':'그릇에서 빠져나온 것','sniper-seen':'머리 위의 까마귀','right-cliff':'바뀌는 바람','last-flight':'행렬의 출구','midboss-stage3-seen':'침수된 나루장승','dock-beasts':'움막으로 가는 길',transfer:'몸과 그릇','siege-0':'피란문 앞에서','siege-1':'마지막 피란 행렬','lower-beasts':'받이진을 지키며',bell:'고리 너머의 방울 소리','midboss-stage6-seen':'운반대를 막은 교각귀','bridge-crows':'운반대 위의 새들','bridge-boars':'기둥 아래의 기척',pursuit:'뒤처진 사람들과 함께','yard-hounds':'주민에게 다가가기','upper-crows':'구조하는 동안','bier-side':'빈 상여 바깥','bier-crows':'결박이 풀린 뒤','evac-beasts':'대피로 뒤편','evac-crows':'받이진을 설치하며','sodan-hounds':'윗마당 바깥의 기척'};
function eventLines(app,ev){
 if(app.engine?.b.honroCustom)return ev.lines||[];
 const b=app.engine.b,hs=b.honroState||{},d=events[app.stage.id]?.[ev.id];
 if(b.honroStage===5&&b.honroStage5WaterfallRevision===1){if(ev.id==='bell')return structuredClone(G.HONRO_NARRATIVE_COMPAT.extras['5.events.bell']);if(ev.id==='lower-beasts'){const intact=G.HonroQuestTargets.records(b).some(t=>t.id==='cliff-cleat'&&!t.broken),key=!intact?'broken':hs.ritual?.active?'intactHolding':'intactNotHolding';return structuredClone(G.HONRO_NARRATIVE_COMPAT.extras['5.lower-beasts.'+key]);}}
 if(!d)return ev.lines||[];
 let lines=d.lines;
 if(app.stage.id===4&&ev.id==='siege-0'){
  const gate=b.units.find(u=>u.id==='objective'),near=gate&&b.units.some(u=>u.side===0&&!u.dead&&Math.abs(u.x-gate.x)<420);
  lines=near?[['휘겸','저쪽에서 또 몰려오오. 피란민이 문을 빠져나갈 때까지 이 길을 함께 지킵시다.',{focus:'objective'}]]:[['휘겸','문 앞이 비었소! 피란민이 지나갈 길을 다시 열어주시오.',{focus:'objective'}]];
 }
 if(app.stage.id===5&&ev.id==='lower-beasts'){
  const sealsIntact=G.HonroQuestTargets.records(b).some(t=>t.honroSeal&&!t.broken);
  lines=!sealsIntact?[['설오','고리쇠는 끊었지만 사슴들이 아직 남았습니다. 물길에서 몰아냅시다.']]:hs.ritual?.active?[['설오','사슴들이 받이진 쪽으로 옵니다. 담허 어른이 자리를 지키는 동안 제가 막겠습니다.',{focus:'interact'}]]:[['설오','사슴들이 바위 쪽으로 옵니다. 받이진을 펴기 전에 몰아내겠습니다.',{focus:'interact'}]];
 }
 if(app.stage.id===7&&ev.id==='yard-hounds'&&(hs.rescuedCount||0)>=3)lines=[['휘겸','주민들은 빠져나갔소. 산개들이 뒤를 밟지 못하게 내가 막겠소.']];
 if(app.stage.id===7&&ev.id==='upper-crows'&&(hs.rescuedCount||0)>=3)lines=[['담허','주민들은 빠져나왔네. 저 새들이 뒤쫓지 못하게 하세.']];
 if(app.stage.id===8&&ev.id==='bier-crows'&&!G.HonroQuestTargets.records(b).some(t=>t.honroSeal&&!t.broken))lines=[['담허','결박은 모두 풀렸네. 새들을 떼어내고 상여 안의 혼을 받아야 해.',{focus:'boss'}]];
 if(app.stage.id===9&&ev.id==='evac-crows'&&b.honroStaging?.hidden?.['npc-sodan'])lines=[['휘겸','위쪽 새들이 내려오오! 받이진을 놓는 사람 곁을 지키시오.']];
 else if(app.stage.id===9&&ev.id==='evac-crows'&&(hs.receivers||0)>=2)lines=[['소단','(담장 너머로 외친다) 새들이 두 받이진 쪽으로 가요! 원혼이 주민에게 새지 않게 진을 지켜요!']];
 if(app.stage.id===9&&ev.id==='evac-beasts'&&(hs.receivers||0)>=2)lines=[['휘겸','받이진은 섰소. 대피로를 따라 올라오는 놈들만 여기서 끊겠소.']];
 return scene('event-'+app.stage.id+'-'+ev.id,app.stage.name+' · '+eventTitles[ev.id],lines,{delivery:'dialogue'});
}
function rescueTutorialLine(l){return l[2]?.storyId?.includes('entry-follow-7-')&&(/빈 기둥|묶인 줄을 잘라/.test(l[1])||l[1]===rescueMethod);}
function beforeOutcome(app,lines){const b=app.engine?.b;if(b?.honroCustom||b?.honroNarrativeRevision!==1||b.honroStage!==7)return lines;const obsolete=new Set(lines.filter(rescueTutorialLine).map(l=>l[2].storyId));return lines.filter(l=>!obsolete.has(l[2]?.storyId));}
function resolveDeferred(app,entry){
 const b=app.engine.b,hs=b.honroState||{},id=entry.lines?.[0]?.[2]?.storyId||'';
 // Older revision-1 saves can still queue the former round-2 tutorial.
 // Keep unrelated deferred dialogue; never explain a rescue after its first use.
 if(b.honroNarrativeRevision===1&&id.includes('entry-follow-7-')&&entry.lines.some(rescueTutorialLine))return (hs.rescuedCount||0)>0?[]:[['담허',rescueMethod,{...entry.lines[0][2]}]];
 if(id.includes('entry-follow-7-')&&(hs.rescuedCount||0)>=3)return [];
 if(id.includes('entry-follow-9-')&&(hs.receivers||0)>=2)return [];
 if(id.includes('entry-follow-10-')&&hs.sodanCoop)return [];
 const sealsIntact=G.HonroQuestTargets.records(b).some(t=>t.honroSeal&&!t.broken);
 return (entry.lines||[]).filter(([who,text,meta={}])=>{
  if(meta.onlyWhile==='sealsIntact'&&!sealsIntact)return false;
  // Older saved battles may carry the briefing before it had a condition tag.
  if(id.includes('entry-follow-5-')&&!sealsIntact&&text.includes('고리쇠'))return false;
  return true;
 }).map(([who,text,meta])=>{
  if(id.includes('entry-follow-4-')&&who==='휘겸'&&text.includes('피란민')){
   const gate=b.units.find(u=>u.id==='objective'),near=gate&&b.units.some(u=>u.side===0&&!u.dead&&Math.abs(u.x-gate.x)<420);
   return[who,near?'피란민이 나오기 시작했소. 내가 문 앞에서 받겠으니 함께 길을 지킵시다.':'(문 쪽을 돌아보며) 우리와 피란문 사이가 벌어졌소. 사람들이 나오기 전에 그 길부터 다시 열어야 하오.',meta];
  }
  if(id.includes('entry-follow-3-')&&hs.ledger&&text.includes('여기 남은 것도 살펴야겠네'))return[who,'(움막을 돌아보며) 장부는 챙겼으니, 이곳의 혼이 따라오지 못하게 살피세.',meta];
  return[who,text,meta];
 });
}
function cooperation(){return scene('cooperation','손을 나누어 잡다',[
 ['소단','(휘청이며 줄을 움켜쥔다) 안 돼… 또 놓치면….'],
 ['담허','줄에 붙잡힌 원혼을 조금만 양옆 진으로 보내 보게. …됐네. 진 안으로 들어왔어.'],
 ['소단','제가 놓은 혼이… 사람한테 안 갔어요.'],
 ['설오','담허 어른이 진으로 혼을 받는 동안 제가 곁을 지키겠습니다.'],
 ['소단','제가 줄에서 놓은 혼까지 진으로 들어갔어요. …그럼 나머지도 놓을게요. 곁에 있어줘요.']]);}
function cooperationDefense(){return scene('cooperation-defense','함께 막는 밤',[
 ['휘겸','동쪽 전각을 보시오! 들린 짐승들이 문밖에서 넘어오오!'],
 ['설오','지금 온 원혼은 당신의 망에서 빠진 게 아닙니다. 저 문밖에서 짐승의 몸에 붙어 들어왔어요.'],
 ['소단','밖에서 계속 들어오니… 원혼을 아무리 붙잡아도 줄지 않았군요.'],
 ['소단','(돌단에 무릎을 꿇는다) 매듭을 풀게요. 앞을 부탁해요.'],
 ['설오','다가오는 것들은 제가 막겠습니다.'],
 ['안내','양옆 진이 혼을 받는 동안 소단을 보호하세요. 여섯 번의 적 턴이 지나면 의식이 끝납니다.',{kind:'guide'}]]).map(([who,text,meta],i)=>[who,text,{...meta,...(i<2?{camera:{id:`10:defense-east:${i}`,intent:'situation',targets:[{anchor:'eastHall'},{anchor:'outerEast'}],padding:80,maxScale:.72}}:{})}]);}
function finaleMidpoint(){return scene('finale-midpoint','놓치지 않는 손',[
 ['소단','(몸을 낮춰 매듭을 붙든다) 매듭은 반쯤 풀렸어요. 그런데 밖에서 새 원혼이 자꾸 밀려와요. 손이 떨려요.'],
 ['설오','제 목소리 들립니까? 여기서 지키고 있습니다. 매듭에 집중하십시오.'],
 ['소단','…들려요. 조금만 더, 부탁해요.'],
 ['담허','양옆 진이 풀려난 혼을 받고 있네. 숨을 내쉬게. 매듭을 급하게 풀 필요 없어.']]);}
G.HonroStoryContentV1={version,introductions:intro,mapScenes,outros,summaries,events,ledgerPages,scene,eventLines,resolveDeferred,beforeOutcome,interaction,cooperation,cooperationDefense,finaleMidpoint};
})(globalThis);
