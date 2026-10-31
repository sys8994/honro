// v013 Seol-o body redraw (2026-11). Head, neck, hair tail, rig pivots, pose
// targets, hand sockets and the bowstring tips are untouched; every body/costume/
// prop path is re-authored to the 260916 sheet: broad shoulders, wide-sleeved
// pine jeogori coat to below the knee over a cream under-robe, dark leather
// bracers and gloves, wide charcoal baji gathered into criss-crossed haengjeon
// wraps, soft leather boots, wide sash with red ties and tassel, long leather
// quiver, and a reflex gakgung. Shapes are authored in bone-local terms (t along
// the bone, signed half widths) so they follow the existing joints exactly.
const R=v=>Math.round(v*100)/100;
const P=(x,y)=>`${R(x)} ${R(y)}`;
// smooth closed outline through points (Catmull-Rom -> quadratic via midpoints)
function smooth(pts,{closed=true,sharp=new Set()}={}){
 const n=pts.length,mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
 let d=`M${P(...mid(pts[n-1],pts[0]))}`;
 for(let i=0;i<n;i++){const p=pts[i],q=pts[(i+1)%n];
  if(sharp.has(i))d+=` L${P(...p)} L${P(...mid(p,q))}`;else d+=` Q${P(...p)} ${P(...mid(p,q))}`;}
 return d+'Z';
}
const poly=pts=>'M'+pts.map(p=>P(...p)).join(' L')+'Z';
// bone frame: A->B; point at (t along, s across; +s = to the bone's left normal)
function frame(A,B){const dx=B[0]-A[0],dy=B[1]-A[1],L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,nx=uy,ny=-ux;
 return (t,s)=>[A[0]+dx*t+nx*s,A[1]+dy*t+ny*s];}
// tube along a bone from a width profile [[t, left, right], ...]
function tube(A,B,prof,opts){const f=frame(A,B);return smooth([...prof.map(([t,l])=>f(t,l)),...[...prof].reverse().map(([t,,r])=>f(t,-r))],opts);}
function strip(A,B,prof){const f=frame(A,B);return poly([...prof.map(([t,l])=>f(t,l)),...[...prof].reverse().map(([t,,r])=>f(t,-r))]);}
function lines(A,B,segs){const f=frame(A,B);return segs.map(s=>'M'+s.map(([t,o])=>P(...f(t,o))).join(' L')).join(' ');}

