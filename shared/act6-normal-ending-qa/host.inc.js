// Inside QA owner lexical IIFE only. Proven R12 ports, separate normal-QA slot.
function createNormal60Presentation(G, owns) {
  if(!G.isSecureContext||G.location?.origin!==descriptor.origin||!rtPath.includes(G.location.pathname)||G.HONRO_EMBEDDED||
     !G.document?.head||typeof G.HonroScene!=='function'||!G.crypto?.subtle||!G.ResizeObserver)return null;
  const owners=new WeakMap();
  const live=(a,e,p)=>{const r=owners.get(e);return r?.a===a&&r.p===p&&r.profile===a.profile&&r.terminal===r.s.terminal60&&owns(a,e,r.s,p);};
  const slot=create60StockSlot(G,{live,factory:stockSlot60Factory,writePort:createEndingWritePort,basePath:routeBase});
  if(!slot)return null;
  const cuts=createNativeEndingCuts({G,authorize:live,outcomeFor:(a,e)=>owners.get(e)?.terminal,liveCanvas:a=>a.root.querySelector('#battlecanvas'),
    drawLive(a,e,p,canvas){if(!live(a,e,p)||canvas!==a.root.querySelector('#battlecanvas'))return false;a.scene.render(e,0,a.selected,.5,false,0,true);return true;},
    geometryFor(a,e){const q=owners.get(e)?.s.quiet60,t=e.b.terrain.find(v=>v.id===q?.support);return t?{floor:q.support,gate:[q.gate,G.HONRO_CORE.topAt(t,q.gate)],souls:q.souls}:null;}});
  const dom=createEndingDOM({authorize:live,container:a=>a.root,renderNative:cuts.renderNative,verifyNative:cuts.verifyNative,
    resolveAsset:v=>descriptor.normalEndingAssets?.[v.asset]?pathAt(descriptor.normalEndingAssets[v.asset]):'/shared/act6-normal-ending-qa/'+v.asset,writeFinal(a,e,p,req,still){
      return live(a,e,p)&&still()?owners.get(e).write(req,still):{ok:false,reason:'normal-60-slot-unowned'};
    }});
  function mount(a,e,s,p,terminal,ui){
    if(owners.has(e)||!owns(a,e,s,p)||terminal!==s.terminal60)return null;
    const r={a,s,p,terminal,profile:a.profile};owners.set(e,r);
    const style=G.document.createElement('style');style.textContent=STAGE60_ENDING_CSS;
    try{
      r.write=slot.open(a,e,p);if(!r.write)throw Error('Normal 60 QA stock slot unavailable');
      G.document.head.append(style);
      const dispose=dom.mountEnding(a,e,p,ui);
      return ()=>{owners.delete(e);dispose();style.remove();};
    }catch(error){owners.delete(e);style.remove();throw error;}
  }
  return Object.freeze({mount,read:dom.readPanelFrame,trust:dom.trustedUIAction,write:dom.writeEnding});
}
