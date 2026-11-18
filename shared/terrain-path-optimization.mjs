import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';

const file = new URL('./data/terrain-path-optimization.json', import.meta.url);
const sha = text => createHash('sha256').update(text).digest('hex');

export async function terrainPathOptimization() {
  const entries = JSON.parse(await readFile(file, 'utf8'));
  const registrations=JSON.parse(await readFile(new URL('./data/terrain-path-registrations.json',import.meta.url),'utf8'));
  for(const registration of registrations){
    const entry=entries.find(e=>e.id===registration.id);
    if(!entry||entry.original!==registration.sourceOriginal)throw Error('Terrain registration baseline changed: '+registration.id);
    entry.original=registration.original;
  }
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  if (byId.size !== entries.length) throw Error('Duplicate terrain optimization asset');
  // Reviewed Stage7 vector revision: same five source paths, new exact whole-vector signatures.
  // The legacy registry remains immutable; no old raw signature is accepted by runtime.
  const stage7 = JSON.parse(await readFile(new URL('./data/stage7-terrain-path-registration.json', import.meta.url), 'utf8'));
  const previous = byId.get(stage7.id);
  if (stage7.revision !== 1 || stage7.id !== 'act1-site:7:body' || !previous ||
      previous.original !== stage7.previousOriginal || sha(JSON.stringify(previous.paths)) !== stage7.recipeSha256 ||
      previous.paths.length !== 5 || previous.paths.some(([p]) => p[0] !== 'symbols' || p[1] !== 'source'))
    throw Error('Unreviewed Stage7 terrain optimization recipe');
  byId.set(stage7.id, {...previous, original: stage7.original, optimized: stage7.optimized});

  return {
    apply(assets) {
      for (const asset of assets) {
        const entry = byId.get(asset.id);
        if (!entry) continue;
        const raw = JSON.stringify(asset.vector);
        if (sha(raw) !== entry.original) throw Error('Terrain art changed before optimization: '+asset.id);
        if (asset.id === stage7.id && sha(JSON.stringify(asset.vector.symbols.source)) !== stage7.sourceRaw)
          throw Error('Stage7 raw source changed before optimization');
        // Geometry hidden by the Act 3 strip mapping may become visible after a route edit.
        if (entry.contactMapping && sha(JSON.stringify(asset.params?.contactMapping ?? null)) !== entry.contactMapping)
          throw Error('Terrain contact mapping changed before optimization: '+asset.id);
        const vector = structuredClone(asset.vector);
        for (const [path, key, value] of entry.paths) {
          const node = path.reduce((value, part) => value?.[part], vector);
          if (node?.tag !== 'path' || !['d','dParts'].includes(key) || !Object.hasOwn(node,key))
            throw Error('Invalid terrain optimization path: '+asset.id);
          node[key] = value;
        }
        if (Buffer.byteLength(JSON.stringify(vector)) >= Buffer.byteLength(raw))
          throw Error('Optimized terrain did not get smaller: '+asset.id);
        if (asset.id === stage7.id && (sha(JSON.stringify(vector)) !== stage7.optimized ||
            sha(JSON.stringify(vector.symbols.source)) !== stage7.sourceOptimized))
          throw Error('Stage7 optimized result differs from reviewed registration');
        asset.vector = vector;
      }
    },
    previousAct4Signatures: Object.fromEntries(entries.filter(entry => entry.act4)
      .map(entry => [entry.id, entry.act4])),
  };
}

