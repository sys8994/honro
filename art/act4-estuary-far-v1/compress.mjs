// Reproduce review candidates without changing the deployed asset.
import sharp from 'sharp';
import fs from 'node:fs/promises';
await fs.mkdir('_local/estuary-compression',{recursive:true});
for(const quality of [90,85,80])await sharp('art/act4-estuary-far-v1/source.png').webp({quality,effort:6}).toFile(`_local/estuary-compression/q${quality}.webp`);
