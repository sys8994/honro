(function(G){'use strict';
const H=G.HONRO_CONTENT,C=G.HONRO_CORE;
const scene=(id,title,lines)=>G.HonroStoryContent.scene(id,title,lines).map(([who,text,meta])=>[who,text,{...meta,storyId:meta.storyId.replace('act1-v6:','act2-v1:')}]);
const guide=(text)=>['안내',text,{kind:'guide',focus:'interact'}];
const step=(id,label,kind='interact',extra={})=>({id,label,kind,...extra});
// Coordinates belong to the Workshop recipe. These ordered objectives are also
// the HUD, interaction and victory contract; the bell itself is never a target.
const roster=['archer','mage','knight','occultist'];
const chapters=G.HONRO_STAGE_CONTRACTS.slice(10,20).map(st=>G.HonroNarrativeCatalogue.stage(st));
for(const st of chapters)H.stages.push(st);
H.acts=[{id:1,name:'연목의 매듭',first:1,last:10},{id:2,name:'울리지 않는 종',first:11,last:20}];
H.nextAct={id:3,name:'지워진 기록',place:'읍성 문서고',requires:[20],available:false};
G.HonroAct2Content={chapters,roster,guide,scene,legacySteps:G.HONRO_NARRATIVE_COMPAT.act2.legacySteps};
})(globalThis);
