import assert from 'node:assert/strict';
import vm from 'node:vm';import {readFileSync} from 'node:fs';
class Scene{render(){}}
const G={HonroScene:Scene,HonroCamera:{followY:(u,h,z)=>u.y-Math.min(u.h*2,h*.28/z)},HonroAttackCamera:{blocksFocus:s=>!!s.manual},HonroPartyPresentationHeight:u=>u.h};
G.globalThis=G;vm.runInNewContext(readFileSync('shared/runtime/stage6-descent-view-preview.js','utf8'),G);const V=G.HonroStage6DescentView;
const hero={id:'p-archer',side:0,x:4800,y:3045,h:92,r:22,hp:236},foes=[{id:'deer',side:1,x:4570,y:3129,h:144,r:32,hp:243},{id:'boar',side:1,x:4930,y:2980,h:144,r:34,hp:243}],b={mode:'campaign',honroStage:6,honroCanonical:true,honroCustom:false,honroCampaignMapRevision:4,units:[hero,...foes]},e={b,active:hero,grounded:()=>true,contactSurface:()=>({t:{id:'lower-road'}})};
const original=JSON.stringify(b),results=[];
for(const [w,h] of [[1440,769],[390,648],[844,276]]){const q=V.frame([hero,...foes],hero,w,h,.94,{top:72,bottom:h-14,left:18,right:w-18,selected:hero}),a=q.bounds,p={left:w/2+(a.left-q.x)*q.scale,right:w/2+(a.right-q.x)*q.scale,top:h/2+(a.top-q.y)*q.scale,bottom:h/2+(a.bottom-q.y)*q.scale};assert(p.left>=17.99&&p.right<=w-17.99&&p.top>=71.99&&p.bottom<=h-13.99,JSON.stringify({w,h,p,q}));results.push({w,h,scale:q.scale,p});}
const s={x:4700,y:2800,scale:.94,manual:false,_cameraHeader:{bottom:50}};assert(V.follow(s,e,844,276,1/60));assert.equal(JSON.stringify(b),original);
s.manual=true;const before=JSON.stringify(s);assert.equal(V.follow(s,e,844,276,1/60),null);assert.equal(JSON.stringify(s),before);
e.b={...b,honroStage:7};s.manual=false;assert.equal(V.follow(s,e,844,276,1/60),null);assert.equal(V.active({...b,honroCampaignMapRevision:3}),false);assert.equal(V.active({...b,honroCustom:true}),false);
console.log(JSON.stringify({status:'pass',scope:'Pure presentation framing and stage/manual guards; not browser readability',results}));
