// v016 companions from the sheet's full-body figure, cut into rig parts (2026-11).
// v014 (cells from different views, rotated to the old bind) twisted the body;
// v015 (one intact frame) had no motion. Here the single full-body drawing is
// cut into parts by tools/party-forge/sheet/segment.py (flat visible colour map,
// nearest-bone territories, overlap at joints, back-fill under limbs), so the
// bind pose IS the drawing. The rig is rebuilt on the drawing's joints and each
// existing animation is retargeted as joint-angle CHANGES relative to the old
// bind (not absolute directions), so idle stays on the drawing and every motion
// keeps its original timing, reach and contacts.
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],add=(a,b)=>[a[0]+b[0],a[1]+b[1]],mul=(a,k)=>[a[0]*k,a[1]*k],len=a=>Math.hypot(a[0],a[1]);
const ang=v=>Math.atan2(v[1],v[0]),rot=(v,t)=>[v[0]*Math.cos(t)-v[1]*Math.sin(t),v[0]*Math.sin(t)+v[1]*Math.cos(t)];
const wrap=t=>Math.atan2(Math.sin(t),Math.cos(t));
const R2=v=>Math.round(v*100)/100;
const UNIT_HEIGHT=92,WORLD_PER_CM=.57;   // party unit h (engine) and world units per cm of stature

