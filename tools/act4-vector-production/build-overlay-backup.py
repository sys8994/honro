#!/usr/bin/env python3
"""Deterministic committed-file overlay backup, not a full repository export.
No worktree file contents, git internals, credentials, or local journals are read.
"""
import argparse, datetime, hashlib, json, pathlib, re, subprocess, zipfile
ROOT=pathlib.Path(__file__).resolve().parents[2]
def git(*args):
    return subprocess.check_output(['git','-C',str(ROOT),*args])
def safe(path):
    p=pathlib.PurePosixPath(path)
    if p.is_absolute() or '..' in p.parts:return False
    if any(x in {'.git','.aws','.codex','.agents','_local','user_notes','agent_notes','private','journals'} for x in p.parts):return False
    name=p.name.lower()
    if name=='.env' or name.startswith('.env.') or any(x in name for x in ('credential','secret','id_rsa','id_ed25519','.pem','.key','journal')):return False
    return True
ap=argparse.ArgumentParser(description=__doc__)
ap.add_argument('--reconciliation',default='_local/reports/act4-vector-production/publication-reconciliation.json')
ap.add_argument('--head',default='HEAD',help='Pinned commit; default resolves HEAD once')
ap.add_argument('--write',action='store_true',help='Create ZIP; otherwise only print scope summary')
a=ap.parse_args(); q=json.loads((ROOT/a.reconciliation).read_text());head=git('rev-parse','--verify',a.head+'^{commit}').decode().strip();base=q['localHead']
paths={p for c in q['commits'] for p in c['paths']}
paths.update(x.decode() for x in git('diff','--name-only','-z',base,head).split(b'\0') if x)
extra=[x for x in git('rev-list','--reverse',base+'..'+head).decode().splitlines() if x]
tree={}
for record in git('ls-tree','-r','-z',head).split(b'\0'):
    if not record:continue
    meta,path=record.split(b'\t',1);mode,kind,oid=meta.decode().split();tree[path.decode()]=(mode,kind,oid)
include=[];deleted=[];excluded=[]
for path in sorted(paths):
    if not safe(path):excluded.append({'path':path,'reason':'credential/private/internal-path denylist'});continue
    if path not in tree:deleted.append(path);continue
    mode,kind,oid=tree[path]
    if kind!='blob' or mode not in ('100644','100755'):excluded.append({'path':path,'reason':'not regular committed file; no symlink/submodule dereference'});continue
    include.append((path,mode,oid))
manifest={'format':'honro-committed-overlay-backup-v1','scope':'Selected not-confirmed-published changes only; NOT a complete repository, NOT a browser-verified release. Contains bytes from one pinned Git commit, never dirty worktree data.','head':head,'queueBase':base,'confirmedRemoteHead':q.get('confirmedRemoteHead'),'remoteBranch':q.get('remoteBranch'),'remoteStatus':'Publication approval unresolved at last check; this backup does not imply push or deployment.','queueCommits':[c['sha'] for c in q['commits']],'additionalCommits':extra,'includedFiles':[],'deletedPaths':deleted,'excludedPaths':excluded}
out=ROOT/'_local/archive'/('honro-act4-committed-overlay-'+head[:12]+'.zip')
summary={'head':head,'regularFiles':len(include),'deletedPaths':len(deleted),'excludedPaths':excluded,'output':str(out.relative_to(ROOT)),'written':a.write}
if not a.write:print(json.dumps(summary,ensure_ascii=False,indent=2));raise SystemExit
out.parent.mkdir(parents=True,exist_ok=True);temp=out.with_suffix('.zip.partial')
timestamp=int(git('show','-s','--format=%ct',head).decode());dt=datetime.datetime.fromtimestamp(timestamp,datetime.timezone.utc);date=(max(1980,dt.year),dt.month,dt.day,dt.hour,dt.minute,dt.second//2*2)
def add(z,name,data,mode=0o644):
    info=zipfile.ZipInfo(name,date_time=date);info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=(0o100000|mode)<<16;z.writestr(info,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=6)
with zipfile.ZipFile(temp,'w',allowZip64=True) as z:
    for path,mode,oid in include:
        data=git('show',head+':'+path)
        # Refuse recognizable embedded credentials; never print matched secret bytes.
        if re.search(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|AKIA[A-Z0-9]{16}|sk-proj-[A-Za-z0-9_-]{30,}',data):
            raise ValueError('Potential embedded credential; archive not deliverable: '+path)
        # No uncommitted input can enter through an intermediate filesystem copy.
        manifest['includedFiles'].append({'path':path,'gitBlob':oid,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'mode':mode})
        add(z,'overlay/'+path,data,0o755 if mode=='100755' else 0o644)
    add(z,'MANIFEST.json',(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode())
    add(z,'DELETED_PATHS.json',(json.dumps(deleted,ensure_ascii=False,indent=2)+'\n').encode())
    add(z,'README.txt',('혼로 4막 벡터 작업 · 커밋된 변경분 보관본\n\n기준 커밋: '+head+'\n\n이 파일은 전체 저장소나 배포본이 아닌 변경 파일 오버레이입니다.\noverlay/ 아래 파일은 해당 커밋에서 직접 읽었습니다. 작업 중 미커밋 파일과 개인 메모, 인증 정보, .git 내부 데이터는 포함하지 않습니다.\n\n복원할 때 기존 HONRO 저장소의 별도 브랜치에 비교하여 적용하세요. DELETED_PATHS.json은 기준 커밋에서 사라진 경로 목록이며 자동 삭제 스크립트가 아닙니다. MANIFEST.json에 각 파일의 Git blob, SHA256, 크기와 포함 근거 커밋을 기록했습니다.\n\n이 보관본은 원격 push, master 반영, GitHub Pages 배포 또는 실제 브라우저 검수가 완료됐다는 증거가 아닙니다. 해당 상태는 별도로 확인해야 합니다.\n').encode())
with zipfile.ZipFile(temp,'r') as z:
    assert z.testzip() is None,'Archive CRC validation failed'
    for item in manifest['includedFiles']:
        assert hashlib.sha256(z.read('overlay/'+item['path'])).hexdigest()==item['sha256'],'Archive SHA256 mismatch'
temp.replace(out)
manifestPath=out.with_suffix('.manifest.json');manifestPath.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
summary.update(zipBytes=out.stat().st_size,zipSha256=hashlib.sha256(out.read_bytes()).hexdigest(),sourceBytes=sum(x['bytes'] for x in manifest['includedFiles']))
out.with_suffix('.summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n');print(json.dumps(summary,ensure_ascii=False,indent=2))
