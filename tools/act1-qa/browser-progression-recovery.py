"""Resume entire, unmodified genuine WON save from a successful UI artifact.
No battle replay or fabricated completion. Initial storage import is the only write
outside normal UI. Current served game bytes must match that original run.
"""
import hashlib,json,os,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_progression import finish_progression
ROOT=Path(__file__).resolve().parents[2]
prior=Path(os.environ['HONRO_PRIOR_ARTIFACT'])
out=Path(os.environ.get('HONRO_QA_OUT','_local/reports/act1-progression-ui'));out.mkdir(parents=True,exist_ok=True)
SOURCE='fe2cca9a975206a5fb0e72c1422b7401ec2df60d';RUN=41515762111
result={'passed':False,'scope':__doc__,'source':os.environ.get('GITHUB_SHA'),'prerequisiteRun':RUN,'battleSource':SOURCE,'errors':[]}
def save():(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
try:
 raw=(prior/'result.json').read_bytes();previous=json.loads(raw);stage=int(os.environ['HONRO_STAGE'])
 assert previous['passed'] is True and previous['source']==SOURCE and not previous.get('errors') and not previous.get('exception'),'Invalid prerequisite actual UI receipt'
 assert previous['stage']==stage and previous['final']['phase']=='won','Prerequisite is not this stage win'
 assert (prior/'source.txt').read_text().strip()==SOURCE,'Prerequisite source receipt mismatch'
 profile=previous['stored'];battle=profile['honroBattle']
 assert battle['phase']=='won' and battle['honroStage']==stage and battle['round']==previous['final']['round'],'Artifact does not contain the exact genuine terminal battle save'
 # No fields are synthesized or changed; serialize the entire recorded save.
 serialized=json.dumps(profile,ensure_ascii=False,separators=(',',':'))
 verified=[]
 for line in (prior/'served-sha256.txt').read_text().splitlines():
  digest,name=line.split(maxsplit=1);name=name.lstrip('*');assert name in ['HONRO.html','web/manifest.json'],'Unexpected served file'
  assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==digest,'Game bytes differ from prerequisite battle run: '+name
  verified.append(name)
 assert set(verified)=={'HONRO.html','web/manifest.json'},'Incomplete served byte receipt'
 manifest=json.loads((ROOT/'web/manifest.json').read_text())
 for entry in manifest['files']:
  path=(ROOT/entry['path']).resolve();assert path.is_relative_to(ROOT),'Manifest path outside checkout'
  assert hashlib.sha256(path.read_bytes()).hexdigest()==entry['sha256'],'Manifest content mismatch: '+entry['path']
 result.update(stage=stage,final=previous['final'],battlePassed=True,entryVisits=profile.get('cleared',{}).get(str(stage),{}).get('visits',0),
  prerequisiteArtifact=os.environ['HONRO_PRIOR_ARTIFACT_ID'],prerequisiteResultSha256=hashlib.sha256(raw).hexdigest(),
  importedProfileSha256=hashlib.sha256(serialized.encode()).hexdigest(),sameGameBytes={'served':verified,'manifestFilesVerified':len(manifest['files'])},progression={})
 (out/'imported-genuine-won-profile.json').write_text(serialized)
 with sync_playwright() as w:
  browser=w.chromium.launch(headless=True);page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:result['errors'].append(str(e)))
  try:
   page.goto(os.environ.get('HONRO_QA_URL','http://127.0.0.1:8870/HONRO.html'),wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=60000)
   page.evaluate('(text)=>localStorage.setItem("honro-first-act-profile-1",text)',serialized)
   page.reload(wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=60000)
   page.screenshot(path=str(out/'restored-title.png'))
   page.locator('.title-actions [data-action="continue"]:visible').first.click()
   finish_progression(page,stage,result['final'],result['entryVisits'],out,result['progression'],save)
   result['stored']=json.loads(page.evaluate('localStorage.getItem("honro-first-act-profile-1")'))
   result['passed']=result['progression']['passed'] is True and not result['errors'];save()
  except Exception:
   page.screenshot(path=str(out/'failure.png'));raise
  finally:browser.close()
except Exception:result['exception']=traceback.format_exc();result['passed']=False
finally:save()
if not result['passed']:raise SystemExit(1)
