import {asset,P,R,line} from './act3-map-kit.mjs';
export const ROOF25=[
 {id:'inspection-room-roof',wall:'inspection-room-east-wall',x:2660,w:640,floor:4950,oldY:4660,y:4770,probeX:2840,wallX:3240,wallW:60,wallBottom:4790},
 {id:'west-lookout-roof',wall:'west-lookout-wall',x:0,w:730,floor:4050,oldY:3400,y:3870,probeX:350,wallX:0,wallW:130,wallBottom:4050},
 {id:'upper-checkpoint-roof',wall:'upper-checkpoint-east-wall',x:4180,w:1320,floor:3600,oldY:2900,y:3420,probeX:5050,wallX:5330,wallW:170,wallBottom:5980},
];
/** Human-scale, one-way working-room roofs. Original library entries untouched.
 * No additional stepping stones bridge a required Jinmok crossing. */
export function refineRoofAccess25(p,s){
 if(s.metadata.stageId!==25)return;
 const prefix='a3-roof-access25:';
 p.library=p.library.filter(a=>!a.id.startsWith(prefix));
 const replace=(id,svg,poly,bounds,oneWay)=>{const a=asset(prefix+id,id,svg,[poly],bounds,'stone');a.oneWay=oneWay;p.library.push(a);s.elements.find(e=>e.id===id).assetId=a.id;};
 for(const r of ROOF25){
  const {x,w,y}=r,roof=[[x,y],[x+w,y],[x+w,y+32],[x,y+32]];
  // Rear-only mortised timber bays stand on the existing gallery. Only the
  // bright roof surface has collision; these posts never obstruct actors.
  let svg='';
  for(const f of [.08,.38,.72,.93]){const px=x+w*f;
   svg+=P([[px-15,y+30],[px+10,y+30],[px+12,r.floor-9],[px-14,r.floor-9]],'#62563e')
    +R(px-10,y+37,6,r.floor-y-50,'#9a8056')+R(px+5,y+40,7,r.floor-y-49,'#343a30')
    +P([[px-25,r.floor-12],[px+22,r.floor-12],[px+26,r.floor],[px-29,r.floor]],'#6c7766')
    +P([[px-30,y+25],[px+28,y+25],[px+23,y+45],[px+11,y+45],[px+7,y+54],[px-10,y+54],[px-14,y+44],[px-25,y+44]],'#87704c');
  }
  svg+=R(x+18,y+34,w-36,15,'#544633')+R(x+20,y+34,w-40,4,'#a08a60');
  svg+=P(roof,'#354743')+P([[x,y],[x+w,y],[x+w-9,y+12],[x+w*.76,y+24],[x+w*.25,y+24],[x+9,y+12]],'#63746b')
   +line([[x+2,y+1],[x+w,y+1]],'#a3aa90',5)
   +line([[x+7,y+16],[x+w*.25,y+29],[x+w*.76,y+29],[x+w-7,y+16]],'#273b39',5);
  for(let xx=x+35;xx<x+w;xx+=65)svg+=line([[xx,y+3],[xx-7,y+19]],'#344a45',3);
  replace(r.id,svg,roof,[x-4,y-4,w+8,r.floor-y+8],true);
  const wx=r.wallX,wy=y+32,wh=Math.max(8,r.wallBottom-wy),ww=r.wallW;
  const wall=[[wx,wy],[wx+ww,wy],[wx+ww,wy+wh],[wx,wy+wh]];
  replace(r.wall,P(wall,'#354943')+R(wx+5,wy,Math.min(15,ww/4),wh,'#657160'),wall,[wx,wy,ww,wh],false);
 }
 // Match the non-colliding workroom fronts to the reachable eaves. The old
 // oversized sealed-door silhouette must not project through the new roof.
 for(const [id,x,floor,w] of [['maintenance-recess',2860,4950,390],['upper-checkpoint',4770,3600,500]]){
  const y=floor-128;let svg=R(x,y,w,128,'#23342e')+R(x+9,y+7,w*.44,117,'#675a40');
  for(const f of [.12,.28,.43])svg+=R(x+w*f,y+14,9,108,'#9c835a');
  svg+=R(x+7,y+42,w*.45,12,'#3d3c2d')+R(x+7,y+96,w*.45,10,'#39392c');
  svg+=R(x+w*.52,y+9,w*.41,62,'#111f20')+R(x+w*.51,y+72,w*.43,14,'#867553');
  for(const f of [.61,.76,.9])svg+=R(x+w*f,y+13,7,55,'#59634b');
  svg+=R(x+w*.54,y+92,w*.36,24,'#4c4735')+R(x+w*.56,y+90,w*.31,4,'#ac9670');
  const a=asset(prefix+id,'낮은 처마 아래의 수문 정비 작업실',svg,[],[x,y,w,130],'wood');p.library.push(a);s.elements.find(e=>e.id===id).assetId=a.id;
 }
 s.design.act3.roofAccessRevision=1;
}
