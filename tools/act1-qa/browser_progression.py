"""Post-win normal UI/save coverage. Every page evaluation below is read-only."""
import time

# Authored contracts: journey-content transitionAfter(1) is direct;
# progression.recruitAtEntry uses the Stage5 knight anchor at entry6;
# act2.recruit joins occultist after cleared10, act-endings.next opens rest.
CONTRACTS = {
 1: {'stage': 2, 'screen': 'battle', 'recruit': None},
 9: {'stage': 10, 'screen': 'battle', 'recruit': None},
 5: {'stage': 6, 'screen': 'rest', 'recruit': 'knight'},
 10: {'stage': 11, 'screen': 'rest', 'recruit': 'occultist'},
}
SNAPSHOT = '''()=>{const a=HonroApp,p=JSON.parse(localStorage.getItem('honro-first-act-profile-1')||'null');
 const project=p=>p&&({cleared:p.cleared,recruited:p.recruited,party:p.party,
 heroes:Object.fromEntries(Object.entries(p.heroes||{}).map(([k,h])=>[k,{xp:h.xp,ranks:h.ranks,statTraining:h.statTraining}])),
 loadouts:p.loadouts,equipment:p.equipment,battleStage:p.honroBattle?.honroStage||null,
 journey:p.honroJourney,ending:p.honroActEnding||null,endingSeen:!!p.seen?.['act-ending-v1:10']});
 return {screen:a.screen,dialogue:!!a.dialogue,modal:a.modalKind,done:!!a.done,
 battleStage:a.engine?.b.honroStage||null,phase:a.engine?.b.phase||null,can:!!a.canInput(),
 restStage:a.profile.honroJourney?.stageId||null,nextStage:HonroJourneyContent.next(a.profile)?.stageId||null,
 endingCut:document.getElementById('act-ending')?.dataset.cut||null,locked:!!a.profileStore.locked,saveWarning:!!document.getElementById('outcome-save-warning'),
 persisted:project(p)};}'''

def assert_saved(snapshot, stage, terminal, entry_visits):
 assert terminal['phase']=='won','Battle loss/nonterminal cannot become persisted completion'
 assert not snapshot['locked'] and not snapshot['saveWarning'],'Profile save locked or warning present'
 stored=snapshot.get('persisted')
 assert stored,'Missing persisted profile'
 clear=stored.get('cleared',{}).get(str(stage))
 assert clear,'Legitimate victory has not persisted its completion record'
 assert clear['visits']==entry_visits+1,'Completion must settle exactly once'
 assert clear['rounds']==terminal['round'],'Stored completion round differs from frozen battle result'
 return stored

def assert_destination(snapshot, contract):
 assert not snapshot['dialogue'],'Authored arrival dialogue remains unfinished'
 assert snapshot['screen']==contract['screen'],'Wrong authored destination screen'
 key='battleStage' if contract['screen']=='battle' else 'restStage'
 assert snapshot[key]==contract['stage'],'Wrong authored destination stage'
 if contract['screen']=='battle':
  assert snapshot['can'],'Direct continuation has not reached normal input'
  assert snapshot['persisted']['battleStage']==contract['stage'],'Next battle not saved'
 else:
  assert snapshot['persisted']['battleStage'] is None,'Rest retained stale combat save'
  assert snapshot['persisted']['journey']['stageId']==contract['stage'],'Rest destination not saved'
 if contract['recruit']:
  assert contract['recruit'] in snapshot['persisted']['recruited'],'Authored recruit missing from saved roster'
  assert contract['recruit'] in snapshot['persisted']['party'],'Authored recruit missing from saved party'
 assert snapshot['persisted']['ending'] is None,'Act ending remains pending'
 if contract['recruit']=='occultist':assert snapshot['persisted']['endingSeen'],'Authored Act1 ending completion stamp missing'

def stable_signature(profile, stage):
 return {k:profile.get(k) for k in ['recruited','party','heroes','loadouts','equipment']} | {'completion':profile['cleared'][str(stage)]}