export function sheetRig(a,previousBounds){
 const cfgPath=path.join(root,'tools/party-forge/sheet',a.character_id+'.json'),partsPath=cfgPath.replace(/\.json$/,'.parts.json');
 if(!existsSync(partsPath))return;
 const cfg=JSON.parse(readFileSync(cfgPath,'utf8')),data=JSON.parse(readFileSync(partsPath,'utf8')),J=cfg.joints;
 // ---- body measurements (v017): stature in cm and head units (crown->sole / crown->chin, skull crown under hair/hat)
 // The game draws every companion at unit height 92 over canvas.visualHeight; WORLD_PER_CM fixes 1 cm of stature in world units.
 let top=1e9,bot=-1e9;for(const rows of Object.values(data.parts))for(const [,ext] of rows)for(const [,y] of ext){top=Math.min(top,y);bot=Math.max(bot,y);}
 if(cfg.statureCm){bot=-1e9;for(const [part,rows] of Object.entries(data.parts))if(part.endsWith('_foot'))for(const [,ext] of rows)for(const [,y] of ext)bot=Math.max(bot,y);}   // sole = lowest foot paint
 const neck=J.neck,hf=cfg.heads?(bot-neck[1])/(cfg.heads*(J.chin[1]-J.crown[1])-(neck[1]-J.crown[1])):(cfg.headScale||1);
 if(hf!==1){const sc=q=>[neck[0]+(q[0]-neck[0])*hf,neck[1]+(q[1]-neck[1])*hf];   // the head (with hair/hat) scales about the neck
  for(const row of data.parts.head||[]){row[1]=row[1].map(sc);row[2]=row[2].map(h=>h.map(sc));}
  J.crown=sc(J.crown);J.chin=sc(J.chin);}
 top=1e9;for(const rows of Object.values(data.parts))for(const [,ext] of rows)for(const [,y] of ext)top=Math.min(top,y);
 const [,gTop,,gBot]=previousBounds,by=Object.fromEntries(a.rig.parts.map(p=>[p.id,p])),cx=by.root.pivot[0];
 const K=cfg.statureCm?cfg.statureCm*WORLD_PER_CM*a.canvas.visualHeight/UNIT_HEIGHT/(bot-J.crown[1]):(gBot-gTop)/(bot-top);
 const footX=(J.rearAnkle[0]+J.frontAnkle[0])/2,G=p=>[cx+(p[0]-footX)*K,gBot-(bot-p[1])*K];
 if(cfg.statureCm){a.canvas.presentationHeight=R2(a.canvas.anchor[1]-G([0,top])[1]+8);
  a.proportions={...a.proportions,measurements:{statureCm:cfg.statureCm,heads:cfg.heads,worldPerCm:WORLD_PER_CM,headScaleFromSheet:R2(hf),basis:'Skull crown under hair/hat to sole; skull crown to chin.'}};}
 const old=Object.fromEntries(a.rig.parts.map(p=>[p.id,[...p.pivot]])),oldBT=[...a.rig.bindThorax];
 const set={pelvis:G(J.pelvis),thorax:G(J.pelvis),neck:G(J.neck),head:G(mul(add(J.neck,J.chin),.5)),
  rear_upper_arm:G(J.rearShoulder),rear_forearm:G(J.rearElbow),rear_hand:G(J.rearHand),front_upper_arm:G(J.frontShoulder),front_forearm:G(J.frontElbow),front_hand:G(J.frontHand),
  rear_thigh:G(J.rearHip),rear_shin:G(J.rearKnee),rear_foot:G(J.rearAnkle),front_thigh:G(J.frontHip),front_shin:G(J.frontKnee),front_foot:G(J.frontAnkle)};
 for(const [id,p]of Object.entries(set))if(by[id])by[id].pivot=p;
 for(const p of a.rig.parts)if(!(p.id in set)&&p.parent){p.pivot=add(old[p.id],sub(by[p.parent].pivot,old[p.parent]));}
 const f=(oldBT[1]-old.pelvis[1])/(old.neck[1]-old.pelvis[1]);a.rig.bindThorax=add(set.pelvis,mul(sub(set.neck,set.pelvis),f));
 a.rig.handSockets={front:[...set.front_hand],rear:[...set.rear_hand]};
 if(by.weapon)by.weapon.pivot=[...set.front_hand];
 if(a.face?.anatomy)a.face.anatomy={...a.face.anatomy,crown:G(J.crown),chin:G(J.chin)};
 // ---- art: polygons per part (back-fill first so it sits under the part's own art)
 const palette={},key=c=>{let k=Object.keys(palette).find(k=>palette[k]===c);if(!k){k='f'+Object.keys(palette).length;palette[k]=c;}return k;};
 const ring=r=>'M'+r.map(p=>G(p).map(v=>R2(v)).join(' ')).join(' L')+' Z';
 const paths=[];let n=0;
 for(const [part,color,ext] of data.backfill||[])paths.push({id:`bf_${n++}`,part,d:ring(ext),fill:key(color),detail:0});
 const thin=(ext)=>{let A=0,P=0;for(let i=0;i<ext.length;i++){const p=ext[i],q=ext[(i+1)%ext.length];A+=p[0]*q[1]-q[0]*p[1];P+=Math.hypot(q[0]-p[0],q[1]-p[1]);}return Math.abs(A)/2/Math.max(P,1)<1.1;};
 for(const [part,rows] of Object.entries(data.parts)){if(!by[part])continue;
  for(const [color,ext,holes] of rows){
   if(part==='weapon'&&a.constraints?.bowstring&&thin(ext))continue;      // painted bowstring: the rig draws a live one
   paths.push({id:`${part}_${n++}`,part,d:[ring(ext),...holes.map(ring)].join(' '),fill:key(color),detail:0,...(holes.length?{fillRule:'evenodd'}:{})});
  }}
 a.paths=paths;a.palette={...a.palette,...palette};
 if(a.constraints?.bowstring&&J.bowTop){const bs=a.constraints.bowstring;bs.tips=[G(J.bowTop),G(J.bowBottom)];bs.restNock=mul(add(bs.tips[0],bs.tips[1]),.5);bs.drawPoint=[...set.rear_hand];a.palette.string=cfg.stringColor||'#282627';bs.color='string';bs.width=1.4;
  a.constraints.arrow.grip=[...set.front_hand];a.palette.arrowShaft=cfg.arrowColor||'#C9BBA4';a.constraints.arrow.color='arrowShaft';if(a.constraints.bowFlex)a.constraints.bowFlex.pivot=[...set.front_hand];}
 if(a.face)a.face.shapeIds=paths.filter(p=>p.part==='head').map(p=>p.id);
 // ---- retarget animations as joint-angle changes from the old IDLE pose (first idle key), so idle = the drawing
 const i0=a.animation.animations.idle?.keyframes?.[0]||{},Rf={pelvis:[...(i0.pelvis||old.pelvis)],thorax:[...(i0.thorax||oldBT)]};
 for(const [s0,u0,l0,t0,A0,B0,C0] of [['rear','_upper_arm','_forearm','_hand','Shoulder','Elbow','Hand'],['front','_upper_arm','_forearm','_hand','Shoulder','Elbow','Hand'],['rear','_thigh','_shin','_foot','Hip','Knee','Foot'],['front','_thigh','_shin','_foot','Hip','Knee','Foot']]){
  Rf[s0+A0]=[...(i0[s0+A0]||old[s0+u0])];Rf[s0+B0]=[...(i0[s0+B0]||old[s0+l0])];Rf[s0+C0]=[...(i0[s0+C0]||old[s0+t0])];}
 for(const s0 of ['rear','front'])Rf[s0+'HandAngle']=i0[s0+'HandAngle']??0;Rf.weapon=i0.weapon??0;
 const hs=len(sub(set.neck,set.pelvis))/len(sub(old.neck,old.pelvis));
 const limbs=[['rear','arm','_upper_arm','_forearm','_hand','Shoulder','Elbow','Hand'],['front','arm','_upper_arm','_forearm','_hand','Shoulder','Elbow','Hand'],
  ['rear','leg','_thigh','_shin','_foot','Hip','Knee','Foot'],['front','leg','_thigh','_shin','_foot','Hip','Knee','Foot']];
 const amp=cfg.motionAmplitude??1;   // armAmplitude/legAmplitude: robed figures whose sleeves/skirt are painted on the torso swing less
 for(const [animName,anim] of Object.entries(a.animation.animations))for(const k of anim.keyframes){
  const slack=animName==='idle'?1:.97;   // interpolated steps between keyframes need a little leg slack
  if(!k.pelvis)continue;
  const P0=k.pelvis,tr=wrap(ang(sub(k.thorax,P0))-ang(sub(Rf.thorax,Rf.pelvis)))*amp,P=add(set.pelvis,mul(sub(P0,Rf.pelvis),hs));
  const out={pelvis:P,thorax:add(P,rot(sub(a.rig.bindThorax,set.pelvis),tr))};
  for(const [s,limb,u,l,t,A,B,C] of limbs){
   const parentRot=limb==='arm'?tr:0;
   // joint origin follows the body; small authored offsets of the origin are kept
   const oldOrigin0=add(P0,rot(sub(Rf[s+A],Rf.pelvis),limb==='arm'?wrap(ang(sub(k.thorax,P0))-ang(sub(Rf.thorax,Rf.pelvis))):0));
   const O=add(add(P,rot(sub(set[s+u],set.pelvis),parentRot)),mul(sub(k[s+A],oldOrigin0),hs));
   const la=amp*(cfg[s+limb[0].toUpperCase()+limb.slice(1)+'Amplitude']??cfg[limb+'Amplitude']??1),dU=wrap(ang(sub(k[s+B],k[s+A]))-ang(sub(Rf[s+B],Rf[s+A])))*la,dL=wrap(ang(sub(k[s+C],k[s+B]))-ang(sub(Rf[s+C],Rf[s+B])))*la;
   const mid=add(O,rot(sub(set[s+l],set[s+u]),dU)),end=add(mid,rot(sub(set[s+t],set[s+l]),dL));
   out[s+A]=O;out[s+B]=mid;out[s+C]=end;
   // the elbow bend side must come from the NEW joints: an old authored plane would mirror the drawn elbow
   if(limb==='arm'){const v=sub(end,O),w=sub(mid,O),cr=v[0]*w[1]-v[1]*w[0];out[s+'ArmPlane']=Math.sign(cr)||1;}
   if(limb==='arm'&&cfg.retargetHandAngles!==false){   // hand (and held weapon) angles are absolute in the rig: keep only their twist relative to the forearm
    const D=180/Math.PI,near=(ref,v)=>ref+wrap((v-ref)/D)*D,   // stay on the authored branch so keyframes never interpolate through a full turn
    fOld=wrap(ang(sub(k[s+C],k[s+B]))-ang(sub(Rf[s+C],Rf[s+B])))*D,fNew=wrap(ang(sub(end,mid))-ang(sub(set[s+t],set[s+l])))*D;
    const h0=(k[s+'HandAngle']??0)-Rf[s+'HandAngle'];out[s+'HandAngle']=near(h0,fNew+(h0-fOld)*la);   // missing = rig default 0
    if(s==='front'&&!a.rig.swordGrip){const w0=(k.weapon??0)-Rf.weapon;out.weapon=near(w0,fNew+(w0-fOld)*la);}
   }
  }
  // planted feet keep their authored ground offset; body settles if a leg cannot reach
  for(const c of (k.contacts||[]))out[c+'Foot']=add(set[c+'_foot'],sub(k[c+'Foot'],Rf[c+'Foot']));
  const reach=(s,u,l,t)=>len(sub(set[s+l],set[s+u]))+len(sub(set[s+t],set[s+l]))-.05;
  for(let it=0;it<4;it++)for(const s of ['rear','front']){const d=len(sub(out[s+'Foot'],out[s+'Hip'])),m=reach(s,'_thigh','_shin','_foot')*slack;
   if(d>m){const drop=d-m+.01;for(const key of Object.keys(out))if(Array.isArray(out[key]))if(!/Foot$/.test(key)||!(k.contacts||[]).includes(key.replace('Foot','')))out[key]=[out[key][0],out[key][1]+drop];}}
  for(const s of ['rear','front']){const v=sub(out[s+'Foot'],out[s+'Hip']),d=len(v),m=reach(s,'_thigh','_shin','_foot')*.97;if(d>m&&!(k.contacts||[]).includes(s))out[s+'Foot']=add(out[s+'Hip'],mul(v,m/d));}
  for(const s of ['rear','front']){const v=sub(out[s+'Hand'],out[s+'Shoulder']),d=len(v),m=reach(s,'_upper_arm','_forearm','_hand');if(d>m)out[s+'Hand']=add(out[s+'Shoulder'],mul(v,m/d));}
  Object.assign(k,out);
 }
 a.artRevision=cfg.statureCm?17:16;a.sheetSource=cfg.sheet;a.sheetScale=K;
}
