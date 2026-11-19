// Deliberately never reads the original BODY/canopy/surface or libraries.
export const IDS=Object.freeze({source:'stage-42',draft:'stage-42-clean-sheet',art:'stage42-clean-workshop-native',placement:'stage42-clean-art'});
const clone=structuredClone;
export function createBlankWorkshopStage(sourceProject){
 const matches=sourceProject.stages.filter(s=>s.id===IDS.source);
 if(matches.length!==1)throw Error('Expected one approved Stage42 source');
 const s=matches[0];
 if(s.width!==6500||s.height!==2861||s.terrains.map(t=>t.id).join(',')!=='a5-supply-road,a5-palisade,a5-device-0')throw Error('Stage42 recipe changed');
 // Explicit whitelist; do not spread the stock stage or old asset records.
 const baseline={width:s.width,height:s.height,
   terrainCollision:clone(s.terrains),
   coordinateMode:'world-units',
   sourceId:IDS.source};
 const stage={id:IDS.draft,name:'5막 2장 신규 지형 작업본',width:s.width,height:s.height,
   terrains:[],elements:[],units:[],events:[],markers:[],
   metadata:{sandbox:true,referenceStageId:IDS.source,authoringMode:'blank-native'}};
 // Keep separate immutable collision guides, never in active visual design.
 // A game-parity preview uses a temporary compose after visible path generation.
 return {stage,baseline,design:{version:1,outline:[],seams:[],dummies:[]}};
}
