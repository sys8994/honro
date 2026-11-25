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
 const credit=JSON.parse(await read('credits.json','utf8'));
 return Object.freeze({
  code:await read('presentation.inc.js','utf8'),css:await read('presentation.css','utf8'),
  nativeHost:await read('native-host.inc.js','utf8'),
  assets:{stills:Object.fromEntries(done),track:base+TEMP_TRACK_FILE,credit},
  timeline:{intro,names,cuts}
 });
}
export function spliceEndingPresentation(proto,end){
 assert(proto.includes('const normal60Stock=true;')&&proto.includes('function createEndingDOM('));
 // Preserve the released Stage 60 owner, terminal receipt and same-slot writer.
 proto=splice(proto,'const dom=createEndingDOM({','const dom=createEndingDOMDirect({');
 const mountStart=proto.indexOf('      function mountEndingNormal60(a,s,terminal){'), prior=proto.slice(0,mountStart);
 assert(mountStart>-1);
 let mount=proto.slice(mountStart);
 mount=splice(mount,`          const v=s.owner60.endingView(w,h);
          if(v?.scene!=='daybreak')return v;
          const card=w/h<.95?normal60Cards.Portrait:normal60Cards.Wide;
          return {...v,asset:card};`,
  "          const v=s.owner60.endingView(w,h);return v?.ready?{...v,scene:'live-stage60'}:null;");
 const from="            if(kind==='record'){", until="            finally{s.writing60=null;}";
 const i=mount.indexOf(from),j=mount.indexOf(until,i);
 assert(i>-1&&j>i);
 mount=mount.slice(0,i)+`            if(kind!=='finish'||s.writing60)return {ok:false,reason:'normal-60-finale-not-ready'};
            s.writing60=f.raw;
            try{
              const state=()=>s.owner60.endingView(f.viewport.w,f.viewport.h);
              if(state()?.scene==='last-souls'&&!(await s.owner60.advanceScene('last-souls')).ok)return {ok:false};
              if(state()?.scene==='bridge-record'){
                if(!state().memorial&&!s.owner60.nativeInteraction('name-the-bridge-guard',e.unit(p.guard.actor)))return {ok:false};
                if(!(await s.owner60.advanceScene('bridge-record')).ok)return {ok:false};
              }
              if(state()?.scene==='daybreak'&&!(await s.owner60.advanceScene('daybreak')).ok)return {ok:false};
              if(state()?.scene!=='later-return')return {ok:false};
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
  'const act6EndingReplan=('+end.code+')(G,'+JSON.stringify(end.assets)+','+JSON.stringify(end.css)+',endingTimeline);\n'+end.nativeHost+'\n'+proto;
}
