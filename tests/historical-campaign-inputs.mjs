/** Immutable data checkpoint, usable without git history in shallow checkouts.
 * Current inputs must pass their independent exact contract before selection.
 * This selects historical DATA only; no historical runtime source is executed. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {campaignHash as hash,currentCampaignManifest as f,assertCurrentCampaign,assertCurrentCampaignLibrary,scopeCampaign,campaignScope} from './current-campaign-contract-helpers.mjs';
const bytes=readFileSync(new URL('./fixtures/campaign-contracts/density-1973f07.json.gz',import.meta.url));
assert.equal(hash(bytes),f.historicalGzipSha256,'Exact immutable historical fixture bytes');
const historical=JSON.parse(gunzipSync(bytes));
assert.equal(hash(historical),'4e6862fce73a458b6ca04566d898fb0531822a95934059eb981585eaf2469722','Original1973f07 density project SHA remains authoritative');
assert.equal(f.historicalCommit,'1973f07c76f89992348bbc763dc35c7a2b259d4b');
export function historicalCampaign({scope='full'}={}){return scopeCampaign(historical,scope);}
export function campaignHistoryInput(project,{scope='full'}={}){campaignScope(scope);const old=historicalCampaign({scope});if(hash(project)===hash(old))return old;
 const variant=project.stages.every((s,i)=>hash(s)===f.runtime.stages[i]?.sha256)?'runtime':'raw';
 assertCurrentCampaign(project,{scope,variant});return old;
}
export function campaignHistoryLibrary(library,{scope='full'}={}){campaignScope(scope);const old=historicalCampaign({scope}).library;if(hash(library)===hash(old))return old;assertCurrentCampaignLibrary(library,{scope});return old;}
