import pathlib,json,tempfile,subprocess,sys,copy
here=pathlib.Path(__file__).parent;c=json.loads((here/'config.json').read_text())
with tempfile.TemporaryDirectory() as d:
 p=pathlib.Path(d)
 for pose in c['poses']:
  for i,v in enumerate(c['order']):
   ratio=min(pose['dpr'],1.7) if pose['stage'] in [3,7] else pose['dpr']
   q={'ms':1,'after':{'helper':None},'logicalCache':{'bytes':4}}
   r={'ok':True,'camera':{'x':0,'y':0},'contract':{'ownSaveRoundtripExact':True,'sourceStageSHA':'exact','referencedAssetsSHA':'exact'},'initialization':{'afterSHA':'exact','gameplayPayload':{'units':[1]}},'deviceProof':{'actualDPR':pose['dpr'],'backing':[int(pose['width']*ratio+.5),int(pose['height']*ratio+.5)]},'performanceReport':{'cold':[q]*5,'warm':[q]*30,'pan':[dict(q,axis='horizontal' if j<30 else 'vertical',camera={'x':j,'y':0}) for j in range(60)]}}
   (p/(v+'-'+pose['name']+'-abba-'+str(i)+'.json')).write_text(json.dumps(r))
  if pose.get('raf'):
   for v in ['baseline','candidate']:
    r=copy.deepcopy(r);r['performanceReport']={'frames':[{'gapMs':None if j==0 else 16.7,'submitMs':1} for j in range(120)]};(p/(v+'-'+pose['name']+'-raf.json')).write_text(json.dumps(r))
 cmd=[sys.executable,str(here/'check.py'),str(p)]
 assert subprocess.run(cmd,stdout=subprocess.DEVNULL).returncode==0
 f=next(p.glob('candidate-*-abba-*.json'));r=json.loads(f.read_text());r['initialization']['gameplayPayload']['units']=[2];f.write_text(json.dumps(r));assert subprocess.run(cmd,stdout=subprocess.DEVNULL).returncode!=0
 print('Configured-capture checker mock passes valid conditions and rejects gameplay mutation; not browser evidence.')
