// Presentation inventory: no gameplay unit definitions or save fields are changed.
export const actorCatalog=[
 ...['porter','guard','archer','healer','ritualist','daoist','medium','scout'].map((role,i)=>({id:'ally_'+role,name:['상여꾼','호위 무사','동맹 궁수','치료사','의식승','동맹 도사','동맹 무당','척후병'][i],family:'human',unit:{side:2,honroType:'ally',honroAlly:true,allyRole:role,cls:['healer','ritualist','daoist'].includes(role)?'mage':role==='medium'?'occultist':'knight',name:'검수 동맹'}})),
 {id:'woodcutter',name:'나무꾼',family:'human',unit:{side:2,honroType:'ally',honroAlly:true,honroCivilian:true,allyRole:'scout',cls:'knight',id:'npc-woodcutter',name:'나무꾼'}},
 {id:'civilian',name:'구조 대상 주민',family:'human',unit:{side:2,honroType:'civilian',honroCivilian:true,cls:'knight',name:'주민'}},
 ...['stalker','lantern','charger','warden','host'].map((kind,i)=>({id:'summon_'+kind,name:['배회령','등불귀','돌격귀','수호령','문지기귀'][i],family:'summon',unit:{side:0,summoned:true,summonKind:kind,cls:'occultist',name:'검수 소환수'}})),
 {id:'bier',name:'홍만의 상여',family:'object',unit:{side:2,honroType:'bier',cls:'knight',honroCivilian:true}},
 {id:'bier_boss',name:'빈 상여',family:'object',unit:{side:1,honroType:'bier',cls:'knight',id:'boss'}},
 {id:'stretcher',name:'부상자 운반대',family:'object',unit:{side:2,honroType:'civilian',cls:'knight',honroCivilian:true,id:'objective',name:'부상자 운반대'}},
 {id:'gate',name:'피란문',family:'object',unit:{side:2,honroType:'gate',cls:'knight',honroCivilian:true}},
 {id:'colossus',name:'봉인 거신 (구 보스 호환)',family:'monster',unit:{side:1,boss:1,cls:'knight',honroType:'boss'}}
];
