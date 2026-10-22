(function(G){'use strict';
const H=G.HONRO_CONTENT,C=G.HONRO_CORE;
const step=(id,label,kind='interact',extra={})=>({id,label,kind,...extra});
const hold=(id,label,rounds,kind,count,radius=500,extra={})=>step(id,label,'hold',{rounds,wave:{kind,count},radius,contestRadius:230,...extra});
const destroy=(id,label,opens,requiredClass)=>step(id,label,'destroy',{...(opens?{opens}:{}),...(requiredClass?{requiredClass}:{})});
const exit=(id,label='다음 길에 도착')=>step(id,label,'reach');
const scene=(id,title,lines)=>lines.map(([who,text,meta={}])=>[who,text,{storyId:id,storyTitle:title,...meta}]);
const chapters=G.HONRO_STAGE_CONTRACTS.slice(20).map(st=>G.HonroNarrativeCatalogue.stage(st)),roster=['archer','mage','knight','occultist'];
for(const st of chapters)H.stages.push(st);
H.acts.push({id:3,name:'지워진 기록',first:21,last:30});
H.nextAct={id:4,name:'끊긴 옛길',place:'옛 운송로와 장례길',requires:[30],available:false};
H.version='1.2.0-act3-production';
// These are irreversibly possessed, dead human bodies, not living officials.
// Keep bodily collision, martial attacks and the existing human form/qi response.
Object.assign(G.HonroWorld.archetypes,{
 possessedGuard:{name:'수비병 악귀',look:'human',cls:'knight',skills:['S09'],role:'leaper',h:98,r:25,intent:'악귀가 움직이는 죽은 육신 · 지키던 문을 막는 사념이 남아 있다',act3Fiend:true},
 possessedArcher:{name:'궁수 악귀',look:'human',cls:'archer',skills:['A01'],role:'bow',h:96,r:24,intent:'악귀가 움직이는 죽은 육신 · 성벽과 기록을 지키던 사념으로 활을 든다',act3Fiend:true}
});
G.HonroAct3Content={chapters,roster,scene,revision:1};
// These aliases have their own silhouettes and workplace identities. Combat
// uses the existing, tested martial/projectile roles and ordinary growth budgets.
Object.assign(G.HonroWorld.archetypes,{
 gateMaster:{...G.HonroWorld.archetypes.possessedGuard,name:'수문장 악귀',variant:'gateMaster'},
 archerMaster:{...G.HonroWorld.archetypes.possessedArcher,name:'별초 궁귀',variant:'archerMaster'},
 archiveFiend:{name:'장부귀',look:'human',variant:'archiveFiend',cls:'mage',skills:['M01'],role:'bow',h:98,r:24,act3Fiend:true,intent:'기록을 지우라는 사념에 묶인 죽은 서리 · 흩어진 장부를 움켜쥔다'},
 kilnFiend:{name:'주조귀',look:'human',variant:'kilnFiend',cls:'knight',skills:['S09'],role:'leaper',h:102,r:26,act3Fiend:true,intent:'종틀을 짊어진 죽은 주조공 · 굳은 쇳물과 그을린 망치가 몸에 붙었다'}
});
})(globalThis);
