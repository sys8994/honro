/*
 * Act6 ending sound cue policy. Gives the existing mixer event weights, not audio
 * ownership or a global settings override. App #1–50 is intentionally outside it.
 * Titles and start/ending frame selectors remain in App's single scene owner.
 */
export const STORY = Object.freeze(['last-souls','fallen-record','first-dawn','later-return','complete']);
const FADE=900, MAIN_VOLUME=.22;
const CLIP=Object.freeze({policy:'existing-title-motif-not-new-score',asset:'assets/bgm/main.mp3',offsetSeconds:0,maxSeconds:12});
const isIndex=n=>Number.isSafeInteger(n)&&n>=0;
export function begin({stage,owner,eventComplete,mode}={}){
 if(stage!==60||typeof owner!=='string'||!owner||eventComplete!==true||mode!=='act6-ending')return null;
 return {stage,owner,phase:-1,cueConsumed:false,handled:[]};
}
export function cue(ending,command){
 const {stage,owner,phase,muted=false,canDecode=true,authorizedGesture=false}=command??{};
 if(!ending||stage!==60||owner!==ending.owner||!STORY.includes(phase))return [];
 const i=STORY.indexOf(phase);
 if(!isIndex(i)||i!==ending.phase+1||ending.handled.includes(phase))return [];
 ending.phase=i;
 ending.handled.push(phase);
 const result=[];
 // A fresh detached mixer still immediately dampens the combat stem at real completion.
 if(i===0)result.push({gain:0,fadeMs:FADE,channel:'combat'});
 // Names/footsteps and the quiet wide view never compete with the old battle track.
 if(i===1)result.push({gain:0,fadeMs:300,channel:'storyMusic'});
 if(i===2){
   ending.cueConsumed=true;
   if(!muted&&canDecode&&authorizedGesture)result.push({...CLIP,channel:'storyMusic',gain:MAIN_VOLUME,fadeMs:1600,loop:false,essential:false});
 }
 // Independent signal; if this scene is skipped, the engine receives no audio tax.
 if(i===3||i===4)result.push({gain:0,fadeMs:i===3?1200:200,channel:'storyMusic'});
 return result;
}
