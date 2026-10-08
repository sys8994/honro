(function(G){'use strict';
// Authored blocking, not random movement or inferred gestures from punctuation.
// Story text, triggers, combat and recruitment still belong to their owners.
const cast={
 1:{actor:'npc-woodcutter',scene:'event-1-witness',dx:-32,caption:'수레 뒤에 몸을 숨겼던 나무꾼이 설오의 목소리를 듣고 조심스럽게 나온다.'},
 3:{actor:'npc-hwigyeom',entry:true,dx:-64,caption:'나루에 남은 검객이 물가에서 한 걸음 나와 일행의 앞길을 막는다.'},
 4:{actor:'npc-chunrye',speaker:'춘례',dx:42,caption:'춘례가 피란문 안에서 걸어 나와 붕대를 쥔 손을 보인다.'}
};
// Existing civilian/escort bodies already represent these people in the scene.
const speakers={13:{'석공':'resident-1'},14:{'주민':'resident-1'},16:{'승려':'resident-1','노승':'objective'},19:{'주민':'objective'},20:{'주민':'objective','길찬':'objective','석공':'objective'}};
function speaker(app,who){const b=app.engine?.b;if(b?.honroStaging?.cinematic!==2||b.honroCustom)return null;const id=speakers[b.honroStage]?.[who],u=b.units.find(u=>u.id===id);return u&&!u.dead&&u.hp>0?u:null;}
const face=(actor,at,pose='point',camera=false)=>({type:'look',actor,at,pose,camera,scale:camera?1.05:undefined,duration:650});
const shot=at=>({type:'look',at,duration:650,scale:1.05});
const pose=(actor,kind,at)=>face(actor,at||{actor:'archer'},kind);
const step=(actor,dx)=>({type:'move',actor,to:{origin:actor,dx},duration:850,focus:false});
const toward=(actor,at,distance=48)=>({type:'move',actor,towards:at,distance,duration:950,focus:false});
const rule=(stage,when,who,text,actions)=>({stage,when,who,text,actions});
const rules=[
 // First act: curiosity, a guarded first meeting, then trust earned in action.
 rule(1,'entry','설오','접힌 쪽지',[pose('archer','inspect'),shot({actor:'archer'})]),
 rule(1,'entry','설오','발자국',[step('archer',18),face('archer',{anchor:'cart'},'guard')]),
 rule(1,'event-1-witness','나무꾼','어젯밤',[face('npc-woodcutter',{anchor:'cart'},'point',true)]),
 rule(1,'event-1-witness','설오','더 올라오지',[face('archer',{actor:'npc-woodcutter'},'lower-bow'),face('npc-woodcutter',{actor:'archer'},'listen')]),
 rule(2,'entry','담허','위에 활',[face('npc-damheo',{actor:'archer'},'point',true),face('archer',{actor:'npc-damheo'},'listen')]),
 rule(2,'entry','설오','위에서 돕',[pose('archer','guard',{actor:'objective'}),shot({actor:'archer'})]),
 rule(2,'outcome','연실','아버지, 이제',[pose('npc-yeonsil','bow',{actor:'objective'}),shot({between:['npc-yeonsil','objective']})]),
 rule(2,'outcome','설오','연목 나루의 홍만',[pose('archer','lower-bow'),shot({actor:'archer'})]),
 rule(2,'outcome','담허','나도 함께',[face('npc-damheo',{actor:'archer'},'listen')]),
 rule(3,'entry','휘겸','멈추시오',[face('npc-hwigyeom',{actor:'archer'},'guard',true)]),
 rule(3,'entry','설오','활을 내리지',[pose('archer','guard',{actor:'npc-hwigyeom'})]),
 rule(3,'entry','휘겸','눈을 끄는',[face('npc-hwigyeom',{actor:'boss'},'guard',true)]),
 rule(3,'entry','담허','혼자 남아',[face('mage',{actor:'npc-hwigyeom'},'listen')]),
 rule(4,'entry','휘겸','등 뒤의 문',[face('npc-hwigyeom',{anchor:'gate'},'guard',true)]),
 rule(4,'entry','설오','춘례 씨',[face('archer',{actor:'npc-chunrye'},'lower-bow'),shot({actor:'npc-chunrye'})]),
 rule(5,'entry','설오','폭포 뒤',[face('archer',{goal:'seal'},'point')]),
 rule(5,'entry','담허','위험이 없다고', [pose('mage','guard')]),
 rule(5,'entry','설오','바위에서 받는',[face('archer',{goal:'interact'},'point')]),
 rule(6,'entry','휘겸','붕대를 흔드는',[face('knight',{actor:'objective'},'point')]),
 rule(6,'entry','휘겸','먼저 저 사람',[toward('knight',{actor:'objective'}),face('mage',{actor:'objective'},'listen')]),
 rule(7,'entry','설오','활을 내린다',[pose('archer','lower-bow',{goal:'interact'}),face('mage',{goal:'interact'},'inspect')]),
 rule(7,'entry','휘겸','뒤는 내가',[step('knight',-18),face('knight',{anchor:'start'},'guard')]),
 rule(8,'entry','설오','발을 멈춘다',[pose('archer','recoil',{actor:'boss'})]),
 rule(8,'entry','담허','아니야',[face('mage',{actor:'archer'},'listen')]),
 rule(9,'entry','설오','방울 소리',[face('archer',{anchor:'sodan'},'listen')]),
 rule(9,'sodan-first-receiver','소단','줄에 손대지',[pose('npc-sodan','hold-bell',{marker:'$trigger'}),shot({actor:'npc-sodan'})]),
 rule(9,'sodan-first-receiver','소단','걸어서 나갔',[pose('npc-sodan','listen',{actor:'archer'})]),
 rule(9,'sodan-first-receiver','소단','제가 놓으면',[pose('npc-sodan','hold-bell',{marker:'$trigger'})]),
 rule(9,'sodan-first-receiver','휘겸','사람 없는',[face('knight',{marker:'$trigger'},'point')]),
 rule(10,'entry','소단','거기서 멈춰',[pose('boss','hold-bell',{actor:'archer'}),shot({actor:'boss'})]),
 rule(10,'entry','설오','끈에 긁힌',[pose('archer','recoil',{actor:'boss'})]),
 rule(10,'entry','소단','방울을 끌어',[pose('boss','hold-bell',{actor:'archer'})]),
 rule(10,'cooperation','소단','휘청이며',[pose('boss','recoil'),shot({actor:'boss'})]),
 rule(10,'cooperation','담허','넘겨주게',[pose('mage','hold-bell',{actor:'boss'})]),
 rule(10,'cooperation','휘겸','동쪽 전각',[face('knight',{breach:'east'},'guard')]),
 rule(10,'cooperation','소단','무릎을 꿇',[pose('boss','kneel'),shot({actor:'boss'})]),
 rule(10,'finale-midpoint','소단','몸을 낮춰',[pose('boss','kneel'),shot({actor:'boss'})]),
 rule(10,'finale-midpoint','설오','제 목소리',[face('archer',{actor:'boss'},'lower-bow')]),
 // Second act: different characters inspect, ward, and protect as they speak.
 rule(11,'entry','소단','이 줄을 묶은 손',[pose('occultist','hold-bell',{marker:'knot-west'})]),
 rule(11,'entry','휘겸','길을 비우겠소',[step('knight',22),face('knight',{marker:'knot-west'},'guard')]),
 rule(12,'entry','설오','바위에 제가 낸',[face('archer',{marker:'sign'},'point')]),
 rule(12,'entry','휘겸','지도에 적힌',[pose('knight','inspect')]),
 rule(12,'sign','서술','겹친 획',[pose('mage','inspect',{marker:'sign'}),shot({marker:'sign'})]),
 rule(13,'entry','설오','안에 마을이',[face('archer',{actor:'resident-1'},'lower-bow')]),
 rule(13,'entry','휘겸','손바닥이 찢어졌소',[face('knight',{actor:'resident-1'},'point')]),
 rule(14,'entry','소단','떼어낼게',[pose('occultist','hold-bell',{actor:'resident-1'})]),
 rule(14,'entry','소단','떼어낼게',[face('knight',{actor:'resident-1'},'guard'),step('knight',18)]),
 rule(15,'entry','담허','수문을 열어야',[pose('mage','inspect',{marker:'sluice'})]),
 rule(15,'entry','휘겸','발판이 있소',[pose('knight','inspect',{marker:'groove'})]),
 rule(15,'groove','휘겸','최근에 대종',[pose('knight','inspect',{marker:'groove'}),shot({marker:'groove'})]),
 rule(16,'entry','소단','손은 놓지',[pose('occultist','hold-bell',{actor:'resident-1'})]),
 rule(16,'entry','노승','내 제자',[pose('objective','inspect',{actor:'resident-1'}),shot({between:['objective','resident-1']})]),
 rule(16,'monk','서술','먹을 소매',[pose('objective','inspect',{actor:'resident-1'}),face('resident-1',{actor:'objective'},'listen'),shot({between:['objective','resident-1']})]),
 rule(16,'witness','설오','꺼낼 수 있었',[pose('archer','recoil',{actor:'resident-1'})]),
 rule(17,'entry','휘겸','손으로 뽑아낸',[pose('knight','inspect',{marker:'repair'})]),
 rule(17,'entry','담허','천장이',[face('mage',{marker:'brace'},'point')]),
 rule(17,'notes','소단','죽어 가는',[pose('occultist','lower-bow'),shot({actor:'occultist'})]),
 rule(18,'entry','설오','당신이 축을',[face('archer',{actor:'boss'},'guard')]),
 rule(18,'entry','휘겸','당신이 고른',[step('knight',22),face('knight',{actor:'boss'},'guard')]),
 rule(18,'entry','소단','아직 안에서',[pose('occultist','hold-bell',{goal:'seal'})]),
 rule(19,'entry','소단','기억하는 분',[pose('occultist','hold-bell',{marker:'separate-1'})]),
 rule(19,'old-soul','휘겸','왕실의 봉인',[pose('knight','inspect',{marker:'old-soul'})]),
 rule(20,'entry','휘겸','무너진 출구',[face('knight',{actor:'objective'},'point')]),
 rule(20,'entry','설오','중간 쉼터',[face('archer',{actor:'objective'},'lower-bow')]),
 rule(20,'escort-mid','휘겸','숨을 고르시오',[toward('knight',{actor:'objective'})]),
 // Third act: evidence has physical weight; the two teams keep their own space.
 rule(21,'entry','설오','수레 밑에',[pose('occultist','listen',{actor:'act3-resident'})]),
 rule(21,'entry','설오','수레 밑에',[face('archer',{actor:'act3-resident'},'point')]),
 rule(21,'entry','휘겸','길을 냅시다',[step('knight',36),face('knight',{actor:'act3-resident'},'guard')]),
 rule(22,'entry','휘겸','맞춰 봅시다',[pose('knight','inspect',{marker:'ledger-case'})]),
 rule(22,'compare-ledgers','설오','호적엔',[pose('archer','inspect'),shot({between:['archer','knight']})]),
 rule(23,'entry','설오','짐꾼은 살아',[face('archer',{actor:'act3-carrier'},'point')]),
 rule(23,'carrier-start','휘겸','우리와 나갑시다',[toward('knight',{actor:'act3-carrier'}),face('knight',{actor:'act3-carrier'},'guard')]),
 rule(24,'entry','휘겸','우리 집안',[step('knight',18),pose('knight','inspect',{marker:'family-crest'}),shot({actor:'knight'})]),
 rule(24,'family-crest','휘겸','관계는 듣지',[pose('knight','lower-bow'),shot({actor:'knight'})]),
 rule(25,'entry','휘겸','여기서 열겠소',[pose('knight','inspect',{marker:'hidden-latch'})]),
 rule(25,'entry','담허','문서를 지켜',[face('mage',{goal:'seal'},'guard')]),
 rule(26,'entry','설오','', [pose('archer','inspect',{goal:'interact'})]),
 rule(27,'entry','설오','',[face('archer',{marker:'carrier-start'},'guard')]),
 rule(27,'party-reunion','휘겸','',[pose('knight','inspect'),pose('archer','inspect'),shot({marker:'party-reunion'})]),
 rule(27,'party-reunion','담허','',[face('mage',{actor:'archer'},'listen'),face('occultist',{actor:'mage'},'listen')]),
 rule(28,'entry','휘겸','',[pose('occultist','hold-bell',{goal:'interact'})]),
 rule(28,'entry','휘겸','',[face('knight',{goal:'seal'},'guard')]),
 rule(29,'entry','담허','',[pose('mage','inspect',{goal:'interact'})]),
 rule(29,'entry','휘겸','',[face('archer',{actor:'knight'},'guard')]),
 rule(30,'entry','휘겸','저문골에서',[pose('knight','inspect'),pose('archer','inspect'),shot({between:['archer','knight']})]),
 rule(30,'transport-map','설오','제 고향',[face('archer',{marker:'transport-map'},'point')])
];
// The target is captured at the actual first encounter, not selected again later.
const spirit=[
 [face('archer',{actor:'$spirit'},'guard'),shot({actor:'$spirit'})],
 [face('knight',{actor:'$spirit'},'guard')],
 [face('occultist',{actor:'$spirit'},'point'),shot({between:['occultist','$spirit']})],
 [face('archer',{actor:'occultist'},'lower-bow')],
 [pose('occultist','hold-bell',{actor:'$spirit'})],[]
];
function hiddenSpeech(b,meta){const c=cast[b.honroStage];return !!c&&((c.entry||c.speaker)&&meta?.storyId?.includes('entry-'+b.honroStage)||c.scene&&meta?.storyId?.includes(c.scene));}
function build(app,lines,options={}){
 const b=app.engine?.b;if(app.screen!=='battle'||b?.honroCustom||b?.honroStaging?.cinematic!==2||options.index!==undefined)return null;
 const entry=options.after==='entry',outcome=options.after==='outcome',c=cast[b.honroStage],cues=lines.map(()=>[]),head=[];
 const origins={};for(const u of [...b.units,...Object.values(b.honroStaging.hidden||{})]){const p={x:u.x,y:u.y};origins[u.id]=p;if(u.side===0&&!u.summoned)origins[u.cls]=p;}
 for(const [i,[who,text,meta={}]]of lines.entries()){
  const id=meta.storyId||'',when=id||(entry?'entry':outcome?'outcome':'');
  for(const r of rules)if(r.stage===b.honroStage&&when.includes(r.when)&&who===r.who&&text.includes(r.text))cues[i].push(...r.actions);
  if(id==='act2:first-spirit-encounter'){const part=who==='설오'?(/그럼|가리켜|맞설/.test(text)?3:0):who==='휘겸'?1:who==='소단'?(text.includes('현형부')?4:2):5;cues[i].push(...spirit[part]);}
  if(meta.kind==='guide'||meta.kind==='document')cues[i]=[];
  if(c?.speaker===who&&b.honroStaging.hidden[c.actor])cues[i].unshift({type:'move',actor:c.actor,reveal:true,to:{origin:c.actor,dx:c.dx},duration:900,focus:true});
 }
 if(c&&b.honroStaging.hidden[c.actor]&&(c.entry&&entry||c.scene&&lines.some(l=>l[2]?.storyId?.includes(c.scene))))head.push({...shot({actor:c.actor}),caption:c.caption},{type:'move',actor:c.actor,reveal:true,to:{origin:c.actor,dx:c.dx},duration:950,caption:c.caption});
 if(!head.length&&!cues.some(x=>x.length))return null;
 const context={origins,spirit:lines.find(l=>l[2]?.sceneTarget)?.[2].sceneTarget};
 // Resolve objective shots now, after deferred story has checked current progress.
 function resolve(s){const next=JSON.parse(JSON.stringify(s));for(const key of ['at','to','towards']){
  if(next[key]?.goal){const p=G.HonroObjectives.focus(app,next[key].goal);next[key]=p?{x:p.x,y:p.y}:null;}
  if(next[key]?.breach){const ids=b.honroState?.sodanBreach?.units||[],u=b.units.filter(u=>ids.includes(u.id)&&!u.dead&&u.hp>0).sort((a,b)=>b.x-a.x)[0];next[key]=u?{actor:u.id}:null;}
 }return next;}
 return {id:`direction-v2:${entry?'entry-'+b.honroStage:outcome?'outcome-'+b.honroStage:lines[0]?.[2]?.storyId}`,context,head:head.map(resolve),cues:cues.map(xs=>{const delays={};return xs.map(x=>{const s=resolve(x);if(s.actor){s.delay=delays[s.actor]||0;delays[s.actor]=(s.delay||0)+(s.duration||0);}return s;});})};
}
G.HonroStoryDirection={build,cast,hiddenSpeech,speaker,rules};
})(globalThis);
