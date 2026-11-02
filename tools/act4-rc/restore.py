#!/usr/bin/env python3
"""Restore exactly the reviewed QA candidates from the immutable auxiliary commit."""
import base64,hashlib,json,lzma,pathlib,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[2];COMMIT='6f65b57fa7d389daec0f3932c7b094cff1b2dcc9'
index=json.loads((ROOT/'tools/act4-rc/REVIEW_INDEX.json').read_text());out=ROOT/'_local/act4-rc/candidates';out.mkdir(parents=True,exist_ok=True)
def sha(b):return hashlib.sha256(b).hexdigest()
assert [x['stage'] for x in index['candidates']]==list(range(31,41)) and index['releaseApproved'] is False
for x in index['candidates']:
 m=json.loads((ROOT/f"tools/act4-rc/stage{x['stage']}.manifest.json").read_text());encoded=subprocess.check_output(['git','show',f"{COMMIT}:{x['payload']}"],cwd=ROOT);encoded=b''.join(encoded.split());assert m.get('base64Chars',len(encoded))==len(encoded)
 compressed=base64.b64decode(encoded,validate=True);assert len(compressed)==m['xzBytes'] and sha(compressed)==m['xzSha256'];raw=lzma.decompress(compressed);assert len(raw)==m['rawBytes'] and sha(raw)==m['rawSha256']==x['rawSha256'];doc=json.loads(raw);assert len(doc['stages'])==1 and doc['stages'][0]['metadata']['stageId']==x['stage'];(out/f"stage{x['stage']}.json").write_bytes(raw);print(x['stage'],len(compressed),sha(compressed),len(raw),sha(raw),flush=True)

# Preserve the earlier 33 QA art for exactly matching compact-save references.
legacy_commit='a5c521b384ef9086194cfaafcf36291f06e05569'
legacy_payload='art/act4-sharp-candidates/stage33-envfix-valid.candidate.json.xz.b64'
legacy_manifest='art/act4-sharp-candidates/stage33-envfix-valid.manifest.json'
m=json.loads(subprocess.check_output(['git','show',f'{legacy_commit}:{legacy_manifest}'],cwd=ROOT));encoded=b''.join(subprocess.check_output(['git','show',f'{legacy_commit}:{legacy_payload}'],cwd=ROOT).split());assert m.get('base64Chars',len(encoded))==len(encoded);compressed=base64.b64decode(encoded,validate=True);assert len(compressed)==m['xzBytes'] and sha(compressed)==m['xzSha256'];raw=lzma.decompress(compressed);assert len(raw)==m['rawBytes'] and sha(raw)==m['rawSha256']=='dec192b634d200adb179a4e24d7f8f0bba863579c67b233410c8649c9eb6b0dd';(out/'stage33-legacy.json').write_bytes(raw);print('33 legacy',len(compressed),sha(compressed),len(raw),sha(raw),flush=True)

# Preserve the prior selected 34 art for exact old compact-save references.
legacy34_commit='c5df56daf71d62d28d308d982bc431b3c75fb98d'
legacy34_payload='art/act4-sharp-candidates/stage34-align-v2.candidate.json.xz.b64'
legacy34_manifest='art/act4-sharp-candidates/stage34-align-v2.manifest.json'
m=json.loads(subprocess.check_output(['git','show',f'{legacy34_commit}:{legacy34_manifest}'],cwd=ROOT));encoded=b''.join(subprocess.check_output(['git','show',f'{legacy34_commit}:{legacy34_payload}'],cwd=ROOT).split());assert m.get('base64Chars',len(encoded))==len(encoded);compressed=base64.b64decode(encoded,validate=True);assert len(compressed)==m['xzBytes'] and sha(compressed)==m['xzSha256'];raw=lzma.decompress(compressed);assert len(raw)==m['rawBytes'] and sha(raw)==m['rawSha256']=='19c4824a013675e6b3454e2ea01487d190cbabb3aa209318b787b34889b5c7a1';(out/'stage34-legacy.json').write_bytes(raw);print('34 legacy',len(compressed),sha(compressed),len(raw),sha(raw),flush=True)
