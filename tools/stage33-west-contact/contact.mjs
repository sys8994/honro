// Isolated paint-only trial, pinned 1e043b09. No renderer or physics edits.
export function applyStage33WestContact(project){
 const stage=project.stages.find(s=>s.metadata?.stageId===33);if(!stage)return project;
 const anchor='act4-sideview:33:coastal-v2:west-continuous-geology';
 if(!stage.elements.some(e=>e.assetId===anchor))throw Error('Current coastal source missing');
 const id='qa-stage33:west-contact-01',p=(d,fill)=>({tag:'path',d,fill});
 const outline='M-3296 808L-3510 922L-3728 1056L-3890 1260L-4170 1578L-4295 1910L-4460 2460L-4415 2960L-4480 3300L-4370 3880L-4210 4350L-4060 4810L-3790 5080L-3296 5300Z';
 const asset={id,name:'Stage33 west actual source contact trial',category:'terrain',visual:[],collision:[],anchor:{x:0,y:0},sockets:[],tags:['qa-only'],params:{semanticLayer:'REAR',silhouetteUnderpaint:false,sourceCommit:'1e043b09d4ce107e1d2dcf70fe2274dff7098476'},vector:{version:1,viewBox:[-4480,808,1184,4492],clips:{outline:[outline]},root:{tag:'g',clipPath:'outline',children:[
 p(outline,'#575453'),
 p('M-3296 808L-3540 935L-3730 1100L-3950 1340L-4200 1600L-4400 2020L-4160 1980L-3820 1820L-3550 1640L-3296 1508Z','#655a54'),
 p('M-3296 1492L-3550 1635L-3870 1855L-4190 2045L-4490 2150L-4490 2220L-4190 2100L-3870 1890L-3550 1668L-3296 1525Z','#b6a390'),
 p('M-3296 1525L-3550 1668L-3870 1890L-4190 2100L-4490 2220L-4490 2320L-4170 2200L-3850 2010L-3550 1775L-3296 1585Z','#998776'),
 p('M-3296 1717L-3560 1900L-3850 2150L-4200 2340L-4490 2450L-4490 2530L-4160 2420L-3820 2210L-3550 1990L-3296 1813Z','#655a54'),
 p('M-3296 1813L-3550 1990L-3820 2210L-4160 2420L-4490 2530L-4490 2590L-4140 2500L-3800 2280L-3540 2070L-3296 1932Z','#877669'),
 p('M-3296 2590L-3550 2740L-3850 2990L-4140 3120L-4480 3240L-4480 3400L-4140 3270L-3840 3120L-3540 2830L-3296 2735Z','#b6a390'),
 p('M-3296 2735L-3540 2830L-3840 3120L-4140 3270L-4480 3400L-4480 3480L-4130 3390L-3810 3280L-3520 3030L-3296 3112Z','#6f635c'),
 p('M-3296 3994L-3540 4140L-3810 4380L-4160 4510L-4290 4560L-4230 4605L-4150 4550L-3800 4430L-3530 4180L-3296 4009Z','#b6a390'),
 ]}}};
 const el={id,assetId:id,x:0,y:0,scale:1,rotation:0,snap:false,depthLayer:'L1',nativeArtLayer:'surface',layer:'mid'};
 const elements=stage.elements.flatMap(e=>e.assetId===anchor?[el,e]:[e]);
 return {...project,library:[...project.library,asset],stages:project.stages.map(s=>s===stage?{...s,elements}:s)};
}
