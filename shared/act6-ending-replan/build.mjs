import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const dir='shared/act6-ending-replan';
const TEMP_TRACK_FILE='assets/bgm/main.mp3'; // Replace this with the owner's final registered audio asset.
const TEMP_TRACK_SHA1='12fa25bef170b60de432272743efe44b16bdd50d';
const scenes=['last-souls','bridge-record','later-return'];
const officialActors={
 seol:['shared/assets/portraits/variants-v2-20261024/seoro-action-lower-bow.webp','portrait-seoro-action-lower_bow','349c5a541a01528ecbefd39b9e7d96cc309a6c69d0c1214c1aa30c8fd05e0843'],
 hwi:['shared/assets/portraits/variants-v2-20261024/hwigyeom-action-inspect-record.webp','portrait-hwigyeom-action-inspect_record','c719ee39c460ba5e2ef42096ea2c9fc8abbf259e074e8d24bf5c11e9c6af40d8'],
 yeonsil:['shared/assets/portraits/npc-game-tone-v3/yeonsil.webp','npc-portrait-yeonsil','6a79ba32cc70096d4726ca1bf184e5f626e414c6f40cf27b6f70403a839ba68c']
};
const envPins={
 'dossier-room-m':'77ed2839388cb318b5a4ef4b885b3f783860481f7c9963d89ec4945f312d093f',
 'dossier-room':'e08159f4c3344f180494d8a03f34489ee004937a3662da9238464bdf2e59a2bc',
 'shore-dawn-m':'d0603378f1150f0ced4cb5f2f2cd7f9508408b40bde6a81bd40e8bed1ee4ebe7',
 'shore-dawn':'e6f8994d4b1c76b5c7daadcd2da6090640ddffc1176a271e0d02ca60338b3f71'
};
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
 const actor={}, places={};
 for(const [id,[file,stem,digest]] of Object.entries(officialActors)){
  const art=await readFile(path.join(root,file));
  assert.equal(createHash('sha256').update(art).digest('hex'),digest,'Approved Act6 actor derivative changed: '+id);
  actor[id]=base+await emit('graphics',stem,'webp',art);
 }
 for(const scene of ['shore-dawn','dossier-room']){
  places[scene]={};
  for(const [v,s] of [['wide',''],['portrait','-m']]){
   const plate=scene+s, art=await readFile(path.join(root,dir,plate+'.webp'));
   assert(art.length>10000&&art.length<450000&&art.subarray(8,12).toString()==='WEBP','Act6 ending scene env drift: '+plate);
   assert.equal(createHash('sha256').update(art).digest('hex'),envPins[plate],'Act6 ending environment edition drift: '+plate);
   places[scene][v]=base+await emit('graphics','act6-ending-'+plate,'webp',art);
  }
 }
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
  assets:{preview:viewAssets,actor,places,track:base+TEMP_TRACK_FILE}});
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
