(function(G){'use strict';
// Presentation only, using the original entry/event/outcome boundaries and text.
// No new encounter, actor, disclosure, relocation, item or combat state.
const S=G.HonroStoryStaging;
S.register({id:'act1-ferry-warning-v1',stage:3,on:'entry',beforeSpeaker:'휘겸',requiredActors:['npc-hwigyeom'],title:'나루의 경고',steps:[
 {type:'look',at:{actor:'midboss-stage3'},duration:450,caption:'물가의 장승 쪽으로 시선이 향한다.'},
 {type:'look',at:{actor:'npc-hwigyeom'},duration:450,caption:'나루에 선 검객이 일행을 돌아본다.'},
 {type:'look',actor:'npc-hwigyeom',at:{actor:'midboss-stage3'},visualOnly:true,pose:'indicate',duration:1200,caption:'검객이 장승이 있는 쪽을 가리킨다.'},
 {type:'dialogue'}
]});
S.register({id:'act1-cooperation-gesture-v1',stage:10,onStory:'act1-v6:cooperation',beforeSpeaker:'휘겸',requiredActors:['boss','knight'],title:'두 곳을 함께 보다',steps:[
 {type:'look',at:{anchor:'eastHall'},duration:500,caption:'동쪽 전각에서 움직임이 일어난다.'},
 {type:'look',at:{actor:'boss'},duration:450,caption:'시선이 중앙 돌단으로 돌아온다.'},
 {type:'look',actor:'boss',at:{anchor:'receiverWest'},visualOnly:true,pose:'hold-bell',duration:1200,caption:'소단은 방울을 감싼 손을 놓지 않은 채 아래를 살핀다.'},
 {type:'dialogue'}
]});
for(const n of [1,2,3])S.register({id:`act2-send-${n}-gesture-v1`,stage:19,onStory:`act2-v1:act2-19-send-${n}`,requiredActors:['occultist'],title:'손을 놓는 순간',steps:[
 {type:'look',at:{marker:`send-${n}`},duration:300,caption:n===1?'내려놓은 망치 곁으로 시선이 향한다.':'이름을 부르던 자리의 울림이 잦아든다.'},
 {type:'look',actor:'occultist',at:{marker:`send-${n}`},visualOnly:true,pose:n===3?'lower-hands':'open-palms',duration:700,props:[{kind:n===1?'hammer':'departing-light',at:{marker:`send-${n}`}}],caption:n===3?'소단이 천천히 손을 내린다.':'소단이 붙들던 손을 편다.'},
 {type:'dialogue'}
]});
S.register({id:'act3-records-align-v1',stage:30,onStory:'act3-30-transport-map',title:'세 기록을 맞추다',steps:[
 {type:'look',at:{marker:'transport-map'},duration:400,caption:'세 기록을 펼쳐 둔 자리로 시선이 모인다.'},
 {type:'look',actor:'$actor',at:{marker:'transport-map'},visualOnly:true,pose:'read-record',duration:1100,props:[{kind:'records',at:{marker:'transport-map'}}],caption:'흩어 놓은 기록을 한 장씩 포개어 본다.'},
 {type:'dialogue'}
]});
S.register({id:'act3-old-road-regard-v1',stage:30,on:'outcome',position:'after',title:'남은 길을 바라보다',steps:[
 {type:'look',at:{marker:'old-road'},duration:400,caption:'일행이 모인 자리 너머로 옛길이 이어진다.'},
 {type:'look',actors:['archer','mage','knight','occultist'],at:{marker:'old-road'},facing:1,visualOnly:true,pose:'regard',duration:1100,caption:'네 사람은 기록을 챙긴 채 같은 방향을 바라본다.'},
 {type:'dialogue'}
]});
})(globalThis);
