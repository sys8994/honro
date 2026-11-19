"""Disposable Stage42 normal campaign render A/A/B/A. No actual play or save."""
import argparse,base64,hashlib,json,os,pathlib,re,urllib.parse
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('url');p.add_argument('output',type=pathlib.Path);p.add_argument('source_invariants',type=pathlib.Path);a=p.parse_args()
u=urllib.parse.urlparse(a.url);assert u.hostname in ('127.0.0.1','localhost','::1') and u.path=='/HONRO.html' and u.scheme=='http'
source=json.loads(a.source_invariants.read_text());assert source['checks']==46 and source['othersUnchanged'] and source['gameplayRolesUnchanged']
a.output.mkdir(parents=True,exist_ok=False)
HERE=pathlib.Path(__file__).resolve().parent
SETUP='''async()=>{
 await HONRO_APP_READY;
 await HonroCampaignLoader.ensureStage(42);
 const s=HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===42);
 if(!s||s.pending)throw Error('Stage42 not loaded by actual loader');
 const a=HonroApp;a.stopBattle();a.close();
 const template=HonroMaps.profileFor(s),profile=HonroProfileStore.fresh();
 const roster=HonroStageRules.stageParty(42);
 if(JSON.stringify(roster)!==JSON.stringify(['archer','mage','knight','occultist']))throw Error('Unexpected party');
 profile.recruited=[...roster];profile.party=[...roster];
 for(const cls of roster){const xp=template.heroes[cls].xp;if(!Number.isFinite(xp))throw Error('Invalid XP');profile.heroes[cls].xp=xp;HONRO_CORE.autoTrain(profile.heroes[cls],cls);HONRO_CORE.sanitizeLoadout(profile,cls);}
 // Test-only RAM adapter on this disposable App instance, not global source or real save.
 a.persist=()=>false;a.profileStore.save=candidate=>{if(!candidate.equipment)throw Error('Missing fresh equipment shell');return true;};
 a.profile=profile;a.normalProfile=profile;
 for(const id of HONRO_CONTENT.stages[41].requires)profile.cleared[id]={visits:1,rounds:18};
 if(!a.campaignReady()||!a.isOpen(HONRO_CONTENT.stages[41])||!HonroSplitCampaign.allowLaunch(a,42,false))throw Error('Entry gates not ready');
 a.launch(42);
 return {setup:'fresh shell + stock profileFor XP; prepared predecessor clear; RAM-only saves; NOT natural play',party:roster,levels:roster.map(c=>({id:c,xp:a.profile.heroes[c].xp,level:HONRO_CORE.levelOf(a.profile.heroes[c])})),equipmentReady:!!a.profile.equipment};
}'''

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('HONRO_CHROME') or None)
 context=browser.new_context(viewport={'width':1280,'height':800},device_scale_factor=1)
 context.add_init_script("Storage.prototype.setItem=function(){throw Error('QA persistent storage blocked')};")
 page=context.new_page();errors=[];phase='navigation';result={}
 page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(a.url,wait_until='domcontentloaded');page.wait_for_function('!!globalThis.HonroApp && !!globalThis.HonroCampaignLoader',timeout=90000)
  phase='prepared-campaign-entry';result['setup']=page.evaluate(SETUP)
  page.wait_for_function('HonroApp.engine?.b?.honroStage===42 && HonroApp.stage?.id===42 && HonroApp.screen==="battle"',timeout=30000)
  phase='bounded-stock-intro'
  page.evaluate("()=>{const a=HonroApp,b=a.engine.b,step=b.honroState.act5.step;let n=0;while(a.dialogue&&n<12){HonroStory.finish(a);n++;}if(b!==a.engine.b||b.round!==1||b.honroState.act5.step!==step)throw Error('Unexpected gameplay transition during intro');}")
  page.wait_for_function('HonroApp.canInput() && !HonroApp.dialogue',timeout=15000)
  page.wait_for_timeout(700)
  phase='far-exact-same-scene-ab'
  payload=page.evaluate((HERE/'far-ab.js').read_text(),{'sourcePath':'/stage42-evening-h2-q95.qa.webp','key':'act5Stage42EveningH2Q95','sha':'baf4efc3ea202073e8202de9aeea4c09a161b6473eb19f3d77f727d38d34d4e9'})
  shots={}
  for name,value in payload.pop('images').items():
   assert re.fullmatch(r'(entry-desktop|west-phone-crop)-([AB]-full|[AB]-background|A-foreground)',name)
   assert value.startswith('data:image/png;base64,')
   b=base64.b64decode(value.split(',',1)[1],validate=True)
   assert b.startswith(b'\x89PNG\r\n\x1a\n')
   (a.output/(name+'.png')).write_bytes(b)
   shots[name]={'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b)}
  # The JS guard's own finally must restore both original key and temporary image registration.
  payload['restoredAfterFinally']=page.evaluate("()=>{const a=HonroAuthoredFarArt;return a.keyFor(42)==='valleyFar'&&!Object.hasOwn(a.manifest.images,'act5Stage42EveningH2Q95');}")
  result.update(payload);result['evidence']=shots
  assert result['pass'] and result['restoredAfterFinally'] and not errors,'Exact comparators failed; see measured JSON'
  phase='matched-far-only-pass-no-art-judgment'
 except Exception as e:
  result['error']=str(e);raise
 finally:
  result['checkpoint']=phase;result['pageErrors']=errors
  (a.output/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
  context.close();browser.close()
