export function firstRenderContract(beforeText,afterText,stage){
 const expected=JSON.parse(beforeText),after=JSON.parse(afterText),added=[];
 if(stage===37){
  const q=expected.honroAct4PreviewState,a=after.honroAct4PreviewState;
  if(!q||!a||typeof q!=='object'||typeof a!=='object')throw Error('Missing initial Act4 state');
  if(!Object.hasOwn(q,'observed')){
   if(!a.observed||typeof a.observed!=='object'||Array.isArray(a.observed)||Object.keys(a.observed).length)throw Error('First render wrote nonempty/invalid observed');
   q.observed={};added.push('observed');
  }
  if(!Object.hasOwn(q,'signalExposure')){
   if(a.signalExposure!==0)throw Error('First render wrote nonzero signalExposure');
   q.signalExposure=0;added.push('signalExposure');
  }
 }
 if(JSON.stringify(expected)!==afterText)throw Error('Unexpected first-render battle mutation');
 return added;
}
