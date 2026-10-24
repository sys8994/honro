(function(G){'use strict';
const H=G.HONRO_CONTENT,D=G.HonroNarrativeCatalogue.data,clone=x=>JSON.parse(JSON.stringify(x));
const version=1,places=D.places,ending=D.endingPlace,sources={catalogue:'shared/data/narrative-current.json'},interludeSources=Object.fromEntries(Object.entries(D.stages).map(([id,s])=>[id,s.narration]));
const at=stageId=>places.find(p=>p.stageId===Number(stageId))||null;
const open=(p,id)=>!!H.stages[id-1]&&H.stages[id-1].requires.every(n=>!!p?.cleared?.[n]);
const next=p=>places.find(q=>!p?.cleared?.[q.stageId]&&open(p,q.stageId))||null;
const transitionAfter=id=>[1,9,18].includes(Number(id))?'direct':'rest';
function interlude(id){return clone(D.arrivals[id]||[]);}
function required(profile,id){if(id!=null)return open(profile,id)?interlude(id):[];if(profile?.cleared?.[30])return clone(D.restEndings[30].required);return profile?.cleared?.[20]&&!next(profile)?clone(D.restEndings[20].required):[];}
const first={archer:1,mage:3,knight:6,occultist:11};
function optional(profile,id,cls,{debugPreviewStage=null}={}){if(!profile?.recruited?.includes(cls))return[];if(id!=null){const preview=debugPreviewStage===Number(id)&&!!at(id);if((!open(profile,id)&&!preview)||id<first[cls])return[];return clone(D.optional[id]?.[cls]||[]);}const end=profile?.cleared?.[30]?30:profile?.cleared?.[20]&&!next(profile)?20:null;return end?clone(D.restEndings[end]?.optional[cls]||[]):[];}
G.HonroJourneyContent={version,sources,places,ending,at,next,transitionAfter,interludeSources,interlude,required,optional};
})(globalThis);
