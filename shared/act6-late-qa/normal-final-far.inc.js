      const normalFinalFar=descriptor.normalFinalFar?createPlayableFar60({G,plate:descriptor.normalFinalFar,authorize(app,e,scene,lease){
        const s=active.get(app),b=e.b;
        return lease===s&&s?.engine===e&&s.b===b&&s.owner60&&app.scene===scene&&b.mode==='campaign'&&
          b.honroAuthoredId==='stage-60'&&b.honroCanonical===true&&b.honroCustom===false&&scope60(app,e,s)&&normal51Provider.content(b)===e.stage;
      }}):null;
      function mountNormalFinalFar(app,e,s){
        const b=e.b;
        if(!normalFinalFar||s.normalFinalFar||s.packet?.trace?.stageId!==60||!s.owner60||!scope60(app,e,s))return;
        const a=fingerprints.get(JSON.stringify(b.terrain)),w=fingerprints.get(JSON.stringify(b.honroWorldTerrain));
        if(!a||!w)return;
        s.normalFinalFar=normalFinalFar.mount({app,engine:e,scene:app.scene,lease:s});
      }
