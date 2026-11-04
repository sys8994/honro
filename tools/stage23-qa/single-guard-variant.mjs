/** Diagnostic fresh-authoring source variant; never changes a live battle. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const id=process.argv[2];assert(['s23-C-5','s23-E-2'].includes(id));
const source=await readFile('shared/runtime/act23-v4-ch23-reviewed.js','utf8');
assert.equal(createHash('sha256').update(source).digest('hex'),'9de11f91c3696c52df6c7a87b95f06f67f7996e9141faf9dd7cff4dab4dfed76');
const needle="const PACING_REMOVED=['s23-C-5','s23-E-2'];";assert.equal(source.split(needle).length,2);
process.stdout.write(source.replace(needle,`const PACING_REMOVED=['${id}'];`).replace('remove two repeated low-road blockers','remove one repeated low-road blocker').replace('two repeated lower-road guards omitted','one repeated lower-road guard omitted'));
