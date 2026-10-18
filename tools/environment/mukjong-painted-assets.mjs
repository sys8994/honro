// Encode the retained painting only; SVG masks and gameplay geometry remain authoritative.
import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';
const root=new URL('../../shared/assets/environment/mukjong/',import.meta.url);
await sharp(new URL('source/mukjong-bronze.png',root).pathname).webp({quality:93,alphaQuality:100,effort:6}).toFile(new URL('mukjong-bronze.webp',root).pathname);
await writeFile(new URL('manifest.json',root),JSON.stringify({revision:4,image:'mukjong-bronze.webp',bounds:[-1610,-4420,3670,4450]},null,2)+'\n');
