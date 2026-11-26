      const prepSlots=['personal','common'];
      const prepNames={archer:'설오',mage:'담허',knight:'휘겸',occultist:'소단'};
      function latePrepButton(container,id,onOpen,label='전열 정비'){
        const button=document.createElement('button');
        button.type='button';button.dataset.act6FieldPrep=String(id);
        button.textContent=label;styleAction(button);container.append(button);
        button.addEventListener('click',event=>{if(event.isTrusted&&!button.hidden&&!button.disabled)onOpen(button);});
        return button;
      }
      function add52Preparation(app,state,controls){
        const button=document.createElement('button');
        button.type='button';button.dataset.act6ThresholdPrep='';button.hidden=true;
        button.textContent='전열 정비';styleAction(button);
        controls.append(button);
        state.prepButton=button;
        button.addEventListener('click',event=>{
          if(!event.isTrusted||active.get(app)!==state||!runtime(app)||app.done||app.dialogue||
            app.modal.classList.contains('open'))return;
          const e=state.engine,actors=owner.thresholdParty(app,e);
          if(!actors){app.notify('네 사람이 종터에 모이면 정비할 수 있습니다.');return;}
          fieldPrepForm(app,{actors,draft:state.prepDraft,mastery:true,
            context:'담허가 안으로 들기 전, 네 사람의 장비와 기예를 바꿀 수 있습니다.',
            isCurrent:()=>active.get(app)===state&&runtime(app)&&!!owner.thresholdParty(app,e),
            submit:(draft,changes)=>{
              state.prepDraft=changes.length?draft:null;button.textContent=changes.length?'전열 정비 변경':'전열 정비';
              if(changes.length)app.notify('의식을 시작하면 정비한 구성이 적용됩니다.');
            },clear:()=>{state.prepDraft=null;button.textContent='전열 정비';},clearText:state.prepDraft?'정비 취소':'변경 없이 닫기'
          });
        });
      }
      function fieldPrepForm(app,{actors,custody=actors,draft:beforeDraft,context,mastery=false,isCurrent,submit,clear=()=>{},clearText='변경 없이 닫기'}){
        if(!isCurrent())return;
        app.open('<h2 id="act6-prep-title">전열 정비</h2><p><span data-prep-context></span> 체력과 혼기는 회복되지 않습니다.</p><div data-prep-roster></div><p data-prep-feedback role="status"></p><div class="actions"><button type="button" data-prep-clear>변경 없이 닫기</button><button type="button" class="primary" data-prep-apply>정비 적용</button></div>','act6-threshold-prep');
        app.modal.querySelector('.dialog').setAttribute('aria-labelledby','act6-prep-title');
        app.modal.querySelector('[data-prep-context]').textContent=context;
        const roster=app.modal.querySelector('[data-prep-roster]'),inputs=Object.create(null);
        const select=(name,values,current)=>{
          const label=document.createElement('label'),field=document.createElement('select');
          label.style.cssText='display:grid;gap:3px;margin-block:8px';
          field.style.cssText='min-height:44px;width:100%;max-width:100%;color:#e5d7b6;background:#17231e;border:1px solid #7b6a48;padding:4px 8px';
          label.append(name,field);
          for(const [id,text] of values){const option=new Option(text,id,id===current,id===current);field.add(option);}
          return {label,field};
        };
        for(const u of actors){
          const details=document.createElement('details'),title=document.createElement('summary');
          details.style.cssText='padding-block:8px;border-bottom:1px solid #91878155';
          title.textContent=prepNames[u.cls];details.append(title);roster.append(details);
          const before=beforeDraft?.[u.cls],available=thresholdPrepChoices(C,app.profile,custody,u);
          inputs[u.cls]={skills:[],gear:[]};
          for(const [i,slot] of prepSlots.entries()){
            const current=before?.gear[i]??u.equipmentIds?.find(id=>C.EQUIPMENT_MAP[id]?.slot===slot)??'';
            const values=available.equipment.filter(id=>C.EQUIPMENT_MAP[id].slot===slot);
            const {label,field}=select(i===0?'전용 장비':'공용 장비',[['','장착 안 함'],...values.map(id=>[id,C.EQUIPMENT_MAP[id].name])],current);
            details.append(label);inputs[u.cls].gear.push(field);
          }
          for(let i=0;i<3;i++){
            const current=before?.skills[i]??u.loadout[i+1]??'';
            const {label,field}=select('기예 '+(i+1),[['','비워 둠'],...available.known.map(id=>[id,C.SKILLS[id].name])],current);
            details.append(label);inputs[u.cls].skills.push(field);
          }
          if(mastery&&descriptor.releaseEnabled&&typeof saveAct6Mastery==='function'){
            const card=document.createElement('section'),title=document.createElement('strong'),status=document.createElement('p');
            card.className='mastery-panel';title.textContent='통달';status.setAttribute('role','status');card.append(title);details.append(card);
            const hero=()=>{const h=structuredClone(app.engine.b.heroes[u.cls]);h.xp=G.HonroProgression.act6EntryXP(app.profile,u.cls,app.stageId===57?58:app.stageId);return h;};
            function masteryChoices(){
              const h=hero(),ids=[C.baseSkill(u.cls),...C.TALENTS.filter(n=>n.cls===u.cls&&h.ranks[n.id]===8).map(n=>n.id)];
              const {label,field}=select('통달할 기예',[['','기예 선택'],...ids.filter(id=>!C.masteryLearned(h,id)).map(id=>[id,`${C.SKILLS[id].name} · Lv.${C.masteryLevel(id)} · ${C.masteryCost(id)} SP`])],'');
              const description=document.createElement('p'),notice=document.createElement('small'),commit=document.createElement('button'),demo=document.createElement('button');
              notice.textContent=`보유 ${C.pointsLeft(h,u.cls)} SP · 통달 확정 후 투자 반환 불가`;
              commit.type='button';commit.textContent='통달 확정';commit.disabled=true;
              demo.type='button';demo.textContent='통달 시연';demo.disabled=true;
              const clearDemo=()=>{const old=app.modal.querySelector('[data-field-mastery-preview]');if(old){old.remove();app.preview=null;app.previewRequest=null;}};
              demo.addEventListener('click',event=>{
                if(!event.isTrusted||!open()||!field.value)return;
                clearDemo();
                const shell=document.createElement('section'),canvas=document.createElement('canvas'),readout=document.createElement('p');
                shell.className='skill-preview-shell';shell.dataset.fieldMasteryPreview='';
                canvas.id='previewcanvas';canvas.width=720;canvas.height=360;canvas.setAttribute('aria-label',C.SKILLS[field.value].name+' 통달 시연');
                readout.className='preview-observation';shell.append(canvas,readout);demo.after(shell);
                app.detailSkill=field.value;app.prepareSkillPreview(field.value,hero(),canvas,'mastered');
              });
              field.addEventListener('change',()=>{
                const id=field.value,reason=id&&C.masteryReason(hero(),u.cls,id);
                description.textContent=id?C.MASTERY_RULES[id][1]+(reason?` · ${reason}`:''):'';
                clearDemo();demo.disabled=!id;commit.disabled=!id||!!reason;
              });
              commit.addEventListener('click',async ev=>{
                if(!ev.isTrusted||!open()||commit.disabled)return;
                const id=field.value;commit.disabled=true;field.disabled=true;
                if(await saveAct6Mastery(app,u,id,open)){
                  status.textContent=C.SKILLS[id].name+' 통달 완료';
                  if(open()){clearDemo();masteryChoices();}
                }else if(open()){field.disabled=false;commit.disabled=false;status.textContent='통달을 기록하지 못했습니다.';}
              });
              const known=document.createElement('small');
              known.textContent=h.masteries?.length?`통달 완료 ${h.masteries.map(id=>C.SKILLS[id].name).join(' · ')}`:'';
              card.replaceChildren(title,known,label,description,notice,demo,commit,status);
            }
            masteryChoices();
          }
          if(u===(actors.find(actor=>actor.cls==='mage')??actors[0]))details.open=true;
        }
        app.modal.querySelector('[data-prep-clear]').textContent=clearText;
        const open=()=>app.modalKind==='act6-threshold-prep'&&app.modal.classList.contains('open')&&isCurrent();
        app.modal.querySelector('[data-prep-clear]').addEventListener('click',ev=>{
          if(!ev.isTrusted||!open())return;
          clear();app.close();
        });
        app.modal.querySelector('[data-prep-apply]').addEventListener('click',ev=>{
          if(!ev.isTrusted||!open())return;
          const draft=Object.fromEntries(Object.entries(inputs).map(([key,v])=>[key,{skills:v.skills.map(f=>f.value),gear:v.gear.map(f=>f.value)}]));
          const changes=planThresholdPrep(C,app.profile,actors,draft,{count:actors.length,custody});
          if(!changes){app.modal.querySelector('[data-prep-feedback]').textContent='같은 기예나 장비가 중복되지 않았는지 확인해 주세요.';return;}
          app.close();submit(draft,changes);
        });
      }
      function applyFieldPrep(app,changes){
        for(const {u,next} of changes){
          Object.assign(u,next);
          if(app.selectedByUnit)delete app.selectedByUnit[u.id];
        }
        if(changes.length&&changes.some(({u})=>u===app.engine?.active)){
          app.selected=app.engine.active.loadout[0];
        }
        if(changes.length)app.updateHUD(true);
      }
