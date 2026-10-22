(function(G){'use strict';
const active=b=>!b?.honroCustom&&b?.honroStoryCanonRevision===1;
const witnessedContent=(b,content)=>G.HonroNarrativeCatalogue.witnessed(b,content);
function author(project){return{...project,stages:project.stages.map(st=>st.metadata?.campaign&&st.metadata.stageId>=11?{...st,initialState:{...st.initialState,honroStoryCanonRevision:1}}:st)};}
G.HonroStoryCanonV1={version:1,active,author,witnessedContent,prior:G.HONRO_NARRATIVE_COMPAT.canonPrior};
})(globalThis);
