/* Act 6 native vector paint. No engine, signed packet, physics or storage writes. */
      function mountAct6TerrainArt(app,e) {
        const s=active.get(app),scene=app.scene,b=e?.b,id=b?.honroStage;
        const row=descriptor.terrainArt?.[id];
        if(!row||!s?.normal51||s.engine!==e||s.b!==b||b.mode!=='campaign'||
          b.honroCanonical!==true||b.honroCustom!==false||app.engine!==e||
          !scene||typeof scene._landmarkLayer!=='function'||s.terrainArt)return;
        const layer=scene._landmarkLayer,cache=new WeakMap(),abort=new G.AbortController();
        let layouts=null;
        const valid=()=>active.get(app)===s&&app.engine===e&&app.scene===scene&&s.b===b;
        function project(base,frame){
          if(!Array.isArray(base)||!['N','L','C'].includes(frame))return null;
          const prior=cache.get(base);if(prior?.frame===frame)return prior;
          const replacements=new Map(),known=new Map(),seen=new WeakMap();let sources=0,faces=0;
          for(const item of base){
            const asset=item.asset,key=asset?.id,layout=layouts[key];
            if(!layout)continue;
            const [count,palette,paths]=layout;
            if(item.x!==0||item.y!==0||item.scale!==1||item.rotation!==0||item.collisionIds?.length!==0||
               asset?.collision?.length!==0||asset.visual?.length!==count)continue;
            sources++;
            const paint=paths.map(([color,...coords],i)=>{
              const points=[];
              for(let j=0;j<coords.length;j+=2){
                const x=coords[j]/10,y=coords[j+1]/10;
                points.push(frame==='L'?{x:y,y:3200-x}:frame==='C'?{x:3200-x,y:3000-y}:{x,y});
              }
              return {id:'act6-terrain-face-'+key+'-'+i,fill:palette[color],points};
            });
            faces+=paint.length;
            replacements.set(item,{...item,asset:{...asset,visual:[...asset.visual,...paint]}});
            known.set(item.id,{anchor:item,paint});
          }
          if(sources!==Object.keys(layouts).length||faces<1)return null;
          const q={replacements,known,seen,sources,faces,frame};cache.set(base,q);return q;
        }
        let drawCalls=0,hits=0,chartGraph=null,lastFrame=null;
        function terrainLayer(c,list,...args){
          if(!layouts||this!==scene||this.battle!==b||!valid()||!Array.isArray(list))return layer.call(this,c,list,...args);
          const base=b.honroLandmarks;
          if(id===54&&chartGraph!==base){chartGraph=base;lastFrame=s.owner54?.inspect(app,e)?.frame;}
          const view=project(base,id===54?lastFrame:'N');
          if(!view)return layer.call(this,c,list,...args);
          let found=0;
          const projected=list.map(x=>{
            let next=view.replacements.get(x)??view.seen.get(x);
            const k=view.known.get(x?.id);
            // The native final-scene decorators may have added their original
            // local walls and revised colors before delegating to this painter.
            if(!next&&k&&x.asset?.id===k.anchor.asset.id&&x.asset?.visual?.length>=k.anchor.asset.visual.length&&
                x.x===k.anchor.x&&x.y===k.anchor.y&&x.scale===k.anchor.scale&&x.rotation===k.anchor.rotation){
              next={...x,asset:{...x.asset,visual:[...x.asset.visual,...k.paint]}};
              view.seen.set(x,next);
            }
            if(next)found++;return next??x;
          });
          if(found){drawCalls++;hits+=found;}
          const ret=layer.call(this,c,found?projected:list,...args);
          if(found)scene.act6TerrainArtStats={stage:id,revision:2,sources:view.sources,faces:view.faces,frame:view.frame,drawCalls,hits};
          return ret;
        }
        scene._landmarkLayer=terrainLayer;
        s.terrainArt={dispose(){abort.abort();if(scene._landmarkLayer===terrainLayer)scene._landmarkLayer=layer;}};
        async function fetchTerrainFaces(){
          try{
            const url=new G.URL('.'+row.path,G.location.href);
            if(url.origin!==G.location.origin||!url.pathname.endsWith(row.path)||url.search||url.hash)return;
            const res=await G.fetch(url.href,{credentials:'omit',redirect:'error',signal:abort.signal});
            if(!res.ok||res.url!==url.href)return;
            const raw=await res.arrayBuffer();
            if(raw.byteLength!==row.bytes||await sha(raw)!==row.sha||abort.signal.aborted||!valid())return;
            layouts=JSON.parse(new TextDecoder().decode(raw));
            // A cached first frame may have been painted while the stage-only asset downloaded.
            scene._releaseDomainTiles?.();
            if(typeof scene._releaseScreenCaches==='function')scene._releaseScreenCaches();
            else for(const k of ['_screenWorldCache','_screenForegroundCache'])if(scene[k]){
              scene._releaseRasterCanvas?.(scene[k].canvas);scene[k]=null;
            }
          }catch{ /* Keep the signed fallback paint on decode or network failure. */ }
        }
        void fetchTerrainFaces();
      }