export function redrawSeolO(a){
 if(a.character_id!=='seol_o')return;
 const pv=Object.fromEntries(a.rig.parts.map(p=>[p.id,p.pivot]));
 const keep=new Set(['head','neck','hair_tail']);
 a.paths=a.paths.filter(p=>keep.has(p.part));
 Object.assign(a.palette,{
  pine:'#3b4c3a',pineLight:'#5b6e52',pineDeep:'#26321f',lining:'#d7cbb0',liningShade:'#a99d84',
  baji:'#33312d',bajiLight:'#4b4840',bajiDeep:'#211f1c',leather:'#4a3828',leatherLight:'#6e553d',leatherDeep:'#2b2119',
  sash:'#2b2622',red:'#8d3d34',redLight:'#b0564a',cord:'#cdbf9f',wood:'#6a4f36',woodLight:'#94704b',horn:'#3a2c22',glove:'#3a2b21'
 });
 const add=(id,part,d,fill,o={})=>a.paths.push({id,part,d,fill,detail:o.detail??0,...(o.stroke?{stroke:o.stroke,strokeWidth:o.w||1.2}:{})});
 const ink=(id,part,d,stroke,w=1.2,detail=1)=>a.paths.push({id,part,d,stroke,strokeWidth:w,detail});
 const OL={stroke:'outline',w:3};

 // ---------------- legs: wide baji, haengjeon wraps, soft boots ----------------
 for(const side of ['rear','front']){
  const hip=side==='rear'?[221.1,245.4]:[256.38,245.4],knee=pv[side+'_shin'],ankle=pv[side+'_foot'],front=side==='front';
  // thigh: generous baji, fullest just above the knee
  add(side+'_baji',side+'_thigh',tube(hip,knee,[[-.06,19,19],[.35,22,23],[.75,25,25],[1.08,23,22]]),'baji',OL);
  add(side+'_baji_light',side+'_thigh',tube(hip,knee,[[.05,16,-6],[.4,19,-8],[.8,21,-9],[1.0,18,-10]]),'bajiLight');
  ink(side+'_baji_folds',side+'_thigh',lines(hip,knee,[[[.3,6],[.62,10],[.92,4]],[[.5,-8],[.85,-12]]]),'bajiDeep',1.4);
  // shin: balloon spills over the wrap top, then the gathered haengjeon to the ankle
  add(side+'_baji_low',side+'_shin',tube(knee,ankle,[[-.08,23,22],[.12,28,27],[.27,25,24],[.36,14,13]]),'baji',OL);
  add(side+'_baji_low_light',side+'_shin',strip(knee,ankle,[[.0,20,-6],[.14,24,-7],[.28,21,-6]]),'bajiLight');
  ink(side+'_baji_low_fold',side+'_shin',lines(knee,ankle,[[[.06,-8],[.2,-14],[.32,-8]],[[.1,6],[.26,10]]]),'bajiDeep',1.4);
  add(side+'_wrap',side+'_shin',tube(knee,ankle,[[.33,13,12.5],[.58,11.5,11],[.85,10.5,10],[1.04,10,9.5]]),'leather',OL);
  add(side+'_wrap_light',side+'_shin',strip(knee,ankle,[[.36,11.5,-3],[.62,10,-3],[1.0,9,-3]]),'leatherLight');
  ink(side+'_wrap_cord',side+'_shin',lines(knee,ankle,[[[.4,-12],[.52,12]],[[.52,-12],[.4,12]],[[.6,-11],[.72,11]],[[.72,-11],[.6,11]],[[.8,-10],[.92,10]],[[.92,-10],[.8,10]]]),'cord',1.6,0);
  // boot: soft leather, toe forward (+x), sole on the ground (y 479)
  const [ax,ay]=ankle,toe=front?34:30;
  add(side+'_boot',side+'_foot',smooth([[ax-11,ay-6],[ax+9,ay-7],[ax+14,ay+4],[ax+toe-4,ay+11],[ax+toe+2,ay+17],[ax+toe,ay+20],[ax-15,ay+20],[ax-14,ay+8]],{sharp:new Set([5,6])}),'leatherDeep',OL);
  add(side+'_boot_light',side+'_foot',smooth([[ax-8,ay-4],[ax+6,ay-5],[ax+10,ay+4],[ax+toe-6,ay+11],[ax+2,ay+11],[ax-8,ay+6]]),'leather');
  add(side+'_sole',side+'_foot',poly([[ax-15,ay+17],[ax+toe+1,ay+17],[ax+toe,ay+20.5],[ax-15,ay+20.5]]),'horn');
 }

 // ---------------- coat tails and under-robe (below the knee, side slit) ----------------
 add('rear_coat_tail','rear_cloth',smooth([[203,238],[236,240],[238,320],[233,372],[196,376],[186,368],[192,310]],{sharp:new Set([3,4])}),'pine',OL);
 add('rear_coat_shade','rear_cloth',smooth([[214,250],[234,252],[234,320],[230,368],[214,370],[218,310]]),'pineDeep');
 add('under_robe','front_cloth',smooth([[228,244],[262,244],[268,310],[265,350],[234,353],[230,310]],{sharp:new Set([3,4])}),'lining',OL);
 add('under_robe_shade','front_cloth',smooth([[250,250],[262,250],[267,310],[263,348],[252,350],[254,310]]),'liningShade');
 add('front_coat_tail','front_cloth',smooth([[246,240],[279,242],[288,296],[304,366],[300,377],[262,382],[258,320]],{sharp:new Set([3,4,5])}),'pine',OL);
 add('front_coat_light','front_cloth',smooth([[250,252],[262,252],[266,320],[268,372],[262,378],[258,320]]),'pineLight');
 add('front_coat_hem','front_cloth',poly([[262,376],[300,371],[304,366],[301,377],[262,383]]),'pineDeep');
 ink('front_coat_folds','front_cloth','M276 268 Q283 310 292 360 M268 290 Q271 330 275 372','pineDeep',1.5);

 // ---------------- torso: broad jeogori coat with crossed collar ----------------
 add('torso','thorax',smooth([[194,116],[222,100],[258,100],[287,116],[283,170],[276,212],[274,252],[208,252],[205,205],[199,160]],{sharp:new Set([0,3])}),'pine',OL);
 add('torso_light','thorax',smooth([[198,120],[222,104],[236,108],[226,160],[214,214],[210,248],[206,200],[201,160]]),'pineLight');
 add('torso_shade','thorax',smooth([[270,140],[284,124],[281,175],[275,215],[273,250],[262,250],[266,200]]),'pineDeep');
 add('inner_collar','thorax',poly([[229,100],[252,100],[246,128],[240,140],[234,128]]),'lining');
 add('collar_band','thorax',poly([[252,100],[262,103],[234,176],[222,206],[214,206],[226,170]]),'pineDeep');
 add('collar_edge_l','thorax',poly([[226,101],[232,100],[241,126],[236,134]]),'liningShade');
 add('quiver_strap','thorax',poly([[266,106],[276,112],[226,246],[216,242]]),'leather');
 add('strap_buckle','thorax',poly([[241,170],[255,174],[251,190],[237,186]]),'leatherLight');
 add('buckle_inset','thorax',poly([[244,175],[251,177],[249,185],[242,183]]),'leatherDeep');
 ink('chest_folds','thorax','M214 170 Q222 196 218 222 M262 150 Q266 176 262 200','pineDeep',1.4);

 // ---------------- sash: wide dark band, red ties, hanging tails ----------------
 add('waist','belt',smooth([[205,234],[240,238],[277,233],[278,256],[240,262],[204,256]],{sharp:new Set([0,2,3,5])}),'sash',OL);
 add('sash_red','belt',poly([[205,243],[240,247],[278,242],[278,250],[240,255],[205,251]]),'red');
 add('sash_red_light','belt',poly([[205,243],[240,247],[262,245],[262,248],[240,250],[205,247]]),'redLight');
 add('belt_knot','belt',smooth([[244,240],[258,238],[264,250],[256,262],[244,260],[240,250]]),'red',OL);
 add('sash_tail_a','ribbon',smooth([[247,256],[257,258],[252,300],[246,334],[238,334],[244,298]],{sharp:new Set([2,3,4])}),'red',OL);
 add('sash_tail_b','ribbon',smooth([[254,258],[262,256],[268,292],[266,318],[259,318],[258,292]],{sharp:new Set([3,4])}),'redLight');
 add('tassel','ribbon',poly([[239,332],[247,332],[249,350],[237,350]]),'red');
 ink('tassel_cord','ribbon','M243 334 L243 350 M240 336 L239 349 M246 336 L247 349','redLight',1.2,1);

 // ---------------- arms: wide sleeves, cream under-sleeve, long bracers, gloves ----------------
 for(const side of ['rear','front']){
  const sh=pv[side+'_upper_arm'],el=pv[side+'_forearm'],wr=pv[side+'_hand'];
  add(side+'_sleeve',side+'_upper_arm',tube(sh,el,[[-.1,15,15],[.3,19,18],[.7,25,22],[1.1,29,22],[1.16,29,21]],{sharp:new Set([3,4,5,6])}),'pine',OL);
  add(side+'_sleeve_light',side+'_upper_arm',tube(sh,el,[[.0,12,-4],[.4,15,-5],[.85,18,-6],[1.08,19,-7]]),'pineLight');
  add(side+'_sleeve_hem',side+'_upper_arm',strip(sh,el,[[1.06,28,21],[1.15,28,20]]),'pineDeep');
  ink(side+'_sleeve_folds',side+'_upper_arm',lines(sh,el,[[[.35,-6],[.7,-10],[1.0,-12]],[[.55,6],[.9,9]]]),'pineDeep',1.4);
  // cream under-sleeve gathered into the bracer
  add(side+'_undersleeve',side+'_forearm',tube(el,wr,[[-.05,13,13],[.12,15,15],[.3,12,12]]),'lining',OL);
  add(side+'_undersleeve_shade',side+'_forearm',strip(el,wr,[[.0,-4,13],[.28,-4,11]]),'liningShade');
  add(side+'_bracer',side+'_forearm',tube(el,wr,[[.26,11.5,11.5],[.6,10.5,10.5],[.98,9.5,9.5],[1.06,9,9]]),'leatherDeep',OL);
  add(side+'_bracer_light',side+'_forearm',strip(el,wr,[[.3,9.5,-2],[.95,8,-2]]),'leather');
  ink(side+'_bracer_lace',side+'_forearm',lines(el,wr,[[[.36,-8],[.48,8]],[[.48,-8],[.36,8]],[[.6,-7.5],[.72,7.5]],[[.72,-7.5],[.6,7.5]],[[.84,-7],[.95,7]]]),'cord',1.3,0);
 }
 // gloved hands (dark leather back, skin fingertips) around the hand pivots
 {
  const [x,y]=pv.rear_hand;
  add('rear_glove','rear_hand',smooth([[x-10,y-7],[x+7,y-8],[x+11,y+2],[x+10,y+14],[x+3,y+22],[x-7,y+21],[x-12,y+10]]),'glove',OL);
  add('rear_fingers','rear_hand',smooth([[x-6,y+14],[x+8,y+12],[x+7,y+22],[x+2,y+26],[x-6,y+24]]),'skin');
  ink('rear_finger_lines','rear_hand',`M${x-3} ${y+16} L${x-3} ${y+24} M${x+1} ${y+15} L${x+1} ${y+25} M${x+5} ${y+14} L${x+5} ${y+23}`,'skinShade',1,1);
  add('rear_thumb','rear_hand',smooth([[x+6,y-2],[x+13,y+2],[x+12,y+10],[x+7,y+8]]),'glove');
 }
 {
  const [x,y]=pv.front_hand;
  add('front_glove','front_hand',smooth([[x-11,y-6],[x+6,y-9],[x+12,y],[x+11,y+14],[x+2,y+19],[x-9,y+16],[x-13,y+6]]),'glove',OL);
  add('front_fingers','front_hand',smooth([[x-2,y-6],[x+9,y-6],[x+11,y+12],[x+4,y+16],[x-2,y+12]]),'skin');
  ink('front_finger_lines','front_hand',`M${x+1} ${y-2} L${x+9} ${y-2} M${x+1} ${y+3} L${x+10} ${y+3} M${x+1} ${y+8} L${x+10} ${y+8}`,'skinShade',1,1);
  add('front_thumb','front_hand',smooth([[x-6,y-9],[x+2,y-11],[x+6,y-6],[x-2,y-3]]),'glove');
 }

 // ---------------- quiver (long leather, arrows) and hip token ----------------
 add('quiver_body','prop_back',smooth([[184,96],[204,100],[196,236],[178,232]],{sharp:new Set([0,1,2,3])}),'leatherDeep',OL);
 add('quiver_light','prop_back',poly([[186,100],[193,101],[184,232],[179,231]]),'leather');
 add('quiver_bands','prop_back',poly([[185,120],[203,124],[202,132],[184,128]])+' '+poly([[181,200],[198,204],[197,212],[180,208]]),'leatherLight');
 add('arrow_shafts','prop_back',poly([[188,96],[190,60],[192,60],[190,97]])+' '+poly([[194,97],[198,56],[200,56],[196,98]])+' '+poly([[199,98],[205,62],[207,62],[201,99]]),'woodLight');
 add('fletch','prop_back',smooth([[186,64],[190,44],[194,64]])+' '+smooth([[194,60],[199,38],[203,60]])+' '+smooth([[202,66],[208,46],[211,66]]),'lining');
 add('quiver_lip','prop_back',poly([[182,94],[206,98],[205,104],[181,100]]),'leatherDeep');
 add('home_wood','prop_hip',poly([[218,256],[230,257],[229,280],[217,279]]),'wood',OL);
 add('home_wood_mark','prop_hip','M220 262 L227 270 L221 276','woodLight',{detail:1});
 add('home_tassel','prop_hip',poly([[220,280],[227,280],[229,298],[218,298]]),'red');

 // ---------------- reflex gakgung: grip at the hand socket, string tips fixed ----------------
 const [gx,gy]=a.rig.handSockets.front;          // 344.32, 261.67
 const top=a.constraints.bowstring.tips[0],bot=a.constraints.bowstring.tips[1]; // (318.3,155.7) (318.3,367.7)
 // centre line, symmetric about the grip: belly forward (+x), limbs curl back to the
 // string tips, siyah ears flick forward again at the very ends.
 const half=[[gx,gy],[gx+7,gy-34],[gx+12,gy-66],[gx+8,gy-88],[gx-6,gy-100],[top[0]+1,top[1]+1],[top[0]+6,top[1]-9],[top[0]+12,top[1]-15]];
 const mirror=half.map(([x,y])=>[x,2*gy-y]);
 const centre=[...[...half].reverse(),...mirror.slice(1)];
 const width=i=>{const k=Math.abs(i-(half.length-1));return [4.6,4.2,3.8,3.2,2.6,2.2,2.6,2][k]??2;};
 const offset=(pts,w,sgn)=>pts.map((p,i)=>{const q=pts[Math.min(i+1,pts.length-1)],o=pts[Math.max(i-1,0)],dx=q[0]-o[0],dy=q[1]-o[1],l=Math.hypot(dx,dy)||1;return [p[0]-sgn*dy/l*w(i),p[1]+sgn*dx/l*w(i)];});
 add('bow_body','weapon',smooth([...offset(centre,width,1),...offset(centre,width,-1).reverse()],{sharp:new Set([0,centre.length-1,centre.length,2*centre.length-1])}),'horn',OL);
 const inner=centre.slice(3,centre.length-3);
 add('bow_belly','weapon',smooth([...offset(inner,()=>1.6,1).map(([x,y])=>[x+1.2,y]),...offset(inner,()=>0.2,-1).reverse().map(([x,y])=>[x+1.2,y])]),'woodLight');
 add('bow_grip','weapon',smooth([[gx-5,gy-13],[gx+6,gy-13],[gx+7,gy+13],[gx-5,gy+13]]),'leatherDeep');
 ink('bow_wrap','weapon',`M${gx-5} ${gy-7} L${gx+6} ${gy-6} M${gx-5} ${gy} L${gx+7} ${gy+1} M${gx-5} ${gy+7} L${gx+7} ${gy+8}`,'cord',1.2,1);
 a.artRevision=13;
}
