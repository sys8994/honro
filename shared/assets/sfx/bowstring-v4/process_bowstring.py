from pathlib import Path
import subprocess,json,hashlib
import numpy as np
from scipy.io import wavfile
root=Path(__file__).resolve().parent
src=root.parent/'02-bowstring-longbow-release.mp3'
subprocess.run(['ffmpeg','-v','error','-y','-i',str(src),'-af','highpass=f=65,acompressor=threshold=0.04:ratio=3:attack=0.2:release=35:makeup=1,equalizer=f=2300:t=q:w=0.8:g=1.5','-ar','44100','-ac','1','-c:a','pcm_f32le',str(root/'intermediate.wav')],check=True)
r,x=wavfile.read(root/'intermediate.wav');x=x[round(.060*r):].copy();x[:22]*=np.linspace(0,1,22);x[-529:]*=np.linspace(1,0,529);x*=.85/max(abs(x));wavfile.write(root/'bowstring_release.wav',r,(x*32767).astype(np.int16));p=root/'bowstring_release.mp3';subprocess.run(['ffmpeg','-v','error','-y','-i',str(root/'bowstring_release.wav'),'-c:a','libmp3lame','-b:a','128k',str(p)],check=True)
y=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-ar','44100','-ac','1','-f','f32le','-']),np.float32);assert max(abs(y))<.95
m=json.loads((root/'manifest.json').read_text());m['processing']+=' Remove60ms quiet pre-roll;0.5ms entry ramp and12ms tail fade.';m['outputSHA256']=hashlib.sha256(p.read_bytes()).hexdigest();m['bytes']=p.stat().st_size;m['outputMetrics']={'duration':len(y)/44100,'peak':float(max(abs(y))),'rmsDBFS':float(20*np.log10(np.sqrt(np.mean(y*y))))};(root/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2));print(json.dumps(m['outputMetrics']))
