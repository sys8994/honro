"""Read-only provenance for one immutable, already-gated A1 visual candidate."""
import hashlib, io, json, os, pathlib, subprocess, urllib.error, urllib.request, zipfile
ROOT=pathlib.Path(__file__).resolve().parents[2]
CANDIDATE='7d2655bc3f88a7b20fb2d6ea1bc4c611583e9a15'
SOURCE='d46a0b9262ad624375f16a8743384249eaff0529'
RUN=41559612732
ARTIFACT=13197461360
ZIP_SHA='011f29bf039488ea5ea4741bb44041336bcb12c67621e957c615b5fafb508bb3'
RECEIPT_SHA='a7505883754554d0a3a1c02f584e6c5865d19b5fb3725b967b08e7b98388d4ff'
PAGES='https://sys8994.github.io/honro'
ALLOWED={'tests/monster-effects-browser.py','tests/monster-effects-browser-harness.mjs','.github/workflows/monster-a1-visual-qa.yml','tools/monster-a1-qa/request.json','tools/monster-a1-qa/verify-candidate.py'}
ALLOWED.update({'tools/monster-a1-qa/reuse-natural-checkpoints.py','tests/monster-natural-preflight.mjs','tests/fixtures/monster-natural/stage8-entry.json', 'tests/monster-natural-stage5.js', 'tests/monster-natural-browser.py', 'tests/fixtures/monster-natural/stage5-ui-commands.json', 'tests/monster-natural-runtime.js', 'tests/fixtures/monster-natural/stage8-controller.mjs', 'tests/fixtures/monster-natural/stage5-entry.json', '.github/workflows/monster-a1-natural-qa.yml', 'tests/fixtures/monster-natural/stage8-navigator.mjs', 'tests/fixtures/monster-natural/provenance.json', 'tests/fixtures/monster-natural/player-operations.mjs', 'tests/fixtures/monster-natural/baseline-condition.mjs', 'tests/monster-natural-build.py', 'tests/fixtures/monster-natural/stage5-planner.js'})
FILES={'htmlSha256':'HONRO.html','manifestSha256':'web/manifest.json','stage31PackageSha256':'tools/stage31/production-package.json'}
def digest(data):return hashlib.sha256(data).hexdigest()
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,text=True).strip()
def request_data():
 q=json.loads((ROOT/'tools/monster-a1-qa/request.json').read_text())
 assert (q['version'],q['candidate'],q['source'],q['runId'],q['artifactId'],q['artifactSha256'],q['receiptSha256'],q['publicUrl'])==(1,CANDIDATE,SOURCE,RUN,ARTIFACT,ZIP_SHA,RECEIPT_SHA,PAGES),'Immutable request identity changed'
 assert type(q['public']) is bool
 return q
def validate_receipt(q,data):
 assert digest(data)==RECEIPT_SHA,'Original gated receipt bytes differ'
 r=json.loads(data);assert r['sourceCommit']==SOURCE and str(r['runId'])==str(RUN)
 for k,v in q['expected'].items():assert r[k]==v,(k,r[k],v)
 assert r['browser']['status']=='passed' and len(r['browser']['rows'])==6
 assert all(x['continue']['exact'] and x['fileInputPointerContinueExact'] and x['pauseExact'] for x in r['browser']['rows'])
 return r
def api(path):
 token=os.environ['GH_TOKEN'];headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'honro-a1-visual-qa'}
 with urllib.request.urlopen(urllib.request.Request('https://api.github.com/repos/sys8994/honro/'+path,headers=headers),timeout=60) as r:return json.load(r)
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*_args,**_kwargs):return None
def download_artifact():
 url=f'https://api.github.com/repos/sys8994/honro/actions/artifacts/{ARTIFACT}/zip'
 request=urllib.request.Request(url,headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Accept':'application/vnd.github+json','User-Agent':'honro-a1-visual-qa'})
 try:
  with urllib.request.build_opener(NoRedirect).open(request,timeout=60) as r:return r.read()
 except urllib.error.HTTPError as e:
  if e.code not in (301,302,303,307,308):raise
  target=e.headers['Location'];assert target.startswith('https://'),'Artifact redirect must be HTTPS'
 # Do not forward the GitHub credential to the artifact blob host.
 with urllib.request.urlopen(target,timeout=120) as r:return r.read()
def main():
 q=request_data();out=ROOT/'_local/reports/monster-a1-visual-qa';out.mkdir(parents=True,exist_ok=True)
 assert git('rev-list','--parents','-n','1',CANDIDATE).split()==[CANDIDATE,SOURCE]
 subprocess.check_call(['git','merge-base','--is-ancestor',CANDIDATE,'HEAD'],cwd=ROOT)
 changed=set(filter(None,git('diff','--name-only',CANDIDATE,'HEAD').splitlines()));assert changed<=ALLOWED,changed-ALLOWED
 for key,path in FILES.items():assert digest((ROOT/path).read_bytes())==q['expected'][key],path+' differs from gated artifact'
 run=api(f'actions/runs/{RUN}');assert (run['head_sha'],run['status'],run['conclusion'])==(SOURCE,'completed','success')
 meta=api(f'actions/artifacts/{ARTIFACT}');assert meta['workflow_run']['id']==RUN and meta['workflow_run']['head_sha']==SOURCE and not meta['expired']
 assert meta.get('digest')=='sha256:'+ZIP_SHA
 archive=download_artifact();assert digest(archive)==ZIP_SHA
 with zipfile.ZipFile(io.BytesIO(archive)) as z:receipt_bytes=z.read('monster-a1-release/receipt.json')
 receipt=validate_receipt(q,receipt_bytes);(out/'original-gated-receipt.json').write_bytes(receipt_bytes)
 base='http://127.0.0.1:8871'
 if q['public']:
  base=PAGES
  for key,path in [('htmlSha256','HONRO.html'),('manifestSha256','web/manifest.json')]:
   with urllib.request.urlopen(base+'/'+path,timeout=60) as r:assert digest(r.read())==q['expected'][key],'Public '+path+' does not match gated candidate'
 (out/'base-url.txt').write_text(base+'\n');(out/'request.json').write_text(json.dumps(q,indent=2)+'\n')
 proof={'status':'verified','qaCommit':git('rev-parse','HEAD'),'candidate':CANDIDATE,'source':SOURCE,'originalRun':RUN,'originalArtifact':ARTIFACT,'artifactSha256':ZIP_SHA,'receiptSha256':RECEIPT_SHA,'served':base,'public':q['public'],'unchangedGatedFiles':FILES,'qaOnlyChangedFiles':sorted(changed),'scope':q['scope']}
 (out/'provenance.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps(proof))
if __name__=='__main__':main()
