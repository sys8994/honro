/* 6막 지형 저작 v2: exact saved/collision/packet objects are read-only.
 * Native landmark painter owns placement, clipping, fade and terrain cache.
 */
      function mountAct6TerrainArt(app,e) {
        const s=active.get(app),scene=app.scene,b=e?.b;
        const row=act6TerrainArtRows[b?.honroStage];
        if(!row||!s?.normal51||s.engine!==e||s.b!==b||b.mode!=='campaign'||
          b.honroCanonical!==true||b.honroCustom!==false||app.engine!==e||
          !Array.isArray(b.honroLandmarks)||!scene||typeof scene._landmarkLayer!=='function'||s.terrainArt)return;
        const layouts=JSON.parse(row),layer=scene._landmarkLayer,replacements=new Map(),base=b.honroLandmarks;
        let expected=0,faces=0;
        for(const item of base){
          const asset=item.asset,key=asset?.id,layout=layouts[key];
          if(!layout)continue;
          const [count,palette,paths]=layout;
          if(item.x!==0||item.y!==0||item.scale!==1||item.rotation!==0||item.collisionIds?.length!==0||
             asset?.collision?.length!==0||asset.visual?.length!==count)continue;
          expected++;
          const paint=paths.map(([color,...coords],i)=>{
            const points=[];for(let j=0;j<coords.length;j+=2) points.push({x:coords[j]/10,y:coords[j+1]/10});
            return {id:'act6-terrain-face-'+key+'-'+i,fill:palette[color],points};
          });
          faces+=paint.length;
          replacements.set(item,{...item,asset:{...asset,visual:[...asset.visual,...paint]}});
        }
        if(expected!==Object.keys(layouts).length||faces<1)return;
        const valid=()=>active.get(app)===s&&app.engine===e&&app.scene===scene&&s.b===b&&b.honroLandmarks===base;
        let drawCalls=0,hits=0;
        function terrainLayer(c,list,...args){
          if(this!==scene||this.battle!==b||!valid()||!Array.isArray(list))return layer.call(this,c,list,...args);
          let found=0;
          const projected=list.map(x=>{const next=replacements.get(x);if(next)found++;return next??x;});
          if(found){drawCalls++;hits+=found;}
          const ret=layer.call(this,c,found?projected:list,...args);
          if(found)scene.act6TerrainArtStats={stage:b.honroStage,revision:2,sources:expected,faces,drawCalls,hits};
          return ret;
        }
        scene._landmarkLayer=terrainLayer;
        s.terrainArt={dispose(){if(scene._landmarkLayer===terrainLayer)scene._landmarkLayer=layer;}};
      }
