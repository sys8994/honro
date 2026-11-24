      function mountNormalLateFar(app,e,s){
        const b=e.b,id=b.honroStage,scene=app.scene;
        if(!descriptor.normalLateFar||![58,59].includes(id)||s.normalLateFar)return;
        const owner=id===58?s.owner58:s.owner59,scope=id===58?scope58:scope59;
        const owns=()=>owner&&(id===58?s.owner58:s.owner59)===owner&&active.get(app)===s&&s.engine===e&&s.b===b&&app.engine===e&&
          app.scene===scene&&b.honroCanonical===true&&b.honroCustom===false&&normal51Provider.content(b)===e.stage&&scope(app,e,s);
        if(!owns())return;
        const permit=Object.freeze({}),v=Object.freeze({stage:id,battle:b,scene});
        const verify=(p,a,en,sc)=>p===permit&&a===app&&en===e&&sc===scene&&owns()?v:null;
        const disposers=[];
        if(id===58){
          const roles=['a6-c08-boss','a6-c08-expansion-node'].map(r=>s.prepared58?.reserved.find(u=>u.id===r)),four=b.units.filter(u=>u.side===0&&!u.summoned);
          const far=mountStage58Far(G,app,e,scene,owns);
          const floor=attachStage58FloorFacets({G,app,e,scene,permit,verify});
          const camera=roles.every(Boolean)&&four.length===4?attachStage58Camera(G,scene,e,roles,four,owns):null;
          disposers.push(()=>camera?.(),()=>floor?.detach(),()=>far?.dispose());
          s.normalLateFar={kind:58,far,floor,camera,dispose:()=>disposers.forEach(d=>d())};
        }else{
          const asset=descriptor.normalLateFar.plate59,im=new G.Image(),abort=new G.AbortController();
          const visual=attachStage59Visual({G,app,engine:e,scene,permit,verify,image:im,verifiedFarHash:asset.sha});
          const matte=attachStage59Matte({G,app,e,scene,permit,verify});
          const paw=attachStage59Forepaw({G,app,e,scene,owner,owns});
          let destroyed=false;
          async function request(){
            try{
              const url=new G.URL('.'+asset.path,G.location.href);
              if(url.origin!==G.location.origin||!url.pathname.endsWith(asset.path)||url.search||url.hash)return false;
              const res=await G.fetch(url.href,{credentials:'omit',redirect:'error',signal:abort.signal});
              if(!res.ok||res.url!==url.href)return false;
              const raw=await res.arrayBuffer();
              if(raw.byteLength!==asset.bytes||await sha(raw)!==asset.sha||!owns()||destroyed)return false;
              const object=G.URL.createObjectURL(new G.Blob([raw],{type:'image/webp'}));
              try{im.src=object;await im.decode();}finally{G.URL.revokeObjectURL(object);}
              return im.naturalWidth===1672&&im.naturalHeight===941&&owns()&&!destroyed;
            }catch{return false;}
          }
          s.normalLateFar={kind:59,visual,matte,paw,ready:request(),dispose(){
            destroyed=true;abort.abort();paw?.detach();matte?.detach();visual?.detach();
          }};
        }
      }
