import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  basisOf,
  createRun,
  decide,
  deliveryStatus,
  nextQuestion,
  readRun,
  recordArtistic,
  recordPlay,
  recordTechnical,
  rejectOptions,
  replaceOptions,
  REQUIRED_TECHNICAL,
  saveRun,
  validateRun,
} from '../tools/intent-pipeline/state.mjs';

// These fixtures are deliberately separate from the campaign and authored maps.
// No test writes game state, generates the HTML bundles, or approves a real run.
const hash = value => createHash('sha256').update(value).digest('hex');
const clone = value => structuredClone(value);
const userEvidence = {
  kind: 'user-message',
  reference: 'test:explicit-user-choice',
  actor: 'user',
};

function fixture(overrides = {}) {
  return {
    id: 'stage18-test-run',
    intent: {
      goal: 'Compare three visibly different Stage 18 layouts before production.',
      stageId: 18,
      constraints: ['Preserve existing gameplay and campaign progress.'],
      assumptions: [{
        id: 'comparison-only',
        text: 'Candidate evidence is a proposal, not an artistic approval.',
        scope: 'layout-comparison',
        expiresAtGate: 'stage18.layout',
      }],
    },
    source: { commit: 'a'.repeat(40), projectHash: hash('unchanged-campaign') },
    candidates: ['A', 'B', 'C'].map((id, index) => ({
      id,
      label: `Layout ${id}`,
      description: ['Terraced approach', 'Split crossing', 'Enclosed loop'][index],
      topologyId: `topology-${id.toLowerCase()}`,
      planPath: `_local/reports/intent-pipeline/layout-${id}.json`,
      planHash: hash(`plan-${id}`),
      evidence: [{
        kind: 'diagram',
        path: `_local/reports/intent-pipeline/layout-${id}.svg`,
        sha256: hash(`diagram-${id}`),
      }],
    })),
    ...overrides,
  };
}

function initial() {
  return createRun(fixture());
}

function selected(optionId = 'A') {
  return decide(initial(), {
    decisionId: 'stage18.layout',
    decisionRevision: 1,
    optionId,
    userEvidence: clone(userEvidence),
  });
}

function assertRejectedWithoutMutation(run, action, message) {
  const before = clone(run);
  assert.throws(() => action(run), message);
  assert.deepEqual(run, before, 'Rejected operation mutated its input run.');
}

