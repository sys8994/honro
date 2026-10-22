"""One-time approved migration from the separately reviewed parity commit.
Normal builds read narrative-current.json directly; this is not a runtime layer.
"""
import copy, hashlib, json, subprocess
from pathlib import Path
BASE='f4182439'
ROOT=Path(__file__).resolve().parents[2]
DEST=ROOT/'shared/data/narrative-current.json'
INPUT=ROOT/'game/docs/story/voice-v2-editorial/drafts'
data=json.loads(subprocess.check_output(['git','show',BASE+':shared/data/narrative-current.json'],cwd=ROOT,text=True))
base=copy.deepcopy(data);bindings={};coverage=[]
def identity(key,who,text):return key+':v2-'+hashlib.sha256((who+'\0'+text).encode()).hexdigest()[:10]
def replace_rows(key,incoming,old,mapping=None,common=None):
 result=[];used=set();mapped=[]
 for i,row in enumerate(incoming):
  who,text=row[:2];candidate=(mapping[i] if mapping is not None else row[2] if len(row)>2 and isinstance(row[2],int) else i if len(row)==2 else None)
  source=old[candidate] if isinstance(candidate,int) and 0<=candidate<len(old) else None
  meta=copy.deepcopy(source[2] if source and len(source)>2 and isinstance(source[2],dict) else common or {})
  if source and source[0]!=who:
   # Speech belonging to another person cannot inherit their gesture/portrait.
   for field in ['direction','entryCamera','camera','portrait','revealName','mageAbsentText','requiresVoidWitness','requiresBellWitness']:meta.pop(field,None)
  meta.pop('recordPresentation',None);meta.pop('evidenceOriginal',None)
  if who not in ['서술','기록','안내'] and meta.get('kind') in ['narration','document','guide']:meta.pop('kind',None)
  if who=='서술':meta['kind']='narration'
  if who=='안내':meta['kind']='guide'
  rowid=meta.get('rowId') or identity(key,who,text)
  if rowid in used:rowid=identity(key,who,text)
  used.add(rowid);meta['rowId']=rowid
  if who=='서술':meta.setdefault('kind','narration')
  if key=='27.void.sceneLines':
   who='설오' if i in [0,2] else '';meta={'rowId':rowid,'align':'near' if i in [0,2] else 'far'}
  if key=='2.outro' and i==7:meta['revealName']={'unitId':'objective','name':'홍만의 상여'};meta['rowId']='chapter.2.outro.hongman-name'
  if key=='20.outro' and i==6:meta['requiresBellWitness']=True
  if key=='28.outro' and i==1:meta['requiresVoidWitness']=True
  if key=='29.beats.hyeonmuk-letter' and i in [4,5]:meta['requiresVoidWitness']=True
  if key=='12.beats.sign' and i==3:
   # Existing spatial condition, verbatim legacy action clause; no new copy.
   meta['mageAbsentText']=text.replace('담허가 겹친 획 하나를 풀었다.','담허의 설명을 따라 겹친 획 하나를 풀었다.')
  result.append([who,text,meta]);mapped.append({'rowId':meta['rowId'],'sourceRowId':source[2].get('rowId') if source and len(source)>2 and isinstance(source[2],dict) else None,'fields':list(meta)})
 bindings[key]=mapped;return result
maps={'mapScenes.0':[0,4,5,2,3,None,7,8,9,10,11],'14.beats.family-mid':[0,None,2,3,4,6,5],'29.beats.hyeonmuk-letter':[0,1,2,3,4,5,6,7]}
def scene(key,rows):
 norm=key.replace('5.currentWaterfall.story','5.story')
 parts=norm.split('.')
 if parts[0]=='mapScenes':old=base['mapScenes'][parts[1]];data['mapScenes'][parts[1]]=replace_rows(key,rows,old,maps.get(key));target='mapScenes.'+parts[1]
 elif parts[0].isdigit() and parts[1] in ['story','outro','storyFollowups','beats']:
  stage=data['stages'][parts[0]];oldstage=base['stages'][parts[0]]
  if parts[1]=='beats':old=oldstage['beats'].get(parts[2],[]);target=norm;stage['beats'][parts[2]]=replace_rows(key,rows,old,maps.get(key))
  elif parts[1]=='storyFollowups':old=oldstage['storyFollowups'][int(parts[2])];target=norm;stage['storyFollowups'][int(parts[2])]=replace_rows(key,rows,old,maps.get(key))
  else:old=oldstage[parts[1]];target=norm;stage[parts[1]]=replace_rows(key,rows,old,maps.get(key))
 else:
  old=base['scenes'].get(key,[]);data['scenes'][key]=replace_rows(key,rows,old,maps.get(key));target='scenes.'+key
 coverage.append({'input':key,'target':target,'rows':len(rows)})
