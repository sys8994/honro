import type {Battle} from './types';

// A prediction is run on an isolated battle. Stage 38's embedded drawing is
// large, but it is not part of projectile physics. Keep the full clone as the
// authority: any access to an omitted value aborts the replay and retries it.
const artRead = {};
const unsupported = {};

function projectedBattle(b:Battle):Battle|null {
 const source=b as any;
 if(source.honroAct4Official!==1||source.honroStage!==38||source.honroCustom||source.honroMapOrigin==='workshop')return null;
 const vectors=new WeakSet<object>(),checked=new WeakSet<object>();
 // The full clone would reject functions and other non-cloneable data even
 // inside unused art. Check each current vector; never cache by identity.
 function cloneableArt(value:any):boolean {
  if(value===null)return true;
  if(typeof value==='function'||typeof value==='symbol')return false;
  if(typeof value!=='object')return true;
  if(checked.has(value))return true;checked.add(value);
  const proto=Object.getPrototypeOf(value);
  if(!Array.isArray(value)&&proto!==Object.prototype&&proto!==null)return false;
  for(const key of Object.keys(value)){const d=Object.getOwnPropertyDescriptor(value,key);if(!d||!('value' in d)||!cloneableArt(d.value))return false;}
  return true;
 }
 for(const name of ['honroLandmarks','honroElements']){
  const list=source[name];if(!Array.isArray(list))continue;
  for(const item of list){
   if(!item||typeof item!=='object')continue;
   const asset=Object.getOwnPropertyDescriptor(item,'asset');if(asset&&!('value' in asset))return null;
   const vector=asset?.value&&Object.getOwnPropertyDescriptor(asset.value,'vector');if(vector&&!('value' in vector))return null;
   const v=vector?.value;if(v&&typeof v==='object'){try{if(!cloneableArt(v))return null;}catch(err){if(err instanceof RangeError)return null;throw err;}vectors.add(v);}
  }
 }
 const seen=new WeakMap<object,any>(),marks:object[]=[];
 function project(value:any):any {
  if(value===null||typeof value!=='object')return value;
  const cached=seen.get(value);if(cached)return cached;
  if(vectors.has(value)){const mark={};seen.set(value,mark);marks.push(mark);return mark;}
  const proto=Object.getPrototypeOf(value);
  if(!Array.isArray(value)&&proto!==Object.prototype&&proto!==null)throw unsupported;
  const result:any=Array.isArray(value)?new Array(value.length):{};seen.set(value,result);
  for(const key of Object.keys(value)){
   const desc=Object.getOwnPropertyDescriptor(value,key);
   if(!desc||!('value' in desc))throw unsupported;
   Object.defineProperty(result,key,{value:project(desc.value),writable:true,enumerable:true,configurable:true});
  }
  return result;
 }
 try {
  const packed=structuredClone({battle:project(b),marks}),omitted=new Set(packed.marks),visited=new WeakSet<object>();
  function guard(value:any):void {
   if(!value||typeof value!=='object'||visited.has(value))return;
   visited.add(value);
   for(const key of Object.keys(value)){
    const child=value[key];
    if(omitted.has(child))Object.defineProperty(value,key,{enumerable:true,configurable:true,get(){throw artRead;},set(){throw artRead;}});
    else guard(child);
   }
  }
  guard(packed.battle);return packed.battle;
 } catch(err) {if(err===unsupported||err instanceof RangeError)return null;throw err;}
}

/** Isolated replay with an exact full-clone fallback for unsupported input or art access. */
export function withPredictionBattle<T>(b:Battle,run:(copy:Battle)=>T):T {
 const projected=projectedBattle(b);
 if(projected){try{return run(projected);}catch(err){if(err!==artRead)throw err;}}
 return run(structuredClone(b));
}
