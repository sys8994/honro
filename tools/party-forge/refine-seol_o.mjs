// v013 Seol-o refinement (2026-11). Builds ON the existing angular, faceted
// v012 drawing instead of replacing it (the smooth full redraw was rejected:
// rounded, childish, fewer planes). Every edit stays in straight-edged facets:
//  - coat skirts lengthened to mid-shin like the sheet, with a cream slit lining
//  - extra fold/shade facets on torso, skirts and sleeves; cream cuff bands
//  - criss-crossed haengjeon cords over the shin wraps
//  - long red sash tail with a tassel, hanging home token cord
//  - quiver straps, visible arrow shafts; red tassel on the bow grip
// Rig, joints, head, hands, bowstring and the painted crown/sole are untouched.
const R=v=>Math.round(v*100)/100;
const poly=pts=>'M'+pts.map(([x,y])=>`${R(x)} ${R(y)}`).join(' L')+'Z';
const lineD=segs=>segs.map(s=>'M'+s.map(([x,y])=>`${R(x)} ${R(y)}`).join(' L')).join(' ');
function mapPath(d,fn){let i=0,x=0;return d.replace(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi,v=>{const n=+v;if(i++%2===0){x=n;return v;}const [,y]=fn(x,n);return String(R(y));});}
// bone frame helper: point at fraction t along A->B, offset s to the left normal
const along=(A,B)=>(t,s)=>{const dx=B[0]-A[0],dy=B[1]-A[1],L=Math.hypot(dx,dy);return [A[0]+dx*t+dy/L*s,A[1]+dy*t-dx/L*s];};

export function refineSeolO(a){
 if(a.character_id!=='seol_o')return;
 const pv=Object.fromEntries(a.rig.parts.map(p=>[p.id,p.pivot])),get=id=>a.paths.find(p=>p.id===id);
 Object.assign(a.palette,{pineDeep:'#26321f',pineFacet:'#4a5b45',cream:'#d4c8ad',creamShade:'#a89c82',cord:'#d2c5a6',sashRed:'#8d3d34',sashRedLight:'#ad5446',leatherDeep:'#2e241b'});
 const add=(id,part,d,fill,o={})=>a.paths.push({id,part,d,fill,detail:o.detail??0,...(o.ol?{stroke:'outline',strokeWidth:o.ol}:{})});
 const ink=(id,part,d,stroke,w=1.3,detail=1)=>a.paths.push({id,part,d,stroke,strokeWidth:w,detail});

 // ---- longer coat skirts (stretch only the part below the hip line) ----
 const stretch=(x,y)=>[x,y>292?y+(y-292)*0.85:y];
 for(const id of ['rear_coat_tail','front_coat_tail','front_coat_lining','rear_coat_fold','front_coat_fold','cloth_hems'])if(get(id))get(id).d=mapPath(get(id).d,stretch);
 // cream lining showing in the front slit, and skirt facets
 add('slit_lining','rear_cloth',poly([[236,286],[247,300],[252,384],[240,388]]),'cream',{ol:2});
 add('slit_lining_shade','rear_cloth',poly([[242,300],[247,304],[251,382],[246,384]]),'creamShade');
 add('front_skirt_facet','front_cloth',poly([[276,262],[290,300],[301,352],[288,356],[280,310]]),'pineFacet');
 add('front_skirt_deep','front_cloth',poly([[270,345],[300,356],[303,371],[270,377]]),'pineDeep');
 add('rear_skirt_facet','rear_cloth',poly([[214,262],[232,262],[206,360],[186,388],[196,330]]),'pineDeep');
 ink('skirt_folds','front_cloth',lineD([[[262,262],[272,318],[278,370]],[[284,284],[296,340]]]),'pineDeep',1.4);

 // ---- torso facets, collar seam, sleeve cuffs ----
 add('chest_facet','thorax',poly([[248,140],[272,118],[280,150],[270,190],[254,200]]),'pineFacet');
 add('flank_deep','thorax',poly([[262,196],[276,188],[279,228],[258,242]]),'pineDeep');
 ink('collar_seam','thorax',lineD([[[222,92],[242,120],[262,92]],[[248,134],[226,178]]]),'cream',1.6,0);
 for(const side of ['rear','front']){
  const sh=pv[side+'_upper_arm'],el=pv[side+'_forearm'],f=along(sh,el);
  add(side+'_cuff',side+'_upper_arm',poly([f(.96,side==='rear'?-20:15),f(1.08,side==='rear'?-21:16),f(1.1,side==='rear'?19:-21),f(.98,side==='rear'?18:-20)]),'cream',{ol:2});
  add(side+'_sleeve_facet',side+'_upper_arm',poly([f(.2,side==='rear'?6:-6),f(.85,side==='rear'?12:-12),f(.92,side==='rear'?2:-2),f(.3,0)]),'pineFacet');
 }

 // ---- haengjeon: criss-cross cords over the existing shin wraps ----
 for(const side of ['rear','front']){
  const k=pv[side+'_shin'],an=pv[side+'_foot'],f=along(k,an),segs=[];
  for(const t of [.36,.5,.64,.78])segs.push([f(t,-11),f(t+.12,11)],[f(t,11),f(t+.12,-11)]);
  ink(side+'_haengjeon',side+'_shin',lineD(segs),'cord',1.8,0);
  ink(side+'_wrap_top',side+'_shin',lineD([[f(.34,-13),f(.34,13)]]),'leatherDeep',2.6,0);
 }

 // ---- sash: long red tail, tassel; home token cord ----
 add('sash_tassel','ribbon',poly([[231,314],[241,318],[240,340],[227,337]]),'sashRed',{ol:1.6});
 ink('sash_tassel_lines','ribbon',lineD([[[231,322],[229,336]],[[235,322],[234,338]],[[239,322],[238,338]]]),'sashRedLight',1.1,1);
 ink('token_cord','prop_hip',lineD([[[225,246],[224,262]]]),'sashRed',1.6,0);

 // ---- quiver straps and arrow shafts; bow tassel ----
 add('quiver_bands','prop_back',poly([[158,118],[190,128],[189,136],[157,126]])+' '+poly([[153,186],[185,195],[184,203],[152,194]]),'leatherDeep');
 ink('arrow_shafts','prop_back',lineD([[[163,95],[158,64]],[[175,98],[171,56]],[[187,102],[183,64]]]),'cord',1.4,0);
 const [gx,gy]=a.rig.handSockets.front;
 ink('bow_tassel_cord','weapon',lineD([[[gx-2,gy+12],[gx-6,gy+30]]]),'sashRed',1.6,0);
 add('bow_tassel','weapon',poly([[gx-11,gy+30],[gx-1,gy+30],[gx,gy+48],[gx-12,gy+48]]),'sashRed',{ol:1.4});
 a.artRevision=13;
}