for name in ['act1-scenes','act2-scenes','act3-scenes','supplement-scenes']:
 doc=json.loads((INPUT/(name+'.json')).read_text());assert doc['status']=='editorially-reviewed-awaiting-integration'
 for key,rows in doc['scenes'].items():
  if isinstance(rows,dict) or isinstance(rows,str):data['values'][key]=rows;coverage.append({'input':key,'target':'values.'+key});continue
  if key.startswith('routeEntry.'):
   _,id,choice=key.split('.');old=base['routes'][id]['variants'][choice]['lines'];data['routes'][id]['variants'][choice]['lines']=replace_rows(key,rows,old);coverage.append({'input':key,'target':'routes.'+id+'.'+choice});continue
  scene(key,rows)
 if name=='supplement-scenes':
  for key,value in doc['eventDialogue'].items():
   dest=key if key in data['scenes'] else key.split('.')[0]+'.events.'+'.'.join(key.split('.')[1:]);old=base['scenes'][dest]
   incoming=value if isinstance(value,list) else [[old[0][0],value,0]]
   data['scenes'][dest]=replace_rows('event.'+key,incoming,old);coverage.append({'input':'eventDialogue.'+key,'target':'scenes.'+dest})
  data['heroIntroductions']=doc['heroIntroductions']
  for name,title in doc['sceneTitles'].items():
   key={'cooperation':'10.cooperation','cooperation-defense':'10.cooperationDefense','finale-midpoint':'10.finaleMidpoint'}[name]
   for row in data['scenes'][key]:row[2]['storyTitle']=title
# Rescue clauses are authored once and selected by actual actor/resident.
rescue=base['scenes']['interaction.rescue.덕수'];data['scenes']['interaction.rescue.firstDisclosure']=replace_rows('interaction.rescue.firstDisclosure',json.loads((INPUT/'supplement-scenes.json').read_text())['scenes']['interaction.rescue.firstDisclosure'],rescue[2:])
arr=json.loads((INPUT/'arrivals-endings.json').read_text())
for id,rows in arr['arrivals'].items():
 old=base['arrivals'][id];mapping=[]
 for row in rows:mapping.append(next((i for i,r in enumerate(old) if r[0]==row[0]),0))
 data['arrivals'][id]=replace_rows('arrival.'+id,rows,old,mapping,{'storyId':'rest-interlude-v1-'+id,'storyTitle':data['places'][int(id)-1]['event'],'optional':False})
 data['stages'][id]['narration']=[r[1] for r in rows]
 data['places'][int(id)-1]['restDescription']=' '.join(r[1] for r in rows if r[0]=='서술')
for id,lines in arr['actEndings'].items():data['actEndings'][id]['lines']=lines
for id,rows in arr['restEndings'].items():data['restEndings'][id]['required']=replace_rows('restEnd.'+id,rows,base['restEndings'][id]['required'])
rest=json.loads((INPUT/'rest-dialogue.json').read_text());classes=['archer','mage','knight','occultist'];names=rest['speakerOrder']
for id,observations in rest['observations'].items():
 ending=id.startswith('end');n=id[3:] if ending else id;target=data['restEndings'][n]['optional'] if ending else data['optional'][id];oldset=base['restEndings'][n]['optional'] if ending else base['optional'][id]
 for i,cls in enumerate(classes):
  text=observations[i] if i<len(observations) else None
  turns=rest['conversations'].get(id+'.'+cls) if not ending else None
  rows=turns if turns else [[names[i],text]] if text is not None else []
  old=oldset.get(cls,[]);common=copy.deepcopy(old[0][2]) if old else {'storyId':f'rest-optional-v1-{id if not ending else "end-"+n}-{cls}','storyTitle':data['endingPlace']['restName'] if ending else data['places'][int(id)-1]['restName'],'optional':True}
  target[cls]=replace_rows('rest.'+id+'.'+cls,rows,old,common=common)
summary=json.loads((INPUT/'summaries.json').read_text())
for id,text in summary['chapters'].items():data['stages'][id]['storySummary']=text
# Only the completed result asks for these supplements; entry never displays them.
data['conditionalSummaries']=summary['conditionalSupplement'];data['editorialVersion']=2;data['editorialSource']='game/docs/story/voice-v2-editorial/drafts';data['parityCommit']=BASE
# Remove superseded current alternatives; old saved branches own these in compat.
obsolete=['4.events.siege-0','5.events.lower-beasts','7.events.yard-hounds','7.events.upper-crows','8.events.bier-crows','9.events.evac-beasts','9.events.evac-crows','interaction.rescue']
data['rescueMetadata']={}
for resident in data['values']['interaction.rescue.testimony']:
 key='interaction.rescue.'+resident
 data['rescueMetadata'][resident]=[copy.deepcopy(r[2]) for r in base['scenes'][key][:2]]
 obsolete.append(key)
for key in obsolete:data['scenes'].pop(key,None)
DEST.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
report=ROOT/'game/docs/story/voice-v2-editorial';(report/'METADATA_BINDINGS.json').write_text(json.dumps({'parityCommit':BASE,'bindings':bindings,'coverage':coverage},ensure_ascii=False,indent=2)+'\n')
print('Applied exact supplied copy:',len(coverage),'scene/value inputs; source metadata bound by meaning; no runtime override')
