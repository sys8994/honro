(function(G){'use strict';
// Front-facing material sculptures, in world units. These paths are cached by
// the common world tiles. They never author a playable edge or modify a solid.
const C=G.HONRO_CORE,A=G.HonroEnvironmentArt;
const paths=new Map(),path=d=>{if(!paths.has(d))paths.set(d,new Path2D(d));return paths.get(d);},poly=ps=>{const p=new Path2D();ps.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();return p;};
const DATA=G.HONRO_VECTOR_CAMPAIGN_PARTS;
function stoneColor(value,cave,deep){if(!/^#[0-9a-f]{6}$/i.test(value))return value;const rgb=[1,3,5].map(i=>parseInt(value.slice(i,i+2),16)),lum=rgb[0]*.26+rgb[1]*.58+rgb[2]*.16,target=cave?[lum*.53,lum*.62,lum*.68]:[lum*.57,lum*.63,lum*.57];return '#'+target.map((v,i)=>Math.round(v*(deep?.76:1)).toString(16).padStart(2,'0')).join('');}
function matrix(c,value){if(!value)return;for(const match of value.matchAll(/(translate|scale|rotate|matrix)\(([^)]+)\)/g)){const ns=match[2].trim().split(/[ ,]+/).map(Number);if(match[1]==='translate')c.translate(ns[0],ns[1]||0);else if(match[1]==='scale')c.scale(ns[0],ns[1]??ns[0]);else if(match[1]==='rotate')c.rotate(ns[0]*Math.PI/180);else c.transform(...ns);}}
function part(c,id,{x=0,y=0,sx=1,sy=sx,rotation=0,tone=0,cave=false,deep=false,elements=null}={}){const source=DATA.parts[id];if(!source)return;const stone=/granite|rock|slab/.test(id),quarry=/^ferry-/.test(id),tint=v=>{v=stone?stoneColor(v,cave,deep):v;if(quarry&&/^#[0-9a-f]{6}$/i.test(v)){const [r,g,b]=[1,3,5].map(i=>parseInt(v.slice(i,i+2),16));if(r<g&&g-b<25){const l=r*.3+g*.55+b*.15+13;v='#'+[l*1.025,l*1.015,l*.89].map(n=>Math.round(n).toString(16).padStart(2,'0')).join('');}}if(tone&&/^#[0-9a-f]{6}$/i.test(v))v='#'+[1,3,5].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(v.slice(i,i+2),16)*(1+tone)))).toString(16).padStart(2,'0')).join('');return v;},paints={};
 const paint=(v,n)=>{if(!v?.startsWith('url('))return tint(v);const id=v.slice(5,-1),key=id+':'+n.bounds;if(paints[key])return paints[key];const def=DATA.gradients[id];if(!def)return '#3c524e';const percent=def.gradientUnits!=='userSpaceOnUse',box=n.bounds||[0,0,1,1],num=(name,fallback=0)=>{const value=def[name]??fallback;return parseFloat(value)/(String(value).includes('%')?100:1);};let g;
 if(def.type==='linearGradient'){const x=k=>percent?box[0]+num(k)*(box[2]-box[0]):num(k),y=k=>percent?box[1]+num(k)*(box[3]-box[1]):num(k);g=c.createLinearGradient(x('x1'),y('y1'),x('x2'),y('y2'));}
 else{c.save();if(percent){c.translate(box[0],box[1]);c.scale(Math.max(.01,box[2]-box[0]),Math.max(.01,box[3]-box[1]));}g=c.createRadialGradient(num('fx',def.cx),num('fy',def.cy),0,num('cx'),num('cy'),num('r',1));c.restore();}
 for(const s of def.stops){const offset=s.offset||'0';g.addColorStop(parseFloat(offset)/(offset.includes('%')?100:1),tint(s['stop-color'])+Math.round(Number(s['stop-opacity']??1)*255).toString(16).padStart(2,'0'));}return paints[key]=g;};
 const draw=(n,inherited={fill:'#000000',stroke:'none','stroke-width':1})=>{c.save();matrix(c,n.transform);c.globalAlpha*=Number(n.opacity??1);const style={...inherited,...n};if(n['clip-path']){const group=DATA.clips[n['clip-path'].slice(5,-1)];if(group){const clip=new Path2D();for(const p of group)if(p.d)clip.addPath(path(p.d));c.clip(clip);}}if(n.tag==='path'){if(style.fill!=='none'){c.fillStyle=paint(style.fill,n);c.fill(path(n.d));}if(style.stroke!=='none'){c.strokeStyle=paint(style.stroke,n);c.lineWidth=Number(style['stroke-width']);c.lineCap=style['stroke-linecap']||'round';c.lineJoin=style['stroke-linejoin']||'round';c.stroke(path(n.d));}}else for(const child of n.children||[])draw(child,style);c.restore();};
 c.save();c.translate(x,y);c.rotate(rotation);c.scale(sx,sy);const selected=elements?{...source,children:[{...source.children[0],children:source.children[0].children.filter((_,i)=>elements.includes(i))}]}:source;draw(selected);c.restore();}
// Selected hand-authored forest materials retain their original local curve
// quality. Only their feet are re-grounded; the old study's terrain is not used.
const FOREST_ROCKS=[
 ['entrance-granite',640,490,1.55,1.6],['root-bank-rock',2010,550,.95,1.7],
 ['granite-shoulder',3070,405,1.8,1.8],['shoulder-lower-overlap',3540,1100,1.8,1.9],
 ['ridge-buried-slab',4515,470,1.3,1.7],['ridge-foreground',5320,1180,2.7,2.6],
 ['half-buried-left',1165,780,.9,.8],['lower-left',30,1590,2.1,1.6],
 ['lower-middle',2390,1730,2.4,1.5],['lower-right',4260,2100,2.2,1.4]
];
function makeSculptures(b,records){if(b.honroStage!==1||G.HonroStage1VectorFront)return[];const out=[];
 for(const [id,x,depth,sx,sy]of FOREST_ROCKS){const r=[...records.values()].find(r=>r.mat==='earth'&&x>=r.t.x&&x<=r.t.x+r.t.w);if(!r)continue;const y=C.topAt(r.t,x,r.t.y)+depth;out.push({id,x,y,sx,sy,deep:depth>1300,bounds:{x:x-290*sx,y:y-280*sy,w:590*sx,h:440*sy}});}return out;
}
function historical(t,b){
 const n=b.honroStage;
 if(n<=10&&b.honroMap?.act1Scene)return{act:1,art:G.HonroAct1SpatialArt.prepareTerrain(t,b)};
 if(n<=20&&b.honroMap?.space)return{act:2,art:{...G.HonroAct2SpatialArt.prepareTerrain(t,b),authoredPlanes:t.w>3500?[]:G.HonroAct2SpatialArt.prepareTerrain(t,b).authoredPlanes}};
 const authored=(b.honroMap?.space?.terrainPlanes||[]).filter(p=>p.terrainId===t.id&&p.points?.length>2).map(p=>({fill:p.fill,path:poly(p.points)}));return{act:3,art:{authoredPlanes:authored}};
}
function original(c,h){const q=h.art;c.save();
 if(h.act===1){for(const [i,p]of q.cliffPlanes.entries()){c.fillStyle=['#a2b4bb28','#081e294f','#82979f24','#0e27335c'][i];c.fill(p);}for(const p of q.planes){c.fillStyle='#a0a79820';c.fill(p.lit);c.fillStyle='#172d3446';c.fill(p.shadow);c.strokeStyle='#182d3650';c.lineWidth=4;c.stroke(p.contact);}}
 // Retain local authored stone/masonry faces. Whole-domain washes and very
 // long stripes are deliberately replaced by the interlocking sculptures.
 for(const p of q.authoredPlanes||[]){if(p.broad)continue;c.fillStyle=p.fill;c.fill(p.path);}
 if(h.act===2){for(const row of q.masonry){c.fillStyle='#59675e';c.fill(row.body);c.fillStyle='#a6ad933f';c.fill(row.edge);}}
 c.restore();}
function sculptures(c,list,palette,view){for(const p of list){const z=p.bounds;if(z.x+z.w<view.x||z.x>view.x+view.w||z.y+z.h<view.y||z.y>view.y+view.h)continue;part(c,p.id,{...p,tone:0});}}
function front(c,b,style,view){
 if(b.honroStage===1&&G.HonroStage1VectorFront){G.HonroStage1VectorFront.draw(c,b,view);return;}
 if(b.honroStage===3&&G.HonroStage3VectorFront){G.HonroStage3VectorFront.draw(c,b,view);return;}
 if([18,19].includes(b.honroStage)&&G.HonroStage18VectorFront){G.HonroStage18VectorFront.draw(c,b,view);return;}

 if(b.honroStage===1){part(c,'continuous-mountain',{y:180});part(c,'earthen-folds',{y:180});for(const id of ['root-gully-exposure','left-basal-exposure','mid-toe-bedrock','shoulder-gap-exposure'])part(c,id,{y:180});}
}
function trees(c,b,scenery,view){for(const p of scenery){const anchor=b.honroMapAnchors?.[p.anchor]||{},x=p.x??anchor.x,t=b.terrain.find(t=>t.id===p.support&&!t.broken);if(!t||!Number.isFinite(x))continue;const y=Math.max(...[-220,0,150].map(dx=>C.topAt(t,x+dx,anchor.y??t.y)));if(x+1300<view.x||x-1300>view.x+view.w)continue;
 const main=p.assetId==='pine.landmark';if(b.honroStage===1&&G.HonroForestPineArt){G.HonroForestPineArt.draw(c,{x,y:C.topAt(t,x,t.y),scale:main?1:(p.scale||1)*.6,variant:p.id,breakEast:main&&!!b.terrain.find(t=>t.id==='pine-branch-east'&&t.broken)});continue;}part(c,main?'old-pine':'entrance-pine',{x:main?x-2040:x,y:main?y-2110:y,sx:main?1:p.scale||1});}}
function roots(c,b,style){for(const tree of style.scenery||[]){if(!/^pine\./.test(tree.assetId))continue;const a=b.honroMapAnchors?.[tree.anchor]||{},x=tree.x??a.x,t=b.terrain.find(t=>t.id===tree.support&&!t.broken);if(!t||!Number.isFinite(x))continue;const y=C.topAt(t,x,t.y),s=tree.assetId==='pine.landmark'?1:.5;
 if(b.honroStage===1&&G.HonroForestPineArt){G.HonroForestPineArt.roots(c,b,t,x,y,tree.assetId==='pine.landmark'?1:(tree.scale||1)*.6);continue;}
 c.save();c.translate(x,y);c.scale(s,s);const root=path('M-32-22C-92 23-108 82-175 132L-215 153Q-171 144-147 113C-112 99-75 78-56 75C-64 141-44 166-5 194L32 247 73 268Q39 229 23 190C-11 159-18 119-8 81C28 98 47 132 102 145L168 153 203 173Q176 145 131 133C79 128 58 100 34 55L26-17Z');c.fillStyle=A.gradient(c,-130,0,145,265,[[0,'#83735a'],[.36,'#5d5946'],[1,'#454c3c']]);c.fill(root);c.strokeStyle='#a1947280';c.lineWidth=4;c.stroke(path('M-17-4Q-71 53-147 113M-24 60Q-44 140 16 197L48 242M18 60Q69 120 130 139'));
 c.restore();}}
function rear(c,b,view){if(b.honroStage<=10&&b.honroMap?.act1Scene){const q=G.HonroAct1SpatialArt.prepareScene(b);for(const r of q.rocks){if(r.x+r.width<view.x||r.x-r.width>view.x+view.w)continue;c.save();c.fillStyle=A.gradient(c,0,r.y-r.height,0,r.y+100,[[0,'#455d63'],[.6,'#2d474f'],[1,'#263d44']]);c.fill(r.shape);c.clip(r.shape);r.faces.forEach((p,i)=>{c.fillStyle=['#94a6a241','#152f3b8c','#324d5355','#aab4a327'][i%4];c.fill(p);});c.restore();}for(const p of q.shelfNecks){c.fillStyle='#28434e';c.fill(p.body);c.fillStyle='#758f8a35';c.fill(p.face);}}}
G.HonroVectorCampaignMaterials={makeSculptures,historical,original,sculptures,rear,trees,part,roots,front};
})(globalThis);
