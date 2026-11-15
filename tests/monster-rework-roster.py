# Separate Chromium context. This checks initial slots and authored contracts,
# including fixture-constructed normal campaigns, without a play/clear claim.
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import launch, serve_game

SNAPSHOT="""async ({id,mode})=>{
  await HonroCampaignLoader.ensureStage(id);
  const content=HONRO_CONTENT.stages[id-1],st=HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===id),p=HonroProfileStore.fresh();
  p.settings.difficulty='story';
  for(let n=1;n<id;n++)p.cleared[n]={visits:1,rounds:14};
  for(const c of HONRO_CORE.CLASS_IDS){const h=p.heroes[c];h.xp=HONRO_CORE.xpAtLevel(Math.floor(HonroProgression.plan(id).entryLevel));HONRO_CORE.autoTrain(h,c);}
  p.recruited=HonroStageRules.stageParty(id);p.party=[...p.recruited];
  globalThis.HONRO_MONSTER_REWORK_DISABLED=mode==='baseline';
  const b=HonroWorld.build(content,p,false);
  if(mode==='inject')HonroMonsterRoster.prepareFresh(b);
  HonroStageRules.sanitizeStageBattle(b);HonroEncounters.configure(b);
  const enemies=b.units.filter(u=>u.side===1&&!u.dead&&!u.honroAct5Reserve&&!u.honroObjectiveTarget);
  const unit=u=>{
   const fields=['id','name','honroType','honroVariant','cls','role','x','y','hp','r','h','elite','boss','honroMidboss','fixed','honroPilotMidboss','honroAct4WreckBoss','honroAct4FinaleBoss','honroAct3Fiend','honroAct2Kind','loadout','honroCluster','spawnX','honroMonsterFormerElite','honroMonsterSpecies','honroMonsterPattern','honroMonsterVariant','honroMonsterEffectSkill','honroMonsterGroup','honroMonsterArchetype','honroAct5Keeper','honroAct5Elite'];
   const own=Object.fromEntries(fields.filter(k=>u[k]!==undefined).map(k=>[k,u[k]]));
   own.support=HonroMapEngine.surfaceY(b.terrain,u.x,u.y)?.t.id??null;
   own.safety=Object.keys(u).filter(k=>k.startsWith('honro')&&(k.includes('Boss')||k.includes('Escort')||k.includes('Anch')||k.includes('Team')));
   return own;
  };
  return {stage:id,title:content.name,width:b.width,height:b.height,active:b.honroActiveLimit,count:enemies.length,
   enemies:enemies.map(unit),heroes:b.units.filter(u=>u.side===0&&!u.dead).map(unit),waters:b.waters?.map(w=>[w.x,w.y,w.w,w.depth]),
   revision:b.honroMonsterReworkRevision||0, tide:b.honroAct4Design?.tide??null,markers:b.honroMarkers?.map(m=>[m.id,m.x,m.y,m.type,m.action]),
   objectives:b.honroObjectives,required:b.honroMap?.act5?.required,
   encounterMeta:st.encounters?.map(g=>[g.id,g.key,g.behavior,g.unitIds]),
   midCount:enemies.filter(u=>u.boss||u.honroMidboss||u.honroPilotMidboss).length,
   authoredNeutral:st.units.filter(u=>u.team!=='enemy'&&u.team!=='player').map(u=>[u.id,u.x,u.y,u.kind]),
   events:b.honroEvents?.map(e=>[e.id,e.when,e.action]),reserve:b.units.filter(u=>u.honroAct5Reserve).map(unit)};
}"""

SAVE_ENTRY="""async disabled=>{
  globalThis.HONRO_MONSTER_REWORK_DISABLED=disabled;
  const a=HonroApp,p=HonroProfileStore.fresh();
  p.settings.difficulty='story';
  for(let n=1;n<12;n++)p.cleared[n]={visits:1,rounds:14};
  p.recruited=HonroStageRules.stageParty(12);p.party=[...p.recruited];
  a.stopBattle();a.close();a.profile=p;a.normalProfile=p;
  await HonroCampaignLoader.ensureStage(12);a.launch(12);
}"""
SAVE_STATE="""()=>{
 const b=HonroApp.engine.b,u=b.units.find(unit=>unit.id==='sq-b2');
 return {session:b.session,revision:b.honroMonsterReworkRevision||0,
  id:u.id,pattern:u.honroMonsterPattern||null,species:u.honroMonsterSpecies||null,
  hp:u.hp,x:u.x,y:u.y,round:b.round,
  player:b.units.find(u=>u.side===0).id};
}"""


