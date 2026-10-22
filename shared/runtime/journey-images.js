(function(G){'use strict';
// Metadata is bundled; image bodies are requested only by mount() after the
// selected act passes the journal's existing unlock checks. Keep two decoded
// nodes, reusing the node across selection redraws and journal revisits.
const cache=new Map();
const definition=act=>G.HONRO_JOURNEY_MAPS?.acts?.find(item=>item.act===Number(act))||null;
function entry(act){const def=definition(act);if(!def)return null;let item=cache.get(act);if(item){cache.delete(act);cache.set(act,item);return item;}
 const image=new Image();image.className='journey-map-image';image.alt='';image.draggable=false;image.decoding='async';item={image,state:'loading'};cache.set(act,item);
 while(cache.size>2){const key=cache.keys().next().value;cache.delete(key);}
 item.ready=(async()=>{try{image.src=def.url||def.asset;await image.decode();item.state='ready';}catch{item.state='error';}return item;})();return item;
}
function mount(app){if(typeof G.Image!=='function')return;const host=G.document.querySelector('.journey-image-host'),status=G.document.querySelector('.journey-image-status'),act=app.journeyAct;if(!host||!definition(act))return;const item=entry(act);
 function paint(){if(app.screen!=='journey'||app.journeyAct!==act||!host.isConnected)return;if(item.state==='ready'){host.replaceChildren(item.image);if(status)status.hidden=true;}else if(item.state==='error'){if(status){status.hidden=false;status.innerHTML='지도를 불러오지 못했습니다. 길목은 계속 선택할 수 있습니다. <button data-action="journey-image-retry">다시 시도</button>';}}}
 paint();void item.ready.then(paint);
}
function retry(app){cache.delete(app.journeyAct);mount(app);}
G.HonroJourneyImages={definition,mount,retry,cacheInfo:()=>[...cache].map(([act,item])=>({act,state:item.state}))};
})(globalThis);
