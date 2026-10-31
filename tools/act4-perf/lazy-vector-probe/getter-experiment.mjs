import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const ctx=vm.createContext({structuredClone});vm.runInContext(await readFile('shared/runtime/profile-store.js','utf8'),ctx);
const run=vm.runInContext(`()=>{
 const sig=t=>{let h=2166136261;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619)}return t.length+':'+(h>>>0).toString(16)};
 const source={id:'approved40:body',name:'original',vector:{version:1,root:{tag:'path',d:'M0 0L2 2',fill:'#ffffff'},viewBox:[0,0,2,2]},tags:['a'],params:{nested:1}};globalThis.HONRO_PROJECT={library:[source]};const S=HonroProfileStore,L=HonroLazyArt;
 const make=()=>{const b={mode:'campaign',honroAct4Official:1,honroStage:40,honroLandmarks:[{asset:{honroStaticAssetRef:1,id:source.id,signature:sig(JSON.stringify(source))}}],honroElements:[]};if(!S.restoreBattleArt(b))throw Error('restore');return b};
 let b=make(),a=b.honroLandmarks[0].asset;if(!L.pending(a)||!Object.isFrozen(L.renderVector(a))||!L.pending(a))throw Error('resolver');if(!S.compactBattleArt(b).honroLandmarks[0].asset.honroStaticAssetRef||!L.pending(a))throw Error('compact');let d=Object.getOwnPropertyDescriptor(a,'vector');if(typeof d.get!=='function')throw Error('getter');const c=structuredClone(a);if(L.pending(a)||!Object.hasOwn(Object.getOwnPropertyDescriptor(a,'vector'),'value')||JSON.stringify(c)!==JSON.stringify(source))throw Error('clone');a.vector.root.d='M5 5';if(S.compactBattleArt(b).honroLandmarks[0].asset.honroStaticAssetRef)throw Error('edited');
 b=make();a=b.honroLandmarks[0].asset;a.name='edited';if(S.compactBattleArt(b).honroLandmarks[0].asset.honroStaticAssetRef||L.pending(a))throw Error('metadata');
 b=make();a=b.honroLandmarks[0].asset;a.params.nested=2;if(S.compactBattleArt(b).honroLandmarks[0].asset.honroStaticAssetRef||L.pending(a))throw Error('nested metadata');
 b=make();a=b.honroLandmarks[0].asset;source.vector.root.d='M8 8';const old=S.compactBattleArt(b).honroLandmarks[0].asset;if(old.honroStaticAssetRef||old.vector.root.d!=='M0 0L2 2')throw Error('provider changed');source.vector.root.d='M0 0L2 2';
 b=make();a=b.honroLandmarks[0].asset;JSON.stringify(a);if(L.pending(a))throw Error('json materialization');
 b=make();a=b.honroLandmarks[0].asset;a.vector={version:77};if(L.pending(a)||a.vector.version!==77)throw Error('setter');
 b=make();a=b.honroLandmarks[0].asset;b.honroCustom=true;if(S.compactBattleArt(b)!==b)throw Error('custom');
 return 'PASS getter, render resolver, clone, mutation, metadata, provider and custom';
}`,ctx);console.log(run());
