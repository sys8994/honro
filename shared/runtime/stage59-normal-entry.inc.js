      const signed59=new WeakMap(),mounting59=new WeakMap(),mounted59=new WeakMap(),cold59=new WeakSet();
      const descriptor59=Object.freeze({id:59,scope:'normal-baseline-only',authoredId:D59.authoredId,playSHA:D59.playSHA,worldSHA:D59.worldSHA});
      const scope59=(a,e,s)=>s===active.get(a)&&s?.normal51===true&&mounted59.get(e)===s&&s.engine===e&&a.engine===e&&
        a.profile===a.normalProfile&&normal51Provider.content(e.b)===e.stage&&inNormalStage(a,e,59)&&runtime(a)&&e.b.honroGrowth?.limit.total===0&&e.b.honroGrowth?.limit.combat===0;
      const eligible59=(a,s)=>a.screen==='battle'&&scope58(a,a.engine,s)&&s.b.phase==='won'&&a.done&&s.terminal?.stage===58&&s.terminal.won===true&&
        ['act6.daedosaStopped','act6.innerRevisionReady','act6.fourCorporealReturned'].every(x=>s.terminal.flags?.[x]===true)&&!!s.terminal.returnGate&&s.terminal.settlement===false;
      const adapter59=stage59Adapter(G,{
        verifyPrevious:r=>{
          const p=mounting59.get(r);if(!p||p.previous!==r)return false;
          const s=active.get(p.app);
          return p.stays()&&(!p.key||cold59.has(p.key))||s?.source59===p&&scope59(p.app,p.app.engine,s);
        },
        verifyNormal:(a,e)=>scope59(a,e,active.get(a))
      });
      async function enterNormal59(a,grant,prev){
        check(eligible59(a,prev)&&active.get(a)===prev,'No live 58 final rite authority');
        const e=prev.engine,original=prev.terminal,{packet,compiled}=grant,m=packet.map,p=structuredClone(a.profile);
        const live=e.b.units.filter(u=>u.side===0&&!u.summoned),fresh=Object.fromEntries(original.actors.map(u=>[u.cls,u]));
        check(live.length===4&&live.every(u=>same(u,fresh[u.cls])&&e.grounded(u))&&e.unit('a6-c08-boss')?.dead===true&&e.unit('a6-c08-expansion-node')?.dead===true&&
          same(original.guard,prev.previous.boundary.guard),'Native 58 outgoing body, boss, node or guard changed');
        return mountFrom58(a,grant,original,fresh,e.stage,normal51Provider.budget(e.b),()=>eligible59(a,prev)&&active.get(a)===prev,undefined,live);
      }
      async function mountCold59(a,grant,data,stays,key){
        if(!cold59.has(key)||!stays()||data.from!==58||data.to!==59||!runtime(a))return false;
        try{return await mountFrom58(a,grant,data.terminal,data.custody.full,data.stageSeed,data.budget,stays,key);}
        finally{cold59.delete(key);}
      }
      async function mountFrom58(a,grant,original,fresh,stageSeed,budget,stays,key,live=null){
        const {packet,compiled}=grant,m=packet.map,p=structuredClone(a.profile);
        const previous=Object.freeze({...original,crew:fresh,boundary:{full:fresh,guard:original.guard,association:original.association}}),
          source=Object.freeze({app:a,previous,original,packet,stays,key});
        check(signed59.get(packet)===compiled,'Incorrect signed 59 packet');
        check(!Object.hasOwn(original,'returnGate')||verifyReturnGate(original.returnGate,fresh),'Invalid R traversal proof');
        mounting59.set(previous,source);let prepared;
        try{prepared=await adapter59.prepare({descriptor:descriptor59,packet,compiled,previous});}catch(error){mounting59.delete(previous);throw error;}
        if(!prepared||!stays()){mounting59.delete(previous);throw Error('58 owner expired during preparation');}
        const st={...m,id:'stage-59',metadata:{stageId:59,campaign:true,act:6,actStage:9}};
        const content=Object.freeze({...stageSeed,id:59,local:59,actStage:9,active:4,requires:[58],name:'마지막 마당',goal:'가름진을 연결하고 교각을 되찾기',
          objective:D59.objective,w:st.width,h:st.height,wind:[0],victoryRule:{kind:'scripted',target:'act6-native-59'}});
        const project={...G.HONRO_PROJECT,stages:[st],library:packet.library};
        check(budget?.id===58,'Missing native 58 budget');
        const b=normal51Provider.begin(st,project,p,content,Object.freeze({...budget,id:59}),o=>G.HonroMaps.createBattle(st,project,p,o));
        check(b?.stageId===59&&b.honroStage===59&&b.mode==='campaign'&&normal51Provider.content(b)===content&&b.honroJourneyReplay!==true,'No native Stage59');
        const expected=new Map(grant.known);
        for(const [v,h] of [[b.terrain,D59.playSHA],[b.honroWorldTerrain,D59.worldSHA]]){
          const src=JSON.stringify(v);check(expected.get(src)===h,'Native 59 shape drift');fingerprints.set(src,h);
        }
        b.units=prepared.units;b.active=prepared.units[0].id;b.queue=prepared.units.map(u=>u.id);
        b.honroActiveLimit=8;b.enemyLimit=8;b.honroJourneyReplay=false;b.honroGeometryReady=true;b.honroGeometryRevision=2;b.honroContactRevision=2;
        a.stopBattle();
        if(live){
          for(const [i,seat] of prepared.units.entries()){
            const actor=live.find(u=>u.id===seat.id);
            check(actor&&actor.cls===seat.cls,'Original body was not present at R');
            prepared.units[i]=Object.assign(actor,seat);
          }
        }
        const old={profile:a.profile,stage:a.stage,stageId:a.stageId,training:a.training,selectedByUnit:a.selectedByUnit,done:a.done};
        const s={old,b,packet,previous,terminal:null,ordinaryRest:true,normal51:true,prepared59:prepared,source59:source};
        a.close();active.set(a,s);Object.assign(a,{stageId:59,stage:content,training:false,selectedByUnit:{}});
        try{
          a.mount(b,{freshReport:true,reportScope:'custom'});
          check(scope59(a,a.engine,s)&&a.engine.stage===content&&a.scene&&a.screen==='battle','Native normal 59 mount failed');
          if(original.returnGate){
            s.return59=mountReturnGate({G,e:a.engine,scene:a.scene,crew:prepared.units.filter(u=>u.side===0&&!u.summoned),
              proof:original.returnGate,installArt:installHallArt,onExit:()=>{s.return59=null;a.updateHUD(true);startAct6Opening(a,s,59);}});
            check(s.return59,'Native R support did not match the return receipt');
          }
          const ui=appUI(a);check(ui,'Normal 59 controls absent');const btn=document.createElement('button');
          btn.type='button';btn.dataset.act6QaLookout='';styleAction(btn);btn.addEventListener('click',event=>{if(event.isTrusted&&event.currentTarget===btn)action(a,event);});s.button=btn;ui.append(btn);
          tick59(a);if(!s.return59)startAct6Opening(a,s,59);return true;
        }catch(error){a.stopBattle();a.showTitle();throw error;}finally{mounting59.delete(previous);}
      }
      function bindNormal59(a,e,s){
        s.engine=e;mounted59.set(e,s);
        check(scope59(a,e,s),'Native 59 scope changed');
        s.owner59=adapter59.attach({app:a,engine:e,prepared:s.prepared59});
        check(s.owner59,'Native 59 owner refused');e.checkEnd=()=>a.checkMission(e);return true;
      }
      const finale59Dialogue=Object.freeze({
        guardFound:[
          ['휘겸','곽진. 표지 아래까지 왔소. ……곽진, 대답하게.'],
          ['설오','이쪽에는 움직이는 게 없습니다. 방패들이 전부 다리 쪽을 보고 있습니다.'],
          ['소단','여기 오래 계셨나 봐요. 매듭이 풀리지 않은 건 누가 끝까지 잡았기 때문일 거예요.'],
          ['휘겸','길을 맡겼지, 돌아오지 말라고 한 건 아니었는데.'],
          ['담허','휘겸, 그쪽 돌이 흔들리네. 네가 서 있는 데부터 물러나게.'],
          ['휘겸','알겠소. 이름은 내가 기억하오. 사람을 지킬 동안 저 자리를 밟고 넘어가는 건 나중이오.']
        ],
        forepaw:[
          ['설오','교각 위가 아니라 아래에서 올라옵니다. 처음부터 그쪽을 보고 계셨습니까?'],
          ['휘겸','지금은 보이오. 내가 교각에서 받치겠소. 위에서 쏘는 쪽이 먼저 자리를 잡으면 내 쪽을 불러 주시오.'],
          ['소단','다리 모서리 가까이 붙어 싸우지는 마요. 앞발이 물러나도 돌까지 같이 빠질 수 있어요.'],
          ['담허','지금은 저 앞발을 막아야 하네. 동쪽으로 돌아갈 일은 그 뒤일세.']
        ],
        twoWings:[
          ['설오','서쪽만 물러난 줄 알았더니 동쪽도 올라옵니다. 둘 다 열린 채입니다.'],
          ['담허','한쪽을 닫아 버리면 나머지 쪽으로 또 밀리네. 두 자리에서 받치면서 소단이 통과할 길을 남기세.'],
          ['소단','길이 생길 때까지 종터에서 기다릴게요. 모두 제 쪽으로만 오지는 마세요.'],
          ['휘겸','그러면 다리를 내가 보겠소. 이름 부르면 어디 서 있는지 먼저 대답하시오.']
        ],
        cliffHeld:[
          ['설오','지지석이 다시 받쳐 줍니다. 높은 쪽으로 길이 벌어졌습니다.'],
          ['휘겸','거기서 바로 내려오지 마시오. 내가 밑에서 서 있는 동안 돌이 또 움직이는지 봐 주시오.'],
          ['담허','설오는 높은 쪽을 보고, 나는 저 파열이 있는 데까지 돌아가겠네. 둘 다 흔들리면 서로 먼저 부르게.'],
          ['설오','좋습니다. 이쪽 길만 열어 둔 채로 조금 기다리겠습니다. 저 너머까지 무리해서 쏘지는 않겠습니다.']
        ],
        faultHeld:[
          ['담허','벌어지던 틈이 여기서는 멎었네. 다른 쪽에 바로 이어서 놓을 힘은 남겨야 해.'],
          ['소단','동쪽에서 오던 소리가 한 겹 줄어요. 저는 지금 있는 쪽에서 한 발도 더 안 갈게요.'],
          ['휘겸','교각을 비켜 달라는 신호가 오기 전까지는 여기 있겠소. 다 되었다고 수비를 풀지는 맙시다.'],
          ['담허','그래. 이쪽은 조금 더 버티는지 보고, 소단 쪽에서 부르면 그때 돌아가겠네.']
        ],
        soulHeld:[
          ['소단','방금 등을 돌리지 않고 지나갔어요. 이제 그어 둔 길이 살아 있어요.'],
          ['설오','혼이 걷는 곳에 화살을 놓지 않겠습니다. 넓게 흩어진 것은 방향을 볼 때까지 기다리겠습니다.'],
          ['담허','그 길을 지날 자리는 비워 둔 채로 잇자. 나머지 틈을 조이겠다고 거기까지 닫지 말게.'],
          ['소단','네. 제가 손을 들면 어디를 비워 둘지 보여 드릴게요.']
        ],
        bridgeHeld:[
          ['휘겸','한 번 밀렸지만 아직 여기 서 있소. 다리가 돌아가지는 않았소.'],
          ['설오','위에서 보입니다. 휘겸 씨 뒤를 보는 것은 이제 제가 맡겠습니다.'],
          ['소단','그럼 종터 쪽은 가까이 붙어도 돼요? 사람들이 다리로 다시 나가면 제 손이 모자라요.'],
          ['휘겸','그렇게 하시오. 이쪽은 내가 버틴 데서 더 뒤로 오지 않는지만 보겠소.'],
          ['담허','자리 옮길 때는 꼭 알려 주게. 한쪽이 비어도 멀리서는 늦게 보일 수 있어.']
        ],
        markSoulPath:[
          ['소단','여기 표시했어요. 한 번만 제 발을 여기서 떼지 않으면 길이 잡혀요.'],
          ['설오','그럼 종터로 내려오는 쪽만 보겠습니다. 다른 데서 소리가 나도 이쪽을 비우지 않겠습니다.'],
          ['휘겸','나까지 다리를 비우면 둘 다 막히오. 여기서 버틸 테니 자리를 옮기기 전에 부르시오.']
        ],
        activateGarmjin:[
          ['소단','이제 왼쪽으로 갑니다. 보내야 할 것과 막아야 할 것이 섞여 돌아오지는 않아요.'],
          ['담허','그래. 진을 더 넓히지는 말게. 우리가 지킬 쪽만 남겨 두지.'],
          ['설오','그래도 다리 끝에 서 있던 것은 아직 보입니다. 제가 먼저 그쪽을 다시 확인하겠습니다.'],
          ['휘겸','사람이 다 붙어 있는 데서 마지막으로 하겠소. 자리를 봤으면 서로 부르고 갑시다.']
        ]
      });
      function speak59State(a,s,r){
        const b=s.engine.b,st=r.states,p=b.honroState.localFinaleProgress;
        if(!st||r.failed||r.complete||st.activated)return false;
        const key=b.honroState.localReturnGuardAftermath?'guardFound':null;
        if(key&&showAct6Milestone(a,s,key,finale59Dialogue[key]))return true;
        if(p?.giant?.alive&&!st.forepaw&&showAct6Milestone(a,s,'forepaw',finale59Dialogue.forepaw))return true;
        if(!st.cliff&&!st.mage&&p?.fronts?.every(f=>f.spawned>0))return showAct6Milestone(a,s,'twoWings',finale59Dialogue.twoWings);
        for(const [fact,cue] of [['cliff','cliffHeld'],['mage','faultHeld'],['bridge','bridgeHeld'],['soul','soulHeld']])
          if(st[fact]&&showAct6Milestone(a,s,cue,finale59Dialogue[cue]))return true;
        return false;
      }
      function option59(s,e){
        return (s.owner59.project()?.targets??[]).find(t=>t.kind==='interaction'&&Math.abs(t.x-e.active?.x)<96);
      }
      function stage59UI(a,s,e){
        if(!scope59(a,e,s)||s.return59)return;
        const item=option59(s,e);if(!item)return;
        const q=s.owner59.interact(item.id);if(!q.ok)a.notify(q.reason);e.checkEnd();tick59(a);a.updateHUD(true);if(q.ok)showAct6Milestone(a,s,item.id,finale59Dialogue[item.id]);
      }
      function defend59(a,act){
        const s=active.get(a);
        return s?.owner59&&scope59(a,a.engine,s)?s.owner59.defend(act):act();
      }
      function tick59(a){
        const s=active.get(a),e=a.engine;if(e?.b?.honroStage!==59||!scope59(a,e,s)||!s.owner59)return;
        if(s.return59){
          if(s.button){s.button.textContent=`동행마다 서쪽 석단 끝까지 걸으십시오 · ${s.return59.remaining()}명`;s.button.disabled=true;s.button.dataset.act6Mission='';}
          return;
        }
        s.owner59.tick();const r=s.owner59.project();if(!r)return;
        const item=option59(s,e);
        if(s.button){s.button.textContent=item?.label??r.summary??'휘겸과 함께 교각 아래를 살핀다';s.button.disabled=!item;s.button.dataset.act6Mission=item?.id??'';}
        if((r.complete||r.failed)&&!a.done)e.checkEnd();else speak59State(a,s,r);
      }
      function terminalNormal59(a,s){
        if(!scope59(a,s.engine,s)||s.b.phase!=='won'||s.owner59.project()?.complete!==true)return null;
        const r=s.owner59.terminal();return r&&s.owner59.boundaryProof(r)?r:null;
      }
