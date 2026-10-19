(function(G){'use strict';
// A new campaign authoring revision. Never infer this from an old live save.
const H=G.HONRO_CONTENT,clone=v=>JSON.parse(JSON.stringify(v)),ids=[3,16,17,19,22,23,24,25,26,27,28,29,30];
const active=b=>!!b&&!b.honroCustom&&b.honroEvidenceRevision===1;
const changes={
16:{witness:{kind:'evidence',afterEvidence:'clear-rescue-threat',label:'구조한 노승의 증언과 열쇠 확인'},record:{kind:'evidence',afterEvidence:'hall',label:'개방한 기록실의 이송 기록 확보'}},
17:{'clear-lift':{kind:'evidence',afterEvidence:'hold-hoist',label:'복구한 인양축 보호 완료'},notes:{kind:'evidence',afterEvidence:'clear-lift',label:'작업대의 일지 보관'}},
19:{'old-soul':{label:'천도한 자리의 각인을 닦아 확인'}},
22:{'ledger-case':{label:'중층 기록함을 꺼내 통로 열기'},'upper-register':{label:'상층 호적함 구출'}},
23:{'dispatch-bundle':{label:'짐꾼의 운송 묶음을 풀고 출발 돕기',target:'act3-carrier',startsEscort:true},'carrier-start':{kind:'evidence',afterEvidence:'dispatch-bundle',label:'짐꾼과 기록 호송 시작'}},
24:{'family-crest':{label:'휘겸으로 가문 출입문의 문장 확인'},'shrine-seal':{label:'담허로 사당 출입로 개방'},'land-register':{kind:'evidence',evidenceAction:'entrances',label:'설오·담허는 물길 입구, 휘겸·소단은 기록실 입구 확인'}},
25:{'household-tally':{kind:'evidence',afterEvidence:'stake-arrival-5',label:'다섯 도착지 물증과 가족 번호 대조'}},
26:{'investigation-record':{kind:'evidence',afterEvidence:'hidden-latch',label:'열린 기록실의 조사 원본 확보'},'casting-tally':{kind:'evidence',afterEvidence:'artisan-resident',label:'구조한 주민의 공방 장부 보관'}},
27:{'depot-route-ledger':{kind:'evidence',evidenceAction:'stake',label:'첫 진목을 설치하고 현장 운반 번호 확인'}},
28:{'petition-record':{label:'불길에서 청원·결재 기록함 구출'},'closure-order':{kind:'evidence',afterEvidence:'petition-record',label:'구출한 기록함의 폐쇄 승인 확인'},'suppression-order':{kind:'evidence',afterEvidence:'closure-order',label:'구출한 기록함의 사후 은폐 기록 확인'}},
29:{'hyeonmuk-letter':{kind:'evidence',afterEvidence:'old-seal',label:'봉인 안의 현묵 기록 보관'}},
30:{'transport-map':{kind:'reach',radius:260,label:'나루에서 강 방향·끊긴 옛길을 기존 기록과 대조'}}
};
const guides={
3:'움막의 기록함에서 홍만의 장부를 챙기세요. 홍만이 남긴 행선지를 동행과 확인합니다.',
16:'노승을 구조하고 가까운 위협을 막으세요. 증언과 열쇠를 확인한 뒤 법당 기록실을 열면 이송 기록도 함께 확보합니다.',
23:'살아 있는 짐꾼 곁에서 운송 묶음을 풀고 출발을 도우세요. 운송 기록을 함께 확보합니다. 석교를 지나 짐꾼과 하역장 출구에 도착하세요.',
17:'작업장을 확보하고 버팀목을 세우세요. 인양틀을 제압하고 축을 복원한 뒤 5라운드 보호하면 완료됩니다. 작업대의 일지에서 종지기가 한 일을 확인합니다.',
24:'휘겸으로 문장을 확인하고 담허로 사당 봉인을 푸세요. 설오·담허는 물길 입구, 휘겸·소단은 지상 기록실 입구를 확인하면 보호지 원본을 함께 확보합니다. 출구에서 두 팀으로 나뉘며, 합류 전에는 장 사이 자동 회복이 없습니다.',
25:'진목으로 길을 이어 다섯 도착지에 두 동행이 함께 도착하세요. 각 장소의 생활 물품과 번호를 관찰하고 끝에서 가족 번호를 대조한 뒤 출구로 이동하세요.',
26:'숨은 기록실을 열어 조사 원본을 확보하고 공방 주민을 구조하세요. 주민의 장부를 함께 챙긴 뒤 출구로 이동하세요.',
27:'첫 진목을 설치해 현장 운반 번호와 어긋난 길을 확인하세요. 네 도착지에 두 동행이 함께 도착한 뒤 끝 창고의 가족 명세를 확보하고 이탈하세요.',
28:'12번째 적 턴 종료 전에 설오로 수문을, 휘겸으로 차단막을 조작하세요. 네 사람이 중앙에 합류한 뒤 기록함을 구출하고 출구로 이동하세요. 승인·현장 살해·사후 은폐의 책임은 구분해서 확인합니다.',
29:'담허의 봉인 해체를 두 적 턴 지키면 현묵의 글도 함께 확보합니다. 현묵의 현재 행방은 알 수 없습니다. 높은 수문길 또는 점검다리 출구로 이탈하세요.',
30:'나루에서 강 방향과 끊긴 옛길을 이미 얻은 기록과 대조하세요. 나루를 적 턴 3회 지킨 뒤 살아 있는 동행 전원이 옛길 입구에 모이세요.'
};
const goals={17:'인양축을 복구하고 5라운드 보호',24:'사당을 열고 두 조사팀의 출입로를 확인',27:'진목을 설치해 네 도착지를 지나 가족 명세 확보',30:'나루 지형과 기존 기록을 대조하고 방어 후 집결'};
function reviseContent(original){const st=clone(original);for(const s of st.steps||[])Object.assign(s,changes[st.id]?.[s.id]||{});if(guides[st.id])st.guide=guides[st.id];if(goals[st.id])st.goal=goals[st.id];
 if(st.id===16){const rows=st.beats.witness;st.beats.witness=[
  ['승려','이번에 종 안에 갇힌 사람들은 바로 죽지 않았습니다. 사흘 동안 종을 두드리며 물을 달라고 했어요.'],
  ['승려','인양틀은 움직일 수 있었습니다. 그런데 종지기가 인양축을 빼고 문을 잠갔어요.'],
  ['휘겸','그 증언을 적어 두겠소. 뒤편 작업굴에서 빠진 축을 직접 확인합시다.'],
  rows.find(r=>r[0]==='노승'),rows.at(-1)
 ].filter(Boolean);st.beats.record.push(['담허','이건 칠십 년 전의 이송 기록이네. 방금 들은 종지기 사건과는 따로 보아야 하네.']);}
 if(st.id===17)st.beats['clear-lift']=[];

 if(st.id===25){const observations=['적재대의 생활 물품에 번호가 남아 있다.','같은 가족 번호가 서로 다른 물품에 붙어 있다.','물길 너머에도 같은 운송 번호가 이어진다.','끝 창고 쪽 물품에서도 같은 표식이 보인다.','다섯 도착지의 물품 번호를 대조할 수 있게 되었다.'];for(let i=1;i<=5;i++){const key='stake-arrival-'+i;st.beats[key]=[...(st.beats[key]||[]),['서술',observations[i-1],{kind:'narration'}]];}}
 if(st.id===27)st.beats['depot-route-ledger']=[['담허','진목을 세웠네. 현장 물품의 운반 번호는 이어지는데 눈앞의 길은 맞지 않아. 끝 창고의 명세와 대조하세.']];
 if(st.id===30)st.beats['transport-map']=[['서술','나루의 강 방향과 끊긴 옛길을, 지금까지 확보한 이송 기록과 대조한다.',{kind:'narration'}],...st.beats['transport-map']];

 return requiredContent(st);
}

// Presentation-only compatibility: old saved goal IDs, flags and dialogue indices stay intact.
function requiredContent(original){const st=clone(original);if(st.guide)st.guide=cleanText(st.guide);
 if(st.id===19&&st.beats?.['old-soul']&&!st.beats['old-soul'].some(r=>r[0]==='소단'))st.beats['old-soul'].unshift(['소단','종 밑에 오래된 혼이 아직 남았어요. 방금 떠난 희생자들과 옷차림이 달라요.']);
 if(st.id===22&&st.beats){st.beats['ledger-case']=[['휘겸','보고에는 사술 혐의자를 제압하다 다수가 죽었다고 적혀 있소. 같은 해의 호적도 찾아봅시다.']];st.beats['upper-register']=[['설오','이 호적에 적힌 사람들은 농가의 주민과 아이, 노인입니다. 방금 찾은 보고와 맞지 않아요.'],['휘겸','누가 무슨 일을 겪었는지 아직 단정할 수 없소. 두 기록의 이름부터 맞춰 봅시다.']];st.beats['compare-ledgers']=[['설오','같은 주민들을 가리키는데 두 기록의 설명은 다릅니다.'],['휘겸','보고만 믿을 수 없겠군. 현장 증언을 찾아봅시다.']];if(!st.steps?.some(q=>q.id==='upper-register'))st.beats['compare-ledgers'].unshift(['설오','호적에는 농가의 주민과 아이, 노인이 적혀 있습니다. 사술 혐의자를 제압했다는 보고와 맞지 않아요.']);}
 if(st.id===29&&st.beats?.['hyeonmuk-letter']&&!st.beats['hyeonmuk-letter'].some(r=>r[1].includes('현묵의 서명과 문하 표식'))){const rows=st.beats['hyeonmuk-letter'];rows.splice(rows.length-1,0,['담허','현묵의 서명과 문하 표식이 있네. 내가 배운 법맥과 이어지지만, 지금 어디 있는지는 알 수 없어.']);}
 return st;
}
const contentFor=G.HonroObjectiveRevision.contentFor;
G.HonroObjectiveRevision.contentFor=function(b,st){const out=contentFor(b,st);return b?.honroCustom?out:requiredContent(out);};
const author=G.HonroStoryCanonV1.author;
G.HonroStoryCanonV1.author=function(project){const p=author(project);return {...p,stages:p.stages.map(original=>{const id=original.metadata?.stageId;if(!original.metadata?.campaign||!ids.includes(id))return original;const st=clone(original),content=reviseContent(H.stages[id-1]);st.initialState??={};Object.assign(st.initialState,{honroEvidenceRevision:1,honroFieldEvidenceVersion:1,honroNarrativeContent:content});if(content.steps)st.initialState[id<21?'honroAct2Steps':'honroAct3Steps']=clone(content.steps);for(const m of st.markers||[]){const s=content.steps?.find(s=>s.id===m.id);if(s){m.label=s.label;if(s.target)m.target=s.target;}if(id===3&&m.action==='ledger')m.label='움막 기록함 챙기기';}return st;})};};
const prepareFresh=G.HonroNarrativeRevision.prepareFresh;
G.HonroNarrativeRevision.prepareFresh=function(b){const content=active(b)&&b.honroNarrativeContent;prepareFresh(b);if(content){b.honroNarrativeContent=content;if(content.steps)b[b.honroStage<21?'honroAct2Steps':'honroAct3Steps']=clone(content.steps);}};
function satisfied(b,s){if(!active(b)||s.kind!=='evidence')return null;const a=b.honroState?.[b.honroStage<21?'act2':'act3'];if(s.afterEvidence){if(fieldActive(b)&&b.honroStage===26&&s.id==='investigation-record')return !!a?.done?.[s.afterEvidence]&&living(b).some(u=>pickupNear(u,site(b,s.id)));return !!a?.done?.[s.afterEvidence];}if(s.evidenceAction==='stake')return (b.stakes||[]).some(q=>q.skill==='M09'&&q.side===0&&(q.expires===undefined||q.expires>b.round));if(s.evidenceAction==='entrances')return !!b.honroState.evidenceEntrances?.water&&!!b.honroState.evidenceEntrances?.archive;return false;}
const entrances=[{id:'water',marker:'split-route-a',classes:['archer','mage'],label:'설오·담허 · 물길 출입로'},{id:'archive',marker:'split-route-b',classes:['knight','occultist'],label:'휘겸·소단 · 지상 기록실 출입로'}];
function observe(app){const b=app.engine.b;repairMissing(app);recoverCargo(app);if(!active(b)||b.honroStage!==24||!b.honroState.act3?.done['shrine-seal']||app.dialogue||app.modal?.classList.contains('open'))return;const mem=b.honroState.evidenceEntrances??={};for(const q of entrances){const m=b.honroMarkers.find(m=>m.id===q.marker);if(m&&q.classes.every(cls=>b.units.some(u=>u.cls===cls&&u.side===0&&!u.dead&&u.hp>0&&G.HonroAct3.sameFloor(u,m,115))))mem[q.id]=true;}}
function targets(b,s){if(fieldActive(b)){const missing=Object.values(field(b).cargo).filter(q=>q.recoveredMissing&&q.phase==='dropped');if(missing.length)return missing.map(q=>({id:q.id,kind:'exit',x:q.x,y:q.y,label:'누락된 기록함 회수 · 가까이 이동'}));}if(!active(b)||s?.evidenceAction!=='entrances')return null;return entrances.filter(q=>!b.honroState.evidenceEntrances?.[q.id]).map(q=>{const m=b.honroMarkers.find(m=>m.id===q.marker);return {...m,id:q.marker,kind:'exit',label:q.label};});}
// Field evidence belongs to the successful action and its physical actor, never a speaker cue.
const fieldActive=b=>active(b)&&b.honroFieldEvidenceVersion===1;
const field=b=>(b.honroState.fieldEvidence??={version:1,cargo:{},events:{}});
const living=b=>b.units.filter(u=>u.side===0&&!u.summoned&&!u.enthrall&&!u.dead&&u.hp>0);
const near=(u,p,r=220)=>!!u&&!!p&&Math.abs(u.y-p.y)<100&&Math.hypot(u.x-p.x,u.y-p.y)<r;
const site=(b,id)=>b.honroMarkers?.find(m=>m.id===id);
// Acquisition uses precisely the same inclusive horizontal/height metric as Act3.use.
const pickupNear=(u,p)=>!!u&&!!p&&G.HonroAct3.sameFloor(u,p);
const acquisitions={22:['ledger-case','upper-register'],25:['household-tally'],26:['investigation-record','casting-tally'],27:['family-manifest'],28:['petition-record'],29:['hyeonmuk-letter']};
const cargoId=(b,id)=>acquisitions[b.honroStage]?.includes(id)?b.honroStage+':'+id:null;
function eventActor(b,p,actor){if(actor)return pickupNear(actor,p)?actor:null;return living(b).filter(u=>pickupNear(u,p)).sort((a,c)=>Math.abs(a.x-p.x)-Math.abs(c.x-p.x))[0];}
function saveCargo(app,q){app.profile.honroFieldCargo??={};app.profile.honroFieldCargo[q.id]=clone({...q,phase:'carry',progress:0});}
function collect(app,id,source,actor){const b=app.engine.b,f=field(b);if(f.cargo[id])return f.cargo[id];if(!pickupNear(actor,source))return null;
 const q={id,sourceStage:b.honroStage,source:source.id||id,origin:{x:source.x,y:source.y},actor:actor.id,ownerClass:actor.cls,phase:'carry',progress:0,proof:{round:b.round,x:actor.x,y:actor.y}};f.cargo[id]=q;saveCargo(app,q);return q;
}
function pairReady(b){if(!fieldActive(b)||b.honroStage!==22)return true;const f=field(b),m=site(b,'compare-ledgers'),qs=['22:ledger-case','22:upper-register'].map(id=>f.cargo[id]);return qs.every(q=>q&&q.phase==='carry'&&near(b.units.find(u=>u.id===q.actor),m,420))&&near(b.units.find(u=>u.id===qs[0].actor),b.units.find(u=>u.id===qs[1].actor),180);}
// A completed goal is proof of prior acquisition, not proof of an arbitrary carrier.
// Restore an existing saved receipt, otherwise leave its missing case at the source
// for physical recovery. Never clear/replay goals, rewards, story or checkpoints.
function repairMissing(app){const b=app.engine?.b;if(!fieldActive(b))return;const f=field(b),done=b.honroState.act3?.done||{};
 for(const goal of acquisitions[b.honroStage]||[]){const id=cargoId(b,goal);if(!done[goal]||f.cargo[id])continue;
  const old=app.profile.honroFieldCargo?.[id],owner=old&&living(b).find(u=>u.cls===old.ownerClass);
  if(old?.proof&&owner){f.cargo[id]={...clone(old),actor:owner.id,phase:'carry',progress:0};}
  else{const source=goal==='casting-tally'?b.units.find(u=>u.id==='act3-resident'):site(b,goal==='household-tally'?'stake-arrival-5':goal==='hyeonmuk-letter'?'old-seal':goal);if(!source)continue;
   f.cargo[id]={id,sourceStage:b.honroStage,source:source.id,origin:{x:source.x,y:source.y},actor:null,ownerClass:null,phase:'dropped',progress:1,x:source.x,y:source.y,recoveredMissing:true,proof:{completedGoal:goal,round:b.honroState.act3.checkpoints?.find(q=>q.id===goal)?.round??null}};
  }b.sceneVersion++;app.dirty=true;
 }
}
function recoverCargo(app){const b=app.engine.b;if(!fieldActive(b))return;for(const q of Object.values(field(b).cargo)){const owner=b.units.find(u=>u.id===q.actor);if(q.phase==='carry'&&owner&&(owner.dead||owner.hp<=0)){q.phase='dropped';q.x=owner.x;q.y=owner.y;b.sceneVersion++;app.dirty=true;}if(q.phase==='dropped'){const u=living(b).find(u=>q.recoveredMissing?pickupNear(u,q):near(u,q,110));if(u){q.actor=u.id;q.ownerClass=u.cls;q.phase='carry';if(q.recoveredMissing)q.proof={...q.proof,recoveredAt:{round:b.round,x:u.x,y:u.y}};saveCargo(app,q);b.sceneVersion++;app.dirty=true;}}}}
function prepareComplete(app,s,actor){const b=app.engine.b;if(!fieldActive(b))return true;onComplete(app,s,actor);const id=cargoId(b,s.id);return !id||!!field(b).cargo[id];}
function onComplete(app,s,actor){const b=app.engine.b;if(!fieldActive(b))return;const f=field(b);if(f.events[s.id]&&(!cargoId(b,s.id)||f.cargo[cargoId(b,s.id)]))return;
 let p=site(b,s.id),u=eventActor(b,p,actor),ids=[];
 if(s.id==='casting-tally'){const r=f.events['artisan-resident'];p=b.units.find(v=>v.id==='act3-resident');u=r&&b.units.find(v=>v.id===r.actor);}
 if(s.id==='artisan-resident'){p=b.units.find(v=>v.id===s.target);u=eventActor(b,p,actor);}
 if(b.honroStage===28&&s.id==='party-reunion'){
  for(const id of ['25:household-tally','26:investigation-record','26:casting-tally','27:family-manifest']){const old=app.profile.honroFieldCargo?.[id],owner=old&&living(b).find(v=>v.cls===old.ownerClass);if(old&&(b.honroRecordCourtRevision===1?!!owner&&G.HonroAct3.sameFloor(owner,p,440):near(owner,p,260))){f.cargo[id]={...clone(old),actor:owner.id,phase:'carry',progress:0};ids.push(id);}}
 }else if(b.honroStage===22&&s.id==='compare-ledgers')ids=['22:ledger-case','22:upper-register'].filter(id=>f.cargo[id]);
 else if(['ledger-case','upper-register','investigation-record','casting-tally','family-manifest','petition-record','hyeonmuk-letter'].includes(s.id)){
  if(s.id==='hyeonmuk-letter'){p=site(b,'old-seal');u=eventActor(b,p,actor);}const q=p&&collect(app,b.honroStage+':'+s.id,p,u);if(q)ids=[q.id];
 }
 if(b.honroStage===25&&/^stake-arrival-[1-5]$/.test(s.id)){const group=living(b).filter(v=>near(v,p,220));if(group.length!==2)return;u=group[0];}
 if(s.id==='household-tally'&&b.honroStage===25){const last=f.events['stake-arrival-5'];p=site(b,'stake-arrival-5');u=last&&b.units.find(v=>v.id===last.actor);const q=collect(app,'25:household-tally',p,u);if(q)ids=[q.id];}
 if(!u&&ids.length)u=b.units.find(v=>v.id===f.cargo[ids[0]].actor);
 if(!u||!p||(!ids.length&&!pickupNear(u,p)))return;
 f.events[s.id]={actor:u.id,source:{x:p.x,y:p.y},cargo:ids,progress:0,round:b.round};b.sceneVersion++;
}
function fieldDirections(b,goal){if(!fieldActive(b))return[];const e=field(b).events[goal];if(!e)return[];const inspect=goal==='old-soul'||/^stake-arrival-/.test(goal),compare=goal==='compare-ledgers'||goal==='party-reunion';if(!inspect&&!compare&&!e.cargo.length)return[];const at=site(b,goal),walk=compare?[...new Set(e.cargo.map(id=>field(b).cargo[id]?.actor).filter(Boolean))].map((id,i)=>({type:'move',actor:id,to:{x:at.x-65+i*55,y:at.y},duration:900,maxDistance:goal==='party-reunion'&&b.honroRecordCourtRevision===1?600:450,focus:false})):[];return [...walk,{type:'look',actor:e.actor,at:e.source,pose:inspect?'kneel':'inspect',duration:650,camera:true},{type:'field-evidence',goal,actor:e.actor,compare,duration:1100},...(compare?[{type:'look',actor:e.actor,at:at,pose:'inspect',duration:1200},{type:'field-evidence',goal,actor:e.actor,compare:true,pack:true,duration:650}]:[])];}
function animateField(app,step,progress){const b=app.engine.b;if(!fieldActive(b))return;const f=field(b),e=f.events[step.goal];if(!e)return;const actor=b.units.find(u=>u.id===e.actor);if(!near(actor,e.source,step.compare?420:260)&&!e.cargo.length)return;
 if(step.compare){const qs=e.cargo.map(id=>f.cargo[id]).filter(Boolean),at=site(b,step.goal);if(!qs.length||!qs.every(q=>near(b.units.find(u=>u.id===q.actor),at,180)))return;
  for(const [i,q]of qs.entries()){const u=b.units.find(v=>v.id===q.actor);q.phase=step.pack?(progress<1?'packing':'carry'):(progress<1?'placing':'laid');q.progress=step.pack?1-progress:progress;q.x=u.x+(u.facing||1)*(25+i*20);q.y=u.y;if(step.pack&&progress===1)saveCargo(app,q);}
 }
 e.progress=Math.max(e.progress,progress);b.sceneVersion++;
}

const summaries={
'hongman-ledger':'장부에 북쪽 산사람 열셋, 그중 아이 둘이 적혀 있다. 연목 주막에서 하룻밤을 묵고 다음 날 북문으로 향했다.',
 'temple-transfer':'칠십 년 전 대종을 밖에서 옮겨 왔다. 타종을 금하고 인양로와 바깥길을 봉쇄했지만, 출처는 잘려 나갔다.',
 'keeper-work-log':'일지에는 산 사람의 혼을 청동에 붙이려 문을 잠그고 인양축을 뺐다고 적혀 있다. 사흘째 두드림이 멎었다.',
 'bell-transfer-marks':'종 받침에 무명사에서 잠운사로 옮겼다는 표식과 왕실 봉인이 남아 있다. 그 곁에 저문골이라는 이름이 새겨져 있다.',
 'city-incident':'보고에는 사술 혐의자를 제압하던 중 다수가 죽었다고 적혀 있다.',
 'city-register':'같은 해의 호적에는 농가의 주민과 아이, 노인이 적혀 있다. 사건 보고의 설명과 맞지 않는다.',
 'dispatch-tag':'운송 표찰은 저문골의 시신과 생활 금속을 무명사로 보냈음을 가리킨다.',
 'land-plan':'약도에는 저문골 보호지의 묘역 기록실과 공방이 표시돼 있다. 아래 물길은 관아 뒤뜰로 이어진다.',
 'ancestor-investigation':'선조의 현장 조사에는 조직적 저항이 없었으며, 대도사가 주민 전원을 살해했다고 적혀 있다.',
 'casting-comparison':'저문골에서 거둔 금속량과 무명사에서 종을 만들 때 쓴 양이 거의 같다. 유골과 재는 통상 장례와 다르게 처리됐다.',
 'family-manifest':'적재 명세에는 가족 번호마다 이름과 살림 물품이 함께 적혀 있다.',
 'erased-petition':'휘겸의 가문은 조사를 청원한 뒤 작위를 빼앗기고 추방당했다. 청원서의 가문 문장도 지워져 있다.',
 'closure-approval':'왕실 고위 관리가 폐쇄와 제압을 승인했다. 이 결재에는 주민을 죽이라는 명령은 없다.',
 'later-suppression':'학살이 보고된 뒤에도 조사를 막은 기록이 남아 있다.',
 'hyeonmuk-letter':'현묵은 스승에게 들린 혼이 없었다고 썼다. 스승은 저편의 울림을 답이라 여겼고, 타종 뒤 무명사의 이치가 어그러졌다.',
 'old-route-map':'기존 기록의 운송로와 나루의 강 방향이 맞는다. 저문골의 시신·금속은 무명사로, 묵종은 잠운사로 옮겨졌고 옛길은 막혔다.'
};
function cleanText(text){return String(text).replace(/\n?원문은 여정의 기록에서 선택해 읽을 수 있다\./g,'').replace(/핵심 단서를 확인한 뒤 원문은 여정의 기록에서 다시 읽을 수 있습니다\./g,'홍만이 남긴 행선지를 동행과 확인합니다.').replace(/일지 원문은 여정의 기록에서 선택해 읽습니다\./g,'작업대의 일지에서 종지기가 한 일을 확인합니다.');}
// Acquired evidence is delivered in the event. Legacy archive fields remain inert.
function present(app,lines){return lines.map(row=>{const [who,text,meta={}]=row,{evidenceOriginal,...safe}=meta;const id=meta.documentId;const oldDocument=meta.kind==='document'||who==='기록';if(meta.evidenceOriginal?.id==='original-19-old-soul')return ['서술','소단은 종 밑에 남은 혼의 옷차림이 방금 떠난 희생자들과 다르다고 짚었다. '+summaries['bell-transfer-marks'],{...safe,kind:'narration'}];if(!oldDocument)return [who,cleanText(text),safe];return ['서술',summaries[id]||cleanText(text).replace(/\n/g,' · '),{...safe,kind:'narration'}];});}
G.HonroEvidenceQuests={version:1,baseAuthor:author,active,ids,changes,reviseContent,requiredContent,satisfied,observe,targets,present,cleanText,fieldActive,field,onComplete,prepareComplete,repairMissing,pickupNear,pairReady,fieldDirections,animateField};
})(globalThis);