async function withStore(action) {
  const dir = await mkdtemp(path.join(tmpdir(), 'honro-intent-pipeline-test-'));
  try {
    return await action(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const artifact = (kind, name = kind) => ({
  kind,
  path: `_local/reports/intent-pipeline/${name}.json`,
  sha256: hash(name),
  ...(kind === 'compiled-map' ? { sourceProjectHash: hash('ink-project') } : {}),
});
const productionArtifacts = () => [artifact('render'), artifact('compiled-map'), artifact('technical-report')];
const passingChecks = () => REQUIRED_TECHNICAL.map(name => ({ name, status: 'passed' }));
const artOptions = () => ['ink', 'moonlight'].map(id => ({
  id,
  label: id === 'ink' ? 'Ink-wash masses' : 'Moonlit silhouettes',
  description: `Reviewable ${id} treatment of the approved geometry.`,
  projectPath: `_local/reports/intent-pipeline/${id}-project.json`,
  projectHash: hash(`${id}-project`),
  evidence: [artifact('render', id)],
}));
const decision = (run, id) => run.decisions.find(item => item.id === id);

function creativelySelected(options = artOptions()) {
  let run = selected();
  run = replaceOptions(run, {
    decisionId: 'stage18.art-direction',
    question: 'Which rendered treatment should be used?',
    options,
  });
  return decide(run, {
    decisionId: 'stage18.art-direction',
    decisionRevision: decision(run, 'stage18.art-direction').revision,
    optionId: 'ink',
    userEvidence: clone(userEvidence),
  });
}

function technicallyPassed(run = creativelySelected(), artifacts = productionArtifacts()) {
  return recordTechnical(run, {
    basis: basisOf(run),
    checks: passingChecks(),
    artifacts,
  });
}

function livePassed(run = technicallyPassed()) {
  return recordPlay(run, {
    basis: basisOf(run),
    status: 'passed',
    evidence: [artifact('browser-live-play')],
    limitations: ['Fixture exercises orchestration, not the actual game browser.'],
  });
}

function ready({ options = artOptions(), artifacts = productionArtifacts() } = {}) {
  const run = livePassed(technicallyPassed(creativelySelected(options), artifacts));
  return recordArtistic(run, { basis: basisOf(run), userEvidence: clone(userEvidence) });
}

test('new runs preserve bounded intent and expose a single unresolved layout question without defaults', () => {
  const run = initial();
  assert.equal(run.schemaVersion, 1);
  assert.equal(run.revision, 0);
  assert.deepEqual(run.intent, fixture().intent);
  assert.deepEqual(run.source, fixture().source);
  assert(run.decisions.every(item => item.selection === null));
  const question = nextQuestion(run);
  assert.equal(question.kind, 'human-choice');
  assert.equal(question.decisionId, 'stage18.layout');
  assert.equal(question.decisionRevision, 1);
  assert.equal(question.selectionMode, 'single');
  assert.equal(question.defaultOption, null);
  assert.equal(question.basis, basisOf(run));
  assert.deepEqual(question.options.map(item => item.id), ['A', 'B', 'C']);
  assert(question.options.every(item => item.evidence.length > 0));
  assert.equal(deliveryStatus(run).productionReady, false);
  assert.equal(deliveryStatus(run).state, 'awaiting_layout_decision');
});

test('input fixtures and question evidence are defensively copied', () => {
  const input = fixture();
  const run = createRun(input);
  const before = clone(run);
  input.intent.constraints.push('Unexpected scope expansion');
  input.candidates[0].evidence[0].path = 'changed-path';
  const question = nextQuestion(run);
  question.options[0].evidence[0].path = 'another-changed-path';
  assert.deepEqual(run, before);
});

test('explicit layout selection is immutable, auditable, and supports native-choice evidence', () => {
  const run = initial();
  const before = clone(run);
  const evidence = { kind: 'native-choice', actor: 'user', reference: 'test:choice-widget-1' };
  const result = decide(run, {
    decisionId: 'stage18.layout', decisionRevision: 1, optionId: 'B', userEvidence: evidence,
  });
  assert.notStrictEqual(result, run);
  assert.deepEqual(run, before);
  assert.equal(result.revision, run.revision + 1);
  assert.equal(decision(result, 'stage18.layout').selection.optionId, 'B');
  assert.deepEqual(decision(result, 'stage18.layout').selection.userEvidence, evidence);
  assert.equal(result.history.at(-1).kind, 'user-decision');
  assert.equal(result.history.at(-1).detail.optionId, 'B');
  assert.notEqual(basisOf(result), basisOf(run));
  evidence.reference = 'caller-mutated-evidence';
  assert.equal(decision(result, 'stage18.layout').selection.userEvidence.reference, 'test:choice-widget-1');
});

test('missing, worker, model-score, blank-reference, and ambiguous approvals cannot select a layout', () => {
  for (const evidence of [
    undefined,
    null,
    {},
    { ...userEvidence, actor: 'agent' },
    { ...userEvidence, kind: 'model-score', score: 100 },
    { ...userEvidence, kind: 'user-message', reference: '' },
    { ...userEvidence, reference: '   ' },
  ]) {
    assertRejectedWithoutMutation(initial(), run => decide(run, {
      decisionId: 'stage18.layout', decisionRevision: 1, optionId: 'A', userEvidence: evidence,
    }));
  }
});

test('missing, unknown, and stale decision callbacks fail without choosing a fallback', () => {
  for (const change of [
    { decisionId: 'unknown' },
    { decisionRevision: 0 },
    { decisionRevision: 2 },
    { decisionRevision: '1' },
    { optionId: 'missing-option' },
    { optionId: undefined },
    { optionId: ['A', 'B'] },
  ]) {
    assertRejectedWithoutMutation(initial(), run => decide(run, {
      decisionId: 'stage18.layout', decisionRevision: 1, optionId: 'A',
      userEvidence: clone(userEvidence), ...change,
    }));
  }
});

test('repeated identical native callbacks are idempotent and do not duplicate approval history', () => {
  const run = selected('B');
  const result = decide(run, {
    decisionId: 'stage18.layout', decisionRevision: 1, optionId: 'B', userEvidence: clone(userEvidence),
  });
  assert.deepEqual(result, run);
  assert.notStrictEqual(result, run);
});

test('idempotent callbacks still validate loaded state before returning it', () => {
  const run = selected('B');
  run.schemaVersion = 999;
  assertRejectedWithoutMutation(run, value => decide(value, {
    decisionId: 'stage18.layout', decisionRevision: 1, optionId: 'B', userEvidence: clone(userEvidence),
  }));
});

test('art options cannot precede layout selection, and missing options become explicit agent work', () => {
  assertRejectedWithoutMutation(initial(), run => replaceOptions(run, {
    decisionId: 'stage18.art-direction', question: 'Pick a style.', options: artOptions(),
  }));
  const run = selected();
  const question = nextQuestion(run);
  assert.equal(question.kind, 'agent-work-required');
  assert.equal(question.decisionId, 'stage18.art-direction');
  assert.equal(question.blocksProduction, true);
  assert.equal(decision(run, 'stage18.art-direction').selection, null);
  assert.equal(deliveryStatus(run).productionReady, false);
});

test('creative proposals require two or three distinct evidence-backed alternatives', () => {
  const mutations = [
    input => { input.candidates = []; },
    input => { input.candidates = input.candidates.slice(0, 1); },
    input => { input.candidates.push({ ...clone(input.candidates[0]), id: 'D', label: 'D', topologyId: 'd' }); },
    input => { input.candidates[1].id = input.candidates[0].id; },
    input => { input.candidates[1].label = input.candidates[0].label; },
    input => { input.candidates[1].topologyId = input.candidates[0].topologyId; },
    input => { input.candidates[0].evidence = []; },
    input => { input.candidates[0].evidence[0].sha256 = 'unhashed'; },
    input => { input.candidates[0].planHash = 'unhashed'; },
    input => { input.candidates[0].planPath = ''; },
    input => { input.candidates[0].description = ''; },
  ];
  for (const mutate of mutations) {
    const input = fixture();
    mutate(input);
    assert.throws(() => createRun(input));
  }
  assert.equal(createRun(fixture({ candidates: fixture().candidates.slice(0, 2) })).decisions[0].options.length, 2);
});

test('new run validation rejects unsafe IDs, unbounded assumptions, and malformed source identity', () => {
  const mutations = [
    input => { input.id = '../outside'; },
    input => { input.id = ''; },
    input => { input.intent.goal = ' '; },
    input => { input.intent.stageId = 18.5; },
    input => { input.intent.constraints = null; },
    input => { input.intent.assumptions = null; },
    input => { delete input.intent.assumptions[0].expiresAtGate; },
    input => { input.intent.assumptions[0].scope = ''; },
    input => { input.source.projectHash = 'unknown'; },
    input => { input.source.commit = ''; },
  ];
  for (const mutate of mutations) {
    const input = fixture();
    mutate(input);
    assert.throws(() => createRun(input));
  }
});

test('revising option evidence invalidates old callbacks even when option IDs are unchanged', () => {
  const run = initial();
  const options = fixture().candidates;
  options[0].planHash = hash('updated-A-plan');
  const revised = replaceOptions(run, {
    decisionId: 'stage18.layout', question: 'Review the revised layouts.', options,
  });
  assert.equal(decision(revised, 'stage18.layout').revision, 2);
  assert.notEqual(basisOf(revised), basisOf(run));
  assertRejectedWithoutMutation(revised, value => decide(value, {
    decisionId: 'stage18.layout', decisionRevision: 1, optionId: 'A', userEvidence: clone(userEvidence),
  }));
  const chosen = decide(revised, {
    decisionId: 'stage18.layout', decisionRevision: 2, optionId: 'A', userEvidence: clone(userEvidence),
  });
  assert.equal(decision(chosen, 'stage18.layout').selection.decisionRevision, 2);
});

test('rejecting every layout preserves the user feedback and requests fresh work without a fallback', () => {
  const run = initial();
  const before = clone(run);
  const evidence = clone(userEvidence);
  const feedback = 'None of these expresses the enclosed courtyard. Rework the space.';
  const rejected = rejectOptions(run, {
    decisionId: 'stage18.layout', decisionRevision: 1, userEvidence: evidence, feedback,
  });
  const layout = decision(rejected, 'stage18.layout');
  assert.equal(layout.selection, null);
  assert.deepEqual(layout.options, []);
  assert.equal(layout.status, 'needs-regeneration');
  assert.equal(layout.revision, 2);
  assert.equal(layout.feedback, feedback);
  assert.equal(rejected.revision, run.revision + 1);
  assert.equal(nextQuestion(rejected).kind, 'agent-work-required');
  assert.equal(nextQuestion(rejected).decisionId, layout.id);
  assert.equal(nextQuestion(rejected).decisionRevision, layout.revision);
  assert.equal(nextQuestion(rejected).feedback, feedback);
  assert.equal(nextQuestion(rejected).blocksProduction, true);
  assert.equal(deliveryStatus(rejected).productionReady, false);
  assert.equal(rejected.history.at(-1).kind, 'user-rejected-options');
  assert.deepEqual(rejected.history.at(-1).detail.rejectedOptions.map(item => item.id), ['A', 'B', 'C']);
  assert.deepEqual(run, before);
  evidence.reference = 'caller-mutated-rejection';
  assert.equal(rejected.history.at(-1).detail.userEvidence.reference, userEvidence.reference);
});

test('reject-all requires explicit user provenance and the exact current decision revision', () => {
  for (const overrides of [
    { userEvidence: undefined },
    { userEvidence: { ...userEvidence, actor: 'agent' } },
    { userEvidence: { ...userEvidence, kind: 'model-score' } },
    { decisionId: 'unknown' },
    { decisionRevision: 0 },
    { decisionRevision: '1' },
  ]) {
    assertRejectedWithoutMutation(initial(), run => rejectOptions(run, {
      decisionId: 'stage18.layout', decisionRevision: 1, userEvidence: clone(userEvidence), ...overrides,
    }));
  }
  const rejected = rejectOptions(initial(), {
    decisionId: 'stage18.layout', decisionRevision: 1, userEvidence: clone(userEvidence),
  });
  assertRejectedWithoutMutation(rejected, run => rejectOptions(run, {
    decisionId: 'stage18.layout', decisionRevision: 1, userEvidence: clone(userEvidence),
  }));
  assertRejectedWithoutMutation(rejected, run => decide(run, {
    decisionId: 'stage18.layout', decisionRevision: 2, optionId: 'A', userEvidence: clone(userEvidence),
  }));
});

test('rejecting an approved layout invalidates every downstream creative and production result', () => {
  const run = ready();
  const rejected = rejectOptions(run, {
    decisionId: 'stage18.layout', decisionRevision: 1, userEvidence: clone(userEvidence), feedback: 'Start again.',
  });
  assert.equal(decision(rejected, 'stage18.layout').selection, null);
  const art = decision(rejected, 'stage18.art-direction');
  assert.equal(art.selection, null);
  assert.deepEqual(art.options, []);
  assert.equal(art.revision, decision(run, 'stage18.art-direction').revision + 1);
  assert.equal(rejected.technical, null);
  assert.equal(rejected.play, null);
  assert.equal(rejected.artistic, null);
  assert.deepEqual(rejected.artifacts, []);
  assert.deepEqual(new Set(rejected.invalidations.map(item => item.kind)), new Set(['technical', 'play', 'artistic']));
  assert.notEqual(basisOf(rejected), basisOf(run));
  assert.equal(deliveryStatus(rejected).productionReady, false);
});

test('rejecting art directions keeps the layout while requiring fresh art and production evidence', () => {
  const run = ready();
  const art = decision(run, 'stage18.art-direction');
  const rejected = rejectOptions(run, {
    decisionId: art.id, decisionRevision: art.revision, userEvidence: clone(userEvidence), feedback: 'Reduce repeated ornament.',
  });
  assert.deepEqual(decision(rejected, 'stage18.layout'), decision(run, 'stage18.layout'));
  assert.equal(decision(rejected, art.id).selection, null);
  assert.deepEqual(decision(rejected, art.id).options, []);
  assert.equal(nextQuestion(rejected).decisionId, art.id);
  assert.equal(nextQuestion(rejected).kind, 'agent-work-required');
  assert.equal(nextQuestion(rejected).feedback, 'Reduce repeated ornament.');
  assert.equal(rejected.technical, null);
  assert.equal(rejected.play, null);
  assert.equal(rejected.artistic, null);
  assert.deepEqual(rejected.artifacts, []);
});

test('regenerated alternatives need a fresh explicit choice and never revive rejected approvals', () => {
  const rejected = rejectOptions(ready(), {
    decisionId: 'stage18.layout', decisionRevision: 1, userEvidence: clone(userEvidence), feedback: 'Rework the route.',
  });
  const options = fixture().candidates.map(item => ({ ...item, planHash: hash(`regenerated-${item.id}`) }));
  const proposed = replaceOptions(rejected, {
    decisionId: 'stage18.layout', question: 'Which regenerated route works?', options,
  });
  const question = nextQuestion(proposed);
  assert.equal(question.kind, 'human-choice');
  assert.equal(question.decisionRevision, 3);
  assert.equal(question.defaultOption, null);
  assert.equal(decision(proposed, 'stage18.layout').selection, null);
  assert.equal(decision(proposed, 'stage18.layout').status, 'proposed');
  assertRejectedWithoutMutation(proposed, run => decide(run, {
    decisionId: 'stage18.layout', decisionRevision: 1, optionId: 'A', userEvidence: clone(userEvidence),
  }));
  const chosen = decide(proposed, {
    decisionId: question.decisionId, decisionRevision: question.decisionRevision,
    optionId: 'B', userEvidence: clone(userEvidence),
  });
  assert.equal(decision(chosen, 'stage18.layout').selection.optionId, 'B');
  assert.equal(nextQuestion(chosen).kind, 'agent-work-required');
  assert.equal(nextQuestion(chosen).decisionId, 'stage18.art-direction');
  assert.equal(chosen.technical, null);
  assert.equal(chosen.play, null);
  assert.equal(chosen.artistic, null);
  assert.equal(deliveryStatus(chosen).productionReady, false);
});

test('rejection and its regeneration request survive restart without reoffering old options', async () => {
  await withStore(async dir => {
    const rejected = rejectOptions(initial(), {
      decisionId: 'stage18.layout', decisionRevision: 1, userEvidence: clone(userEvidence), feedback: 'Explore more distinct structures.',
    });
    await saveRun(dir, rejected, { expectedRevision: null });
    const restored = await readRun(dir);
    assert.deepEqual(restored, rejected);
    assert.deepEqual(nextQuestion(restored), nextQuestion(rejected));
    assert.equal(nextQuestion(restored).kind, 'agent-work-required');
    assert.deepEqual(decision(restored, 'stage18.layout').options, []);
  });
});

test('technical evidence needs an approved layout and the current content basis', () => {
  assertRejectedWithoutMutation(initial(), run => recordTechnical(run, {
    basis: basisOf(run), checks: passingChecks(), artifacts: [artifact('render')],
  }));
  assertRejectedWithoutMutation(selected(), run => recordTechnical(run, {
    basis: basisOf(initial()), checks: passingChecks(), artifacts: [artifact('render')],
  }));
  assert.equal(deliveryStatus(technicallyPassed(selected())).productionReady, false);
});

test('technical checks reject missing, duplicate, and invalid results and unhashed artifacts', () => {
  const run = creativelySelected();
  for (const checks of [[], [{ name: '', status: 'passed' }], [{ name: 'schema', status: 'maybe' }],
    [{ name: 'schema', status: 'passed' }, { name: 'schema', status: 'passed' }]]) {
    assertRejectedWithoutMutation(run, value => recordTechnical(value, { basis: basisOf(value), checks }));
  }
  assertRejectedWithoutMutation(run, value => recordTechnical(value, {
    basis: basisOf(value), checks: passingChecks(), artifacts: [{ kind: 'render', path: 'render.png', sha256: 'bad' }],
  }));
});

test('every named technical gate must pass; optional scores cannot substitute for a missing gate', () => {
  assert(REQUIRED_TECHNICAL.includes('browser-game-workshop'));
  assert(REQUIRED_TECHNICAL.includes('normal-playthrough'));
  assert(REQUIRED_TECHNICAL.includes('save-compatibility'));
  for (const missing of REQUIRED_TECHNICAL) {
    const run = creativelySelected();
    const checked = recordTechnical(run, {
      basis: basisOf(run),
      checks: [...passingChecks().filter(item => item.name !== missing), { name: 'agent-quality-score-100', status: 'passed' }],
      artifacts: [artifact('render')],
    });
    const played = livePassed(checked);
    const approved = recordArtistic(played, { basis: basisOf(played), userEvidence: clone(userEvidence) });
    assert.equal(deliveryStatus(approved).productionReady, false, missing);
    assert(deliveryStatus(approved).blockers.some(item => item.includes(missing)), missing);
  }
});

test('failed or blocked checks remain delivery blockers even with other human and browser evidence', () => {
  for (const status of ['failed', 'blocked']) {
    const run = creativelySelected();
    const checked = recordTechnical(run, {
      basis: basisOf(run), checks: [...passingChecks(), { name: 'additional-regression', status }],
      artifacts: [artifact('render')],
    });
    const played = livePassed(checked);
    const approved = recordArtistic(played, { basis: basisOf(played), userEvidence: clone(userEvidence) });
    assert.equal(deliveryStatus(approved).productionReady, false);
  }
});

test('live play requires current compiled evidence and cannot be approved by Node smoke tests', () => {
  assertRejectedWithoutMutation(creativelySelected(), run => recordPlay(run, {
    basis: basisOf(run), status: 'passed', evidence: [artifact('browser-live-play')],
  }));
  const run = technicallyPassed();
  for (const evidence of [[], [artifact('node-smoke')], [artifact('screenshot')],
    [{ kind: 'browser-live-play', path: 'play.json', sha256: 'bad' }]]) {
    assertRejectedWithoutMutation(run, value => recordPlay(value, {
      basis: basisOf(value), status: 'passed', evidence,
    }));
  }
  assertRejectedWithoutMutation(run, value => recordPlay(value, {
    basis: basisOf(initial()), status: 'passed', evidence: [artifact('browser-live-play')],
  }));
});

test('failed and blocked browser outcomes persist limitations and cannot unlock production', () => {
  for (const status of ['failed', 'blocked']) {
    const run = technicallyPassed();
    const limitations = ['Browser verification did not complete.'];
    const played = recordPlay(run, { basis: basisOf(run), status, evidence: [artifact('browser-log')], limitations });
    assert.deepEqual(played.play.limitations, limitations);
    assert.equal(deliveryStatus(played).productionReady, false);
    limitations.push('Caller mutation');
    assert.equal(played.play.limitations.length, 1);
  }
});

test('artistic approval is a separate human gate requiring selected choices and rendered evidence', () => {
  const played = livePassed();
  assert.equal(played.artistic, null);
  assert.equal(deliveryStatus(played).state, 'awaiting_artistic_approval');
  assert.equal(deliveryStatus(played).productionReady, false);
  for (const evidence of [undefined, { ...userEvidence, actor: 'agent' }, { ...userEvidence, kind: 'quality-score' }]) {
    assertRejectedWithoutMutation(played, run => recordArtistic(run, { basis: basisOf(run), userEvidence: evidence }));
  }
  assertRejectedWithoutMutation(technicallyPassed(selected()), run => recordArtistic(run, {
    basis: basisOf(run), userEvidence: clone(userEvidence),
  }));
  const run = creativelySelected();
  const noRender = recordTechnical(run, { basis: basisOf(run), checks: passingChecks(), artifacts: [artifact('compiled-map')] });
  assertRejectedWithoutMutation(noRender, value => recordArtistic(value, { basis: basisOf(value), userEvidence: clone(userEvidence) }));
  assertRejectedWithoutMutation(played, value => recordArtistic(value, {
    basis: basisOf(initial()), userEvidence: clone(userEvidence),
  }));
});

test('a fully reviewed local result is ready without conferring publication authorization', () => {
  const run = ready();
  assert.equal(nextQuestion(run), null);
  assert.deepEqual(deliveryStatus(run), {
    state: 'ready_for_local_delivery', basis: basisOf(run), productionReady: true,
    publicationAuthorized: false, blockers: [],
  });
});

test('delivery needs the selected art project and all production artifacts, beyond passing gate labels', async t => {
  for (const missingKind of ['compiled-map', 'technical-report']) {
    await t.test(`missing ${missingKind} blocks fully reviewed delivery`, () => {
      const run = ready({ artifacts: productionArtifacts().filter(item => item.kind !== missingKind) });
      const basis = basisOf(run);
      assert.equal(run.technical.basis, basis);
      assert.equal(run.play.basis, basis);
      assert.equal(run.artistic.basis, basis);
      assert.equal(deliveryStatus(run).productionReady, false);
      assert(deliveryStatus(run).blockers.length > 0);
    });
  }
  await t.test('missing render stays partial evidence and cannot obtain artistic approval', () => {
    const run = livePassed(technicallyPassed(creativelySelected(), productionArtifacts().filter(item => item.kind !== 'render')));
    assert.equal(run.technical.basis, basisOf(run));
    assert.equal(run.play.basis, basisOf(run));
    assert.equal(deliveryStatus(run).productionReady, false);
    assertRejectedWithoutMutation(run, value => recordArtistic(value, {
      basis: basisOf(value), userEvidence: clone(userEvidence),
    }));
  });
  for (const missingField of ['projectPath', 'projectHash']) {
    await t.test(`an incomplete art-project reference without ${missingField} is rejected`, () => {
      const options = artOptions();
      delete options.find(item => item.id === 'ink')[missingField];
      assert.throws(() => creativelySelected(options));
    });
  }
  await t.test('a selected visual proposal without an implemented art project cannot be delivered', () => {
    const options = artOptions();
    const selectedArt = options.find(item => item.id === 'ink');
    delete selectedArt.projectPath;
    delete selectedArt.projectHash;
    const run = ready({ options });
    assert.equal(run.technical.basis, basisOf(run));
    assert.equal(run.play.basis, basisOf(run));
    assert.equal(run.artistic.basis, basisOf(run));
    assert.equal(deliveryStatus(run).productionReady, false);
  });
  for (const value of [undefined, hash('different-art-project')]) {
    await t.test(`${value === undefined ? 'missing' : 'mismatched'} compiled sourceProjectHash blocks delivery`, () => {
      const artifacts = productionArtifacts();
      const compiled = artifacts.find(item => item.kind === 'compiled-map');
      if (value === undefined) delete compiled.sourceProjectHash;
      else compiled.sourceProjectHash = value;
      const run = ready({ artifacts });
      assert.equal(run.technical.basis, basisOf(run));
      assert.equal(run.play.basis, basisOf(run));
      assert.equal(run.artistic.basis, basisOf(run));
      assert.equal(deliveryStatus(run).productionReady, false);
    });
  }
});

test('stale technical, live-play, or artistic evidence never counts toward current delivery', () => {
  for (const key of ['technical', 'play', 'artistic']) {
    const run = ready();
    run[key].basis = hash(`stale-${key}`);
    try {
      assert.equal(deliveryStatus(run).productionReady, false, key);
    } catch (error) {
      // Rejecting malformed persisted evidence entirely also fails closed.
      if (error instanceof assert.AssertionError) throw error;
    }
  }
});

test('delivery status cannot report ready for malformed persisted gate evidence', async t => {
  const cases = [
    ['unsupported schema', run => { run.schemaVersion = 999; }],
    ['invalid render hash', run => { run.artifacts[0].sha256 = 'invalid'; }],
    ['Node smoke passed as browser play', run => { run.play.evidence = [artifact('node-smoke')]; }],
    ['agent artistic approval', run => { run.artistic.userEvidence.actor = 'agent'; }],
  ];
  for (const [name, mutate] of cases) {
    await t.test(name, () => {
      const run = ready();
      mutate(run);
      try {
        assert.equal(deliveryStatus(run).productionReady, false, name);
      } catch (error) {
        if (error instanceof assert.AssertionError) throw error;
      }
    });
  }
});

test('new compilation clears browser and artistic approvals while retaining the creative choices', () => {
  const run = ready();
  const before = clone(run);
  const compiled = technicallyPassed(run);
  assert.equal(compiled.play, null);
  assert.equal(compiled.artistic, null);
  assert.deepEqual(compiled.decisions, run.decisions);
  assert.equal(deliveryStatus(compiled).productionReady, false);
  assert.deepEqual(run, before);
});

test('delayed browser and artistic callbacks cannot approve a changed compilation', async t => {
  const old = ready();
  const compiled = recordTechnical(old, {
    basis: basisOf(old),
    checks: passingChecks(),
    artifacts: [artifact('render', 'changed-render'), artifact('compiled-map', 'changed-map')],
  });
  await t.test('old live-play evidence is stale after recompilation', () => {
    assertRejectedWithoutMutation(compiled, run => recordPlay(run, {
      basis: old.play.basis,
      status: old.play.status,
      evidence: clone(old.play.evidence),
      limitations: clone(old.play.limitations),
    }));
  });
  await t.test('old artistic approval is stale after recompilation', () => {
    assertRejectedWithoutMutation(compiled, run => recordArtistic(run, {
      basis: old.artistic.basis,
      userEvidence: clone(old.artistic.userEvidence),
    }));
  });
});

test('new play evidence clears artistic approval and requires another explicit review', () => {
  const run = ready();
  const replayed = livePassed(run);
  assert.equal(replayed.artistic, null);
  assert.equal(deliveryStatus(replayed).productionReady, false);
  assert.equal(deliveryStatus(replayed).state, 'awaiting_artistic_approval');
});

test('changing the chosen layout invalidates dependent art options, checks, play, approvals, and artifacts', () => {
  const run = ready();
  const before = clone(run);
  const oldArt = decision(run, 'stage18.art-direction');
  const changed = decide(run, {
    decisionId: 'stage18.layout', decisionRevision: 1, optionId: 'C', userEvidence: clone(userEvidence),
  });
  assert.equal(decision(changed, 'stage18.layout').selection.optionId, 'C');
  const art = decision(changed, 'stage18.art-direction');
  assert.equal(art.revision, oldArt.revision + 1);
  assert.equal(art.selection, null);
  assert.deepEqual(art.options, []);
  assert.equal(changed.technical, null);
  assert.equal(changed.play, null);
  assert.equal(changed.artistic, null);
  assert.deepEqual(changed.artifacts, []);
  assert.deepEqual(new Set(changed.invalidations.map(item => item.kind)), new Set(['technical', 'play', 'artistic']));
  assert.notEqual(basisOf(changed), basisOf(run));
  assert.equal(deliveryStatus(changed).productionReady, false);
  assert.equal(nextQuestion(changed).kind, 'agent-work-required');
  assert.deepEqual(run, before);
  assertRejectedWithoutMutation(changed, value => decide(value, {
    decisionId: oldArt.id, decisionRevision: oldArt.revision, optionId: 'ink', userEvidence: clone(userEvidence),
  }));
  assertRejectedWithoutMutation(changed, value => recordTechnical(value, {
    basis: basisOf(run), checks: passingChecks(), artifacts: [artifact('render')],
  }));
});

test('replacing a selected art proposal invalidates approvals while preserving the approved layout', () => {
  const run = ready();
  const revised = replaceOptions(run, {
    decisionId: 'stage18.art-direction', question: 'Review changed visual evidence.', options: artOptions(),
  });
  assert.deepEqual(decision(revised, 'stage18.layout'), decision(run, 'stage18.layout'));
  assert.equal(decision(revised, 'stage18.art-direction').selection, null);
  assert.equal(revised.technical, null);
  assert.equal(revised.play, null);
  assert.equal(revised.artistic, null);
  assert.deepEqual(revised.artifacts, []);
  assert.equal(nextQuestion(revised).kind, 'human-choice');
  assert.equal(nextQuestion(revised).decisionId, 'stage18.art-direction');
});

test('stored schema rejects incompatible versions, invalid revisions, dependency cycles, and forged selections', () => {
  const mutations = [
    run => { run.schemaVersion = 2; },
    run => { run.revision = -1; },
    run => { run.revision = 0.5; },
    run => { run.decisions = []; },
    run => { run.decisions[1].id = run.decisions[0].id; },
    run => { run.decisions[0].dependsOn = [run.decisions[1].id]; },
    run => { run.decisions[1].dependsOn = ['missing']; },
    run => { run.decisions[1].dependsOn = [run.decisions[1].id]; },
    run => { run.decisions[0].revision = 0; },
    run => { run.decisions[0].selection = { optionId: 'unknown', decisionRevision: 1, userEvidence }; },
    run => { run.decisions[0].selection = { optionId: 'A', decisionRevision: 2, userEvidence }; },
    run => { run.decisions[0].selection = { optionId: 'A', decisionRevision: 1, userEvidence: { ...userEvidence, actor: 'agent' } }; },
    run => { run.artifacts = null; },
    run => { run.history = {}; },
    run => { run.invalidations = null; },
  ];
  for (const mutate of mutations) {
    const run = initial();
    mutate(run);
    assert.throws(() => validateRun(run));
  }
});

test('persisted validation enforces the same intent, source, evidence, and dependency invariants as mutations', async t => {
  const mutations = [
    ['unsafe identity', run => { run.id = '../outside'; }],
    ['missing source', run => { delete run.source; }],
    ['invalid source hash', run => { run.source.projectHash = 'corrupt'; }],
    ['unbounded assumption', run => { delete run.intent.assumptions[0].expiresAtGate; }],
    ['malformed constraints', run => { run.intent.constraints = null; }],
    ['invalid technical status', run => { run.technical.checks[0].status = 'auto-approved'; }],
    ['duplicate technical checks', run => { run.technical.checks.push(clone(run.technical.checks[0])); }],
    ['unhashed render', run => { run.artifacts[0].sha256 = 'corrupt'; }],
    ['smoke evidence promoted to live play', run => { run.play.evidence = [artifact('node-smoke')]; }],
    ['downstream choice without upstream selection', run => { run.decisions[0].selection = null; }],
  ];
  for (const [name, mutate] of mutations) {
    await t.test(name, () => {
      const run = ready();
      mutate(run);
      assert.throws(() => validateRun(run), name);
    });
  }
});

test('a saved and reloaded run resumes the exact pending question, revisions, and evidence', async () => {
  await withStore(async dir => {
    let run = initial();
    await saveRun(dir, run, { expectedRevision: null });
    assert.deepEqual(await readRun(dir), run);
    assert.deepEqual(nextQuestion(await readRun(dir)), nextQuestion(run));
    let priorRevision = run.revision;
    run = decide(run, {
      decisionId: 'stage18.layout', decisionRevision: 1, optionId: 'B', userEvidence: clone(userEvidence),
    });
    await saveRun(dir, run, { expectedRevision: priorRevision });
    const restored = await readRun(dir);
    assert.deepEqual(restored, run);
    assert.deepEqual(nextQuestion(restored), nextQuestion(run));
    assert.equal(decision(restored, 'stage18.layout').selection.optionId, 'B');
    priorRevision = restored.revision;
    const options = replaceOptions(restored, { decisionId: 'stage18.art-direction', question: 'Choose a treatment.', options: artOptions() });
    await saveRun(dir, options, { expectedRevision: priorRevision });
    assert.deepEqual(nextQuestion(await readRun(dir)), nextQuestion(options));
  });
});

test('a ready run survives JSON persistence without changing gate status or granting publication', async () => {
  await withStore(async dir => {
    const run = ready();
    await saveRun(dir, run, { expectedRevision: null });
    const restored = await readRun(dir);
    assert.deepEqual(restored, run);
    assert.deepEqual(deliveryStatus(restored), deliveryStatus(run));
    assert.equal(deliveryStatus(restored).publicationAuthorized, false);
  });
});

test('compare-and-swap rejects stale, wrong-identity, and rollback writes without corrupting the saved run', async () => {
  await withStore(async dir => {
    const run = initial();
    await saveRun(dir, run, { expectedRevision: null });
    const chosen = selected();
    await saveRun(dir, chosen, { expectedRevision: run.revision });
    const before = await readFile(path.join(dir, 'run.json'), 'utf8');
    await assert.rejects(saveRun(dir, selected('B'), { expectedRevision: run.revision }));
    await assert.rejects(saveRun(dir, selected('B'), { expectedRevision: null }));
    await assert.rejects(saveRun(dir, initial(), { expectedRevision: chosen.revision }));
    await assert.rejects(saveRun(dir, { ...clone(chosen), id: 'another-run' }, { expectedRevision: chosen.revision }));
    assert.equal(await readFile(path.join(dir, 'run.json'), 'utf8'), before);
    assert.deepEqual((await readdir(dir)).sort(), ['run.json']);
    // A failed writer must release its lock so a subsequent authorized revision can save.
    const proposed = replaceOptions(chosen, { decisionId: 'stage18.art-direction', question: 'Select art.', options: artOptions() });
    await saveRun(dir, proposed, { expectedRevision: chosen.revision });
    assert.deepEqual(await readRun(dir), proposed);
  });
});

test('an initial store requires null expectedRevision and does not leak locks on a rejected write', async () => {
  await withStore(async dir => {
    await assert.rejects(saveRun(dir, initial(), { expectedRevision: 0 }));
    assert.deepEqual(await readdir(dir), []);
    await saveRun(dir, initial(), { expectedRevision: null });
    assert.equal((await readRun(dir)).revision, 0);
  });
});

test('same-revision saves are idempotent only and cannot overwrite changed content', async () => {
  await withStore(async dir => {
    const run = initial();
    await saveRun(dir, run, { expectedRevision: null });
    await saveRun(dir, clone(run), { expectedRevision: run.revision });
    const bytes = await readFile(path.join(dir, 'run.json'), 'utf8');
    const changed = clone(run);
    changed.intent.goal = 'Unversioned content change must not defeat compare-and-swap.';
    await assert.rejects(saveRun(dir, changed, { expectedRevision: run.revision }));
    assert.equal(await readFile(path.join(dir, 'run.json'), 'utf8'), bytes);
    assert.deepEqual((await readdir(dir)).sort(), ['run.json']);
  });
});

test('malformed or incompatible persisted state fails closed and is never overwritten', async () => {
  await withStore(async dir => {
    for (const bytes of ['{"schemaVersion":', JSON.stringify({ ...initial(), schemaVersion: 999 })]) {
      await writeFile(path.join(dir, 'run.json'), bytes);
      await assert.rejects(readRun(dir));
      await assert.rejects(saveRun(dir, initial(), { expectedRevision: null }));
      assert.equal(await readFile(path.join(dir, 'run.json'), 'utf8'), bytes);
      assert.deepEqual((await readdir(dir)).sort(), ['run.json']);
    }
  });
});

test('an existing writer lock blocks writes without deleting the other writer lock', async () => {
  await withStore(async dir => {
    await saveRun(dir, initial(), { expectedRevision: null });
    const marker = 'other-writer';
    await writeFile(path.join(dir, '.run.lock'), marker);
    await assert.rejects(saveRun(dir, selected(), { expectedRevision: 0 }), /lock/i);
    assert.equal(await readFile(path.join(dir, '.run.lock'), 'utf8'), marker);
    assert.equal((await readRun(dir)).revision, 0);
  });
});

test('simultaneous in-process writers permit exactly one update and preserve a complete run', async () => {
  await withStore(async dir => {
    await saveRun(dir, initial(), { expectedRevision: null });
    const outcomes = await Promise.allSettled([
      saveRun(dir, selected('A'), { expectedRevision: 0 }),
      saveRun(dir, selected('B'), { expectedRevision: 0 }),
      saveRun(dir, selected('C'), { expectedRevision: 0 }),
    ]);
    assert.equal(outcomes.filter(item => item.status === 'fulfilled').length, 1);
    assert.equal(outcomes.filter(item => item.status === 'rejected').length, 2);
    const winner = outcomes.find(item => item.status === 'fulfilled').value;
    assert.deepEqual(await readRun(dir), winner);
    assert.deepEqual((await readdir(dir)).sort(), ['run.json']);
  });
});

test('readers see only complete snapshots while sequential revisions are atomically replaced', async () => {
  await withStore(async dir => {
    let run = initial();
    await saveRun(dir, run, { expectedRevision: null });
    let writing = true;
    let reads = 0;
    const reader = (async () => {
      let previousRevision = 0;
      do {
        const restored = await readRun(dir);
        assert(restored.revision >= previousRevision, 'A reader observed revision rollback.');
        previousRevision = restored.revision;
        assert.equal(restored.history.length, restored.revision);
        assert.equal(deliveryStatus(restored).productionReady, false);
        reads++;
      } while (writing);
    })();
    try {
      for (let index = 0; index < 8; index++) {
        const previousRevision = run.revision;
        run = replaceOptions(run, {
          decisionId: 'stage18.layout', question: `Review iteration ${index + 1}.`, options: fixture().candidates,
        });
        await saveRun(dir, run, { expectedRevision: previousRevision });
      }
    } finally {
      writing = false;
      await reader;
    }
    assert(reads > 0);
    assert.deepEqual(await readRun(dir), run);
    assert.deepEqual((await readdir(dir)).sort(), ['run.json']);
  });
});

function independentWriter(dir, run) {
  const moduleURL = new URL('../tools/intent-pipeline/state.mjs', import.meta.url).href;
  const source = `
    import { saveRun } from ${JSON.stringify(moduleURL)};
    process.send({ type: 'ready' });
    process.once('message', async ({ dir, run }) => {
      try {
        await saveRun(dir, run, { expectedRevision: 0 });
        process.send({ type: 'result', ok: true });
      } catch (error) {
        process.send({ type: 'result', ok: false, message: error.message });
      } finally { process.disconnect(); }
    });
  `;
  const child = spawn(process.execPath, ['--input-type=module', '-e', source], {
    cwd: path.dirname(fileURLToPath(import.meta.url)), stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
  });
  let stderr = '';
  child.stderr.on('data', chunk => { stderr += chunk; });
  let result;
  const ready = new Promise((resolve, reject) => {
    child.on('message', message => { if (message.type === 'ready') resolve(); });
    child.once('error', reject);
    child.once('exit', code => { if (code !== 0) reject(new Error(`Writer exited ${code}: ${stderr}`)); });
  });
  const completed = new Promise((resolve, reject) => {
    child.on('message', message => { if (message.type === 'result') result = message; });
    child.once('error', reject);
    child.once('exit', code => {
      if (code !== 0 || !result) reject(new Error(`Writer exited ${code} without result: ${stderr}`));
      else resolve(result);
    });
  });
  return { ready, completed, start: () => child.send({ dir, run }), stop: () => child.kill() };
}

test('independent processes racing on one revision cannot both commit', { timeout: 15000 }, async () => {
  await withStore(async dir => {
    await saveRun(dir, initial(), { expectedRevision: null });
    const writers = [independentWriter(dir, selected('A')), independentWriter(dir, selected('B'))];
    try {
      await Promise.all(writers.map(writer => writer.ready));
      writers.forEach(writer => writer.start());
      const outcomes = await Promise.all(writers.map(writer => writer.completed));
      assert.equal(outcomes.filter(item => item.ok).length, 1);
      assert.equal(outcomes.filter(item => !item.ok).length, 1);
      const persisted = await readRun(dir);
      assert.equal(persisted.revision, 1);
      assert.equal(persisted.history.length, 1);
      assert(['A', 'B'].includes(decision(persisted, 'stage18.layout').selection.optionId));
      assert.equal(deliveryStatus(persisted).productionReady, false);
      assert.deepEqual((await readdir(dir)).sort(), ['run.json']);
    } finally {
      writers.forEach(writer => writer.stop());
    }
  });
});
