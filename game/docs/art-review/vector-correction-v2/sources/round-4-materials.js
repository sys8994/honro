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
// Fracture ribbons are arranged as interlocking, oblique stone shoulders.
// Each ribbon has a different joint pattern and several middle-scale plates.
// The dark interstices are the underlying mountain, never a blank decal field.
const PLATES=[
 [[-50,82],[-55,15],[-31,-19],[-22,-78],[5,-102],[33,-84],[39,-47],[25,-8],[45,34],[28,76],[-8,91]],
 [[-57,61],[-47,-8],[-22,-42],[-29,-79],[12,-106],[42,-88],[53,-37],[25,1],[31,49],[6,83],[-26,77]],
 [[-67,44],[-53,-28],[-18,-55],[-7,-98],[34,-91],[52,-49],[43,-2],[64,34],[33,70],[-11,84],[-43,67]],
 [[-42,89],[-63,29],[-46,-21],[-20,-31],[-28,-80],[5,-102],[31,-76],[35,-36],[24,10],[51,45],[24,87]],
 [[-72,49],[-61,-9],[-35,-27],[-22,-73],[8,-88],[43,-75],[65,-31],[47,11],[72,40],[49,79],[11,72],[-22,90],[-49,74]],
 [[-51,76],[-61,18],[-44,-17],[-29,-68],[8,-103],[34,-84],[38,-52],[27,-13],[47,27],[32,66],[8,84],[-26,83]],
 [[-70,23],[-48,-35],[-15,-40],[6,-81],[40,-74],[63,-37],[57,4],[75,30],[47,62],[6,74],[-23,58],[-55,65]],
 [[-41,88],[-62,31],[-41,-17],[-43,-54],[-17,-92],[12,-107],[40,-83],[48,-43],[26,-8],[43,34],[19,80],[-7,93]],
];
function softened(points){const p=new Path2D(),cuts=points.map((v,i)=>{const a=points[(i+points.length-1)%points.length],z=points[(i+1)%points.length],f=.075;return{v,a:[v[0]+(a[0]-v[0])*f,v[1]+(a[1]-v[1])*f],z:[v[0]+(z[0]-v[0])*f,v[1]+(z[1]-v[1])*f]};});p.moveTo(...cuts[0].z);for(let i=1;i<=cuts.length;i++){const q=cuts[i%cuts.length];p.lineTo(...q.a);p.quadraticCurveTo(...q.v,...q.z);}p.closePath();return p;}
const slabs=PLATES.map((points,i)=>({body:softened(points),light:path('M-76-110H30L17-72 24-43 7-11 13 15-9 49-17 94H-80Z'),side:path('M24-112H85V100H2L20 59 10 37 29-4 18-32 36-69Z'),top:poly([points[2],points[3],points[4],points[5],[points[5][0]-7,points[5][1]+8],[points[4][0]-5,points[4][1]+7],[points[3][0]-1,points[3][1]+9],[points[2][0]-4,points[2][1]+8]]),cleft:path(i%2?'M-7-49L-15-18-9 8-21 39-24 64':'M6-58L-3-27 3-5-13 26-7 55'),chip:path('M-38 24L-24 19-9 27-16 35-33 34Z')}));
// Different authored relationships: upright split buttress, broad bedding,
// and broken talus. Local positions are in the parent shoulder's own axes.
const JOINTS=[
 [[-410,-50,1.42,1.62,-.14],[-246,-102,1.12,1.9,.13],[-85,-111,1.33,1.83,-.19],[92,-64,1.10,1.66,.19],[251,-22,1.53,1.87,-.12],[426,51,1.27,1.45,.22],[-491,153,1.0,1.25,-.31],[-350,164,1.34,1.54,.21],[-180,121,1.3,1.73,-.29],[-11,115,1.25,1.65,.1],[159,148,1.34,1.59,-.17],[323,187,1.45,1.35,.26],[-300,312,1.6,1.19,-.27],[-93,298,1.48,1.22,.23],[108,308,1.57,1.09,-.22],[303,336,1.37,1.1,.18]],
 [[-421,10,1.73,1.16,-.41],[-195,-80,1.68,1.37,-.31],[22,-76,1.84,1.28,-.39],[254,-12,1.51,1.2,-.14],[420,57,1.35,1.2,.19],[-464,195,1.33,1.19,-.29],[-287,121,1.49,1.25,-.35],[-87,154,1.68,1.41,-.25],[149,153,1.65,1.33,-.30],[353,224,1.37,1.21,.22],[-322,319,1.64,1.15,-.28],[-99,341,1.50,1.03,-.22],[93,317,1.5,1.09,-.32],[299,361,1.61,1.14,-.20]],
 [[-403,-1,1.22,1.7,.31],[-224,-77,1.47,1.61,-.14],[-27,-87,1.14,1.93,.11],[159,-44,1.40,1.49,-.29],[347,62,1.26,1.59,.17],[-489,181,1.42,1.29,-.26],[-300,148,1.23,1.5,.23],[-113,177,1.7,1.3,-.28],[110,174,1.58,1.44,.16],[320,253,1.64,1.22,-.31],[-333,331,1.82,1.04,-.23],[-91,349,1.69,1.18,.28],[149,360,1.77,1.12,-.18]],
];
function makeSculptures(b,records){
 const floorRecords=[...records.values()].filter(r=>!r.t.oneWay&&!r.t.honroCeiling&&!r.t.honroQuestTarget&&!r.t.device&&!r.t.honroSeal&&r.t.h>450&&r.t.w>850&&['earth','rock'].includes(r.mat)&&!/^sb-bell/.test(r.t.id));
 const out=[];if(!floorRecords.length)return out;
 const at=x=>{const hits=floorRecords.filter(r=>x>=r.t.x&&x<=r.t.x+r.t.w).map(r=>({r,y:C.topAt(r.t,x,r.t.y)}));return hits.sort((a,z)=>z.r.t.w-a.r.t.w||a.y-z.y)[0];};
 const widths=[1.09,.94,1.24,1.02,1.18,.89,1.21],heights=[1.02,1.14,.91,1.19,.96,1.11],offsets=[0,107,-65,172,-37,80,-109],unit=b.width>10000?1.40:1.20;
 let index=0;for(const [row,depth]of [85,630,1240,1980,2910,4120,5560].entries()){
  const pitch=850*unit*(row>3?1.35:1),start=-760+(row%2?390:0);for(let x=start;x<b.width+1200;x+=pitch){const hit=at(x);if(!hit)continue;const deep=row>3,sx=unit*widths[(index+row)%widths.length]*(deep?1.36:1),sy=unit*heights[(index+row*2)%heights.length]*(deep?1.36:1),y=hit.y+depth+offsets[(index+row)%offsets.length];
   out.push({x,y,sx,sy,variant:(index+row)%3,deep,bounds:{x:x-700*sx,y:y-350*sy,w:1400*sx,h:950*sy}});index++;
  }
 }return out;
}
function historical(t,b){
 const n=b.honroStage;
 if(n<=10&&b.honroMap?.act1Scene)return{act:1,art:G.HonroAct1SpatialArt.prepareTerrain(t,b)};
 if(n<=20&&b.honroMap?.space)return{act:2,art:{...G.HonroAct2SpatialArt.prepareTerrain(t,b),authoredPlanes:t.w>3500?[]:G.HonroAct2SpatialArt.prepareTerrain(t,b).authoredPlanes}};
 const authored=(b.honroMap?.space?.terrainPlanes||[]).filter(p=>p.terrainId===t.id&&p.points?.length>2).map(p=>({fill:p.fill,path:poly(p.points)}));return{act:3,art:{authoredPlanes:authored}};
}
function original(c,h){const q=h.art;c.save();
 if(h.act===1){for(const [i,p]of q.cliffPlanes.entries()){c.fillStyle=['#a2b4bb28','#081e294f','#82979f24','#0e27335c'][i];c.fill(p);}}
 // Retain local authored stone/masonry faces. Whole-domain washes and very
 // long stripes are deliberately replaced by the interlocking sculptures.
 for(const p of q.authoredPlanes||[]){if(p.broad)continue;c.fillStyle=p.fill;c.fill(p.path);}
 if(h.act===2){for(const row of q.masonry){c.fillStyle='#59675e';c.fill(row.body);c.fillStyle='#a6ad933f';c.fill(row.edge);}}
 c.restore();}
