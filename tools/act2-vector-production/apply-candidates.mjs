/** Explicitly reviewed near-terrain candidates. No automatic file discovery.
 * Raw source guards precede narrative authoring; gameplay geometry is untouched.
 * Stage acceptance remains separate from this visual integration.
 */
import {applyStage11ArtCandidate} from './apply-stage11-candidate.mjs';
import {applyStage12ArtCandidate} from './apply-stage12-candidate.mjs';
import {applyStage13ArtCandidate} from './apply-stage13-candidate.mjs';
import {applyStage14ArtCandidate} from './apply-stage14-candidate.mjs';
import {applyStage15ArtCandidate} from './apply-stage15-candidate.mjs';
import {applyStage16ArtCandidate} from './apply-stage16-candidate.mjs';
import {applyStage17ArtCandidate} from './apply-stage17-candidate.mjs';
import {applyStage18ArtCandidate} from './apply-stage18-candidate.mjs';
import {applyStage19ArtCandidate} from './apply-stage19-candidate.mjs';
import {applyStage20ArtCandidate} from './apply-stage20-candidate.mjs';
export const reviewedArtStages=[11,12,13,14,15,16,17,18,19,20];
export function applyReviewedAct2Art(project){
 if(process.env.HONRO_ACT2_ART_CANDIDATES==='0')return project;
 for(const apply of [applyStage11ArtCandidate,applyStage12ArtCandidate,applyStage13ArtCandidate,applyStage14ArtCandidate,applyStage15ArtCandidate,applyStage16ArtCandidate,applyStage17ArtCandidate,applyStage18ArtCandidate,applyStage19ArtCandidate,applyStage20ArtCandidate])project=apply(project);
 return project;
}
