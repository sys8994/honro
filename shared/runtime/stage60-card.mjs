// Import in the future *owned Act 6 module*, not from a global initializer.
// The ordinary App supplies the already-created instance and its terminal
// owner supplies the exact battle identity and validated chain/DOM view.
const localHandles=new WeakMap();
export function installEndingMission({app,scope,authorize,inspectWin,openEnding,onError=()=>{}}){
 if(!app||scope?.chapter!=='10'||typeof app.checkMission!=='function'||!authorize?.(scope,app))return null;
 if(localHandles.has(app))return null;
 const stock=app.checkMission;
 let opened=false,busy=false;
 function check(e,...args){
  const result=stock.call(this,e,...args);
  if(this!==app||busy||opened||!result||e?.b!==scope.battle||app.engine!==e||
    e.b.phase!=='won'||app.customMap||app.debugMode||app.profile!==app.normalProfile||
    scope.embedded||!authorize(scope,app))return result;
  const sealed=inspectWin(scope,app,e);
  if(!sealed||sealed.exactBattle!==scope.battle)return result;
  busy=true;
  try{
   // No saving here; final Scene/controller requests the narrow stock writer.
   // If opening fails, retry on a later ready frame without repeating store writes.
   opened=openEnding(sealed)===true;
  }catch(error){onError(error);}
  finally{busy=false;}
  return result;
 }
 app.checkMission=check;
 const handle={remove(){if(app.checkMission===check)app.checkMission=stock;localHandles.delete(app);},opened:()=>opened};
 localHandles.set(app,handle);
 return handle;
}
export const cards=Object.freeze({
 Wide:Object.freeze({asset:'img/ending/act6-dawn-pc.png',w:1672,h:941,sha256:'615c0f63f88f7a12613fbecc530b0c0e9e96c9c64ba751fbffa32371bc2cb3b8'}),
 Portrait:Object.freeze({asset:'img/ending/act6-dawn-mobile.png',w:941,h:1672,sha256:'6b5cf66322970b4039a4ad4e2b0987936cd7f77a521066672f67b46428b0eda2'})
});
export function endingCardFor(w,h){
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)throw Error('invalid ending viewport');
 const v=w/h<.95?cards.Portrait:cards.Wide,z=Math.min(w/v.w,h/v.h);
 return {...v,displayWidth:v.w*z,displayHeight:v.h*z};
}
