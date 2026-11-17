"""Offline-only input contract. No browser launch, network, or save import."""
import ast,hashlib,lzma,re
from pathlib import Path
root=Path(__file__).resolve().parents[2]
paths=['tools/stage40-qa-resume/play.py','tools/stage40-app-flow/escort_inputs.py','tools/stage40-public-release/play.py']
for name in paths:
 s=(root/name).read_text();ast.parse(s)
 for pattern in [r'\b(?:e|engine)\.fire\s*\(',r'\.tick\s*\(',r'HonroStory\.finish\s*\(',r'localStorage\.(?:setItem|removeItem|clear)\s*\(',r'\b(?:b\.phase|u\.hp|q\.complete|q\.returnEscort)\s*=(?!=)',r'add_init_script',r'launch_persistent_context',r'\.route\(']:assert not re.search(pattern,s),(name,pattern)
 assert "get_by_text('전투 처음부터'" not in s
p=(root/paths[-1]).read_text()
for token in ['identity.preflight()',"assert context.storage_state()=={'cookies':[],'origins':[]}",'identity.attach(p)','identity.finish(p)',"'ada2099bcb273de6d7031cf1a8c8c3b361fa75054d73975521892ce112b7c3ed'","get_by_text('JSON 기록 가져오기'","get_by_text('이어서 걷기'",'set_input_files',"live['battle']['round']==29","result['initial']['foes']==0","result['initial']['phase']=='aim'","finish_escort(p,out)"]:assert token in p,token
assert '<=23' not in p and '<=33' not in p
for name,digest in [('tools/stage40-qa-resume/play.py','e38e1d298f6cc6149a28ba677e682fc5608661643c14e1cc3b01622b50ae6fb4'),('tools/stage40-app-flow/escort_inputs.py','70e441acd937b56e8d5021496b3af219b79a8ce2fa8072c6c4d2909d27fba5cc')]:assert hashlib.sha256((root/name).read_bytes()).hexdigest()==digest,name
raw=lzma.decompress((root/'tools/stage40-qa-resume/ui-d96e-round29.json.xz').read_bytes());assert hashlib.sha256(raw).hexdigest()=='ada2099bcb273de6d7031cf1a8c8c3b361fa75054d73975521892ce112b7c3ed'
print('Prepared public QA input contract PASS; no public execution performed')
