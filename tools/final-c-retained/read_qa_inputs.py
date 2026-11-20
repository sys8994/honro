"""Same-repo Action input normalizer. Local ZIP reads, writes only the selected QA input files."""
import argparse,hashlib,json,re,stat,zipfile,shutil
from pathlib import Path,PurePosixPath
from validate_generated import require,streamsha
PIN=json.loads((Path(__file__).resolve().parent/'RELEASE-PINS.json').read_bytes())
AUTH=PIN['cameraAuthority']
RUN=PIN['candidateBrowserRun']
REPO='sys8994/honro'
BRANCH=AUTH['branch']
NAMES=('final-c-act1-camera-exact-84','final-c-generated-normal-qa-only')
def expect_zip(path,record):
    with path.open('rb') as f:require(f'sha256:{streamsha(f)}'==record['digest'],'outer Action ZIP SHA',record['name'])
    require(path.stat().st_size==record['size_in_bytes'],'outer Action ZIP byte size',record['name'])
    z=zipfile.ZipFile(path)
    names=set()
    for m in z.infolist():
        p=PurePosixPath(m.filename)
        require(p.parts and not p.is_absolute() and '..' not in p.parts and p.as_posix()==m.filename.rstrip('/') and
                m.filename not in names and not stat.S_ISLNK(m.external_attr>>16),'bad ZIP member',m.filename)
        names.add(m.filename)
    return z
def copy(z,name,dest,cap):
    i=z.getinfo(name);require(0<i.file_size<=cap,'input size',name,i.file_size)
    with z.open(i) as s,dest.open('xb') as d:shutil.copyfileobj(s,d,1<<20)
def main():
    p=argparse.ArgumentParser()
    for n in ('run-json','artifacts-json','app-zip','generated-zip','out'):p.add_argument('--'+n,type=Path,required=True)
    a=p.parse_args();r=json.loads(a.run_json.read_bytes()); md=json.loads(a.artifacts_json.read_bytes())
    require(r['id']==RUN and r['repository']['full_name']==REPO and r['head_repository']['full_name']==REPO and
        r['head_branch']==BRANCH and r['event']=='push' and r['status']=='completed' and r['conclusion']=='success' and
        r['path']==AUTH['workflow'] and r['head_sha']==AUTH['head'],'unexpected or not successful original 84-view job')
    records={}
    for n in NAMES:
        rows=[x for x in md['artifacts'] if x['name']==n and not x['expired']]
        require(len(rows)==1,'missing unique successful artifact',n)
        row=rows[0];require(row['workflow_run']['id']==RUN and row['workflow_run']['head_sha']==r['head_sha'],'artifact provenance',n)
        require(re.fullmatch(r'sha256:[0-9a-f]{64}',row['digest']),'strong artifact digest required',n)
        if n==AUTH['generatedArtifactName']:
            require(row['id']==AUTH['generatedArtifactID'] and row['digest']==AUTH['generatedZipDigest'] and row['size_in_bytes']==AUTH['generatedZipBytes'],'wrong frozen generated archive')
        records[n]=row
    a.out.mkdir(exist_ok=False)
    with expect_zip(a.app_zip,records[NAMES[0]]) as q:
        copy(q,'act1/ACT1-FINAL-C.json',a.out/'ACT1-FINAL-C.json',8<<20)
        copy(q,'C-GRAPH.json',a.out/'C-GRAPH.json',4<<20)
    with expect_zip(a.generated_zip,records[NAMES[1]]) as q:
        copy(q,'retention-receipt.json',a.out/'retention-receipt.json',128<<10)
        copy(q,'SHA256SUMS',a.out/'SHA256SUMS',4096)
        copy(q,'final-c-normal-generated.tar.gz',a.out/'final-c-normal-generated.tar.gz',1_000_000_000)
    line=(a.out/'SHA256SUMS').read_text()
    require(re.fullmatch(r'[0-9a-f]{64}  final-c-normal-generated\.tar\.gz\n',line),'canonical inner SHA receipt')
    require(line.split()[0]==AUTH['generatedInnerTarSHA256'],'known generated inner tar hash')
    print(json.dumps({'run':RUN,'head':r['head_sha'],'artifactIDs':{n:x['id']for n,x in records.items()},'innerTarSHA256':line.split()[0]},indent=2))
if __name__=='__main__':main()