def finish_progression(page, stage, terminal, entry_visits, out, receipt, save):
 assert terminal['phase']=='won','Only a legitimate battle win enters progression coverage'
 contract=CONTRACTS[stage];receipt.update(passed=False,contract=contract,events=[])
 def take(label):
  row=page.evaluate(SNAPSHOT);receipt['events'].append({'op':label,'snapshot':row});save();return row
 def dialogue_next():
  button=page.locator('[data-action="dialogue-next"]:visible')
  if button.count() and button.first.is_enabled():button.first.click()
  else:page.keyboard.press('Enter')
 transition=None;deadline=time.monotonic()+180
 while time.monotonic()<deadline:
  s=page.evaluate(SNAPSHOT)
  if s['locked'] or s['saveWarning']:
   take('save-blocked');raise AssertionError('Normal outcome save requires recovery; not silently accepted')
  if s['dialogue']:dialogue_next()
  elif s['screen']=='act-ending':
   assert_saved(s,stage,terminal,entry_visits)
   assert stage==10,'Unexpected act-ending route'
   assert s['nextStage']==contract['stage'],'Runtime next place differs from authored contract'
   cuts=receipt.setdefault('endingCuts',[])
   if s.get('endingCut') not in cuts:cuts.append(s.get('endingCut'))
   if transition is None:
    transition='act-ending';take('persisted-act-ending')
    page.wait_for_function('()=>{const i=document.querySelector(".act-ending-art");return i&&i.complete&&i.naturalWidth>0}',timeout=60000)
    page.screenshot(path=str(out/'progression-act-ending.png'))
   page.keyboard.press('Enter')
  elif page.locator('[data-action="result-continue"]:visible').count():
   assert_saved(s,stage,terminal,entry_visits)
   assert s['nextStage']==contract['stage'],'Runtime next place differs from authored contract'
   if transition is None:
    transition='result-continue';take('persisted-result');page.screenshot(path=str(out/'progression-result.png'))
    page.locator('[data-action="result-continue"]:visible').click()
   else:assert transition=='result-continue','Unexpected result after act-ending'
   # CampaignEntry may leave the result visible while the next chunk loads.
   # Observe its pending normal callback, never click a duplicate continuation.
  elif transition and s['screen']==contract['screen'] and (s['battleStage'] if contract['screen']=='battle' else s['restStage'])==contract['stage']:
   if contract['screen']!='battle' or s['can']:break
  page.wait_for_timeout(400)
 else:raise AssertionError('Post-win normal UI did not reach authored destination within observation window')
 assert transition==('act-ending' if stage==10 else 'result-continue'),'Authored result/act-ending transition not observed'
 before=take('destination-before-reload');profile=assert_saved(before,stage,terminal,entry_visits);assert_destination(before,contract)
 signature=stable_signature(profile,stage);receipt['transition']=transition
 page.screenshot(path=str(out/'progression-destination.png'))
 page.reload(wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=60000)
 reloaded=take('title-after-reload');assert_saved(reloaded,stage,terminal,entry_visits)
 assert stable_signature(reloaded['persisted'],stage)==signature,'Reload changed rewards, recruits, equipment or completion'
 title=page.locator('.title-actions button.primary:visible');title.wait_for(state='visible',timeout=60000)
 assert title.get_attribute('data-action') in ['continue','rest'],'Reload did not offer normal journey continuation'
 title.click();deadline=time.monotonic()+120
 while time.monotonic()<deadline:
  s=page.evaluate(SNAPSHOT)
  if s['dialogue']:dialogue_next()
  elif s['screen']==contract['screen'] and (s['battleStage'] if contract['screen']=='battle' else s['restStage'])==contract['stage']:
   if contract['screen']!='battle' or s['can']:break
  page.wait_for_timeout(400)
 else:raise AssertionError('Reload/Continue failed to restore the authored destination')
 after=take('destination-after-reload');assert_saved(after,stage,terminal,entry_visits);assert_destination(after,contract)
 assert stable_signature(after['persisted'],stage)==signature,'Continue duplicated or changed settled rewards/recruitment'
 page.screenshot(path=str(out/'progression-reloaded.png'))
 receipt.update(passed=True,completion=after['persisted']['cleared'][str(stage)],recruited=after['persisted']['recruited']);save()
