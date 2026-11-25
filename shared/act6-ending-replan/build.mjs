import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const dir='shared/act6-ending-replan';
const TEMP_TRACK_FILE='assets/bgm/main.mp3'; // Replace this with the owner's final registered audio asset.
const TEMP_TRACK_SHA1='12fa25bef170b60de432272743efe44b16bdd50d';
const scenes=['last-souls','bridge-record','later-return'];
function splice(src,anchor,addition){
 assert.equal(src.split(anchor).length,2,'Unreviewed Stage60 presentation anchor: '+anchor);
 return src.replace(anchor,()=>addition);
}
export async function prepareEndingReplan({root,emit,descriptor}){
 assert(descriptor.releaseEnabled&&descriptor.boundary&&descriptor.normalEndingAssets);
 const raw=path.join(root,TEMP_TRACK_FILE), bytes=await readFile(raw);
 const blob=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 assert.equal(blob,TEMP_TRACK_SHA1,'Temporary ending track must be the registered title track');
 const base=descriptor.basePath;
 assert.equal(base,'/honro/');
 const viewAssets={};
 for(const [size,suffix,dawn] of [['Wide','pc','dawn-pc.webp'],['Portrait','m','dawn-mobile.webp']]){
  const shots=viewAssets[size]={'daybreak':base+descriptor.normalEndingAssets[dawn]};
  for(const scene of scenes){
   const name=scene+'-'+suffix;
   const media=await readFile(path.join(root,dir,name+'.webp'));
   assert(media.length>1000&&media.length<50000&&media.subarray(8,12).toString()==='WEBP');
   shots[scene]=base+await emit('graphics','act6-ending-preview-'+name,'webp',media);
  }
 }
 const css=await readFile(path.join(root,'shared/act6-normal-ending-qa/ending-dom.css'),'utf8')+
    '\n'+await readFile(path.join(root,dir,'presentation.css'),'utf8');
 return Object.freeze({code:await readFile(path.join(root,dir,'presentation.inc.js'),'utf8'),css,
  assets:{preview:viewAssets,track:base+TEMP_TRACK_FILE}});
}
export function spliceEndingPresentation(proto,end){
 assert(proto.includes('const normal60Stock=true;')&&proto.includes('function createEndingDOM('));
 proto=splice(proto,'  const previousActive=doc.activeElement;',
  '  const end6=act6EndingReplan.normal(app,{root,media,heading,script,controls,status});\n  const previousActive=doc.activeElement;');
 proto=splice(proto,"   if(copy[v.scene])script.append(el('p','',copy[v.scene]));",
  "   const beatCopy=act6EndingReplan.lines[v.scene]?.[1]??copy[v.scene];if(beatCopy&&!v.line)script.append(el('p','',beatCopy));");
 proto=splice(proto,'      const result=await pending;',
  '      const result=await pending;\n      if(current(s))end6.audioAfter(v,result);');
 proto=splice(proto,"s.result=true;controls.replaceChildren();status.textContent='여정의 끝을 기록했습니다.';onDone(app,engine,proof,result);return;",
  "s.result=true;end6.done();onDone(app,engine,proof,result);return;");
 proto=splice(proto,'   controls.replaceChildren(b);b.focus({preventScroll:true});',
  '   controls.replaceChildren(b);end6.controls();b.focus({preventScroll:true});');
 proto=splice(proto,"   s.renderSize=size;s.displayed=v.scene;root.dataset.cut=v.scene;",
  "   s.renderSize=size;\n   if(end6.shouldHold(v)){s.displayed=null;clearMedia();end6.paint(show);return;}\n   s.displayed=v.scene;root.dataset.cut=v.scene;");
 proto=splice(proto,'s.load?.abort();clearMedia();root.remove();refs.delete(app);',
  's.load?.abort();end6.close();clearMedia();root.remove();refs.delete(app);');
 return 'const act6EndingReplan=('+end.code+')(G,'+JSON.stringify(end.assets)+','+JSON.stringify(end.css)+');\n'+proto;
}