function sculptures(c,list,palette,view){const cave=['cave','ink'].includes(palette);for(const p of list){const z=p.bounds;if(z.x+z.w<view.x||z.x>view.x+view.w||z.y+z.h<view.y||z.y>view.y+view.h)continue;c.save();c.translate(p.x,p.y);c.scale(p.sx,p.sy);
 for(const [i,[x,y,sx,sy,angle]]of JOINTS[p.variant].entries()){const slab=slabs[(i*3+p.variant*2)%slabs.length],tones=cave?['#34434b','#2a3943','#394950','#30434a']:['#41493f','#38443c','#495047','#35433d'],base=tones[(i+p.variant)%tones.length],light=cave?'#72817f':'#87917c',shade=cave?'#172b36':'#21372f';c.save();c.translate(x,y);c.rotate(angle);c.scale(sx,sy);c.fillStyle='#11232ada';c.fill(slab.body);c.translate(-3,-3);c.fillStyle=A.gradient(c,-54,-87,47,85,[[0,G.HonroEnvironment.mixColor(base,light,p.deep?.12:.29)],[.48,base],[1,G.HonroEnvironment.mixColor(base,shade,.35)]]);c.fill(slab.body);c.clip(slab.body);
 c.fillStyle=light+(p.deep?'12':'28');c.fill(slab.light);c.fillStyle=shade+'64';c.fill(slab.side);c.fillStyle=light+(p.deep?'1a':'4a');c.fill(slab.top);
 if(i%3!==1){c.strokeStyle=shade+'9c';c.lineWidth=2.1;c.stroke(slab.cleft);c.save();c.translate(-2,0);c.strokeStyle=light+'35';c.lineWidth=.8;c.stroke(slab.cleft);c.restore();}if(i%4===0){c.fillStyle=shade+'85';c.fill(slab.chip);}c.restore();}
 c.restore();}}
