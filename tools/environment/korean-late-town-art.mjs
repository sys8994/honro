/** Role-specific Korean public compounds, foundries and working river landings. */
import {koreanTownBuilding,koreanArchiveCabinet} from './korean-town-art.mjs';
import {compileSVG} from './build-act2-art.mjs';
import {asset,P,R,line} from '../map-forge/act3-map-kit.mjs';
const body=svg=>svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
const roofGroup=svg=>svg.match(/<g id="korean-(?:gable|hip|thatch)-roof">[\s\S]*?<\/g>/)?.[0]||'';
function pack(id,name,parts,solids,bounds,params){const a=asset(id,name,parts.join(''),solids,bounds);a.params={...a.params,...params,collisionSource:'sampled-drawn-roof'};return a;}
function footing(parts,x,y,wood=false){parts.push(P([[x-29,y-14],[x+25,y-18],[x+33,y],[x-33,y]],'#68796a'),R(x-24,y-13,48,5,'#aaa88b'));if(y>20)parts.push(R(x-10,8,20,y-19,wood?'#665139':'#6c7a69'),R(x-6,12,5,y-27,wood?'#9c8155':'#929f85'));}
export function koreanRaisedCompound(id,{width=1040,role='office',roofType='gable',baseDepth=380,foundation='rooms',supports=[],variant=0,burnt=false}={}){
 const upper=koreanTownBuilding(id+'-upper',{width,role,roofType,variant,burnt}),parts=[],l=-width/2,r=width/2,foot=Math.max(0,baseDepth,...supports.map(q=>q.y));
 if(foundation==='rooms'&&foot>80){
  parts.push(R(l+8,14,width-16,foot-20,burnt?'#585b47':'#766d4d'),R(l+12,20,width-24,Math.max(20,foot-237),'#515744'));
  const lower=koreanTownBuilding(id+'-lower',{width:width-24,role:role==='pavilion'?'storehouse':role,roofType,variant:variant+1,collision:false,burnt});
  parts.push(`<g transform="translate(0 ${foot})">${body(lower.vector.source).replace(roofGroup(lower.vector.source),'')}</g>`);
  for(const x of [l+5,-width*.17,width*.17,r-25])parts.push(R(x,10,22,foot-24,'#73543b'),R(x+4,14,5,foot-32,'#aa8755'));
 }else if(foundation==='masonry'&&foot>30){
  parts.push(P([[l+18,10],[r-18,10],[r+16,foot],[l-15,foot]],'#74816a'),P([[l+22,18],[l+64,18],[l+46,foot],[l-15,foot]],'#536b5f'));
  const cols=5,rows=Math.max(2,Math.min(5,Math.round(foot/110)));for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const x=l+30+col*(width-60)/cols+(row%2)*11,y=22+row*(foot-35)/rows,w=(width-70)/cols-13,h=(foot-35)/rows-13;parts.push(P([[x,y+4],[x+w-7,y],[x+w,y+h-5],[x+4,y+h]],(row+col)%3?'#92977b':'#858f74'));}
 }else if(foundation==='piers'){for(const q of supports)footing(parts,q.x,q.y,true);}
 parts.push(body(upper.vector.source));
 if(role==='archive')for(const [i,x]of [[0,l+35],[1,r-220]]){const c=koreanArchiveCabinet(id+'-folios-'+i,{width:180,height:142,variant:i});parts.push(`<g transform="translate(${x} -146)">${body(c.vector.source)}</g>`);}
 const bounds=[upper.bounds.x,upper.bounds.y,upper.bounds.w,foot-upper.bounds.y+20];
 const a=pack(id,role==='archive'?'기단 위 판문 기록각':'낮은 관아 대청과 기단',parts,upper.collision.map(poly=>poly.map(q=>[q.x,q.y])),bounds,{koreanType:'raised-'+role,foundation,structuralSupports:supports,floorHeights:[0,...(foundation==='rooms'?[foot]:[])],historicalScope:'Korean public-building vocabulary adapted to existing fantasy circulation'});return a;
}
function clipX(poly,edge){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ai=a.x<=edge,bi=b.x<=edge;if(ai)out.push([a.x,a.y]);if(ai!==bi){const t=(edge-a.x)/(b.x-a.x);out.push([edge,a.y+(b.y-a.y)*t]);}}return out;}
export function koreanFoundry(id,{width=1080,baseDepth=380,supports=[],variant=0}={}){
 const upper=koreanTownBuilding(id+'-frame',{width,role:'pavilion',roofType:'gable',variant,burnt:true}),r=roofGroup(upper.vector.source),edge=width*.12,parts=[];
 for(const q of supports)footing(parts,q.x,q.y,q.y>300);
 parts.push(body(upper.vector.source).replace(r,`<defs><clipPath id="broken-roof"><path d="M${-width} -600H${edge}V60H${-width}Z"/></clipPath></defs><g clip-path="url(#broken-roof)">${r}</g>`));
 const k=-width*.29;
 parts.push(P([[k-94,0],[k-79,-155],[k-37,-181],[k+30,-160],[k+78,0]],'#695b42'),P([[k-71,0],[k-59,-143],[k-22,-159],[k-19,0]],'#91815a'),P([[k-28,0],[k-25,-66],[k-6,-85],[k+15,-73],[k+24,0]],'#333d32'),R(k-13,-54,25,22,'#ad7444'));
 parts.push(P([[width*.25,-12],[width*.24,-270],[width*.30,-309],[width*.34,-292],[width*.38,-307],[width*.40,-10]],'#4d5545'),P([[width*.255,-23],[width*.257,-271],[width*.30,-289],[width*.31,-23]],'#76735a'));
 parts.push(line([[edge+5,-275],[width*.35,-219],[width*.49,-183]],'#65513a',13),line([[width*.37,-226],[width*.42,-200],[width*.49,-207]],'#9a7b50',6));
 const foot=Math.max(baseDepth,...supports.map(q=>q.y),0),a=pack(id,'기와가 무너진 주조 공방과 흙가마',parts,[clipX(upper.collision[0],edge)],[-width/2-55,-325,width+110,foot+345],{koreanType:'ruined-casting-workshop',structuralSupports:supports,brokenRoof:true});return a;
}
export function koreanDock(id,{width=980,supports=[],variant=0}={}){
 const upper=koreanTownBuilding(id+'-shelter',{width,role:'pavilion',roofType:variant%2?'gable':'hip',variant}),parts=[];
 for(const q of supports)footing(parts,q.x,q.y,true);
 parts.push(body(upper.vector.source));
 const x=-width*.46,w=width*.29;
 parts.push(R(x,-153,w,142,'#55573e'),R(x+11,-145,w-22,28,'#9a8860'),R(x+12,-107,w-24,90,'#7a6949'),R(x+w*.47,-105,7,86,'#4e4d35'),R(x+16,-61,w-31,8,'#aa9261'));
 parts.push(P([[width*.19,-66],[width*.33,-66],[width*.33,-6],[width*.18,-6]],'#7f6a45'),R(width*.175,-73,width*.16,9,'#b39868'),R(width*.29,-62,7,52,'#55543a'));
 const hx=width*.35;parts.push(R(hx,-237,15,237,'#705b3e'),R(hx-9,-241,125,12,'#9c8456'),line([[hx+16,-199],[hx+74,-230]],'#7f6b45',10),line([[hx+90,-230],[hx+90,-135]],'#b0a071',4));
 const foot=Math.max(0,...supports.map(q=>q.y));return pack(id,'수변 창고와 열린 하역 정자',parts,upper.collision.map(p=>p.map(q=>[q.x,q.y])),[upper.bounds.x,upper.bounds.y,upper.bounds.w,foot-upper.bounds.y+20],{koreanType:'working-ferry-landing',structuralSupports:supports});
}
