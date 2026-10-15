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
3:'움막의 기록함에서 홍만의 장부를 챙기세요. 핵심 단서를 확인한 뒤 원문은 여정의 기록에서 다시 읽을 수 있습니다.',
16:'노승을 구조하고 가까운 위협을 막으세요. 증언과 열쇠를 확인한 뒤 법당 기록실을 열면 이송 기록도 함께 확보합니다.',
23:'살아 있는 짐꾼 곁에서 운송 묶음을 풀고 출발을 도우세요. 운송 기록을 함께 확보합니다. 석교를 지나 짐꾼과 하역장 출구에 도착하세요.',
17:'작업장을 확보하고 버팀목을 세우세요. 인양틀을 제압하고 축을 복원한 뒤 5라운드 보호하면 완료됩니다. 일지 원문은 여정의 기록에서 선택해 읽습니다.',
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
 if(st.id===16){const rows=st.beats.witness;st.beats.witness=[rows.find(r=>r[0]==='휘겸'),rows.at(-1)].filter(Boolean);}
 if(st.id===17)st.beats['clear-lift']=[];
 if(st.id===19)st.beats['old-soul']=st.beats['old-soul'].filter(r=>r[2]?.kind==='document'||r[0]==='휘겸'||r[0]==='설오');
 if(st.id===25){const observations=['적재대의 생활 물품에 번호가 남아 있다.','같은 가족 번호가 서로 다른 물품에 붙어 있다.','물길 너머에도 같은 운송 번호가 이어진다.','끝 창고 쪽 물품에서도 같은 표식이 보인다.','다섯 도착지의 물품 번호를 대조할 수 있게 되었다.'];for(let i=1;i<=5;i++){const key='stake-arrival-'+i;st.beats[key]=[...(st.beats[key]||[]),['서술',observations[i-1],{kind:'narration'}]];}}
 if(st.id===27)st.beats['depot-route-ledger']=[['담허','진목을 세웠네. 현장 물품의 운반 번호는 이어지는데 눈앞의 길은 맞지 않아. 끝 창고의 명세와 대조하세.']];
 if(st.id===30)st.beats['transport-map']=[['서술','나루의 강 방향과 끊긴 옛길을, 지금까지 확보한 이송 기록과 대조한다.',{kind:'narration'}],...st.beats['transport-map']];
 for(const key of ({16:['witness'],19:['old-soul'],27:['depot-route-ledger']}[st.id]||[])){const rows=st.beats[key];if(rows?.length)rows[0][2]={...rows[0][2],evidenceOriginal:{id:`original-${st.id}-${key}`,text:original.beats[key].map(r=>r[0]+' · '+r[1]).join('\n\n'),meta:{kind:'document',documentId:`original-${st.id}-${key}`,documentTitle:st.id===16?'노승의 증언 전문':st.id===19?'천도한 자리의 기록':'집하장의 운반 기록'},stage:st.id}};}
 return st;
}
const author=G.HonroStoryCanonV1.author;
G.HonroStoryCanonV1.author=function(project){const p=author(project);return {...p,stages:p.stages.map(original=>{const id=original.metadata?.stageId;if(!original.metadata?.campaign||!ids.includes(id))return original;const st=clone(original),content=reviseContent(H.stages[id-1]);st.initialState??={};Object.assign(st.initialState,{honroEvidenceRevision:1,honroNarrativeContent:content});if(content.steps)st.initialState[id<21?'honroAct2Steps':'honroAct3Steps']=clone(content.steps);for(const m of st.markers||[]){const s=content.steps?.find(s=>s.id===m.id);if(s){m.label=s.label;if(s.target)m.target=s.target;}if(id===3&&m.action==='ledger')m.label='움막 기록함 챙기기';}return st;})};};
const prepareFresh=G.HonroNarrativeRevision.prepareFresh;
G.HonroNarrativeRevision.prepareFresh=function(b){const content=active(b)&&b.honroNarrativeContent;prepareFresh(b);if(content){b.honroNarrativeContent=content;if(content.steps)b[b.honroStage<21?'honroAct2Steps':'honroAct3Steps']=clone(content.steps);}};
function satisfied(b,s){if(!active(b)||s.kind!=='evidence')return null;const a=b.honroState?.[b.honroStage<21?'act2':'act3'];if(s.afterEvidence)return !!a?.done?.[s.afterEvidence];if(s.evidenceAction==='stake')return (b.stakes||[]).some(q=>q.skill==='M09'&&q.side===0&&(q.expires===undefined||q.expires>b.round));if(s.evidenceAction==='entrances')return !!b.honroState.evidenceEntrances?.water&&!!b.honroState.evidenceEntrances?.archive;return false;}
const entrances=[{id:'water',marker:'split-route-a',classes:['archer','mage'],label:'설오·담허 · 물길 출입로'},{id:'archive',marker:'split-route-b',classes:['knight','occultist'],label:'휘겸·소단 · 지상 기록실 출입로'}];
function observe(app){const b=app.engine.b;if(!active(b)||b.honroStage!==24||!b.honroState.act3?.done['shrine-seal']||app.dialogue||app.modal?.classList.contains('open'))return;const mem=b.honroState.evidenceEntrances??={};for(const q of entrances){const m=b.honroMarkers.find(m=>m.id===q.marker);if(m&&q.classes.every(cls=>b.units.some(u=>u.cls===cls&&u.side===0&&!u.dead&&u.hp>0&&G.HonroAct3.sameFloor(u,m,115))))mem[q.id]=true;}}
function targets(b,s){if(!active(b)||s?.evidenceAction!=='entrances')return null;return entrances.filter(q=>!b.honroState.evidenceEntrances?.[q.id]).map(q=>{const m=b.honroMarkers.find(m=>m.id===q.marker);return {...m,id:q.marker,kind:'exit',label:q.label};});}
const summaries={
'hongman-ledger':'북쪽 산사람 열셋, 아이 둘 포함. 연목 주막을 거쳐 북문으로 향했다. 그 뒤 생사는 아직 알 수 없다.',
'old-route-map':'기존 기록은 저문골의 시신·금속이 무명사로, 묵종이 잠운사로 옮겨졌고 옛길이 봉쇄됐음을 가리킨다.'
};
// Only already acquired document rows are retained. This is not a catalogue of spoilers.
function present(app,lines){const b=app.engine?.b;if(!active(b))return lines;app.profile.honroEvidenceRevision=1;const docs=app.profile.honroEvidenceDocuments??=[];return lines.map(row=>{const [who,text,meta={}]=row;if(meta.evidenceOriginal&&!docs.some(d=>d.id===meta.evidenceOriginal.id))docs.push(clone(meta.evidenceOriginal));if(meta.kind!=='document')return row;const id=meta.documentId||`${b.honroStage}:${meta.documentTitle}`;if(!docs.some(d=>d.id===id&&d.text===text))docs.push({id,text,meta:clone(meta),stage:b.honroStage});return ['서술',(summaries[id]||text.replace(/\n/g,' · '))+'\n원문은 여정의 기록에서 선택해 읽을 수 있다.',{...meta,kind:'narration',documentId:undefined,documentTitle:undefined}];});}
G.HonroEvidenceQuests={version:1,active,ids,changes,reviseContent,satisfied,observe,targets,present};
})(globalThis);
