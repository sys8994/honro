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
})(globalThis);
