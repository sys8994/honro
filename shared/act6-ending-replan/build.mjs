import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
import {cuts,intro,names,selectEndingCue} from './cues.mjs';
const dir='shared/act6-ending-replan';
const TEMP_TRACK_FILE='assets/bgm/main.mp3';
const TEMP_TRACK_SHA1='12fa25bef170b60de432272743efe44b16bdd50d';
function splice(src,anchor,replacement){
 assert.equal(src.split(anchor).length,2,'Unreviewed Stage60 presentation anchor: '+anchor);
 return src.replace(anchor,()=>replacement);
}
export async function prepareEndingReplan({root,emit,descriptor}){
 assert(descriptor.releaseEnabled&&descriptor.boundary&&descriptor.normalEndingAssets);
 const read=(name,encoding)=>readFile(path.join(root,dir,name),encoding);
 const base=descriptor.basePath;assert.equal(base,'/honro/');
 const bytes=await readFile(path.join(root,TEMP_TRACK_FILE));
 const blob=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 assert.equal(blob,TEMP_TRACK_SHA1,'Temporary ending track must be the registered title track');
 const done=await Promise.all(cuts.map(async ({id})=>{
  const media={};
  for(const [side,w,h] of [['land',1920,1080],['port',1080,1920]]){
   const stem='ending_'+id+'_'+side, art=await read('stills/'+stem+'.webp');
   const q=await sharp(art).metadata();
   assert(q.format==='webp'&&q.width===w&&q.height===h&&art.length<(id==='still_06b'?600000:450000),'Invalid '+stem);
   media[side]=base+await emit('graphics','act6-'+stem,'webp',art);
  }
  return [id,media];
 }));
 const preview={};
 for(const [side,key] of [['land','pc'],['port','m']]){
  const stem='bridge-record-'+key, art=await read(stem+'.webp');
  preview[side]=base+await emit('graphics','act6-ending-native-preview-'+key,'webp',art);
 }
 const credit=JSON.parse(await read('credits.json','utf8'));
 return Object.freeze({
  code:await read('presentation.inc.js','utf8'),css:await read('presentation.css','utf8'),
  walk:await read('walk.inc.js','utf8'),nativeHost:await read('native-host.inc.js','utf8'),
  assets:{stills:Object.fromEntries(done),preview,track:base+TEMP_TRACK_FILE,credit},
  timeline:{intro,names,cuts}
 });
}
export function spliceEndingPresentation(proto,end){
 assert(proto.includes('const normal60Stock=true;')&&proto.includes('function createEndingDOM('));
 // The released chapter boundary fingerprints the base module before this splice.
 // The new presentation consumes the same authorized outcome and storage port.
 proto=splice(proto,'const dom=createEndingDOM({','const dom=createEndingDOMV2({');
 proto=splice(proto,'async function renderNative(app,e,proof,scene,size,{signal}={}){',
  'async function renderNative(app,e,proof,scene,size,{signal,endingV2=false}={}){');
 proto=splice(proto,"  const portrait=size.w/size.h<.95,node=doc.createElement('canvas');",
  "  if(endingV2){const gate=gateShadow(b,cfg,C.topAt);if(gate?.collisionIds.length===0){b.honroLandmarks=b.honroLandmarks.filter(i=>i.id!=='act6-10-main-gate-footings-r1');b.honroLandmarks.push(warmGate(gate));}}\n"+
  "  const portrait=size.w/size.h<.95,node=doc.createElement('canvas');");
 proto=splice(proto,'  const snap=witnesses(b), geom=terrainSeal(b);',
  '  const paint=()=>{sc.render(fork,0,"",.5,false,0);applyQuietPigment(node,sc,{...frame,core:C},scene,portrait);};\n'+
  '  const walked=endingV2?endingV2Walk({frame,b,node,sc,fork,size,stage:e.stage,paint,sample}):null;\n'+
  '  if(endingV2&&!walked){sc._releaseDomainTiles?.();return null;}\n  let keep=false;\n  const snap=witnesses(b), geom=terrainSeal(b);');
 proto=splice(proto,"   try {sc.render(fork,0,'',.5,false,0);applyQuietPigment(node,sc,{...frame,core:C},scene,portrait);}",
  '   try {paint();}');
 proto=splice(proto,'   const result=Object.freeze({node,native:Object.freeze({})});',
  '   const result=Object.freeze({node,native:Object.freeze({}),...(walked?{walk:walked.walk,walked:walked.walked,dispose:()=>sc._releaseDomainTiles?.()}:{} )});');
 proto=splice(proto,'tickets.set(result.native,{app,e,proof,scene,node,world:canvas,size:{...size},pixels,nativePixels,counts,cert:',
  'tickets.set(result.native,{app,e,proof,scene,node,world:canvas,size:{...size},pixels,walked,nativePixels,counts,cert:');
 proto=splice(proto,'   return result;\n  }finally{sc._releaseDomainTiles?.();}',
  '   keep=!!walked;return result;\n  }finally{if(!keep)sc._releaseDomainTiles?.();}');
 proto=splice(proto,'try{return ticket.pixels===sample(node);}',
  'try{return (ticket.walked?.signature()??ticket.pixels)===sample(node);}');
 const mountStart=proto.indexOf('      function mountEndingNormal60(a,s,terminal){'), prior=proto.slice(0,mountStart);
 assert(mountStart>-1);
 let mount=proto.slice(mountStart);
 mount=splice(mount,'        const panel=new WeakMap();',
  "        const panel=new WeakMap();\n        if(s.owner60.endingView(1440,900)?.scene==='last-souls')void s.owner60.advanceScene('last-souls');");
 mount=splice(mount,`          const v=s.owner60.endingView(w,h);
          if(v?.scene!=='daybreak')return v;
          const card=w/h<.95?normal60Cards.Portrait:normal60Cards.Wide;
          return {...v,asset:card};`,
  "          const v=s.owner60.endingView(w,h);return v?{...v,scene:'bridge-record'}:null;");
 const from="            if(kind==='record'){", until="            finally{s.writing60=null;}";
 const i=mount.indexOf(from),j=mount.indexOf(until,i);
 assert(i>-1&&j>i);
 mount=mount.slice(0,i)+`            if(kind==='record'){
              const ok=s.owner60.nativeInteraction('name-the-bridge-guard',e.unit(p.guard.actor));
              return {ok};
            }
            if(kind!=='depart'||f.raw.walked()!==1||s.writing60)return {ok:false,reason:'normal-60-departure-not-ready'};
            s.writing60=f.raw;
            try{
              let q=s.owner60.endingView(f.viewport.w,f.viewport.h);
              if(q?.scene==='bridge-record'){
                if(!(await s.owner60.advanceScene('bridge-record')).ok)return {ok:false};
                q=s.owner60.endingView(f.viewport.w,f.viewport.h);
              }
              if(q?.scene==='daybreak'){
                if(!(await s.owner60.advanceScene('daybreak')).ok)return {ok:false};
                q=s.owner60.endingView(f.viewport.w,f.viewport.h);
              }
              if(q?.scene!=='later-return')return {ok:false};
              if(!s.final60Seal){
                s.final60Seal=Object.freeze({});
                if(!s.owner60.acceptFinalFrame(s.final60Seal)){s.final60Seal=null;return {ok:false,reason:'normal-60-final-frame-closed'};}
              }
              const result=await s.owner60.advanceScene('later-return');if(result.ok)panel.delete(frame);return result;
            }
`+mount.slice(j);
 proto=prior+mount;
 proto=splice(proto,"next.honroFlags={...(next.honroFlags??{}),[flag]:true};",
  "next.honroFlags={...(next.honroFlags??{}),[flag]:true,game_completed:true,ending_act6_seen:true};");
 return 'const endingTimeline='+JSON.stringify(end.timeline)+';endingTimeline.cueAt=ms=>('+selectEndingCue.toString()+')(endingTimeline.cuts,ms);\n'+
  'const act6EndingReplan=('+end.code+')(G,'+JSON.stringify(end.assets)+','+JSON.stringify(end.css)+',endingTimeline);\n'+
  end.walk+'\n'+end.nativeHost+'\n'+proto;
}
