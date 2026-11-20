"""Extract only the four exact archive PNGs and one proof, after checking artifact metadata + ZIP."""
import hashlib,json,os,stat,sys,zipfile
from pathlib import Path

P=Path(os.environ['STAGE26_QA'])
ARCHIVE={'run':44648044960,'artifact':14590840283,'name':'act23-final-baseline-26,27,29',
         'zipBytes':13142722,'sha256':'1ae405e24fef49ded2600f4d464ebb633ed87ab4edf41347cb9ae78d94cea6de',
         'head':'ec366b2287ecb3885e72a59f27c3e5cb0a7666fe','base':'1e043b09d4ce107e1d2dcf70fe2274dff7098476'}
FRAMES={
 'act23-final-s26-1440x900-southeast.png': (202113,'5ad8d84bce6177b60488ed4cb213567514293d46a1e8629e4318f8fa72d2fb1b'),
 'act23-final-s26-1440x900-southwest.png': (254046,'c1843000650723514a4ff70375c3d97b5d699da635f6645057a35741964d8d1e'),
}
# Pin the portrait PNGs and exact proof from the authenticated, hash-verified old download.
FRAMES['act23-final-s26-390x844-southeast.png'] = (125726, '1250ab9b3319ad87d9c52867195032dda40a99bb43730d2aa477a8506c78a8c7')
FRAMES['act23-final-s26-390x844-southwest.png'] = (130705, '780a7c67719103ba9f8098156859ef3794419157bc03fe93388d9d8951009330')
FRAMES['proof.json'] = (62626, '8ed7ac43fe925fc4846dc642952de3b8dda182351f30fd1e5fee595d9990aad3')

def check_metadata():
    m=json.loads((P/'archive-meta.json').read_bytes())
    assert m['id']==ARCHIVE['artifact'] and m['name']==ARCHIVE['name'] and m['size_in_bytes']==ARCHIVE['zipBytes']
    assert m['digest']=='sha256:'+ARCHIVE['sha256'] and m['expired'] is False
    assert m['workflow_run']['id']==ARCHIVE['run'] and m['workflow_run']['head_sha']==ARCHIVE['head']
    assert m['workflow_run']['repository_id']==m['workflow_run']['head_repository_id']==1387152511
    assert m['workflow_run']['head_branch']=='qa/act23-final-baseline-20261120'
    assert m['archive_download_url']=='https://api.github.com/repos/sys8994/honro/actions/artifacts/14590840283/zip'

def sha(data):return hashlib.sha256(data).hexdigest()

def verify_extract():
    check_metadata()
    z=P/'archive.zip'
    assert z.stat().st_size==ARCHIVE['zipBytes']
    assert sha(z.read_bytes())==ARCHIVE['sha256']
    ref=P/'archive';ref.mkdir()
    with zipfile.ZipFile(z) as zz:
        for n,(size,digest) in FRAMES.items():
            found=[e for e in zz.infolist() if e.filename==n]
            assert len(found)==1 and found[0].file_size==size and not found[0].is_dir()
            assert stat.S_IFMT(found[0].external_attr>>16) in (0,stat.S_IFREG)
            b=zz.read(found[0]);assert len(b)==size and sha(b)==digest
            (ref/n).write_bytes(b)  # No broad extraction and no archive-controlled output paths.
    proof=json.loads((ref/'proof.json').read_bytes())
    target=[f for f in proof['frames'] if f['stage']==26 and f['view'] in ('southwest','southeast')]
    assert len(target)==4 and set(f['name'] for f in target)==set(FRAMES)-{'proof.json'}
    assert all(f['rasterSha256']==FRAMES[f['name']][1] for f in target)
    (P/'archive-receipt.json').write_text(json.dumps({'artifact':ARCHIVE,'members':FRAMES},indent=2))

assert sys.argv[1:] in (['metadata'],['extract'])
if sys.argv[1]=='metadata':check_metadata()
else:verify_extract()
