#!/usr/bin/env python3
"""Restore exactly the reviewed QA candidates from the immutable auxiliary commit."""
import base64,hashlib,json,lzma,pathlib,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[2];COMMIT='a5c521b384ef9086194cfaafcf36291f06e05569'
index=json.loads((ROOT/'tools/act4-rc/REVIEW_INDEX.json').read_text());out=ROOT/'_local/act4-rc/candidates';out.mkdir(parents=True,exist_ok=True)
def sha(b):return hashlib.sha256(b).hexdigest()
assert [x['stage'] for x in index['candidates']]==list(range(31,41)) and index['releaseApproved'] is False
for x in index['candidates']:
 m=json.loads((ROOT/f"tools/act4-rc/stage{x['stage']}.manifest.json").read_text());encoded=subprocess.check_output(['git','show',f"{COMMIT}:{x['payload']}"],cwd=ROOT);encoded=b''.join(encoded.split());assert m.get('base64Chars',len(encoded))==len(encoded)
 compressed=base64.b64decode(encoded,validate=True);assert len(compressed)==m['xzBytes'] and sha(compressed)==m['xzSha256'];raw=lzma.decompress(compressed);assert len(raw)==m['rawBytes'] and sha(raw)==m['rawSha256']==x['rawSha256'];doc=json.loads(raw);assert len(doc['stages'])==1 and doc['stages'][0]['metadata']['stageId']==x['stage'];(out/f"stage{x['stage']}.json").write_bytes(raw);print(x['stage'],len(compressed),sha(compressed),len(raw),sha(raw),flush=True)
