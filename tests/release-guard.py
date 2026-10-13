"""Deterministic stdlib tests; no network, Git writes, or remote tool calls."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import subprocess
import sys
import unittest

spec = importlib.util.spec_from_file_location('guard', Path(__file__).resolve().parents[1] / 'tools/release/guard.py')
g = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g)


class GuardTests(unittest.TestCase):
    def setUp(self):
        self.s = {'version': 1, 'owner': None, 'operations': {}, 'events': [], 'receipts': []}
        self.call('acquire')

    def call(self, command, data=None, at=0, owner='writer'):
        return g.act(self.s, command, data or {}, owner, at)

    def plan(self, kind='blob', lane='production', target='blob-a', sha='a', **extra):
        return self.call('plan', {'repository': 'sys8994/honro', 'kind': kind, 'lane': lane,
            'target': target, 'expected': {'sha': sha * 40}, **extra})['id']

    def start(self, key, command='begin', at=1):
        return self.call(command, {'id': key, 'request_id': key, 'authorization': 'user-message-123', 'timeout_seconds': 10}, at)

    def evidence(self, key):
        op = self.s['operations'][key]
        return {'read_only': True, 'source': 'https://api.github.com/repos/sys8994/honro/git/blobs/' + 'a'*40,
                'checked_at': '2026-10-13T23:00:00Z', 'repository': op['repository'], 'kind': op['kind'],
                'target': op['target'], 'observed': op['expected']}

    def test_stale_pending_is_not_io_and_never_approves(self):
        key = self.plan()
        self.start(key, 'pending')
        self.call('tick', at=20)
        self.assertEqual(self.s['operations'][key]['status'], 'approval_pending')
        self.assertTrue(g.report(self.s, 20)['operations'][0]['overdue'])
        with self.assertRaises(ValueError):
            self.call('begin', {'id': key, 'request_id': key, 'timeout_seconds': 10})

    def test_uncertain_no_resubmit_and_exact_remote_resume(self):
        key = self.plan()
        self.start(key)
        self.call('tick', at=20)
        self.assertEqual(self.s['operations'][key]['status'], 'uncertain_write')
        with self.assertRaises(ValueError):
            self.start(key)
        bad = self.evidence(key)
        bad['observed'] = {'sha': 'b'*40}
        with self.assertRaises(ValueError):
            self.call('reconcile', {'id': key, 'evidence': bad})
        self.call('reconcile', {'id': key, 'evidence': self.evidence(key)}, at=21)
        self.assertEqual(self.s['operations'][key]['status'], 'succeeded')
        self.assertEqual(self.plan(), key)
        with self.assertRaises(ValueError):
            self.start(key)

    def test_denied_no_retry_or_reopen(self):
        key = self.plan()
        self.start(key, 'pending')
        self.call('deny', {'id': key, 'evidence': 'explicit reviewer denial'})
        with self.assertRaises(ValueError):
            self.call('end_no_effect', {'id': key, 'evidence': self.no_effect(key)}, at=32)
        for command in ['pending', 'begin']:
            with self.assertRaises(ValueError):
                self.start(key, command)
        with self.assertRaises(ValueError):
            self.call('reconcile', {'id': key, 'evidence': self.evidence(key)})

    def test_objects_deduplicated_across_units_and_lanes(self):
        a = self.plan(lane='backfill')
        b = self.plan(target='other-file', lane='production')
        self.assertEqual(a, b)
        self.assertEqual(len(self.s['operations']), 1)
        self.assertEqual(self.s['operations'][a]['lane'], 'production')

    def test_pending_backfill_does_not_block_production(self):
        backfill = self.plan('ref', 'backfill', 'heads/preserve/source')
        self.start(backfill, 'pending')
        production = self.plan('ref', 'production', 'heads/master', 'b')
        self.start(production)
        self.assertEqual(self.s['operations'][production]['status'], 'io_running')
        self.call('reconcile', {'id': production, 'evidence': self.evidence(production)})
        self.assertEqual(g.report(self.s)['production_blockers'], [])

    def test_same_target_uncertain_blocks_new_identity(self):
        first = self.plan('ref', target='heads/master')
        self.start(first)
        self.call('tick', at=20)
        second = self.plan('ref', target='heads/master', sha='b')
        with self.assertRaises(ValueError):
            self.start(second)

    def test_three_independent_blobs_but_no_fourth_uncertain(self):
        keys = [self.plan(target='blob-' + c, sha=c) for c in 'abcd']
        for key in keys[:3]:
            self.start(key)
        self.call('tick', at=20)
        with self.assertRaises(ValueError):
            self.start(keys[3])

    def test_single_owner_recovery_does_not_unlock_unknown_io(self):
        key = self.plan()
        self.start(key)
        with self.assertRaises(ValueError):
            self.call('acquire', owner='new')
        with self.assertRaises(ValueError):
            self.call('recover', {'previous_owner': 'writer'}, owner='new')
        self.call('recover', {'previous_owner': 'writer', 'coordinator_stopped': True, 'evidence': 'old process exit verified'}, owner='new', at=20)
        self.assertEqual(self.s['operations'][key]['status'], 'uncertain_write')
        with self.assertRaises(ValueError):
            self.call('release', owner='new')
        with self.assertRaises(ValueError):
            self.start(key)

    def test_backfill_waits_for_production_and_dependencies(self):
        prod = self.plan()
        backfill = self.plan(sha='b', lane='backfill')
        with self.assertRaises(ValueError):
            self.start(backfill)
        dependent = self.plan('tree', target='tree', sha='c', dependencies=[prod])
        with self.assertRaises(ValueError):
            self.start(dependent)

    def no_effect(self, key):
        op = self.s['operations'][key]
        return {'request_id': key, 'tool_ended': True, 'tool_source': 'provider-final-response.json',
            'outcome': 'expired', 'approval_resolution': 'expired', 'ended_at': 30,
            'remote': {'read_only': True, 'absent': True, 'source': 'remote-read.json', 'checked_at': 31,
                'repository': op['repository'], 'kind': op['kind'], 'target': op['target'], 'expected': op['expected']}}

    def test_confirmed_ended_absent_allows_explicit_new_attempt(self):
        key = self.plan()
        self.start(key, 'pending')
        self.call('end_no_effect', {'id': key, 'evidence': self.no_effect(key)}, at=32)
        with self.assertRaises(ValueError):
            self.start(key)
        with self.assertRaises(ValueError):
            self.call('retry', {'id': key})
        self.call('retry', {'id': key, 'authorization': 'renewed-user-approval'}, at=33)
        with self.assertRaises(ValueError):
            self.start(key)
        self.call('begin', {'id': key, 'request_id': 'new-request', 'authorization': 'renewed-user-approval', 'timeout_seconds': 10}, at=34)
        self.assertEqual(self.s['operations'][key]['status'], 'io_running')
        self.assertEqual(len(self.s['operations']), 1)

    def test_pending_or_timedout_absence_never_proves_old_call_ended(self):
        for pending in [True, False]:
            with self.subTest(pending=pending):
                self.setUp()
                key = self.plan()
                self.start(key, 'pending' if pending else 'begin')
                self.call('tick', at=20)
                for field, value in [('tool_ended', False), ('approval_resolution', 'pending'), ('outcome', 'timeout')]:
                    evidence = self.no_effect(key)
                    evidence[field] = value
                    with self.assertRaises(ValueError):
                        self.call('end_no_effect', {'id': key, 'evidence': evidence}, at=32)
                evidence = self.no_effect(key)
                evidence['remote']['checked_at'] = 29
                with self.assertRaises(ValueError):
                    self.call('end_no_effect', {'id': key, 'evidence': evidence}, at=32)
                with self.assertRaises(ValueError):
                    self.call('retry', {'id': key, 'authorization': 'permission'}, at=33)

    def test_submitted_request_can_enter_approval_wait_without_resubmit(self):
        key = self.plan()
        self.start(key)
        self.call('await_approval', {'id': key, 'request_id': key, 'evidence': 'platform says approval pending'}, at=2)
        self.assertEqual(self.s['operations'][key]['status'], 'approval_pending')

    def test_atomic_persistence_rollback_resume(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'journal.json'
            with g.transaction(path) as state:
                state.update(copy.deepcopy(self.s))
                key = g.act(state, 'plan', {'kind': 'blob', 'lane': 'production', 'repository': 'sys8994/honro', 'target': 'blob', 'expected': {'sha': 'a'*40}}, 'writer', 0)['id']
            with self.assertRaises(ValueError):
                with g.transaction(path) as state:
                    state['owner'] = 'wrong'
                    raise ValueError('interruption')
            with g.transaction(path) as state:
                self.assertEqual(state['owner'], 'writer')
                self.assertIn(key, state['operations'])

    def test_os_lock_excludes_concurrent_journal_mutation(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'journal.json'
            code = "import fcntl,sys; f=open(sys.argv[1], 'a'); fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)"
            with g.transaction(path):
                result = subprocess.run([sys.executable, '-c', code, str(path) + '.lock'], capture_output=True)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn(b'BlockingIOError', result.stderr)
            result = subprocess.run([sys.executable, '-c', code, str(path) + '.lock'], capture_output=True)
            self.assertEqual(result.returncode, 0)

    def test_phase_duration_report(self):
        key = self.plan()
        self.start(key, 'pending', at=2)
        self.start(key, at=7)
        self.call('tick', at=20)
        durations = g.report(self.s, 25)['operations'][0]['elapsed_seconds']
        self.assertEqual(durations, {'planned': 2, 'approval_pending': 5, 'io_running': 13, 'uncertain_write': 5})

    def test_receipt_requires_exact_pages_sha_and_four_hashes(self):
        sha = 'a'*40
        manifest = {'master': sha, 'files': {'HONRO.html': 'b'*64, 'HONRO_WORKSHOP.html': 'c'*64}}
        receipt = {'master': sha, 'master_verified': True, 'pages_head_sha': sha, 'pages_status': 'completed',
            'pages_conclusion': 'success', 'pages_run': 42, 'pages_url': 'https://github.com/sys8994/honro/actions/runs/42',
            'public_qa': 'pending', 'public_bytes': []}
        for file, value in manifest['files'].items():
            for query in ['', '?release=' + sha]:
                receipt['public_bytes'].append({'url': 'https://sys8994.github.io/honro/' + file + query,
                    'status': 200, 'sha256': value, 'checked_at': '2026-10-13T23:00:00Z'})
        self.assertEqual(g.validate_receipt(receipt, manifest)['browser_qa'], 'pending')
        for field, value in [('pages_head_sha', 'd'*40), ('pages_conclusion', 'failure')]:
            bad = copy.deepcopy(receipt)
            bad[field] = value
            with self.assertRaises(ValueError):
                g.validate_receipt(bad, manifest)
        bad = copy.deepcopy(receipt)
        bad['public_bytes'][0]['sha256'] = 'd'*64
        bad['public_bytes'][0]['matches'] = True
        with self.assertRaises(ValueError):
            g.validate_receipt(bad, manifest)
        bad = copy.deepcopy(receipt)
        bad['public_bytes'][0] = bad['public_bytes'][1]
        with self.assertRaises(ValueError):
            g.validate_receipt(bad, manifest)


if __name__ == '__main__':
    unittest.main()
