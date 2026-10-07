/** Finite scene responses committed at actor boundaries, with real entry points. */
const rows={
21:[['gate-resident',3550,'possessedGuard',3,'성문 동쪽에서 군화 소리가 들립니다.'],['refuge-hold',1990,'possessedArcher',2,'지나온 성벽에서 활시위가 울립니다.']],
22:[['archive-seal',1420,'archiveFiend',2,'열린 서고 안에서 종이가 일제히 뒤집힙니다.'],['ledger-case',3620,'archiveFiend',3,'동쪽 계단에서 장부귀들이 내려옵니다.'],['upper-register',4450,'possessedArcher',2,'호적을 꺼내자 위층 경비가 움직입니다.']],
23:[['dispatch-bundle',1650,'possessedGuard',3,'하역문 뒤에서 문지기들이 기록을 쫓아옵니다.'],['carrier-start',3660,'possessedArcher',2,'점검로에 궁귀의 그림자가 나타납니다.'],['carrier-start',5730,'possessedGuard',3,'동쪽 저장칸에서 또 다른 경비가 나옵니다.']],
24:[['family-crest',3670,'archiveFiend',2,'폐가 서재에서 지워진 이름들이 웅성거립니다.'],['shrine-seal',5550,'archiveFiend',3,'봉인이 풀린 사당 뒤로 장부귀가 모입니다.'],['land-register',6910,'possessedGuard',2,'토지문서 쪽 담장 끝에서 경비가 일어납니다.']],
25:[['hidden-latch',1950,'possessedGuard',2,'뒤쪽 석문에서 발소리가 들립니다.'],['archive-hold',3990,'archiveFiend',2,'기록함이 열리자 옆 통로의 장부귀가 깨어납니다.'],['investigation-record',4790,'possessedGuard',2,'문서를 쫓는 수문장이 뒷길로 들어옵니다.']],
26:[['workshop-brace',2240,'kilnFiend',2,'받쳐 올린 들보 너머 종틀이 끌립니다.'],['artisan-resident',3840,'kilnFiend',2,'주민의 목소리에 주조터의 악귀가 고개를 듭니다.'],['casting-tally',5980,'possessedArcher',2,'강둑의 궁귀들이 남은 장부를 겨눕니다.']],
27:[['party-reunion',2810,'possessedGuard',2,'불길이 잦아든 서쪽 회랑으로 경비가 따라옵니다.'],['petition-record',4710,'archiveFiend',3,'청원서를 꺼내자 동쪽 회랑이 웅성거립니다.'],['carrier-start',6100,'possessedArcher',2,'운반을 시작하자 수문 쪽 궁귀가 퇴로를 막습니다.']],
28:[['closure-order',3400,'possessedGuard',3,'옛 파발길에서 봉쇄군이 돌아옵니다.'],['suppression-order',5330,'possessedArcher',2,'은폐 기록을 꺼내자 능선 위 활시위가 울립니다.'],['passage-hold',6980,'possessedGuard',2,'봉쇄선 동쪽에서 마지막 경비가 들어옵니다.']],
29:[['old-seal',1040,'archiveFiend',2,'봉인이 풀리자 지나온 창고에서 종이가 흩날립니다.'],['hyeonmuk-letter',5490,'possessedGuard',3,'수문 바깥에서 글을 되찾으려는 경비가 다가옵니다.'],['flight-hold',6380,'possessedArcher',2,'나루길의 궁귀가 달빛 아래 모습을 드러냅니다.']],
30:[['transport-map',2870,'kilnFiend',2,'지도를 펴자 하역장 종틀이 움직입니다.'],['transport-map',5250,'possessedGuard',3,'나루 쪽에서 문지기들이 옛길을 가로막습니다.'],['ferry-hold',6530,'possessedArcher',2,'퇴로가 열리자 마지막 궁귀가 강둑으로 들어옵니다.']]
};
export function authorReinforcements(s){const id=s.metadata.stageId;if(!rows[id]||id>=23&&s.design.act3.locationRevision!==1)return;
 s.events=s.events.filter(e=>!e.id.startsWith('act3-response-'));
 for(const [i,[objective,x,kind,n,warning]]of rows[id].entries()){
  const source=`act3-response-${id}-${i}`,m=s.markers.find(m=>m.id===objective||objective==='upper-register'&&m.id==='marker-upper-latch');if(!m)throw Error('Response needs objective '+id+'/'+objective);
  // Upper archive entries use their own storey; ordinary terrain placement
  // validates the final body and retries atomically if another actor occupies it.
  const y=id===22?(i===0?2600:i===1?2240:1940):m.y;
  // The last garden entry must warn on the approach to the document. Once the
  // document is collected, the exit can be reached before another actor ends.
  const when=id===24&&i===2?{objectiveDone:'shrine-seal',progress:6100}:{objectiveDone:objective,...(id===23&&i===2?{after:`act3-response-${id}-1`,progress:4250}:{})};
  s.events.push({id:source,once:true,when,warning,text:'증원 진입 · '+warning,entry:{x,y},action:{type:'spawn',kind,n,x,y,spacing:150,maxDistance:380,source,act3Authored:true,elite:i===rows[id].length-1&&kind==='possessedGuard'}});
 }
 s.initialState.honroAct3ResponseRevision=1;s.design.act3.responses={version:1,count:rows[id].length,enemies:rows[id].reduce((n,r)=>n+r[3],0),scope:'Finite objective-linked entries. Warning when queued; one group per safe actor boundary; population and XP caps retained.'};
}
