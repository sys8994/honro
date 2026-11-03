"""Optional public-release byte proof for real browser document responses."""
import hashlib,json,os
from pathlib import Path

def verify_navigation(response,out,label):
 expected=os.environ.get('HONRO_EXPECT_HTML_SHA256')
 if not expected:return
 assert response and response.status==200,'Public document request did not succeed'
 actual=hashlib.sha256(response.body()).hexdigest()
 proof={'label':label,'url':response.url,'status':response.status,'expectedSha256':expected,'actualSha256':actual,'deployedReleaseSha':os.environ.get('HONRO_DEPLOYED_RELEASE_SHA'),'verifierSourceSha':os.environ.get('GITHUB_SHA'),'passed':actual==expected}
 path=Path(out)/'navigation-proof.json';rows=json.loads(path.read_text()) if path.exists() else [];rows.append(proof);path.write_text(json.dumps(rows,indent=2))
 assert actual==expected,'Browser document differs from reviewed release'
