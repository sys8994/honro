/** Act 4, stage 35: authored paint continuation between two bedrock sheets below the playable map.
 * Runs after the original immutable optimization ledger, before normal campaign packaging.
 * The original vector, including its alpha mat, is retained as child zero. The one added
 * opaque union overlaps the back plane, so there are no touching antialiased edges.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const assetId='approved35:near-geology', elementId='approved35-near-geology';
const stockSha='2e8f18b79f45fd525d305656aab379cba9008a091cb5e3caad783e6851d04ef6';
const joinedSha='4eafcdba80200814f574b46dda4bc01d47d40c422eaa815c146717b88ed10845';
const oldOriginal='359227:635a5188', oldOptimized='295465:df15d6ec', joined='298307:55096145';
const clipId='stage35-southeast-native-union';
const clip=["M1155.666666667,720.333333333L1164.666666667,705.000000000L1181.000000000,689.000000000L1197.333333333,680.666666667L1223.666666667,661.333333333L1235.000000000,654.666666667L1250.333333333,630.333333333L1254.666666667,622.666666667L1267.000000000,634.666666667L1282.000000000,652.000000000L1288.000000000,658.333333333L1292.666666667,676.333333333L1297.333333333,691.000000000L1303.000000000,711.666666667L1303.666666667,719.000000000L1288.666666667,721.333333333L1263.333333333,725.666666667L1238.000000000,730.666666667L1204.000000000,733.333333333L1177.333333333,735.333333333L1165.333333333,733.000000000Z"];
const material={"tag":"g","clipPath":"stage35-southeast-native-union","children":[{"tag":"path","d":"M1150.000000000,616.666666667L1313.333333333,616.666666667L1313.333333333,743.333333333L1150.000000000,743.333333333Z","fill":"#192e43","stroke":"none","fillRule":"nonzero"},{"tag":"path","d":"M1151.666666667,693.333333333L1174.000000000,683.333333333L1199.666666667,670.000000000L1222.333333333,653.333333333L1248.666666667,619.333333333L1259.000000000,620.666666667L1257.333333333,644.666666667L1247.000000000,659.000000000L1240.666666667,676.000000000L1222.333333333,686.000000000L1204.666666667,701.333333333L1197.333333333,700.666666667L1184.000000000,710.000000000L1175.000000000,724.000000000L1161.333333333,722.666666667L1151.333333333,726.333333333Z","fill":"#0c1c32","stroke":"none","fillRule":"nonzero"},{"tag":"path","d":"M1152.666666667,715.000000000L1165.666666667,716.000000000L1174.333333333,720.333333333L1183.666666667,708.000000000L1193.666666667,703.000000000L1191.000000000,710.333333333L1183.666666667,722.333333333L1180.666666667,734.666666667L1177.000000000,736.666666667L1160.333333333,734.333333333Z","fill":"#1d334d","stroke":"none","fillRule":"nonzero"},{"tag":"path","d":"M1230.000000000,612.666666667L1304.666666667,613.333333333L1316.000000000,683.333333333L1315.000000000,716.000000000L1301.333333333,717.333333333L1296.333333333,710.333333333L1284.666666667,708.333333333L1270.666666667,703.666666667L1260.000000000,692.000000000L1249.666666667,689.666666667L1253.000000000,683.333333333L1244.000000000,674.000000000L1243.333333333,665.000000000L1241.000000000,656.000000000L1234.666666667,646.333333333Z","fill":"#132a48","stroke":"none","fillRule":"nonzero"},{"tag":"path","d":"M1194.666666667,686.000000000L1222.666666667,658.666666667L1240.000000000,646.333333333L1254.333333333,620.666666667L1268.000000000,630.666666667L1269.000000000,640.666666667L1262.666666667,653.000000000L1265.000000000,662.000000000L1254.666666667,668.333333333L1248.333333333,677.333333333L1242.666666667,673.666666667L1232.666666667,680.666666667L1224.333333333,679.333333333L1208.000000000,691.666666667L1203.333333333,690.666666667Z","fill":"#0e223a","stroke":"none","fillRule":"nonzero"}]};

const sha=a=>createHash('sha256').update(JSON.stringify(a)).digest('hex');

export function applyStage35BedrockJoin(project,previousAct4Signatures){
 const stages=project.stages.filter(s=>s.id==='stage-35'||s.metadata?.stageId===35);
 const s=stages[0];
 assert(stages.length===1&&s.id==='stage-35'&&s.metadata?.stageId===35&&s.metadata?.campaign===true&&
  s.metadata?.act4Stage===35&&s.width===4608&&s.height===3072,'Stage35 bedrock join: expected exactly the signed canonical Stage35');
 const refs=project.stages.flatMap(stage=>stage.elements.filter(e=>e.assetId===assetId).map(e=>[stage,e]));
 const [sourceStage,e]=refs[0]??[];
 assert(refs.length===1&&sourceStage===s&&e.id===elementId&&e.x===-700&&e.y===1450&&
  e.scale===1&&e.rotation===0&&e.opacity===1&&e.layer==='structural-back'&&e.depthLayer==='L1'&&
  e.nativeArtLayer==='structure','Stage35 bedrock join: exact paint owner/placement is not unique');
 const assets=project.library.filter(a=>a.id===assetId),stock=assets[0];
 assert(assets.length===1&&stock.collision?.length===0&&!stock.interactionType&&sha(stock)===stockSha,
  'Stage35 bedrock join: optimized upstream provider changed; re-verify the art, do not repin blindly');
 const before=previousAct4Signatures[assetId];
 assert.deepEqual(before,{stage:35,previous:oldOriginal,current:oldOptimized},
  'Stage35 bedrock join: upstream old-save provider metadata changed');
 const painted=structuredClone(stock),v=painted.vector;
 assert(v.root.children.length===1&&!Object.hasOwn(v.clips,clipId)&&material.clipPath===clipId,
  'Stage35 bedrock join: source root already contains its additive group or base schema changed');
 v.clips[clipId]=structuredClone(clip);
 v.root.children.push(structuredClone(material));
 assert.equal(sha(painted),joinedSha,'Stage35 bedrock join: deterministic authored result differs from approved visual candidate');
 // Existing runtime profile-store accepts the original and prior optimized signatures for official Stage35.
 // Preserve both inputs; exact-current saves use the generic content-addressed provider path.
 return {project:{...project,library:project.library.map(a=>a===stock?painted:a)},
  previousAct4Signatures:{...previousAct4Signatures,[assetId]:{...before,current:joined,previousOptimized:oldOptimized}}};
}
