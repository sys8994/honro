// Match the adult proportions of the approved v008 party: face ~10-12% of height,
// shoulder/hip level above the midpoint, and a narrow head on a visible neck.
// These are geometric edits to the authoring data, never per-frame sprite scaling.
function pathMap(d,fn){let i=0,x;return d.replace(/[-+]?(?:\d*\.)?\d+/g,v=>{if(i++%2===0){x=Number(v);return '@'+x+'@';}return String(v);}).replace(/@([-\d.]+)@([\s,]+)([-\d.]+)/g,(_,x,g,y)=>fn([+x,+y]).map(v=>+v.toFixed(3)).join(' '));}
export function transformParts(a,ids,fn,widthScale=1){for(const p of a.parts)if(!ids||ids.has(p.id)){p.pivot=fn(p.pivot);for(const q of p.paths){q.d=pathMap(q.d,fn);q.width*=widthScale;}}}
export function matureHuman(a){
 const ids=new Set(['head']);for(const p of a.parts)if(ids.has(p.parent))ids.add(p.id);
 transformParts(a,ids,([x,y])=>[x*.68,-83+(y+85)*.68],.8);
 transformParts(a,new Set(['neck']),([x,y])=>[x*.62,y<=-82?-82+(y+82)*.3:y]);
 transformParts(a,null,([x,y])=>[x*.88,y<=-43?y-12:y*55/43],.9);
 Object.assign(a.palette,{skin:'#B7987B',skinShade:'#8D7159',linen:'#AAA590',linenShade:'#817D69',shade:'#354138',eye:'#C5B69A'});
 // Close the overly broad, pale collar and soften the contrast of the large cloth planes.
 for(const key of ['cloth','light']){const v=a.palette[key].slice(1).match(/../g).map(x=>parseInt(x,16));a.palette[key]='#'+v.map(x=>Math.round(x*.84).toString(16).padStart(2,'0')).join('');}
 a.baseHeight=115;a.viewBox=[-75,-132,150,146];a.design={proportionReference:'shared/assets/party/party.runtime.js v008',faceScale:.68,legLength:55,style:'Korean dark fantasy; adult anatomy'};
 return a;
}
export function matureSpirit(a){
 Object.assign(a.palette,{wood:'#514A37',woodLight:'#8B7A59',linen:'#B3AF94',linenShade:'#85856F',skin:'#A4B8AD',soul:'#92B5AD',glow:'#C0D1B4',light:'#687F83',cloth:'#40535E'});
 if(a.id!=='summon_lantern'){
  const head=a.parts.find(p=>p.id==='head');if(head){const [x,y]=head.pivot;transformParts(a,new Set(['head']),p=>[x+(p[0]-x)*.68,y+(p[1]-y)*.68],.8);}
  transformParts(a,null,([x,y])=>[x,y<=-70?y-20:y*90/70]);a.baseHeight=132;a.viewBox=[-80,-155,160,173];
 }
 return a;
}
