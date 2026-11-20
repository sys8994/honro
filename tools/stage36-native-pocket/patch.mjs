import fs from 'node:fs';
import assert from 'node:assert/strict';
const f='shared/act4-handoff-art.mjs',src=fs.readFileSync(f,'utf8');
const origin="    compatibilityAssetIds.push(element.assetId);\n    pack.assets.push(tinted);";
const mask="M1146.977273 496.336648 L1169.515152 483.028567 L1182.393939 474.442708 L1208.580808 474.442708 L1201.712121 485.175032 L1184.540404 506.854324 L1146.977273 506.854324 Z";
const delta=`    if(element.id==='approved36-near-slope-join'){
      // Recover only the existing grey native rock hidden in the enclosed east-base pocket.
      const v=tinted.vector,key='source-alpha-silhouette';
      if(element.x!==-260||element.y!==850||element.scale!==1||v.root.transform?.join()!=='2.2,0,0,2.2,0,0'||v.clips?.[key]?.length!==1||v.clips[key][0].length!==6215)throw Error('Stage 36 pocket no longer matches source');
      v.clips[key]=[v.clips[key][0]+' ${mask}'];
    }
`;
assert.equal(src.split(origin).length,2);
fs.writeFileSync(f,src.replace(origin,delta+origin));
