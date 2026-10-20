(function(G){'use strict';
// Front-facing material sculptures, in world units. These paths are cached by
// the common world tiles. They never author a playable edge or modify a solid.
const C=G.HONRO_CORE,A=G.HonroEnvironmentArt;
const paths=new Map(),path=d=>{if(!paths.has(d))paths.set(d,new Path2D(d));return paths.get(d);},poly=ps=>{const p=new Path2D();ps.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();return p;};
const DATA=G.HONRO_VECTOR_CAMPAIGN_PARTS;
function stoneColor(value,cave,deep){if(!/^#[0-9a-f]{6}$/i.test(value))return value;const rgb=[1,3,5].map(i=>parseInt(value.slice(i,i+2),16)),lum=rgb[0]*.26+rgb[1]*.58+rgb[2]*.16,target=cave?[lum*.53,lum*.62,lum*.68]:[lum*.57,lum*.63,lum*.57];return '#'+target.map((v,i)=>Math.round(v*(deep?.76:1)).toString(16).padStart(2,'0')).join('');}
function matrix(c,value){if(!value)return;for(const match of value.matchAll(/(translate|scale|rotate|matrix)\(([^)]+)\)/g)){const ns=match[2].trim().split(/[ ,]+/).map(Number);if(match[1]==='translate')c.translate(ns[0],ns[1]||0);else if(match[1]==='scale')c.scale(ns[0],ns[1]??ns[0]);else if(match[1]==='rotate')c.rotate(ns[0]*Math.PI/180);else c.transform(...ns);}}
function part(c,id,{x=0,y=0,sx=1,sy=sx,rotation=0,tone=0,cave=false,deep=false}={}){const source=DATA.parts[id];if(!source)return;const stone=/granite|rock|slab/.test(id),tint=v=>stone?stoneColor(v,cave,deep):v,paints={};
 const paint=(v,n)=>{if(!v?.startsWith('url('))return tint(v);const id=v.slice(5,-1),key=id+':'+n.bounds;if(paints[key])return paints[key];const def=DATA.gradients[id];if(!def)return '#3c524e';const percent=def.gradientUnits!=='userSpaceOnUse',box=n.bounds||[0,0,1,1],num=(name,fallback=0)=>{const value=def[name]??fallback;return parseFloat(value)/(String(value).includes('%')?100:1);};let g;
 if(def.type==='linearGradient'){const x=k=>percent?box[0]+num(k)*(box[2]-box[0]):num(k),y=k=>percent?box[1]+num(k)*(box[3]-box[1]):num(k);g=c.createLinearGradient(x('x1'),y('y1'),x('x2'),y('y2'));}
 else{c.save();if(percent){c.translate(box[0],box[1]);c.scale(Math.max(.01,box[2]-box[0]),Math.max(.01,box[3]-box[1]));}g=c.createRadialGradient(num('fx',def.cx),num('fy',def.cy),0,num('cx'),num('cy'),num('r',1));c.restore();}
 for(const s of def.stops){const offset=s.offset||'0';g.addColorStop(parseFloat(offset)/(offset.includes('%')?100:1),tint(s['stop-color'])+Math.round(Number(s['stop-opacity']??1)*255).toString(16).padStart(2,'0'));}return paints[key]=g;};
 const draw=(n,inherited={fill:'#000000',stroke:'none','stroke-width':1})=>{c.save();matrix(c,n.transform);c.globalAlpha*=Number(n.opacity??1);const style={...inherited,...n};if(n['clip-path']){const group=DATA.clips[n['clip-path'].slice(5,-1)];if(group){const clip=new Path2D();for(const p of group)if(p.d)clip.addPath(path(p.d));c.clip(clip);}}if(n.tag==='path'){if(style.fill!=='none'){c.fillStyle=paint(style.fill,n);c.fill(path(n.d));}if(style.stroke!=='none'){c.strokeStyle=paint(style.stroke,n);c.lineWidth=Number(style['stroke-width']);c.lineCap=style['stroke-linecap']||'round';c.lineJoin=style['stroke-linejoin']||'round';c.stroke(path(n.d));}}else for(const child of n.children||[])draw(child,style);c.restore();};
 c.save();c.translate(x,y);c.rotate(rotation);c.scale(sx,sy);draw(source);c.restore();}
// Artist-selected unequal exposures: each straddles neighbouring rock, soil
// and its contact shadow. Lower layers overlap; none has a rectangular foot.
const DEPOSITS=[
 [.01,1.15,1.0,180,0],[.13,.8,.95,480,2],[.28,1.1,1.25,245,1],[.43,.9,.91,630,3],[.58,1.22,1.08,160,0],[.76,1.06,1.16,445,2],[.93,1.2,1.08,180,1],
 [.03,1.60,1.11,1100,3],[.23,1.3,1.35,1300,1],[.46,1.48,1.10,1070,2],[.68,1.55,1.3,1400,0],[.92,1.61,1.21,1160,3],
 [-.05,2.1,1.38,2500,1],[.28,1.97,1.5,2730,2],[.62,2.3,1.37,2490,0],[.97,2.06,1.5,2850,3],
 [.12,2.8,1.73,4400,2],[.55,2.8,1.63,4620,0],[.94,2.8,1.8,4370,1],
];
const SOURCES=['granite-shoulder','entrance-granite','root-bank-rock','ridge-buried-slab'];
function makeSculptures(b,records){
 const floorRecords=[...records.values()].filter(r=>!r.t.oneWay&&!r.t.honroCeiling&&!r.t.honroQuestTarget&&!r.t.device&&!r.t.honroSeal&&r.t.h>450&&r.t.w>850&&['earth','rock'].includes(r.mat)&&!/^sb-bell/.test(r.t.id));
 const out=[];if(!floorRecords.length)return out;
 const at=x=>{const hits=floorRecords.filter(r=>x>=r.t.x&&x<=r.t.x+r.t.w).map(r=>({r,y:C.topAt(r.t,x,r.t.y)}));return hits.sort((a,z)=>z.r.t.w-a.r.t.w||a.y-z.y)[0];};
 const width=b.width,unit=Math.max(1.1,Math.min(2,width/3000)),sites=DEPOSITS,cave=['cave','ink'].includes(G.HonroEnvironmentVectorKit.STAGE_STYLES[b.honroStage].palette);
 for(const [i,[u,sw,sh,depth,variant]]of sites.entries()){
  const x=u*width,hit=at(x);if(!hit)continue;const sx=unit*sw,sy=unit*sh,y=hit.y+depth,deep=depth>1900;
  out.push({id:SOURCES[variant],x,y,sx,sy,deep,cave,rotation:[-.16,.12,-.26,.20,.06,-.12][i%6],bounds:{x:x-370*sx,y:y-370*sy,w:740*sx,h:740*sy}});
  // Two unequal adjoining fractures share the same body and bury the lower
  // edges of the rear stone. Their positions follow that deposit, not a grid.
  for(const [j,dx,dy,wx,hy,ang]of [[1,-.29,.27,.68,.84,-.32],[2,.31,.23,.75,.67,.19]])out.push({id:SOURCES[(variant+j)%4],x:x+sx*500*dx,y:y+sy*320*dy,sx:sx*wx,sy:sy*hy,cave,deep,rotation:ang+(i%2?-.14:.08),bounds:{x:x-700*sx,y:y-400*sy,w:1400*sx,h:900*sy}});
 }return out;
}
function historical(t,b){
 const n=b.honroStage;
 if(n<=10&&b.honroMap?.act1Scene)return{act:1,art:G.HonroAct1SpatialArt.prepareTerrain(t,b)};
 if(n<=20&&b.honroMap?.space)return{act:2,art:G.HonroAct2SpatialArt.prepareTerrain(t,b)};
 const authored=(b.honroMap?.space?.terrainPlanes||[]).filter(p=>p.terrainId===t.id&&p.points?.length>2).map(p=>({fill:p.fill,path:poly(p.points)}));return{act:3,art:{authoredPlanes:authored}};
}
function original(c,h){const q=h.art;c.save();
 if(h.act===1){for(const [i,p]of q.cliffPlanes.entries()){c.fillStyle=['#a2b4bb28','#081e294f','#82979f24','#0e27335c'][i];c.fill(p);}}
 // Retain local authored stone/masonry faces. Whole-domain washes and very
 // long stripes are deliberately replaced by the interlocking sculptures.
 for(const p of q.authoredPlanes||[]){if(p.broad)continue;c.fillStyle=p.fill;c.fill(p.path);}
 if(h.act===2){for(const row of q.masonry){c.fillStyle='#59675e';c.fill(row.body);c.fillStyle='#a6ad933f';c.fill(row.edge);}}
 c.restore();}
function sculptures(c,list,palette,view){for(const p of list){const z=p.bounds;if(z.x+z.w<view.x||z.x>view.x+view.w||z.y+z.h<view.y||z.y>view.y+view.h)continue;part(c,p.id,p);}}
function trees(c,b,scenery,view){for(const p of scenery){const anchor=b.honroMapAnchors?.[p.anchor]||{},x=p.x??anchor.x,t=b.terrain.find(t=>t.id===p.support&&!t.broken);if(!t||!Number.isFinite(x))continue;const y=Math.max(...[-220,0,150].map(dx=>C.topAt(t,x+dx,anchor.y??t.y)));if(x+1300<view.x||x-1300>view.x+view.w)continue;
 const main=p.assetId==='pine.landmark';part(c,main?'old-pine':'entrance-pine',{x:main?x-2040:x,y:main?y-2110:y,sx:main?1:p.scale||1});}}
function roots(c,b,style){for(const tree of style.scenery||[]){if(!/^pine\./.test(tree.assetId))continue;const a=b.honroMapAnchors?.[tree.anchor]||{},x=tree.x??a.x,t=b.terrain.find(t=>t.id===tree.support&&!t.broken);if(!t||!Number.isFinite(x))continue;const y=C.topAt(t,x,t.y),s=tree.assetId==='pine.landmark'?1:.5;
 c.save();c.translate(x,y);c.scale(s,s);const root=path('M-32-22C-92 23-108 82-175 132L-215 153Q-171 144-147 113C-112 99-75 78-56 75C-64 141-44 166-5 194L32 247 73 268Q39 229 23 190C-11 159-18 119-8 81C28 98 47 132 102 145L168 153 203 173Q176 145 131 133C79 128 58 100 34 55L26-17Z');c.fillStyle=A.gradient(c,-130,0,145,265,[[0,'#83735a'],[.36,'#5d5946'],[1,'#454c3c']]);c.fill(root);c.strokeStyle='#a1947280';c.lineWidth=4;c.stroke(path('M-17-4Q-71 53-147 113M-24 60Q-44 140 16 197L48 242M18 60Q69 120 130 139'));
 c.restore();}}
function rear(c,b,view){if(b.honroStage<=10&&b.honroMap?.act1Scene){const q=G.HonroAct1SpatialArt.prepareScene(b);for(const r of q.rocks){if(r.x+r.width<view.x||r.x-r.width>view.x+view.w)continue;c.save();c.fillStyle=A.gradient(c,0,r.y-r.height,0,r.y+100,[[0,'#455d63'],[.6,'#2d474f'],[1,'#263d44']]);c.fill(r.shape);c.clip(r.shape);r.faces.forEach((p,i)=>{c.fillStyle=['#94a6a241','#152f3b8c','#324d5355','#aab4a327'][i%4];c.fill(p);});c.restore();}for(const p of q.shelfNecks){c.fillStyle='#28434e';c.fill(p.body);c.fillStyle='#758f8a35';c.fill(p.face);}}}
G.HonroVectorCampaignMaterials={makeSculptures,historical,original,sculptures,rear,trees,part,roots};
})(globalThis);
