      // Opt-in build and trusted debug journey entry. This App instance uses a
      // disposable custom battle while the native 53–56 owners keep their pins.
      const bProofAim = new WeakMap();
      function adjustBProofAngle(app,u,delta){
        const oriented=bProofAim.get(app.engine);
        if(!oriented?.has(u))return false;
        u.angle=Math.max(C.AIM_MIN,Math.min(C.AIM_MAX,u.angle+delta));
        return true;
      }

      function offerBProof(app) {
        if (!debugJourneyAllowed(app) || app.screen !== 'journey' ||
            app.journeyAct !== 6 || app.journeySelection !== 53 ||
            app.root.querySelector('[data-act6-b-proof]')) return;
        const destination = app.root.querySelector('.journey6-detail')?.parentElement;
        if (!destination) return;
        const button = document.createElement('button');
        button.className = 'ghost';
        button.type = 'button';
        button.dataset.act6BProof = '';
        button.textContent = '53 → 54 문턱·중력 검수';
        destination.append(button);
        button.addEventListener('click', async event => {
          if (!event.isTrusted || !button.isConnected || button.disabled ||
              !debugJourneyAllowed(app) || app.journeySelection !== 53) return;
          button.disabled = true;
          try {
            const [fixtures, art] = await Promise.all([debugFixtures(),loadBProofArt()]);
            if (!button.isConnected || !debugJourneyAllowed(app) || app.screen !== 'journey' ||
                app.journeyAct !== 6 || app.journeySelection !== 53) return;
            launchBProof(app,structuredClone(fixtures.rows[53].profile),art);
          } catch (error) {
            if(button.isConnected)button.disabled = false;
            app.notify('B 문턱 검수 지형을 열지 못했습니다.');
            G.console.warn(error);
          }
        });
      }

      async function loadBProofArt() {
        const p = descriptor.bProof;
        const response = await G.fetch(urlAt(p.art.path),{redirect:'error',credentials:'omit'});
        if (!response.ok) throw Error('B threshold source unavailable');
        const bytes = await response.arrayBuffer();
        if(bytes.byteLength!==p.art.bytes||await sha(bytes)!==p.art.sha)throw Error('B threshold source changed');
        const img = new Image();
        const url = URL.createObjectURL(new Blob([bytes],{type:'image/svg+xml'}));
        try {
          img.src = url;
          await img.decode();
          return await createImageBitmap(img);
        } finally {
          URL.revokeObjectURL(url);
        }
      }

      function launchBProof(app, profile, art) {
        const map = descriptor.bProof.layout;
        const stage = G.HonroMaps.emptyStage('act6-b-threshold-proof','B 문턱',map.width,map.height);
        stage.terrains = map.solids.map(({id,left,top,right,bottom})=>({
          id,name:id,type:'solid',baseMaterial:'rock',breakable:false,
          points:[{x:left,y:top},{x:right,y:top},{x:right,y:bottom},{x:left,y:bottom}]
        }));
        stage.units = [{id:'p-mage',kind:'mage',team:'player',x:map.start[0],y:map.start[1]}];
        stage.objectives = [{id:'b-proof-join',type:'reach',label:'문턱에서 벽면 교전',x:map.width-20,y:120,radius:8}];
        const project = {name:stage.name,stages:[stage],activeStageId:stage.id,library:[],settings:{autosave:false}};
        const e = app.launchMap(project,stage.id,{profile,story:false});
        const hero = e.active;
        hero.loadout = ['M01'];
        hero.ranks.M01 ||= 1;
        app.selected = 'M01';
        app.selectedByUnit[hero.id] = 'M01';
        e.b.wind = 0;
        installBProof(app,e,hero,map,art);
      }

      function installBProof(app,e,hero,map,art) {
        const b = e.b;
        const scene = app.scene;
        const right = map.solids.find(t=>t.id==='b-inner-jamb');
        const left = map.solids.find(t=>t.id==='b-outer-jamb');
        const floor = map.solids.find(t=>t.id==='b-entry-sill');
        const top = right.top;
        const threshold = right.left;
        const oriented = new WeakSet();
        bProofAim.set(e,oriented);
        const clampPose = (n,lo,hi)=>Math.max(lo,Math.min(hi,n));
        const stock = Object.fromEntries(['grounded','integrateBody','jump','walk','origin','projectileOrigin',
          'damageAim','damageDistance','collision','enemyAction'].map(key=>[key,e[key].bind(e)]));
        const minY = u=>top+u.r;
        const maxY = u=>floor.top-u.r;
        const notes = b.honroBProof = {edgeId:map.id,chapter:53,crossing:null,gravityContacts:[]};
        const foot = u=>({id:u.id,x:u.x,y:u.y,vx:u.vx,vy:u.vy,h:u.h,r:u.r,
          grounded:e.grounded(u),normal:oriented.has(u)?[-1,0]:[0,-1],
          support:oriented.has(u)&&e.grounded(u)?right.id:null});
        const status = document.createElement('div');
        status.dataset.act6BStatus = '53';
        status.textContent = '6막 3장 · → 입구 안쪽으로 걷기';
        styleAction(status);
        app.root.querySelector('.battle-head').append(status);

        e.setEnvironment({regions:[{id:'b-axis',x:map.gravityStartX-100,y:top,w:threshold-map.gravityStartX+100,
          h:floor.top-top,gravity:{x:map.gravity,y:0},projectileOnly:false}]});
        e.grounded = u => oriented.has(u)
          ? !u.dead&&!u.jumping&&Math.abs(u.x-threshold)<0.1&&u.y>=minY(u)&&u.y<=maxY(u)&&
            Math.abs(u.vx)<2&&Math.abs(u.vy)<2
          : stock.grounded(u);
        e.honroBBodyEmbedded = u => oriented.has(u)
          ? b.terrain.some(t=>!t.broken&&!t.oneWay&&C.terrainRectIntersects(t,u.x-u.h+.1,u.y-u.r+.1,u.h-.2,u.r*2-.2,.1))
          : undefined;
        e.walk = (u,dir,dt,requireSupport=false) => {
          if(!oriented.has(u))return stock.walk(u,dir,dt,requireSupport);
          if(!dir||u.dead||u.fixed||u.moveLeft<=0||(!u.jumping||requireSupport)&&!e.grounded(u))return false;
          const speed=u.walkSpeed||290;
          let target=clampPose(u.y-dir*Math.min(u.moveLeft,speed*dt),minY(u),maxY(u));
          for(const other of b.units){
            if(other===u||other.dead||!oriented.has(other)||u.x-u.h>other.x||other.x-other.h>u.x)continue;
            const gap=u.r+other.r+2;
            if(target<u.y&&other.y<u.y)target=Math.min(u.y,Math.max(target,other.y+gap));
            if(target>u.y&&other.y>u.y)target=Math.max(u.y,Math.min(target,other.y-gap));
          }
          if(target===u.y)return false;
          u.moveLeft-=Math.abs(target-u.y);
          u.y=target;
          u.facing=Math.sign(dir);
          u.moving=.08;
          return true;
        };
        e.jump = (u=e.active) => {
          if(!u||!oriented.has(u))return stock.jump(u);
          const cost=e.jumpCost(u);
          if(!e.grounded(u)||u.moveLeft<cost)return false;
          u.moveLeft-=cost;
          u.jumping=true;
          u.vx=-660;
          u.landing=0;
          e.emit('sound',{name:'jump'});
          return true;
        };

        const settleOriented = (u,dt) => {
          const before=u.x;
          const env=C.environmentAt(b.physics,u.x-u.h*.5,u.y,true);
          const lateral=env.gravity.x*(u.jumping?1000/map.gravity:1);
          const next=C.advanceLinear(u.x,u.y,u.vx,u.vy,lateral,0,.015,dt);
          const leftFace=u.y-u.r<left.bottom?left.right+u.h:0;
          u.y=clampPose(next.y,minY(u),maxY(u));
          u.vy=u.y===next.y&&Math.abs(next.vy)>=2?next.vy:0;
          if(next.x>=threshold){
            u.x=threshold;
            u.vx=0;
            if(u.jumping)u.landing=.24;
            u.jumping=false;
            if(before<threshold-.01)notes.gravityContacts.push(foot(u));
          } else {
            u.x=Math.max(leftFace,next.x);
            u.vx=next.x===u.x?next.vx:Math.max(0,next.vx);
          }
          return e.grounded(u);
        };
        let lastSouth = null;
        let foe = null;
        e.integrateBody = (u,dt,silent=false) => {
          if(!oriented.has(u)){
            const supported=stock.integrateBody(u,dt,silent);
            if(u!==hero||u.x<map.gravityStartX||!supported)return supported;
            // Keep the physical center fixed while the feet change face.
            u.x+=u.h*.5;
            u.y-=u.h*.5;
            oriented.add(u);
            status.textContent='6막 3장 · 오른쪽 벽에 착지한 뒤 →로 오르기';
          }
          const contact=settleOriented(u,dt);
          if(u!==hero||!contact||notes.crossing)return contact;
          const sample=foot(u);
          if(u.y>map.seamY)lastSouth=sample;
          else if(lastSouth){
            notes.crossing={before:lastSouth,after:sample,gravity:[map.gravity,0],clearWidth:map.clearWidth,
              heroSameObject:e.unit(hero.id)===hero};
            notes.chapter=54;
            status.dataset.act6BStatus='54';
            status.textContent='6막 4장 · 벽 접지 교전';
            foe=C.makeUnit('archer',1,map.enemy[0],map.enemy[1],{id:'b-wall-guard',name:'기둥그림자',
              h:88,r:23,hp:600,maxHp:600,focus:140,maxFocus:140,loadout:['LA01'],ranks:{LA01:1},
              awake:true,role:'bow',attack:.9,walkSpeed:290,maxMove:420,moveLeft:420});
            oriented.add(foe);
            b.units.push(foe);
            e.refreshActivation();
          }
          return contact;
        };

        e.damageAim = (u,p=.5)=>oriented.has(u)?{x:u.x-u.h*p,y:u.y}:stock.damageAim(u,p);
        e.damageDistance = (u,p)=>oriented.has(u)?Math.hypot(u.x-u.h*.45-p.x,u.y-p.y):stock.damageDistance(u,p);
        e.origin = (u,angle,body=false)=>{
          if(!oriented.has(u))return stock.origin(u,angle,body);
          const center=e.damageAim(u,.63);
          const normal=stock.origin(u,angle,body);
          return {x:center.x+normal.x-u.x,y:center.y+normal.y-(u.y-u.h*.63)};
        };
        e.projectileOrigin = (u,skill,angle)=>{
          if(!oriented.has(u))return stock.projectileOrigin(u,skill,angle);
          const origin=e.origin(u,angle);
          if(skill.phase==='terrain'||skill.phase==='all')return origin;
          const hit=e.projectileCollision(e.damageAim(u,.63),origin,skill.mode==='arrow'?3:6,u.id,[],false);
          return hit?{x:hit.x+hit.n.x*.05,y:hit.y+hit.n.y*.05}:origin;
        };
        e.collision = (a,z,r,ownerId,hit=[],units=true,skip=[],terrain=true,projectile=false,attack)=>{
          if(!units||!oriented.has(hero))return stock.collision(a,z,r,ownerId,hit,units,skip,terrain,projectile,attack);
          let nearest=stock.collision(a,z,r,ownerId,hit,false,skip,terrain,projectile,attack);
          for(const u of b.units){
            if(u.dead||u.id===ownerId||hit.includes(u.id)||!e.attackAllows(u,ownerId,attack))continue;
            const box=oriented.has(u)?[u.x-u.h,u.y-u.r,u.h,2*u.r]:[u.x-u.r,u.y-u.h,2*u.r,u.h];
            const contact=C.segRect(a,z,...box,r);
            if(contact&&(!nearest||contact.t<nearest.t)){
              const {t,n}=contact;
              nearest={t,n,x:a.x+(z.x-a.x)*t,y:a.y+(z.y-a.y)*t,unit:u};
            }
          }
          return nearest;
        };
        let guardRound=0, guardWalk=0;
        e.enemyAction = ()=>{
          if(e.active!==foe||!foe)return stock.enemyAction();
          if(!e.grounded(foe))return;
          if(b.round!==guardRound){guardRound=b.round;guardWalk=0;}
          if(guardWalk<28){
            const previous=foe.y;
            if(e.walk(foe,-1,C.STEP,true)){guardWalk+=foe.y-previous;return;}
          }
          if(b.turnAge<.22)return;
          const skill=C.SKILLS.LA01;
          const target=e.damageAim(hero);
          const origin=e.damageAim(foe);
          const aim=Math.atan2(origin.y-target.y,target.x-origin.x)*180/Math.PI;
          const direct=aim<-90?aim+360:aim;
          for(const power of [.62,.82,.95]){
            for(const delta of [0,12,-12,24,-24,36,-36,48,-48]){
              const angle=clampPose((direct+delta+450)%360-90,C.AIM_MIN,C.AIM_MAX);
              if(e.predict(foe,skill,angle,power,hero,false).unit===hero.id&&e.fire(skill.id,angle,power,true))return;
            }
          }
          e.finishAction();
        };
        e.checkEnd = ()=>{
          if(!hero.dead&&!foe?.dead)return false;
          b.phase=hero.dead?'lost':'won';
          return true;
        };

        const unit=scene.unit.bind(scene);
        scene.unit=(ctx,u,...args)=>{
          if(!oriented.has(u))return unit(ctx,u,...args);
          ctx.save();
          ctx.translate(u.x,u.y);
          ctx.rotate(-Math.PI/2);
          ctx.translate(-u.x,-u.y);
          try { return unit(ctx,u,...args); } finally { ctx.restore(); }
        };
        const outline=scene.collisionTerrainOutline.bind(scene);
        // The shared authored mass returns at the sides. The stock open-map
        // skirt would add an unrelated horizontal band across the outer edge.
        scene.terrainSkirt=()=>{};
        scene.collisionTerrainOutline=(ctx,...args)=>{
          ctx.drawImage(art,0,0,map.width,map.height);
          outline(ctx,...args);
        };
        app.updateHUD(true);
      }
