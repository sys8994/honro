(function(G){'use strict';
const K=G.HonroEnvironmentVectorKit;
const active=b=>!!(b&&!b.honroCustom&&b.honroCanonical&&K.STAGE_STYLES[b.honroStage]);
function author(project){for(const st of project.stages||[]){const n=st.metadata?.stageId;if(st.metadata?.campaign===true&&K.STAGE_STYLES[n])st.design={...st.design,sharedVectorArt:{version:1,style:n}};}return project;}
G.HonroVectorCampaignArt={VERSION:1,active,author,styles:K.STAGE_STYLES};
})(globalThis);
