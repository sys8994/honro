      // Separate trusted menu entry. A preview has no normal slot or checkpoint
      // authority; native stage owners only see disposable fixture data.
      const stageDebug=new WeakMap(),stageDebugBusy=new WeakSet(),stageDebugInstalled=new WeakSet();
      const debugStageIds=Array.from({length:10},(_,i)=>51+i);
      let debugFixturesPromise=null;
      function debugMenuAllowed(a){
        return descriptor.releaseEnabled&&descriptor.debugFixtures&&G.isSecureContext&&G.location.origin===descriptor.origin&&rtPath.includes(G.location.pathname)&&
          !G.HONRO_EMBEDDED&&!a.endingGallery&&!a.customMap&&a.debugMode===true&&!a.profileStore.locked&&!stageDebug.has(a);
      }
      async function debugFixtures(){
        if(!debugFixturesPromise){
          debugFixturesPromise=(async()=>{
            const pin=descriptor.debugFixtures,url=urlAt(pin.path);
            check(url.origin===descriptor.origin&&/\/web\/data\/act6-debug-stages\.[a-f0-9]{16}\.json$/.test(url.pathname),'Unexpected debug fixture origin');
            const res=await G.fetch(url,{redirect:'error',credentials:'omit'});check(res.ok&&res.url===url.href,'Debug fixtures unavailable');
            const raw=await res.arrayBuffer();check(raw.byteLength===pin.bytes&&await sha(raw)===pin.sha256,'Debug fixture integrity mismatch');
            const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
            check(data.schema===1&&JSON.stringify(Object.keys(data.rows))===JSON.stringify(debugStageIds.slice(1).map(String)),'Wrong debug fixture manifest');
            return data;
          })().catch(error=>{debugFixturesPromise=null;throw error;});
        }
        return debugFixturesPromise;
      }
      function restoreDebug(a,force=false){
        const s=stageDebug.get(a);
        if(!s||s.mounting&&!force)return false;
        stageDebug.delete(a);Object.assign(a,s.real,{dirty:false});return true;
      }
      async function launchDebugStage(a,id,still){
        if(stageDebugBusy.has(a)||!debugMenuAllowed(a)||!debugStageIds.includes(id)||!still())return false;
        stageDebugBusy.add(a);
        let s;
        try{
          const [fixture,grant]=await Promise.all([debugFixtures(),prepareExact(id)]);
          if(!still()||!debugMenuAllowed(a))return false;
          const selected=fixture.rows[id===51?52:id];
          const profile=structuredClone(selected.profile), body=structuredClone(selected.body);
          check(profile?.cleared?.[50]&&profile?.equipment?.runId===body.runId,'Wrong debug practice roster');
          if(id!==51){
            const pin=routePins(id);
            check(pin&&body.to===id&&body.from===id-1&&['fromPacket','toPacket','play','world','owner'].every(k=>pin[k]===body.pin[k])&&
              grant.known[0]?.[1]===pin.play&&grant.known[1]?.[1]===pin.world,'Stale debug checkpoint');
          }
          const keys=['normalProfile','profile','profileStore','debugMode','debugRestStage','stageId','stage','training','done','selectedByUnit'];
          a.stopBattle();
          const real=Object.fromEntries(keys.map(k=>[k,a[k]]));
          const isolatedStore=Object.freeze({locked:false,initial:profile,original:()=>({ok:false}),save:()=>false});
          s={real,profile,isolatedStore,mounting:true,id};
          stageDebug.set(a,s);
          Object.assign(a,{profile,normalProfile:profile,profileStore:isolatedStore,debugMode:false,debugRestStage:null});
          const owns=()=>stageDebug.get(a)===s&&a.profile===profile&&a.normalProfile===profile&&a.profileStore===isolatedStore;
          let ok;
          if(id===51){
            const candidate={stage:{...grant.packet.map,id:'stage-51',metadata:{...grant.packet.map.metadata,campaign:true}},compiled:grant.compiled};
            const party=buildPartyFromNormalRest(G,candidate,profile);check(party,'Debug opening roster unavailable');
            ok=enterNormal51(a,grant,{...party,profile});
          }else ok=await restoreBoundaryMount(a,grant,body,owns);
          check(ok&&owns()&&a.engine?.b?.honroStage===id&&a.scene,'Debug chapter did not mount');
          s.mounting=false;
          const insert=appUI(a);check(insert,'Debug stage controls not found');
          const bar=document.createElement('div');bar.dataset.act6DebugActive=String(id);bar.style.cssText='pointer-events:auto;background:#172227;color:#f3ead8;padding:6px 10px;border-radius:6px;font-size:12px;line-height:1.3;';
          const label=document.createElement('div');label.textContent='6막 '+(id-50)+'장 검수 · 저장 안 됨';bar.append(label);
          const back=document.createElement('button');back.type='button';back.dataset.act6DebugBack='';back.textContent='검수 목록';bar.append(back);
          back.addEventListener('click',event=>{if(event.isTrusted&&owns()){a.showTitle();a.settings('debug');}});
          insert.prepend(bar);return true;
        }catch(error){
          if(s&&stageDebug.get(a)===s){s.mounting=false;a.showTitle();a.settings('debug');}
          a.notify('6막 검수 전투를 열지 못했습니다. 일반 기록은 그대로입니다.');G.console.warn(error);return false;
        }finally{stageDebugBusy.delete(a);}
      }
      function installDebugStages(a){
        const service=G.HonroActEndings;
        if(!descriptor.debugFixtures||!service||stageDebugInstalled.has(service)||G.HONRO_EMBEDDED)return;
        stageDebugInstalled.add(service);
        const previous=service.debugControls;
        service.debugControls=app=>{
          const initial=previous(app);
          if(!debugMenuAllowed(app))return initial;
          const buttons=debugStageIds.map(id=>'<button type="button" data-act6-debug-stage="'+id+'">'+(id-50)+'장</button>').join('');
          return initial+'<section class="settings-group" data-act6-debug-list><h3>6막 스테이지 검수</h3><div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px">'+buttons+'</div><p class="menu-note">검수용 파티로 시작합니다. 일반 기록과 보상은 바뀌지 않습니다.</p></section>';
        };
        document.addEventListener('click',event=>{
          const control=event.target.closest?.('[data-act6-debug-stage]');
          if(!event.isTrusted||!control||control.disabled||!a.modal.contains(control)||!debugMenuAllowed(a))return;
          const parent=control.closest('[data-act6-debug-list]'),profile=a.profile;
          const live=()=>!!parent?.isConnected&&a.modal.contains(control)&&a.profile===profile;
          control.disabled=true;launchDebugStage(a,Number(control.dataset.act6DebugStage),live).finally(()=>{control.disabled=false;});
        });
      }