function trees(c,b,scenery,view){for(const p of scenery){const anchor=b.honroMapAnchors?.[p.anchor]||{},x=p.x??anchor.x,t=b.terrain.find(t=>t.id===p.support&&!t.broken);if(!t||!Number.isFinite(x))continue;const y=Math.max(...[-220,0,150].map(dx=>C.topAt(t,x+dx,anchor.y??t.y)));if(x+1300<view.x||x-1300>view.x+view.w)continue;
 const main=p.assetId==='pine.landmark';part(c,main?'old-pine':'entrance-pine',{x:main?x-2040:x,y:main?y-2110:y,sx:main?1:p.scale||1});}}
function roots(c,b,style){for(const tree of style.scenery||[]){if(!/^pine\./.test(tree.assetId))continue;const a=b.honroMapAnchors?.[tree.anchor]||{},x=tree.x??a.x,t=b.terrain.find(t=>t.id===tree.support&&!t.broken);if(!t||!Number.isFinite(x))continue;const y=C.topAt(t,x,t.y),s=tree.assetId==='pine.landmark'?1:.5;
 c.save();c.translate(x,y);c.scale(s,s);const root=path('M-32-22C-92 23-108 82-175 132L-215 153Q-171 144-147 113C-112 99-75 78-56 75C-64 141-44 166-5 194L32 247 73 268Q39 229 23 190C-11 159-18 119-8 81C28 98 47 132 102 145L168 153 203 173Q176 145 131 133C79 128 58 100 34 55L26-17Z');c.fillStyle=A.gradient(c,-130,0,145,265,[[0,'#83735a'],[.36,'#5d5946'],[1,'#454c3c']]);c.fill(root);c.strokeStyle='#a1947280';c.lineWidth=4;c.stroke(path('M-17-4Q-71 53-147 113M-24 60Q-44 140 16 197L48 242M18 60Q69 120 130 139'));
 c.restore();}}
function rear(c,b,view){if(b.honroStage<=10&&b.honroMap?.act1Scene){const q=G.HonroAct1SpatialArt.prepareScene(b);for(const r of q.rocks){if(r.x+r.width<view.x||r.x-r.width>view.x+view.w)continue;c.save();c.fillStyle=A.gradient(c,0,r.y-r.height,0,r.y+100,[[0,'#455d63'],[.6,'#2d474f'],[1,'#263d44']]);c.fill(r.shape);c.clip(r.shape);r.faces.forEach((p,i)=>{c.fillStyle=['#94a6a241','#152f3b8c','#324d5355','#aab4a327'][i%4];c.fill(p);});c.restore();}for(const p of q.shelfNecks){c.fillStyle='#28434e';c.fill(p.body);c.fillStyle='#758f8a35';c.fill(p.face);}}}
G.HonroVectorCampaignMaterials={makeSculptures,historical,original,sculptures,rear,trees,part,roots};
})(globalThis);
