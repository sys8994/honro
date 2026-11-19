import {compileStructure} from './structure.mjs';
const phases=['background','road-top','road-underside','deck-top','deck-underside','support-west-head','support-west-side-a','support-west-toe','support-west-side-b','support-east-head','support-east-side-a','support-east-toe','support-east-side-b'];
const make=()=>({background:[],road:{top:[],underside:[]},deck:{top:[],underside:[]},supports:[{head:[],toe:[],sides:[[],[]]},{head:[],toe:[],sides:[[],[]]}]});
const points=(d,i)=>[d.background,d.road.top,d.road.underside,d.deck.top,d.deck.underside,...d.supports.flatMap(s=>[s.head,s.sides[0],s.toe,s.sides[1]])][i];
export function mountStructure({canvas,nextButton,previewButton,saveButton,getCamera,isActive,commit,preview,onState=()=>{},onError=()=>{}}){
 // No draft injection, raw source alpha, path or visual-bulk-import method.
 const draft=make();let i=0,busy=false,clicks=0;
 const snap=()=>onState({phase:phases[i]??'edit',clicks,design:structuredClone(draft)});
 function click(e){
  if(i>=phases.length||!e.isTrusted||e.button!==0||!e.isPrimary||busy||!isActive())return;
  e.stopImmediatePropagation?.();
  const {x,y,zoom}=getCamera(),b=canvas.getBoundingClientRect(),pt=[Math.round(x+(e.clientX-b.left-b.width/2)/zoom),Math.round(y+(e.clientY-b.top-b.height/2)/zoom)];
  if(!pt.every(Number.isSafeInteger))return onError('Invalid real canvas transform');
  points(draft,i).push(pt);clicks++;snap();
 }
 const done=async(e,which)=>{
  if(!e.isTrusted||busy||!isActive())return;
  try{
   if(which==='next'){
    if(i>=phases.length)return;
    const n=points(draft,i).length,min=(i===0)?4:([6,8,10,12].includes(i)?0:2);
    if(n<min||([5,7,9,11].includes(i)&&n!==2))throw Error('Phase needs exact edge points');
    if(i===phases.length-1)compileStructure(draft);
    i++;snap();
   }else{
    if(i!==phases.length)throw Error('Finish each real pointer phase first');
    busy=true;
    const copy=structuredClone(draft), compiled=compileStructure(copy);
    await (which==='preview'?preview:commit)(copy,compiled,{count:clicks,input:'trusted-workshop-canvas'});
   }
  }catch(error){onError(error?.message??String(error));}finally{busy=false;}
 };
 canvas.addEventListener('pointerdown',click,true);
 const nn=e=>done(e,'next'),pp=e=>done(e,'preview'),ss=e=>done(e,'save');
 nextButton.addEventListener('click',nn);previewButton.addEventListener('click',pp);saveButton.addEventListener('click',ss);
 snap();
 return ()=>{canvas.removeEventListener('pointerdown',click,true);nextButton.removeEventListener('click',nn);previewButton.removeEventListener('click',pp);saveButton.removeEventListener('click',ss);};
}
