(function (G) {
    const H = G.HONRO_CONTENT;
    const pal = { forest: ['#121f25', '#233b39', '#556259'], temple: ['#151e26', '#29383d', '#646f6b'], gate: ['#181d24', '#343c3e', '#7b7e6b'], river: ['#10232a', '#28434b', '#7a9692'], valley: ['#141f27', '#344347', '#758779'], bridge: ['#101f28', '#304249', '#859490'], tree: ['#111d20', '#2d4035', '#747c56'], shrine: ['#1b1725', '#343444', '#837989'] };
    function P(c, pts, fill, stroke, width = 1) { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); if (fill) {
        c.fillStyle = fill;
        c.fill();
    } if (stroke) {
        c.strokeStyle = stroke;
        c.lineWidth = width;
        c.stroke();
    } }
    function L(c, x, y, xx, yy, color, w = 1) { c.beginPath(); c.moveTo(x, y); c.lineTo(xx, yy); c.strokeStyle = color; c.lineWidth = w; c.stroke(); }
    function E(c, x, y, rx, ry, color) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = color; c.fill(); }
    function glyph(c, x, y, r, color, angle = 0) { c.save(); c.translate(x, y); c.rotate(angle); c.strokeStyle = color; c.lineWidth = 1.4; c.beginPath(); c.arc(0, 0, r, 0, 6.283); c.stroke(); P(c, [[0, -r * .7], [r * .6, 0], [0, r * .7], [-r * .6, 0]], null, color); L(c, -r * .25, -r * .35, r * .25, r * .35, color); L(c, r * .25, -r * .35, -r * .25, r * .35, color); c.restore(); }
    function glow(c, x, y, r, col, a = .4) { c.save(); c.globalAlpha = a; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'transparent'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); }
    function building(c, x, y, w, h, kind = 'temple') { c.save(); c.translate(x, y); c.fillStyle = '#263739'; c.fillRect(-w * .43, -h * .76, w * .86, h * .76); for (let i = 0; i < 5; i++)
        L(c, -w * .34 + i * w * .17, -h * .71, -w * .34 + i * w * .17, -4, '#576154', Math.max(2, w * .026)); c.fillStyle = '#19272d'; c.fillRect(-w * .13, -h * .43, w * .26, h * .43); P(c, [[-w * .63, -h * .69], [-w * .5, -h * .72], [-w * .32, -h * .92], [0, -h * 1.08], [w * .32, -h * .92], [w * .5, -h * .72], [w * .63, -h * .69], [w * .43, -h * .82], [-w * .43, -h * .82]], '#1c2b32', '#879080', 1.8); for (let i = -6; i <= 6; i++)
        L(c, i * w * .068, -h * .81, (i * .071) * w, -h * .94 + Math.abs(i) * h * .025, '#727b7377', 1.1); P(c, [[-w * .5, 0], [w * .5, 0], [w * .58, 8], [-w * .58, 8]], '#4a5855'); if (kind === 'gate') {
        P(c, [[-w * .44, -h * .58], [w * .44, -h * .58], [w * .53, -h * .51], [-w * .53, -h * .51]], '#b4946b');
    } c.restore(); }
    function tree(c, x, y, h, spirit = false) { c.save(); c.translate(x, y); c.lineCap = 'round'; let col = spirit ? '#39463d' : '#203b33'; L(c, 0, 0, -h * .035, -h * .78, col, h * .095); L(c, -h * .025, -h * .42, -h * .29, -h * .69, col, h * .043); L(c, -h * .035, -h * .57, h * .28, -h * .80, col, h * .037); L(c, -h * .22, -h * .66, -h * .32, -h * .87, col, h * .02); L(c, h * .18, -h * .75, h * .30, -h * .92, col, h * .016); if (!spirit) {
        for (let i = 0; i < 9; i++) {
            const a = i * 2.4;
            E(c, Math.cos(a) * h * .23, -h * .82 + Math.sin(a) * h * .1, h * .22, h * .10, '#304c3d');
        }
    }
    else {
        L(c, -h * .02, -h * .65, -h * .1, -h * .95, '#536147', h * .02);
        for (let i = 0; i < 9; i++) {
            const xx = Math.sin(i * 5) * h * .24;
            L(c, xx, -h * .62, xx + 3, -h * .48, '#93695677', 1);
        }
    } c.restore(); }
    class Scene {
        constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.x = 800; this.y = 850; this.scale = .7; this.manual = false; this.time = 0; this.effects = []; this.theme = 'forest'; this._staticWorldCache=null; this._backgroundCache=null; this._cacheStats={worldBuilds:0,worldBuildMs:0,bgBuilds:0,bgBuildMs:0,worldHits:0,bgHits:0}; this.focusId=null;this.focusUntil=0;this.speakerId=null;this.speakerUntil=0;this.storyTween=null;this.archerVisual = G.HonroArcherVisual ? new G.HonroArcherVisual(G.HONRO_ARCHER,G.HonroVectorRig) : null; this.arcFx = G.HONRO_CORE.Renderer ? new G.HONRO_CORE.Renderer(canvas) : null; }
        finaleRitual(c,b){
            const v=b.units.find(u=>u.id==='boss'&&!u.dead);if(!v)return;
            const done=Math.min(6,b.honroState.coopHold||0),t=this.time,scale=this.scale;
            // Two braided ritual cords, with souls visibly flowing out to the receiving stones.
            // Fixed, small path/particle counts; no per-frame surfaces, blur filters or entity spawns.
            c.save();c.lineCap='round';
            for(const m of b.honroMarkers||[])if(m.action==='receiver'&&m.collected){
                const from={x:v.x,y:v.y-34},to={x:m.x,y:m.y-70},bend={x:(v.x+m.x)*.5,y:Math.min(v.y,m.y)-220};
                const at=p=>({x:(1-p)*(1-p)*from.x+2*(1-p)*p*bend.x+p*p*to.x,y:(1-p)*(1-p)*from.y+2*(1-p)*p*bend.y+p*p*to.y});
                for(const [color,width,offset] of [['#151c24cc',7,0],['#a9574bd9',3.2,0],['#d9916266',1,3]]){
                    c.beginPath();c.moveTo(from.x,from.y+offset);c.quadraticCurveTo(bend.x,bend.y+offset,to.x,to.y+offset);c.strokeStyle=color;c.lineWidth=width;c.stroke();
                }
                for(let i=0;i<9;i++){const p=(i/9+t*.09)%1,a=at(p),tail=at(Math.max(0,p-.013));L(c,tail.x,tail.y,a.x,a.y,'#e5c585b0',3);E(c,a.x,a.y,3.5,2.6,'#fff0c9');}
                E(c,m.x,m.y-7,66,17,'#e7c77815');glyph(c,m.x,m.y-70,31,'#d9b879',t*.08);E(c,m.x,m.y-70,9,13,'#efd09588');
                c.fillStyle='#e2c995';c.textAlign='center';c.font=`${11/scale}px sans-serif`;c.fillText('원혼을 받는 중',m.x,m.y+30/scale);
            }
            // Six closed red knots open into gold beads as each full defense is completed.
            E(c,v.x,v.y+3,89,24,'#171920b8');
            for(let i=0;i<6;i++){const a=i*Math.PI/3,x=v.x+Math.cos(a)*75,y=v.y+3+Math.sin(a)*19;
                c.strokeStyle=i<done?'#e9c887':'#a55b52';c.lineWidth=2;c.beginPath();c.ellipse(v.x,v.y+3,75,19,0,a+.08,a+Math.PI/3-.08);c.stroke();
                if(i<done)E(c,x,y,4,4,'#f3d69a');else{c.beginPath();c.ellipse(x-4,y,6,4,-.5,0,Math.PI*2);c.ellipse(x+4,y,6,4,.5,0,Math.PI*2);c.stroke();}
            }
            c.textAlign='center';c.font=`600 ${12/scale}px sans-serif`;c.fillStyle='#e7cf9d';c.fillText(`혼매듭 ${done}/6 · 소단 보호`,v.x,v.y+47/scale);
            for(const site of b.honroState.finaleSites||[]){
                E(c,site.x,site.y-52,30,52,'#301e2bd9');c.strokeStyle='#a35c5f';c.lineWidth=2;c.beginPath();c.ellipse(site.x,site.y-52,30,52,0,Math.PI,Math.PI*2);c.stroke();
                for(let i=0;i<4;i++){const p=(i/4+t*.2)%1;c.globalAlpha=(1-p)*.65;E(c,site.x+Math.sin(i*5+t)*22,site.y-25-p*120,4,12,'#c7786f');}c.globalAlpha=1;
                c.fillStyle='#deb6aa';c.font=`${11/scale}px sans-serif`;c.fillText(site.label+' · 들림 출몰',site.x,site.y+30/scale);
            }
            c.restore();
        }
        focusUnit(id,ms=900,speaker=false){this.focusId=id;this.focusUntil=performance.now()+ms;if(speaker){this.speakerId=id;this.speakerUntil=performance.now()+ms;}this.manual=false;}
        storyScale(){const {w,h}=this.size(),short=Math.min(w,h),base=Math.max(.55,Math.min(.82,.55+(short-390)*.00045));return h>w*1.1?base*.9:base;}
        storyFocus(id,duration=500,targetScale=null,close=false){this.storyTween={kind:'unit',id,start:performance.now(),duration,from:{x:this.x,y:this.y,scale:this.scale},targetScale:close?Math.max(.3,Math.min(1.15,targetScale||1.05)):Math.min(targetScale??Infinity,this.storyScale())};this.manual=false;this.speakerId=null;this.speakerUntil=0;}
        storyFocusPoint(x,y,duration=500,targetScale=null){const {h}=this.size(),scale=targetScale==null?this.storyScale():Math.max(.3,Math.min(1.15,targetScale));this.storyTween={kind:'static',start:performance.now(),duration,from:{x:this.x,y:this.y,scale:this.scale},to:{x,y:y-h*.10/scale,scale},manual:false};this.manual=false;this.speakerId=null;this.speakerUntil=0;}
        storyRelease(camera,duration=450){if(!camera)return;this.storyTween={kind:'static',start:performance.now(),duration,from:{x:this.x,y:this.y,scale:this.scale},to:{x:camera.x,y:camera.y,scale:camera.scale},manual:camera.manual};}
        event(ev) { if (this.arcFx) { this.arcFx.event(ev); return; } if (ev.type === 'fx') this.effects.push({ ...ev, life: 0 }); }
        size() { const r = this.canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 1.7), w = Math.max(1, r.width), h = Math.max(1, r.height); if (this.canvas.width !== Math.round(w * d) || this.canvas.height !== Math.round(h * d)) {
            this.canvas.width = Math.round(w * d);
            this.canvas.height = Math.round(h * d);
        } return { w, h, d }; }
        world(sx, sy) { const r = this.canvas.getBoundingClientRect(); return G.HonroCamera.world(this,r.width,r.height,sx,sy); }
        zoom(f, sx, sy) { const a = this.world(sx, sy), r = this.canvas.getBoundingClientRect(),limits=G.HonroBounds.zoomLimits(r.width); this.scale = Math.max(limits.min, Math.min(limits.max, this.scale * f)); this.x = a.x - (sx - r.width / 2) / this.scale; this.y = a.y - (sy - r.height / 2) / this.scale; if(this.battle)G.HonroBounds.constrain(this,this.battle);this.manual = true; }
        _makeLayerCanvas(w,h){const cv=document.createElement('canvas');cv.width=Math.max(1,Math.ceil(w));cv.height=Math.max(1,Math.ceil(h));return cv;}
        _worldRasterScale(b,w){if(G.HonroTerrainDomain?.active(b))return Math.min(.68,Math.max(.05,2**(Math.floor(Math.log2(this.scale*1.25)*4)/4)));const mobile=w<900,maxPixels=mobile?3000000:6000000,desired=this.scale>.72?.68:this.scale>.38?.56:.42,cap=Math.sqrt(maxPixels/Math.max(1,b.width*b.height));return Math.max(.28,Math.min(desired,cap));}
        _landmarkLayer(c,landmarks,layer){c.save();for(const l of landmarks){if((l.layer||'back')!==layer)continue;c.globalAlpha=l.opacity??1;this.landmark?.(c,l);}c.restore();}
        _landmarkVisible(l,view,padding=40){
            const bounds=l.asset?.bounds||l.asset?.reference?.bounds;
            if(bounds&&G.HonroGeometry){const ps=[[bounds.x,bounds.y],[bounds.x+bounds.w,bounds.y],[bounds.x,bounds.y+bounds.h],[bounds.x+bounds.w,bounds.y+bounds.h]].map(([x,y])=>G.HonroGeometry.transformPoint({x,y},l.asset,l));return Math.max(...ps.map(p=>p.x))+padding>=view.left&&Math.min(...ps.map(p=>p.x))-padding<=view.right&&Math.max(...ps.map(p=>p.y))+padding>=view.top&&Math.min(...ps.map(p=>p.y))-padding<=view.bottom;}
            const reach=3000*Math.max(.2,Math.abs(l.scale??l.size??1));return l.x+reach>=view.left&&l.x-reach<=view.right&&l.y+reach>=view.top&&l.y-reach<=view.bottom;
        }
        _worldCacheKey(b,w){const rs=this._worldRasterScale(b,w);return`${b.session||b.honroStage}:${b.sceneVersion||0}:${b.width}x${b.height}:${rs.toFixed(3)}:${G.HonroAct2SpatialArt?.appearanceKey(b)||''}`;}
        _buildStaticWorld(b,w){
            const key=this._worldCacheKey(b,w);if(this._staticWorldCache?.key===key){this._cacheStats.worldHits++;return this._staticWorldCache;}
            const t0=performance.now(),rs=this._worldRasterScale(b,w),cv=this._makeLayerCanvas(b.width*rs,b.height*rs),cc=cv.getContext('2d',{alpha:true});cc.setTransform(rs,0,0,rs,0,0);cc.clearRect(0,0,b.width,b.height);
            const oldAll=this._staticCacheBuild;this._staticCacheBuild=true;
            this._landmarkLayer(cc,b.honroLandmarks||[],'back');
            this._landmarkLayer(cc,b.honroLandmarks||[],'structural-back');
            for(const t of b.terrain||[])if(!t.broken)this.terrain(cc,t);
            this.surfaceZones?.(cc,b);
            this._landmarkLayer(cc,b.honroLandmarks||[],'mid');
            this._landmarkLayer(cc,b.honroLandmarks||[],'prop');
            this._landmarkLayer(cc,b.honroLandmarks||[],'front');
            this.terrainReadability?.(cc,b);
            this._staticCacheBuild=oldAll;this._staticWorldCache={key,canvas:cv,rs,w:b.width,h:b.height,bytes:cv.width*cv.height*4};this._cacheStats.worldBuilds++;this._cacheStats.worldBuildMs+=performance.now()-t0;return this._staticWorldCache;
        }
        _drawStaticWorldCached(c,b,w,h){
            if(G.HonroTerrainDomain?.active(b))return this._drawTerrainDomainTiles(c,b,w,h);
            const q=this._buildStaticWorld(b,w);c.drawImage(q.canvas,0,0,q.canvas.width,q.canvas.height,0,0,b.width,b.height);
            // The raster is bounded to the physical map; the artwork is not. Continue
            // boundary trees/buildings outside it without growing the memory-capped bitmap
            // or clipping them again at an arbitrary padding distance.
            const view=G.HonroBounds.viewport(this,w,h);
            if(view.left>=0&&view.top>=0&&view.right<=b.width&&view.bottom<=b.height)return;
            const candidates=(b.honroLandmarks||[]).filter(l=>{
                const r=1500*Math.max(.2,Math.abs(l.scale??l.size??1));
                return (l.x-r<0||l.x+r>b.width||l.y-r<0||l.y+r>b.height)&&l.x+r>view.left&&l.x-r<view.right&&l.y+r>view.top&&l.y-r<view.bottom;
            });
            if(!candidates.length)return;
            c.save();c.beginPath();c.rect(view.left-1,view.top-1,view.right-view.left+2,view.bottom-view.top+2);c.rect(0,0,b.width,b.height);c.clip('evenodd');
            for(const layer of ['back','structural-back','mid','prop','front'])this._landmarkLayer(c,candidates,layer);
            c.restore();
        }
        _drawTerrainDomainTiles(c,b,w,h){
            // Geographically fixed tiles, never a bitmap cut at Play Bounds.
            // Pixel-aligned clips consume each gutter sample exactly once.
            const rs=this._worldRasterScale(b,w),px=512,gutter=2,size=px/rs,v=G.HonroBounds.viewport(this,w,h),domain=b.honroTerrainBounds,
                key=this._worldCacheKey(b,w),limit=w<900?12:24;
            let q=this._domainTiles;if(!q||q.key!==key){q=this._domainTiles={key,tiles:new Map(),rs};this._cacheStats.worldBuilds++;}
            const minX=Math.floor(Math.max(v.left,domain.left)/size),maxX=Math.floor(Math.min(v.right,domain.right)/size),
                minY=Math.floor(Math.max(v.top,domain.top)/size),maxY=Math.floor(Math.min(v.bottom,domain.bottom)/size),terrain=G.HonroTerrainDomain.render(b);
            const old=this._staticCacheBuild;this._staticCacheBuild=true;
            for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
                const id=x+':'+y;let tile=q.tiles.get(id);if(tile){q.tiles.delete(id);q.tiles.set(id,tile);this._cacheStats.worldHits++;}
                else{const start=performance.now(),cv=this._makeLayerCanvas(px+gutter*2,px+gutter*2),cc=cv.getContext('2d',{alpha:true}),left=x*size,top=y*size;cc.setTransform(rs,0,0,rs,gutter-left*rs,gutter-top*rs);
                    const landmarks=(b.honroLandmarks||[]).filter(l=>this._landmarkVisible(l,{left,top,right:left+size,bottom:top+size}));
                    this._landmarkLayer(cc,landmarks,'back');this._landmarkLayer(cc,landmarks,'structural-back');
                    for(const t of terrain)if(!t.broken&&t.x+t.w>=left&&t.x<=left+size&&t.y+t.h>=top&&t.y<=top+size)this.terrain(cc,t);
                    this.surfaceZones?.(cc,b);for(const layer of ['mid','prop','front'])this._landmarkLayer(cc,landmarks,layer);
                    this.terrainReadability?.(cc,b,{left,top,right:left+size,bottom:top+size});
                    tile={canvas:cv,left,top};q.tiles.set(id,tile);this._cacheStats.domainTileBuilds=(this._cacheStats.domainTileBuilds||0)+1;this._cacheStats.worldBuildMs+=performance.now()-start;
                }
                const matrix=c.getTransform(),sx=Math.round(tile.left*matrix.a+matrix.e),sy=Math.round(tile.top*matrix.d+matrix.f),ex=Math.round((tile.left+size)*matrix.a+matrix.e),ey=Math.round((tile.top+size)*matrix.d+matrix.f);
                c.save();c.beginPath();c.rect((sx-matrix.e)/matrix.a,(sy-matrix.f)/matrix.d,(ex-sx)/matrix.a,(ey-sy)/matrix.d);c.clip();c.drawImage(tile.canvas,0,0,px+gutter*2,px+gutter*2,tile.left-gutter/rs,tile.top-gutter/rs,size+gutter*2/rs,size+gutter*2/rs);c.restore();
            }
            this._staticCacheBuild=old;
            while(q.tiles.size>limit)q.tiles.delete(q.tiles.keys().next().value);
            this._staticWorldCache={key,rs,bytes:q.tiles.size*(px+gutter*2)**2*4};
        }
        renderCacheStats(){return{...this._cacheStats,worldBytes:this._staticWorldCache?.bytes||0,worldScale:this._staticWorldCache?.rs||0,backgroundBytes:this._backgroundCache?.bytes||0};}
        render(e, dt = 0, selected = '', power = .6, charging = false, effectDt = dt) {
            const { w, h, d } = this.size(), c = this.ctx, b = e.b;
            this.battle=b;
            const resized=this._cameraWidth!==undefined&&(this._cameraWidth!==w||this._cameraHeight!==h);
            // Read HUD layout only on first layout/resize, never per frame.
            // The full-width header container is transparent; only its info
            // panel and pause button can obscure the selected actor marker.
            if(resized||this._cameraWidth===undefined){const root=this.canvas.closest?.('.battle'),view=this.canvas.getBoundingClientRect(),rects=['.battle-info','.battle-head>button'].map(selector=>root?.querySelector(selector)?.getBoundingClientRect()).filter(r=>r&&r.width>0&&r.height>0);this._cameraHeader=rects.length?{left:Math.min(...rects.map(r=>r.left))-view.left,right:Math.max(...rects.map(r=>r.right))-view.left,top:Math.min(...rects.map(r=>r.top))-view.top,bottom:Math.max(...rects.map(r=>r.bottom))-view.top}:null;}
            // A resize preserves horizontal world span, bounded by readability.
            // Editor inspection and skill demonstrations may use wider views.
            if(!this.editorView&&!this.skillPreview&&this._cameraWidth&&this._cameraWidth!==w){const limits=G.HonroBounds.zoomLimits(w);this.scale=Math.max(limits.min,Math.min(limits.max,this.scale*w/this._cameraWidth));}
            this._cameraWidth=w;this._cameraHeight=h;
            this.time += effectDt;
            const walkDt=effectDt>0?dt:0;this.walkTime=(this.walkTime||0)+walkDt;
            this.archerVisual?.update(e,this.time,walkDt);
            if(!this.partyVisual&&G.HonroPartyVisual)this.partyVisual=new G.HonroPartyVisual(G.HONRO_PARTY,G.HonroVectorRig,this.archerVisual);
            this.partyVisual?.update(e,this.time,walkDt);
            const st = H.stages[(b.honroStage || 1) - 1] || H.stages[0];
            this.theme = b.honroBackdrop || st.theme;
            const ps = pal[this.theme];
            c.setTransform(d, 0, 0, d, 0, 0);
            c.clearRect(0, 0, w, h);
            const u = e.active,reviewing=b.phase==='review'||b.phase==='ally'&&b.honroState?.allyQueue?.phase==='after'||b.phase==='summon'&&b.summonTurn?.stage==='wait'&&!b.projectiles.length;
            if (!this.manual && u) {
                const now=performance.now(),focus=this.focusId&&now<this.focusUntil?b.units.find(v=>v.id===this.focusId):null;
                const speaking=this.speakerId&&now<this.speakerUntil?b.units.find(v=>v.id===this.speakerId):null;
                const actorFollow=!this.editorView&&!this.skillPreview&&!this.storyTween&&!this.goalFocus&&!speaking&&!focus&&!reviewing&&!b.projectiles?.length;
                if(resized&&actorFollow){const limits=G.HonroBounds.zoomLimits(w);this.scale=Math.max(limits.min,G.HonroCamera.fitFollowScale(u,h,this.scale));}
                let tx=u.x+(b.phase==='aim'?(u.facing||1)*Math.min(170,w/this.scale*.19):0),ty=G.HonroCamera.followY(u,h,this.scale),speed=4.2;
                if(actorFollow){const safeX=G.HonroCamera.avoidHeaderX(u,tx,ty,w,h,this.scale,this._cameraHeader);if(resized&&safeX!==tx)this.x=safeX;tx=safeX;}
                if(speaking){tx=speaking.x;ty=speaking.y-speaking.h*.8;speed=6.4;}
                else if(b.projectiles?.length){const q=b.projectiles.find(q=>!q.child)||b.projectiles[0];tx=q.x;ty=q.y;speed=7.0;}
                else if(reviewing&&b.reviewFocus){tx=b.reviewFocus.x;ty=b.reviewFocus.y;speed=7.2;}
                else if(focus){tx=focus.x;ty=focus.y-focus.h*.65;speed=6.0;}
                this.x+=(tx-this.x)*Math.min(1,dt*speed);
                // Resize also occurs while a pause dialog freezes dt. Reframe
                // automatic follow immediately; never steal manual/story focus.
                if(resized&&!this.storyTween&&!this.goalFocus)this.y=ty;
                else this.y+=(ty-this.y)*Math.min(1,dt*speed);
            }
            if(this.storyTween){
                const tw=this.storyTween,now=performance.now(),raw=Math.max(0,Math.min(1,(now-tw.start)/tw.duration)),ease=raw*raw*(3-2*raw);
                let to=tw.to;
                if(tw.kind==='unit'){const v=b.units.find(v=>v.id===tw.id&&!v.dead);if(v){const sc=tw.targetScale??this.storyScale(),mid=v.y-v.h*.48;to={x:v.x,y:mid-h*.12/sc,scale:sc};}}
                if(to){this.x=tw.from.x+(to.x-tw.from.x)*ease;this.y=tw.from.y+(to.y-tw.from.y)*ease;this.scale=tw.from.scale+(to.scale-tw.from.scale)*ease;}
                if(raw>=1){if(tw.kind==='unit'){this.storyTween={...tw,from:to,to,duration:1,start:now-1};}else{this.manual=!!tw.manual;this.storyTween=null;}}
            }
            if(this.goalFocus&&!this.storyTween){this.x=this.goalFocus.x;this.y=this.goalFocus.y-h*.10/this.scale;}
            else if(!this.storyTween&&!this.skillPreview){G.HonroBounds.constrain(this,b);}
            if(this.background)this.background(c,w,h,b);
            this.backgroundReadability?.(c,w,h,b);
            this.weatherParticles(c,b,w,h,effectDt);
            c.save();
            c.translate(w / 2, h / 2);
            c.scale(this.scale, this.scale);
            c.translate(-this.x, -this.y);
            this.terrainSkirt(c,b,w,h);
            // Static scenery is by far the dominant cost on detailed maps. At normal/zoomed-out
            // views rasterize it once per sceneVersion; keep live vectors only for close inspection.
            if(this.scale<=1.05){this._drawStaticWorldCached(c,b,w,h);}else{
                const view=G.HonroBounds.viewport(this,w,h),visibleLandmarks=(b.honroLandmarks||[]).filter(l=>this._landmarkVisible(l,view));
                this._landmarkLayer(c,visibleLandmarks,'back');
                this._landmarkLayer(c,visibleLandmarks,'structural-back');
                for(const t of (G.HonroTerrainDomain?.render(b)||b.terrain||[])){if(t.broken||t.x+t.w<this.x-w/this.scale||t.x>this.x+w/this.scale)continue;this.terrain(c,t);}
                this.surfaceZones?.(c,b);
                this._landmarkLayer(c,visibleLandmarks,'mid');
                this._landmarkLayer(c,visibleLandmarks,'prop');
                this._landmarkLayer(c,visibleLandmarks,'front');
                this.terrainReadability?.(c,b,view);
            }
            // Animated water lives outside the world raster cache; its collision and
            // conduction geometry remain in the canonical static map.
            this.liveWater?.(c,b);
            // Grade scenery before actors, targeting guides and labels so deeper
            // nights retain the same readable combat colors in every entry point.
            if(this.environmentTone){c.save();c.setTransform(d,0,0,d,0,0);this.environmentTone(c,w,h,b);c.restore();}
            for (const a of b.honroMarkers || []) {
                if (a.collected||a.type==='sector'||a.type?.startsWith('act2')||G.HonroAct3?.active(b)&&(a.type?.startsWith('act3')||a.action==='act3'||a.type==='exit'))
                    continue;
                const pulse = Math.sin(this.time * 3) * 3;
                if (a.type === 'relic') {
                    glow(c, a.x, a.y - 25, 45, '#c6c594', .28);
                    P(c, [[a.x - 8, a.y - 34], [a.x + 7, a.y - 30], [a.x + 5, a.y - 9], [a.x - 8, a.y - 11]], '#d2c39d', '#aa7865', 1.5);
                    glyph(c, a.x, a.y - 23, 5, '#8c4843');
                }
                else if (a.type === 'exit') {
                    for (let i = 0; i < 2; i++)
                        L(c, a.x - 40 + i * 80, a.y, a.x - 40 + i * 80, a.y - 150, '#526152', 8);
                    L(c, a.x - 55, a.y - 150, a.x + 55, a.y - 150, '#9a8461', 9);
                    glyph(c, a.x, a.y - 95, 24, '#ceb986', this.time * .12);
                }
                else if(a.type==='rest'){P(c,[[a.x-21,a.y-12],[a.x+20,a.y-12],[a.x+11,a.y-1],[a.x-13,a.y-1]],'#737760','#2c3b34',1);glow(c,a.x,a.y-18,34,'#d9a76b',.25);for(let i=0;i<3;i++)E(c,a.x-8+i*8,a.y-21-Math.sin(this.time*3+i)*4,3,10,'#b9966180');}else {
                    building(c, a.x, a.y, 110, 110);
                    glow(c, a.x, a.y - 65, 50, '#b7c498', .3);
                }
            }
            for (const f of b.fields || []) {
                if (f.dead)
                    continue;
                const rr = f.r || f.radius || 100;
                this.field(c, f.x, f.y, rr, f.kind || f.type || 'gravity');
            }
            // The boundary is the exact projectile attraction radius in Engine.
            for(const v of b.units)if(!v.dead&&v.summonKind==='eater'){
                c.save();c.globalAlpha=.24;c.strokeStyle='#c8d2be';c.lineWidth=1/this.scale;c.setLineDash([3/this.scale,8/this.scale]);c.beginPath();c.arc(v.x,v.y-v.h*.5,200+Math.max(1,Math.min(8,v.summonRank||1))*15,0,Math.PI*2);c.stroke();c.restore();
            }
            G.HONRO_CORE.drawStakes(c,e,this.time);
            if(b.honroStage===10&&b.honroState?.sodanCoop)this.finaleRitual(c,b);
            for (const z of b.zones || []) {
                if (z.dead)
                    continue;
                this.field(c, z.x, z.y, z.radius || z.r || 80, z.kind || 'flame');
            }
            if (!this.storyFrozen && u && b.phase === 'aim' && !u.summoned && selected && e.canAct?.()) {
                try {
                    const repeat=u.cls==='archer'&&((u.ranks?.AP01||0)>0);
                    if(this.arcFx){this.arcFx.time=this.time;this.arcFx.scale=this.scale;this.arcFx.predictionGuide(c,e,u,selected,power,charging,repeat);}
                } catch { }
            }
            if(!this.storyFrozen&&b.phase==='flight')G.HONRO_CORE.drawTurnGuide(c,e,this.scale,this.turnTarget);
            const visibleUnits=[];
            for (const v of b.units || []) {
                if (v.dead || v.x < this.x - w / (2*this.scale) - Math.max(180,v.h*2) || v.x > this.x + w / (2*this.scale) + Math.max(180,v.h*2) || v.y < this.y-h/(2*this.scale)-Math.max(180,v.h*2) || v.y-v.h*2 > this.y+h/(2*this.scale)+180)
                    continue;
                visibleUnits.push(v);
                this.unit(c, v, !this.skillPreview && v.id === b.active, charging && v.id === b.active ? power : 0);
                if(!G.HonroAct2||G.HonroAct2.visible(b,v))G.HonroCombatStatus.draw(c,b,v,this.time,this.scale,!this.skillPreview&&v.id===b.active);
            }
            if(!this.skillPreview){this.occludedUnitSilhouettes(c,b,visibleUnits,charging?power:0);this.tacticalUnitMarkers(c,b,visibleUnits);}
            this.terrainHealth(c,b,w,h);
            G.HONRO_CORE.drawCombatPassives(c,e,this.time);
            this.reviewSummary=reviewing?Object.entries(b.reviewDamage||{}).filter(([id,damage])=>damage>0&&e.unit(id)&&(!G.HonroAct2||G.HonroAct2.visible(b,e.unit(id)))).map(([id,damage])=>({attacker:u?.name||'',target:e.unit(id),damage:Math.round(damage)})):[];
            if(this.arcFx)this.arcFx.time=this.time;
            for (const q of b.projectiles || []) if (!q.dead) {
                if(this.partyVisual?.projectile?.(c,q,e))continue;
                if(this.arcFx){ if(q.body)this.arcFx.bodyTrail(c,q); else this.arcFx.projectile(c,q); }
                else this.projectile(c,q);
            }
            if(this.arcFx)this.arcFx.worldFx(c,effectDt,false,effectDt>0?dt:0); else {
                for (const fx of this.effects) { fx.life += effectDt; this.effect(c, fx); }
                this.effects = this.effects.filter(x => x.life < (x.name === 'text' ? 1.6 : .9));
            }
            c.restore();
            this.chargeFx(e,power,charging);
            G.HonroObjectives?.draw(this,e);
        }
        weatherParticles(c,b,w,h,dt){
            // L5 screen particles share the actual gameplay wind vector.
            // Integrate new frames only, rather than time * current wind.
            const wind=Number.isFinite(b.wind)?b.wind:0;
            this.weatherX=(this.weatherX||0)+wind*dt;
            if(b.honroEnvironment?.skyVisible===false)return;
            for(let i=0;i<26;i++){
                const motion=G.HONRO_CORE.weatherParticleMotion(wind,18+i%5*3,1.7);
                const xx=((i*193+this.weatherX*1.7)%(w+50)+w+50)%(w+50),yy=(i*101+this.time*motion.vy)%(h+30);
                c.save();c.translate(xx,yy);c.rotate(motion.angle);
                P(c,[[-3,0],[0,-1.5],[4,0],[0,2]],i%4?'#9daf9840':'#e0d4b259');c.restore();
            }
        }
        // Durability is combat state, never part of the static scenery bitmap.
        // Keep labels and bars in screen pixels at every gameplay zoom.
        terrainHealthTargets(b){
            const objectives=(b.honroObjectives||[]).filter(o=>o.type==='destroy'),steps=G.HonroAct2?.active(b)?G.HonroAct2.steps(b):G.HonroAct3?.active(b)?G.HonroAct3.steps(b):[];
            return (b.terrain||[]).flatMap(t=>{
                if(t.broken||t.indestructible||!Number.isFinite(t.hp)||t.hp>=9999||!Number.isFinite(t.maxHp)||t.maxHp<=0)return [];
                const objective=objectives.find(o=>o.targetId===t.id||o.targetId===t.honroElementId),step=steps.find(o=>o.kind==='destroy'&&o.id===t.id);
                const event=!!(t.honroSeal||t.honroAct2Target||t.honroAct3Target||t.device||objective||step);
                if(!event&&t.hp>=t.maxHp)return [];
                const title=objective?.label||step?.label||(t.id==='cliff-cleat'?'고리쇠':t.id.startsWith('bier-knot-')?'상여 결박':t.honroSeal?'봉인':({ward:'결계 장치',sluice:'수문',wind:'바람 장치'})[t.device])||'파괴 가능한 지형';
                let blocked='';
                if(b.honroStage===5&&t.id==='cliff-cleat'&&!b.honroState?.ritual?.active)blocked='물틈 닫힘 · 담허의 받이진 필요';
                else if(G.HonroAct2?.active(b)&&t.id==='upper-chain'&&!b.honroState?.act2?.silenced)blocked='공명 억제 후 파괴 가능';
                else if((G.HonroAct2?.active(b)||G.HonroAct3?.active(b))&&step?.requiredClass&&b.units.find(u=>u.id===b.active)?.cls!==step.requiredClass)blocked=(H.hero[step.requiredClass]?.name||'동행')+'의 사격 필요';
                return [{id:t.id,x:t.x+t.w/2,y:t.y,label:title,event,blocked,hp:Math.max(0,t.hp),maxHp:t.maxHp}];
            });
        }
        terrainHealth(c,b,w,h){
            const z=1/Math.max(.01,this.scale),left=this.x-w*z/2,right=this.x+w*z/2,top=this.y-h*z/2,bottom=this.y+h*z/2;
            for(const t of this.terrainHealthTargets(b)){
                if(t.x<left-100*z||t.x>right+100*z||t.y<top-70*z||t.y>bottom+70*z)continue;
                const width=t.event?100:64,ratio=Math.max(0,Math.min(1,t.hp/t.maxHp)),color=t.blocked?'#a3adb0':'#db9a88';
                c.save();c.translate(t.x,t.y);c.scale(z,z);c.textAlign='center';c.textBaseline='middle';
                c.font='600 11px sans-serif';
                const value=`${Math.ceil(t.hp)} / ${Math.ceil(t.maxHp)}`,label=t.event?t.label:'',caption=t.blocked;
                const panel=Math.max(width+12,Math.min(250,c.measureText(label).width+14),Math.min(250,c.measureText(caption).width+14));
                c.fillStyle='#0d2026ee';c.fillRect(-panel/2,-(caption?66:48),panel,44+(caption?18:0));
                if(label){c.fillStyle='#ead2ad';c.fillText(label,0,-38,panel-12);}
                c.fillStyle='#293c42';c.fillRect(-width/2,-27,width,7);c.fillStyle=color;c.fillRect(-width/2,-27,width*ratio,7);
                c.strokeStyle='#bdbaa566';c.lineWidth=1;c.strokeRect(-width/2-.5,-27.5,width+1,8);
                c.fillStyle='#eee7d5';c.fillText(value,0,-11);
                if(caption){c.fillStyle='#c8d6d8';c.fillText(caption,0,-56,panel-12);}
                c.restore();
            }
        }
        cameraAxis(center,span,min,max){return G.HonroCamera.axis(center,span,min,max);}
        occludedUnitSilhouettes(c,b,units,charge=0){
            const visible=u=>!G.HonroAct2||G.HonroAct2.visible(b,u),height=u=>G.HonroPartyPresentationHeight?.(u)??u.h;
            const targets=new Set([b.active,this.hoverUnitId,this.inspectUnitId]);
            this._occludedUnitIds=[];
            for(let i=0;i<units.length;i++){
                const u=units[i];if(!targets.has(u.id)||!visible(u))continue;
                const uh=height(u),half=Math.max(u.r*2,uh*.6);
                const covers=units.slice(i+1).filter(v=>visible(v)&&Math.abs(v.x-u.x)<half+Math.max(v.r*2,height(v)*.6)&&v.y>u.y-uh*1.3&&v.y-height(v)*1.3<u.y);
                if(!covers.length)continue;
                // Only actor pixels covered by a later body are overlaid. Props, HP bars,
                // open air and genuinely unrevealed spirits retain their normal appearance.
                const extent=Math.max(uh*3,half*3,140),size=384,rs=Math.min(2,size/extent),left=u.x-size/(2*rs),top=u.y-size*.78/rs;
                this._occlusionLayers??=Array.from({length:3},()=>this._makeLayerCanvas(size,size));
                const [body,cover,edge]=this._occlusionLayers,[bc,cc,ec]=this._occlusionLayers.map(cv=>cv.getContext('2d'));
                for(const ctx of [bc,cc,ec]){ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,size,size);}
                for(const ctx of [bc,cc])ctx.setTransform(rs,0,0,rs,-left*rs,-top*rs);
                this.unitBody(bc,u,u.id===b.active?charge:0);
                for(const v of covers)this.unitBody(cc,v);
                bc.setTransform(1,0,0,1,0,0);cc.setTransform(1,0,0,1,0,0);
                bc.globalCompositeOperation='source-in';bc.fillStyle=u.id===b.active?'#f4d793':u.side===1?'#edb7a3':'#bee1cc';bc.fillRect(0,0,size,size);bc.globalCompositeOperation='source-over';
                const r=1.6*rs/this.scale;
                for(let j=0;j<8;j++)ec.drawImage(body,Math.cos(j*Math.PI/4)*r,Math.sin(j*Math.PI/4)*r);
                ec.globalCompositeOperation='destination-out';ec.drawImage(body,0,0);
                ec.globalCompositeOperation='destination-in';ec.drawImage(cover,0,0);ec.globalCompositeOperation='source-over';
                bc.globalCompositeOperation='destination-in';bc.drawImage(cover,0,0);bc.globalCompositeOperation='source-over';
                c.save();c.globalAlpha=.38;c.drawImage(body,left,top,size/rs,size/rs);c.globalAlpha=.95;c.drawImage(edge,left,top,size/rs,size/rs);c.restore();
                this._occludedUnitIds.push(u.id);
            }
        }
        tacticalUnitMarkers(c,b,units){
            if(this.scale>.42)return;
            const z=1/Math.max(.12,this.scale);
            for(const u of units){
                if(G.HonroAct2&&!G.HonroAct2.visible(b,u))continue;
                const active=u.id===b.active,y=u.y-(G.HonroPartyPresentationHeight?.(u)??u.h)-12,col=active?'#f4d793':u.side===1?'#e3a393':u.side===2?'#dac08d':'#b9d8c2',w=active?26:19;
                c.save();c.translate(u.x,y);c.scale(z,z);c.fillStyle='#102025';c.fillRect(-w/2-1,-2,w+2,5);c.fillStyle=col;c.fillRect(-w/2,-1,w*Math.max(0,u.hp/u.maxHp),3);
                if(!active){c.lineWidth=1.4;if(u.side===1)P(c,[[0,-13],[4,-9],[0,-5],[-4,-9]],col,'#102025',1.4);else if(u.side===2){c.fillStyle=col;c.fillRect(-3.5,-12.5,7,7);c.strokeStyle='#102025';c.strokeRect(-3.5,-12.5,7,7);}else{c.beginPath();c.arc(0,-9,3.5,0,Math.PI*2);c.fillStyle=col;c.fill();c.strokeStyle='#102025';c.stroke();}}
                c.restore();
            }
        }
        activeMarker(c,u,y){const z=1/Math.max(.16,this.scale||1),lift=Math.sin(this.time*3)*2*z;c.save();c.translate(u.x,y-10*z+lift);glow(c,0,-18*z,24*z,'#f0d69d',.24);P(c,[[-7*z,-35*z],[7*z,-35*z],[7*z,-19*z],[15*z,-19*z],[0,0],[-15*z,-19*z],[-7*z,-19*z]],'#f4d793','#102025',2*z);c.restore();}
        chargeFx(engine,power,charging){
      const u = engine && engine.active;
      if(!charging || !u) return;
      const size = this.size();
      const c = this.ctx, px = (u.x - this.x) * this.scale + size.w / 2, py = (u.y - u.h * 0.72 - this.y) * this.scale + size.h / 2;
      c.setTransform(size.d,0,0,size.d,0,0);
      c.save();
      c.globalCompositeOperation = 'screen';
      c.lineWidth = 1.5;
      c.strokeStyle = 'rgba(223,214,176,.55)';
      c.fillStyle = 'rgba(223,214,176,.18)';
      const pulse = 0.86 + Math.sin((this.time || 0) * 9) * 0.14;
      if(u.cls === 'mage'){
        for(let i=0;i<4;i++){
          const a = (this.time || 0) * 2.2 + i * Math.PI / 2;
          c.beginPath(); c.arc(px + Math.cos(a) * 16 * pulse, py - 16 + Math.sin(a) * 10, 3.2, 0, Math.PI*2); c.fill();
        }
        c.beginPath(); c.arc(px, py - 12, 18 * pulse, 0, Math.PI*2); c.stroke();
      }else if(u.cls === 'archer'){
        c.beginPath(); c.arc(px + 8 * u.facing, py - 4, 16 * pulse, -0.85, 0.85); c.stroke();
        c.beginPath(); c.moveTo(px - 8*u.facing, py + 10); c.lineTo(px + 18*u.facing, py - 10); c.stroke();
        c.beginPath(); c.arc(px + 12 * u.facing, py - 4, 4, 0, Math.PI*2); c.fill();
      }else if(u.cls === 'knight'){
        c.strokeStyle = `rgba(216,228,231,${Math.max(0,power-.55)*1.5})`;
        c.lineWidth = 1;
        c.beginPath(); c.moveTo(px+4*u.facing,py+13); c.lineTo(px+22*u.facing,py-12); c.stroke();
      }else if(u.cls === 'occultist'){
        c.beginPath(); c.arc(px, py - 8, 17 * pulse, 0, Math.PI*2); c.stroke();
        for(let i=0;i<3;i++){ const a=(this.time||0)*1.9 + i*2.09; c.beginPath(); c.arc(px + Math.cos(a)*20, py - 10 + Math.sin(a)*14, 2.6, 0, Math.PI*2); c.fill(); }
      }
      c.restore();
        }
        terrain(c, t) { const sy = t.slope || 0, wood = t.mat === 'wood', ice = t.mat === 'ice', rune = t.device === 'ward' || t.honroSeal; const fill = wood ? '#514b3c' : ice ? '#64858b' : rune ? '#41474b' : '#3b4b4c'; P(c, [[t.x, t.y], [t.x + t.w, t.y + sy], [t.x + t.w, t.y + t.h], [t.x, t.y + t.h]], fill, '#13272f', 2.7); L(c, t.x, t.y - 1, t.x + t.w, t.y + sy - 1, wood ? '#bc9c6e' : ice ? '#c1e4df' : '#a8b49f', 2); if (wood) {
            for (let x = t.x + 8; x < t.x + t.w; x += 28) {
                const yy = t.y + (x - t.x) / t.w * sy;
                L(c, x, yy + 3, x, t.y + t.h, '#9c8d6766');
            }
            L(c, t.x + 5, t.y + t.h - 5, t.x + t.w - 5, t.y + t.h - 5, '#201f1d', 2);
        }
        else {
            for (let i = 0; i < Math.min(10, Math.floor(t.w / 50)); i++) {
                const xx = t.x + 22 + i * 54, yy = t.y + 13 + (i % 2) * 16;
                if (yy < t.y + t.h)
                    L(c, xx, yy, xx + 27, yy - 2, '#7e8b7d3d', 1);
            }
            if (t.h > 100) {
                for (let i = 1; i < 4; i++) {
                    let xx = t.x + t.w * i / 4;
                    L(c, xx, t.y + 24, xx - 12, t.y + 71, '#1e333b', 1.5);
                }
            }
        } if (rune) {
            const x = t.x + t.w / 2, y = t.y + Math.min(60, t.h / 2);
            glow(c, x, y, 75, '#b1666570', .4);
            P(c, [[x - 10, y - 28], [x + 12, y - 24], [x + 9, y + 27], [x - 11, y + 24]], '#c1b69b', '#64484b');
            glyph(c, x, y, 8, '#a8534f');

        } }
        landmark(c,l){const k=l.kind||'',x=l.x,y=l.y,s=l.size||1;c.save();c.globalAlpha=.88;
            if(k==='leftCliff'||k==='rightCliff'){
                const left=k==='leftCliff',w=(left?1760:3320)*s/1.55,topY=left?720:980,base=y;
                c.fillStyle=left?'#243638':'#26383a';c.strokeStyle='#69786e66';c.lineWidth=3;
                c.beginPath();c.moveTo(x-w/2,topY);c.lineTo(x+w/2,topY+(left?85:-35));c.lineTo(x+w/2,base);c.lineTo(x-w/2,base);c.closePath();c.fill();c.stroke();
                c.strokeStyle='#17282d99';c.lineWidth=2;for(let i=0;i<12;i++){const xx=x-w/2+90+i*w/12;c.beginPath();c.moveTo(xx,topY+35+(i%3)*22);c.lineTo(xx-70+(i%2)*45,base-70-(i%4)*80);c.stroke();}
                c.fillStyle='#314b40';for(let i=0;i<8;i++){const xx=x-w/2+80+i*w/8;E(c,xx,topY-15-(i%2)*25,90*s*.55,30*s*.55,'#29443a');}
            }else if(/temple|shrine|oldGate|gate|watchtower|royalGate|burnedHouses|drownedGate/.test(k)){building(c,x,y,115*s,88*s,/gate/i.test(k)?'gate':'temple');if(/burned/.test(k)){c.strokeStyle='#8e635055';c.lineWidth=3;for(let i=-2;i<3;i++)L(c,x+i*18,y-80,x+i*25,y-130,'#6f554b66',2);}}
            else if(/tree|Pines|forestPath|greatTree|rootShrine/.test(k)){const n=k==='greatTree'?1:Math.max(2,Math.round(3*s));for(let i=0;i<n;i++)tree(c,x+(i-(n-1)/2)*55*s,y, k==='greatTree'?340*s:100*s, k==='greatTree');}
            else if(k==='fallenTree'){c.save();c.translate(x,y-20);c.rotate(-.12);c.fillStyle='#3d4035';c.fillRect(-130*s,-12*s,260*s,24*s);for(let i=-2;i<=2;i++)L(c,i*45*s,0,(i*45+30)*s,-45*s,'#4c513f',7*s);c.restore();}
            else if(k==='stoneArch'){c.strokeStyle='#606a60';c.lineWidth=20*s;c.beginPath();c.arc(x,y-40*s,75*s,Math.PI,0);c.stroke();L(c,x-75*s,y-40*s,x-75*s,y,'#606a60',20*s);L(c,x+75*s,y-40*s,x+75*s,y,'#606a60',20*s);}
            else if(/bell/.test(k)){building(c,x,y,90*s,65*s);E(c,x,y-50*s,18*s,23*s,'#6f6855');L(c,x,y-27*s,x,y-5*s,'#8d7d5f',3*s);}
            else if(/boat|ferry/.test(k)){P(c,[[x-65*s,y-18*s],[x+65*s,y-18*s],[x+48*s,y],[x-50*s,y]],'#4b4435','#9a8968',2);L(c,x+20*s,y-18*s,x+46*s,y-70*s,'#75694f',4*s);}
            else if(k==='bridgePillar'){c.fillStyle='#4a5450';c.fillRect(x-16*s,y-90*s,32*s,90*s);P(c,[[x-28*s,y-90*s],[x+28*s,y-90*s],[x+18*s,y-108*s],[x-18*s,y-108*s]],'#69736b');}
            else{glyph(c,x,y-40*s,18*s,'#9da68d88',0);}
            c.restore();
        }
        field(c, x, y, r, kind) { c.save(); let col = /ice|frost/.test(kind) ? '#9ccacb' : /fire|flame/.test(kind) ? '#c78660' : '#af86b9'; c.globalAlpha = .35; c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, r, r * .45, 0, 0, 6.283); c.stroke(); for (let i = 0; i < 9; i++) {
            let a = i * .7 + this.time * .6;
            E(c, x + Math.cos(a) * r * .8, y + Math.sin(a) * r * .35, 2, 2, col);
        } c.restore(); }
        unit(c, u, active, charge = 0) {
            if (u.dead)
                return;
            c.save();
            c.translate(u.x, u.y);
            E(c, 0, 3, u.r * 1.35, 6, '#06121877');
            const ps = H.hero[u.cls] || H.hero.archer;
            const foe = u.side === 1;
            const moving = (u.moving || 0) > .01 || u.jumping;
            const stride = moving ? Math.sin(this.time * 12) * 8 : Math.sin(this.time * 1.8) * .8;
            const lean = (u.hurt || 0) > 0 ? .12 : 0;
            c.rotate(lean);
            const scale = (u.h || 72) / 78;
            c.scale(scale, scale);
            if (u.honroType === 'bier') {
                this.bier(c, u);
            }
            else if (u.summoned || foe && ['ghost', 'lantern', 'shade'].includes(u.honroType)) {
                this.spirit(c, u, active);
            }
            else if (foe && u.honroType === 'crow') {
                this.crow(c, u);
            }
            else if (foe && u.honroType === 'beast') {
                this.beast(c, u, stride);
            }
            else if (foe && u.boss) {
                this.boss(c, u);
            }
            else
                this.human(c, u, ps, foe, stride, charge);
            c.restore();
            if (!u.dead && u.maxHp) {
                const bw = u.honroFinalBoss ? 112 : u.honroMidboss ? 92 : u.boss ? 104 : u.summoned ? 42 : 58, y = u.y - u.h - 15;
                c.fillStyle = '#0c2025';
                c.fillRect(u.x - bw / 2 - 1, y - 1, bw + 2, 6);
                c.fillStyle = u.side === 0 ? '#68cb88' : (u.side === 2 || u.honroAlly) ? '#dfb952' : '#dd625a';
                c.fillRect(u.x - bw / 2, y, bw * Math.max(0, u.hp / u.maxHp), 4);
                if (active) { const z=1/Math.max(.16,this.scale||1),lift=Math.sin(this.time*3)*2*z;c.save();c.translate(u.x,y-10*z+lift);glow(c,0,-18*z,24*z,'#f0d69d',.24);P(c,[[-7*z,-35*z],[7*z,-35*z],[7*z,-19*z],[15*z,-19*z],[0,0],[-15*z,-19*z],[-7*z,-19*z]],'#f4d793','#102025',2*z);c.restore(); }
                if(this.speakerId===u.id&&performance.now()<this.speakerUntil){glow(c,u.x,y-38,28,'#ead9a8',.18);P(c,[[u.x-13,y-54],[u.x+13,y-54],[u.x+13,y-37],[u.x+3,y-37],[u.x-3,y-29],[u.x-3,y-37],[u.x-13,y-37]],'#e5d8b8','#35464a',1);}
            }
        }
        human(c, u, p, foe, stride, charge) {
            c.save();
            c.scale(u.facing || 1, 1);
            const robe = foe ? '#623e42' : u.cls === 'mage' ? '#3d615f' : u.cls === 'occultist' ? '#6b5c68' : u.cls === 'knight' ? '#57616a' : '#4d6150';
            const ink = '#172a30';
            L(c, -7, -20, -10 + stride, 0, '#252b2d', 8);
            L(c, 7, -20, 10 - stride, 0, '#333b3a', 8);
            L(c, -11 + stride, 0, -3 + stride, 1, '#8d8976', 3);
            L(c, 7 - stride, 0, 15 - stride, 1, '#8d8976', 3);
            const wind = Math.sin(this.time * 2.1 + u.x * .01) * 4;
            P(c, [[-12, -57], [-24, -39], [-24 - wind - stride * .7, -7], [-8, -14], [4, -24], [9, -52]], foe ? '#43333d' : '#263e42', ink, 1.6);
            P(c, [[-13, -56], [8, -57], [17, -34], [12, -17], [-11, -16], [-16, -38]], robe, ink, 1.6);
            P(c, [[-7, -52], [2, -40], [11, -53], [6, -23], [-6, -22]], '#aab7a34a');
            L(c, -13, -24, 12, -24, foe ? '#b96d63' : '#bdab84', 3);
            for (let i = 0; i < 3; i++)
                L(c, -8 + i * 7, -38, -10 + i * 6, -18, '#101f2766', 1.1);
            E(c, 0, -68, 9, 11, '#c8bba5');
            P(c, [[-10, -68], [-8, -78], [1, -82], [10, -74], [9, -68], [3, -73], [-5, -72]], '#20282b', '#808779', .7);
            L(c, 1, -67, 6, -67, foe ? '#edb695' : '#342d2d', 1);
            if (u.cls === 'archer') {
                P(c, [[-13, -73], [10, -74], [10, -69], [-12, -69]], '#8d9380');
                L(c, -11, -72, -27, -64 + wind, '#789183', 3);
                L(c, -12, -54, -23, -79, '#71654f', 4);
                for (let i = 0; i < 3; i++)
                    L(c, -22 + i * 3, -78, -21 + i * 3, -90, '#bbbd9e', 1.2);
                c.save();
                c.translate(15, -43);
                c.rotate(-(u.angle < 90 ? u.angle : 180 - u.angle) * Math.PI / 180 * .65);
                c.strokeStyle = '#c8af78';
                c.lineWidth = 2;
                c.beginPath();
                c.moveTo(7, -28);
                c.quadraticCurveTo(34, 0, 7, 28);
                c.stroke();
                L(c, 7, -28, -5 - charge * 12, 0, '#d5d0b5', .8);
                L(c, -5 - charge * 12, 0, 7, 28, '#d5d0b5', .8);
                L(c, -14, 0, 28, 0, '#b8c6b4', 1.3);
                L(c, -23, -1, -5 - charge * 12, 0, robe, 6);
                c.restore();
            }
            else if (u.cls === 'mage') {
                P(c, [[-9, -76], [-4, -90], [6, -90], [9, -75]], '#343f3d', '#babca3', 1);
                P(c, [[-14, -31], [-19, -5], [-3, -11], [4, -26]], robe, ink, 1);
                L(c, 8, -46, 23, -37, robe, 9);
                L(c, 26, -6, 29, -84, '#8e7956', 3);
                L(c, 28, -80, 38, -77, '#c1b18c', 1.2);
                const col = '#9fc7bd';
                glyph(c, 30, -85, 9 + charge * 9, col, this.time);
                glow(c, 30, -85, 19 + charge * 32, col, .22 + charge * .45);
            }
            else if (u.cls === 'knight') {
                P(c, [[-14, -54], [-19, -47], [-13, -35], [0, -33], [13, -35], [18, -47], [10, -55]], '#697274', '#1d3036', 1.5);
                for (let i = 0; i < 4; i++) {
                    L(c, -10, -45 + i * 5, 10, -45 + i * 5, '#b4b9a088', 1);
                    for (let j = -1; j <= 1; j++)
                        E(c, j * 7, -43 + i * 5, 1, 1, '#d4c8ac');
                }
                P(c, [[-11, -74], [-10, -82], [0, -88], [10, -82], [12, -69], [7, -68], [5, -77], [-5, -77], [-6, -66]], '#4d5c63', '#adb5a2', 1);
                L(c, 3, -85, 10, -97, '#a97764', 3);
                L(c, 10, -42, 23, -38, '#89948d', 7);
                c.save();
                c.translate(25, -38);
                c.rotate(-.35 - charge * .6);
                P(c, [[-3, 6], [1, -55], [7, -70], [9, -52], [3, 7]], '#d2d6bf', '#596974', 1);
                L(c, -10, 1, 13, 1, '#b1976d', 3);
                L(c, 0, 7, 0, 20, '#614b3f', 4);
                c.restore();
                P(c, [[-13, -50], [-30, -50], [-34, -32], [-22, -21], [-10, -33]], '#495650', '#aab399', 1.5);
            }
            else {
                P(c, [[-13, -68], [-11, -82], [1, -91], [14, -79], [14, -63], [7, -58], [5, -72], [-7, -72], [-7, -60]], '#574955', '#b6a09e', 1);
                P(c, [[-6, -71], [6, -71], [5, -60], [-4, -59]], '#ddd0b7', '#736674', .7);
                L(c, -2, -66, 4, -66, '#785066', 1.5);
                for (let i = 0; i < 3; i++) {
                    P(c, [[11, -47 + i * 8], [24, -44 + i * 8], [21, -37 + i * 8], [9, -40 + i * 8]], '#d7c59f', '#8e6863', .7);
                    glyph(c, 15, -42 + i * 8, 2.7, '#9c5953');
                }
                L(c, 13, -43, 27, -37, robe, 8);
                L(c, 25, -7, 34, -88, '#887258', 3);
                glyph(c, 35, -86, 11 + charge * 9, '#c4a0cb', -this.time);
                glow(c, 35, -86, 26 + charge * 34, '#bda0cf', .32 + charge * .25);
            }
            if (charge > .05) {
                const cc = u.cls === 'mage' ? '#b4d2c3' : u.cls === 'occultist' ? '#c5a7df' : '#e4ce9c';
                for (let i = 0; i < 6; i++) {
                    let a = this.time * (1.5 + i * .07) + i;
                    E(c, 27 + Math.cos(a) * (13 + charge * 14), -62 + Math.sin(a) * 21, 1.5, 1.5, cc);
                }
            }
            c.restore();
        }
        spirit(c, u) { let col = u.side === 0 ? '#b5c1d4' : '#c1a6bc'; const h = 72, ww = u.summonKind === 'warden' ? 27 : 20, b = Math.sin(this.time * 3 + u.x) * 4; glow(c, 0, -40, 48, col, .28); c.save(); c.globalAlpha = .83; c.beginPath(); c.moveTo(-ww, -19); c.bezierCurveTo(-ww - 8, -65, -8, -80, 0, -87); c.bezierCurveTo(19, -73, ww + 8, -52, ww, -18); c.lineTo(10, 0); c.lineTo(2, -13); c.lineTo(-8, 2); c.lineTo(-14, -11); c.closePath(); c.fillStyle = col + '77'; c.fill(); c.strokeStyle = col; c.lineWidth = 1.2; c.stroke(); E(c, -5, -61 + b, 2, 2, '#eadedb'); E(c, 5, -61 + b, 2, 2, '#eadedb'); if (u.summonKind === 'lantern' || u.honroType === 'lantern') {
            glyph(c, 0, -43, 17, col, this.time * .3);
            E(c, 0, -43, 7, 7, '#e3e5c9');
        } if (u.summonKind === 'warden')
            glyph(c, 0, -40, 31, col, -this.time * .15); c.restore(); }
        crow(c, u) { c.save(); c.translate(0, -38); let a = Math.sin(this.time * 8) * 18; P(c, [[-7, 2], [-35, -26 - a], [-47, -12 - a], [-30, 2], [-9, 14]], '#1a2832', '#6b8290', 1.3); P(c, [[7, 2], [35, -26 - a], [47, -12 - a], [30, 2], [9, 14]], '#20323c', '#859295', 1.3); E(c, 0, 3, 12, 21, '#35444b'); E(c, 2, -13, 9, 10, '#526068'); P(c, [[8, -15], [23, -11], [9, -8]], '#aeb499'); E(c, 7, -15, 1.8, 1.8, '#d5af91'); for (let i = 0; i < 3; i++)
            L(c, -4 + i * 4, 20, -11 + i * 9, 36, '#2d3b44', 5); c.restore(); }
        beast(c, u, s) { c.save(); c.translate(0, -25); c.scale(u.facing || -1, 1); P(c, [[-30, 2], [-23, -23], [-4, -37], [23, -27], [35, -8], [20, 7], [-10, 13]], '#4b5549', '#9caa88', 1.4); L(c, -21, 7, -26 + s, 26, '#34463e', 8); L(c, 14, 7, 20 - s, 26, '#43554a', 8); P(c, [[18, -26], [40, -36], [49, -22], [36, -8], [20, -8]], '#707660', '#223837', 1); L(c, 31, -33, 26, -62, '#a4a17c', 3); L(c, 27, -48, 13, -56, '#a4a17c', 2); L(c, 39, -34, 47, -64, '#a4a17c', 3); L(c, 44, -50, 57, -58, '#a4a17c', 2); E(c, 39, -23, 2.6, 2, '#dfbba0'); for (let i = 0; i < 4; i++)
            L(c, -26 + i * 11, -14, -20 + i * 11, -33, '#242f30', 2); c.restore(); }
        boss(c, u) { c.save(); c.translate(0, -8); P(c, [[-51, 6], [-47, -62], [-67, -98], [-44, -134], [-23, -111], [-14, -162], [15, -165], [33, -118], [58, -125], [75, -92], [48, -57], [45, 8], [18, -4], [1, 11], [-19, -3]], '#334146', '#afb29a', 2); P(c, [[-23, -113], [23, -116], [31, -35], [12, -15], [-21, -30]], '#617067', '#283b42', 1.5); for (let i = 0; i < 7; i++) {
            L(c, -20, -103 + i * 11, 27, -111 + i * 11, '#283d42', 2);
            glyph(c, 2, -91 + i * 9, 3, '#cab79c');
        } P(c, [[-18, -157], [-21, -172], [0, -197], [22, -173], [18, -146], [9, -140], [-8, -141]], '#d1c6aa', '#575c65', 1.5); L(c, -12, -160, 12, -160, '#8f4b4e', 3); L(c, -3, -155, 2, -144, '#58515b', 2); L(c, -53, -102, -89, -177, '#7b725a', 9); building(c, -92, -177, 58, 46); L(c, 52, -93, 82, -19, '#7b7158', 8); P(c, [[68, -14], [91, -19], [94, 6], [68, 10]], '#a29675', '#31414a', 2); for (let i = 0; i < 5; i++) {
            let x = -35 + i * 16;
            P(c, [[x, -102], [x + 9, -100], [x + 6, -46], [x - 3, -42]], i % 2 ? '#a18e75' : '#cec0a2', '#6e5d5b', .7);
        } glow(c, 0, -94, 36, '#b293af', .3); c.restore(); }
        bier(c, u) { c.save(); let w = 106; L(c, -74, -8, 75, -8, '#aa9470', 5); P(c, [[-52, -15], [-51, -42], [48, -42], [53, -15]], '#dad7bf', '#7d8b7b', 1.2); for (let i = 0; i < 8; i++)
            L(c, -48 + i * 13, -42, -44 + i * 13, -14, '#a4afa2', .8); P(c, [[-59, -46], [-33, -75], [34, -75], [59, -46]], '#d2d2bb', '#98a18b', 1.3); L(c, -61, -46, 61, -46, '#ae9e7b', 3); for (let i = 0; i < 4; i++)
            L(c, -51 + i * 34, -49, -51 + i * 34, -14, '#a69472', 3); glyph(c, 0, -29, 7, '#a15553'); c.restore(); }
        projectile(c, q) { const col = q.color || '#e2c38f', ghost = (q.skill || '')[0] === 'O'; if (q.body) {
            glow(c, q.x, q.y - 25, 40, col, .25);
            return;
        } const tr = q.trail || []; if (tr.length > 1) {
            c.save();
            c.globalAlpha = .42;
            c.strokeStyle = col;
            c.lineWidth = ghost ? 5 : 3;
            c.beginPath();
            tr.forEach((v, i) => i ? c.lineTo(v.x, v.y) : c.moveTo(v.x, v.y));
            c.stroke();
            c.restore();
        } if (/Bolt|bolt/.test(q.mode) && q.targetId && tr.length) {
            let a = tr[Math.max(0, tr.length - 5)];
            c.save();
            c.strokeStyle = col;
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(a.x, a.y);
            c.lineTo((a.x + q.x) / 2 + Math.sin(this.time * 33 + q.id) * 8, (a.y + q.y) / 2);
            c.lineTo(q.x, q.y);
            c.stroke();
            c.restore();
        } c.save(); c.translate(q.x, q.y); c.rotate(Math.atan2(q.vy, q.vx)); const big = /Orb|Parade|Judgment|Hunt|meteor/i.test(q.mode); glow(c, 0, 0, big ? 48 : ghost ? 21 : 14, col, big ? .45 : .25); if ((q.skill || '')[0] === 'A' || q.mode === 'hunterBolt') {
            L(c, -22, 0, 12, 0, '#e5d5ad', 1.6);
            P(c, [[17, 0], [9, -3], [9, 3]], col);
            P(c, [[-20, 0], [-29, -5], [-25, 0], [-29, 5]], '#9cb4a3');
        }
        else if (/curse/.test(q.mode)) {
            P(c, [[-10, -7], [7, -6], [11, 7], [-8, 6]], '#e0d1ad', col);
            glyph(c, 0, 0, 5, '#a54d59');
        }
        else if (ghost) {
            P(c, [[14, 0], [-2, -9], [-9, -2], [-19, 3], [-7, 4], [-1, 8]], col + 'bb', '#dfd2e4', 1);
            glyph(c, 0, 0, big ? 27 : 9, col, -this.time);
        }
        else {
            E(c, 0, 0, big ? 13 : 6, big ? 13 : 6, col);
            glyph(c, 0, 0, big ? 23 : 11, '#dfddb8', this.time * 1.5);
        } c.restore(); }
        effect(c, f) { const t = f.life; if(f.name==='swordCut'&&f.text){const g=JSON.parse(f.text);c.save();c.translate(f.x,f.y);c.rotate(g.angle);c.globalAlpha=Math.max(0,1-t/.34);c.strokeStyle=f.color;c.lineWidth=3;c.beginPath();c.arc(0,0,f.size,-g.span/2,g.span/2);c.stroke();c.globalAlpha*=.3;c.beginPath();c.moveTo(0,0);c.arc(0,0,f.size,-g.span/2,g.span/2);c.closePath();c.fillStyle=f.color;c.fill();c.restore();return;} if (f.name === 'text') {
            c.save();
            c.globalAlpha = Math.max(0, 1 - t / .95);
            c.fillStyle = f.color || '#e2d4b8';
            c.font = `600 ${Math.max(12, f.size || 16)}px system-ui`;
            c.textAlign = 'center';
            if(f.critical){c.font=`900 ${Math.max(22,f.size||26)}px system-ui`;c.strokeStyle='#62241d';c.lineWidth=3;c.strokeText(f.text||'',f.x,f.y-t*38);c.shadowColor='#ef6e39';c.shadowBlur=8;}c.fillText(f.text || '', f.x, f.y - t * (f.critical?38:30));
            c.restore();
            return;
        } c.save(); c.globalAlpha = Math.max(0, 1 - t / .8); let col = f.color || '#dcc4a0'; if (f.name === 'line' || f.x2 !== undefined) {
            L(c, f.x, f.y, f.x2 || f.x + 35, f.y2 || f.y, col, 2.5);
        }
        else if (f.name === 'rune') {
            glyph(c, f.x, f.y, (f.size || 35) * (.5 + t), col, t);
        }
        else {
            c.strokeStyle = col;
            c.lineWidth = 3 * (1 - t);
            c.beginPath();
            c.ellipse(f.x, f.y, Math.max(1, (f.size || 35) * (.25 + t)), Math.max(1, (f.size || 35) * (.17 + t * .5)), 0, 0, 6.283);
            c.stroke();
            for (let i = 0; i < 9; i++) {
                let a = i * .7;
                E(c, f.x + Math.cos(a) * (f.size || 40) * t, f.y + Math.sin(a) * (f.size || 40) * t - 10 * t, 2, 2, col);
            }
        } c.restore(); }
    }
    G.HonroScene = Scene;
    G.honroDraw = { P, L, E, glyph, glow, building, tree };
})(globalThis);