def save_round_trip(browser, url, disabled):
    page=browser.new_page(viewport={'width':800,'height':500})
    try:
        page.goto(url+'/HONRO.html',wait_until='domcontentloaded')
        page.wait_for_function('!!globalThis.HonroApp',timeout=90000)
        page.evaluate(SAVE_ENTRY,disabled)
        page.evaluate("""()=>{
          const a=HonroApp,b=a.engine.b,u=b.units.find(unit=>unit.id==='sq-b2');
          u.hp-=27;
          a.dirty=true;
          a.flushBattleSave();
        }""")
        before=page.evaluate(SAVE_STATE)
        assert before['revision']==(0 if disabled else 1),before
        assert before['species']==(None if disabled else 'eoduksini'),before
        page.reload(wait_until='domcontentloaded')
        page.wait_for_function('!!globalThis.HonroApp',timeout=90000)
        page.evaluate('HonroApp.continue()')
        page.wait_for_function('HonroApp.engine?.b?.honroStage===12',timeout=15000)
        after=page.evaluate(SAVE_STATE)
        assert after==before,(disabled,before,after)
    finally:
        page.close()


def contracts(before, after):
    protected={19,31,34,36,39,40,*range(41,51)}
    species={'geuseundae','dokkaebibul','eoduksini','sonmalmyeong','gaekgwi',
             'dueoksini','yagwanggwi','mulgwishin','geuseunsae','muyeo'}
    found=set()
    for stage in range(1,51):
        a,b=before[str(stage)],after[str(stage)]
        for field in ('count','active','objectives','events','reserve','authoredNeutral','markers'):
            assert a[field]==b[field],(stage,field)
        by_id={unit['id']:unit for unit in a['enemies']}
        assert [u['id'] for u in a['enemies']]==[u['id'] for u in b['enemies']],stage
        for u in b['enemies']:
            old=by_id[u['id']]
            for field in ('x','y','fixed','r','h','support','honroType','honroVariant','honroCluster','loadout'):
                assert u.get(field)==old.get(field),(stage,u['id'],field)
            if u.get('honroMonsterSpecies') in species:
                found.add(u['honroMonsterSpecies'])
        if stage in protected:
            assert a==b,stage
        else:
            assert b['revision']==1,stage
    assert found==species,sorted(species-found)
    muyeo=next(u for u in after['5']['enemies'] if u.get('honroMonsterSpecies')=='muyeo')
    repair=next(u for u in after['8']['enemies'] if u.get('honroMonsterPattern')=='bierRepair')
    assert muyeo['id']=='s5-entry-hound' and repair['id']=='s8-17' and repair['fixed'],(muyeo,repair)
    fires=[u for u in after['9']['enemies'] if u.get('honroMonsterSpecies')=='dokkaebibul']
    assert len(fires)==3 and len({u['support'] for u in fires})==1,fires
    assert max(u['x'] for u in fires)-min(u['x'] for u in fires)<420,fires
    water=next(u for u in after['33']['enemies'] if u.get('honroMonsterSpecies')=='mulgwishin')
    high=after['33']['tide']['high']
    assert water['support']=='approved33-low' and 100<=high-water['y']<=300,water


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('output',type=Path)
    parser.add_argument('--mode',choices=('candidate','baseline','inject'),default='candidate')
    parser.add_argument('--compare',type=Path)
    parser.add_argument('--save-round-trip',action='store_true')
    args=parser.parse_args()
    report={}
    with serve_game() as url,sync_playwright() as pw:
        browser=launch(pw)
        page=browser.new_page(viewport={'width':800,'height':500})
        page.goto(url+'/HONRO.html',wait_until='domcontentloaded')
        page.wait_for_function('!!globalThis.HonroApp',timeout=90000)
        if args.mode=='inject':
            page.add_script_tag(path='shared/runtime/monster-rework-roster.js')
        for stage in range(1,51):
            report[str(stage)]=page.evaluate(SNAPSHOT,{'id':stage,'mode':args.mode})
        page.close()
        if args.save_round_trip:
            for disabled in (True,False):
                save_round_trip(browser,url,disabled)
            print('Old and new compiled stage 12 saves resumed with matching slots and HP')
        browser.close()
    args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    if args.compare:
        previous=json.loads(args.compare.read_text(encoding='utf-8'))
        contracts(previous,report)
        print('All 50 compiled stages preserved slots and authored progression contracts')
    else:
        print('Captured 50 compiled stage rosters')


if __name__=='__main__':
    main()
